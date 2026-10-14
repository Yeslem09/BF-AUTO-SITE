import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { LightMyRequestResponse } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CompterDemandesARappeler, ModeSite } from '../../contrats/index.js'
import { creerServeurEssai, URL_PUBLIQUE_ESSAI } from '../../web/essai.js'
import type { ModuleContexte } from '../../web/index.js'
import { executerCommande } from './adaptateurs/cli/commandes.js'
import type { ReglagesAcces } from './adaptateurs/configuration/reglages.js'
import { jetonDuLien } from './adaptateurs/essai/banc.js'
import {
  creerHorlogeReglable,
  creerMessagerieRetenue,
  type HorlogeReglable,
  type MessagerieRetenue,
} from './adaptateurs/essai/doublures.js'
import { assemblerAcces, type ContexteAcces } from './module.js'

/** Texte visible d'une page : sans balises ni attributs (une adresse encodée n'est pas un pourcentage affiché). */
const texteVisible = (page: string): string => page.replace(/<[^>]*>/g, '')

const DEBUT = new Date('2026-09-23T08:00:00Z')
const MINUTE = 60_000
const JOUR = 24 * 60 * MINUTE
const GARAGISTE = 'garagiste@exemple.fr'
const RESPONSABLE = 'anthony@exemple.fr'
const PIRATE = 'https://pirate.exemple'
const FICHIER_GARAGE = resolve(import.meta.dirname, '../../../donnees/garage.json')

const REGLAGES: ReglagesAcces = {
  urlPublique: URL_PUBLIQUE_ESSAI,
  courrielGaragiste: GARAGISTE,
  courrielResponsable: RESPONSABLE,
  expediteur: null,
}

interface Montage {
  readonly app: FastifyInstance
  readonly acces: ContexteAcces
  readonly messagerie: MessagerieRetenue
  readonly horloge: HorlogeReglable
  readonly cheminBase: string
}

let dossier: string | null = null
let ouverts: FastifyInstance[] = []

afterEach(async () => {
  await Promise.all(ouverts.map((app) => app.close()))
  ouverts = []
  if (dossier !== null) await rm(dossier, { recursive: true, force: true })
  dossier = null
})

interface OptionsMontage {
  readonly mode?: ModeSite
  readonly reglages?: Partial<ReglagesAcces>
  readonly cheminBase?: string
  /** Vrai : aucune messagerie retenue, les messages suivent le vrai choix des canaux. */
  readonly messageriesReelles?: boolean
  /** Modules d'autres contextes enregistrés avant l'accès, comme le fait la composition. */
  readonly autresModules?: readonly ModuleContexte[]
  /** Capacité des demandes : le compteur de l'accueil de l'espace. */
  readonly compterDemandesARappeler?: CompterDemandesARappeler
}

async function monter(options: OptionsMontage = {}): Promise<Montage> {
  dossier ??= await mkdtemp(join(tmpdir(), 'bf-auto-acces-module-'))
  const cheminBase = options.cheminBase ?? join(dossier, 'base.sqlite')
  const horloge = creerHorlogeReglable(DEBUT)
  const messagerie = creerMessagerieRetenue()
  const mode = options.mode ?? 'production'
  const acces = await assemblerAcces({
    mode,
    cheminBase,
    reglages: { ...REGLAGES, ...options.reglages },
    horloge,
    ...(options.messageriesReelles === true ? {} : { messagerie }),
    ...(options.compterDemandesARappeler === undefined
      ? {}
      : { compterDemandesARappeler: options.compterDemandesARappeler }),
  })
  const app = await creerServeurEssai([...(options.autresModules ?? []), acces.module], {
    verifierSessionGaragiste: acces.verifierSession,
    protectionFormulairesGaragiste: acces.protectionFormulairesGaragiste,
    mode,
  })
  ouverts.push(app)
  return { app, acces, messagerie, horloge, cheminBase }
}

function champCache(corps: string, nom: string): string {
  const valeur = new RegExp(`name="${nom}" value="([^"]*)"`).exec(corps)?.[1]
  if (valeur === undefined) throw new Error(`Champ caché ${nom} absent de la page`)
  return valeur
}

const jetonFormulaire = (corps: string): string => champCache(corps, 'jeton_formulaire')

/** Texte d'une page, espaces du gabarit réduits à un seul : on asserte la phrase, pas la mise en forme. */
const texteDe = (corps: string): string => corps.replace(/\s+/g, ' ')

interface Envoi {
  readonly session?: string
  /** `null` : aucune en-tête Origin. */
  readonly origine?: string | null
  readonly referent?: string
  readonly adresse?: string
}

function poster(
  app: FastifyInstance,
  url: string,
  champs: Record<string, string>,
  envoi: Envoi = {},
): Promise<LightMyRequestResponse> {
  const origine = envoi.origine === undefined ? URL_PUBLIQUE_ESSAI : envoi.origine
  return app.inject({
    method: 'POST',
    url,
    payload: new URLSearchParams(champs).toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(origine === null ? {} : { origin: origine }),
      ...(envoi.referent === undefined ? {} : { referer: envoi.referent }),
    },
    ...(envoi.session === undefined ? {} : { cookies: { bf_session: envoi.session } }),
    ...(envoi.adresse === undefined ? {} : { remoteAddress: envoi.adresse }),
  })
}

function lire(
  app: FastifyInstance,
  url: string,
  session?: string,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: 'GET',
    url,
    ...(session === undefined ? {} : { cookies: { bf_session: session } }),
  })
}

/** Demande un lien comme le ferait le bouton, et rend le jeton reçu dans le message. */
async function demanderLien(montage: Montage, retour = '/garagiste'): Promise<string> {
  const page = await lire(montage.app, `/garagiste/connexion?retour=${encodeURIComponent(retour)}`)
  const reponse = await poster(montage.app, '/garagiste/connexion', {
    jeton_formulaire: jetonFormulaire(page.body),
    retour: champCache(page.body, 'retour'),
  })
  expect(reponse.statusCode).toBe(200)
  const dernier = montage.messagerie.envoyes.at(-1)
  return jetonDuLien(dernier?.texte ?? '')
}

async function ouvrirLien(montage: Montage, jetonLien: string): Promise<LightMyRequestResponse> {
  const page = await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)
  return poster(montage.app, '/garagiste/connexion/lien', {
    jeton_formulaire: jetonFormulaire(page.body),
    jeton: jetonLien,
  })
}

function cookieSession(reponse: LightMyRequestResponse): string {
  const cookie = reponse.cookies.find((candidat) => candidat.name === 'bf_session')
  if (cookie === undefined) throw new Error('Aucun cookie de session posé')
  return cookie.value
}

async function seConnecter(montage: Montage): Promise<string> {
  return cookieSession(await ouvrirLien(montage, await demanderLien(montage)))
}

describe('US-33 : un accès protégé, sans mot de passe', () => {
  it('le lien part vers le seul canal configuré, quel que soit le contenu de la requête ; il ouvre une session une fois, puis est refusé', async () => {
    const montage = await monter()
    const page = await lire(montage.app, '/garagiste/connexion')
    const envoi = await poster(montage.app, '/garagiste/connexion', {
      jeton_formulaire: jetonFormulaire(page.body),
      courriel: 'pirate@exemple.fr',
      destinataire: 'pirate@exemple.fr',
    })
    expect(envoi.statusCode).toBe(200)
    expect(envoi.body).toContain('<h1>Lien envoyé</h1>')
    expect(montage.messagerie.envoyes.map((message) => message.destinataire)).toEqual([GARAGISTE])
    const jetonLien = jetonDuLien(montage.messagerie.envoyes[0]?.texte ?? '')
    expect(montage.messagerie.envoyes[0]?.texte).toContain(
      `${URL_PUBLIQUE_ESSAI}/garagiste/connexion/lien?jeton=${jetonLien}`,
    )
    expect(envoi.body).not.toContain(jetonLien)

    // Afficher la page du lien ne le consomme pas (aperçu d'une messagerie, double ouverture).
    expect(
      (await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)).statusCode,
    ).toBe(200)
    const ouverture = await ouvrirLien(montage, jetonLien)
    expect(ouverture.statusCode).toBe(303)
    expect(ouverture.headers.location).toBe('/garagiste')
    const espace = await lire(montage.app, '/garagiste', cookieSession(ouverture))
    expect(espace.statusCode).toBe(200)
    expect(espace.body).toContain('<h1>Votre espace</h1>')

    const affichageApres = await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)
    expect(affichageApres.statusCode).toBe(410)
    expect(affichageApres.body).toContain('Ce lien a déjà servi : demandez-en un nouveau.')
    const reutilise = await poster(montage.app, '/garagiste/connexion/lien', {
      jeton_formulaire: jetonFormulaire((await lire(montage.app, '/garagiste/connexion')).body),
      jeton: jetonLien,
    })
    expect(reutilise.statusCode).toBe(410)
    expect(reutilise.body).toContain('Ce lien a déjà servi : demandez-en un nouveau.')
    expect(reutilise.cookies).toEqual([])
  })

  it('après 15 minutes, le lien est refusé avec « Ce lien a expiré : demandez-en un nouveau »', async () => {
    const montage = await monter()
    const jetonLien = await demanderLien(montage)
    const page = await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)
    montage.horloge.avancer(15 * MINUTE)
    const affiche = await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)
    expect(affiche.statusCode).toBe(410)
    expect(affiche.body).toContain('Ce lien a expiré : demandez-en un nouveau.')
    expect(affiche.body).toContain('href="/garagiste/connexion">Recevoir un nouveau lien</a>')
    const tentative = await poster(montage.app, '/garagiste/connexion/lien', {
      jeton_formulaire: jetonFormulaire(page.body),
      jeton: jetonLien,
    })
    expect(tentative.statusCode).toBe(410)
    expect(tentative.body).toContain('Ce lien a expiré : demandez-en un nouveau.')
    expect(tentative.cookies).toEqual([])
  })

  it('répond de la même façon, quelle que soit l’adresse saisie : aucun compte ne se devine', async () => {
    const montage = await monter()
    const page = await lire(montage.app, '/garagiste/connexion')
    const jeton = jetonFormulaire(page.body)
    const connue = await poster(montage.app, '/garagiste/connexion', {
      jeton_formulaire: jeton,
      courriel: GARAGISTE,
    })
    const inconnue = await poster(montage.app, '/garagiste/connexion', {
      jeton_formulaire: jeton,
      courriel: 'inconnu@exemple.fr',
    })
    expect(inconnue.statusCode).toBe(connue.statusCode)
    expect(inconnue.body).toBe(connue.body)
    expect(montage.messagerie.envoyes.map((message) => message.destinataire)).toEqual([
      GARAGISTE,
      GARAGISTE,
    ])
  })

  it('/garagiste sans session mène à la connexion, qui propose « Recevoir un lien de connexion » avec X-Robots-Tag: noindex', async () => {
    const { app } = await monter()
    const redirection = await lire(app, '/garagiste')
    expect(redirection.statusCode).toBe(303)
    expect(redirection.headers.location).toBe('/garagiste/connexion?retour=%2Fgaragiste')
    expect(redirection.headers['x-robots-tag']).toBe('noindex')
    const connexion = await lire(app, redirection.headers.location ?? '')
    expect(connexion.statusCode).toBe(200)
    expect(connexion.headers['x-robots-tag']).toBe('noindex')
    expect(connexion.headers['cache-control']).toBe('no-store')
    expect(connexion.body).toContain('<meta name="robots" content="noindex">')
    expect(connexion.body).toContain('<h1>Espace garagiste</h1>')
    expect(connexion.body).toMatch(
      /<button class="bouton bouton--principal acces-action" type="submit">Recevoir un lien de connexion<\/button>/,
    )
    expect(champCache(connexion.body, 'retour')).toBe('/garagiste')
    expect(connexion.body).not.toContain('Section en construction')
  })

  it('le cookie de session porte HttpOnly, Secure, SameSite=Lax et Path=/garagiste', async () => {
    const montage = await monter()
    const ouverture = await ouvrirLien(montage, await demanderLien(montage))
    const enTete = String(ouverture.headers['set-cookie'])
    expect(enTete).toMatch(/^bf_session=[A-Za-z0-9_-]{43};/)
    for (const attribut of [
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/garagiste',
      'Max-Age=7776000',
    ]) {
      expect(enTete).toContain(attribut)
    }
    expect(ouverture.headers['cache-control']).toBe('no-store')
  })

  describe('un POST de l’espace venu d’une autre origine ou sans jeton valide est refusé, et rien n’est modifié', () => {
    it('demande de lien : ni lien créé ni message envoyé', async () => {
      const { app, messagerie } = await monter()
      const jeton = jetonFormulaire((await lire(app, '/garagiste/connexion')).body)
      const refus = [
        await poster(app, '/garagiste/connexion', { jeton_formulaire: jeton }, { origine: PIRATE }),
        await poster(app, '/garagiste/connexion', {}),
        await poster(app, '/garagiste/connexion', { jeton_formulaire: 'faux.jeton' }),
        await poster(app, '/garagiste/connexion', { jeton_formulaire: jeton }, { origine: null }),
        await poster(
          app,
          '/garagiste/connexion',
          { jeton_formulaire: jeton },
          { origine: null, referent: `${PIRATE}/page` },
        ),
      ]
      for (const reponse of refus) {
        expect(reponse.statusCode).toBe(403)
        expect(reponse.body).toContain('rien n’a été enregistré ni envoyé')
        expect(reponse.headers['x-robots-tag']).toBe('noindex')
      }
      expect(messagerie.envoyes).toEqual([])
      // Sans Origin, un référent du site suffit (navigateur ancien).
      const parReferent = await poster(
        app,
        '/garagiste/connexion',
        { jeton_formulaire: jeton },
        { origine: null, referent: `${URL_PUBLIQUE_ESSAI}/garagiste/connexion` },
      )
      expect(parReferent.statusCode).toBe(200)
    })

    it('ouverture de session : le lien reste inutilisé', async () => {
      const montage = await monter()
      const jetonLien = await demanderLien(montage)
      const page = await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)
      const refus = await poster(
        montage.app,
        '/garagiste/connexion/lien',
        { jeton_formulaire: jetonFormulaire(page.body), jeton: jetonLien },
        { origine: PIRATE },
      )
      expect(refus.statusCode).toBe(403)
      expect(refus.cookies).toEqual([])
      const sansJeton = await poster(montage.app, '/garagiste/connexion/lien', { jeton: jetonLien })
      expect(sansJeton.statusCode).toBe(403)
      expect(
        (await lire(montage.app, `/garagiste/connexion/lien?jeton=${jetonLien}`)).body,
      ).toContain('Ouvrir mon espace garagiste')
    })

    it('déconnexion : la session reste ouverte', async () => {
      const montage = await monter()
      const session = await seConnecter(montage)
      const autre = await seConnecter(montage)
      const jetonDeLaSession = jetonFormulaire(
        (await lire(montage.app, '/garagiste', session)).body,
      )
      const jetonDeLAutre = jetonFormulaire((await lire(montage.app, '/garagiste', autre)).body)
      const tentatives = [
        await poster(
          montage.app,
          '/garagiste/deconnexion',
          { jeton_formulaire: jetonDeLaSession },
          {
            session,
            origine: PIRATE,
          },
        ),
        await poster(montage.app, '/garagiste/deconnexion', {}, { session }),
        await poster(
          montage.app,
          '/garagiste/deconnexion',
          { jeton_formulaire: jetonDeLAutre },
          {
            session,
          },
        ),
      ]
      for (const reponse of tentatives) expect(reponse.statusCode).toBe(403)
      expect((await lire(montage.app, '/garagiste', session)).statusCode).toBe(200)
      // Sans cookie, la garde de l'espace répond 401 avant même la vérification.
      const sansSession = await poster(montage.app, '/garagiste/deconnexion', {
        jeton_formulaire: jetonDeLaSession,
      })
      expect(sansSession.statusCode).toBe(401)
      expect(sansSession.headers['x-robots-tag']).toBe('noindex')
    })

    it('signalement : aucun message ne part', async () => {
      const montage = await monter()
      const session = await seConnecter(montage)
      const envoyesAvant = montage.messagerie.envoyes.length
      const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
      const refus = await poster(
        montage.app,
        '/garagiste/signaler',
        { jeton_formulaire: jeton, nature: 'prix', texte: 'Vidange' },
        { session, origine: PIRATE },
      )
      expect(refus.statusCode).toBe(403)
      expect(montage.messagerie.envoyes).toHaveLength(envoyesAvant)
    })
  })

  it('après la commande de réinitialisation, l’ancienne session est rejetée', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    expect((await lire(montage.app, '/garagiste', session)).statusCode).toBe(200)
    const sorties: string[] = []
    const code = executerCommande(['reinitialiser'], {
      env: { BASE_SQLITE: montage.cheminBase },
      repertoireCourant: '/',
      sorties: {
        ecrire: (texte) => sorties.push(texte),
        ecrireErreur: (texte) => sorties.push(texte),
      },
    })
    expect(code).toBe(0)
    const apres = await lire(montage.app, '/garagiste', session)
    expect(apres.statusCode).toBe(303)
    expect(apres.headers.location).toBe('/garagiste/connexion?retour=%2Fgaragiste')
    expect(await montage.acces.verifierSession(session)).toBe(false)
  })

  it('cinq demandes de lien de la même adresse dans l’heure : la sixième est refusée avec le délai d’attente', async () => {
    const { app, messagerie } = await monter()
    const jeton = jetonFormulaire((await lire(app, '/garagiste/connexion')).body)
    for (let rang = 0; rang < 5; rang += 1) {
      const reponse = await poster(
        app,
        '/garagiste/connexion',
        { jeton_formulaire: jeton },
        {
          adresse: '203.0.113.7',
        },
      )
      expect(reponse.statusCode).toBe(200)
    }
    const sixieme = await poster(
      app,
      '/garagiste/connexion',
      { jeton_formulaire: jeton },
      {
        adresse: '203.0.113.7',
      },
    )
    expect(sixieme.statusCode).toBe(429)
    expect(sixieme.headers['retry-after']).toBe('3600')
    expect(texteDe(sixieme.body)).toContain(
      'Déjà 5 liens demandés depuis cette connexion en moins d’une heure. Réessayez dans 60 minutes.',
    )
    expect(messagerie.envoyes).toHaveLength(5)
  })

  it('vingt demandes dans l’heure : à la vingt et unième, Anthony est alerté et le compte n’est pas verrouillé', async () => {
    const { app, messagerie } = await monter()
    const jeton = jetonFormulaire((await lire(app, '/garagiste/connexion')).body)
    for (let rang = 0; rang < 20; rang += 1) {
      await poster(
        app,
        '/garagiste/connexion',
        { jeton_formulaire: jeton },
        {
          adresse: `203.0.113.${rang % 4}`,
        },
      )
    }
    const alertes = () =>
      messagerie.envoyes.filter((message) => message.destinataire === RESPONSABLE)
    expect(alertes()).toEqual([])
    const vingtEtUnieme = await poster(
      app,
      '/garagiste/connexion',
      { jeton_formulaire: jeton },
      {
        adresse: '198.51.100.9',
      },
    )
    expect(vingtEtUnieme.statusCode).toBe(200)
    expect(alertes()).toHaveLength(1)
    expect(alertes()[0]?.objet).toBe('Alerte : demandes de lien de connexion inhabituelles')
    expect(messagerie.envoyes.at(-1)?.destinataire).toBe(GARAGISTE)
  })
})

describe('connexion : cas limites', () => {
  it('sans adresse du garagiste, la page le dit et n’offre aucun bouton qui ne mènerait à rien', async () => {
    const { app, messagerie } = await monter({ reglages: { courrielGaragiste: null } })
    const page = await lire(app, '/garagiste/connexion')
    expect(page.statusCode).toBe(200)
    expect(page.body).toContain(
      'l’adresse de courriel du garagiste n’est pas\n            encore configurée',
    )
    expect(page.body).not.toContain('Recevoir un lien de connexion</button>')
    expect(page.body).not.toContain('name="jeton_formulaire"')
    const force = await poster(app, '/garagiste/connexion', {})
    expect(force.statusCode).toBe(403)
    expect(messagerie.envoyes).toEqual([])
  })

  it('un serveur d’envoi en panne donne une page qui le dit, jamais « lien envoyé »', async () => {
    const { app, messagerie } = await monter()
    messagerie.tomberEnPanne()
    const jeton = jetonFormulaire((await lire(app, '/garagiste/connexion')).body)
    const reponse = await poster(app, '/garagiste/connexion', { jeton_formulaire: jeton })
    expect(reponse.statusCode).toBe(503)
    expect(reponse.body).toContain('Le lien n’a pas pu partir')
    expect(reponse.body).not.toContain('Lien envoyé')
  })

  it('en démonstration, le lien s’affiche dans la page, sur l’hôte visité, et il fonctionne', async () => {
    const montage = await monter({ mode: 'demonstration' })
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/connexion')).body)
    const reponse = await poster(montage.app, '/garagiste/connexion', { jeton_formulaire: jeton })
    expect(reponse.body).toContain('Version de démonstration')
    expect(reponse.body).toContain('<strong>Démonstration :</strong> aucun courriel ne part.')
    const jetonLien = jetonDuLien(reponse.body)
    expect(reponse.body).toContain(`href="/garagiste/connexion/lien?jeton=${jetonLien}"`)
    expect(texteDe(reponse.body)).toContain('<h1>Votre lien de connexion</h1>')
    // Rien n'est parti : la page ne le prétend pas (piège 5).
    expect(reponse.body).not.toContain('vient de partir')
    expect((await ouvrirLien(montage, jetonLien)).statusCode).toBe(303)
  })

  it('avec un serveur d’envoi, la page annonce le courriel parti', async () => {
    const montage = await monter()
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/connexion')).body)
    const reponse = await poster(montage.app, '/garagiste/connexion', { jeton_formulaire: jeton })
    expect(texteDe(reponse.body)).toContain(
      'Un lien de connexion vient de partir vers l’adresse de courriel du garage.',
    )
  })

  it('sans serveur d’envoi, le lien s’écrit dans le journal et la page le dit au lieu de prétendre qu’il est parti', async () => {
    const ecrits: string[] = []
    const sortie = vi.spyOn(process.stdout, 'write').mockImplementation((morceau) => {
      ecrits.push(String(morceau))
      return true
    })
    try {
      const montage = await monter({ messageriesReelles: true })
      const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/connexion')).body)
      const reponse = await poster(montage.app, '/garagiste/connexion', {
        jeton_formulaire: jeton,
      })
      expect(reponse.statusCode).toBe(200)
      expect(texteDe(reponse.body)).toContain('<h1>Lien non envoyé par courriel</h1>')
      expect(texteDe(reponse.body)).toContain(
        'le lien a été écrit dans le journal du serveur au lieu de partir.',
      )
      expect(reponse.body).not.toContain('vient de partir')
      // Le lien écrit au journal est bien utilisable, et jamais rendu à la page.
      const jetonLien = jetonDuLien(ecrits.join(''))
      expect(reponse.body).not.toContain(jetonLien)
      expect((await ouvrirLien(montage, jetonLien)).statusCode).toBe(303)
    } finally {
      sortie.mockRestore()
    }
  })

  it('rejoint après connexion la page demandée de l’espace, jamais une autre origine', async () => {
    const montage = await monter()
    const versSignaler = await ouvrirLien(
      montage,
      await demanderLien(montage, '/garagiste/signaler'),
    )
    expect(versSignaler.headers.location).toBe('/garagiste/signaler')
    const pirate = await lire(
      montage.app,
      `/garagiste/connexion?retour=${encodeURIComponent(`${PIRATE}/x`)}`,
    )
    expect(champCache(pirate.body, 'retour')).toBe('/garagiste')
    const versPirate = await ouvrirLien(montage, await demanderLien(montage, '//pirate.exemple'))
    expect(versPirate.headers.location).toBe('/garagiste')
  })

  it('déjà connecté, la connexion et le lien mènent directement à l’espace', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const connexion = await lire(
      montage.app,
      '/garagiste/connexion?retour=%2Fgaragiste%2Fsignaler',
      session,
    )
    expect(connexion.statusCode).toBe(303)
    expect(connexion.headers.location).toBe('/garagiste/signaler')
    const lien = await lire(montage.app, '/garagiste/connexion/lien?jeton=quelconque', session)
    expect(lien.headers.location).toBe('/garagiste')
  })

  it('un lien inconnu ou tronqué répond « Lien inconnu » (404)', async () => {
    const { app } = await monter()
    for (const url of [
      `/garagiste/connexion/lien?jeton=${'a'.repeat(43)}`,
      '/garagiste/connexion/lien?jeton=abc',
      '/garagiste/connexion/lien',
    ]) {
      const reponse = await lire(app, url)
      expect(reponse.statusCode).toBe(404)
      expect(reponse.body).toContain('<h1>Lien inconnu</h1>')
    }
  })

  it('une session survit au redémarrage du serveur', async () => {
    const premier = await monter()
    const session = await seConnecter(premier)
    await premier.app.close()
    ouverts = ouverts.filter((app) => app !== premier.app)
    const second = await monter({ cheminBase: premier.cheminBase })
    expect((await lire(second.app, '/garagiste', session)).statusCode).toBe(200)
  })

  it('un formulaire ouvert avant un redémarrage (déploiement) reste accepté : le texte n’est pas perdu', async () => {
    const premier = await monter()
    const session = await seConnecter(premier)
    const jetonSignalement = jetonFormulaire(
      (await lire(premier.app, '/garagiste/signaler', session)).body,
    )
    const jetonConnexion = jetonFormulaire((await lire(premier.app, '/garagiste/connexion')).body)
    await premier.app.close()
    ouverts = ouverts.filter((app) => app !== premier.app)

    const second = await monter({ cheminBase: premier.cheminBase })
    const signalement = await poster(
      second.app,
      '/garagiste/signaler',
      {
        jeton_formulaire: jetonSignalement,
        nature: 'prix',
        texte: 'Texte tapé avant le déploiement',
      },
      { session },
    )
    expect(signalement.statusCode).toBe(200)
    expect(signalement.body).toContain('<h1>Signalement envoyé</h1>')
    expect(second.messagerie.envoyes.at(-1)?.texte).toContain('Texte tapé avant le déploiement')
    const connexion = await poster(second.app, '/garagiste/connexion', {
      jeton_formulaire: jetonConnexion,
    })
    expect(connexion.statusCode).toBe(200)
  })
})

describe('en-têtes de l’espace sur toute adresse sous /garagiste', () => {
  const pageDUnAutreContexte: ModuleContexte = {
    nom: 'autre-contexte',
    enregistrer: (app, outils) => {
      app.get('/garagiste/demandes', { preHandler: outils.exigerGaragiste }, async () => 'liste')
    },
  }

  it('noindex et no-store sur les pages d’un autre contexte, sur une adresse inconnue, jamais hors de l’espace', async () => {
    const montage = await monter({ autresModules: [pageDUnAutreContexte] })
    const session = await seConnecter(montage)
    const reponses = [
      await lire(montage.app, '/garagiste/demandes', session),
      await lire(montage.app, '/garagiste/demandes'),
      await lire(montage.app, '/garagiste/adresse-inconnue', session),
      await lire(montage.app, '/garagiste/?x=1', session),
    ]
    expect(reponses.map((reponse) => reponse.statusCode)).toEqual([200, 303, 404, 200])
    for (const reponse of reponses) {
      expect(reponse.headers['x-robots-tag']).toBe('noindex')
      expect(reponse.headers['cache-control']).toBe('no-store')
    }
    for (const url of ['/', '/garagistes', '/sante']) {
      expect((await lire(montage.app, url)).headers['x-robots-tag'], url).toBeUndefined()
    }
  })
})

describe('accueil de l’espace garagiste', () => {
  it('mène aux demandes, aux fermetures et au signalement, rappelle la fiche Google, jamais indexé', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const page = await lire(montage.app, '/garagiste', session)
    expect(page.statusCode).toBe(200)
    expect(page.headers['x-robots-tag']).toBe('noindex')
    expect(page.headers['cache-control']).toBe('no-store')
    expect(page.body).toContain('<meta name="robots" content="noindex">')
    expect(page.body).toContain('href="/garagiste/demandes">Demandes des clients</a>')
    expect(page.body).toContain('href="/garagiste/fermetures">Fermetures exceptionnelles</a>')
    expect(page.body).toContain('href="/garagiste/signaler">Signaler un changement</a>')
    expect(page.body).toContain('Pensez aussi à votre fiche Google')
    expect(page.body).toContain('Mettre l’espace sur l’écran d’accueil du téléphone')
    expect(page.body).toContain('action="/garagiste/deconnexion"')
    expect(texteVisible(page.body)).not.toMatch(/\d+ ?%/)
  })

  it('renouvelle l’échéance du cookie à chaque visite : 90 jours glissants', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    montage.horloge.avancer(10 * JOUR)
    const page = await lire(montage.app, '/garagiste', session)
    const cookie = page.cookies.find((candidat) => candidat.name === 'bf_session')
    expect(cookie?.value).toBe(session)
    expect(cookie?.maxAge).toBe(90 * 24 * 60 * 60)
  })

  it('se déconnecter ferme la session, efface le cookie et le dit', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/deconnexion',
      { jeton_formulaire: jeton },
      {
        session,
      },
    )
    expect(reponse.statusCode).toBe(303)
    expect(reponse.headers.location).toBe('/garagiste/connexion?etat=deconnexion')
    const efface = reponse.cookies.find((candidat) => candidat.name === 'bf_session')
    expect(efface?.value).toBe('')
    expect(efface?.['path']).toBe('/garagiste')
    expect(await montage.acces.verifierSession(session)).toBe(false)
    const confirmation = await lire(montage.app, reponse.headers.location ?? '')
    expect(confirmation.body).toContain('Vous êtes déconnecté.')
  })

  it('aucune requête GET ne change d’état', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    expect((await lire(montage.app, '/garagiste/deconnexion', session)).statusCode).toBe(404)
    expect(await montage.acces.verifierSession(session)).toBe(true)
  })
})

describe('US-49 : signaler un changement', () => {
  it('propose un choix fermé et un texte court, champs étiquetés', async () => {
    const montage = await monter()
    const page = await lire(montage.app, '/garagiste/signaler', await seConnecter(montage))
    expect(page.statusCode).toBe(200)
    expect(page.headers['x-robots-tag']).toBe('noindex')
    expect(page.body).toContain(
      '<label class="champ__libelle" for="acces-signalement-nature">Ce qui change</label>',
    )
    for (const option of ['Horaires habituels', 'Prix', 'Prestation', 'Autre']) {
      expect(page.body).toContain(`>${option}</option>`)
    }
    expect(page.body).toContain('maxlength="500"')
    expect(page.body).toContain('aria-describedby="acces-signalement-texte-aide"')
  })

  it('une saisie incomplète est rendue avec ses erreurs reliées aux champs, et rien ne part', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const envoyesAvant = montage.messagerie.envoyes.length
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: '', texte: '   ' },
      { session },
    )
    expect(reponse.statusCode).toBe(422)
    expect(reponse.body).toContain('Le signalement n’est pas parti')
    expect(reponse.body).toContain(
      '<a href="#acces-signalement-nature">Choisissez ce qui change.</a>',
    )
    expect(reponse.body).toContain(
      'aria-describedby="acces-signalement-nature-erreur" aria-invalid="true"',
    )
    expect(reponse.body).toContain(
      'aria-describedby="acces-signalement-texte-aide acces-signalement-texte-erreur" aria-invalid="true"',
    )
    expect(reponse.body).toContain('<p class="champ__erreur" id="acces-signalement-texte-erreur">')
    expect(montage.messagerie.envoyes).toHaveLength(envoyesAvant)
  })

  it('un message structuré part vers Anthony, la confirmation l’annonce, et le fichier de données n’est pas modifié', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const fichierAvant = await readFile(FICHIER_GARAGE, 'utf8')
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: 'horaires', texte: 'Fermeture à 18 h le samedi <b>' },
      { session },
    )
    expect(reponse.statusCode).toBe(200)
    expect(reponse.body).toContain('<h1>Signalement envoyé</h1>')
    expect(reponse.body).toContain('Votre message est parti vers Anthony.')
    expect(reponse.body).toContain('Fermeture à 18\u00a0h le samedi &lt;b&gt;')
    const message = montage.messagerie.envoyes.at(-1)
    expect(message?.destinataire).toBe(RESPONSABLE)
    expect(message?.texte).toContain('Ce qui change : Horaires habituels')
    expect(message?.texte).toContain('Fermeture à 18 h le samedi <b>')
    expect(await readFile(FICHIER_GARAGE, 'utf8')).toBe(fichierAvant)
  })

  it('en panne d’envoi, le texte est conservé dans le formulaire', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    montage.messagerie.tomberEnPanne()
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: 'prix', texte: 'Nouveau taux horaire' },
      { session },
    )
    expect(reponse.statusCode).toBe(503)
    expect(reponse.body).toContain('Le message n’est pas parti')
    expect(reponse.body).toContain('>Nouveau taux horaire</textarea>')
    expect(reponse.body).toContain('<option value="prix" selected>Prix</option>')
  })

  it('sans adresse d’Anthony, la page le dit au lieu d’offrir un formulaire', async () => {
    const montage = await monter({ reglages: { courrielResponsable: null } })
    const page = await lire(montage.app, '/garagiste/signaler', await seConnecter(montage))
    expect(page.body).toContain('L’envoi des signalements n’est pas encore configuré')
    expect(page.body).not.toContain('<form class="acces-formulaire pile"')
  })

  it('sans adresse d’Anthony, un texte reçu quand même est rendu pour être copié, sans promettre de formulaire', async () => {
    const montage = await monter({ reglages: { courrielResponsable: null } })
    const session = await seConnecter(montage)
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: 'prix', texte: 'Nouveau taux horaire' },
      { session },
    )
    expect(reponse.statusCode).toBe(503)
    expect(texteDe(reponse.body)).toContain('Votre message, à lui transmettre')
    expect(reponse.body).toContain('<p class="acces-texte-libre">Nouveau taux horaire</p>')
    expect(reponse.body).not.toContain('conservé ci-dessous')
    expect(reponse.body).not.toContain('<textarea')
  })

  it('en démonstration, la confirmation dit qu’aucun courriel ne part', async () => {
    const montage = await monter({ mode: 'demonstration' })
    const session = await seConnecter(montage)
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: 'autre', texte: 'Essai du jury' },
      { session },
    )
    expect(reponse.statusCode).toBe(200)
    expect(reponse.body).toContain('<h1>Signalement de démonstration</h1>')
    expect(texteDe(reponse.body)).toContain(
      '<strong>Démonstration :</strong> aucun courriel ne part. En service, ce message partirait vers Anthony',
    )
    expect(reponse.body).not.toContain('est parti vers Anthony')
  })

  it('un texte de 500 caractères avec des retours à la ligne, envoyés en CRLF comme le fait un navigateur, est accepté', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const jeton = jetonFormulaire((await lire(montage.app, '/garagiste/signaler', session)).body)
    const lignes = ['a'.repeat(248), 'b'.repeat(249)]
    const texte = lignes.join('\r\n\r\n') // 499 caractères pour le champ, 501 tels qu'envoyés
    const reponse = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: 'autre', texte },
      { session },
    )
    expect(reponse.statusCode).toBe(200)
    expect(montage.messagerie.envoyes.at(-1)?.texte).toContain(lignes.join('\n\n'))
  })
})

describe('capacité offerte à la couche web : verifierSession', () => {
  it('ne reconnaît qu’une session ouverte et en cours', async () => {
    const montage = await monter()
    expect(await montage.acces.verifierSession(undefined)).toBe(false)
    expect(await montage.acces.verifierSession('jeton-quelconque')).toBe(false)
    const session = await seConnecter(montage)
    expect(await montage.acces.verifierSession(session)).toBe(true)
    montage.horloge.avancer(90 * JOUR)
    expect(await montage.acces.verifierSession(session)).toBe(false)
  })
})

describe('capacité offerte à la couche web : anti-falsification partagée de l’espace', () => {
  /** Page d'un autre contexte de l'espace, qui compte les envois admis. */
  function moduleCompteur(): { module: ModuleContexte; admis: () => number } {
    let admis = 0
    return {
      admis: () => admis,
      module: {
        nom: 'compteur',
        enregistrer: (app, outils) => {
          app.get('/garagiste/compteur', { preHandler: outils.exigerGaragiste }, async (r, rep) =>
            rep.type('text/html').send(`jeton=${outils.jetonFormulaireGaragiste(r)}`),
          )
          app.post(
            '/garagiste/compteur',
            { preHandler: [outils.exigerGaragiste, outils.exigerFormulaireGaragiste] },
            async () => {
              admis += 1
              return { admis }
            },
          )
        },
      },
    }
  }

  it('un jeton propre à chaque session, rien sans session valide', async () => {
    const montage = await monter()
    const { protectionFormulairesGaragiste: protection } = montage.acces
    expect(protection.jeton(undefined)).toBeNull()
    expect(protection.jeton('jeton-quelconque')).toBeNull()
    const premiere = await seConnecter(montage)
    const seconde = await seConnecter(montage)
    const jeton = protection.jeton(premiere)
    expect(jeton).not.toBeNull()
    expect(protection.jeton(seconde)).not.toBe(jeton)
    const envoi = {
      jetonSession: premiere,
      jetonFormulaire: jeton,
      origine: URL_PUBLIQUE_ESSAI,
      referent: undefined,
      hote: 'garage.exemple',
    }
    expect(protection.admettre(envoi)).toBe(true)
    expect(
      protection.admettre({
        ...envoi,
        origine: undefined,
        referent: `${URL_PUBLIQUE_ESSAI}/garagiste`,
      }),
    ).toBe(true)
    expect(protection.admettre({ ...envoi, jetonFormulaire: undefined })).toBe(false)
    expect(protection.admettre({ ...envoi, jetonFormulaire: protection.jeton(seconde) })).toBe(
      false,
    )
    expect(protection.admettre({ ...envoi, origine: PIRATE })).toBe(false)
    expect(protection.admettre({ ...envoi, origine: undefined })).toBe(false)
    expect(protection.admettre({ ...envoi, jetonSession: undefined })).toBe(false)
  })

  it('branchée dans la couche web : un envoi sans jeton ou au jeton d’une autre session est refusé, rien n’est compté', async () => {
    const compteur = moduleCompteur()
    const montage = await monter({ autresModules: [compteur.module] })
    const session = await seConnecter(montage)
    const autre = await seConnecter(montage)
    const jetonDe = async (cookie: string) =>
      (await lire(montage.app, '/garagiste/compteur', cookie)).body.replace('jeton=', '')
    const jeton = await jetonDe(session)
    expect(jeton).not.toBe('')
    const refus = [
      await poster(montage.app, '/garagiste/compteur', {}, { session }),
      await poster(
        montage.app,
        '/garagiste/compteur',
        { jeton_formulaire: await jetonDe(autre) },
        { session },
      ),
      await poster(
        montage.app,
        '/garagiste/compteur',
        { jeton_formulaire: jeton },
        { session, origine: PIRATE },
      ),
      await poster(
        montage.app,
        '/garagiste/compteur',
        { jeton_formulaire: jeton },
        { session, origine: null },
      ),
    ]
    expect(refus.map((reponse) => reponse.statusCode)).toEqual([403, 403, 403, 403])
    expect(refus.every((reponse) => reponse.headers['cache-control'] === 'no-store')).toBe(true)
    expect(compteur.admis()).toBe(0)
    const admis = await poster(
      montage.app,
      '/garagiste/compteur',
      { jeton_formulaire: jeton },
      { session },
    )
    expect(admis.statusCode).toBe(200)
    expect(compteur.admis()).toBe(1)
  })
})

describe('système de design de l’espace (docs/design/composants.md)', () => {
  const FIL_ACCUEIL =
    '<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li>'

  it('chaque écran commence par un en-tête de page, fil d’Ariane compris, et n’a jamais de barre fixe', async () => {
    const montage = await monter()
    const connexion = await lire(montage.app, '/garagiste/connexion')
    const session = await seConnecter(montage)
    const pages = new Map<string, string>([
      ['connexion', connexion.body],
      ['espace', (await lire(montage.app, '/garagiste', session)).body],
      ['signalement', (await lire(montage.app, '/garagiste/signaler', session)).body],
      ['lien inconnu', (await lire(montage.app, '/garagiste/connexion/lien?jeton=inconnu')).body],
    ])
    for (const [nom, page] of pages) {
      expect(page, nom).toContain('<div class="entete-page">')
      expect(page, nom).toContain(FIL_ACCUEIL)
      expect(page, nom).not.toContain('barre-fixe')
      expect(page.match(/<h1>/g), nom).toHaveLength(1)
    }
    expect(pages.get('signalement')).toContain(
      '<li><a href="/garagiste">Espace garagiste</a></li><li><a aria-current="page">Signaler un changement</a></li>',
    )
    expect(pages.get('connexion')).toContain('<p class="surtitre">Réservé au garagiste</p>')
  })

  it('la connexion tient dans un panneau ; le signalement est un formulaire en panneau, bouton principal', async () => {
    const montage = await monter()
    const connexion = (await lire(montage.app, '/garagiste/connexion')).body
    expect(connexion).toMatch(
      /<div class="panneau pile">\s*<form class="acces-formulaire" method="post" action="\/garagiste\/connexion"/,
    )
    const session = await seConnecter(montage)
    const signalement = (await lire(montage.app, '/garagiste/signaler', session)).body
    expect(signalement).toContain('<form class="acces-formulaire panneau pile"')
    expect(signalement).toContain(
      '<button class="bouton bouton--principal acces-action" type="submit">Envoyer à Anthony</button>',
    )
  })

  it('l’accueil de l’espace : raccourcis en cartes, fiche Google en encart, astuce en volet', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const page = (await lire(montage.app, '/garagiste', session)).body
    expect(page.match(/<li class="carte carte--lien acces-raccourci">/g)).toHaveLength(3)
    expect(page).toContain('<aside class="encart" aria-labelledby="acces-titre-fiche-google">')
    expect(page).toContain('<details class="volet">')
    expect(page).toContain(
      '<summary class="volet__titre">Mettre l’espace sur l’écran d’accueil du téléphone</summary>',
    )
  })
})

describe('corrections du jury, passe 1 (J4, J5)', () => {
  it('l’accueil de l’espace dit combien de demandes attendent, dont « Ne roulez pas », sur la carte des demandes', async () => {
    const montage = await monter({
      compterDemandesARappeler: async () => ({ total: 3, neRoulezPas: 1 }),
    })
    const page = (await lire(montage.app, '/garagiste', await seConnecter(montage))).body
    const carte =
      /<li class="carte carte--lien acces-raccourci">[\s\S]*?<\/li>/.exec(page)?.[0] ?? ''
    expect(carte).toContain('href="/garagiste/demandes">Demandes des clients</a>')
    expect(texteDe(carte)).toContain(
      '<p class="acces-compteur"><strong>3 demandes à rappeler</strong>, dont <span class="acces-compteur__urgent">1 « Ne roulez pas »</span></p>',
    )
    expect(texteVisible(page)).not.toMatch(/\d+ ?%/)
  })

  it('garage fermé aujourd’hui : l’accueil le dit, avec les rappels promis à reporter (J4, passe 2)', async () => {
    const ferme = await monter({
      compterDemandesARappeler: async () => ({
        total: 7,
        neRoulezPas: 0,
        fermeAujourdhui: { rappelsAReporter: 7 },
      }),
    })
    const page = (await lire(ferme.app, '/garagiste', await seConnecter(ferme))).body
    expect(page).toContain(
      '<strong>Garage fermé aujourd’hui\u00a0: 7 rappels promis à reporter.</strong>',
    )
    expect(page).toContain('<a href="/garagiste/fermetures">Rouvrir le garage</a>')
    const ouvert = await monter({
      compterDemandesARappeler: async () => ({ total: 7, neRoulezPas: 0 }),
    })
    expect((await lire(ouvert.app, '/garagiste', await seConnecter(ouvert))).body).not.toContain(
      'Garage fermé aujourd’hui',
    )
  })

  it('aucune demande : l’accueil le dit ; sans capacité, ou en panne, il se tait et l’espace s’ouvre', async () => {
    const vide = await monter({
      compterDemandesARappeler: async () => ({ total: 0, neRoulezPas: 0 }),
    })
    expect((await lire(vide.app, '/garagiste', await seConnecter(vide))).body).toContain(
      '<p class="acces-compteur">Aucune demande à rappeler.</p>',
    )
    const sans = await monter()
    expect((await lire(sans.app, '/garagiste', await seConnecter(sans))).body).not.toContain(
      'acces-compteur',
    )
    const enPanne = await monter({
      compterDemandesARappeler: async () => {
        throw new Error('base verrouillée')
      },
    })
    const page = await lire(enPanne.app, '/garagiste', await seConnecter(enPanne))
    expect(page.statusCode).toBe(200)
    expect(page.body).not.toContain('acces-compteur')
  })

  it('signalement : « invalide » seulement après une erreur, résumé nommé, retour de 44 px', async () => {
    const montage = await monter()
    const session = await seConnecter(montage)
    const page = (await lire(montage.app, '/garagiste/signaler', session)).body
    expect(page).toContain(
      'id="acces-signalement-nature" name="nature" required aria-invalid="false"',
    )
    expect(page).toContain('aria-describedby="acces-signalement-texte-aide" aria-invalid="false"')
    expect(page).toContain('<a class="acces-lien-retour" href="/garagiste">Revenir à l’espace</a>')
    const jeton = jetonFormulaire(page)
    const erreur = await poster(
      montage.app,
      '/garagiste/signaler',
      { jeton_formulaire: jeton, nature: '', texte: '' },
      { session },
    )
    expect(erreur.body).toContain(
      'id="acces-signalement-erreurs" role="alert" tabindex="-1" autofocus aria-labelledby="acces-signalement-erreurs-titre">',
    )
    expect(erreur.body).toContain(
      'id="acces-signalement-erreurs-titre">Le signalement n’est pas parti</h2>',
    )
  })
})
