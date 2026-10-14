import { expect, test, type Page } from '@playwright/test'

// Sur téléphone, la barre fixe basse porte aussi « Être rappelé » et le menu <details>
// compte comme un groupe : les repères de la page se cherchent dans <main>.

/**
 * Parcours navigateur du contexte demandes : clics réels, bureau et iPhone 13,
 * avec et sans JavaScript. Le serveur commun tourne en démonstration : chaque
 * demande est enregistrée dans sa base jetable et sa notification s'écrit dans
 * la console, ce qui ne change rien au client.
 */

const CONFIRMATION = /\/demande\/envoyee\?j=[A-Za-z0-9_-]{22}$/
/** Le délai minimal de saisie (D9) : un humain met plus de trois secondes à remplir un formulaire. */
const DELAI_HUMAIN_MS = 3_100
/** Cible tactile minimale (WCAG 2.2, jeton --cible-tactile). */
const CIBLE_TACTILE_PX = 44

/** Erreurs de script et ressources en échec ; le document lui-même peut répondre 422. */
function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = []
  page.on('pageerror', (erreur) => erreurs.push(`script : ${erreur.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(`console : ${message.text()}`)
  })
  page.on('response', (reponse) => {
    const document = reponse.request().resourceType() === 'document'
    if (!document && reponse.status() >= 400) erreurs.push(`${reponse.status()} : ${reponse.url()}`)
  })
  return erreurs
}

/** Remplit le rendez-vous comme un client : cinq gestes, un par champ. */
async function remplirRendezVous(page: Page): Promise<number> {
  await page.getByLabel('Pour quelle intervention ?').selectOption('entretien')
  await page.getByLabel('Le plus tôt possible').check()
  await page.getByLabel('Votre prénom').fill('Julie')
  await page.getByLabel('Votre téléphone').fill('06 12 34 56 78')
  await page.getByLabel('En fin de journée', { exact: true }).check()
  return 5
}

async function verifierConfirmationRendezVous(page: Page): Promise<void> {
  await expect(page).toHaveURL(CONFIRMATION)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Demande enregistrée')
  await expect(page.getByText('Ce n’est pas encore une réservation')).toBeVisible()
  const recapitulatif = page.getByRole('region', { name: 'Récapitulatif' })
  await expect(recapitulatif).toContainText('Demande de rendez-vous')
  await expect(recapitulatif).toContainText('Le plus tôt possible')
  await expect(recapitulatif).toContainText('06 12 34 56 78')
  // En démonstration, le numéro de rappel proposé est cité à la suite de la phrase.
  await expect(page.getByText(/vous rappelle au numéro indiqué[.,]/)).toBeVisible()
}

test.describe('demande de rendez-vous (US-11, P-07)', () => {
  test('parcours complet au clic, en dix gestes au plus, sans erreur', async ({ page }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/demande?type=rendez-vous')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Faire une demande')
    const types = page.getByRole('group', { name: 'Type de demande' })
    await expect(types.getByRole('button', { name: 'Rendez-vous' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    let gestes = await remplirRendezVous(page)
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Demander un rendez-vous' }).click()
    gestes += 1
    await verifierConfirmationRendezVous(page)
    expect(gestes).toBeLessThanOrEqual(10)
    expect(erreurs).toEqual([])
  })

  test('aucune page de demande ne parle de réserver', async ({ page }) => {
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      await page.goto(`/demande?type=${type}`)
      await expect(page.locator('main')).not.toContainText(/Réserver|Prendre RDV/)
    }
  })

  test('sur téléphone, le formulaire tient dans la largeur, sans défilement horizontal', async ({
    page,
  }) => {
    await page.goto('/demande?type=devis')
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(debordement).toBeLessThanOrEqual(0)
  })
})

test.describe('demande de devis (US-28)', () => {
  test('plaque saisie en minuscules, gamme cochée : la confirmation reprend la plaque normalisée', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/demande?type=devis')
    await page.getByLabel('Pour quelle intervention ?').selectOption('reparation')
    // Le facultatif est replié sous « Ajouter des précisions » (J6, passe 2 du jury).
    await page.getByText('Ajouter des précisions').click()
    await page
      .getByLabel('D’occasion ou reconditionnée (pièce issue de l’économie circulaire)')
      .check()
    await page.getByLabel('Plaque d’immatriculation').fill('ab 123 cd')
    await page.getByLabel('Votre prénom').fill('Léa')
    await page.getByLabel('Votre téléphone').fill('+33 6 12 34 56 78')
    await page.getByLabel('À midi', { exact: true }).check()
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Demander un prix' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    const recapitulatif = page.getByRole('region', { name: 'Récapitulatif' })
    await expect(recapitulatif).toContainText('plaque AB-123-CD')
    await expect(recapitulatif).toContainText('D’occasion ou reconditionnée')
    await expect(recapitulatif).toContainText('06 12 34 56 78')
    expect(erreurs).toEqual([])
  })

  test('une plaque fausse : le lien du récapitulatif d’erreurs mène au champ', async ({ page }) => {
    await page.goto('/demande?type=devis')
    await page.getByLabel('Plaque d’immatriculation').fill('12-AB')
    await page.getByRole('button', { name: 'Demander un prix' }).click()
    await expect(page.locator('#demande-erreurs')).toBeFocused()
    await page.getByRole('link', { name: /Plaque non reconnue/ }).click()
    await expect(page.getByLabel('Plaque d’immatriculation')).toBeFocused()
    await expect(page.getByLabel('Plaque d’immatriculation')).toHaveValue('12-AB')
  })
})

test.describe('retour arrière après un envoi (AE-35)', () => {
  test('une seconde demande envoyée depuis le même formulaire n’est jamais jetée', async ({
    page,
  }) => {
    await page.goto('/demande?type=rappel')
    await page.getByLabel('Un souci avec ma voiture').check()
    await page.getByLabel('Votre prénom').fill('Premier')
    await page.getByLabel('Votre téléphone').fill('06 11 11 11 11')
    await page.getByLabel('Le matin', { exact: true }).check()
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    const premiere = page.url()

    await page.goBack()
    await page.getByLabel('Votre prénom').fill('Second')
    await page.getByLabel('Votre téléphone').fill('06 22 22 22 22')
    await page.getByRole('button', { name: 'Être rappelé' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmez l’envoi')
    await expect(
      page.getByText('Ce formulaire a déjà servi à envoyer une autre demande'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Confirmer l’envoi' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    expect(page.url()).not.toBe(premiere)
    const recapitulatif = page.getByRole('region', { name: 'Récapitulatif' })
    await expect(recapitulatif).toContainText('Second')
    await expect(recapitulatif).toContainText('06 22 22 22 22')
  })
})

test.describe('sans JavaScript (B-15)', () => {
  test.use({ javaScriptEnabled: false })

  test('le rendez-vous s’envoie et la confirmation s’affiche', async ({ page }) => {
    await page.goto('/demande?type=rendez-vous')
    await remplirRendezVous(page)
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Demander un rendez-vous' }).click()
    await verifierConfirmationRendezVous(page)
  })

  test('les erreurs s’affichent par champ, récapitulées, les valeurs conservées', async ({
    page,
  }) => {
    await page.goto('/demande?type=devis')
    await page.getByLabel('Votre prénom').fill('Julie')
    await page.getByLabel('Votre téléphone').fill('12')
    await page.getByRole('button', { name: 'Demander un prix' }).click()
    await expect(page).toHaveTitle(/^Erreur\s: Faire une demande/)
    const recapitulatif = page.getByRole('heading', { name: /Le formulaire contient \d erreurs/ })
    await expect(recapitulatif).toBeVisible()
    const telephone = page.getByLabel('Votre téléphone')
    await expect(telephone).toHaveAttribute('aria-invalid', 'true')
    await expect(telephone).toHaveValue('12')
    await expect(telephone).toHaveAccessibleDescription(/Numéro non reconnu/)
    await expect(page.getByLabel('Votre prénom')).toHaveValue('Julie')
    await expect(
      page.getByText(
        'Indiquez la plaque, ou la marque, le modèle, l’année et l’énergie : sans cela, nous devrons vous rappeler pour le demander.',
      ),
    ).toHaveCount(2)
  })
})

test.describe('« Être rappelé » depuis l’accueil (D4, US-08, US-15)', () => {
  test('rempli en moins de deux secondes : un seul écran de confirmation, puis la demande part', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/')
    // Un seul formulaire de demande sur l'accueil (la recherche de pièces est un autre formulaire).
    await expect(page.locator('main form[action="/demande"]')).toHaveCount(1)
    const bloc = page.getByRole('region', { name: 'Être rappelé' })
    await bloc.getByLabel('Motif de l’appel').selectOption('souci')
    await bloc.getByLabel('Votre prénom').fill('Karim')
    await bloc.getByLabel('Votre téléphone').fill('07 11 22 33 44')
    await bloc.getByLabel('Le matin', { exact: true }).check()
    await bloc.getByRole('button', { name: 'Être rappelé' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmez l’envoi')
    await expect(page.getByLabel('Votre prénom')).toHaveValue('Karim')
    // Écran court (J1) : le résumé en deux lignes, le bouton dans le premier écran, sans défiler.
    await expect(page.locator('.demandes-a-confirmer__resume')).toContainText('Karim')
    const confirmer = page.getByRole('button', { name: 'Confirmer l’envoi' })
    const boite = await confirmer.boundingBox()
    // Ni sous le bord de l'écran, ni sous une barre fixe basse : l'écran n'en a pas (J1).
    await expect(page.locator('.barre-fixe')).toHaveCount(0)
    const limite = page.viewportSize()?.height ?? 0
    expect((boite?.y ?? limite) + (boite?.height ?? 0)).toBeLessThanOrEqual(limite)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await confirmer.click()

    await expect(page).toHaveURL(CONFIRMATION)
    await expect(page.getByText('Votre demande de rappel est enregistrée.')).toBeVisible()
    expect(erreurs).toEqual([])
  })

  test('le champ piège n’est jamais atteint au clavier', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Parcours clavier mesuré sur Chromium')
    await page.goto('/demande?type=rappel')
    // Départ avant le formulaire : le champ piège le précède dans le document.
    await page.getByRole('main').getByRole('button', { name: 'Rappel', exact: true }).focus()
    const noms: string[] = []
    for (let rang = 0; rang < 12; rang += 1) {
      await page.keyboard.press('Tab')
      noms.push(await page.evaluate(() => document.activeElement?.getAttribute('name') ?? ''))
    }
    expect(noms).toContain('prenom')
    expect(noms).not.toContain('reference_garage')
  })
})

test.describe('système de design sur téléphone et au bureau', () => {
  test('choix en tuiles cliquables de 44 px au moins, sans défilement horizontal', async ({
    page,
  }) => {
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      await page.goto(`/demande?type=${type}`)
      const tuiles = page.locator('main .choix-tuile')
      expect(await tuiles.count(), type).toBeGreaterThanOrEqual(4)
      for (const boite of await tuiles.evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      )) {
        expect(boite, type).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
      }
      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(debordement, type).toBeLessThanOrEqual(0)
    }
    // Toute la tuile coche, pas seulement le bouton rond.
    await page.goto('/demande?type=rappel')
    await page
      .locator('main .choix-tuile', { hasText: 'À midi' })
      .click({ position: { x: 150, y: 10 } })
    await expect(page.getByLabel('À midi', { exact: true })).toBeChecked()
  })
})

test.describe('espace garagiste (US-30, US-33)', () => {
  test('sans session, la liste des demandes renvoie vers la connexion', async ({ page }) => {
    await page.goto('/garagiste/demandes')
    await expect(page).toHaveURL(/\/garagiste\/connexion\?retour=%2Fgaragiste%2Fdemandes$/)
  })

  test('une demande envoyée se traite au clic : lien de connexion, liste, fiche, « Traitée »', async ({
    page,
  }, infos) => {
    const erreurs = surveillerErreurs(page)
    const prenom = infos.project.name === 'mobile' ? 'Bruno' : 'Aline'
    await page.goto('/demande?type=rappel')
    await page.getByLabel('Une autre question').check()
    await page.getByLabel('Votre prénom').fill(prenom)
    await page.getByLabel('Votre téléphone').fill('06 33 44 55 66')
    await page.getByLabel('Dès que possible', { exact: true }).check()
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await expect(page).toHaveURL(CONFIRMATION)

    // En démonstration, le lien de connexion s'affiche dans la page au lieu de partir.
    await page.goto('/garagiste/demandes')
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await page.getByRole('link', { name: 'Ouvrir le lien de connexion' }).click()
    await page.getByRole('button', { name: 'Ouvrir mon espace garagiste' }).click()
    await expect(page).toHaveURL(/\/garagiste\/demandes$/)
    await expect(page.locator('.barre-fixe')).toHaveCount(0)

    const carte = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: prenom, exact: true }) })
    const appeler = carte.getByRole('link', { name: /^Appeler le 06/ })
    await expect(appeler).toHaveAttribute('href', 'tel:+33633445566')
    expect((await appeler.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    await carte.getByRole('link', { name: 'Voir la fiche' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(prenom)
    await expect(page.locator('.barre-fixe')).toHaveCount(0)
    const traitee = page.getByRole('button', { name: /^Marquer\W+Traitée/ })
    expect((await traitee.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    await traitee.click()
    await expect(page).toHaveURL(/\/garagiste\/demandes\?fait=traitee&demande=[0-9a-f-]{36}$/)
    await expect(
      page.getByRole('table').getByRole('link', { name: prenom, exact: true }),
    ).toBeVisible()
    expect(erreurs).toEqual([])
  })
})

test.describe('corrections du jury, passe 1 : parcours du client', () => {
  test('rappel après pré-diagnostic « Ne roulez pas » : coordonnées d’abord, conduite en une ligne, résumé replié (J1)', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/demande?type=rappel&prediagnostic=freinage.pedale-molle')
    const principal = page.getByRole('main')
    const conduite = principal.locator('.demandes-conduite .alerte__titre')
    await expect(conduite).toHaveText(/^Ne roulez pas\s:\sappelez-nous$/)
    // Une seule ligne, sur téléphone comme au bureau.
    const lignes = await conduite.evaluate((titre) => {
      const style = getComputedStyle(titre)
      return titre.getBoundingClientRect().height / Number.parseFloat(style.lineHeight)
    })
    expect(lignes).toBeLessThan(1.6)
    const prenom = page.getByLabel('Votre prénom')
    const resume = principal.locator('details.demandes-volet')
    await expect(resume).not.toHaveAttribute('open')
    expect((await prenom.boundingBox())?.y ?? 0).toBeLessThan((await resume.boundingBox())?.y ?? 0)
    // Le résumé se déplie à la demande ; le symptôme n'y est dit qu'une fois, le verdict pas du tout.
    await expect(principal.getByText('La pédale de frein est molle ou s’enfonce')).toBeHidden()
    await resume.locator('summary').click()
    await expect(principal.getByText('La pédale de frein est molle ou s’enfonce')).toBeVisible()
    await expect(resume.getByText('Symptôme', { exact: true })).toHaveCount(0)
    await expect(resume.getByText(/Ne roulez pas/)).toHaveCount(0)

    await prenom.fill('Nadia')
    await page.getByLabel('Votre téléphone').fill('06 39 98 00 11')
    await page.getByLabel('Le matin', { exact: true }).check()
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    await expect(page.getByRole('region', { name: 'Récapitulatif' })).toContainText(
      'Le freinage a changé',
    )
    expect(erreurs).toEqual([])
  })

  test('changer de type garde prénom, téléphone et précisions, et le focus revient au type choisi (J2)', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/demande?type=devis')
    await page.getByLabel('Votre prénom').fill('Léa')
    await page.getByLabel('Votre téléphone').fill('06 12 34 56 78')
    await page.getByText('Ajouter des précisions').click()
    await page.getByLabel('Précisions').fill('Bruit à l’avant au freinage')
    const types = page.getByRole('group', { name: 'Type de demande' })
    await types.getByRole('button', { name: 'Rendez-vous' }).click()
    await expect(types.getByRole('button', { name: 'Rendez-vous' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(types.getByRole('button', { name: 'Rendez-vous' })).toBeFocused()
    await expect(page.getByLabel('Votre prénom')).toHaveValue('Léa')
    await expect(page.getByLabel('Votre téléphone')).toHaveValue('06 12 34 56 78')
    await expect(page.getByLabel('Précisions')).toHaveValue('Bruit à l’avant au freinage')
    await types.getByRole('button', { name: 'Rappel', exact: true }).click()
    await expect(page.getByLabel('Votre prénom')).toHaveValue('Léa')
    await expect(page.getByLabel('Précisions')).toHaveValue('Bruit à l’avant au freinage')
    expect(erreurs).toEqual([])
  })

  test('la touche Entrée dans un champ envoie la demande, jamais un changement de type', async ({
    page,
  }) => {
    await page.goto('/demande?type=rappel')
    await page.getByLabel('Un souci avec ma voiture').check()
    await page.getByLabel('Votre téléphone').fill('06 39 98 00 12')
    await page.getByLabel('Le matin', { exact: true }).check()
    await page.getByLabel('Votre prénom').fill('Entrée')
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByLabel('Votre prénom').press('Enter')
    await expect(page).toHaveURL(CONFIRMATION)
    await expect(page.getByRole('region', { name: 'Récapitulatif' })).toContainText('Entrée')
  })

  test('créneaux : une ligne par jour, les matins alignés, les après-midi alignés, 44 px (J3)', async ({
    page,
  }) => {
    await page.goto('/demande?type=rendez-vous')
    const colonnes = (selecteur: string) =>
      page.locator(selecteur).evaluateAll((cases) =>
        cases.map((element) => {
          const boite = element.getBoundingClientRect()
          return { gauche: Math.round(boite.left), hauteur: boite.height }
        }),
      )
    const matins = await colonnes('.demandes-jour__case--matin')
    const apresMidis = await colonnes('.demandes-jour__case--apres-midi')
    expect(matins.length).toBeGreaterThan(1)
    expect(new Set(matins.map((tuile) => tuile.gauche)).size).toBe(1)
    expect(new Set(apresMidis.map((tuile) => tuile.gauche)).size).toBeLessThanOrEqual(1)
    if (apresMidis[0] !== undefined) {
      expect(apresMidis[0].gauche).toBeGreaterThan(matins[0]?.gauche ?? 0)
    }
    for (const tuile of [...matins, ...apresMidis]) {
      expect(tuile.hauteur).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
    // Chaque case dit son jour au lecteur d'écran.
    await expect(page.getByRole('checkbox', { name: /^Matin\s+du \S+ \d+/ }).first()).toBeVisible()
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(debordement).toBeLessThanOrEqual(0)
  })

  test('aucun champ annoncé « invalide » avant l’envoi ; le résumé d’erreurs est un groupe nommé (J5)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Arbre d’accessibilité lu par le protocole de Chromium')
    const invalides = async () => {
      const session = await page.context().newCDPSession(page)
      const { nodes } = (await session.send('Accessibility.getFullAXTree')) as {
        nodes: {
          name?: { value?: string }
          ignored?: boolean
          properties?: { name: string; value: { value?: unknown } }[]
        }[]
      }
      await session.detach()
      return nodes
        .filter((noeud) => noeud.ignored !== true)
        .filter((noeud) =>
          noeud.properties?.some(
            (propriete) => propriete.name === 'invalid' && propriete.value.value !== 'false',
          ),
        )
        .map((noeud) => noeud.name?.value ?? '')
    }
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      await page.goto(`/demande?type=${type}`)
      expect(await invalides(), type).toEqual([])
    }
    await page.goto('/demande?type=rappel')
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    const resume = page.getByRole('group', { name: /Le formulaire contient \d erreurs/ })
    await expect(resume).toBeFocused()
    expect((await invalides()).length).toBeGreaterThan(0)
  })

  test('un lien du récapitulatif d’erreurs amène le champ avec son libellé visible (J1)', async ({
    page,
  }) => {
    await page.goto('/demande?type=rappel')
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await page.getByRole('link', { name: 'Indiquez votre prénom.' }).click()
    await expect(page.getByLabel('Votre prénom')).toBeFocused()
    const libelle = await page.locator('label[for="demande-prenom"]').boundingBox()
    expect(libelle?.y ?? -1).toBeGreaterThanOrEqual(0)
  })

  test('barre fixe basse masquée sur les formulaires, « Confirmez l’envoi » et la confirmation ; l’appel de l’en-tête reste (J1)', async ({
    page,
  }) => {
    const barre = page.locator('.barre-fixe')
    const appelEntete = page.locator('header .bouton-appel')
    for (const type of ['rendez-vous', 'devis', 'rappel']) {
      await page.goto(`/demande?type=${type}`)
      await expect(barre).toHaveCount(0)
      await expect(appelEntete).toBeVisible()
    }
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await expect(page).toHaveTitle(/^Erreur\s: Faire une demande/)
    await expect(barre).toHaveCount(0)
    await page.getByLabel('Un souci avec ma voiture').check()
    await page.getByLabel('Votre prénom').fill('Barre')
    await page.getByLabel('Votre téléphone').fill('06 39 98 00 31')
    await page.getByLabel('Le matin', { exact: true }).check()
    // Champ piège rempli : l'écran « Confirmez l’envoi » s'affiche à coup sûr, quel que soit le délai.
    await page
      .locator('input[name="reference_garage"]')
      .evaluate((champ: HTMLInputElement) => (champ.value = 'robot'))
    await page.getByRole('button', { name: 'Être rappelé' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmez l’envoi')
    await expect(barre).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirmer l’envoi' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    await expect(page.getByText('Votre demande de rappel est enregistrée.')).toBeVisible()
    await expect(barre).toHaveCount(0)
    await expect(appelEntete).toBeVisible()
  })
})

test.describe('corrections du jury, passe 1 : sans JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('changer de type garde la saisie, puis la demande part', async ({ page }) => {
    await page.goto('/demande?type=rappel')
    await page.getByLabel('Votre prénom').fill('Sans script')
    await page.getByLabel('Votre téléphone').fill('06 39 98 00 13')
    await page.getByText('Ajouter des précisions').click()
    await page.getByLabel('Précisions').fill('Voyant orange allumé')
    await page.getByLabel('Le matin', { exact: true }).check()
    await page.getByRole('button', { name: 'Devis', exact: true }).click()
    await expect(page.getByLabel('Votre prénom')).toHaveValue('Sans script')
    await expect(page.getByLabel('Précisions')).toHaveValue('Voyant orange allumé')
    await page.getByRole('button', { name: 'Rendez-vous', exact: true }).click()
    await expect(page.getByLabel('Votre téléphone')).toHaveValue('06 39 98 00 13')
    await page.getByLabel('Pour quelle intervention ?').selectOption('souci')
    await page.getByLabel('Le plus tôt possible').check()
    await page.waitForTimeout(DELAI_HUMAIN_MS)
    await page.getByRole('button', { name: 'Demander un rendez-vous' }).click()
    await expect(page).toHaveURL(CONFIRMATION)
    await expect(page.getByRole('region', { name: 'Récapitulatif' })).toContainText(
      'Voyant orange allumé',
    )
  })
})

test.describe('corrections du jury, passe 1 : espace garagiste (J4)', () => {
  test('compteur, promesse, doublon, « Pas de réponse », « Traitée » sans défiler, retour de 44 px', async ({
    page,
  }, infos) => {
    const erreurs = surveillerErreurs(page)
    const mobile = infos.project.name === 'mobile'
    const prenom = mobile ? 'Jeanne' : 'Josiane'
    const telephone = mobile ? '06 39 98 00 21' : '06 39 98 00 22'
    for (let envoi = 0; envoi < 2; envoi += 1) {
      await page.goto('/demande?type=rappel')
      await page.getByLabel('Un souci avec ma voiture').check()
      await page.getByLabel('Votre prénom').fill(prenom)
      await page.getByLabel('Votre téléphone').fill(telephone)
      await page.getByLabel('En fin de journée', { exact: true }).check()
      await page.waitForTimeout(DELAI_HUMAIN_MS)
      await page.getByRole('button', { name: 'Être rappelé' }).click()
      await expect(page).toHaveURL(CONFIRMATION)
    }

    await page.goto('/garagiste')
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await page.getByRole('link', { name: 'Ouvrir le lien de connexion' }).click()
    await page.getByRole('button', { name: 'Ouvrir mon espace garagiste' }).click()
    await expect(page).toHaveURL(/\/garagiste$/)
    await expect(page.locator('.acces-compteur')).toHaveText(/^\d+ demandes? à rappeler/)

    await page.getByRole('link', { name: 'Demandes des clients' }).click()
    const cartes = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: prenom, exact: true }) })
    await expect(cartes).toHaveCount(2)
    await expect(cartes.first().getByText('Doublon possible')).toBeVisible()
    await expect(cartes.first().getByText(/^Promis au client\s:\s/)).toBeVisible()
    await cartes.first().getByRole('button', { name: 'Pas de réponse' }).click()
    await expect(page.getByRole('status')).toContainText(`Appel sans réponse noté pour ${prenom}`)
    await expect(cartes.first().getByText(/^Appel sans réponse le /)).toBeVisible()
    const retourEspace = page.getByRole('link', { name: 'Retour à l’espace garagiste' })
    expect((await retourEspace.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)

    await cartes.first().getByRole('link', { name: 'Voir la fiche' }).click()
    const traitee = page.getByRole('button', { name: /^Marquer\W+Traitée/ })
    const boite = await traitee.boundingBox()
    const hauteur = page.viewportSize()?.height ?? 0
    // Atteignable sans défiler, au premier écran du téléphone comme du bureau.
    expect((boite?.y ?? hauteur) + (boite?.height ?? 0)).toBeLessThanOrEqual(hauteur)
    await expect(page.getByRole('button', { name: 'Pas de réponse' })).toBeVisible()
    const retour = page.getByRole('link', { name: 'Retour aux demandes' })
    expect((await retour.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    await traitee.click()
    await expect(page.getByRole('status')).toContainText(`${prenom} rangée dans`)
    await page.getByRole('status').getByRole('button', { name: 'Annuler' }).click()
    await expect(page.getByRole('status')).toContainText(/remise «\sÀ rappeler\s»/)
    expect(erreurs).toEqual([])
  })
})
