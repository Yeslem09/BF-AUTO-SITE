import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeSite, TarifsDuSocle } from '../../contrats/index.js'
import {
  CODES_ORGANES_EXCLUS,
  NOM_COOKIE_SESSION,
  ORGANES_EXCLUS_DU_REEMPLOI,
} from '../../contrats/index.js'
import {
  creerRacinePubliqueEssai,
  PROTECTION_FORMULAIRES_ESSAI,
  URL_PUBLIQUE_ESSAI,
} from '../../web/essai.js'
import { creerServeur } from '../../web/serveur.js'
import { BASE_EN_MEMOIRE } from './adaptateurs/sqlite/depot-fermetures-sqlite.js'
import { horlogeA, TARIFS_ABSENTS, TARIFS_ESSAI } from './essais/contexte-essai.js'
import type { ListerRappelsPromis } from './application/ports.js'
import {
  aValider,
  donneesDuSite,
  donneesEssai,
  ecrireDonnees,
  remplacer,
  type Donnees,
  type FichierJetable,
  valide,
} from './essais/donnees-essai.js'
import { assemblerGarage, MESSAGE_FERMETURE_ILLISIBLE, type ContexteGarage } from './module.js'

/** Texte visible d'une page : l'accroche est découpée en portées typographiques par la mise en page. */
const texteVisible = (page: string): string => page.replace(/<[^>]*>/g, '')

const JETON_ESSAI = 'jeton-de-session-essai'
const SESSION = { cookie: `${NOM_COOKIE_SESSION}=${JETON_ESSAI}` }
/** Jeton anti-falsification que la page de la session porte dans chacun de ses formulaires. */
const JETON_FORMULAIRE = PROTECTION_FORMULAIRES_ESSAI.jeton(JETON_ESSAI) ?? ''
/** Mercredi 23 septembre 2026, 10 h à Paris : ouvert selon les horaires d'essai. */
const MERCREDI_10H = '2026-09-23T08:00:00Z'
/** Mercredi 23 septembre 2026, 21 h à Paris : fermé. */
const MERCREDI_21H = '2026-09-23T19:00:00Z'
/** Jeudi 24 septembre 2026, 10 h à Paris (critère de US-40). */
const JEUDI_10H = '2026-09-24T08:00:00Z'
/** Pages publiques rendues par le contexte garage. */
const PAGES_PUBLIQUES = [
  '/',
  '/acces-et-horaires',
  '/vos-droits',
  '/mentions-legales',
  '/confidentialite',
] as const
/** Une période de fermeture d'essai, à déclarer avec session. */
const PERIODE_ESSAI = { du: '2026-10-01', au: '2026-10-02', motif: 'conges' } as const

interface Essai {
  readonly app: FastifyInstance
  readonly garage: ContexteGarage
}

let fichier: FichierJetable | null = null
let app: FastifyInstance | null = null
afterEach(async () => {
  await app?.close()
  await fichier?.nettoyer()
  app = null
  fichier = null
})

let essai: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
})

/** Le serveur complet (sécurité, mise en page, pied de page vivant) avec le seul module garage. */
async function monter(
  options: {
    donnees?: Donnees
    mode?: ModeSite
    instant?: string
    cheminBase?: string
    preDiagnosticPublie?: boolean
    tarifs?: TarifsDuSocle
    listerRappelsPromis?: ListerRappelsPromis
  } = {},
): Promise<Essai> {
  fichier = await ecrireDonnees(options.donnees ?? essai)
  const horloge = horlogeA(options.instant ?? MERCREDI_10H)
  const mode = options.mode ?? 'production'
  const garage = await assemblerGarage({
    mode,
    cheminFichier: fichier.chemin,
    horloge,
    cheminBase: options.cheminBase ?? BASE_EN_MEMOIRE,
    preDiagnosticPublie: options.preDiagnosticPublie ?? true,
    consulterTarifsDuSocle: async () => options.tarifs ?? TARIFS_ESSAI,
    ...(options.listerRappelsPromis !== undefined && {
      listerRappelsPromis: options.listerRappelsPromis,
    }),
  })
  app = await creerServeur({
    modules: [garage.module],
    fournirCadre: garage.fournirCadre,
    urlPublique: URL_PUBLIQUE_ESSAI,
    racinePublique: await creerRacinePubliqueEssai(),
    niveauJournal: 'silent',
    verifierSessionGaragiste: async (jeton) => jeton === JETON_ESSAI,
    maintenant: () => horloge.maintenant(),
    mode,
    preDiagnosticPublie: options.preDiagnosticPublie ?? true,
    protectionFormulairesGaragiste: PROTECTION_FORMULAIRES_ESSAI,
  })
  return { app, garage }
}

function donneesStructurees(corps: string): Record<string, unknown> {
  const trouve = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(corps)
  if (trouve?.[1] === undefined) throw new Error('aucune donnée structurée')
  return JSON.parse(trouve[1]) as Record<string, unknown>
}

/** Les jours du tableau des horaires, dans l'ordre (les autres tableaux de la page exclus). */
function joursDesHoraires(corps: string): string[] {
  const tableau = corps.split('<table class="garage-horaires">')[1]?.split('</table>')[0] ?? ''
  return [...tableau.matchAll(/<th scope="row">(\p{L}+)/gu)].map((trouve) => trouve[1] ?? '')
}

/** Profondeur maximale d'imbrication des formulaires (piège 10 : jamais plus d'un). */
function profondeurFormulaires(corps: string): number {
  let profondeur = 0
  let maximum = 0
  for (const [balise] of corps.matchAll(/<\/?form\b/g)) {
    profondeur += balise === '<form' ? 1 : -1
    maximum = Math.max(maximum, profondeur)
  }
  return maximum
}

/** Envoi comme depuis une page de l'espace : origine du site et jeton de la session, sauf remplacement. */
const envoyer = (
  cible: FastifyInstance,
  url: string,
  champs: Record<string, string>,
  enTetes: Record<string, string> = {},
) =>
  cible.inject({
    method: 'POST',
    url,
    headers: {
      ...SESSION,
      origin: URL_PUBLIQUE_ESSAI,
      'content-type': 'application/x-www-form-urlencoded',
      ...enTetes,
    },
    payload: new URLSearchParams({ jeton_formulaire: JETON_FORMULAIRE, ...champs }).toString(),
  })

/** Déclare la période d'essai avec session, et rend l'adresse de son bouton « Supprimer ». */
async function declarerPeriodeEssai(cible: FastifyInstance): Promise<string> {
  expect((await envoyer(cible, '/garagiste/fermetures', PERIODE_ESSAI)).statusCode).toBe(303)
  const liste = await cible.inject({ url: '/garagiste/fermetures', headers: SESSION })
  const action = /action="(\/garagiste\/fermetures\/\d+\/supprimer)"/.exec(liste.body)?.[1]
  if (action === undefined) throw new Error('bouton de suppression absent')
  return action
}

/** Nombre de fermetures listées dans l'espace garagiste. */
async function nombreDeFermetures(cible: FastifyInstance): Promise<number> {
  const liste = await cible.inject({ url: '/garagiste/fermetures', headers: SESSION })
  return liste.body.match(/garage-fermetures__element/g)?.length ?? 0
}

describe('accueil : blocs fournis par le garage', () => {
  it('fournit les emplacements statut, information, questions, garage et encart', async () => {
    const { garage } = await monter()
    expect(Object.keys(garage.module.blocsAccueil ?? {}).sort()).toEqual([
      'encart',
      'garage',
      'information',
      'questions',
      'statut',
    ])
  })

  it('sans ancien nom publiable, aucun emplacement « encart » : jamais une zone vide', async () => {
    remplacer(essai, 'identite.ancien_nom', aValider('nom de la fiche Google à relever'))
    const { garage, app: serveur } = await monter()
    expect(Object.keys(garage.module.blocsAccueil ?? {})).not.toContain('encart')
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('accueil__zone--encart')
    expect(body).not.toContain('Nouveau nom')
  })

  it('statut : pastille du jour, adresse courte et itinéraire en tête de la bande', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain(
      '<span class="statut statut--pastille statut--ouvert">Ouvert, ferme à 12\u00a0h</span>',
    )
    const zone = body.split('accueil__zone--statut')[1]?.split('</p>')[0] ?? ''
    expect(zone).toContain(
      '<span class="garage-statut__adresse">7 rue Demanieux<span class="garage-statut__ville">, 94600 Choisy-le-Roi</span></span>',
    )
    expect(zone).toContain(
      'href="https://www.google.com/maps/dir/?api=1&amp;destination=7%20rue%20Demanieux%2C%2094600%20Choisy-le-Roi"',
    )
    expect(body.indexOf('accueil__zone--statut')).toBeLessThan(body.indexOf('id="titre-accueil"'))
  })

  it('garage ouvert : surtitre, adresse en titre, statut, « passez sans rendez-vous », numéro en lien', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const bloc = body.split('garage-coordonnees')[1] ?? ''
    expect(bloc).toContain('<p class="surtitre">Le garage</p>')
    expect(bloc).toContain(
      '7 rue Demanieux, <span class="garage-insecable">94600 Choisy-le-Roi</span></h2>',
    )
    expect(body).toContain('<p class="statut statut--ouvert">Ouvert, ferme à 12\u00a0h</p>')
    expect(body).toContain('Passez sans rendez-vous aux heures d’ouverture.')
    expect(body).toContain(
      '<p class="garage-coordonnees__telephone"><a href="tel:+33605922838">06 05 92 28 38</a></p>',
    )
  })

  it('garage fermé : aucun bouton « Appeler » ni « Être rappelé » dans le bloc, le rappel suit dessous (AE-36)', async () => {
    const { app: serveur } = await monter({ instant: MERCREDI_21H })
    const { body } = await serveur.inject('/')
    const bloc = body.split('accueil__zone--garage')[1] ?? ''
    expect(bloc).toContain('Fermé')
    expect(bloc).not.toContain('bouton--principal')
    expect(body).not.toContain('Appeler le 06 05 92 28 38')
    expect(body).not.toContain('Passez sans rendez-vous')
  })

  it('adresse suivie des liens d’itinéraire Google Maps et Plans d’Apple, sans aucune carte chargée', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const destination = '7%20rue%20Demanieux%2C%2094600%20Choisy-le-Roi'
    expect(body).toContain(
      `href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}"`,
    )
    expect(body).toContain(`href="https://maps.apple.com/?daddr=${destination}"`)
    expect(body).not.toMatch(/<(iframe|img)[^>]+(maps|carte)/i)
  })

  it('horaires jour par jour, aujourd’hui en tête et dit en toutes lettres (US-40)', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain(
      '<tr class="garage-horaires__aujourdhui"><th scope="row">Mercredi <span class="garage-horaires__repere">(aujourd’hui)</span></th><td><span class="garage-horaires__plage">8\u00a0h\u00a030 à 12\u00a0h</span>, <span class="garage-horaires__plage">14\u00a0h à 19\u00a0h</span></td></tr>',
    )
    const jours = joursDesHoraires(body)
    expect(jours).toEqual(['Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Lundi', 'Mardi'])
  })

  it('un jeudi : l’accueil puis la page Accès commencent par jeudi, dit « aujourd’hui », pause comprise (US-40)', async () => {
    const { app: serveur } = await monter({ instant: JEUDI_10H })
    for (const url of ['/', '/acces-et-horaires']) {
      const { body } = await serveur.inject(url)
      expect(body, url).toContain(
        '<tr class="garage-horaires__aujourdhui"><th scope="row">Jeudi <span class="garage-horaires__repere">(aujourd’hui)</span></th><td><span class="garage-horaires__plage">8\u00a0h\u00a030 à 12\u00a0h</span>, <span class="garage-horaires__plage">14\u00a0h à 19\u00a0h</span></td></tr>',
      )
      const jours = joursDesHoraires(body)
      expect(jours, url).toEqual([
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche',
        'Lundi',
        'Mardi',
        'Mercredi',
      ])
    }
  })

  it('données structurées identiques au pied de page, sans note ni avis (US-04)', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const donnees = donneesStructurees(body)
    expect(donnees['@type']).toBe('AutoRepair')
    expect(donnees['name']).toBe('BF Auto')
    expect(body).toContain('7 rue Demanieux<br>')
    expect(body).toContain('>06 05 92 28 38</a>')
    expect(JSON.stringify(donnees)).not.toMatch(/aggregateRating|review/)
  })

  it('un téléphone changé dans le seul fichier : aucune page ne garde l’ancien numéro (US-04)', async () => {
    remplacer(essai, 'identite.telephone', valide('01 23 45 67 89'))
    const { app: serveur } = await monter()
    for (const url of PAGES_PUBLIQUES) {
      const { body } = await serveur.inject(url)
      expect(body, url).not.toMatch(/06 05 92 28 38|0605922838|33605922838/)
      expect(body, url).toContain('href="tel:+33123456789"')
      expect(body, url).toContain('>01 23 45 67 89</a>')
    }
    const accueil = await serveur.inject('/')
    expect(donneesStructurees(accueil.body)['telephone']).toBe('+33123456789')
  })

  it('information : l’atelier, ce qu’il fait, le prénom, la façade, et jamais « Réserver »', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain('<p class="surtitre">L’atelier</p>')
    expect(body).toContain(
      '<h2 id="titre-garage-information">Entretien et réparation, au 7 rue Demanieux</h2>',
    )
    expect(body).toContain(
      '<p class="texte-intro">Activités d&#39;essai du garage. Prénom d&#39;essai, votre garagiste, vous accueille au 7 rue Demanieux.</p>',
    )
    expect(body).toContain(
      '<img src="/img/garage/facade-essai.webp" alt="Façade d&#39;essai du garage" width="1200" height="800"',
    )
    expect(body).toContain('>Demander un rendez-vous</a>')
    expect(body).not.toMatch(/Réserver|Prendre RDV/)
  })

  it('information : la méthode « on explique, on chiffre, vous décidez », les deux engagements du socle mot pour mot', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const etapes = [
      ...body.matchAll(
        /<span class="garage-methode__verbe">(.*?)<\/span> <span class="garage-methode__texte">(.*?)<\/span>/g,
      ),
    ].map((trouve) => `${trouve[1]} | ${trouve[2]}`)
    expect(etapes).toEqual([
      'On explique | Ce que nous avons constaté sur votre voiture, avant de parler de prix.',
      'On chiffre | Devis écrit avant travaux.',
      'Vous décidez | Nous vous appelons avant tout travail supplémentaire.',
    ])
    expect(body).toContain(
      '<ul class="garage-engagements">\n      <li>Pièces remplacées restituées sur demande</li>',
    )
  })

  it('information : trois exemples de prix TTC lus dans le catalogue, chacun relié à sa famille', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const tableau = body.split('<table class="tableau-tarifs">')[1]?.split('</table>')[0] ?? ''
    expect(tableau).toContain('<caption>Exemples de prix TTC</caption>')
    const lignes = [...tableau.matchAll(/<tr><th scope="row"><a href="([^"]+)">([^<]+)<\/a>/g)].map(
      (trouve) => `${trouve[2]} ${trouve[1]}`,
    )
    expect(lignes).toEqual([
      'Vidange /pieces-et-reparations/vidange-et-filtres',
      'Révision /pieces-et-reparations/vidange-et-filtres',
      'Plaquettes avant posées /pieces-et-reparations/freinage',
    ])
    expect(tableau).toContain(
      '<a href="/pieces-et-reparations/vidange-et-filtres">Vidange</a><span class="tableau-tarifs__detail">Citadine essence, prix au 1er octobre 2026</span></th><td class="tableau-tarifs__prix">À partir de 69,00\u00a0€\u00a0TTC</td>',
    )
    expect(tableau).not.toContain('a-valider')
    // Un exemple encore proposé : la page dit que ce sont des prix de démonstration.
    expect(body).toContain(
      '<p class="texte-note">Prix de démonstration calés sur le marché local, à confirmer par le garage.</p>',
    )
  })

  it('information : des prix tous validés ne portent pas la note de démonstration', async () => {
    const { app: serveur } = await monter({
      tarifs: {
        ...TARIFS_ESSAI,
        exemples: TARIFS_ESSAI.exemples.map((exemple) => ({ ...exemple, aValider: false })),
      },
    })
    const { body } = await serveur.inject('/')
    expect(body).toContain('<caption>Exemples de prix TTC</caption>')
    expect(body).not.toContain('Prix de démonstration')
  })

  it('information : en relecture, un prix encore proposé est surligné', async () => {
    const { app: serveur } = await monter({ mode: 'relecture' })
    const { body } = await serveur.inject('/')
    const tableau = body.split('<table class="tableau-tarifs">')[1]?.split('</table>')[0] ?? ''
    expect(tableau.match(/class="a-valider"/g)).toHaveLength(1)
    expect(body).not.toContain('Prix de démonstration')
  })

  it('information : sans prix publié au catalogue, ni tableau ni montant d’attente, le lien vers les tarifs reste', async () => {
    const { app: serveur } = await monter({ tarifs: TARIFS_ABSENTS })
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('tableau-tarifs')
    expect(body).not.toMatch(/00 €|0,00/)
    expect(body).toContain('<a href="/tarifs">Voir tous les tarifs</a>')
  })

  it('information : un seul exemple publié, une seule ligne', async () => {
    const { app: serveur } = await monter({
      tarifs: { ...TARIFS_ESSAI, exemples: TARIFS_ESSAI.exemples.slice(0, 1) },
    })
    const { body } = await serveur.inject('/')
    const tableau = body.split('<table class="tableau-tarifs">')[1]?.split('</table>')[0] ?? ''
    expect(tableau.match(/<tr><th scope="row">/g)).toHaveLength(1)
  })

  it('un seul formulaire au plus, jamais imbriqué', async () => {
    const { app: serveur } = await monter()
    expect(profondeurFormulaires((await serveur.inject('/')).body)).toBeLessThanOrEqual(1)
  })
})

describe('accueil : zone « Vos questions » (Kano D2, US-09)', () => {
  it('six questions dans l’ordre, en volets natifs dépliables sans JavaScript', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const intitules = [...body.matchAll(/<summary class="volet__titre">(.*?)<\/summary>/g)].map(
      (trouve) => trouve[1],
    )
    expect(intitules).toEqual([
      'Mon voyant est allumé\u00a0: puis-je rouler\u00a0?',
      'Faut-il prendre rendez-vous\u00a0?',
      'Combien coûte un premier contrôle\u00a0?',
      'Faites-vous des travaux sans mon accord\u00a0?',
      'Vais-je perdre la garantie de mon constructeur si je fais l’entretien ici\u00a0?',
      'Comment puis-je payer\u00a0?',
    ])
    expect(body).toContain('<p class="surtitre">Vos questions</p>')
    expect(body).toContain(
      '<h2 id="titre-garage-questions">Avant de nous confier votre voiture</h2>',
    )
    // Le composant des volets : la première question, l'urgente, se lit dépliée.
    expect(body.match(/<details class="volet" open>/g)?.length).toBe(1)
    expect(body.match(/<details class="volet">/g)?.length).toBe(5)
    expect(body).toContain(
      '<details class="volet" open>\n      <summary class="volet__titre">Mon voyant',
    )
    expect(body).toContain('<a href="/vos-droits">Tous vos droits chez nous</a>')
  })

  it('le voyant : le pré-diagnostic, quand il est publié', async () => {
    const { app: serveur } = await monter()
    expect((await serveur.inject('/')).body).toContain(
      '<p class="garage-lien-isole"><a href="/pre-diagnostic">Faire le pré-diagnostic</a></p>',
    )
  })

  it('le voyant : sans pré-diagnostic publié, l’appel au garage et aucun lien mort (Kano D3)', async () => {
    const { app: serveur } = await monter({ preDiagnosticPublie: false })
    const principal = (await serveur.inject('/')).body.split('<main')[1] ?? ''
    expect(principal).not.toContain('href="/pre-diagnostic"')
    expect(principal).toContain(
      'Un doute\u00a0? Appelez-nous au <a href="tel:+33605922838">06 05 92 28 38</a>.',
    )
  })

  it('la garantie : la réponse, puis « Le texte » vers les règlements 461/2010 et 2023/822', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain('votre garantie d’origine reste valable')
    expect(body).toContain('certaines extensions de garantie')
    expect(body).toContain(
      '<a href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=legissum:cc0008" rel="noopener">Le texte<span class="visuellement-masque">\u00a0: règlements (UE) n° 461/2010 et 2023/822, sur EUR-Lex</span></a>',
    )
  })

  it('le premier contrôle gratuit, défini (contenu, durée), et le taux horaire, datés', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain(
      'Le premier contrôle est gratuit. Il comprend\u00a0: écoute du bruit et lecture des codes défaut, 30 minutes environ.</p>',
    )
    expect(body).toMatch(/facturée 60,00\s€\sTTC de l’heure \(prix au 1er janvier 2026\)/)
  })

  it('un premier contrôle payant : prix, date, contenu, et s’il est déduit de la réparation', async () => {
    const { app: serveur } = await monter({
      tarifs: {
        ...TARIFS_ESSAI,
        premierControle: {
          montant: 'À partir de 29,00\u00a0€\u00a0TTC',
          gratuit: false,
          comprend: 'lecture des codes défaut',
          dateEffet: '1er octobre 2026',
          duree: null,
          deduitDeLaReparation: true,
          aValider: true,
        },
      },
    })
    const { body } = await serveur.inject('/')
    expect(body).toMatch(
      /Le premier contrôle coûte à partir de 29,00\s€\sTTC \(prix au 1er octobre 2026\)\. Il comprend\u00a0: lecture des codes défaut\. Il est déduit du prix de la réparation si vous nous la confiez\./,
    )
    // J6 : un montant au milieu d'une phrase ne garde pas sa majuscule.
    expect(body).not.toMatch(/coûte À partir de|facturée À partir de/)
  })

  it('« Faut-il prendre rendez-vous ? » définit le premier contrôle qu’il nomme', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain(
      'Pas pour un premier contrôle (écoute du bruit et lecture des codes défaut, 30 minutes environ)\u00a0: passez sans rendez-vous',
    )
  })

  it('prix du socle pas encore validés dans le catalogue : la question disparaît, sans texte d’attente', async () => {
    const { app: serveur } = await monter({ tarifs: TARIFS_ABSENTS })
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('Combien coûte un premier contrôle\u00a0?')
    expect(body).not.toContain('Sur demande')
  })

  it('un engagement du socle refusé (démonstration) : ni « travaux sans mon accord », ni accroche', async () => {
    remplacer(essai, 'socle_de_confiance.appel_avant_travaux_supplementaires', valide(false))
    const { app: serveur } = await monter({ mode: 'demonstration' })
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('Faites-vous des travaux sans mon accord\u00a0?')
    expect(body).not.toContain('Nous vous appelons avant tout travail supplémentaire')
    expect(body).not.toContain('garage-methode')
    expect(body).toContain('<li>Devis écrit avant travaux</li>')
    expect(body).toContain('BF Auto, garage automobile à Choisy-le-Roi')
  })

  it('moyens de paiement à valider en production : la question disparaît, les autres restent', async () => {
    remplacer(essai, 'pratique.moyens_paiement', aValider('à obtenir'))
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('Comment puis-je payer\u00a0?')
    for (const question of [
      'voyant',
      'prendre rendez-vous',
      'premier contrôle',
      'sans mon accord',
      'garantie',
    ]) {
      expect(body).toContain(question)
    }
  })
})

describe('accueil : encart « Nouveau nom » (US-10)', () => {
  it('composant encart : symbole, « Nouveau nom, même atelier », l’ancien nom, l’avis Google par /avis, sans note', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    const encart = body.split('accueil__zone--encart')[1] ?? ''
    expect(encart).toContain(
      '<aside class="encart garage-nouveau-nom" aria-labelledby="titre-nouveau-nom">',
    )
    expect(encart).toContain('<div class="encart__symbole"><svg')
    expect(encart).toContain('<p class="encart__surtitre">Nouveau nom, même atelier</p>')
    expect(encart).toContain(
      '<h2 class="encart__titre" id="titre-nouveau-nom"><span class="garage-nouveau-nom__ancien">«\u00a0Garage auto Choisy 94\u00a0»</span> devient <span class="garage-insecable">BF Auto</span></h2>',
    )
    expect(encart).toContain(
      '<p>Même adresse, même numéro. Déjà venu chez nous\u00a0? <a href="/avis">Laissez un avis Google</a>.</p>',
    )
    expect(body).not.toMatch(/premier avis|\d(,\d)? ?\/ ?5|étoiles/i)
    // Sous les colonnes, en bas de l'accueil : jamais en tête de page (AE-39).
    expect(body.indexOf('accueil__zone--encart')).toBeGreaterThan(
      body.indexOf('accueil__zone--garage'),
    )
  })

  it('sans lien d’avis ni même exploitant validés, l’encart reste, sans lien ni « même atelier »', async () => {
    remplacer(essai, 'suivi_client.lien_avis_google', aValider('après renommage'))
    remplacer(essai, 'suivi_client.meme_exploitant', aValider('à confirmer'))
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).toContain('<p class="encart__surtitre">Nouveau nom</p>')
    expect(body).toContain('<p>Même adresse, même numéro.</p>')
    expect(body).not.toContain('même atelier')
    expect(body).not.toContain('Laissez un avis Google')
  })
})

describe('adresse courte /avis', () => {
  it('redirige vers le lien d’avis validé, sans poser de cookie', async () => {
    const { app: serveur } = await monter()
    const reponse = await serveur.inject('/avis')
    expect(reponse.statusCode).toBe(302)
    expect(reponse.headers.location).toBe('https://avis.example/bf-auto-essai')
    expect(reponse.headers['set-cookie']).toBeUndefined()
  })

  it('répond 404 sans lien validé, même en démonstration', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'demonstration' })
    expect((await serveur.inject('/avis')).statusCode).toBe(404)
  })
})

describe('modes du site avec le vrai fichier', () => {
  it('production : les données bloquantes sont recensées pour la porte, médiateur compris', async () => {
    const { garage } = await monter({ donnees: await donneesDuSite(), mode: 'production' })
    expect(garage.donneesBloquantesAValider.join('\n')).toContain(
      'mediateur (médiateur de la consommation) à valider',
    )
  })

  it('production : la configuration d’essai, entièrement validée, ne bloque rien', async () => {
    const { garage } = await monter({ mode: 'production' })
    expect(garage.donneesBloquantesAValider).toEqual([])
  })

  it('démonstration : les propositions s’affichent normalement, sans marque de relecture', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'demonstration' })
    const { body } = await serveur.inject('/')
    expect(texteVisible(body)).toContain(
      'Votre garage à Choisy-le-Roi\u00a0: on explique, on chiffre, vous décidez.',
    )
    expect(body).toContain('Ouvert, ferme à 12\u00a0h')
    expect(body).toContain('<span class="garage-methode__texte">Devis écrit avant travaux.</span>')
    expect(body).toContain('Mécanique, entretien et peinture, toutes marques.')
    expect(body).not.toContain('a-valider')
    expect(body).not.toContain('votre garagiste, vous accueille')
    expect(body).not.toContain('Comment puis-je payer\u00a0?')
  })

  it('relecture : propositions surlignées, manques signalés avec leur note', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'relecture' })
    const { body } = await serveur.inject('/')
    expect(body).toContain('<mark class="a-valider">Devis écrit avant travaux.</mark>')
    expect(body).toContain('<mark class="a-valider">À valider\u00a0: Prénom du garagiste')
    expect(body).toContain('Ouvert, ferme à 12\u00a0h (horaires à valider)')
  })
})

describe('page Accès et horaires', () => {
  it('titre, horaires, repères, documents, encart et données structurées, sans carte', async () => {
    const { app: serveur } = await monter()
    const reponse = await serveur.inject('/acces-et-horaires')
    expect(reponse.statusCode).toBe(200)
    const { body } = reponse
    expect(body).toContain('<title>Accès et horaires de BF Auto, garage à Choisy-le-Roi</title>')
    expect(body).toContain('<h1>Accès et horaires</h1>')
    expect(body).toContain('<li>Repère d&#39;essai.</li>')
    expect(body).toContain('<li>Document d&#39;essai</li>')
    expect(body).toContain('<p class="encart__surtitre">Nouveau nom, même atelier</p>')
    expect(body).toContain(
      '<p class="texte-intro">BF Auto, 7 rue Demanieux, 94600 Choisy-le-Roi. Activités d&#39;essai du garage.</p>',
    )
    expect(body.match(/<section class="panneau pile"/g)?.length).toBe(3)
    expect(donneesStructurees(body)['@type']).toBe('AutoRepair')
    expect(body).not.toMatch(/<iframe|<img/)
  })

  it('une seule région « Horaires » : le panneau de la page s’appelle « Horaires d’ouverture »', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/acces-et-horaires')
    expect(body).toContain('<h2 id="titre-horaires" class="titre-carte">Horaires d’ouverture</h2>')
    const nomsDesRegions = [...body.matchAll(/<section[^>]*aria-labelledby="([^"]+)"/g)].map(
      (trouve) => {
        const id = trouve[1] ?? ''
        const titre = new RegExp(`id="${id}"[^>]*>([^<]*)<`).exec(body)
        return titre?.[1] ?? ''
      },
    )
    expect(nomsDesRegions.filter((nom) => nom === 'Horaires')).toHaveLength(1)
  })

  it('les arrêts de transport en commun, relevés sur la source officielle', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/acces-et-horaires')
    expect(body).toContain(
      '<div class="pile-serree"><h3 class="garage-sous-titre">En transports en commun</h3><ul class="garage-liste"><li>Arrêt d&#39;essai.</li></ul></div>',
    )
  })

  it('sur les vraies données : tramway T9 et bus, d’après Île-de-France Mobilités', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'demonstration' })
    const { body } = await serveur.inject('/acces-et-horaires')
    expect(body).toContain('Tramway T9')
    expect(body).toContain('Trois Communes')
    expect(body).toContain('Docteur Roux')
  })
})

describe('page Vos droits chez nous (AT-2, US-36)', () => {
  it('bloc économie circulaire complet, garantie, médiateur et engagements', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/vos-droits')
    expect(body).toContain('<h1>Vos droits chez nous</h1>')
    // J3 : la question des travaux sans accord, avec la réponse des engagements du garage.
    expect(body).toContain(
      '<h2 id="titre-accord">Faites-vous des travaux sans mon accord\u00a0?</h2>',
    )
    expect(body).toContain('vous recevez un devis écrit avant les travaux')
    expect(body).toContain('pièces issues de l’économie circulaire')
    for (const categorie of [
      'carrosserie amovibles',
      'garnissage intérieur',
      'vitrages non collés',
      'pièces optiques',
      'trains roulants',
    ]) {
      expect(body).toContain(categorie)
    }
    // Les organes exclus viennent du référentiel unique des contrats, que le catalogue applique aussi.
    expect(body).toContain(
      'les pièces mécaniques ou électroniques, sauf celles des trains roulants, de la direction, du freinage et des éléments de liaison au sol assemblés, soumis à usure mécanique et non démontables.',
    )
    for (const code of CODES_ORGANES_EXCLUS) {
      expect(body).toContain(ORGANES_EXCLUS_DU_REEMPLOI[code].complement)
    }
    for (const exception of [
      'sous garantie contractuelle',
      'délai compatible',
      'sécurité routière',
    ]) {
      expect(body).toContain(exception)
    }
    expect(body).toContain('certaines extensions de garantie')
    expect(body).toContain('Médiateur d&#39;essai, 2 rue d&#39;Essai, 75000 Paris')
    expect(body).toContain(
      '<a href="https://mediateur.example/" rel="noopener">https://mediateur.example/</a>',
    )
    expect(body).toContain('Nous vous appelons avant tout travail supplémentaire')
  })

  it('les sources juridiques sont dans les liens « Le texte », jamais dans les réponses', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/vos-droits')
    expect(body.match(/>Le texte</g)?.length).toBe(4)
    const paragraphes = [...body.matchAll(/<p>(.*?)<\/p>/gs)].map((trouve) => trouve[1] ?? '')
    for (const paragraphe of paragraphes) {
      expect(paragraphe).not.toMatch(/D224|461\/2010|L612|R616|arrêté du/)
    }
  })
})

describe('pages légales', () => {
  it('mentions légales complètes lues depuis le fichier, avec la fiche publique du registre (US-05)', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/mentions-legales')
    expect(body).toContain('<h1>Mentions légales</h1>')
    for (const [terme, valeur] of [
      ['Dénomination sociale', 'SOCIÉTÉ D&#39;ESSAI'],
      ['Forme juridique', 'SAS d&#39;essai'],
      ['Capital social', '1 000 euros'],
      ['Siège social', '1 rue d&#39;Essai, 94600 Choisy-le-Roi'],
      ['Immatriculation', 'RCS d&#39;essai'],
      ['TVA intracommunautaire', 'FR00123456782'],
      ['Directeur de la publication', 'Directeur d&#39;essai'],
    ]) {
      expect(body).toContain(`<dt>${terme}</dt><dd>${valeur}</dd>`)
    }
    expect(body).toContain('<dt>Site</dt><dd>https://garage-essai.example</dd>')
    expect(body).toContain('123 456 782 00002')
    expect(body).toContain('href="https://annuaire-entreprises.data.gouv.fr/entreprise/123456782"')
    expect(body).toContain('href="mailto:contact@garage-essai.example"')
    expect(body).toContain(
      'Hébergeur d&#39;essai, 1 avenue d&#39;Essai, 75000 Paris, 01 00 00 00 00',
    )
  })

  it('confidentialité : zéro cookie de suivi, hébergeur, région, prestataires, transferts (US-14)', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/confidentialite')
    expect(body).toContain('<h1>Confidentialité</h1>')
    expect(body).toContain('ne dépose aucun cookie de suivi')
    expect(body).toContain('Hébergeur d&#39;essai')
    expect(body).toContain('Région d&#39;essai, dans l&#39;Union européenne')
    expect(body).toContain(
      'Messagerie d&#39;essai (envoi des courriels), données traitées dans l&#39;Union européenne',
    )
    expect(body).toContain('Transferts hors de l’Union européenne\u00a0: garantie d&#39;essai')
    expect(body).toContain('12 mois')
    expect(body).toContain(
      'aucune sollicitation commerciale n’aura lieu sans votre consentement préalable',
    )
    // Les formulaires ne demandent que le prénom : la page ne dit pas « votre nom ».
    expect(body).toContain(
      'nous recueillons ce que vous saisissez\u00a0: votre prénom, votre téléphone',
    )
    expect(body).not.toContain('votre nom')
  })

  it('pages publiques : titre avec BF Auto et Choisy-le-Roi, aucun cookie, jamais servies périmées', async () => {
    const { app: serveur } = await monter()
    for (const url of [
      '/',
      '/acces-et-horaires',
      '/vos-droits',
      '/mentions-legales',
      '/confidentialite',
    ]) {
      const reponse: LightMyRequestResponse = await serveur.inject(url)
      expect(reponse.statusCode).toBe(200)
      expect(reponse.headers['set-cookie']).toBeUndefined()
      expect(reponse.headers['cache-control']).toBe('no-cache')
      const titre = /<title>(.*?)<\/title>/.exec(reponse.body)?.[1] ?? ''
      expect(titre).toContain('BF Auto')
      expect(titre).toContain('Choisy-le-Roi')
      expect(reponse.body.match(/<h1[\s>]/g)).toHaveLength(1)
    }
  })
})

describe('référencement des pages du garage (US-42)', () => {
  it('une description unique de 155 caractères au plus, une canonique absolue, un seul h1', async () => {
    const { app: serveur } = await monter()
    const descriptions = new Set<string>()
    for (const url of PAGES_PUBLIQUES) {
      const { body } = await serveur.inject(url)
      const description = /<meta name="description" content="([^"]*)">/.exec(body)?.[1] ?? ''
      expect(description.length, url).toBeGreaterThan(0)
      expect(description.length, url).toBeLessThanOrEqual(155)
      descriptions.add(description)
      expect(body, url).toContain(`<link rel="canonical" href="https://garage.exemple${url}">`)
      expect(body.match(/<h1[\s>]/g), url).toHaveLength(1)
    }
    expect(descriptions.size).toBe(PAGES_PUBLIQUES.length)
  })
})

describe('espace garagiste : accès aux fermetures', () => {
  it('sans session : lecture renvoyée vers la connexion, envoi refusé', async () => {
    const { app: serveur } = await monter()
    const lecture = await serveur.inject('/garagiste/fermetures')
    expect(lecture.statusCode).toBe(303)
    expect(lecture.headers.location).toBe('/garagiste/connexion?retour=%2Fgaragiste%2Ffermetures')
    const envoi = await serveur.inject({ method: 'POST', url: '/garagiste/fermetures/imprevu' })
    expect(envoi.statusCode).toBe(401)
  })

  it('sans session, chaque route est fermée : lectures renvoyées, envois refusés, rien de modifié', async () => {
    const { app: serveur } = await monter()
    const suppression = await declarerPeriodeEssai(serveur)
    for (const url of ['/garagiste/fermetures', '/garagiste/fermetures/imprevu']) {
      const lecture = await serveur.inject(url)
      expect(lecture.statusCode, url).toBe(303)
      expect(lecture.headers.location, url).toBe(
        `/garagiste/connexion?retour=${encodeURIComponent(url)}`,
      )
    }
    const envois: readonly (readonly [string, Record<string, string>])[] = [
      ['/garagiste/fermetures', { du: '2026-10-05', au: '2026-10-06', motif: 'conges' }],
      ['/garagiste/fermetures/imprevu', {}],
      [suppression, {}],
    ]
    for (const [url, champs] of envois) {
      const envoi = await serveur.inject({
        method: 'POST',
        url,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: new URLSearchParams(champs).toString(),
      })
      expect(envoi.statusCode, url).toBe(401)
    }
    expect(await nombreDeFermetures(serveur)).toBe(1)
    expect((await serveur.inject('/')).body).toContain('Ouvert, ferme à 12\u00a0h')
  })

  it('avec session : jamais en cache ni indexée ; un bouton, un formulaire à trois champs, un état vide honnête', async () => {
    const { app: serveur } = await monter()
    const reponse = await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })
    expect(reponse.statusCode).toBe(200)
    expect(reponse.headers['cache-control']).toBe('no-store')
    expect(reponse.headers['x-robots-tag']).toBe('noindex')
    expect(reponse.body).toContain('<meta name="robots" content="noindex">')
    expect(reponse.body).toContain('href="/garagiste/fermetures/imprevu">Imprévu aujourd’hui</a>')
    const champs = [
      ...reponse.body.matchAll(/<(?:input|select)(?![^>]*type="hidden")[^>]*name="([^"]+)"/g),
    ].map((t) => t[1])
    expect(champs).toEqual(['du', 'au', 'motif'])
    expect(reponse.body).toContain(
      `<input type="hidden" name="jeton_formulaire" value="${JETON_FORMULAIRE}">`,
    )
    expect(reponse.body).toContain(
      'Aucune fermeture prévue\u00a0: le site suit les horaires habituels.',
    )
    expect(profondeurFormulaires(reponse.body)).toBe(1)
  })
})

describe('espace garagiste : Imprévu aujourd’hui (US-31)', () => {
  it('deux gestes : le bouton, puis confirmer ; le statut public passe à « Fermé exceptionnellement »', async () => {
    const { app: serveur, garage } = await monter()
    const confirmation = await serveur.inject({
      url: '/garagiste/fermetures/imprevu',
      headers: SESSION,
    })
    expect(confirmation.body).toContain('<h1>Fermer le garage aujourd’hui\u00a0?</h1>')
    expect(confirmation.body).toContain(
      '<form method="post" action="/garagiste/fermetures/imprevu"',
    )

    const envoi = await envoyer(serveur, '/garagiste/fermetures/imprevu', {})
    expect(envoi.statusCode).toBe(303)
    expect(envoi.headers.location).toBe('/garagiste/fermetures?fait=enregistree')

    const accueil = await serveur.inject('/')
    expect(accueil.body).toContain(
      '<p class="statut statut--ferme">Fermé exceptionnellement, ouvre jeudi à 8\u00a0h\u00a030</p>',
    )
    expect((await garage.fournirCadre()).statut.libelle).toMatch(/^Fermé exceptionnellement/)
    expect(await garage.annoncerRappel(new Date(MERCREDI_10H), 'des-que-possible')).toBe(
      'Nous vous rappelons jeudi matin.',
    )
  })

  it('la confirmation rappelle de déclarer la fermeture sur la fiche Google, avec son lien', async () => {
    const { app: serveur } = await monter()
    await envoyer(serveur, '/garagiste/fermetures/imprevu', {})
    const liste = await serveur.inject({
      url: '/garagiste/fermetures?fait=enregistree',
      headers: SESSION,
    })
    expect(liste.body).toContain(
      '<a href="https://fiche.example/horaires-exceptionnels" rel="noopener">Déclarez aussi cette fermeture sur votre fiche Google</a>',
    )
    expect(liste.body).toContain('Le garage est déclaré fermé aujourd’hui (imprévu).')
  })

  it('déjà fermé aujourd’hui : le bouton renvoie à la liste, un second envoi n’ajoute rien', async () => {
    const { app: serveur } = await monter()
    await envoyer(serveur, '/garagiste/fermetures/imprevu', {})
    const second = await envoyer(serveur, '/garagiste/fermetures/imprevu', {})
    expect(second.headers.location).toBe('/garagiste/fermetures?fait=deja-fermee')
    const bouton = await serveur.inject({ url: '/garagiste/fermetures/imprevu', headers: SESSION })
    expect(bouton.statusCode).toBe(303)
    const liste = await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })
    expect(liste.body.match(/garage-fermetures__element/g)).toHaveLength(1)
  })
})

describe('espace garagiste : déclarer une période (US-31)', () => {
  it('une semaine de congés : statut, demi-journées et données structurées en tiennent compte', async () => {
    const mercredi = '2026-09-30T08:00:00Z'
    const { app: serveur, garage } = await monter({ instant: mercredi })
    const envoi = await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-09-28',
      au: '2026-10-03',
      motif: 'conges',
    })
    expect(envoi.statusCode).toBe(303)

    const accueil = await serveur.inject('/')
    expect(accueil.body).toContain('Fermé exceptionnellement, ouvre lundi à 8\u00a0h\u00a030')
    const demiJournees = await garage.proposerDemiJournees(new Date(mercredi))
    expect(demiJournees[0]?.code).toBe('2026-10-05-matin')
    expect(donneesStructurees(accueil.body)['specialOpeningHoursSpecification']).toEqual([
      expect.objectContaining({ validFrom: '2026-09-28', validThrough: '2026-10-03' }),
    ])
    const acces = await serveur.inject('/acces-et-horaires')
    expect(acces.body).toContain('Du lundi 28 septembre au samedi 3 octobre\u00a0: congés.')
  })

  it('saisie invalide : 422, erreurs reliées aux champs, valeurs conservées, rien d’enregistré', async () => {
    const { app: serveur } = await monter()
    const reponse = await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-10-07',
      au: '2026-09-28',
      motif: 'conges',
    })
    expect(reponse.statusCode).toBe(422)
    expect(reponse.body).toContain('La fermeture n’a pas été enregistrée.')
    expect(reponse.body).toContain(
      '<p class="champ__erreur" id="garage-fermeture-au-erreur">Le dernier jour doit être le premier jour ou le suivre.</p>',
    )
    expect(reponse.body).toMatch(
      /id="garage-fermeture-au" name="au" value="2026-09-28" aria-describedby="garage-fermeture-dates-aide garage-fermeture-au-erreur" required aria-invalid="true"/,
    )
    expect(reponse.body).toContain('<a href="#garage-fermeture-au">')
    expect(reponse.body).toContain('Aucune fermeture prévue')
  })

  it('une période qui chevauche une autre est refusée, avec la période en cause', async () => {
    const { app: serveur } = await monter()
    await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-10-01',
      au: '2026-10-02',
      motif: 'conges',
    })
    const reponse = await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-10-02',
      au: '2026-10-05',
      motif: 'jour-ferie',
    })
    expect(reponse.statusCode).toBe(422)
    expect(reponse.body).toContain(
      'chevauche la fermeture déjà déclarée du jeudi 1er octobre au vendredi 2 octobre',
    )
    expect(reponse.body).toContain('<option value="jour-ferie" selected>Jour férié</option>')
  })

  it('chaque envoi est refusé sans jeton, avec le jeton d’une autre session ou venu d’un autre site ; rien n’est modifié', async () => {
    const { app: serveur } = await monter()
    const suppression = await declarerPeriodeEssai(serveur)
    const envois: readonly (readonly [string, Record<string, string>])[] = [
      ['/garagiste/fermetures', { du: '2026-10-05', au: '2026-10-06', motif: 'conges' }],
      ['/garagiste/fermetures/imprevu', {}],
      [suppression, {}],
    ]
    const autreSession = PROTECTION_FORMULAIRES_ESSAI.jeton('une-autre-session') ?? ''
    const falsifications: readonly (readonly [Record<string, string>, Record<string, string>])[] = [
      [{ jeton_formulaire: '' }, {}],
      [{ jeton_formulaire: autreSession }, {}],
      [{}, { origin: 'https://pirate.exemple' }],
      [{}, { origin: '', 'sec-fetch-site': 'cross-site' }],
    ]
    for (const [url, champs] of envois) {
      for (const [champsFalsifies, enTetes] of falsifications) {
        const reponse = await envoyer(serveur, url, { ...champs, ...champsFalsifies }, enTetes)
        expect(reponse.statusCode, url).toBe(403)
        expect(reponse.headers['cache-control'], url).toBe('no-store')
      }
    }
    expect(await nombreDeFermetures(serveur)).toBe(1)
    expect((await serveur.inject('/')).body).toContain('Ouvert, ferme à 12\u00a0h')
  })

  it('chaque formulaire de l’espace porte le jeton de la session', async () => {
    const { app: serveur } = await monter()
    await declarerPeriodeEssai(serveur)
    const champJeton = `<input type="hidden" name="jeton_formulaire" value="${JETON_FORMULAIRE}">`
    for (const url of ['/garagiste/fermetures', '/garagiste/fermetures/imprevu']) {
      const page = (await serveur.inject({ url, headers: SESSION })).body
      const formulaires = page.match(/<form\b/g)?.length ?? 0
      expect(formulaires, url).toBeGreaterThan(0)
      expect(page.split(champJeton).length - 1, url).toBe(formulaires)
    }
  })
})

describe('espace garagiste : supprimer une fermeture', () => {
  it('fermé aujourd’hui : « Rouvrir le garage » sur la carte du haut ; dates jj/mm/aaaa (J4, passe 2)', async () => {
    const { app: serveur } = await monter()
    const vide = (await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })).body
    expect(vide).toContain('id="garage-fermeture-du" name="du" value="23/09/2026"')
    expect(vide).not.toContain('type="date"')
    expect(vide).not.toContain('Rouvrir le garage')
    await envoyer(serveur, '/garagiste/fermetures/imprevu', {})
    const ferme = (await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })).body
    const carte =
      /<section class="panneau pile" aria-labelledby="titre-imprevu">[\s\S]*?<\/section>/.exec(
        ferme,
      )?.[0] ?? ''
    expect(carte).toContain('Rouvrir le garage</button>')
    const action = /action="(\/garagiste\/fermetures\/\d+\/supprimer)"/.exec(carte)?.[1]
    if (action === undefined) throw new Error('« Rouvrir le garage » sans action')
    const rouvert = await envoyer(serveur, action, {})
    expect(rouvert.headers.location).toBe(
      '/garagiste/fermetures?fait=supprimee&du=2026-09-23&au=2026-09-23&motif=imprevu',
    )
    // Une date saisie à la française, même sans barre oblique, est acceptée.
    const periode = await envoyer(serveur, '/garagiste/fermetures', {
      du: '01102026',
      au: '02/10/2026',
      motif: 'conges',
    })
    expect(periode.headers.location).toBe('/garagiste/fermetures?fait=enregistree')
  })

  it('supprime, puis dit qu’elle n’existe plus ; un identifiant illisible répond 404', async () => {
    const { app: serveur } = await monter()
    await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-10-01',
      au: '2026-10-02',
      motif: 'conges',
    })
    const liste = await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })
    const action = /action="(\/garagiste\/fermetures\/\d+\/supprimer)"/.exec(liste.body)?.[1]
    if (action === undefined) throw new Error('bouton de suppression absent')
    expect(liste.body).toContain(
      'Supprimer<span class="visuellement-masque"> la fermeture du jeudi 1er octobre 2026 au vendredi 2 octobre 2026</span>',
    )

    const suppression = await envoyer(serveur, action, {})
    expect(suppression.headers.location).toBe(
      '/garagiste/fermetures?fait=supprimee&du=2026-10-01&au=2026-10-02&motif=conges',
    )
    // Compte rendu avec « Annuler » (J4, passe 2 du jury), qui rétablit la même période.
    const compteRendu = (
      await serveur.inject({ url: String(suppression.headers.location), headers: SESSION })
    ).body
    expect(compteRendu).toContain(
      'Fermeture du jeudi 1er octobre au vendredi 2 octobre supprimée</strong>',
    )
    expect(compteRendu).toContain('<input type="hidden" name="du" value="2026-10-01">')
    expect(compteRendu).toContain('<input type="hidden" name="retablir" value="1">')
    expect(compteRendu).toContain('>Annuler</button>')
    expect((await envoyer(serveur, action, {})).headers.location).toBe(
      '/garagiste/fermetures?fait=introuvable',
    )
    const retablie = await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-10-01',
      au: '2026-10-02',
      motif: 'conges',
      retablir: '1',
    })
    expect(retablie.headers.location).toBe('/garagiste/fermetures?fait=retablie')
    const apres = (await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })).body
    expect(apres).toContain('la fermeture du jeudi 1er octobre 2026 au vendredi 2 octobre 2026')
    // Une adresse de compte rendu trafiquée n'affiche ni période ni « Annuler ».
    const trafiquee = await serveur.inject({
      url: '/garagiste/fermetures?fait=supprimee&du=2026-13-01&au=x&motif=vacances',
      headers: SESSION,
    })
    expect(trafiquee.body).toContain('Fermeture supprimée</strong>')
    expect(trafiquee.body).not.toContain('name="retablir"')
    expect((await envoyer(serveur, '/garagiste/fermetures/abc/supprimer', {})).statusCode).toBe(404)
  })

  it('le compte rendu est un code fermé : un texte libre dans l’adresse n’est jamais rendu (piège 40)', async () => {
    const { app: serveur } = await monter()
    const reponse = await serveur.inject({
      url: '/garagiste/fermetures?fait=Appelez%20le%2008%2099%20votre%20compte%20est%20bloque',
      headers: SESSION,
    })
    expect(reponse.statusCode).toBe(200)
    expect(reponse.body).not.toContain('compte est bloque')
    expect(reponse.body).not.toContain('role="status"')
  })
})

describe('fermetures illisibles en base', () => {
  it('une ligne modifiée à la main est écartée, signalée au journal du serveur, et la page s’affiche', async () => {
    const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-garage-journal-'))
    try {
      const cheminBase = join(dossier, 'base.sqlite')
      const { app: serveur } = await monter({ cheminBase })
      await declarerPeriodeEssai(serveur)
      const brute = new Database(cheminBase)
      brute
        .prepare('INSERT INTO garage_fermetures (du, au, motif, declaree_le) VALUES (?, ?, ?, ?)')
        .run('2026-09-23', '2026-09-23', 'grève', new Date(MERCREDI_10H).toISOString())
      brute.close()
      const avertir = vi.spyOn(serveur.log, 'warn')
      const accueil = await serveur.inject('/')
      expect(accueil.statusCode).toBe(200)
      expect(accueil.body).toContain('Ouvert, ferme à 12\u00a0h')
      expect(avertir).toHaveBeenCalledWith(
        { ligne: expect.objectContaining({ motif: 'grève' }) },
        MESSAGE_FERMETURE_ILLISIBLE,
      )
    } finally {
      await app?.close()
      app = null
      await rm(dossier, { recursive: true, force: true })
    }
  })
})

describe('pages du garage au style des composants', () => {
  it('chaque page publique hors accueil : en-tête de page, fil d’Ariane jusqu’à elle, surtitre et h1', async () => {
    const { app: serveur } = await monter()
    for (const [url, titre] of [
      ['/acces-et-horaires', 'Accès et horaires'],
      ['/vos-droits', 'Vos droits chez nous'],
      ['/mentions-legales', 'Mentions légales'],
      ['/confidentialite', 'Confidentialité'],
    ] as const) {
      const { body } = await serveur.inject(url)
      const entete = body.split('<div class="entete-page">')[1]?.split('</h1>')[0] ?? ''
      expect(entete, url).toContain(
        `<nav class="fil-ariane" aria-label="Fil d’Ariane">\n      <ol>\n        <li><a href="/">Accueil</a></li>`,
      )
      expect(entete, url).toContain(`<li><a href="${url}" aria-current="page">${titre}</a></li>`)
      expect(entete, url).toContain('<p class="surtitre">')
      expect(entete, url).toContain(`<h1>${titre}`)
    }
  })

  it('fermetures du garagiste : en-tête de page sous « Espace garagiste », panneaux, formulaire en champs', async () => {
    const { app: serveur } = await monter()
    await declarerPeriodeEssai(serveur)
    const { body } = await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })
    expect(body).toContain(
      '<li><a href="/garagiste">Espace garagiste</a></li>\n        <li><a href="/garagiste/fermetures" aria-current="page">Fermetures exceptionnelles</a></li>',
    )
    expect(body).toContain('<h1>Fermetures exceptionnelles</h1>')
    expect(body.match(/<section class="panneau pile"/g)?.length).toBe(2)
    expect(body).toContain('<li class="panneau garage-fermetures__element">')
    expect(body).toContain('<label class="champ__libelle" for="garage-fermeture-du">Du</label>')
    expect(body).not.toContain('class="carte')
    const confirmation = await serveur.inject({
      url: '/garagiste/fermetures/imprevu',
      headers: SESSION,
    })
    expect(confirmation.body).toContain(
      '<li><a href="/garagiste/fermetures">Fermetures exceptionnelles</a></li>',
    )
  })

  it('pages de texte : un document en panneau, jamais des cartes', async () => {
    const { app: serveur } = await monter()
    for (const url of ['/vos-droits', '/mentions-legales', '/confidentialite']) {
      const { body } = await serveur.inject(url)
      expect(body, url).toContain(
        '<div class="panneau garage-document texte-courant garage-texte">',
      )
      expect(body, url).not.toContain('class="carte')
    }
  })

  it('le mode relecture seul surligne : ni production ni démonstration ne portent `.a-valider`', async () => {
    const donnees = await donneesDuSite()
    for (const mode of ['production', 'demonstration'] as const) {
      const { app: serveur } = await monter({ donnees, mode })
      for (const url of PAGES_PUBLIQUES) {
        const { body } = await serveur.inject(url)
        expect(body, `${mode} ${url}`).not.toContain('a-valider')
      }
      await app?.close()
      app = null
    }
    const { app: relecture } = await monter({ donnees, mode: 'relecture' })
    expect((await relecture.inject('/')).body).toContain('<mark class="a-valider">')
  })
})

describe('ce que fait l’atelier : mécanique, entretien et peinture (carrosserie retirée le 2026-10-21)', () => {
  const ACTIVITES = 'Mécanique, entretien et peinture, toutes marques'

  it('le vrai fichier le publie, validé : l’atelier, Accès, Vos droits et les mentions le disent', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'production' })
    for (const url of ['/', '/acces-et-horaires', '/vos-droits', '/mentions-legales']) {
      const { body } = await serveur.inject(url)
      expect(body, url).toContain(ACTIVITES)
    }
    const mentions = (await serveur.inject('/mentions-legales')).body
    expect(mentions).toContain(`<dt>Activité</dt><dd>${ACTIVITES}</dd>`)
  })

  it('aucune page du garage ne mentionne d’exclusion ni ne réduit l’atelier à la mécanique', async () => {
    const { app: serveur } = await monter({ donnees: await donneesDuSite(), mode: 'demonstration' })
    for (const url of PAGES_PUBLIQUES) {
      const texte = texteVisible((await serveur.inject(url)).body)
      expect(texte, url).not.toMatch(
        /pas de carrosserie|sauf (la )?carrosserie|mécanique à Choisy/i,
      )
    }
  })

  it('activités à valider en production : la mention disparaît, sans texte d’attente', async () => {
    remplacer(essai, 'identite.activites', aValider('à confirmer avec le garagiste'))
    const { app: serveur } = await monter()
    const { body } = await serveur.inject('/')
    expect(body).not.toContain('Activités d&#39;essai')
    expect(body).toContain(
      '<p class="texte-intro">Prénom d&#39;essai, votre garagiste, vous accueille au 7 rue Demanieux.</p>',
    )
    expect((await serveur.inject('/mentions-legales')).body).not.toContain('<dt>Activité</dt>')
  })
})

describe('espace garagiste : rappels déjà promis quand le garage ferme', () => {
  const SOPHIE = {
    prenom: 'Sophie',
    telephone: { affichable: '07 22 33 44 55', lien: 'tel:+33722334455' },
    date: '2026-09-23',
    quand: 'en fin de journée',
    neRoulezPas: false,
    chemin: '/garagiste/demandes/12',
  }

  it('l’écran « Fermer le garage aujourd’hui ? » nomme chaque client qui attend son rappel', async () => {
    const demandes: [string, string | undefined][] = []
    const { app: serveur } = await monter({
      listerRappelsPromis: async (du, au) => {
        demandes.push([du, au])
        return [
          SOPHIE,
          { ...SOPHIE, prenom: 'Karim', neRoulezPas: true, chemin: '/garagiste/demandes/13' },
        ]
      },
    })
    const { body } = await serveur.inject({
      url: '/garagiste/fermetures/imprevu',
      headers: SESSION,
    })
    expect(demandes).toEqual([['2026-09-23', '2026-09-23']])
    expect(body).toContain('2 clients attendent votre rappel aujourd’hui\u00a0: prévenez-les.')
    // Un bouton d'appel de 44 px par client, numéro insécable (J4, passe 2 du jury).
    expect(body).toContain('<p><strong>Sophie</strong>, promis en fin de journée</p>')
    expect(body).toContain(
      '<a class="bouton bouton--secondaire" href="tel:+33722334455">Appeler le <span class="garage-numero">07\u00a022\u00a033\u00a044\u00a055</span></a> <a class="garage-rappels-promis__demande" href="/garagiste/demandes/12">Voir la demande</a>',
    )
    expect(body).toContain(
      '<strong>Karim</strong>, promis en fin de journée <span class="pastille">Ne roulez pas</span>',
    )
    // « Confirmer la fermeture » visible avant la liste ; deux clients : pas de second bouton.
    expect(body.indexOf('Confirmer la fermeture</button>')).toBeLessThan(
      body.indexOf('garage-rappels-promis'),
    )
    expect(body.split('Confirmer la fermeture</button>')).toHaveLength(2)
  })

  it('la liste des fermetures prévient pour chaque période, date comprise', async () => {
    const { app: serveur } = await monter({
      listerRappelsPromis: async (du) =>
        du === '2026-09-28' ? [{ ...SOPHIE, date: '2026-09-29' }] : [],
    })
    await envoyer(serveur, '/garagiste/fermetures', {
      du: '2026-09-28',
      au: '2026-09-30',
      motif: 'conges',
    })
    const { body } = await serveur.inject({ url: '/garagiste/fermetures', headers: SESSION })
    expect(body).toContain('1 client attend votre rappel ces jours-là\u00a0: prévenez-le.')
    expect(body).toContain('<strong>Sophie</strong>, promis mardi 29 septembre, en fin de journée')
  })

  it('sans la capacité des demandes, aucune alerte', async () => {
    const { app: serveur } = await monter()
    const { body } = await serveur.inject({
      url: '/garagiste/fermetures/imprevu',
      headers: SESSION,
    })
    expect(body).not.toContain('garage-rappels-promis')
  })

  it('sans rappel promis ce jour-là, aucune alerte', async () => {
    const { app: serveur } = await monter({ listerRappelsPromis: async () => [] })
    const { body } = await serveur.inject({
      url: '/garagiste/fermetures/imprevu',
      headers: SESSION,
    })
    expect(body).not.toContain('garage-rappels-promis')
  })
})
