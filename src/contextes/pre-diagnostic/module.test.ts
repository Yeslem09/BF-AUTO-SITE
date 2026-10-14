import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import type { ModeSite, TrouverFamille } from '../../contrats/index.js'
import { CADRE_ESSAI, creerRacinePubliqueEssai, creerServeurEssai } from '../../web/essai.js'
import type { CadrePage } from '../../web/index.js'
import {
  creerSourceArbreFichier,
  ErreurFichierArbre,
} from './adaptateurs/fichier/source-arbre-fichier.js'
import { SCRIPT_ETAPE, SCRIPT_IMPRESSION } from './adaptateurs/web/vues/commun.js'
import { vueEtape } from './adaptateurs/web/vues/etape.js'
import { chargerArbre } from './application/charger-arbre.js'
import { creerConsulterEtape } from './application/consulter-etape.js'
import { cheminsDeBranche } from './domaine/chemins.js'
import { ErreurArbreRefuse } from './domaine/erreurs.js'
import { motsDe } from './domaine/texte.js'
import {
  arbreAccepte,
  creerArbreEssai,
  dossierDonneesAvec,
  FICHIER_ARBRE_DU_SITE,
  lireArbreDuSite,
  relire,
  resultatBrut,
} from './essais/arbre-essai.js'
import { assemblerPreDiagnostic, type ContextePreDiagnostic } from './module.js'

const DONNEES_DU_SITE = resolve(import.meta.dirname, '../../../donnees')
const ENTREE = '/pre-diagnostic'
const LIVRET = '/pre-diagnostic/livret'
const LIENS_Q1 = [
  ['voyant', 'Un voyant s’allume'],
  ['bruit', 'Un bruit inhabituel'],
  ['vibrations', 'Ça vibre ou la voiture tire d’un côté'],
  ['odeur-fumee-fuite', 'Une odeur, une fumée ou une fuite'],
  ['demarrage', 'Elle démarre mal ou pas du tout'],
  ['freinage', 'Le freinage a changé'],
  ['ne-sais-pas', 'Autre chose ou je ne sais pas'],
] as const
const CONDUITE_CONTROLER = 'Roulez prudemment et faites contrôler dans les prochains jours'
const INSUFFISANT =
  'Vos réponses ne suffisent pas pour orienter\u00a0: l’atelier doit voir la voiture.'
const MENTION =
  'Pré-diagnostic établi à partir de vos seules réponses. Il ne remplace pas l’examen du véhicule.'
const NOINDEX = '<meta name="robots" content="noindex">'

const CADRE_OUVERT: CadrePage = {
  ...CADRE_ESSAI,
  statut: { etat: 'ouvert', libelle: 'Ouvert, ferme à 19 h' },
}
const CADRE_FERME: CadrePage = {
  ...CADRE_ESSAI,
  statut: { etat: 'ferme', libelle: 'Fermé, ouvre vendredi à 9 h' },
}

let app: FastifyInstance | null = null
const dossiers: string[] = []
afterEach(async () => {
  await app?.close()
  app = null
  await Promise.all(dossiers.splice(0).map((dossier) => rm(dossier, { recursive: true })))
})

interface Montage {
  readonly app: FastifyInstance
  readonly contexte: ContextePreDiagnostic
}

async function monter(
  options: {
    readonly mode?: ModeSite
    readonly arbre?: unknown
    readonly cadre?: CadrePage
    readonly trouverFamille?: TrouverFamille
  } = {},
): Promise<Montage> {
  const mode = options.mode ?? 'demonstration'
  let cheminDonnees = DONNEES_DU_SITE
  if (options.arbre !== undefined) {
    cheminDonnees = await dossierDonneesAvec(options.arbre)
    dossiers.push(cheminDonnees)
  }
  const cadre = options.cadre
  const contexte = await assemblerPreDiagnostic({
    mode,
    cheminDonnees,
    ...(cadre === undefined ? {} : { consulterGarage: async () => cadre }),
    ...(options.trouverFamille === undefined ? {} : { trouverFamille: options.trouverFamille }),
  })
  // Dossier public jetable, avec les scripts que citent les étapes et les fiches.
  const racinePublique = await creerRacinePubliqueEssai()
  dossiers.push(racinePublique)
  for (const chemin of [SCRIPT_IMPRESSION, SCRIPT_ETAPE]) {
    const script = join(racinePublique, chemin)
    await mkdir(dirname(script), { recursive: true })
    await writeFile(script, '/* script d’essai */')
  }
  app = await creerServeurEssai([contexte.module], { mode, racinePublique })
  return { app, contexte }
}

async function page(adresse: string, options: Parameters<typeof monter>[0] = {}): Promise<string> {
  const { app: serveur } = await monter(options)
  const reponse = await serveur.inject(adresse)
  expect(reponse.statusCode).toBe(200)
  return reponse.body
}

/** Texte lu par le visiteur : balises, scripts et entités retirés. */
function texteVisible(corps: string): string {
  return corps
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
}

function contenuPrincipal(corps: string): string {
  const debut = corps.indexOf('<main')
  const fin = corps.indexOf('</main>')
  return corps.slice(debut, fin)
}

function positions(corps: string, textes: readonly string[]): number[] {
  return textes.map((texte) => {
    const position = corps.indexOf(texte)
    expect(position, `« ${texte} » absent`).toBeGreaterThanOrEqual(0)
    return position
  })
}

function croissantes(nombres: readonly number[]): boolean {
  return nombres.every((nombre, index) => index === 0 || nombre > (nombres[index - 1] ?? 0))
}

describe('pré-diagnostic : publication selon le mode et la relecture', () => {
  it('en production, sans relecture datée : 404 partout, aucun bloc d’accueil, et le site démarre', async () => {
    const { app: serveur, contexte } = await monter({ mode: 'production' })
    for (const adresse of [ENTREE, `${ENTREE}?q1=bruit`, `${ENTREE}?q1=bruit&q2=aucun`, LIVRET]) {
      expect((await serveur.inject(adresse)).statusCode, adresse).toBe(404)
    }
    const accueil = await serveur.inject('/')
    expect(accueil.statusCode).toBe(200)
    expect(accueil.body).not.toContain('accueil__zone--pre-diagnostic')
    expect(accueil.body).not.toContain('Un souci avec votre voiture\u00a0?')
    expect(contexte.module.blocsAccueil).toEqual({})
    expect(await contexte.retrouverResumePreDiagnostic('bruit.aucun.vitesse')).toBeNull()
    expect(contexte.preDiagnosticPublie).toBe(false)
  })

  it('non publié, garage ouvert : l’accueil garde la question et invite à appeler (Kano D3)', async () => {
    const { app: serveur } = await monter({ mode: 'production', cadre: CADRE_OUVERT })
    const accueil = (await serveur.inject('/')).body
    expect(accueil).toContain('accueil__zone--pre-diagnostic')
    expect(accueil).toContain('Un souci avec votre voiture\u00a0?')
    expect(accueil).toContain(
      `<a class="bouton bouton--principal" href="${CADRE_ESSAI.identite.telephone.lien}">Appelez-nous au ${CADRE_ESSAI.identite.telephone.affichable}</a>`,
    )
    expect(contenuPrincipal(accueil)).not.toContain(`href="${ENTREE}`)
  })

  it('non publié, garage fermé : « Être rappelé » d’abord, numéro affiché', async () => {
    const { app: serveur } = await monter({ mode: 'production', cadre: CADRE_FERME })
    const accueil = contenuPrincipal((await serveur.inject('/')).body)
    expect(accueil).toContain(
      '<a class="bouton bouton--principal" href="/demande?type=rappel">Être rappelé</a>',
    )
    expect(accueil).toContain(CADRE_ESSAI.identite.telephone.affichable)
    expect(accueil).not.toContain(`href="${ENTREE}`)
  })

  it('en production, relecture datée : publié, livret toujours absent', async () => {
    const { app: serveur, contexte } = await monter({
      mode: 'production',
      arbre: relire(lireArbreDuSite()),
    })
    expect((await serveur.inject(ENTREE)).statusCode).toBe(200)
    expect((await serveur.inject(LIVRET)).statusCode).toBe(404)
    expect((await serveur.inject('/')).body).toContain('accueil__zone--pre-diagnostic')
    expect((await contexte.retrouverResumePreDiagnostic('bruit.aucun.vitesse'))?.urgence).toBe(
      'a-controler',
    )
    expect(contexte.preDiagnosticPublie).toBe(true)
  })

  it('en démonstration, visible sans relecture, sans avertissement de relecture', async () => {
    const corps = await page(ENTREE)
    expect(corps).toContain('<h1>Un souci avec votre voiture\u00a0?</h1>')
    expect(corps).not.toContain('À relire avec le garagiste')
  })

  it('en relecture, visible et annoncé comme à relire, avec le lien du livret', async () => {
    const corps = await page(`${ENTREE}?q1=bruit`, { mode: 'relecture' })
    expect(corps).toContain('À relire avec le garagiste')
    expect(corps).toContain(`href="${LIVRET}"`)
  })

  it('refuse de démarrer avec un arbre qui ne passe pas la porte', async () => {
    const arbre = creerArbreEssai()
    const piste = resultatBrut(arbre, 'bruit-roulement').pistes[0]
    if (piste === undefined) throw new Error('piste absente')
    piste.texte = 'Sûrement un roulement.'
    const dossier = await dossierDonneesAvec(arbre)
    dossiers.push(dossier)
    await expect(
      assemblerPreDiagnostic({ mode: 'demonstration', cheminDonnees: dossier }),
    ).rejects.toBeInstanceOf(ErreurArbreRefuse)
  })

  it('refuse de démarrer sans fichier d’arbre lisible', async () => {
    await expect(
      assemblerPreDiagnostic({ mode: 'demonstration', cheminDonnees: '/dossier/absent' }),
    ).rejects.toBeInstanceOf(ErreurFichierArbre)
  })
})

describe('pré-diagnostic : entrée et accueil', () => {
  it('l’entrée nue pose la question 1 en sept liens directs, ouverte aux moteurs', async () => {
    const corps = await page(ENTREE)
    expect(corps).toContain(
      '<title>Voyant, bruit, fuite\u00a0: pré-diagnostic gratuit avant l’atelier | BF Auto</title>',
    )
    expect(corps).toContain(
      'Pré-diagnostic gratuit en 5 questions au plus. Le diagnostic se fait à l’atelier.',
    )
    expect(corps).toContain('<p class="surtitre">Question 1 sur 5 au plus</p>')
    for (const [code, libelle] of LIENS_Q1) {
      expect(corps).toContain(
        `href="/pre-diagnostic?q1=${code}"><span class="bouton-choix__titre">${libelle}</span></a>`,
      )
    }
    // La question se pose dans la plaque, en boutons de choix bordés, « Je ne sais pas » en tirets.
    expect(corps).toContain('<div class="plaque pre-diagnostic-plaque"><div class="plaque__filet">')
    expect(corps.match(/<a class="bouton-choix[ "]/g)).toHaveLength(7)
    expect(corps).toContain(
      '<a class="bouton-choix bouton-choix--incertain" href="/pre-diagnostic?q1=ne-sais-pas">',
    )
    expect(corps).toContain('<nav class="fil-ariane" aria-label="Fil d’Ariane">')
    expect(contenuPrincipal(corps)).not.toContain('<form')
    expect(corps).not.toContain(NOINDEX)
    expect(corps).toContain(
      '<a class="navigation__lien" href="/pre-diagnostic" aria-current="page">',
    )
  })

  it('avec l’identité du garage, le titre de l’entrée porte aussi la ville (référencement local)', async () => {
    const corps = await page(ENTREE, { cadre: CADRE_OUVERT })
    expect(corps).toContain(
      '<title>Voyant, bruit, fuite\u00a0: pré-diagnostic gratuit avant l’atelier | BF Auto, Choisy-le-Roi</title>',
    )
  })

  it('toute étape avec des paramètres est exclue des moteurs', async () => {
    expect(await page(`${ENTREE}?q1=inconnu`)).toContain(NOINDEX)
  })

  it('revenir à la question 1 marque la réponse précédente', async () => {
    const corps = await page(`${ENTREE}?coche=bruit`)
    expect(corps).toContain(
      '<a class="bouton-choix pre-diagnostic-choix--precedent" href="/pre-diagnostic?q1=bruit" aria-current="true"><span class="bouton-choix__titre">Un bruit inhabituel</span><span class="bouton-choix__aide">Votre réponse précédente</span></a>',
    )
  })

  it('fournit le bloc d’accueil sans plaque propre : surtitre, question, 7 boutons de choix, mention', async () => {
    const { app: serveur } = await monter()
    const corps = (await serveur.inject('/')).body
    const debut = corps.indexOf('accueil__zone--pre-diagnostic')
    expect(debut).toBeGreaterThan(0)
    const bloc = corps.slice(debut, corps.indexOf('</section>', debut))
    expect(bloc).toContain('<p class="surtitre">Pré-diagnostic, question 1 sur 5 au plus</p>')
    expect(bloc).toContain('<h2 id="pre-diagnostic-bloc-titre">Que remarquez-vous\u00a0?</h2>')
    expect(bloc).toContain('<ul class="liste-choix liste-choix--colonnes"')
    expect(bloc.match(/<a class="bouton-choix[^"]*" href="\/pre-diagnostic\?q1=/g)).toHaveLength(7)
    expect(bloc).toContain('<a class="bouton-choix bouton-choix--incertain"')
    expect(bloc).toContain(
      '<p class="texte-note"><strong>Pré-diagnostic gratuit\u00a0:</strong> le diagnostic se fait à l’atelier.</p>',
    )
    expect(bloc).not.toContain('<form')
    // La couche web pose la plaque ; le bloc n'en remet pas, ni carte.
    expect(bloc.match(/class="plaque"/g)).toHaveLength(1)
    expect(bloc).not.toContain('carte')
  })
})

describe('pré-diagnostic : une page par question, sans JavaScript', () => {
  it('« Un voyant s’allume » mène à la question des signes : « Question 2 sur 5 au plus »', async () => {
    const corps = await page(`${ENTREE}?q1=voyant`)
    expect(corps).toContain(
      '<span class="surtitre pre-diagnostic-progression">Question 2 sur 5 au plus</span>',
    )
    expect(corps).toContain(
      '<h1 class="pre-diagnostic-question" tabindex="-1" data-pre-diagnostic-focus><span class="pre-diagnostic-mot-lie">Remarquez-vous</span> l’un de ces signes\u00a0?</h1>',
    )
    expect(corps).toContain(
      '<div class="plaque pre-diagnostic-plaque"><div class="plaque__filet">\n  <form class="pre-diagnostic-etape" method="get" action="/pre-diagnostic">',
    )
    expect(corps).toContain('<input type="hidden" name="q1" value="voyant">')
    expect(corps).toContain('<input type="hidden" name="etape" value="signes">')
    expect(corps.match(/type="checkbox" name="q2"/g)).toHaveLength(7)
    // Cases en tuiles bordées, « Je ne sais pas » en tirets, puis « Continuer ».
    expect(corps.match(/<label class="choix-tuile[^"]*"><input type="checkbox"/g)).toHaveLength(7)
    // « Aucun de ces signes » en tête : visible sans défiler sur un téléphone (J1).
    expect(corps).toContain(
      '<ul class="liste-choix">\n        <li class="pre-diagnostic-choix-aucun"><label class="choix-tuile"><input type="checkbox" name="q2" value="aucun"><span>Aucun de ces signes</span>',
    )
    expect(corps).toContain(
      '<label class="choix-tuile pre-diagnostic-tuile--incertain"><input type="checkbox" name="q2" value="ne-sais-pas"><span>Je ne sais pas</span>',
    )
    expect(corps).toContain('type="submit">Continuer</button>')
    expect(corps).toContain(
      'href="/pre-diagnostic?coche=voyant">Revenir à la question précédente</a>',
    )
    expect(corps).toContain(NOINDEX)
  })

  it('la branche « démarre mal » se passe de la direction', async () => {
    const corps = await page(`${ENTREE}?q1=demarrage`)
    expect(corps.match(/type="checkbox" name="q2"/g)).toHaveLength(6)
    expect(corps).not.toContain('value="direction"')
  })

  it('une question envoyée sans réponse s’affiche en erreur, reliée au groupe', async () => {
    const corps = await page(`${ENTREE}?q1=voyant&etape=signes`)
    expect(corps).toContain('<title>Erreur\u00a0: Question 2 du pré-diagnostic')
    expect(corps).toContain('aria-describedby="pre-diagnostic-aide pre-diagnostic-erreur"')
    expect(corps).toContain('id="pre-diagnostic-erreur"')
    expect(corps).toContain('Cochez au moins une case')
  })

  it('les questions de branche se répondent d’un geste, en boutons de choix, réponses précédentes reportées', async () => {
    const corps = await page(`${ENTREE}?q1=bruit&q2=aucun&r=freinage`)
    expect(corps).toContain('Question 4 sur 5 au plus')
    expect(corps).toContain('<input type="hidden" name="q2" value="aucun">')
    expect(corps).toContain('<input type="hidden" name="r" value="freinage">')
    expect(corps).toContain('<input type="hidden" name="etape" value="frein-bruit">')
    expect(
      corps.match(/<button class="bouton-choix[^"]*" type="submit" name="r" value="/g),
    ).toHaveLength(4)
    expect(corps).toContain(
      '<button class="bouton-choix bouton-choix--incertain" type="submit" name="r" value="ne-sais-pas"><span class="bouton-choix__titre">Je ne sais pas</span></button>',
    )
    // Un geste suffit : ni case à cocher, ni « Continuer ».
    expect(corps).not.toContain('type="radio"')
    expect(corps).not.toContain('>Continuer</button>')
  })

  it('le lien « Revenir à la question précédente » rouvre la question avec la réponse pré-cochée', async () => {
    const { app: serveur } = await monter()
    const troisieme = (await serveur.inject(`${ENTREE}?q1=bruit&q2=aucun`)).body
    expect(troisieme).toContain(
      'href="/pre-diagnostic?q1=bruit&amp;coche=aucun">Revenir à la question précédente</a>',
    )
    const deuxieme = (await serveur.inject(`${ENTREE}?q1=bruit&coche=aucun`)).body
    expect(deuxieme).toContain('value="aucun" checked><span>Aucun de ces signes</span>')
    const quatrieme = (await serveur.inject(`${ENTREE}?q1=bruit&q2=aucun&r=freinage`)).body
    expect(quatrieme).toContain(
      'href="/pre-diagnostic?q1=bruit&amp;q2=aucun&amp;coche=freinage">Revenir à la question précédente</a>',
    )
    const retour = (await serveur.inject(`${ENTREE}?q1=bruit&q2=aucun&coche=freinage`)).body
    expect(retour).toContain(
      '<button class="bouton-choix pre-diagnostic-choix--precedent" type="submit" name="r" value="freinage" aria-current="true"><span class="bouton-choix__titre">Quand je freine</span><span class="bouton-choix__aide">Votre réponse précédente</span></button>',
    )
  })

  it('un texte libre glissé dans l’adresse n’apparaît nulle part, les codes inconnus sont ignorés', async () => {
    const libre = 'Appelez le 06 99 99 99 99, votre voiture est perdue'
    const parametres = new URLSearchParams([
      ['q1', 'bruit'],
      ['q2', 'aucun'],
      ['q2', '<script>alert(1)</script>'],
      ['r', libre],
      ['coche', '<b>gras</b>'],
      ['etape', libre],
    ])
    const corps = await page(`${ENTREE}?${parametres.toString()}`)
    expect(corps).toContain('Question 3 sur 5 au plus')
    expect(corps).not.toContain('Appelez le 06 99')
    expect(corps).not.toContain('alert(1)')
    expect(corps).not.toContain('gras')
    expect(corps).not.toContain('pre-diagnostic-erreur')
  })
})

describe('pré-diagnostic : l’écran d’arrêt', () => {
  it('un signe coché affiche « Ne roulez pas. » sans autre question, consignes dans l’ordre', async () => {
    const corps = await page(`${ENTREE}?q1=voyant&q2=voyant-rouge`)
    const principal = contenuPrincipal(corps)
    expect(principal).toContain(
      '<div class="alerte alerte--danger pre-diagnostic-conduite" role="status">\n    <h1 class="alerte__titre" tabindex="-1" data-pre-diagnostic-focus>Ne roulez pas.</h1>',
    )
    expect(principal).toContain('<ol class="pre-diagnostic-consignes__liste">')
    expect(principal).not.toContain('<form')
    expect(principal).not.toContain('<fieldset')
    expect(
      croissantes(
        positions(principal, [
          'Mettez-vous en sécurité',
          'appelez le <a href="tel:112">112</a>',
          'Appelez l’assistance de votre assureur',
          'Prévenez le garage',
        ]),
      ),
    ).toBe(true)
    expect(principal).toContain('href="/demande?type=rappel&amp;prediagnostic=voyant.voyant-rouge"')
    expect(principal).toContain(MENTION)
    expect(corps).toContain(NOINDEX)
  })

  it('JavaScript désactivé : « Aucun de ces signes » et la fumée cochés ensemble arrêtent aussi', async () => {
    const corps = await page(`${ENTREE}?q1=bruit&q2=aucun&q2=fumee-brule`)
    expect(corps).toContain('>Ne roulez pas.</h1>')
    expect(corps).toContain('<li>De la fumée sous le capot ou une odeur de brûlé</li>')
  })

  it('garage ouvert : l’action vers le garage est « Appeler le garage », après les deux premières consignes', async () => {
    const principal = contenuPrincipal(
      await page(`${ENTREE}?q1=freinage&q2=pedale-molle`, { cadre: CADRE_OUVERT }),
    )
    expect(
      croissantes(
        positions(principal, [
          '112',
          'Appelez l’assistance de votre assureur',
          'href="tel:+33605922838">Appeler le garage au 06 05 92 28 38</a>',
          'class="bouton bouton--secondaire" href="/demande?type=rappel',
        ]),
      ),
    ).toBe(true)
    expect(principal).toContain('>Être rappelé</a>')
  })

  it('garage fermé : « Être rappelé » en action principale, numéro visible, même ordre', async () => {
    const principal = contenuPrincipal(
      await page(`${ENTREE}?q1=freinage&q2=pedale-molle`, { cadre: CADRE_FERME }),
    )
    expect(principal).not.toContain('Appeler le garage')
    // Fermé : aucun bouton d'appel ; le numéro reste un lien, d'un seul tenant.
    expect(principal).not.toContain('class="bouton bouton--principal" href="tel:')
    expect(
      croissantes(
        positions(principal, [
          '112',
          'Appelez l’assistance de votre assureur',
          'class="bouton bouton--principal" href="/demande?type=rappel',
          '>Être rappelé à l’ouverture</a>',
          'Fermé, ouvre vendredi à 9\u00a0h. Numéro du garage\u00a0: <a href="tel:+33605922838">06\u00a005\u00a092\u00a028\u00a038</a>.',
        ]),
      ),
    ).toBe(true)
  })

  it('sans coordonnées fournies au contexte, « Être rappelé » reste l’action principale', async () => {
    const principal = contenuPrincipal(await page(`${ENTREE}?q1=freinage&q2=pedale-molle`))
    expect(principal).not.toContain('href="tel:+33605922838"')
    expect(principal).toContain('class="bouton bouton--principal" href="/demande?type=rappel')
  })
})

describe('pré-diagnostic : le résultat', () => {
  const PARCOURS_BRUIT = `${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=sifflement`

  it('présente la conduite, puis les pistes et « Ce que l’atelier vérifiera », puis la mention', async () => {
    const principal = contenuPrincipal(await page(PARCOURS_BRUIT))
    expect(principal).toContain(
      `<div class="alerte alerte--attention pre-diagnostic-conduite pre-diagnostic-conduite--a-controler" role="status">\n    <h1 class="alerte__titre" tabindex="-1" data-pre-diagnostic-focus>${CONDUITE_CONTROLER}</h1>`,
    )
    expect(
      croissantes(
        positions(principal, [
          CONDUITE_CONTROLER,
          'Des plaquettes de frein arrivées à leur témoin d’usure',
          'Ce que l’atelier vérifiera\u00a0:',
          'Des plaquettes ou des disques encrassés',
          'Et maintenant\u00a0?',
          MENTION,
        ]),
      ),
    ).toBe(true)
    expect(principal.match(/Ce que l’atelier vérifiera\u00a0:/g)).toHaveLength(2)
    expect(principal).toContain('<ul class="pre-diagnostic-pistes__liste">')
    expect(principal).not.toContain('<ol class="pre-diagnostic-pistes')
    expect(texteVisible(principal)).not.toMatch(/%|€/)
  })

  it('montre la figure technique de la famille concernée, une seule fois pour deux pistes', async () => {
    const principal = contenuPrincipal(await page(PARCOURS_BRUIT))
    expect(principal.match(/<figure class="figure-technique"/g)).toHaveLength(1)
    expect(principal).toContain(
      '<span class="figure-technique__numero">Fig. 1</span> Frein à disque\u00a0:',
    )
    expect(principal).toContain('Pièces concernées\u00a0: voir Fig. 1.')
    expect(
      croissantes(
        positions(principal, [
          'Des plaquettes de frein arrivées à leur témoin d’usure',
          'id="pre-diagnostic-figure-1"',
          'Des plaquettes ou des disques encrassés',
          'voir Fig. 1.',
        ]),
      ),
    ).toBe(true)
  })

  it('les trois niveaux prennent chacun leur alerte : rouge plein, cadre ambre, cadre gris', async () => {
    const [danger, attention, neutre] = await Promise.all(
      [
        `${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=frottement`,
        PARCOURS_BRUIT,
        `${ENTREE}?q1=voyant&q2=aucun&r=orange&r=entretien`,
      ].map(async (adresse) => contenuPrincipal(await page(adresse))),
    )
    expect(danger).toContain('<div class="alerte alerte--danger pre-diagnostic-conduite')
    expect(attention).toContain('<div class="alerte alerte--attention pre-diagnostic-conduite')
    expect(neutre).toContain(
      '<div class="alerte pre-diagnostic-conduite pre-diagnostic-conduite--sans-urgence" role="status">',
    )
    expect(neutre).toContain('>Pas d’urgence\u00a0: à vérifier lors d’un prochain passage</h1>')
  })

  it('carrosserie : une pièce qui pend arrête, une rayure attend le prochain passage', async () => {
    const carrosserie = `${ENTREE}?q1=ne-sais-pas&q2=aucun&r=carrosserie`
    const question = await page(carrosserie)
    expect(question).toContain('Que voyez-vous sur la carrosserie\u00a0?')
    expect(question).toContain('Question 4 sur 5 au plus')
    const pend = contenuPrincipal(await page(`${carrosserie}&r=piece-pend`))
    expect(pend).toContain('<div class="alerte alerte--danger pre-diagnostic-conduite')
    expect(pend).toContain('Mettez-vous en sécurité')
    expect(pend).toContain(
      '<span class="figure-technique__numero">Fig. 1</span> Voiture, vue de côté',
    )
    expect(pend).toContain('<span class="figure-technique__numero">Fig. 2</span> Ampoule de phare')
    const rayure = contenuPrincipal(await page(`${carrosserie}&r=rayure`))
    expect(rayure).toContain('pre-diagnostic-conduite--sans-urgence')
    expect(rayure).toContain('Un dégât de peinture')
  })

  it('« Être rappelé » ouvre la demande préremplie avec le code du parcours', async () => {
    const corps = await page(PARCOURS_BRUIT)
    expect(corps).toContain(
      'href="/demande?type=rappel&amp;prediagnostic=bruit.aucun.freinage.sifflement">Être rappelé</a>',
    )
  })

  it('« Imprimer la fiche » n’apparaît qu’avec JavaScript, par le script de la page', async () => {
    const corps = await page(PARCOURS_BRUIT)
    expect(corps).toContain('data-pre-diagnostic-imprimer hidden>Imprimer la fiche</button>')
    expect(corps).toMatch(/<script src="\/js\/pre-diagnostic\/imprimer\.js[^"]*" defer><\/script>/)
  })

  it('garage ouvert : « Appeler » en tête, « Être rappelé » ensuite', async () => {
    const principal = contenuPrincipal(await page(PARCOURS_BRUIT, { cadre: CADRE_OUVERT }))
    expect(
      croissantes(
        positions(principal, ['Appeler le garage au 06 05 92 28 38', '>Être rappelé</a>']),
      ),
    ).toBe(true)
  })

  it('« Je ne sais pas » aux signes : jamais « Pas d’urgence », et les signes d’arrêt sont rappelés', async () => {
    const corps = await page(`${ENTREE}?q1=voyant&q2=ne-sais-pas&r=orange&r=entretien`)
    expect(corps).toContain(`>${CONDUITE_CONTROLER}</h1>`)
    expect(corps).not.toContain('>Pas d’urgence\u00a0: à vérifier lors d’un prochain passage</h1>')
    expect(corps).toContain('Vous ne savez pas si l’un de ces signes est présent.')
    expect(corps).toContain('<li>La pédale de frein est molle ou s’enfonce</li>')
  })

  it('« Je ne sais pas » partout : l’atelier doit voir la voiture, avec appel et rappel', async () => {
    const principal = contenuPrincipal(
      await page(`${ENTREE}?q1=ne-sais-pas&q2=ne-sais-pas&r=ne-sais-pas`, { cadre: CADRE_OUVERT }),
    )
    expect(
      croissantes(
        positions(principal, [
          CONDUITE_CONTROLER,
          INSUFFISANT,
          'Vous ne savez pas si l’un de ces signes est présent.',
          'Et maintenant\u00a0?',
        ]),
      ),
    ).toBe(true)
    expect(principal).toContain('Appeler le garage au 06 05 92 28 38')
    expect(principal).toContain(
      'prediagnostic=ne-sais-pas.ne-sais-pas.ne-sais-pas">Être rappelé</a>',
    )
    expect(principal).not.toContain('Pistes possibles')
  })

  it('un résultat de niveau « Ne roulez pas » reprend les consignes de sécurité', async () => {
    const principal = contenuPrincipal(
      await page(`${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=frottement`),
    )
    expect(principal).toContain('>Ne roulez pas\u00a0: appelez-nous</h1>')
    expect(principal).toContain('<a href="tel:112">112</a>')
    expect(principal).toContain('Appelez l’assistance de votre assureur')
    // Consignes d'abord, puis les pistes ; l'impression suit la mention, comme sur l'arrêt.
    expect(
      croissantes(
        positions(principal, [
          'Mettez-vous en sécurité',
          'Pistes possibles',
          MENTION,
          '>Imprimer la fiche</button>',
        ]),
      ),
    ).toBe(true)
  })

  it('garage fermé : « Être rappelé à l’ouverture » en tête, prochaine ouverture et numéro lisibles', async () => {
    const principal = contenuPrincipal(await page(PARCOURS_BRUIT, { cadre: CADRE_FERME }))
    expect(principal).not.toContain('class="bouton bouton--principal" href="tel:')
    expect(principal).toContain(
      'class="bouton bouton--principal" href="/demande?type=rappel&amp;prediagnostic=bruit.aucun.freinage.sifflement">Être rappelé à l’ouverture</a>',
    )
    expect(principal).toContain(
      'Fermé, ouvre vendredi à 9\u00a0h. Numéro du garage\u00a0: <a href="tel:+33605922838">06\u00a005\u00a092\u00a028\u00a038</a>.',
    )
  })

  it('une branche refusée à la relecture ne dit plus que « Vos réponses ne suffisent pas »', async () => {
    const principal = contenuPrincipal(
      await page(`${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=sifflement`, {
        mode: 'production',
        arbre: { ...relire(lireArbreDuSite()), branches_non_validees: ['bruit'] },
      }),
    )
    expect(principal).toContain(INSUFFISANT)
    expect(principal).not.toContain('Des plaquettes de frein')
  })
})

/** Toutes les étapes de l'arbre du site : entrée, signes, arrêts, questions et résultats. */
function adressesDuParcours(): ReadonlySet<string> {
  const site = arbreAccepte(lireArbreDuSite())
  const adresses = new Set<string>([ENTREE])
  for (const branche of site.branches) {
    adresses.add(`${ENTREE}?q1=${branche.code}`)
    for (const signe of branche.signes) adresses.add(`${ENTREE}?q1=${branche.code}&q2=${signe}`)
    for (const chemin of cheminsDeBranche(site, branche)) {
      for (const reponseSignes of ['aucun', 'ne-sais-pas']) {
        const reponses = chemin.pas.map((pas) => pas.choix.code)
        for (let nombre = 0; nombre <= reponses.length; nombre += 1) {
          const r = reponses
            .slice(0, nombre)
            .map((code) => `&r=${code}`)
            .join('')
          adresses.add(`${ENTREE}?q1=${branche.code}&q2=${reponseSignes}${r}`)
        }
      }
    }
  }
  return adresses
}

describe('pré-diagnostic : toutes les étapes, une à une', () => {
  it('seule l’entrée nue est ouverte aux moteurs : chaque autre étape porte noindex', async () => {
    const { app: serveur } = await monter()
    const adresses = adressesDuParcours()
    expect(adresses.size).toBeGreaterThan(150)
    for (const adresse of adresses) {
      const corps = (await serveur.inject(adresse)).body
      expect(corps.includes(NOINDEX), adresse).toBe(adresse !== ENTREE)
    }
  })
})

describe('pré-diagnostic : aucune page du parcours ne dit « avis »', () => {
  it('ni l’entrée, ni les questions, ni les arrêts, ni les résultats de l’arbre du site', async () => {
    const { app: serveur } = await monter({ cadre: CADRE_OUVERT })
    const adresses = new Set<string>(['/', ...adressesDuParcours()])
    expect(adresses.size).toBeGreaterThan(150)
    for (const adresse of adresses) {
      const reponse = await serveur.inject(adresse)
      expect(reponse.statusCode, adresse).toBe(200)
      const mots = motsDe(texteVisible(reponse.body))
      expect(mots.includes('avis'), adresse).toBe(false)
      expect(texteVisible(reponse.body), adresse).not.toContain('%')
    }
  })
})

describe('pré-diagnostic : le livret de relecture', () => {
  it('une section par branche, chaque résultat avec « D’accord » et « À changer », sans code interne', async () => {
    const corps = await page(LIVRET)
    expect(corps).toContain('<h1>Livret de relecture du pré-diagnostic</h1>')
    expect(corps).toContain(NOINDEX)
    expect(corps.match(/class="pre-diagnostic-livret__branche"/g)).toHaveLength(7)
    const site = arbreAccepte(lireArbreDuSite())
    const resultatsParBranche = site.branches.map(
      (branche) =>
        new Set(
          cheminsDeBranche(site, branche).flatMap((chemin) =>
            chemin.resultat === null ? [] : [chemin.resultat.code],
          ),
        ).size,
    )
    const attendus = resultatsParBranche.reduce((total, nombre) => total + nombre, 0)
    expect(corps.match(/<\/span> D’accord/g)).toHaveLength(attendus)
    expect(corps.match(/<\/span> À changer\u00a0:/g)).toHaveLength(attendus)
    const brut = lireArbreDuSite()
    const codes = [
      ...brut.branches.map((branche) => branche.code),
      ...brut.questions.flatMap((question) => [
        question.code,
        ...question.choix.map((choix) => choix.code),
      ]),
      ...brut.resultats.map((resultat) => resultat.code),
      ...brut.signes.map((signe) => signe.code),
      'a-controler',
      'ne-pas-rouler',
      'sans-urgence',
    ].filter((code) => code.includes('-'))
    const visible = texteVisible(contenuPrincipal(corps))
    for (const code of codes) expect(visible, code).not.toContain(code)
  })

  it('reflète une modification du fichier de l’arbre : il n’est jamais édité à la main', async () => {
    const arbre = lireArbreDuSite()
    const piste = resultatBrut(arbre, 'frein-sifflement').pistes[0]
    if (piste === undefined) throw new Error('piste absente')
    piste.texte = 'Des plaquettes neuves qui se rodent encore.'
    const corps = await page(LIVRET, { mode: 'relecture', arbre })
    expect(corps).toContain('Des plaquettes neuves qui se rodent encore.')
  })

  it('affiche la relecture quand elle est datée', async () => {
    const corps = await page(LIVRET, { mode: 'relecture', arbre: relire(lireArbreDuSite()) })
    expect(corps).toContain('<dt>Relu par</dt><dd>Garagiste d’essai</dd>')
    expect(corps).toContain('<dt>Le</dt><dd>2026-10-01</dd>')
  })
})

describe('pré-diagnostic : capacité offerte aux demandes', () => {
  it('reconstitue le résumé depuis le code du lien « Être rappelé », null sinon', async () => {
    const { contexte } = await monter()
    const resume = await contexte.retrouverResumePreDiagnostic('bruit.aucun.freinage.sifflement')
    expect(resume?.symptome).toEqual({ identifiant: 'bruit', libelle: 'Un bruit inhabituel' })
    expect(resume?.urgence).toBe('a-controler')
    expect(await contexte.retrouverResumePreDiagnostic('freins.bruit')).toBeNull()
  })
})

/** L'arbre réel, passé par la porte comme au démarrage. */
function chargerArbreDuSite() {
  return chargerArbre(creerSourceArbreFichier(FICHIER_ARBRE_DU_SITE))
}

describe('pré-diagnostic : le focus suit la question, et la barre fixe emporte les réponses', () => {
  it('chaque question porte la marque du focus et cite le script qui l’y pose', async () => {
    const corps = await page(`${ENTREE}?q1=voyant`)
    expect(corps).toContain(
      '<h1 class="pre-diagnostic-question" tabindex="-1" data-pre-diagnostic-focus>',
    )
    expect(corps).toMatch(
      /<script src="\/js\/pre-diagnostic\/etape\.js\?v=[0-9a-f]+" defer><\/script>/,
    )
    expect(corps.match(/data-pre-diagnostic-focus/g)).toHaveLength(1)
  })

  it('une question en erreur pose le focus sur le message, pas sur le titre', async () => {
    const corps = await page(`${ENTREE}?q1=voyant&etape=signes`)
    expect(corps).toMatch(
      /<p class="champ__erreur pre-diagnostic-erreur" id="pre-diagnostic-erreur" tabindex="-1" data-pre-diagnostic-focus>/,
    )
    expect(corps).toContain('<h1 class="pre-diagnostic-question" tabindex="-1">')
    expect(corps.match(/data-pre-diagnostic-focus/g)).toHaveLength(1)
  })

  it('le résultat et l’arrêt posent le focus sur la conduite à tenir', async () => {
    for (const adresse of [
      `${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=sifflement`,
      `${ENTREE}?q1=freinage&q2=pedale-molle`,
    ]) {
      const corps = await page(adresse)
      expect(corps, adresse).toContain(
        '<h1 class="alerte__titre" tabindex="-1" data-pre-diagnostic-focus>',
      )
      expect(corps, adresse).toContain('/js/pre-diagnostic/etape.js')
    }
  })

  it('résultat et arrêt demandent à la barre fixe un « Être rappelé » prérempli avec le code', async () => {
    const arbre = await chargerArbreDuSite()
    const consulter = creerConsulterEtape(arbre)
    const contexte = {
      mention: arbre.mention,
      actions: arbre.actions,
      contact: null,
      aRelire: false,
    }
    for (const etat of [
      { symptome: 'bruit', signes: ['aucun'], reponses: ['freinage', 'sifflement'] },
      { symptome: 'freinage', signes: ['pedale-molle'], reponses: [] },
    ]) {
      const etape = consulter({ ...etat, coches: [], etapeEnvoyee: null })
      expect(etape.type === 'resultat' || etape.type === 'arret').toBe(true)
      if (etape.type !== 'resultat' && etape.type !== 'arret') continue
      expect(vueEtape(etape, contexte, false)).toMatchObject({
        barreFixe: { lienRappel: `/demande?type=rappel&prediagnostic=${etape.code}` },
      })
    }
  })

  it('sous les pistes : « Demander un prix pour le freinage » avec son prix, et un rendez-vous prérempli', async () => {
    const trouverFamille: TrouverFamille = async (identifiant) =>
      identifiant === 'freinage'
        ? { identifiant, libelle: 'Freinage', prixIndicatif: 'dès 89,00 € TTC' }
        : null
    const corps = contenuPrincipal(
      await page(`${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=sifflement`, { trouverFamille }),
    )
    const devis =
      '<a href="/demande?type=devis&amp;famille=freinage&amp;prediagnostic=bruit.aucun.freinage.sifflement">Demander un prix pour le freinage</a>'
    expect(corps).toContain(devis)
    expect(corps.match(/Demander un prix pour/g)).toHaveLength(1)
    // Hors de la liste des pistes : le lien ne semble pas ne concerner que la dernière.
    const liste = corps.slice(
      corps.indexOf('<ul class="pre-diagnostic-pistes__liste">'),
      corps.indexOf('<ul class="pre-diagnostic-prix">'),
    )
    expect(liste).not.toContain('Demander un prix')
    expect(texteVisible(corps)).toMatch(/Demander un prix pour le freinage dès\s89,00\s€\sTTC/u)
    // « Faites contrôler » : le rendez-vous prérempli, famille et réponses.
    expect(corps).toContain(
      '<a class="bouton bouton--secondaire" href="/demande?type=rendez-vous&amp;famille=freinage&amp;prediagnostic=bruit.aucun.freinage.sifflement">Demander un rendez-vous</a>',
    )
    // Avant l'impression, qui reste la dernière action.
    expect(corps.indexOf('Demander un rendez-vous')).toBeLessThan(
      corps.indexOf('Imprimer la fiche'),
    )
    // Sans catalogue, le lien reste nommé, sans prix.
    const sansCatalogue = contenuPrincipal(
      await page(`${ENTREE}?q1=bruit&q2=aucun&r=freinage&r=sifflement`),
    )
    expect(sansCatalogue).toContain(devis)
    expect(sansCatalogue).not.toContain('pre-diagnostic-prix__indicatif')
  })

  it('un résultat « Ne roulez pas » ne propose pas de rendez-vous', async () => {
    const corps = contenuPrincipal(await page(`${ENTREE}?q1=freinage&q2=pedale-molle`))
    expect(corps).not.toContain('Demander un rendez-vous')
  })
})
