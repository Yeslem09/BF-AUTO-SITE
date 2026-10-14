import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOM_COOKIE_SESSION, type ModeSite, type ReferenceFamille } from '../../contrats/index.js'
import { CADRE_ESSAI, creerServeurEssai, PROTECTION_FORMULAIRES_ESSAI } from '../../web/essai.js'
import { ouvrirBaseDemandes } from './adaptateurs/sqlite/base.js'
import { creerDepotDemandesSqlite } from './adaptateurs/sqlite/depot-demandes-sqlite.js'
import { creerDemande } from './domaine/demande.js'
import { HEURE_MS } from './domaine/temps.js'
import { MESSAGES } from './domaine/validation.js'
import {
  DELAI_HUMAIN_MS,
  DEMI_JOURNEES_ESSAI,
  EXCLUSIONS_ESSAI,
  FAMILLE_ESSAI,
  INSTANT_ESSAI,
  OFFRE_PIECES_ESSAI,
  horlogePilotee,
  resumeEssai,
  type HorlogePilotee,
} from './essai.js'
import { insecables } from './adaptateurs/web/vues/typographie.js'
import { creerExpediteurSmtp } from '../../infrastructure/courriel/envoi/expediteur-smtp.js'
import {
  assemblerDemandes,
  SANS_CONNECTEURS,
  type ContexteDemandes,
  type DependancesDemandes,
} from './module.js'

/** Serveur d'envoi fermé : chaque notification échoue, vite. */
const EXPEDITEUR_INJOIGNABLE = creerExpediteurSmtp({
  fournisseur: 'personnalise',
  serveur: { hote: '127.0.0.1', port: 1, securise: false },
  utilisateur: null,
  motDePasse: null,
  expediteur: 'site@garage.exemple',
  nomExpediteur: null,
  repondreA: null,
})

/** Texte visible d'une page : sans balises ni attributs (une adresse encodée n'est pas un pourcentage affiché). */
const texteVisible = (page: string): string => page.replace(/<[^>]*>/g, '')

/** Vrai dossier des données du site (`demandes.json`). */
const DONNEES_DU_SITE = resolve(import.meta.dirname, '../../../donnees')
const HOTE = 'garage.exemple'
const ORIGINE = `https://${HOTE}`
const IP_CLIENT = '203.0.113.7'
const TELEPHONE_GARAGE = '06 05 92 28 38'
const FORMAT_CONFIRMATION = /^\/demande\/envoyee\?j=[A-Za-z0-9_-]{22}$/

interface Banc {
  readonly app: FastifyInstance
  readonly contexte: ContexteDemandes
  readonly horloge: HorlogePilotee
  readonly cheminBase: string
}

let dossier: string
const ouverts: FastifyInstance[] = []

beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'bf-auto-module-demandes-'))
})

afterEach(async () => {
  for (const app of ouverts.splice(0)) await app.close()
  vi.restoreAllMocks()
  await rm(dossier, { recursive: true, force: true })
})

async function monter(
  options: {
    readonly mode?: ModeSite
    readonly session?: boolean
    readonly dependances?: Partial<DependancesDemandes>
    readonly horloge?: HorlogePilotee
    readonly cheminBase?: string
  } = {},
): Promise<Banc> {
  const horloge = options.horloge ?? horlogePilotee(INSTANT_ESSAI)
  const mode = options.mode ?? 'production'
  const cheminBase = options.cheminBase ?? join(dossier, 'demandes.sqlite')
  const contexte = await assemblerDemandes({
    mode,
    cheminBase,
    courrielGarage: null,
    connecteurs: SANS_CONNECTEURS,
    trouverFamille: async (identifiant) =>
      identifiant === FAMILLE_ESSAI.identifiant ? FAMILLE_ESSAI : null,
    listerCeQueNousNeFaisonsPas: async () => EXCLUSIONS_ESSAI,
    consulterOffrePieces: async () => OFFRE_PIECES_ESSAI,
    retrouverResumePreDiagnostic: async (code) =>
      code === 'code-urgent' ? resumeEssai('ne-pas-rouler') : null,
    proposerDemiJournees: async () => DEMI_JOURNEES_ESSAI,
    annoncerRappel: async () => null,
    urlPublique: ORIGINE,
    cheminDonnees: DONNEES_DU_SITE,
    fournirIdentite: async () => CADRE_ESSAI.identite,
    horloge,
    ...options.dependances,
  })
  const app = await creerServeurEssai([contexte.module], {
    mode,
    verifierSessionGaragiste: async () => options.session ?? false,
  })
  ouverts.push(app)
  return { app, contexte, horloge, cheminBase }
}

function jetonDe(page: string): string {
  const jeton = /name="jeton" value="([^"]+)"/.exec(page)?.[1]
  if (jeton === undefined) throw new Error('aucun jeton dans la page')
  return jeton
}

type Champs = Readonly<Record<string, string | readonly string[]>>

function corps(champs: Champs): string {
  const parametres = new URLSearchParams()
  for (const [nom, valeur] of Object.entries(champs)) {
    for (const element of typeof valeur === 'string' ? [valeur] : valeur)
      parametres.append(nom, element)
  }
  return parametres.toString()
}

async function envoyer(
  banc: Banc,
  champs: Champs,
  entetes: Readonly<Record<string, string>> = {},
  ip = IP_CLIENT,
): Promise<LightMyRequestResponse> {
  return banc.app.inject({
    method: 'POST',
    url: '/demande',
    remoteAddress: ip,
    headers: {
      host: HOTE,
      origin: ORIGINE,
      'content-type': 'application/x-www-form-urlencoded',
      ...entetes,
    },
    payload: corps(champs),
  })
}

/** Ouvre le formulaire, laisse passer un délai humain, et l'envoie rempli. */
async function remplirEtEnvoyer(
  banc: Banc,
  adresse: string,
  champs: Champs,
  ip = IP_CLIENT,
): Promise<LightMyRequestResponse> {
  const page = await banc.app.inject(adresse)
  banc.horloge.avancer(DELAI_HUMAIN_MS)
  return envoyer(banc, { ...champs, jeton: jetonDe(page.body) }, {}, ip)
}

const RENDEZ_VOUS: Champs = {
  type: 'rendez-vous',
  famille: 'freinage',
  creneaux: ['2026-09-17-matin', 'le-plus-tot'],
  marque: 'peugeot',
  modele: '208',
  prenom: 'Julie',
  telephone: '0612345678',
  moment: 'fin-de-journee',
}

const RAPPEL: Champs = {
  type: 'rappel',
  motif: 'souci',
  prenom: 'Julie',
  telephone: '06 12 34 56 78',
  moment: 'matin',
}

async function suivre(
  banc: Banc,
  reponse: LightMyRequestResponse,
): Promise<LightMyRequestResponse> {
  const adresse = reponse.headers.location
  if (typeof adresse !== 'string')
    throw new Error(`pas de redirection (statut ${reponse.statusCode})`)
  return banc.app.inject(adresse)
}

async function listeGaragiste(banc: Banc): Promise<string> {
  return (await banc.app.inject('/garagiste/demandes')).body
}

describe('formulaire unique /demande (D4, B-07, P-07)', () => {
  it('rendez-vous : demi-journées en cases, « Le plus tôt possible » et « Une autre date », rien de coché', async () => {
    const { app } = await monter()
    const reponse = await app.inject('/demande?type=rendez-vous')
    expect(reponse.statusCode).toBe(200)
    const page = reponse.body
    expect(page).toContain('<h1>Faire une demande</h1>')
    expect(page).toContain(
      '<a class="navigation__lien" href="/demande?type=rendez-vous" aria-current="page">',
    )
    expect(page).toContain('Ce n’est pas une réservation')
    // Une ligne par jour (J3) : le nom du jour, puis matin et après-midi, chacun à sa colonne.
    for (const jour of ['Jeudi 17 septembre', 'Vendredi 18 septembre']) {
      expect(page).toContain(`<p class="demandes-jour__nom" aria-hidden="true">${jour}</p>`)
    }
    expect(page).toContain(
      '<span>Matin<span class="visuellement-masque"> du jeudi 17 septembre</span></span>',
    )
    expect(page).toContain(
      '<span>Après-midi<span class="visuellement-masque"> du jeudi 17 septembre</span></span>',
    )
    for (const libelle of [
      'Le plus tôt possible',
      'Une autre date (nous en parlons au téléphone)',
    ]) {
      expect(page).toContain(`<span>${libelle}</span>`)
    }
    expect(page).not.toMatch(/\schecked/)
    expect(page).not.toMatch(/Réserver|Prendre RDV/)
    expect(page).toContain('Demander un rendez-vous')
    expect(page).toContain('data-envoi-unique')
  })

  it('chaque formulaire compte cinq champs obligatoires au plus, coordonnées en dernier', async () => {
    const { app } = await monter()
    for (const adresse of [
      '/demande?type=rendez-vous',
      '/demande?type=devis',
      '/demande?type=rappel',
      '/demande?type=devis&famille=freinage',
      '/demande?type=rappel&prediagnostic=code-urgent',
    ]) {
      const page = (await app.inject(adresse)).body
      const requis = page.match(/\srequired[\s>]/g) ?? []
      expect(requis.length, adresse).toBeLessThanOrEqual(5)
      if (adresse.includes('prediagnostic')) continue
      expect(page.indexOf('id="demande-prenom"'), adresse).toBeGreaterThan(
        page.indexOf('id="demande-precisions"'),
      )
    }
  })

  it('le véhicule complet n’est demandé que pour un devis ; marque et modèle suffisent ailleurs', async () => {
    const { app } = await monter()
    const devis = (await app.inject('/demande?type=devis')).body
    for (const champ of ['plaque', 'marque', 'modele', 'annee', 'energie']) {
      expect(devis).toContain(`id="demande-${champ}"`)
    }
    const rendezVous = (await app.inject('/demande?type=rendez-vous')).body
    expect(rendezVous).toContain('id="demande-marque"')
    expect(rendezVous).toContain('id="demande-modele"')
    expect(rendezVous).not.toContain('id="demande-plaque"')
    const rappel = (await app.inject('/demande?type=rappel')).body
    expect(rappel).toContain('id="demande-marque"')
    expect(rappel).not.toContain('id="demande-modele"')
  })

  it('dit ce qui se passe ensuite, sans promettre ni délai ni heure (B-08)', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=rendez-vous')).body
    const aparte = /<aside[\s\S]*?<\/aside>/.exec(page)?.[0] ?? ''
    expect(aparte).toContain(insecables('Et ensuite ?'))
    expect(aparte).toContain(
      insecables('Le garage vous rappelle ; il sait quand vous pouvez répondre.'),
    )
    expect(aparte).toContain(
      '<a class="demandes-telephone" href="tel:+33605922838">06 05 92 28 38</a>',
    )
    expect(aparte).not.toMatch(/\d+ ?h\b|minutes|heures|24/)
  })

  it('le moment de rappel est un choix fermé en tuiles, obligatoire sur tout type', async () => {
    const { app } = await monter()
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      const page = (await app.inject(`/demande?type=${type}`)).body
      expect(page, type).toContain(insecables('Quand pouvez-vous répondre au téléphone ?'))
      for (const moment of ['Dès que possible', 'Le matin', 'À midi', 'En fin de journée']) {
        expect(page, type).toContain(`<span>${moment}</span>`)
      }
      expect(page, type).toContain(
        '<label class="choix-tuile" for="demande-moment-1">\n      <input type="radio" id="demande-moment-1" name="moment" value="des-que-possible" aria-invalid="false" required>',
      )
      // Un seul « required » pour le groupe : le navigateur l'étend aux autres boutons.
      expect(page.match(/name="moment"[^>]*required/g), type).toHaveLength(1)
    }
  })

  it('devis depuis une famille : la famille est préremplie, la gamme proposée, aucun envoi de fichier', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=devis&famille=freinage')).body
    expect(page).toContain('<strong>Freinage</strong>')
    expect(page).toContain('<input type="hidden" name="famille" value="freinage">')
    expect(page).not.toContain('id="demande-objet"')
    expect(page).toContain('D’occasion ou reconditionnée (pièce issue de l’économie circulaire)')
    expect(page).toContain(insecables('Exemple : AB-123-CD ou 1234 AB 56.'))
    expect(page).not.toContain('type="file"')
    expect(page).not.toContain('Pièce seule')
  })

  it('« Ce que nous ne faisons pas » du catalogue, au-dessus de chaque formulaire (US-44)', async () => {
    const { app } = await monter()
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      const page = (await app.inject(`/demande?type=${type}`)).body
      const bloc = page.indexOf('Ce que nous ne faisons pas</h2>')
      expect(bloc, type).toBeGreaterThan(0)
      expect(bloc, type).toBeLessThan(page.indexOf('<form class="demandes-formulaire'))
      for (const exclusion of EXCLUSIONS_ESSAI) expect(page, type).toContain(insecables(exclusion))
    }
  })

  it('l’engagement de vérification des pièces, tiré du catalogue, sur le seul devis (US-28)', async () => {
    const { app } = await monter()
    const engagement = insecables(OFFRE_PIECES_ESSAI.engagementVerification ?? '')
    const devis = (await app.inject('/demande?type=devis&famille=freinage')).body
    expect(devis).toContain(`<p class="demandes-engagement">${engagement}</p>`)
    expect((await app.inject('/demande?type=rendez-vous')).body).not.toContain(engagement)
  })

  it('sans engagement publié ni exclusion, aucun bloc vide', async () => {
    const { app } = await monter({
      dependances: {
        listerCeQueNousNeFaisonsPas: async () => [],
        consulterOffrePieces: async () => ({
          engagementVerification: null,
          venteAuComptoir: false,
        }),
      },
    })
    const devis = (await app.inject('/demande?type=devis')).body
    expect(devis).not.toContain('Ce que nous ne faisons pas')
    expect(devis).not.toContain('demandes-engagement')
  })

  it('une famille inconnue est ignorée : l’intervention se choisit dans la liste', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=devis&famille=inconnue')).body
    expect(page).toContain('id="demande-objet"')
    expect(page).not.toContain('name="famille"')
  })

  it('rappel après pré-diagnostic : résumé lisible affiché, sécurité rappelée, trois champs à remplir (US-22)', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=rappel&prediagnostic=code-urgent')).body
    expect(page).toContain('Votre pré-diagnostic')
    expect(page).toContain(
      insecables(
        '<div class="alerte alerte--danger">\n  <p class="alerte__titre">Ne roulez pas : appelez-nous</p>',
      ),
    )
    // Lecture seule : aucun champ ne permet de modifier le résumé transmis.
    const resume = /<section class="demandes-resume"[\s\S]*?<\/section>/.exec(page)?.[0] ?? ''
    expect(resume).not.toMatch(/<(input|select|textarea)/)
    expect(page).toContain(
      insecables('<dt>La pédale de frein est-elle molle ?</dt><dd>Oui, elle s’enfonce</dd>'),
    )
    expect(page).toContain(
      insecables(
        'Si vous êtes immobilisé ou en danger, n’attendez pas notre rappel : appelez votre assistance ou le 112.',
      ),
    )
    expect(page).toContain('<input type="hidden" name="prediagnostic" value="code-urgent">')
    expect(page).not.toContain('id="demande-motif"')
    expect(page.match(/\srequired[\s>]/g)).toHaveLength(3)
  })

  it('sans type, le rappel ; un texte libre de l’adresse n’est jamais rendu (piège 40)', async () => {
    const { app } = await monter()
    const page = (
      await app.inject('/demande?type=%3Cscript%3Ealert(1)%3C%2Fscript%3E&famille=Appelez-le-0899')
    ).body
    expect(page).toContain(
      '<button class="bouton-choix demandes-types__lien" type="submit" form="demande-formulaire" name="changer_type" value="rappel" aria-pressed="true">',
    )
    expect(page).not.toContain('alert(1)')
    expect(page).not.toContain('Appelez-le-0899')
  })

  it('information sur les données sous le formulaire, téléphone expliqué, champ piège invisible (B-12, US-14, US-15)', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=rappel')).body
    expect(page).toContain('BF Auto, responsable du traitement')
    expect(page).toContain('supprime au bout de 12 mois')
    expect(page).toContain('<a href="/confidentialite">Politique de confidentialité</a>')
    expect(page).toContain('saisir la CNIL')
    expect(page).toContain(
      'Il sert uniquement à vous rappeler pour cette demande. Aucune sollicitation commerciale sans votre accord préalable.',
    )
    expect(page).toContain('aria-describedby="demande-telephone-aide"')
    expect(page).not.toContain('type="checkbox"')
    const piege = /<input id="demande-reference-garage"[^>]*>/.exec(page)?.[0] ?? ''
    expect(piege).toContain('autocomplete="off"')
    expect(piege).toContain('tabindex="-1"')
    expect(piege).toContain('aria-hidden="true"')
    const nom = /name="([^"]+)"/.exec(piege)?.[1] ?? ''
    expect(nom).not.toMatch(/nom|tel|mail|name|phone/i)
  })
})

describe('envoi d’une demande (US-11, US-12, US-13)', () => {
  it('rendez-vous : redirection vers un jeton aléatoire, récapitulatif, « Ce n’est pas encore une réservation »', async () => {
    const banc = await monter({ mode: 'demonstration' })
    const envoi = await remplirEtEnvoyer(
      banc,
      '/demande?type=rendez-vous&famille=freinage',
      RENDEZ_VOUS,
    )
    expect(envoi.statusCode).toBe(303)
    const adresse = String(envoi.headers.location)
    expect(adresse).toMatch(FORMAT_CONFIRMATION)
    expect(adresse).not.toMatch(/Julie|0612|06%20/)
    const confirmation = await suivre(banc, envoi)
    expect(confirmation.statusCode).toBe(200)
    expect(confirmation.headers['cache-control']).toBe('no-store')
    expect(confirmation.headers['referrer-policy']).toBe('no-referrer')
    const page = confirmation.body
    expect(page).toContain('<meta name="robots" content="noindex">')
    expect(page).toContain(
      insecables(
        'Votre demande est enregistrée. Ce n’est pas encore une réservation : nous vous appelons pour fixer l’heure.',
      ),
    )
    for (const attendu of [
      'Demande de rendez-vous',
      'Freinage',
      'Peugeot 208',
      '<li>Jeudi 17 septembre, matin</li><li>Le plus tôt possible</li>',
      '06 12 34 56 78',
      'En fin de journée',
    ]) {
      expect(page).toContain(attendu)
    }
    expect(page).toContain(
      'BF Auto vous rappelle au numéro indiqué, depuis le <span class="demandes-numero">06 05 92 28 38</span>\u00a0: enregistrez ce numéro pour décrocher.',
    )
  })

  it('la suite annoncée par le garage s’affiche ; sans délai validé, ni jour ni heure (AT-3)', async () => {
    const annonce = await monter({
      mode: 'demonstration',
      dependances: { annoncerRappel: async () => 'Nous vous rappelons jeudi, en fin de journée.' },
    })
    const avec = await suivre(
      annonce,
      await remplirEtEnvoyer(annonce, '/demande?type=rappel', RAPPEL),
    )
    expect(avec.body).toContain('<p>Nous vous rappelons jeudi, en fin de journée.</p>')

    const sans = await monter({ cheminBase: join(dossier, 'autre.sqlite') })
    const page = (await suivre(sans, await remplirEtEnvoyer(sans, '/demande?type=rappel', RAPPEL)))
      .body
    const suite =
      /<div class="message message--succes demandes-suite">([\s\S]*?)<\/div>/.exec(page)?.[1] ?? ''
    expect(suite).toContain('Votre demande de rappel est enregistrée.')
    expect(suite).not.toMatch(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|\d h/i)
    expect(suite).toContain('BF Auto vous rappelle au numéro indiqué.')
    expect(suite).not.toContain('depuis le')
  })

  it('en relecture, le numéro à valider est surligné', async () => {
    const banc = await monter({ mode: 'relecture' })
    const page = (await suivre(banc, await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)))
      .body
    expect(page).toContain(
      `depuis le <mark class="demandes-a-valider" title="Valeur à valider par le garage">${TELEPHONE_GARAGE}</mark>`,
    )
  })

  it('un rappel « Ne roulez pas » rappelle d’appeler l’assistance ou le 112 (US-18)', async () => {
    const banc = await monter()
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    const page = (await suivre(banc, envoi)).body
    expect(page).toContain(
      insecables(
        'Si vous êtes immobilisé ou en danger, n’attendez pas notre rappel : appelez votre assistance ou le 112.',
      ),
    )
    expect(page).toContain('Rappel après pré-diagnostic')
  })

  it('erreurs par champ, reliées et récapitulées, valeurs conservées et échappées, rien d’enregistré', async () => {
    const banc = await monter({ session: true })
    const reponse = await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      prenom: '<b>Julie</b>',
      telephone: '12',
      moment: '',
    })
    expect(reponse.statusCode).toBe(422)
    expect(reponse.headers['cache-control']).toBe('no-store')
    const page = reponse.body
    expect(page).toContain('<title>Erreur\u00a0: Faire une demande de rappel | BF Auto</title>')
    expect(page).toContain('Le formulaire contient 2 erreurs')
    expect(page).toContain(
      `<li><a href="#demande-telephone">${insecables(MESSAGES.telephoneInvalide)}</a></li>`,
    )
    expect(page).toContain(
      'aria-describedby="demande-telephone-aide demande-telephone-erreur" aria-invalid="true"',
    )
    expect(page).toContain('id="demande-moment-erreur"')
    expect(page).toContain('value="&lt;b&gt;Julie&lt;/b&gt;"')
    expect(page).not.toContain('<b>Julie</b>')
    expect(page).toContain('value="souci" checked')
    expect(await listeGaragiste(banc)).toContain('À rappeler (0)')
  })

  it('devis : plaques normalisées ; « 12-AB » et l’absence de véhicule sont refusées avec leur message (US-28)', async () => {
    const banc = await monter()
    const devis = {
      type: 'devis',
      objet: 'reparation',
      prenom: 'Julie',
      telephone: '0612345678',
      moment: 'matin',
    }
    for (const [saisie, attendue] of [
      ['ab123cd', 'plaque AB-123-CD'],
      ['1234 AB 56', 'plaque 1234 AB 56'],
    ] as const) {
      const envoi = await remplirEtEnvoyer(banc, '/demande?type=devis', {
        ...devis,
        plaque: saisie,
      })
      expect(envoi.statusCode).toBe(303)
      expect((await suivre(banc, envoi)).body).toContain(attendue)
    }
    const mauvaise = await remplirEtEnvoyer(banc, '/demande?type=devis', {
      ...devis,
      plaque: '12-AB',
    })
    expect(mauvaise.statusCode).toBe(422)
    expect(mauvaise.body).toContain('AB-123-CD (depuis 2009) ou 1234 AB 56 (ancien format)')
    const sansVehicule = await remplirEtEnvoyer(banc, '/demande?type=devis', devis)
    expect(sansVehicule.statusCode).toBe(422)
    expect(sansVehicule.body).toContain(insecables(MESSAGES.vehicule))
  })

  it('vente au comptoir publiée : « Retrait au garage » ou « Pose à l’atelier », facultatif, rien de pré-coché', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=devis&famille=freinage')).body
    expect(page).toContain('Retrait ou pose')
    for (const [code, libelle] of [
      ['retrait-garage', 'Retrait au garage'],
      ['pose-atelier', 'Pose à l’atelier'],
    ] as const) {
      expect(page).toMatch(new RegExp(`name="modalite" value="${code}"(?![^>]*checked)`))
      expect(page).toContain(libelle)
    }
    expect(page).toContain(
      insecables(
        'Dans les deux cas, nous vérifions que la pièce convient à votre véhicule avant de la commander.',
      ),
    )
    expect((await app.inject('/demande?type=rendez-vous')).body).not.toContain('name="modalite"')
  })

  it('l’adresse pré-coche le retrait ou la pose (paramètre « modalite »), jamais une valeur inconnue', async () => {
    const { app } = await monter()
    const coche = (code: string): RegExp =>
      new RegExp(`name="modalite" value="${code}"[^>]*checked`)
    const retrait = (await app.inject('/demande?type=devis&famille=freinage&modalite=retrait')).body
    expect(retrait).toMatch(coche('retrait-garage'))
    expect(retrait).not.toMatch(coche('pose-atelier'))
    const pose = (await app.inject('/demande?type=devis&famille=freinage&modalite=pose')).body
    expect(pose).toMatch(coche('pose-atelier'))
    expect(pose).not.toMatch(coche('retrait-garage'))
    for (const valeur of ['livraison', 'retrait-garage', '']) {
      const page = (await app.inject(`/demande?type=devis&modalite=${valeur}`)).body
      expect(page, valeur).toContain('name="modalite"')
      expect(page, valeur).not.toMatch(/name="modalite"[^>]*checked/)
    }
    expect((await app.inject('/demande?type=rendez-vous&modalite=pose')).body).not.toContain(
      'name="modalite"',
    )
  })

  it('le choix de retrait suit la demande : confirmation, fiche du garagiste (arbitrage 4)', async () => {
    const banc = await monter({ session: true })
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=devis&famille=freinage', {
      type: 'devis',
      famille: 'freinage',
      plaque: 'AB-123-CD',
      modalite: 'retrait-garage',
      prenom: 'Julie',
      telephone: '0612345678',
      moment: 'matin',
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = (await suivre(banc, envoi)).body
    expect(confirmation).toContain('<dt>Retrait ou pose</dt><dd>Retrait au garage</dd>')
    const liste = await listeGaragiste(banc)
    const fiche = /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(liste)?.[1] ?? ''
    expect((await banc.app.inject(fiche)).body).toContain(
      '<dt>Retrait ou pose</dt><dd>Retrait au garage</dd>',
    )
  })

  it('un choix de retrait inconnu est refusé avec son message ; sans vente publiée, il est ignoré', async () => {
    const devis = {
      type: 'devis',
      objet: 'reparation',
      plaque: 'AB-123-CD',
      prenom: 'Julie',
      telephone: '0612345678',
      moment: 'matin',
    }
    const banc = await monter()
    const inconnu = await remplirEtEnvoyer(banc, '/demande?type=devis', {
      ...devis,
      modalite: 'livraison',
    })
    expect(inconnu.statusCode).toBe(422)
    expect(inconnu.body).toContain(insecables(MESSAGES.modalite))
    const sansVente = await monter({
      dependances: {
        consulterOffrePieces: async () => ({
          engagementVerification: null,
          venteAuComptoir: false,
        }),
      },
    })
    const page = (await sansVente.app.inject('/demande?type=devis')).body
    expect(page).not.toContain('name="modalite"')
    const envoi = await remplirEtEnvoyer(sansVente, '/demande?type=devis', {
      ...devis,
      modalite: 'retrait-garage',
    })
    expect(envoi.statusCode).toBe(303)
    expect((await suivre(sansVente, envoi)).body).not.toContain('Retrait ou pose')
  })

  it('le lien de confirmation modifié d’un caractère répond 404 ; après une heure, page neutre (US-12)', async () => {
    const banc = await monter()
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    const adresse = String(envoi.headers.location)
    const modifiee = `${adresse.slice(0, -1)}${adresse.endsWith('A') ? 'B' : 'A'}`
    expect((await banc.app.inject(modifiee)).statusCode).toBe(404)
    expect((await banc.app.inject('/demande/envoyee')).statusCode).toBe(404)
    banc.horloge.avancer(HEURE_MS + 1)
    const neutre = await banc.app.inject(adresse)
    expect(neutre.statusCode).toBe(200)
    expect(neutre.body).toContain('son récapitulatif n’est plus affiché')
    expect(neutre.body).toContain(
      '<a class="demandes-telephone" href="tel:+33605922838">06 05 92 28 38</a>',
    )
    expect(neutre.body).not.toContain('Julie')
    expect(neutre.body).not.toContain('06 12 34 56 78')
  })
})

describe('anti-abus sans rejet silencieux (D9, US-15, US-47)', () => {
  it('champ piège rempli : « Confirmez l’envoi », valeurs réaffichées ; la confirmation enregistre', async () => {
    const banc = await monter({ session: true })
    const page = await banc.app.inject('/demande?type=rappel')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const suspect = await envoyer(banc, {
      ...RAPPEL,
      jeton: jetonDe(page.body),
      reference_garage: 'robot',
    })
    expect(suspect.statusCode).toBe(200)
    expect(suspect.body).toContain('<h1>Confirmez l’envoi</h1>')
    expect(suspect.body).toContain('value="Julie"')
    expect(suspect.body).toContain('Confirmer l’envoi</button>')
    expect(await listeGaragiste(banc)).toContain('À rappeler (0)')
    const confirme = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(suspect.body) })
    expect(confirme.statusCode).toBe(303)
    expect(await listeGaragiste(banc)).toContain('À rappeler (1)')
  })

  it('un formulaire envoyé 1 seconde après son affichage demande confirmation, sans rien perdre', async () => {
    const banc = await monter()
    const page = await banc.app.inject('/demande?type=rendez-vous')
    banc.horloge.avancer(1_000)
    const reponse = await envoyer(banc, {
      ...RENDEZ_VOUS,
      famille: '',
      objet: 'entretien',
      jeton: jetonDe(page.body),
    })
    expect(reponse.body).toContain('<h1>Confirmez l’envoi</h1>')
    expect(reponse.body).toContain('value="2026-09-17-matin" checked')
    expect(reponse.body).toContain('<option value="peugeot" selected>')
  })

  it('trois envois non confirmés s’affichent dans l’espace garagiste', async () => {
    const banc = await monter({ session: true })
    for (let rang = 0; rang < 3; rang += 1) {
      await envoyer(
        banc,
        { ...RAPPEL, jeton: '', reference_garage: 'robot' },
        {},
        `198.51.100.${rang}`,
      )
    }
    expect(await listeGaragiste(banc)).toContain('3 envois non confirmés cette semaine')
  })

  it('un envoi venu d’un autre site est refusé et rien n’est enregistré', async () => {
    const banc = await monter({ session: true })
    const page = await banc.app.inject('/demande?type=rappel')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const reponse = await envoyer(
      banc,
      { ...RAPPEL, jeton: jetonDe(page.body) },
      { origin: 'https://pirate.exemple' },
    )
    expect(reponse.statusCode).toBe(403)
    expect(reponse.body).toContain('<h1>Demande non envoyée</h1>')
    expect(await listeGaragiste(banc)).toContain('À rappeler (0)')
  })

  it('le même jeton envoyé deux fois ne crée qu’une demande', async () => {
    const banc = await monter({ session: true })
    const page = await banc.app.inject('/demande?type=rappel')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const jeton = jetonDe(page.body)
    const premier = await envoyer(banc, { ...RAPPEL, jeton })
    const second = await envoyer(banc, { ...RAPPEL, jeton })
    expect(second.headers.location).toBe(premier.headers.location)
    expect(await listeGaragiste(banc)).toContain('À rappeler (1)')
  })

  it('retour arrière puis autre demande : l’écran « Confirmez l’envoi » dit pourquoi, et elle part (AE-35)', async () => {
    const banc = await monter({ session: true })
    const page = await banc.app.inject('/demande?type=rappel')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const jeton = jetonDe(page.body)
    const premiere = await envoyer(banc, { ...RAPPEL, jeton })
    expect(premiere.statusCode).toBe(303)
    const seconde = await envoyer(banc, { ...RAPPEL, prenom: 'Karim', jeton })
    expect(seconde.statusCode).toBe(200)
    expect(seconde.body).toContain('<h1>Confirmez l’envoi</h1>')
    expect(seconde.body).toContain('Ce formulaire a déjà servi à envoyer une autre demande')
    expect(seconde.body).toContain('value="Karim"')
    expect(await listeGaragiste(banc)).toContain('À rappeler (1)')
    const confirmee = await envoyer(banc, {
      ...RAPPEL,
      prenom: 'Karim',
      jeton: jetonDe(seconde.body),
    })
    expect(confirmee.statusCode).toBe(303)
    expect(confirmee.headers.location).not.toBe(premiere.headers.location)
    expect((await suivre(banc, confirmee)).body).toContain('<dt>Prénom</dt><dd>Karim</dd>')
    expect(await listeGaragiste(banc)).toContain('À rappeler (2)')
  })

  it('cinq demandes d’une même adresse : la sixième est refusée avec le téléphone du garage', async () => {
    const banc = await monter()
    for (let rang = 0; rang < 5; rang += 1) {
      expect((await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)).statusCode).toBe(303)
    }
    const sixieme = await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    expect(sixieme.statusCode).toBe(429)
    expect(sixieme.body).toContain(TELEPHONE_GARAGE)
  })

  it('six adresses différentes derrière le même serveur passent toutes', async () => {
    const banc = await monter()
    for (let rang = 0; rang < 6; rang += 1) {
      const reponse = await remplirEtEnvoyer(
        banc,
        '/demande?type=rappel',
        RAPPEL,
        `198.51.100.${rang}`,
      )
      expect(reponse.statusCode).toBe(303)
    }
  })

  it('un en-tête X-Forwarded-For forgé ne change pas la clé de limitation', async () => {
    const banc = await monter()
    for (let rang = 0; rang < 5; rang += 1) {
      const page = await banc.app.inject('/demande?type=rappel')
      banc.horloge.avancer(DELAI_HUMAIN_MS)
      await envoyer(
        banc,
        { ...RAPPEL, jeton: jetonDe(page.body) },
        { 'x-forwarded-for': `10.9.9.${rang}` },
      )
    }
    const page = await banc.app.inject('/demande?type=rappel')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const reponse = await envoyer(
      banc,
      { ...RAPPEL, jeton: jetonDe(page.body) },
      { 'x-forwarded-for': '10.9.9.200' },
    )
    expect(reponse.statusCode).toBe(429)
  })
})

describe('notification du garagiste (D5, US-16, US-50)', () => {
  it('serveur de courriel injoignable : demande enregistrée, confirmation normale, fiche marquée, sonde dégradée après 2 h', async () => {
    const banc = await monter({
      session: true,
      dependances: {
        courrielGarage: 'atelier@garage.exemple',
        connecteurs: { ...SANS_CONNECTEURS, expediteur: EXPEDITEUR_INJOIGNABLE },
      },
    })
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    expect(envoi.statusCode).toBe(303)
    expect((await suivre(banc, envoi)).body).toContain('Votre demande de rappel est enregistrée.')
    await vi.waitFor(async () => {
      expect(await listeGaragiste(banc)).toContain('Notification non envoyée')
    })
    expect(await banc.contexte.surveillerNotifications()).toEqual({
      etat: 'ok',
      echecsDurables: 0,
      connecteursEnEchec: [],
    })
    banc.horloge.avancer(2 * HEURE_MS)
    expect(await banc.contexte.surveillerNotifications()).toEqual({
      etat: 'degradee',
      echecsDurables: 1,
      connecteursEnEchec: [],
    })
  })

  it('en démonstration, le message complet part dans la console, « Ne roulez pas » en tête', async () => {
    const console = vi.spyOn(globalThis.console, 'info').mockImplementation(() => undefined)
    const banc = await monter({ mode: 'demonstration' })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    await vi.waitFor(() => expect(console).toHaveBeenCalledTimes(1))
    const texte = String(console.mock.calls[0]?.[0])
    expect(texte).toContain(
      'Objet : Ne roulez pas : Rappel après pré-diagnostic de Julie, 06 12 34 56 78 [BF-',
    )
    expect(texte).toContain('\n\nNe roulez pas : appelez-nous.\n')
    expect(texte).toMatch(/Fiche : https:\/\/garage\.exemple\/garagiste\/demandes\/[0-9a-f-]{36}/)
  })
})

describe('espace garagiste /garagiste/demandes (D5, US-30, US-33)', () => {
  it('sans session : navigation renvoyée vers la connexion, envoi refusé en 401', async () => {
    const { app } = await monter()
    const liste = await app.inject('/garagiste/demandes')
    expect(liste.statusCode).toBe(303)
    expect(liste.headers.location).toBe('/garagiste/connexion?retour=%2Fgaragiste%2Fdemandes')
    const statut = await app.inject({
      method: 'POST',
      url: '/garagiste/demandes/00000000-0000-4000-8000-000000000001/statut',
      headers: { host: HOTE, origin: ORIGINE, 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'statut=traitee',
    })
    expect(statut.statusCode).toBe(401)
  })

  it('liste : à rappeler d’abord, « Ne roulez pas » en tête, appel en un geste, jamais de pourcentage', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Ancienne' })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      prenom: 'Urgente',
      motif: '',
      prediagnostic: 'code-urgent',
    })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Recente' })
    const reponse = await banc.app.inject('/garagiste/demandes')
    expect(reponse.headers['cache-control']).toBe('no-store')
    expect(reponse.headers['x-robots-tag']).toBe('noindex')
    const page = reponse.body
    expect(page).toContain('<meta name="robots" content="noindex">')
    expect(page).toContain('À rappeler (3)')
    const ordre = ['Urgente', 'Recente', 'Ancienne'].map((prenom) => page.indexOf(`>${prenom}</a>`))
    expect(ordre).toEqual([...ordre].sort((a, b) => a - b))
    expect(ordre[0]).toBeGreaterThan(0)
    expect(page.match(/href="tel:\+33612345678"/g)).toHaveLength(3)
    expect(page).toContain('<span class="pastille demandes-pastille--urgente">Ne roulez pas</span>')
    expect(texteVisible(page)).not.toContain('%')
  })

  it('fiche : cas en toutes lettres, première consultation datée une fois, statut changé par un bouton', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    const liste = await listeGaragiste(banc)
    const fiche = /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(liste)?.[1] ?? ''
    banc.horloge.avancer(10 * 60_000)
    const premiere = (await banc.app.inject(fiche)).body
    expect(premiere).toContain(insecables('Appeler Julie au 06 12 34 56 78'))
    expect(premiere).toContain(
      insecables('<dt>La pédale de frein est-elle molle ?</dt><dd>Oui, elle s’enfonce</dd>'),
    )
    expect(premiere).toContain(
      '<dt>Fiche ouverte la première fois</dt><dd>mercredi 16 septembre à\u00a010\u00a0h\u00a010</dd>',
    )
    banc.horloge.avancer(60 * 60_000)
    const seconde = (await banc.app.inject(fiche)).body
    expect(seconde).toContain(
      '<dt>Fiche ouverte la première fois</dt><dd>mercredi 16 septembre à\u00a010\u00a0h\u00a010</dd>',
    )

    // Le formulaire de statut porte le jeton de la session du cookie (anti-falsification partagée).
    const session = { [NOM_COOKIE_SESSION]: 'session-du-garagiste' }
    const pageSession = (await banc.app.inject({ url: fiche, cookies: session })).body
    const jeton = /name="jeton_formulaire" value="([^"]+)"/.exec(pageSession)?.[1] ?? ''
    expect(jeton).not.toBe('')
    const jetonAutreSession =
      PROTECTION_FORMULAIRES_ESSAI.jeton('session-d-un-autre-appareil') ?? ''
    const poster = (champs: Champs, entetes: Record<string, string> = {}) =>
      banc.app.inject({
        method: 'POST',
        url: `${fiche}/statut`,
        cookies: session,
        headers: {
          host: HOTE,
          origin: ORIGINE,
          'content-type': 'application/x-www-form-urlencoded',
          ...entetes,
        },
        payload: corps(champs),
      })
    expect((await poster({ statut: 'traitee' })).statusCode).toBe(403)
    expect((await poster({ statut: 'traitee', jeton_formulaire: 'faux' })).statusCode).toBe(403)
    expect(
      (await poster({ statut: 'traitee', jeton_formulaire: jetonAutreSession })).statusCode,
    ).toBe(403)
    expect(
      (
        await poster(
          { statut: 'traitee', jeton_formulaire: jeton },
          { origin: 'https://pirate.exemple' },
        )
      ).statusCode,
    ).toBe(403)
    expect(await listeGaragiste(banc)).toContain('À rappeler (1)')
    const change = await poster({ statut: 'traitee', jeton_formulaire: jeton })
    expect(change.statusCode).toBe(303)
    const id = fiche.split('/').at(-1) ?? ''
    expect(change.headers.location).toBe(`/garagiste/demandes?fait=traitee&demande=${id}`)
    const apres = await listeGaragiste(banc)
    expect(apres).toContain('À rappeler (0)')
    expect(apres).toContain('Traitées ces 30 derniers jours (1)')
    expect((await banc.app.inject(fiche)).body).toContain(
      '<dt>Statut</dt><dd>Traitée depuis le mercredi 16 septembre à\u00a011\u00a0h\u00a010</dd>',
    )
  })

  it('un identifiant mal formé ou inconnu répond 404', async () => {
    const { app } = await monter({ session: true })
    expect((await app.inject('/garagiste/demandes/1')).statusCode).toBe(404)
    expect(
      (await app.inject('/garagiste/demandes/00000000-0000-4000-8000-000000000009')).statusCode,
    ).toBe(404)
  })
})

describe('bloc « Être rappelé » de l’accueil (D4)', () => {
  it('seul formulaire de l’accueil ; quatre champs obligatoires ; il envoie une vraie demande', async () => {
    const banc = await monter()
    const accueil = await banc.app.inject('/')
    const page = accueil.body
    expect(page).toContain('<div class="accueil__zone accueil__zone--rappel">')
    expect(page.match(/<form /g)).toHaveLength(1)
    const formulaire = /<form[\s\S]*?<\/form>/.exec(page)?.[0] ?? ''
    expect(formulaire).toContain('action="/demande"')
    expect(formulaire).toContain('<input type="hidden" name="type" value="rappel">')
    expect(formulaire.match(/\srequired[\s>]/g)).toHaveLength(4)
    expect(page).toContain('supprime au bout de 12 mois')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const envoi = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(formulaire) })
    expect(envoi.statusCode).toBe(303)
    expect(String(envoi.headers.location)).toMatch(FORMAT_CONFIRMATION)
  })
})

describe('démarrage, persistance et purge (US-34, US-46)', () => {
  it('une demande survit au redémarrage du service', async () => {
    const premier = await monter({ session: true })
    await remplirEtEnvoyer(premier, '/demande?type=rappel', RAPPEL)
    await premier.app.close()
    ouverts.splice(ouverts.indexOf(premier.app), 1)
    const second = await monter({ session: true, cheminBase: premier.cheminBase })
    expect(await listeGaragiste(second)).toContain('À rappeler (1)')
  })

  it('la fiche affiche une réponse non reconnue et une notification non remise, avec son motif (US-C22, US-C23)', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    const fiche =
      /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(await listeGaragiste(banc))?.[1] ?? ''
    const id = fiche.split('/').at(-1) ?? ''
    const depot = creerDepotDemandesSqlite(ouvrirBaseDemandes(banc.cheminBase))
    await depot.noterSuiviCourriel(id, { nature: 'reponse-non-reconnue', le: INSTANT_ESSAI })
    await depot.noterSuiviCourriel(id, {
      nature: 'non-remise',
      le: INSTANT_ESSAI,
      motif: '5.2.2, 552 Mailbox full',
    })
    const page = (await banc.app.inject(fiche)).body
    expect(page).toContain(insecables('Notification non remise : 5.2.2, 552 Mailbox full'))
    expect(page).toContain(
      '<strong>Réponse reçue, non reconnue</strong> le mercredi 16 septembre à\u00a010\u00a0h',
    )
  })

  it('la purge s’exécute au démarrage sur des données datées', async () => {
    const cheminBase = join(dossier, 'datee.sqlite')
    const base = ouvrirBaseDemandes(cheminBase)
    const depot = creerDepotDemandesSqlite(base)
    const contenu = {
      type: 'rappel' as const,
      sujet: { nature: 'motif' as const, motif: 'souci' as const },
      creneaux: [],
      vehicule: null,
      pieces: [],
      gamme: null,
      modalite: null,
      contact: {
        prenom: 'Ancien',
        telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
        moment: 'matin' as const,
      },
      precisions: null,
    }
    const ancienne = new Date(INSTANT_ESSAI.getTime())
    ancienne.setUTCMonth(ancienne.getUTCMonth() - 13)
    await depot.enregistrer(
      creerDemande(contenu, { id: '00000000-0000-4000-8000-000000000001', recueLe: ancienne }),
      { formulaire: 'f1', confirmation: 'c1' },
    )
    await depot.enregistrer(
      creerDemande(
        { ...contenu, contact: { ...contenu.contact, prenom: 'Recent' } },
        {
          id: '00000000-0000-4000-8000-000000000002',
          recueLe: INSTANT_ESSAI,
        },
      ),
      { formulaire: 'f2', confirmation: 'c2' },
    )
    base.close()

    const banc = await monter({ session: true, cheminBase })
    await banc.app.ready()
    const page = await listeGaragiste(banc)
    expect(page).toContain('À rappeler (1)')
    expect(page).toContain('>Recent</a>')
    expect(page).not.toContain('Ancien')
  })

  it('un fichier de paramètres invalide empêche le démarrage', async () => {
    await writeFile(
      join(dossier, 'demandes.json'),
      JSON.stringify({ numero_rappel: { statut: 'oui' } }),
    )
    await expect(monter({ dependances: { cheminDonnees: dossier } })).rejects.toThrow(
      /Données des demandes invalides/,
    )
  })
})

describe('échappement des saisies sur toutes les pages qui les montrent (piège 40)', () => {
  it('prénom et précisions piégés restent du texte : confirmation, liste et fiche du garagiste', async () => {
    const banc = await monter({ session: true })
    const prenom = '<img src=x onerror=alert(1)>'
    const precisions = '<script>alert(2)</script> & "guillemets"'
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      prenom,
      precisions,
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = (await suivre(banc, envoi)).body
    const liste = await listeGaragiste(banc)
    const fiche = /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(liste)?.[1] ?? ''
    const pageFiche = (await banc.app.inject(fiche)).body
    for (const [nom, page] of [
      ['confirmation', confirmation],
      ['liste', liste],
      ['fiche', pageFiche],
    ] as const) {
      expect(page, nom).not.toContain('<img src=x')
      expect(page, nom).not.toContain('<script>alert(2)')
      expect(page, nom).toContain('&lt;img src=x onerror=alert(1)&gt;')
    }
    for (const page of [confirmation, pageFiche]) {
      expect(page).toContain('&lt;script&gt;alert(2)&lt;/script&gt; &amp; &quot;guillemets&quot;')
    }
  })
})

/** Texte du contenu principal d'une page, balises retirées. */
function texteDuContenu(page: string): string {
  const principal = /<main[^>]*>([\s\S]*?)<\/main>/.exec(page)?.[1] ?? page
  return principal.replace(/<[^>]*>/g, '')
}

/** Une espace ordinaire avant « ? ! ; : » » ou après « « » : le signe peut commencer une ligne. */
const ESPACE_SECABLE_MAL_PLACEE = /.{0,30}(?: [?!;:»]|« ).{0,10}/

describe('typographie française : aucun signe en début de ligne (espaces insécables)', () => {
  it('formulaires, erreurs, confirmations, refus et espace garagiste', async () => {
    const banc = await monter({
      mode: 'demonstration',
      session: true,
      dependances: {
        annoncerRappel: async () => 'Nous vous rappelons jeudi : en fin de journée.',
        courrielGarage: 'atelier@garage.exemple',
        connecteurs: { ...SANS_CONNECTEURS, expediteur: EXPEDITEUR_INJOIGNABLE },
      },
    })
    const pages = new Map<string, string>()
    for (const adresse of [
      '/demande?type=rendez-vous',
      '/demande?type=devis',
      '/demande?type=rappel',
      '/demande?type=devis&famille=freinage',
      '/demande?type=rappel&prediagnostic=code-urgent',
    ]) {
      pages.set(adresse, (await banc.app.inject(adresse)).body)
    }
    const erreurs = await remplirEtEnvoyer(banc, '/demande?type=devis', {
      type: 'devis',
      plaque: '12-AB',
      marque: 'inconnue',
      telephone: '12',
      precisions: 'x'.repeat(600),
    })
    pages.set('erreurs du devis', erreurs.body)
    const sansVehicule = await remplirEtEnvoyer(banc, '/demande?type=rendez-vous', {
      type: 'devis',
      creneaux: ['perime'],
    })
    pages.set('erreurs sans véhicule', sansVehicule.body)
    const suspect = await envoyer(banc, { ...RAPPEL, jeton: '', reference_garage: 'robot' })
    pages.set('confirmez l’envoi', suspect.body)
    const urgente = await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    const confirmation = await suivre(banc, urgente)
    pages.set('confirmation', confirmation.body)
    const rendezVous = await remplirEtEnvoyer(
      banc,
      '/demande?type=rendez-vous&famille=freinage',
      RENDEZ_VOUS,
    )
    pages.set('confirmation du rendez-vous', (await suivre(banc, rendezVous)).body)
    const origine = await envoyer(banc, RAPPEL, { origin: 'https://pirate.exemple' })
    pages.set('origine refusée', origine.body)
    await vi.waitFor(async () => {
      expect(await listeGaragiste(banc)).toContain('Notification non envoyée')
    })
    const liste = await listeGaragiste(banc)
    pages.set('liste du garagiste', liste)
    for (const fiche of liste.match(/\/garagiste\/demandes\/[0-9a-f-]{36}/g) ?? []) {
      pages.set(fiche, (await banc.app.inject(fiche)).body)
    }
    banc.horloge.avancer(HEURE_MS + 1)
    pages.set('confirmation neutre', (await suivre(banc, urgente)).body)
    const accueil = (await banc.app.inject('/')).body
    pages.set(
      'accueil',
      /<section class="demandes-rappel"[\s\S]*?<\/section>/.exec(accueil)?.[0] ?? '',
    )

    expect(pages.get('erreurs du devis')).toContain('Le formulaire contient')
    expect(pages.get('/demande?type=rappel&prediagnostic=code-urgent')).toContain(
      'La pédale de frein est-elle molle',
    )
    expect(pages.get('confirmation')).toContain('Nous vous rappelons jeudi')
    for (const [nom, page] of pages) {
      expect(page, nom).not.toBe('')
      expect(ESPACE_SECABLE_MAL_PLACEE.exec(texteDuContenu(page))?.[0] ?? null, nom).toBeNull()
    }
  })

  it('la limite atteinte le dit aussi en typographie française', async () => {
    const banc = await monter()
    for (let rang = 0; rang < 5; rang += 1) {
      await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    }
    const sixieme = await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    expect(sixieme.statusCode).toBe(429)
    expect(ESPACE_SECABLE_MAL_PLACEE.exec(texteDuContenu(sixieme.body))?.[0] ?? null).toBeNull()
  })
})

describe('système de design (docs/design/composants.md)', () => {
  /** Balise ouvrante de l'élément qui porte l'attribut donné. */
  const baliseDe = (page: string, attribut: string): string =>
    new RegExp(`<[^>]*${attribut}[^>]*>`).exec(page)?.[0] ?? ''

  it('/demande : en-tête de page, fil d’Ariane, formulaire en panneau, choix en tuiles, aucune liste pour un choix court', async () => {
    const { app } = await monter()
    for (const adresse of [
      '/demande?type=rendez-vous',
      '/demande?type=devis&famille=freinage',
      '/demande?type=rappel',
    ]) {
      const page = (await app.inject(adresse)).body
      expect(page, adresse).toContain('<div class="entete-page">')
      expect(page, adresse).toContain(
        '<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a aria-current="page">Faire une demande</a></li></ol></nav>',
      )
      expect(page, adresse).toContain('<form class="demandes-formulaire panneau"')
      expect(page, adresse).toContain(
        '<fieldset class="champ demandes-groupe" id="demande-moment">',
      )
      expect(page, adresse).not.toContain('id="demande-moment" name="moment"')
      expect(page, adresse).not.toMatch(/class="choix"|demandes-groupe__cases/)
      // Le bouton principal envoie ; aucun autre bouton d'envoi dans le formulaire.
      const formulaire = /<form class="demandes-formulaire[\s\S]*?<\/form>/.exec(page)?.[0] ?? ''
      expect(formulaire.match(/type="submit"/g), adresse).toHaveLength(1)
      expect(formulaire).toContain('class="bouton bouton--principal demandes-envoi__bouton"')
    }
    const rendezVous = (await app.inject('/demande?type=rendez-vous')).body
    expect(rendezVous).toContain(
      '<label class="choix-tuile demandes-jour__case demandes-jour__case--matin" for="demande-creneaux-1">\n      <input type="checkbox" id="demande-creneaux-1" name="creneaux" value="2026-09-17-matin" aria-invalid="false">',
    )
    const rappel = (await app.inject('/demande?type=rappel')).body
    expect(rappel).toContain(
      '<input type="radio" id="demande-motif-1" name="motif" value="souci" aria-invalid="false" required>',
    )
    const devis = (await app.inject('/demande?type=devis&famille=freinage')).body
    expect(devis).toContain('<span>Retrait au garage</span>')
    expect(devis).toContain(`<span>${insecables('Pose à l’atelier')}</span>`)
  })

  it('aide et erreur sous la saisie, comme dans la bibliothèque ; sous la légende dans un groupe', async () => {
    const banc = await monter()
    const page = (
      await remplirEtEnvoyer(banc, '/demande?type=rappel', {
        ...RAPPEL,
        telephone: '12',
        moment: '',
      })
    ).body
    const saisie = page.indexOf('<input class="champ__saisie" id="demande-telephone"')
    expect(saisie).toBeGreaterThan(0)
    expect(page.indexOf('id="demande-telephone-aide"')).toBeGreaterThan(saisie)
    expect(page.indexOf('id="demande-telephone-erreur"')).toBeGreaterThan(
      page.indexOf('id="demande-telephone-aide"'),
    )
    const legende = page.indexOf(insecables('Quand pouvez-vous répondre au téléphone ?</legend>'))
    expect(page.indexOf('id="demande-moment-erreur"')).toBeGreaterThan(legende)
    expect(page.indexOf('id="demande-moment-erreur"')).toBeLessThan(
      page.indexOf('id="demande-moment-1"'),
    )
  })

  it('le type de demande se choisit par trois boutons de choix, le courant marqué', async () => {
    const { app } = await monter()
    const page = (await app.inject('/demande?type=devis')).body
    const types =
      /<div class="demandes-types" id="demande-types" role="group" aria-label="Type de demande">[\s\S]*?<\/div>/.exec(
        page,
      )?.[0] ?? ''
    expect(types.match(/class="bouton-choix demandes-types__lien"/g)).toHaveLength(3)
    expect(types.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(baliseDe(types, 'aria-pressed="true"')).toContain('value="devis"')
    // Chaque bouton envoie le formulaire, même posé hors de lui, dans l'en-tête de page.
    expect(types.match(/form="demande-formulaire" name="changer_type"/g)).toHaveLength(3)
  })

  it('une erreur de choix est reliée à son groupe et marque chaque tuile', async () => {
    const banc = await monter()
    const page = (await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, moment: '' }))
      .body
    expect(page).toContain(
      '<fieldset class="champ demandes-groupe" id="demande-moment" aria-describedby="demande-moment-erreur">',
    )
    expect(page.match(/name="moment" value="[^"]+" aria-invalid="true"/g)).toHaveLength(4)
    expect(page).toContain('<li><a href="#demande-moment-1">')
  })

  it('confirmation : en-tête de page, récapitulatif en panneau, « Ne roulez pas » en alerte rouge', async () => {
    const banc = await monter()
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    const page = (await suivre(banc, envoi)).body
    expect(page).toContain('<div class="entete-page">')
    expect(page).toContain('<p class="surtitre">Rappel après pré-diagnostic</p>')
    expect(page).toContain(
      '<section class="panneau" aria-labelledby="demandes-recapitulatif-titre">',
    )
    expect(page).toContain('<div class="alerte alerte--danger">')
    expect(page).toContain(insecables('Pour modifier ou annuler votre demande, appelez le garage'))
  })

  it('accueil : « Être rappelé » sans cadre propre (l’accueil pose le panneau), moment en tuiles', async () => {
    const { app } = await monter()
    const accueil = (await app.inject('/')).body
    const bloc = /<section class="demandes-rappel"[\s\S]*?<\/form>/.exec(accueil)?.[0] ?? ''
    expect(bloc).not.toBe('')
    expect(bloc).not.toMatch(/class="(carte|panneau)[\s"]/)
    expect(bloc.match(/class="choix-tuile"/g)).toHaveLength(4)
    expect(bloc).toContain('<div class="liste-choix">')
    expect(bloc).toContain('class="bouton bouton--principal demandes-rappel__bouton"')
  })

  it('espace garagiste : en-tête de page, cartes en panneaux, traitées en tableau, jamais de barre fixe', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Traitee' })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Attente' })
    const liste = await listeGaragiste(banc)
    const fiches = liste.match(/\/garagiste\/demandes\/[0-9a-f-]{36}/g) ?? []
    const session = { [NOM_COOKIE_SESSION]: 'session-du-garagiste' }
    const fiche = (await banc.app.inject({ url: fiches[0] ?? '', cookies: session })).body
    const jeton = /name="jeton_formulaire" value="([^"]+)"/.exec(fiche)?.[1] ?? ''
    const change = await banc.app.inject({
      method: 'POST',
      url: `${fiches[0] ?? ''}/statut`,
      cookies: session,
      headers: { host: HOTE, origin: ORIGINE, 'content-type': 'application/x-www-form-urlencoded' },
      payload: corps({ statut: 'traitee', jeton_formulaire: jeton }),
    })
    expect(change.statusCode).toBe(303)

    const apres = await listeGaragiste(banc)
    expect(apres).toContain(
      '<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a href="/garagiste">Espace garagiste</a></li><li><a aria-current="page">Demandes reçues</a></li></ol></nav>',
    )
    expect(apres).toMatch(
      /<li class="panneau demandes-carte" aria-labelledby="demande-[0-9a-f-]{36}">/,
    )
    expect(apres).toContain('<table class="tableau-tarifs demandes-tableau">')
    expect(apres).toMatch(
      /<th scope="row"><a href="\/garagiste\/demandes\/[0-9a-f-]{36}">Attente<\/a><\/th>/,
    )
    expect(apres).not.toContain('barre-fixe')

    const pageFiche = (await banc.app.inject(fiches[1] ?? '')).body
    expect(pageFiche).toContain('<div class="entete-page">')
    expect(pageFiche).toContain(
      '<aside class="panneau demandes-aparte" aria-labelledby="fiche-suivi-titre">',
    )
    expect(pageFiche).toContain(
      '<section class="panneau demandes-actions" aria-labelledby="fiche-actions-titre">',
    )
    expect(pageFiche).not.toContain('barre-fixe')
    // Sans envoi suspect, pas d'explication qui repousse la liste.
    expect(apres).toContain('<strong>Aucun envoi non confirmé cette semaine.</strong></p>')
  })

  it('fiche d’un pré-diagnostic : la conduite à tenir avant le reste, le type une seule fois en tête', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
    })
    const liste = await listeGaragiste(banc)
    const fiche = /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(liste)?.[1] ?? ''
    const page = (await banc.app.inject(fiche)).body
    expect(page.indexOf('<div class="alerte alerte--danger">')).toBeGreaterThan(0)
    expect(page.indexOf('<div class="alerte alerte--danger">')).toBeLessThan(
      page.indexOf('id="fiche-demande-titre"'),
    )
    // La consigne de sécurité s'adresse au client : la fiche ne la reprend pas.
    expect(page).not.toContain('appelez votre assistance ou le 112')
    const entete = /<div class="entete-page">[\s\S]*?<\/div>\n<\/div>/.exec(page)?.[0] ?? ''
    expect(entete.match(/Rappel après pré-diagnostic/g)).toHaveLength(1)
  })
})

describe('corrections du jury, passe 1 : parcours du client', () => {
  /** Tel que le pré-diagnostic le transmet : la première réponse dit le symptôme, la conclusion s'ouvre sur le verdict. */
  const RESUME_FREINAGE = {
    symptome: { identifiant: 'freinage', libelle: 'Le freinage a changé' },
    reponses: [
      { question: 'Que remarquez-vous ?', reponse: 'Le freinage a changé' },
      {
        question: 'Remarquez-vous l’un de ces signes ?',
        reponse: 'La pédale de frein est molle ou s’enfonce',
      },
    ],
    urgence: 'ne-pas-rouler' as const,
    conclusion:
      'Ne roulez pas : appelez-nous. Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.',
  }
  const avecFreinage: Partial<DependancesDemandes> = {
    retrouverResumePreDiagnostic: async (code) =>
      code === 'code-frein' ? RESUME_FREINAGE : code === 'code-urgent' ? resumeEssai() : null,
  }
  const principal = (page: string): string => /<main[\s\S]*?<\/main>/.exec(page)?.[0] ?? ''
  const occurrences = (texte: string, cherche: string): number => texte.split(cherche).length - 1

  it('rappel après pré-diagnostic : coordonnées d’abord, résumé replié ensuite sans redite, conduite en une ligne (J1)', async () => {
    const { app } = await monter({ dependances: avecFreinage })
    const page = principal((await app.inject('/demande?type=rappel&prediagnostic=code-frein')).body)
    const rang = (motif: string): number => page.indexOf(motif)
    const ordre = [
      'class="demandes-conduite"',
      'id="demande-prenom"',
      'id="demande-telephone"',
      'id="demande-moment"',
      '<details class="volet demandes-volet">',
      'id="demande-precisions"',
      'id="demande-marque"',
      'demandes-envoi__bouton',
    ].map(rang)
    expect(ordre.every((position) => position > 0)).toBe(true)
    expect(ordre).toEqual([...ordre].sort((a, b) => a - b))
    // Replié par défaut : rien de l'attribut open.
    expect(page).not.toMatch(/<details class="volet demandes-volet" open/)
    // La conduite à tenir : une seule ligne, le titre de l'alerte, sans paragraphe de plus.
    const conduite = /<div class="demandes-conduite">[\s\S]*?<\/div><\/div>/.exec(page)?.[0] ?? ''
    expect(conduite).toContain(insecables('Ne roulez pas : appelez-nous'))
    expect(conduite.match(/<p/g)).toHaveLength(1)
    // Ni le symptôme ni le verdict ne se répètent.
    expect(occurrences(page, 'Le freinage a changé')).toBe(1)
    expect(occurrences(page, 'Ne roulez pas')).toBe(1)
    expect(page).not.toContain('<dt>Symptôme</dt>')
    expect(page).toContain(
      insecables(
        'Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.',
      ),
    )
    // La phrase de sécurité reste, après le bouton ; trois champs obligatoires.
    expect(rang(insecables('n’attendez pas notre rappel'))).toBeGreaterThan(
      rang('demandes-envoi__bouton'),
    )
    expect(page.match(/\srequired[\s>]/g)).toHaveLength(3)
    // Pas de chapeau redondant avec « Trois champs à remplir » : les coordonnées remontent.
    expect(page).not.toContain('<p class="texte-intro">')
    expect(page).toContain(insecables('Trois champs à remplir : votre prénom'))
  })

  it('« Confirmez l’envoi » : deux lignes de résumé puis le bouton, le formulaire complet replié dessous (J1)', async () => {
    const banc = await monter()
    const page = await banc.app.inject('/demande?type=rappel')
    // Envoyé sans délai humain : l'anti-abus demande confirmation.
    const reponse = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(page.body) })
    expect(reponse.statusCode).toBe(200)
    const contenu = principal(reponse.body)
    expect(reponse.body).toContain('<title>Confirmez l’envoi | BF Auto</title>')
    expect(contenu).toContain('<dt>Rappel</dt><dd>Un souci avec ma voiture</dd>')
    expect(contenu).toContain(
      '<dt>Coordonnées</dt><dd>Julie, <span class="demandes-numero">06 12 34 56 78</span>, rappel souhaité le matin</dd>',
    )
    // Un seul bouton « Confirmer l’envoi » (J6, passe 2 du jury).
    expect(contenu.split('Confirmer l’envoi</button>')).toHaveLength(2)
    const bouton = contenu.indexOf('Confirmer l’envoi</button>')
    const volet = contenu.indexOf('<details class="volet demandes-volet panneau">')
    expect(bouton).toBeGreaterThan(0)
    expect(bouton).toBeLessThan(volet)
    expect(volet).toBeLessThan(contenu.indexOf('id="demande-prenom"'))
    expect(contenu).toContain('value="Julie"')
    expect(contenu).not.toContain('name="changer_type"')
    // La confirmation part avec les champs du volet, même replié.
    const confirme = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(reponse.body) })
    expect(confirme.statusCode).toBe(303)
    expect(confirme.headers.location).toMatch(FORMAT_CONFIRMATION)
  })

  it('changer de type garde prénom, téléphone, moment, précisions et véhicule ; rien n’est enregistré ni compté (J2)', async () => {
    const banc = await monter({ session: true })
    const depart = await banc.app.inject('/demande?type=devis&famille=freinage')
    const jeton = jetonDe(depart.body)
    const saisie: Champs = {
      type: 'devis',
      famille: 'freinage',
      prenom: 'Léa',
      telephone: '06 12 34 56 78',
      moment: 'matin',
      precisions: 'Bruit à l’avant',
      marque: 'peugeot',
      modele: '208',
      plaque: 'AB-123-CD',
    }
    const vers = async (type: string, champs: Champs = saisie) =>
      (await envoyer(banc, { ...champs, jeton, changer_type: type })).body
    const rendezVous = await vers('rendez-vous')
    expect(rendezVous).toContain(
      'name="changer_type" value="rendez-vous" aria-pressed="true" autofocus>',
    )
    expect(rendezVous).toContain('<title>Faire une demande de rendez-vous | BF Auto</title>')
    expect(rendezVous).toContain('value="Léa"')
    expect(rendezVous).toContain('value="06 12 34 56 78"')
    expect(rendezVous).toContain('value="matin" checked')
    expect(rendezVous).toContain('>Bruit à l’avant</textarea>')
    expect(rendezVous).toContain('<option value="peugeot" selected>')
    expect(rendezVous).toContain('value="208"')
    expect(rendezVous).toContain('<strong>Freinage</strong>')
    expect(jetonDe(rendezVous)).toBe(jeton)
    // Le rappel n'a pas l'usage de la famille, mais la garde pour le retour au devis.
    const rappel = await vers('rappel', { ...saisie, type: 'rendez-vous' })
    expect(rappel).toContain('<input type="hidden" name="famille" value="freinage">')
    expect(rappel).toContain('value="Léa"')
    const retour = await vers('devis', { ...saisie, type: 'rappel' })
    expect(retour).toContain('<strong>Freinage</strong>')
    // Six changements de type : ni demande enregistrée, ni envoi compté dans la limite.
    for (const type of ['devis', 'rappel', 'rendez-vous']) await vers(type)
    expect(await listeGaragiste(banc)).toContain('À rappeler (0)')
    banc.horloge.avancer(DELAI_HUMAIN_MS)
    const envoi = await envoyer(banc, { ...saisie, jeton })
    expect(envoi.statusCode).toBe(303)
  })

  it('le pré-diagnostic reste attaché au formulaire d’un type à l’autre, jamais un code inconnu (J2)', async () => {
    const banc = await monter({ dependances: avecFreinage })
    const depart = await banc.app.inject('/demande?type=rappel&prediagnostic=code-frein')
    const jeton = jetonDe(depart.body)
    const devis = await envoyer(banc, {
      type: 'rappel',
      prediagnostic: 'code-frein',
      prenom: 'Karim',
      jeton,
      changer_type: 'devis',
    })
    expect(devis.body).toContain('<input type="hidden" name="prediagnostic" value="code-frein">')
    expect(devis.body).not.toContain('class="demandes-conduite"')
    const retour = await envoyer(banc, {
      type: 'devis',
      prediagnostic: 'code-frein',
      prenom: 'Karim',
      jeton,
      changer_type: 'rappel',
    })
    expect(retour.body).toContain('class="demandes-conduite"')
    expect(retour.body).toContain('value="Karim"')
    const inconnu = await envoyer(banc, {
      type: 'rappel',
      prediagnostic: 'Appelez-le-0899',
      jeton,
      changer_type: 'devis',
    })
    expect(inconnu.body).not.toContain('Appelez-le-0899')
  })

  it('créneaux : une ligne par jour, le matin et l’après-midi chacun dans sa colonne, même après un samedi sans après-midi (J3)', async () => {
    const { app } = await monter({
      dependances: {
        proposerDemiJournees: async () => [
          { code: '2026-09-25-matin', libelle: 'Vendredi 25 septembre, matin' },
          { code: '2026-09-25-apres-midi', libelle: 'Vendredi 25 septembre, après-midi' },
          { code: '2026-09-26-matin', libelle: 'Samedi 26 septembre, matin' },
          { code: '2026-09-28-matin', libelle: 'Lundi 28 septembre, matin' },
          { code: '2026-09-28-apres-midi', libelle: 'Lundi 28 septembre, après-midi' },
        ],
      },
    })
    const page = (await app.inject('/demande?type=rendez-vous')).body
    const jours = page.match(/<div class="demandes-jour">[\s\S]*?\n {2}<\/div>/g) ?? []
    expect(jours).toHaveLength(3)
    const [vendredi = '', samedi = '', lundi = ''] = jours
    expect(vendredi).toContain('demandes-jour__case--matin" for="demande-creneaux-1"')
    expect(vendredi).toContain('demandes-jour__case--apres-midi" for="demande-creneaux-2"')
    expect(samedi).toContain('>Samedi 26 septembre</p>')
    expect(samedi).toContain('demandes-jour__case--matin')
    expect(samedi).not.toContain('demandes-jour__case--apres-midi')
    // Après le samedi, lundi matin reste dans la colonne du matin : plus de zigzag.
    expect(lundi).toContain('demandes-jour__case--matin" for="demande-creneaux-4"')
    expect(lundi).toContain('value="2026-09-28-apres-midi"')
    expect(page).toContain('<span>Le plus tôt possible</span>')
    expect(page).toContain('id="demande-creneaux-6" name="creneaux" value="le-plus-tot"')
  })

  it('créneaux au libellé inattendu : la liste simple, rien ne se perd', async () => {
    const { app } = await monter({
      dependances: {
        proposerDemiJournees: async () => [{ code: 'bientot', libelle: 'Bientôt' }],
      },
    })
    const page = (await app.inject('/demande?type=rendez-vous')).body
    expect(page).not.toContain('class="demandes-jour"')
    expect(page).toContain('<span>Bientôt</span>')
  })

  it('accessibilité : « invalide » seulement après une erreur ; résumé d’erreurs en groupe nommé, focalisé (J5)', async () => {
    const banc = await monter()
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      const page = principal((await banc.app.inject(`/demande?type=${type}`)).body)
      const champs = page.match(/<(input|select|textarea) [^>]*>/g) ?? []
      const visibles = champs.filter(
        (champ) => !/type="hidden"|name="reference_garage"/.test(champ),
      )
      expect(visibles.length, type).toBeGreaterThan(4)
      for (const champ of visibles) expect(champ, type).toContain('aria-invalid="false"')
      expect(page, type).not.toContain('aria-invalid="true"')
    }
    const erreur = await remplirEtEnvoyer(banc, '/demande?type=devis', { ...RAPPEL, type: 'devis' })
    expect(erreur.body).toContain(
      '<div class="message message--erreur demandes-erreurs" id="demande-erreurs" role="group" tabindex="-1" autofocus aria-labelledby="demande-erreurs-titre">',
    )
    expect(erreur.body).toContain('<h2 class="demandes-erreurs__titre" id="demande-erreurs-titre">')
    expect(erreur.body).toContain(
      'id="demande-objet" name="objet" aria-describedby="demande-objet-erreur" aria-invalid="true" required',
    )
  })

  it('demande de prix d’une famille : cases des pièces et « Je ne sais pas », transmises au garagiste (J6)', async () => {
    const console = vi.spyOn(globalThis.console, 'info').mockImplementation(() => undefined)
    const banc = await monter({
      mode: 'demonstration',
      session: true,
      dependances: {
        trouverFamille: async (identifiant) =>
          identifiant === 'freinage'
            ? { ...FAMILLE_ESSAI, pieces: ['Plaquettes avant', 'Disques avant', 'Étriers'] }
            : null,
      },
    })
    const formulaire = (await banc.app.inject('/demande?type=devis&famille=freinage')).body
    expect(formulaire).toContain(insecables('Quelles pièces ?'))
    for (const piece of ['Plaquettes avant', 'Disques avant', 'Étriers', 'Je ne sais pas']) {
      expect(formulaire).toContain(`<span>${piece}</span>`)
    }
    expect(formulaire).toContain('name="pieces" value="je-ne-sais-pas"')
    // Rien de proposé sans pièces publiées, ni hors d'un devis.
    expect((await banc.app.inject('/demande?type=devis')).body).not.toContain('name="pieces"')
    expect(
      (await banc.app.inject('/demande?type=rendez-vous&famille=freinage')).body,
    ).not.toContain('name="pieces"')

    const devis: Champs = {
      type: 'devis',
      famille: 'freinage',
      plaque: 'AB-123-CD',
      prenom: 'Léa',
      telephone: '06 12 34 56 78',
      moment: 'matin',
    }
    const faussee = await remplirEtEnvoyer(banc, '/demande?type=devis&famille=freinage', {
      ...devis,
      pieces: ['Pot d’échappement'],
    })
    expect(faussee.statusCode).toBe(422)
    expect(faussee.body).toContain(insecables(MESSAGES.pieces))

    const envoi = await remplirEtEnvoyer(banc, '/demande?type=devis&famille=freinage', {
      ...devis,
      pieces: ['je-ne-sais-pas', 'Plaquettes avant'],
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = (await suivre(banc, envoi)).body
    expect(confirmation).toContain(
      '<dt>Pièces concernées</dt><dd>Plaquettes avant, Je ne sais pas</dd>',
    )
    const fiche =
      /href="(\/garagiste\/demandes\/[0-9a-f-]{36})"/.exec(await listeGaragiste(banc))?.[1] ?? ''
    expect((await banc.app.inject(fiche)).body).toContain(
      '<dt>Pièces concernées</dt><dd>Plaquettes avant, Je ne sais pas</dd>',
    )
    await vi.waitFor(() => expect(console).toHaveBeenCalled())
    expect(String(console.mock.calls.at(-1)?.[0])).toContain(
      'Pièces concernées : Plaquettes avant, Je ne sais pas',
    )
  })

  it('barre fixe basse masquée sur les formulaires, « Confirmez l’envoi » et la confirmation ; l’appel de l’en-tête reste (J1)', async () => {
    const banc = await monter()
    const BARRE = '<nav class="barre-fixe'
    const sansBarre = (page: string, etape: string) => {
      expect(page, etape).not.toContain(BARRE)
      expect(page, etape).toContain('<a class="bouton-appel" href="tel:+33605922838">')
    }
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      sansBarre((await banc.app.inject(`/demande?type=${type}`)).body, type)
    }
    const page = await banc.app.inject('/demande?type=rappel')
    const erreurs = await envoyer(banc, { type: 'rappel', jeton: jetonDe(page.body) })
    expect(erreurs.statusCode).toBe(422)
    sansBarre(erreurs.body, 'saisie en erreur')
    // Envoyé sans délai humain : l'anti-abus demande confirmation.
    const aConfirmer = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(erreurs.body) })
    expect(aConfirmer.body).toContain('<h1>Confirmez l’envoi</h1>')
    sansBarre(aConfirmer.body, 'Confirmez l’envoi')
    const confirme = await envoyer(banc, { ...RAPPEL, jeton: jetonDe(aConfirmer.body) })
    const confirmation = await suivre(banc, confirme)
    expect(confirmation.body).toContain('Votre demande de rappel est enregistrée.')
    sansBarre(confirmation.body, 'confirmation')
    // Lien de confirmation de plus d'une heure : même page, même règle.
    banc.horloge.avancer(HEURE_MS + 1)
    const neutre = await suivre(banc, confirme)
    expect(neutre.body).toContain('son récapitulatif n’est plus affiché')
    sansBarre(neutre.body, 'confirmation neutre')
    // Témoin : une page publique du contexte qui ne la masque pas la garde.
    const refus = await envoyer(banc, RAPPEL, { origin: 'https://autre-site.exemple' })
    expect(refus.statusCode).toBe(403)
    expect(refus.body).toContain(BARRE)
  })
})

describe('corrections du jury, passe 1 : espace garagiste (J4)', () => {
  const SESSION = { [NOM_COOKIE_SESSION]: 'session-du-garagiste' }
  const lire = async (banc: Banc, url: string): Promise<string> =>
    (await banc.app.inject({ url, cookies: SESSION })).body
  const poster = (banc: Banc, url: string, champs: Champs) =>
    banc.app.inject({
      method: 'POST',
      url,
      cookies: SESSION,
      headers: { host: HOTE, origin: ORIGINE, 'content-type': 'application/x-www-form-urlencoded' },
      payload: corps(champs),
    })
  const jetonDeSession = (page: string): string =>
    /name="jeton_formulaire" value="([^"]+)"/.exec(page)?.[1] ?? ''
  const fiches = (page: string): string[] => [
    ...new Set(page.match(/\/garagiste\/demandes\/[0-9a-f-]{36}(?=")/g) ?? []),
  ]
  /** Promesse du garage d'essai : la première demi-journée voulue de DEMI_JOURNEES_ESSAI. */
  const avecPromesse: Partial<DependancesDemandes> = {
    annoncerRappel: async (_envoi, moment) =>
      moment === 'fin-de-journee' ? 'Nous vous rappelons jeudi, en fin de journée.' : null,
  }

  it('la promesse faite au client, sur sa confirmation, la carte et la fiche du garagiste', async () => {
    const banc = await monter({ session: true, dependances: avecPromesse })
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      moment: 'fin-de-journee',
    })
    expect((await suivre(banc, envoi)).body).toContain(
      insecables('Nous vous rappelons jeudi, en fin de journée.'),
    )
    const liste = await lire(banc, '/garagiste/demandes')
    expect(liste).toContain(
      insecables('<strong>Promis au client : jeudi 17 septembre, en fin de journée</strong>'),
    )
    const fiche = await lire(banc, fiches(liste)[0] ?? '')
    const actions =
      /<section class="panneau demandes-actions"[\s\S]*?<\/section>/.exec(fiche)?.[0] ?? ''
    expect(actions).toContain(
      insecables('Promis au client : jeudi 17 septembre, en fin de journée'),
    )
    expect(fiche).toContain(
      insecables('<dt>Promis au client</dt><dd>Nous vous rappelons jeudi, en fin de journée.</dd>'),
    )
    // Le jour même, la promesse se lit « aujourd'hui ».
    banc.horloge.regler(new Date('2026-09-17T07:00:00.000Z'))
    expect(await lire(banc, '/garagiste/demandes')).toContain(
      insecables('Promis au client : aujourd’hui, en fin de journée'),
    )
    // Rien de promis : aucune ligne.
    const muet = await monter({ session: true, cheminBase: join(dossier, 'muet.sqlite') })
    await remplirEtEnvoyer(muet, '/demande?type=rappel', RAPPEL)
    expect(await lire(muet, '/garagiste/demandes')).not.toContain('Promis au client')
  })

  it('« Traitée » et « Pas de réponse » en haut de la fiche, sans défiler ; retour à la liste avec compte rendu', async () => {
    const banc = await monter({
      session: true,
      dependances: { retrouverResumePreDiagnostic: async () => resumeEssai() },
    })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
      precisions: 'Pédale au plancher depuis hier',
    })
    const adresse = fiches(await lire(banc, '/garagiste/demandes'))[0] ?? ''
    const id = adresse.split('/').at(-1) ?? ''
    const fiche = await lire(banc, adresse)
    const position = (motif: string) => fiche.indexOf(motif)
    // Les trois gestes avant le cas, les précisions du client avant le pré-diagnostic détaillé.
    expect(position('Pas de réponse</button>')).toBeGreaterThan(0)
    expect(position(insecables('Marquer « Traitée »'))).toBeGreaterThan(
      position('Pas de réponse</button>'),
    )
    expect(position(insecables('Marquer « Traitée »'))).toBeLessThan(
      position('id="fiche-resume-titre"'),
    )
    expect(position('id="fiche-resume-titre"')).toBeLessThan(position('Pédale au plancher'))
    // La carte dit le signe le plus précis, sans ouvrir la fiche.
    expect(await lire(banc, '/garagiste/demandes')).toContain(
      `<span class="demandes-carte__detail">${insecables('Depuis ce matin')}</span>`,
    )
    // Côté garagiste, la consigne donnée au client, pas la phrase qui s'adresse à lui.
    expect(fiche).toContain(insecables('Consigne donnée au client : ne pas rouler'))
    expect(fiche).not.toContain(insecables('<p class="alerte__titre">Ne roulez pas : appelez-nous'))

    const jeton = jetonDeSession(fiche)
    const sansReponse = await poster(banc, `${adresse}/tentative`, { jeton_formulaire: jeton })
    expect(sansReponse.statusCode).toBe(303)
    expect(sansReponse.headers.location).toBe(`/garagiste/demandes?fait=sans-reponse&demande=${id}`)
    const apresAppel = await lire(banc, sansReponse.headers.location ?? '')
    expect(apresAppel).toContain('<p>Appel sans réponse noté pour <strong>Julie</strong> à 10 h')
    expect(apresAppel).toContain('À rappeler (1)')
    expect(apresAppel).toContain('Appel sans réponse le mercredi 16 septembre à 10 h')
    // Un second appui dans la minute ne compte pas deux appels.
    await poster(banc, `${adresse}/tentative`, { jeton_formulaire: jeton })
    banc.horloge.avancer(20 * 60_000)
    await poster(banc, `${adresse}/tentative`, { jeton_formulaire: jeton })
    expect(await lire(banc, '/garagiste/demandes')).toContain(
      '2 appels sans réponse, le dernier le mercredi 16 septembre à 10 h 20',
    )
    const suivi = await lire(banc, adresse)
    expect(suivi).toContain('<dt>Appels sans réponse</dt>')
    // Sans jeton de la session : refusé, rien n'est noté.
    expect((await poster(banc, `${adresse}/tentative`, {})).statusCode).toBe(403)

    const traitee = await poster(banc, `${adresse}/statut`, {
      statut: 'traitee',
      jeton_formulaire: jeton,
    })
    expect(traitee.headers.location).toBe(`/garagiste/demandes?fait=traitee&demande=${id}`)
    const compteRendu = await lire(banc, traitee.headers.location ?? '')
    expect(compteRendu).toContain(
      insecables('Demande de <strong>Julie</strong> rangée dans « Traitées ».'),
    )
    expect(compteRendu).toContain('<input type="hidden" name="statut" value="a-rappeler">')
    expect(compteRendu).toContain('>Annuler</button>')
    // Un compte rendu au code inconnu ou sur une autre demande n'affiche rien.
    expect(await lire(banc, `/garagiste/demandes?fait=pirate&demande=${id}`)).not.toContain(
      'role="status"',
    )
    expect(
      await lire(
        banc,
        '/garagiste/demandes?fait=traitee&demande=00000000-0000-4000-8000-000000000000',
      ),
    ).not.toContain('role="status"')
    const annulee = await poster(banc, `${adresse}/statut`, {
      statut: 'a-rappeler',
      jeton_formulaire: jeton,
    })
    expect(await lire(banc, annulee.headers.location ?? '')).toContain(
      insecables('Demande de <strong>Julie</strong> remise « À rappeler ».'),
    )
    // Plus rien à noter sur une demande traitée.
    await poster(banc, `${adresse}/statut`, { statut: 'traitee', jeton_formulaire: jeton })
    const ficheTraitee = await lire(banc, adresse)
    expect(ficheTraitee).not.toContain('Pas de réponse</button>')
    expect(ficheTraitee).toContain(insecables('Remettre « À rappeler »'))
  })

  it('doublons possibles : même numéro à moins de 30 minutes, pastille et lien vers l’autre', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Jeanne' })
    banc.horloge.avancer(8 * 60_000)
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Jeanne' })
    banc.horloge.avancer(60 * 60_000)
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, prenom: 'Tardive' })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      prenom: 'Autre',
      telephone: '07 11 22 33 44',
    })
    const liste = await lire(banc, '/garagiste/demandes')
    const cartes = liste.match(/<li class="panneau demandes-carte[\s\S]*?<\/li>/g) ?? []
    const carte = (prenom: string) =>
      cartes.find((texte) => texte.includes(`>${prenom}</a></h3>`)) ?? ''
    const jeannes = cartes.filter((texte) => texte.includes('>Jeanne</a></h3>'))
    expect(jeannes).toHaveLength(2)
    for (const jeanne of jeannes) {
      expect(jeanne).toContain(
        '<span class="pastille demandes-pastille--doublon">Doublon possible</span>',
      )
      expect(jeanne).toMatch(
        /Même numéro, moins de 30 minutes d’écart : <a href="\/garagiste\/demandes\/[0-9a-f-]{36}">Jeanne, reçue le/,
      )
    }
    expect(carte('Tardive')).not.toContain('Doublon possible')
    expect(carte('Autre')).not.toContain('Doublon possible')
    const fiche = await lire(banc, fiches(jeannes[0] ?? '')[0] ?? '')
    expect(fiche).toContain('<div class="message demandes-doublons">')
  })

  it('tableau des traitées : la plus récemment traitée d’abord, comme sa légende le dit', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      prenom: 'Karim',
      telephone: '06 11 22 33 44',
    })
    banc.horloge.avancer(10 * 60_000)
    await remplirEtEnvoyer(banc, '/demande?type=rappel', {
      ...RAPPEL,
      prenom: 'Lina',
      telephone: '06 44 55 66 77',
    })
    const liste = await lire(banc, '/garagiste/demandes')
    const jeton = jetonDeSession(liste)
    const [lina = '', karim = ''] = fiches(liste)
    await poster(banc, `${lina}/statut`, { statut: 'traitee', jeton_formulaire: jeton })
    banc.horloge.avancer(4 * 60_000)
    await poster(banc, `${karim}/statut`, { statut: 'traitee', jeton_formulaire: jeton })
    const apres = await lire(banc, '/garagiste/demandes')
    const tableau = /<table[\s\S]*?<\/table>/.exec(apres)?.[0] ?? ''
    expect(tableau).toContain('Demandes traitées, la plus récemment traitée d’abord')
    expect(tableau.indexOf('>Karim</a>')).toBeLessThan(tableau.indexOf('>Lina</a>'))
  })

  it('retours de 44 px : « Retour aux demandes » sur la fiche, « Retour à l’espace garagiste » sur la liste', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    const liste = await lire(banc, '/garagiste/demandes')
    expect(liste).toContain(
      '<p class="demandes-retour"><a class="bouton bouton--secondaire" href="/garagiste">Retour à l’espace garagiste</a></p>',
    )
    expect(await lire(banc, fiches(liste)[0] ?? '')).toContain(
      '<p class="demandes-retour"><a class="bouton bouton--secondaire" href="/garagiste/demandes">Retour aux demandes</a></p>',
    )
  })

  it('capacités offertes à l’espace : le compteur et les rappels promis d’une date, lus sur la vraie base', async () => {
    const banc = await monter({ session: true, dependances: avecPromesse })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', { ...RAPPEL, moment: 'fin-de-journee' })
    await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      ...RAPPEL,
      motif: '',
      prediagnostic: 'code-urgent',
      moment: 'fin-de-journee',
      telephone: '07 11 22 33 44',
    })
    expect(await banc.contexte.compterDemandesARappeler()).toEqual({ total: 2, neRoulezPas: 1 })
    const rappels = await banc.contexte.listerRappelsPromis('2026-09-17')
    expect(
      rappels.map((rappel) => [rappel.neRoulezPas, rappel.quand, rappel.telephone.affichable]),
    ).toEqual([
      [true, 'en fin de journée', '07 11 22 33 44'],
      [false, 'en fin de journée', '06 12 34 56 78'],
    ])
    expect(rappels[0]?.chemin).toMatch(/^\/garagiste\/demandes\/[0-9a-f-]{36}$/)
    expect(await banc.contexte.listerRappelsPromis('2026-09-18')).toEqual([])
  })
})

describe('corrections du jury, passe 2', () => {
  const SESSION = { [NOM_COOKIE_SESSION]: 'session-du-garagiste' }
  const lire = async (banc: Banc, url: string): Promise<string> =>
    (await banc.app.inject({ url, cookies: SESSION })).body
  const poster = (banc: Banc, url: string, champs: Champs) =>
    banc.app.inject({
      method: 'POST',
      url,
      cookies: SESSION,
      headers: { host: HOTE, origin: ORIGINE, 'content-type': 'application/x-www-form-urlencoded' },
      payload: corps(champs),
    })
  const jetonDeSession = (page: string): string =>
    /name="jeton_formulaire" value="([^"]+)"/.exec(page)?.[1] ?? ''
  const principal = (page: string): string => /<main[\s\S]*?<\/main>/.exec(page)?.[0] ?? ''

  const FREINAGE: ReferenceFamille & { readonly prixIndicatif: string } = {
    identifiant: 'freinage',
    libelle: 'Freinage',
    ventePieceSeule: true,
    piecesDOccasion: false,
    pieces: ['Disque', 'Plaquettes avant', 'Plaquettes arrière'],
    prixIndicatif: 'dès 89 € TTC',
  }
  const CARROSSERIE: ReferenceFamille = {
    identifiant: 'carrosserie',
    libelle: 'Carrosserie',
    ventePieceSeule: false,
    piecesDOccasion: false,
  }
  const VIDANGE_ET_FILTRES: ReferenceFamille = {
    identifiant: 'vidange-et-filtres',
    libelle: 'Vidange et filtres',
    ventePieceSeule: true,
    piecesDOccasion: true,
    pieces: ['Filtre à huile'],
    prestations: ['Vidange', 'Révision'],
    prixIndicatif: 'dès 69 € TTC',
    prixDesPrestations: { Vidange: 'dès 69 € TTC', Révision: 'dès 129 € TTC' },
  }
  const familles: Partial<DependancesDemandes> = {
    trouverFamille: async (identifiant) =>
      [FREINAGE, CARROSSERIE, VIDANGE_ET_FILTRES].find(
        (famille) => famille.identifiant === identifiant,
      ) ?? null,
  }
  const DEVIS_FREINAGE: Champs = {
    type: 'devis',
    famille: 'freinage',
    pieces: 'Plaquettes avant',
    modalite: 'pose-atelier',
    plaque: 'AB-123-CD',
    prenom: 'Julie',
    telephone: '06 12 34 56 78',
    moment: 'matin',
  }

  it('freinage : jamais l’occasion ; pièce et pose pré-cochées depuis un tarif ; prix indicatif (J2)', async () => {
    const banc = await monter({ dependances: familles })
    const page = principal(
      (
        await banc.app.inject(
          '/demande?type=devis&famille=freinage&piece=plaquettes-avant&modalite=pose',
        )
      ).body,
    )
    expect(page).not.toContain('value="occasion"')
    expect(page).toContain('value="neuve"')
    expect(page).toMatch(/value="Plaquettes avant" checked/)
    expect(page).not.toMatch(/value="Plaquettes arrière" checked/)
    expect(page).toMatch(/value="pose-atelier" checked/)
    expect(page).toMatch(/<span class="demandes-famille__prix">dès 89\s€\sTTC<\/span>/u)
    // Une pièce inconnue de l'adresse ne coche rien et n'est jamais rendue (piège 40).
    const inconnue = (await banc.app.inject('/demande?type=devis&famille=freinage&piece=pirate'))
      .body
    expect(inconnue).not.toMatch(/ checked/)
    expect(inconnue).not.toContain('pirate')
    // L'occasion forcée dans l'envoi est refusée pour le freinage.
    const refus = await remplirEtEnvoyer(banc, '/demande?type=devis&famille=freinage', {
      ...DEVIS_FREINAGE,
      gamme: 'occasion',
    })
    expect(refus.statusCode).toBe(422)
    expect(refus.body).toContain(MESSAGES.gamme)
  })

  it('carrosserie : ni gamme ni retrait, « Décrivez le dégât ou le besoin » et photo par SMS (J3)', async () => {
    const banc = await monter({ dependances: familles })
    const page = principal(
      (await banc.app.inject('/demande?type=devis&famille=carrosserie&modalite=retrait')).body,
    )
    expect(page).not.toContain('name="gamme"')
    expect(page).not.toContain('name="modalite"')
    expect(page).toContain('Décrivez le dégât ou le besoin')
    expect(page).toContain('href="sms:+33605922838"')
    // Un retrait ou une gamme reçus malgré tout ne sont pas retenus.
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=devis&famille=carrosserie', {
      ...DEVIS_FREINAGE,
      famille: 'carrosserie',
      pieces: [],
      modalite: 'retrait-garage',
      gamme: 'occasion',
      precisions: 'Portière avant droite rayée',
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = (await suivre(banc, envoi)).body
    expect(confirmation).not.toContain('Retrait au garage')
    expect(confirmation).not.toContain('<dt>Pièce</dt>')
  })

  it('révision : prestation nommée, ni pièces ni gamme ni retrait, son propre prix, transmise sous son nom', async () => {
    const banc = await monter({ dependances: familles })
    const adresse =
      '/demande?type=devis&famille=vidange-et-filtres&prestation=revision&piece=filtre-a-huile&modalite=retrait'
    const page = principal((await banc.app.inject(adresse)).body)
    expect(page).toContain('<strong>Révision</strong>')
    // Le prix de la révision, jamais celui de la famille (la vidange, premier forfait).
    expect(page).toMatch(/<span class="demandes-famille__prix">dès 129\s€\sTTC<\/span>/u)
    expect(page).not.toMatch(/dès 69/u)
    expect(page).not.toContain('name="pieces"')
    expect(page).not.toContain('name="gamme"')
    expect(page).not.toContain('name="modalite"')
    expect(page).not.toContain('Décrivez le dégât')
    expect(page).toContain('<input type="hidden" name="prestation" value="Révision">')
    // Sans prestation, la famille garde ses pièces et son prix ; une prestation inconnue est ignorée.
    const famille = principal(
      (await banc.app.inject('/demande?type=devis&famille=vidange-et-filtres&prestation=pirate'))
        .body,
    )
    expect(famille).toContain('name="pieces"')
    expect(famille).toMatch(/dès 69\s€\sTTC/u)
    expect(famille).not.toContain('pirate')
    // Pièce, retrait et gamme reçus malgré tout ne sont pas retenus ; le garage lit « Révision ».
    const envoi = await remplirEtEnvoyer(banc, adresse, {
      ...DEVIS_FREINAGE,
      famille: 'vidange-et-filtres',
      prestation: 'Révision',
      pieces: 'Filtre à huile',
      modalite: 'retrait-garage',
      gamme: 'occasion',
    })
    expect(envoi.statusCode).toBe(303)
    const confirmation = principal((await suivre(banc, envoi)).body)
    expect(confirmation).toContain('<dt>Objet</dt><dd>Révision</dd>')
    expect(confirmation).not.toContain('Retrait au garage')
    expect(confirmation).not.toContain('Filtre à huile')
  })

  it('« Confirmez l’envoi » résume tout : pièces, pose, véhicule, jours, rappel souhaité (J2, J3)', async () => {
    const banc = await monter({ dependances: familles })
    const formulaire = await banc.app.inject('/demande?type=devis&famille=freinage')
    // Envoyé sans délai humain : l'anti-abus demande confirmation.
    const devis = principal(
      (await envoyer(banc, { ...DEVIS_FREINAGE, jeton: jetonDe(formulaire.body) })).body,
    )
    expect(devis).toContain('<dt>Devis</dt><dd>Freinage</dd>')
    expect(devis).toContain('<dt>Pièces</dt><dd>Plaquettes avant</dd>')
    expect(devis).toContain('<dt>Retrait ou pose</dt><dd>Pose à l’atelier</dd>')
    expect(devis).toContain('<dt>Véhicule</dt><dd>plaque AB-123-CD</dd>')
    expect(devis).toContain('rappel souhaité le matin</dd>')
    const rdv = await banc.app.inject('/demande?type=rendez-vous')
    const resume = principal(
      (
        await envoyer(banc, {
          ...RENDEZ_VOUS,
          famille: '',
          objet: 'entretien',
          jeton: jetonDe(rdv.body),
        })
      ).body,
    )
    expect(resume).toContain(
      insecables('<dt>Jours choisis</dt><dd>Jeudi 17 septembre, matin ; Le plus tôt possible</dd>'),
    )
  })

  it('le récapitulatif d’un rappel après pré-diagnostic reprend le détail des réponses (J1, J4)', async () => {
    const banc = await monter()
    const envoi = await remplirEtEnvoyer(banc, '/demande?type=rappel&prediagnostic=code-urgent', {
      type: 'rappel',
      prediagnostic: 'code-urgent',
      prenom: 'Julie',
      telephone: '06 12 34 56 78',
      moment: 'matin',
    })
    expect((await suivre(banc, envoi)).body).toContain(
      insecables(
        '<dd>Un bruit ou une sensation au freinage, oui, elle s’enfonce, depuis ce matin</dd>',
      ),
    )
  })

  it('« Pas de réponse » depuis la fiche : on y reste, annulable ; « Traitée » en un geste depuis la liste (J4)', async () => {
    const banc = await monter({ session: true })
    await remplirEtEnvoyer(banc, '/demande?type=rappel', RAPPEL)
    const liste = await lire(banc, '/garagiste/demandes')
    const adresse = /\/garagiste\/demandes\/[0-9a-f-]{36}(?=")/.exec(liste)?.[0] ?? ''
    const id = adresse.split('/').at(-1) ?? ''
    // « Marquer « Traitée » » sur la carte, sans ouvrir la fiche.
    expect(liste).toContain(`action="${adresse}/statut"`)
    const fiche = await lire(banc, adresse)
    const jeton = jetonDeSession(fiche)
    expect(fiche).toContain('<input type="hidden" name="depuis" value="fiche">')
    const sansReponse = await poster(banc, `${adresse}/tentative`, {
      jeton_formulaire: jeton,
      depuis: 'fiche',
    })
    expect(sansReponse.headers.location).toBe(`${adresse}?fait=sans-reponse`)
    const apres = await lire(banc, sansReponse.headers.location ?? '')
    expect(apres).toContain('Appel sans réponse noté pour <strong>Julie</strong>')
    expect(apres).toContain(`action="${adresse}/tentative/annuler"`)
    const annule = await poster(banc, `${adresse}/tentative/annuler`, {
      jeton_formulaire: jeton,
      depuis: 'fiche',
    })
    expect(annule.headers.location).toBe(`${adresse}?fait=tentative-annulee`)
    const corrigee = await lire(banc, annule.headers.location ?? '')
    expect(corrigee).toContain('Appel sans réponse retiré pour <strong>Julie</strong>')
    expect(corrigee).not.toContain('Appel sans réponse le')
    const traitee = await poster(banc, `${adresse}/statut`, {
      statut: 'traitee',
      jeton_formulaire: jeton,
    })
    expect(traitee.headers.location).toBe(`/garagiste/demandes?fait=traitee&demande=${id}`)
  })

  it('garage fermé aujourd’hui : la liste le dit en tête (J4)', async () => {
    const ferme = await monter({
      session: true,
      dependances: { garageFermeAujourdhui: async () => true },
    })
    expect(await lire(ferme, '/garagiste/demandes')).toContain(
      insecables('Garage fermé aujourd’hui : aucun rappel promis à reporter.'),
    )
    const ouvert = await monter({
      session: true,
      dependances: { garageFermeAujourdhui: async () => false },
    })
    expect(await lire(ouvert, '/garagiste/demandes')).not.toContain('Garage fermé aujourd’hui')
  })
})
