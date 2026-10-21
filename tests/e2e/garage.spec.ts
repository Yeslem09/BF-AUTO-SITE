/**
 * Parcours navigateur du contexte garage, clic réel, bureau et iPhone 13.
 *
 * - Pages publiques : sur le serveur de la configuration e2e, lancé en mode
 *   démonstration (MODE_SITE=demonstration) : en production, la porte de
 *   démarrage refuse le vrai fichier tant que ses données bloquantes ne sont
 *   pas validées.
 * - Espace garagiste : l'accès réel (contexte accès) n'étant pas celui de ce
 *   contexte, un serveur dédié monte le module garage avec une session d'essai,
 *   une horloge fixe (mercredi 23 septembre 2026, 10 h à Paris) et une base jetable.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import type { FastifyInstance } from 'fastify'
import { NOM_COOKIE_SESSION } from '../../src/contrats/index.js'
import { creerHorlogeFixe } from '../../src/contextes/garage/adaptateurs/horloge/horloge-fixe.js'
import { assemblerGarage } from '../../src/contextes/garage/module.js'
import { PROTECTION_FORMULAIRES_ESSAI } from '../../src/web/essai.js'
import { creerServeur } from '../../src/web/serveur.js'

const RACINE = resolve(import.meta.dirname, '../..')
const JETON_ESSAI = 'jeton-e2e-garage'
const MERCREDI_10H = new Date('2026-09-23T08:00:00Z')
const CIBLE_TACTILE_PX = 44

/** Toute requête vers un autre domaine, et tout cookie posé, sont des fautes (US-07). */
function surveiller(page: Page, origine: string): string[] {
  const fautes: string[] = []
  page.on('request', (requete) => {
    if (!requete.url().startsWith(origine)) fautes.push(`requête tierce : ${requete.url()}`)
  })
  page.on('response', async (reponse) => {
    const cookie = await reponse.headerValue('set-cookie')
    if (cookie !== null) fautes.push(`cookie posé par ${reponse.url()}`)
  })
  page.on('pageerror', (erreur) => fautes.push(`script : ${erreur.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') fautes.push(`console : ${message.text()}`)
  })
  return fautes
}

/** Les cinq emplacements de l'accueil que le garage fournit (les autres sont à d'autres contextes). */
const ZONES_GARAGE =
  '.accueil__zone--statut, .accueil__zone--information, .accueil__zone--questions, .accueil__zone--garage, .accueil__zone--encart'

/**
 * Pages publiques du garage, et la partie qu'il y rend : sur l'accueil, ses
 * emplacements ; ailleurs, tout le contenu.
 */
const PAGES_GARAGE = [
  ['/', ZONES_GARAGE],
  ['/acces-et-horaires', 'main'],
  ['/vos-droits', 'main'],
  ['/mentions-legales', 'main'],
  ['/confidentialite', 'main'],
] as const

/**
 * Liens et boutons seuls sur leur ligne (le bloc qui les porte ne contient
 * qu'eux) plus bas que la cible tactile. Un lien pris dans une phrase garde la
 * hauteur de la ligne : il n'est pas compté. Volets dépliés avant la mesure.
 * Le fil d'Ariane est un composant commun (public/css/composants.css) dont la
 * hauteur ne se règle pas ici : écarté de la mesure, signalé en besoin partagé.
 */
async function ciblesTropPetites(page: Page, zones: string): Promise<string[]> {
  await page.locator('details').evaluateAll((volets) => {
    for (const volet of volets) volet.setAttribute('open', '')
  })
  return page.locator(zones).evaluateAll((elements, minimum) => {
    const fautes: string[] = []
    for (const zone of elements) {
      for (const cible of zone.querySelectorAll('a, button')) {
        if (cible.closest('.fil-ariane') !== null) continue
        const boite = cible.getBoundingClientRect()
        const bloc = cible.parentElement
        const seule = bloc !== null && bloc.textContent?.trim() === cible.textContent?.trim()
        if (boite.width > 0 && seule && boite.height < minimum) {
          fautes.push(`${Math.round(boite.height)} px : ${cible.textContent?.trim() ?? ''}`)
        }
      }
    }
    return fautes
  }, CIBLE_TACTILE_PX)
}

async function hauteur(page: Page, selecteur: string): Promise<number> {
  const boite = await page.locator(selecteur).first().boundingBox()
  return boite?.height ?? 0
}

test.describe('garage : accueil public', () => {
  test('la zone « Vos questions » se déplie au clic, sans requête tierce ni cookie', async ({
    page,
    baseURL,
  }) => {
    const fautes = surveiller(page, baseURL ?? '')
    await page.goto('/')
    const zone = page.getByRole('region', { name: 'Avant de nous confier votre voiture' })
    await expect(zone.locator('.surtitre')).toHaveText('Vos questions')
    const question = zone.getByText('Vais-je perdre la garantie de mon constructeur')
    const reponse = zone.getByText('votre garantie d’origine reste valable')
    await expect(reponse).toBeHidden()
    await question.click()
    await expect(reponse).toBeVisible()
    await expect(zone.getByRole('link', { name: /^Le texte/ })).toHaveAttribute(
      'href',
      'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=legissum:cc0008',
    )
    expect(await hauteur(page, '.accueil__zone--questions .volet__titre')).toBeGreaterThanOrEqual(
      CIBLE_TACTILE_PX,
    )
    expect(fautes).toEqual([])
  })

  test('chaque page du garage : ni requête tierce, ni cookie, ni bandeau de consentement (US-07)', async ({
    page,
    baseURL,
  }) => {
    const fautes = surveiller(page, baseURL ?? '')
    for (const [chemin] of PAGES_GARAGE) {
      const reponse = await page.goto(chemin, { waitUntil: 'networkidle' })
      expect(reponse?.status(), chemin).toBe(200)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('button', { name: /accepter|refuser|cookies/i })).toHaveCount(0)
    }
    expect(fautes).toEqual([])
  })

  test('chaque lien seul sur sa ligne offre une cible tactile de 44 px', async ({ page }) => {
    for (const [chemin, zones] of PAGES_GARAGE) {
      await page.goto(chemin)
      expect(await ciblesTropPetites(page, zones), chemin).toEqual([])
    }
  })

  test('un volet dit son état : le signe plus devient moins à l’ouverture, la première question est dépliée', async ({
    page,
  }) => {
    await page.goto('/')
    const volets = page.locator('.accueil__zone--questions .volet')
    await expect(volets.first()).toHaveAttribute('open', '')
    await expect(
      page.getByText('arrêtez-vous dès que vous pouvez le faire en sécurité'),
    ).toBeVisible()
    const volet = volets.nth(1)
    const resume = volet.locator('.volet__titre')
    const repere = () =>
      resume.evaluate((element) => getComputedStyle(element, '::after').transform)
    const ferme = await repere()
    expect(ferme).not.toBe('none')
    await resume.click()
    await expect(volet).toHaveAttribute('open', '')
    await expect.poll(repere).not.toBe(ferme)
    await resume.click()
    await expect(volet).not.toHaveAttribute('open', '')
  })

  test('statut du jour et adresse courte en tête de la bande : la ligne de l’en-tête s’efface', async ({
    page,
  }, infos) => {
    await page.goto('/')
    const statut = page.locator('.accueil__zone--statut')
    await expect(statut.locator('.statut--pastille')).toBeVisible()
    await expect(statut).toContainText('7 rue Demanieux')
    await expect(page.locator('.entete__statut')).toBeHidden()
    const boite = await statut.boundingBox()
    expect((boite?.y ?? Infinity) + (boite?.height ?? 0)).toBeLessThanOrEqual(
      page.viewportSize()?.height ?? 0,
    )
    const itineraire = statut.getByRole('link', { name: /^Itinéraire/ })
    if (infos.project.name === 'mobile') {
      // Sur téléphone, la ligne tient sur une rangée : l'itinéraire est dans le bloc du garage.
      await expect(itineraire).toBeHidden()
      expect(boite?.height ?? 0).toBeLessThan(2 * CIBLE_TACTILE_PX)
    } else {
      await expect(itineraire).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/dir\//)
      expect((await itineraire.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
  })

  test('l’atelier : ce qu’il fait, la méthode en trois étapes, puis la Fig. 1 en grand', async ({
    page,
  }) => {
    await page.goto('/')
    const atelier = page.locator('.accueil__zone--information')
    await expect(atelier.getByRole('heading', { level: 2 })).toHaveText(
      'Entretien et réparation, au 7 rue Demanieux',
    )
    await expect(atelier).toContainText('Mécanique, entretien et peinture, toutes marques.')
    await expect(atelier.locator('.garage-methode__verbe')).toHaveText([
      'On explique',
      'On chiffre',
      'Vous décidez',
    ])
    const figure = atelier.locator('.figure-technique')
    await expect(figure).toBeVisible()
    await expect(figure.locator('figcaption')).toContainText('Fig. 1')
    const largeurFigure = (await figure.boundingBox())?.width ?? 0
    const largeurZone = (await atelier.boundingBox())?.width ?? 0
    expect(largeurFigure).toBeGreaterThan(largeurZone * 0.75)
    await atelier.getByRole('link', { name: 'Voir tous les tarifs' }).click()
    await expect(page).toHaveURL(/\/tarifs$/)
  })

  test('l’atelier : trois exemples de prix, chacun mène à sa famille', async ({ page }) => {
    await page.goto('/')
    const exemples = page.locator('.accueil__zone--information table.tableau-tarifs')
    await expect(exemples.getByRole('rowheader')).toHaveCount(3)
    await expect(exemples.getByRole('link')).toHaveText([
      'Vidange',
      'Révision',
      'Plaquettes avant posées',
    ])
    for (const cellule of await exemples.locator('td').allTextContents()) {
      expect(cellule).toMatch(/^À partir de \d+,\d{2}\s€\sTTC$/)
    }
    const largeurTableau = (await exemples.boundingBox())?.width ?? 0
    const largeurZone =
      (await page.locator('.accueil__zone--information').boundingBox())?.width ?? 0
    expect(largeurTableau).toBeLessThanOrEqual(largeurZone + 1)
    await exemples.getByRole('link', { name: 'Révision' }).click()
    await expect(page).toHaveURL(/\/pieces-et-reparations\/vidange-et-filtres$/)
  })

  test('Accès : une seule région « Horaires », et les arrêts de tramway et de bus proches', async ({
    page,
  }) => {
    await page.goto('/acces-et-horaires')
    await expect(page.getByRole('region', { name: 'Horaires', exact: true })).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Horaires d’ouverture' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'En transports en commun' })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('Tramway T9')
  })

  test('encart « Nouveau nom » sous les colonnes, jamais en tête (AE-39)', async ({ page }) => {
    await page.goto('/')
    const encart = page.locator('.accueil__zone--encart .encart')
    await expect(encart).toBeVisible()
    await expect(encart.locator('.encart__titre')).toHaveText(
      '« Garage auto Choisy 94 » devient BF Auto',
    )
    const garage = await page.locator('.accueil__zone--garage').boundingBox()
    const boite = await encart.boundingBox()
    expect(boite?.y ?? 0).toBeGreaterThan((garage?.y ?? 0) + (garage?.height ?? 0) - 1)
  })

  test('horaires sans pointillés : filets pleins, aucun soulignement pointillé', async ({
    page,
  }) => {
    await page.goto('/')
    const styles = await page
      .locator('.garage-horaires th, .garage-horaires td, .garage-horaires span')
      .evaluateAll((cellules) =>
        cellules.flatMap((cellule) => {
          const style = getComputedStyle(cellule)
          return [style.borderBottomStyle, style.textDecorationStyle, style.borderLeftStyle]
        }),
      )
    expect(styles).not.toContain('dotted')
    expect(styles).not.toContain('dashed')
  })

  test('chaque page du garage : en-tête de page, fil d’Ariane qui ramène à l’accueil au clic', async ({
    page,
  }) => {
    for (const [chemin, titre] of [
      ['/acces-et-horaires', 'Accès et horaires'],
      ['/vos-droits', 'Vos droits chez nous'],
      ['/mentions-legales', 'Mentions légales'],
      ['/confidentialite', 'Confidentialité'],
    ] as const) {
      await page.goto(chemin)
      const fil = page.getByRole('navigation', { name: 'Fil d’Ariane' })
      await expect(fil.getByRole('link', { name: titre })).toHaveAttribute('aria-current', 'page')
      await expect(page.locator('.entete-page h1')).toHaveText(titre)
      await fil.getByRole('link', { name: 'Accueil' }).click()
      await expect(page).toHaveURL(/\/$/)
    }
  })

  test('les horaires commencent par aujourd’hui, dit en toutes lettres', async ({ page }) => {
    await page.goto('/')
    const premiereLigne = page.locator('.garage-horaires tbody tr').first()
    await expect(premiereLigne).toContainText('(aujourd’hui)')
    await expect(page.locator('.garage-horaires tbody tr')).toHaveCount(7)
  })

  test('les données structurées AutoRepair sont lisibles et sans note', async ({ page }) => {
    await page.goto('/')
    const json = await page.locator('script[type="application/ld+json"]').first().textContent()
    const donnees = JSON.parse(json ?? '{}') as Record<string, unknown>
    expect(donnees['@type']).toBe('AutoRepair')
    expect(donnees['telephone']).toBe('+33605922838')
    expect(JSON.stringify(donnees)).not.toMatch(/aggregateRating|review/)
  })

  test('l’itinéraire est un lien externe, aucune carte n’est chargée', async ({ page }) => {
    await page.goto('/acces-et-horaires')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accès et horaires')
    await expect(page.getByRole('link', { name: 'Itinéraire avec Google Maps' })).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=7%20rue%20Demanieux/,
    )
    await expect(page.getByRole('link', { name: 'ou avec Plans d’Apple' })).toHaveAttribute(
      'href',
      /^https:\/\/maps\.apple\.com\//,
    )
    await expect(page.locator('iframe, img')).toHaveCount(0)
  })
})

test.describe('garage : sans JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('la question urgente se lit dépliée, une autre s’ouvre au clavier', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByText('arrêtez-vous dès que vous pouvez le faire en sécurité'),
    ).toBeVisible()
    const resume = page.locator('summary', { hasText: 'Vais-je perdre la garantie' })
    const reponse = page.getByText('votre garantie d’origine reste valable')
    await expect(reponse).toBeHidden()
    await resume.focus()
    await page.keyboard.press('Enter')
    await expect(reponse).toBeVisible()
  })

  test('les pages de droits et légales s’affichent entières', async ({ page }) => {
    for (const [chemin, titre] of [
      ['/vos-droits', 'Vos droits chez nous'],
      ['/mentions-legales', 'Mentions légales'],
      ['/confidentialite', 'Confidentialité'],
    ] as const) {
      const reponse = await page.goto(chemin)
      expect(reponse?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titre)
    }
    await page.goto('/vos-droits')
    await expect(page.getByText('pièces issues de l’économie circulaire').first()).toBeVisible()
  })

  test('/avis répond 404 tant que le lien d’avis n’est pas validé', async ({ page }) => {
    const reponse = await page.goto('/avis')
    expect(reponse?.status()).toBe(404)
  })

  test('les fermetures exigent une session : retour à la connexion', async ({ page }) => {
    await page.goto('/garagiste/fermetures')
    expect(new URL(page.url()).pathname).toBe('/garagiste/connexion')
    expect(new URL(page.url()).searchParams.get('retour')).toBe('/garagiste/fermetures')
  })
})

interface ServeurDedie {
  readonly origine: string
  fermer(): Promise<void>
}

async function monterServeurGaragiste(): Promise<ServeurDedie> {
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-e2e-garage-'))
  const horloge = creerHorlogeFixe(MERCREDI_10H)
  const garage = await assemblerGarage({
    mode: 'demonstration',
    cheminFichier: join(RACINE, 'donnees/garage.json'),
    horloge,
    cheminBase: join(dossier, 'base.sqlite'),
    preDiagnosticPublie: true,
    // Aucun prix du socle : l'espace garagiste n'en dépend pas.
    consulterTarifsDuSocle: async () => ({
      tauxHoraire: null,
      premierControle: null,
      exemples: [],
    }),
  })
  const app: FastifyInstance = await creerServeur({
    modules: [garage.module],
    fournirCadre: garage.fournirCadre,
    urlPublique: 'http://127.0.0.1',
    racinePublique: join(RACINE, 'public'),
    niveauJournal: 'silent',
    verifierSessionGaragiste: async (jeton) => jeton === JETON_ESSAI,
    maintenant: () => horloge.maintenant(),
    mode: 'demonstration',
    preDiagnosticPublie: true,
    protectionFormulairesGaragiste: PROTECTION_FORMULAIRES_ESSAI,
  })
  await app.listen({ port: 0, host: '127.0.0.1' })
  const { port } = app.server.address() as AddressInfo
  return {
    origine: `http://127.0.0.1:${port}`,
    fermer: async () => {
      // Le navigateur d'essai garde des connexions ouvertes (maintien, ressource
      // encore en vol) : elles ne doivent pas retenir l'arrêt au-delà du délai du test.
      const arret = app.close()
      app.server.closeAllConnections()
      await arret
      await rm(dossier, { recursive: true, force: true })
    },
  }
}

async function ouvrirSession(context: BrowserContext, origine: string): Promise<void> {
  await context.addCookies([{ name: NOM_COOKIE_SESSION, value: JETON_ESSAI, url: origine }])
}

for (const javaScript of [true, false]) {
  test.describe(`garage : espace garagiste, JavaScript ${javaScript ? 'actif' : 'coupé'}`, () => {
    test.use({ javaScriptEnabled: javaScript })
    let serveur: ServeurDedie

    test.beforeEach(async ({ context }) => {
      serveur = await monterServeurGaragiste()
      await ouvrirSession(context, serveur.origine)
    })
    test.afterEach(async () => serveur.fermer())

    test('« Imprévu aujourd’hui » en deux gestes ferme le garage sur le site public', async ({
      page,
    }) => {
      await page.goto(`${serveur.origine}/`)
      await expect(page.locator('.garage-coordonnees .statut')).toHaveText('Ouvert, ferme à 12 h')

      await page.goto(`${serveur.origine}/garagiste/fermetures`)
      const bouton = page.getByRole('link', { name: 'Imprévu aujourd’hui' })
      expect((await bouton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
      await bouton.click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Fermer le garage aujourd’hui ?',
      )
      await page.getByRole('button', { name: 'Confirmer' }).click()

      await expect(page).toHaveURL(/\/garagiste\/fermetures\?fait=enregistree$/)
      await expect(page.getByRole('status')).toContainText('Fermeture enregistrée')
      await expect(
        page.getByRole('link', { name: 'Déclarez aussi cette fermeture sur votre fiche Google' }),
      ).toBeVisible()
      await expect(
        page.getByText('Le garage est déclaré fermé aujourd’hui (imprévu).'),
      ).toBeVisible()

      await page.goto(`${serveur.origine}/`)
      await expect(page.locator('.garage-coordonnees .statut')).toHaveText(
        'Fermé exceptionnellement, ouvre jeudi à 8 h 30',
      )
      await expect(page.getByRole('contentinfo')).toContainText('Fermé exceptionnellement')
    })

    test('déclarer une période, la voir sur le site, puis la supprimer', async ({ page }) => {
      await page.goto(`${serveur.origine}/garagiste/fermetures`)
      await page.getByLabel('Du', { exact: true }).fill('2026-09-28')
      await page.getByLabel('Au', { exact: true }).fill('2026-10-03')
      await page.getByLabel('Motif', { exact: true }).selectOption('conges')
      await page.getByRole('button', { name: 'Enregistrer la fermeture' }).click()

      await expect(page.getByRole('status')).toContainText('Fermeture enregistrée')
      await expect(page.locator('.garage-fermetures__element')).toContainText(
        'Du lundi 28 septembre 2026 au samedi 3 octobre 2026',
      )

      await page.goto(`${serveur.origine}/acces-et-horaires`)
      await expect(
        page.getByText('Du lundi 28 septembre au samedi 3 octobre : congés.'),
      ).toBeVisible()

      await page.goto(`${serveur.origine}/garagiste/fermetures`)
      await page
        .getByRole('button', { name: /^Supprimer la fermeture du lundi 28 septembre/ })
        .click()
      await expect(page.getByRole('status')).toContainText(
        'Fermeture du lundi 28 septembre au samedi 3 octobre supprimée',
      )
      await expect(page.getByText('Aucune fermeture prévue')).toBeVisible()
      // « Annuler » rétablit la même période (J4, passe 2 du jury).
      await page.getByRole('status').getByRole('button', { name: 'Annuler' }).click()
      await expect(page.getByRole('status')).toContainText('Fermeture rétablie')
      await expect(page.locator('.garage-fermetures__element')).toContainText(
        'Du lundi 28 septembre 2026 au samedi 3 octobre 2026',
      )
      await page
        .getByRole('button', { name: /^Supprimer la fermeture du lundi 28 septembre/ })
        .click()
      await expect(page.getByText('Aucune fermeture prévue')).toBeVisible()
    })

    test('une saisie fausse est refusée, expliquée et reliée à son champ', async ({ page }) => {
      await page.goto(`${serveur.origine}/garagiste/fermetures`)
      await page.getByLabel('Du', { exact: true }).fill('2026-10-07')
      await page.getByLabel('Au', { exact: true }).fill('2026-09-28')
      await page.getByRole('button', { name: 'Enregistrer la fermeture' }).click()

      await expect(page.getByRole('alert')).toContainText('La fermeture n’a pas été enregistrée.')
      const au = page.getByLabel('Au', { exact: true })
      await expect(au).toHaveAttribute('aria-invalid', 'true')
      await expect(au).toHaveAccessibleDescription(
        /Le dernier jour doit être le premier jour ou le suivre\./,
      )
      await expect(au).toHaveValue('2026-09-28')
      await expect(page.getByLabel('Du', { exact: true })).toHaveValue('2026-10-07')
    })
  })
}
