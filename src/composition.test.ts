import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lireConfiguration, type Environnement } from './configuration.js'
import {
  composer,
  ErreurDemarrageProduction,
  manquesDuCanalDeNotification,
  verifierPorteDeProduction,
} from './composition.js'
import { documentCatalogue, familleEssai } from './contextes/catalogue/essai.js'
import { DELAI_HUMAIN_MS, horlogePilotee } from './contextes/demandes/essai.js'
import { creerHorlogeFixe } from './contextes/garage/adaptateurs/horloge/horloge-fixe.js'
import type { Horloge } from './contextes/garage/application/ports.js'
import { donneesEssai } from './contextes/garage/essais/donnees-essai.js'
import {
  SCRIPT_ETAPE,
  SCRIPT_IMPRESSION,
} from './contextes/pre-diagnostic/adaptateurs/web/vues/commun.js'
import { creerRacinePubliqueEssai } from './web/essai.js'

const RACINE_PROJET = resolve(import.meta.dirname, '..')
const DONNEES_DU_SITE = join(RACINE_PROJET, 'donnees')
/** Lundi 5 janvier 2026, 10 h à Paris : le garage est ouvert selon les horaires proposés. */
const LUNDI_10H = new Date('2026-01-05T09:00:00Z')
const BANDEAU_DEMONSTRATION = 'Version de démonstration'
/** Serveur d'envoi fictif : aucun message ne part pendant ces essais. */
const CANAL_DE_NOTIFICATION: Environnement = {
  SMTP_HOTE: 'smtp.exemple.invalid',
  SMTP_EXPEDITEUR: 'site@exemple.invalid',
  COURRIEL_GARAGE: 'garage@exemple.invalid',
}

const nettoyages: (() => Promise<unknown>)[] = []
afterEach(async () => {
  await Promise.all(nettoyages.splice(0).map((nettoyer) => nettoyer()))
})

/** Dossier jetable : données (copie des vraies, ou remplacées) et base SQLite propre. */
async function dossierEssai(
  remplacements: Readonly<Record<string, unknown>> = {},
): Promise<{ readonly donnees: string; readonly base: string }> {
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-composition-'))
  nettoyages.push(() => rm(dossier, { recursive: true, force: true }))
  const donnees = join(dossier, 'donnees')
  await cp(DONNEES_DU_SITE, donnees, { recursive: true })
  for (const [fichier, contenu] of Object.entries(remplacements)) {
    await writeFile(join(donnees, fichier), JSON.stringify(contenu))
  }
  return { donnees, base: join(dossier, 'site.sqlite') }
}

async function composerAvec(
  env: Environnement,
  remplacements: Readonly<Record<string, unknown>> = {},
  horloge: Horloge = creerHorlogeFixe(LUNDI_10H),
): Promise<FastifyInstance> {
  const { donnees, base } = await dossierEssai(remplacements)
  const racinePublique = await creerRacinePubliqueEssai()
  nettoyages.push(() => rm(racinePublique, { recursive: true, force: true }))
  // Scripts propres aux pages du pré-diagnostic, cités par ses étapes et ses fiches.
  for (const chemin of [SCRIPT_IMPRESSION, SCRIPT_ETAPE]) {
    const script = join(racinePublique, chemin)
    await mkdir(dirname(script), { recursive: true })
    await writeFile(script, '/* script d’essai */')
  }
  const configuration = lireConfiguration(
    {
      CHEMIN_PUBLIC: racinePublique,
      CHEMIN_DONNEES: donnees,
      BASE_SQLITE: base,
      NIVEAU_JOURNAL: 'silent',
      ...env,
    },
    RACINE_PROJET,
  )
  const app = await composer(configuration, { horloge })
  nettoyages.unshift(() => app.close())
  return app
}

/** Catalogue d'essai dont chaque donnée bloquante est validée par le garage. */
function catalogueValide(): Record<string, unknown> {
  return documentCatalogue({
    familles: [familleEssai('freinage'), familleEssai('batterie')],
    ce_que_nous_ne_faisons_pas: [
      { libelle: 'Carrosserie et peinture', statut: 'valide', source: 'garage' },
    ],
  })
}

describe('composition complète', () => {
  it('démonstration : les cinq contextes autour des vraies données, bandeau et statut calculé', async () => {
    const app = await composerAvec({ MODE_SITE: 'demonstration' })
    const adresses = [
      '/',
      '/pieces-et-reparations',
      '/tarifs',
      '/pre-diagnostic',
      '/demande?type=rendez-vous',
      '/acces-et-horaires',
      '/garagiste/connexion',
      '/mentions-legales',
      '/confidentialite',
    ]
    const statuts = await Promise.all(
      adresses.map(async (url) => [url, (await app.inject(url)).statusCode] as const),
    )
    expect(statuts).toEqual(adresses.map((url) => [url, 200]))
    const reponse = await app.inject('/')
    expect(reponse.headers['x-robots-tag']).toBe('noindex')
    const accueil = reponse.body
    expect(accueil).toContain(BANDEAU_DEMONSTRATION)
    expect(accueil).toContain('class="statut statut--ouvert"')
    expect(accueil).not.toContain('Horaires à confirmer')
    for (const zone of ['information', 'catalogue', 'pre-diagnostic', 'garage', 'rappel']) {
      expect(accueil).toContain(`accueil__zone--${zone}`)
    }
  })

  it('production avec les vraies données : refus qui nomme les manques de chaque partie', async () => {
    const refus = composerAvec({ MODE_SITE: 'production' })
    await expect(refus).rejects.toThrow(ErreurDemarrageProduction)
    const message = await refus.catch((erreur: unknown) => String(erreur))
    expect(message).toContain('Démarrage refusé en production')
    expect(message).toContain('- mediateur (médiateur de la consommation) à valider')
    expect(message).toContain('- Familles d’intervention à confirmer par le garage')
    expect(message).toContain(
      '- SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE : aucun envoi de courriel configuré',
    )
    expect(message).toContain('- COURRIEL_GARAGE : destinataire des notifications')
  })

  it('production complète mais pré-diagnostic non relu : le site démarre, /pre-diagnostic répond 404', async () => {
    const app = await composerAvec(
      { MODE_SITE: 'production', ...CANAL_DE_NOTIFICATION },
      { 'garage.json': await donneesEssai(), 'catalogue.json': catalogueValide() },
    )
    expect((await app.inject('/pre-diagnostic')).statusCode).toBe(404)
    const accueil = await app.inject('/')
    expect(accueil.statusCode).toBe(200)
    expect(accueil.body).not.toContain(BANDEAU_DEMONSTRATION)
    const principal = accueil.body.slice(accueil.body.indexOf('<main'))
    expect(principal).toContain('Un souci avec votre voiture\u00a0?')
    expect(principal).not.toContain('href="/pre-diagnostic"')
    expect(accueil.headers['x-robots-tag']).toBeUndefined()
  })
})

describe('composition : connecteurs courriel et SMS (Kano connecteurs)', () => {
  it('Gmail en deux variables suffit à ouvrir le canal en production, destinataire compris', async () => {
    const app = await composerAvec(
      {
        MODE_SITE: 'production',
        SMTP_UTILISATEUR: 'garage@gmail.com',
        SMTP_MOT_DE_PASSE: 'abcdefghijklmnop',
        IMAP_ACTIF: 'false',
      },
      { 'garage.json': await donneesEssai(), 'catalogue.json': catalogueValide() },
    )
    expect((await app.inject('/')).statusCode).toBe(200)
  })

  it('un envoi injoignable au démarrage ne bloque pas le site mais fait répondre /sante en 503 (US-C20)', async () => {
    const app = await composerAvec(
      { MODE_SITE: 'production', ...CANAL_DE_NOTIFICATION },
      { 'garage.json': await donneesEssai(), 'catalogue.json': catalogueValide() },
    )
    expect((await app.inject('/')).statusCode).toBe(200)
    await vi.waitFor(
      async () => {
        const sante = await app.inject('/sante')
        expect(sante.statusCode).toBe(503)
        expect(sante.json()).toMatchObject({ connecteursEnEchec: ['Envoi de courriel'] })
      },
      { timeout: 15_000 },
    )
  })

  it('SMS configuré avec son destinataire : le site démarre en production', async () => {
    const demarrage = composerAvec(
      {
        MODE_SITE: 'production',
        ...CANAL_DE_NOTIFICATION,
        SMS_FOURNISSEUR: 'console',
        SMS_DESTINATAIRE: '06 12 34 56 78',
      },
      { 'garage.json': await donneesEssai(), 'catalogue.json': catalogueValide() },
    )
    const app = await demarrage
    expect((await app.inject('/')).statusCode).toBe(200)
  })
})

describe('composition : typographie française de toutes les pages', () => {
  it('aucun « : », « ? » ou « ! » précédé d’une espace sécable, sur toutes les pages publiques', async () => {
    const app = await composerAvec({ MODE_SITE: 'relecture' })
    const adresses = [
      '/',
      '/pieces-et-reparations',
      '/pieces-et-reparations/freinage',
      '/tarifs',
      '/pre-diagnostic',
      '/pre-diagnostic?q1=voyant',
      '/pre-diagnostic/livret',
      '/demande?type=rendez-vous',
      '/demande?type=devis',
      '/demande?type=rappel',
      '/acces-et-horaires',
      '/vos-droits',
      '/mentions-legales',
      '/confidentialite',
      '/garagiste/connexion',
      '/page-absente',
    ]
    const fautes: string[] = []
    for (const adresse of adresses) {
      const texte = (await app.inject(adresse)).body
        .replace(/<(script|style|textarea|pre)\b[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<[^>]*>/g, '\n')
      for (const faute of texte.match(/.{0,30} [:?!]/g) ?? []) fautes.push(`${adresse} : ${faute}`)
    }
    expect(fautes).toEqual([])
  })
})

describe('composition : du pré-diagnostic à la demande de rappel (AT-1, US-18, US-22)', () => {
  const decoder = (adresse: string) => adresse.replaceAll('&amp;', '&')

  it('« Ne roulez pas » : la demande reprend le résumé, non modifiable, et la consigne de sécurité', async () => {
    const app = await composerAvec({ MODE_SITE: 'demonstration' })
    const question = (await app.inject('/pre-diagnostic?q1=voyant')).body
    const formulaire = question.slice(question.indexOf('<form'), question.indexOf('</form>'))
    const parametres = new URLSearchParams()
    for (const [, nom = '', valeur = ''] of formulaire.matchAll(
      /<input type="hidden" name="([^"]+)" value="([^"]*)">/g,
    )) {
      parametres.append(nom, valeur)
    }
    const signe = [...formulaire.matchAll(/type="checkbox" name="([^"]+)" value="([^"]+)"/g)].find(
      ([, , valeur]) => valeur !== 'aucun' && valeur !== 'ne-sais-pas',
    )
    if (signe === undefined) throw new Error('aucun signe de danger proposé')
    parametres.append(signe[1] ?? '', signe[2] ?? '')
    const arret = (await app.inject(`/pre-diagnostic?${parametres.toString()}`)).body
    expect(arret).toContain('Ne roulez pas.')
    const lien = /href="(\/demande\?type=rappel&amp;prediagnostic=[^"]+)"/.exec(arret)?.[1]
    if (lien === undefined) throw new Error('aucun lien « Être rappelé » vers la demande')

    const demande = (await app.inject(decoder(lien))).body
    expect(demande).toContain('Votre pré-diagnostic')
    expect(demande).toContain('Ne roulez pas')
    expect(demande).toContain('appelez votre assistance ou le 112.')
    const code = new URL(decoder(lien), 'http://localhost').searchParams.get('prediagnostic')
    expect(demande).toContain(`<input type="hidden" name="prediagnostic" value="${code ?? ''}">`)
    // Le résumé se lit, il ne se saisit pas : seules les coordonnées restent à remplir.
    expect(demande).not.toContain('id="demande-motif"')
    expect(demande.match(/\srequired[\s>]/g)).toHaveLength(3)
  })
})

/** Origine publique par défaut de la configuration (URL_PUBLIQUE absente). */
const ORIGINE_LOCALE = 'http://localhost:3000'
const champCache = (corps: string, nom: string): string =>
  new RegExp(`name="${nom}" value="([^"]*)"`).exec(corps)?.[1] ?? ''
const poster = (
  app: FastifyInstance,
  url: string,
  champs: Record<string, string>,
  session?: string,
) =>
  app.inject({
    method: 'POST',
    url,
    headers: { origin: ORIGINE_LOCALE, 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams(champs).toString(),
    ...(session === undefined ? {} : { cookies: { bf_session: session } }),
  })

/** Connexion comme au clic, en démonstration : le lien s'affiche dans la page. */
async function ouvrirSession(app: FastifyInstance): Promise<string> {
  const connexion = (await app.inject('/garagiste/connexion')).body
  const envoi = await poster(app, '/garagiste/connexion', {
    jeton_formulaire: champCache(connexion, 'jeton_formulaire'),
    retour: '/garagiste',
  })
  const lien = /href="(\/garagiste\/connexion\/lien\?jeton=[^"]+)"/.exec(envoi.body)?.[1] ?? ''
  const pageLien = (await app.inject(lien.replaceAll('&amp;', '&'))).body
  const ouverture = await poster(app, '/garagiste/connexion/lien', {
    jeton: champCache(pageLien, 'jeton'),
    jeton_formulaire: champCache(pageLien, 'jeton_formulaire'),
  })
  const cookie = ouverture.cookies.find((candidat) => candidat.name === 'bf_session')
  if (cookie === undefined) throw new Error('aucune session ouverte')
  return cookie.value
}

describe('composition : anti-falsification de l’espace garagiste, de bout en bout', () => {
  it('fermetures : le jeton de la vraie session est exigé, celui d’une autre session refusé', async () => {
    const app = await composerAvec({ MODE_SITE: 'demonstration' })
    const session = await ouvrirSession(app)
    const autre = await ouvrirSession(app)
    const jetonDe = async (cookie: string) =>
      champCache(
        (
          await app.inject({
            url: '/garagiste/fermetures/imprevu',
            cookies: { bf_session: cookie },
          })
        ).body,
        'jeton_formulaire',
      )
    const jeton = await jetonDe(session)
    expect(jeton).not.toBe('')
    expect((await poster(app, '/garagiste/fermetures/imprevu', {}, session)).statusCode).toBe(403)
    const autreJeton = { jeton_formulaire: await jetonDe(autre) }
    expect(
      (await poster(app, '/garagiste/fermetures/imprevu', autreJeton, session)).statusCode,
    ).toBe(403)
    expect((await app.inject('/')).body).not.toContain('Fermé exceptionnellement')
    const admis = await poster(
      app,
      '/garagiste/fermetures/imprevu',
      { jeton_formulaire: jeton },
      session,
    )
    expect(admis.statusCode).toBe(303)
    expect((await app.inject('/')).body).toContain('Fermé exceptionnellement')
  })
})

describe('composition : rappels promis et fermeture imprévue (demandes vers garage)', () => {
  it('« Fermer le garage aujourd’hui ? » nomme le client à qui un rappel est promis ce jour-là', async () => {
    const horloge = horlogePilotee(LUNDI_10H)
    const app = await composerAvec({ MODE_SITE: 'demonstration' }, {}, horloge)
    const session = await ouvrirSession(app)
    const imprevu = async () =>
      (await app.inject({ url: '/garagiste/fermetures/imprevu', cookies: { bf_session: session } }))
        .body
    expect(await imprevu()).not.toContain('garage-rappels-promis')

    // Lundi 10 h, joignable en fin de journée : le garage promet ce lundi, en fin de journée.
    const formulaire = (await app.inject('/demande?type=rappel')).body
    horloge.avancer(DELAI_HUMAIN_MS)
    const envoi = await app.inject({
      method: 'POST',
      url: '/demande',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({
        type: 'rappel',
        motif: 'souci',
        prenom: 'Sophie',
        telephone: '07 22 33 44 55',
        moment: 'fin-de-journee',
        jeton: champCache(formulaire, 'jeton'),
      }).toString(),
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = (await app.inject(String(envoi.headers.location))).body
    expect(confirmation).toContain('Nous vous rappelons aujourd’hui, en fin de journée.')

    const ecran = await imprevu()
    expect(ecran).toContain('1 client attend votre rappel aujourd’hui\u00a0: prévenez-le.')
    expect(ecran).toContain('<p><strong>Sophie</strong>, promis en fin de journée</p>')
    expect(ecran).toMatch(
      /<a class="bouton bouton--secondaire" href="tel:\+33722334455">Appeler le <span class="garage-numero">07\u00a022\u00a033\u00a044\u00a055<\/span><\/a> <a class="garage-rappels-promis__demande" href="\/garagiste\/demandes\/[0-9a-f-]{36}">Voir la demande<\/a>/,
    )
    // « Confirmer la fermeture » avant la liste des clients (J4, passe 2 du jury).
    expect(ecran.indexOf('Confirmer la fermeture</button>')).toBeLessThan(
      ecran.indexOf('garage-rappels-promis'),
    )
  })
})

describe('porte de démarrage en production', () => {
  const configuration = (env: Environnement) => lireConfiguration(env, RACINE_PROJET)

  it('le canal de notification manque tant que le serveur d’envoi ou le destinataire manque', () => {
    expect(manquesDuCanalDeNotification(configuration(CANAL_DE_NOTIFICATION))).toEqual([])
    expect(manquesDuCanalDeNotification(configuration({}))).toHaveLength(2)
    expect(
      manquesDuCanalDeNotification(
        configuration({ ...CANAL_DE_NOTIFICATION, COURRIEL_GARAGE: '' }),
      ),
    ).toEqual(['COURRIEL_GARAGE : destinataire des notifications de demande absent'])
  })

  it('agrège toutes les parties en un seul refus, et seulement en production', () => {
    const parties = [
      { partie: 'Garage', manques: ['mediateur à valider'] },
      { partie: 'Catalogue', manques: [] },
      { partie: 'Notification des demandes', manques: ['COURRIEL_GARAGE absent'] },
    ]
    expect(() => verifierPorteDeProduction('production', parties)).toThrow(
      'Démarrage refusé en production : données bloquantes à valider (Kano D8).\n' +
        'Garage :\n- mediateur à valider\n' +
        'Notification des demandes :\n- COURRIEL_GARAGE absent',
    )
    expect(() => verifierPorteDeProduction('demonstration', parties)).not.toThrow()
    expect(() => verifierPorteDeProduction('relecture', parties)).not.toThrow()
    expect(() =>
      verifierPorteDeProduction('production', [{ partie: 'Garage', manques: [] }]),
    ).not.toThrow()
  })
})
