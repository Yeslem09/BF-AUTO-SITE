import { expect, test, type Page, type TestInfo } from '@playwright/test'

const TELEPHONE_LIEN = 'tel:+33605922838'
const TELEPHONE_AFFICHE = '06 05 92 28 38'
/** Le serveur commun tourne en démonstration (voir playwright.config.ts). */
const BANDEAU_DEMONSTRATION = 'Version de démonstration : contenus à confirmer par le garage.'
/** Statut calculé depuis les horaires proposés, à l'heure réelle : ouvert ou fermé, jamais « à confirmer ». */
const STATUT_CALCULE = /^(Ouvert|Fermé)/

/** Collecte tout ce qui trahit une page cassée : erreurs de script, de console, ressources en échec. */
function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      erreurs.push(`console ${message.type()} : ${message.text()}`)
    }
  })
  page.on('pageerror', (erreur) => erreurs.push(`script : ${erreur.message}`))
  page.on('requestfailed', (requete) => erreurs.push(`requête en échec : ${requete.url()}`))
  page.on('response', (reponse) => {
    if (reponse.status() >= 400) erreurs.push(`${reponse.status()} : ${reponse.url()}`)
  })
  return erreurs
}

/** Sur téléphone, la navigation vit dans le menu <details> : on l'ouvre d'abord. */
async function navigationPrincipale(page: Page, infos: TestInfo) {
  if (infos.project.name === 'mobile') await page.locator('.menu__bouton').click()
  return page.getByRole('navigation', { name: 'Navigation principale' })
}

test.describe('fumée : page d’accueil', () => {
  test('s’affiche, sans aucune erreur de console ni ressource manquante', async ({
    page,
  }, infos) => {
    const erreurs = surveillerErreurs(page)
    const reponse = await page.goto('/', { waitUntil: 'networkidle' })
    expect(reponse?.status()).toBe(200)
    await expect(page).toHaveTitle('BF Auto, garage automobile à Choisy-le-Roi')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'BF Auto, garage automobile à Choisy-le-Roi',
    )
    await expect(await navigationPrincipale(page, infos)).toBeVisible()
    // Le bandeau vit dans un repère (l'en-tête) : aucun texte hors repère (axe-core, « region »).
    await expect(page.getByRole('banner').getByRole('note')).toHaveText(BANDEAU_DEMONSTRATION)
    expect(reponse?.headers()['x-robots-tag']).toBe('noindex')
    expect(erreurs).toEqual([])
  })

  test('le pied de page donne l’adresse, le téléphone, le statut calculé et les pages légales', async ({
    page,
  }) => {
    await page.goto('/')
    const pied = page.getByRole('contentinfo')
    await expect(pied).toContainText('7 rue Demanieux')
    await expect(pied).toContainText('94600 Choisy-le-Roi')
    await expect(pied.getByRole('link', { name: TELEPHONE_AFFICHE })).toHaveAttribute(
      'href',
      TELEPHONE_LIEN,
    )
    await expect(pied.locator('.statut')).toHaveText(STATUT_CALCULE)
    for (const [nom, chemin] of [
      ['Mentions légales', '/mentions-legales'],
      ['Confidentialité', '/confidentialite'],
      ['Vos droits chez nous', '/vos-droits'],
    ] as const) {
      await expect(pied.getByRole('link', { name: nom })).toHaveAttribute('href', chemin)
    }
  })

  test('le téléphone est un lien d’appel correct, visible dès l’en-tête', async ({ page }) => {
    await page.goto('/')
    const appelEntete = page.locator('header').getByRole('link', { name: /06 05 92 28 38/ })
    await expect(appelEntete).toBeVisible()
    await expect(appelEntete).toHaveAttribute('href', TELEPHONE_LIEN)
    const liensAppel = page.locator(`a[href^="tel:"]`)
    for (const lien of await liensAppel.all()) {
      await expect(lien).toHaveAttribute('href', TELEPHONE_LIEN)
    }
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: TELEPHONE_AFFICHE }),
    ).toBeVisible()
  })

  test('le lien d’évitement mène au contenu principal au clavier', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const evitement = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(evitement).toBeFocused()
    await expect(evitement).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#contenu')).toBeFocused()
    await page.keyboard.press('Tab')
    const dansLeContenu = await page.evaluate(
      () => document.activeElement?.closest('main#contenu') !== null,
    )
    expect(dansLeContenu).toBe(true)
  })
})

test.describe('fumée : accueil assemblé par blocs', () => {
  test('les zones fournies suivent l’ordre du téléphone, et la grille les replace sur ordinateur', async ({
    page,
  }, infos) => {
    await page.goto('/')
    const information = page.locator('.accueil__zone--information')
    const garage = page.locator('.accueil__zone--garage')
    await expect(information).toBeVisible()
    await expect(garage).toBeVisible()
    const boiteInformation = await information.boundingBox()
    const boiteGarage = await garage.boundingBox()
    expect(boiteInformation).not.toBeNull()
    expect(boiteGarage).not.toBeNull()
    if (boiteInformation === null || boiteGarage === null) return
    if (infos.project.name === 'mobile') {
      expect(boiteGarage.y).toBeGreaterThan(boiteInformation.y + boiteInformation.height - 1)
    } else {
      expect(boiteGarage.x).toBeGreaterThan(boiteInformation.x + boiteInformation.width - 1)
    }
  })

  test('la navigation principale compte cinq entrées au plus, pièces détachées en tête, aucune ne mène à une page absente', async ({
    page,
    request,
  }, infos) => {
    await page.goto('/')
    const liens = (await navigationPrincipale(page, infos)).getByRole('link')
    await expect(liens.first()).toHaveText('Pièces détachées')
    const adresses = await liens.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href') ?? ''),
    )
    expect(adresses.length).toBeGreaterThan(0)
    expect(adresses.length).toBeLessThanOrEqual(5)
    for (const adresse of adresses) {
      expect((await request.get(adresse)).status(), adresse).toBe(200)
    }
  })
})

test.describe('fumée : navigation', () => {
  for (const [chemin, titre] of [
    ['/pieces-et-reparations', 'Pièces détachées'],
    ['/pieces-et-reparations/freinage', 'Freinage'],
    ['/tarifs', 'Tarifs'],
    ['/pre-diagnostic', 'Un souci avec votre voiture ?'],
    ['/demande?type=rendez-vous', 'Faire une demande'],
    ['/demande?type=devis', 'Faire une demande'],
    ['/acces-et-horaires', 'Accès et horaires'],
    ['/vos-droits', 'Vos droits chez nous'],
    ['/garagiste/connexion', 'Espace garagiste'],
    ['/mentions-legales', 'Mentions légales'],
    ['/confidentialite', 'Confidentialité'],
  ] as const) {
    test(`${chemin} répond dans la mise en page commune, sans erreur`, async ({ page }) => {
      const erreurs = surveillerErreurs(page)
      const reponse = await page.goto(chemin, { waitUntil: 'networkidle' })
      expect(reponse?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titre)
      expect(erreurs).toEqual([])
    })
  }

  test('une adresse inconnue donne une page 404 utile', async ({ page }) => {
    const reponse = await page.goto('/page-qui-n-existe-pas')
    expect(reponse?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable')
    await expect(page.getByRole('link', { name: 'Revenir à l’accueil' })).toBeVisible()
  })
})
