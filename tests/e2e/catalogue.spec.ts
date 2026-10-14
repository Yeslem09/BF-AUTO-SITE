import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

/**
 * Parcours du catalogue au navigateur, bureau et iPhone 13.
 *
 * Le serveur de la configuration tourne en démonstration : on y vérifie les
 * issues honnêtes (404 utile, tarifs sans montant non validé). La production
 * avec un catalogue non confirmé ne démarre plus (porte de démarrage unique,
 * Kano D8) : sa liste en attente est couverte par les essais du module. Pour
 * parcourir les familles proposées, chaque processus de test démarre en plus
 * son propre serveur en mode démonstration, sur un port libre, avec une base
 * jetable.
 */

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const DELAI_DEMARRAGE_MS = 30_000
const INTERVALLE_SONDE_MS = 200
const FAMILLES_PROPOSEES = 18
/** Familles qui sont des prestations : ni pièce seule, ni vérification, ni gamme. */
const PRESTATIONS = ['climatisation', 'diagnostic-electronique', 'carrosserie', 'peinture']
/** « À partir de 89,00 € TTC » : espaces insécables compris. */
const PRIX_A_PARTIR_DE = /^À partir de \d+,\d{2}\s€\sTTC$/
/** Puces de familles dans la bande de l'accueil : douze au bureau, six sur téléphone. */
const PUCES_BUREAU = 12
const PUCES_TELEPHONE = 6
const PIECES_PAR_FIGURE = 3
const STATUT_ERREUR = 400
/** Cible tactile minimale d'un lien isolé ou d'un bouton (P-04, jeton --cible-tactile). */
const CIBLE_TACTILE_PX = 44
const LIBELLE_RECHERCHE = /Quelle pièce cherchez-vous/

/** Collecte ce qui trahit une page cassée ; le statut du document lui-même est vérifié à part. */
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
    const estLeDocument = reponse.request().resourceType() === 'document'
    if (!estLeDocument && reponse.status() >= STATUT_ERREUR) {
      erreurs.push(`${reponse.status()} : ${reponse.url()}`)
    }
  })
  return erreurs
}

async function portLibre(): Promise<number> {
  return new Promise((resoudre, rejeter) => {
    const serveur = createServer()
    serveur.once('error', rejeter)
    serveur.listen(0, '127.0.0.1', () => {
      const adresse = serveur.address()
      const port = typeof adresse === 'object' && adresse !== null ? adresse.port : 0
      serveur.close(() => resoudre(port))
    })
  })
}

async function attendreSante(origine: string, arrete: () => string | null): Promise<void> {
  const limite = Date.now() + DELAI_DEMARRAGE_MS
  while (Date.now() < limite) {
    const cause = arrete()
    if (cause !== null) throw new Error(`Serveur de démonstration arrêté : ${cause}`)
    try {
      if ((await fetch(`${origine}/sante`)).ok) return
    } catch {
      // pas encore à l'écoute
    }
    await new Promise((resoudre) => setTimeout(resoudre, INTERVALLE_SONDE_MS))
  }
  throw new Error(`Serveur de démonstration muet après ${DELAI_DEMARRAGE_MS} ms`)
}

/** Aucun défilement horizontal : la page tient dans la largeur de l'écran. */
async function tientEnLargeur(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}

const testDemonstration = test.extend<object, { demonstration: string }>({
  demonstration: [
    async ({}, utiliser) => {
      const port = await portLibre()
      const origine = `http://127.0.0.1:${port}`
      const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-e2e-catalogue-'))
      const serveur = spawn(process.execPath, ['--import', 'tsx', 'src/demarrer.ts'], {
        cwd: RACINE,
        env: {
          ...process.env,
          PORT: String(port),
          HOTE: '127.0.0.1',
          URL_PUBLIQUE: origine,
          MODE_SITE: 'demonstration',
          BASE_SQLITE: join(dossier, 'demonstration.sqlite'),
          NIVEAU_JOURNAL: 'warn',
        },
        stdio: ['ignore', 'ignore', 'pipe'],
      })
      let journal = ''
      let fin: string | null = null
      serveur.stderr.on('data', (morceau: Buffer) => {
        journal += morceau.toString()
      })
      serveur.once('exit', (code) => {
        fin = `code ${String(code)}. ${journal}`
      })
      try {
        await attendreSante(origine, () => fin)
        await utiliser(origine)
      } finally {
        if (fin === null) {
          const arret = new Promise((resoudre) => serveur.once('exit', resoudre))
          serveur.kill('SIGTERM')
          await arret
        }
        await rm(dossier, { recursive: true, force: true })
      }
    },
    { scope: 'worker', timeout: DELAI_DEMARRAGE_MS * 2 },
  ],
})

/** Envoie une recherche par le formulaire de la page, comme un client. */
async function chercher(page: Page, requete: string): Promise<void> {
  await page.getByLabel(LIBELLE_RECHERCHE).fill(requete)
  await page.getByRole('button', { name: 'Chercher' }).click()
  await page.waitForURL((adresse) => adresse.searchParams.get('q') === requete)
}

/** Familles de la zone des résultats, dans l'ordre. */
function resultats(page: Page) {
  return page.locator('.catalogue-resultats .catalogue-resultat__nom')
}

test.describe('catalogue sur le serveur commun, issues honnêtes', () => {
  test('une famille inconnue répond 404, avec une issue', async ({ page }) => {
    const reponse = await page.goto('/pieces-et-reparations/famille-inconnue')
    expect(reponse?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Famille introuvable')
    await expect(page.getByText('famille-inconnue', { exact: false })).toHaveCount(0)
    await page.getByRole('link', { name: 'Toutes les familles' }).click()
    await expect(page).toHaveURL(/\/pieces-et-reparations$/)
  })

  test('les tarifs de démonstration : « à partir de », véhicule de référence, révision, et la note qui le dit', async ({
    page,
  }) => {
    const reponse = await page.goto('/tarifs')
    expect(reponse?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tarifs')
    await expect(page.locator('table.tableau-tarifs')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: 'Sur demande' })).toHaveCount(0)
    await expect(page.getByText('Prix de démonstration calés sur le marché local')).toBeVisible()
    const revision = page.getByRole('row', { name: /^Révision/ })
    await expect(revision.getByRole('cell')).toHaveText(PRIX_A_PARTIR_DE)
    // Véhicule de référence et date dits une seule fois, en légende, jamais dans le futur (J1, J5).
    await expect(page.locator('caption')).toContainText([
      'Prix au 24 septembre 2026',
      'Exemple : citadine essence, prix au 24 septembre 2026',
    ])
    await expect(page.getByText('citadine essence')).toHaveCount(1)
    // Le taux horaire est un prix fixe (J3).
    await expect(page.getByRole('row', { name: /^Taux horaire/ }).getByRole('cell')).toHaveText(
      /^60,00\s€\sTTC de l’heure$/,
    )
    // J2 : la demande de prix d'une ligne pré-coche la pièce et la pose.
    await expect(
      page
        .locator('tr.catalogue-tarif__suite')
        .getByRole('link', { name: 'Demander un prix' })
        .first(),
    ).toHaveAttribute('href', /\/demande\?type=devis&famille=/)
    await expect(
      page.getByRole('row', { name: /Réparation de carrosserie/ }).getByRole('cell'),
    ).toHaveText('Sur devis après examen')
    const premierControle = page.locator('tr.catalogue-tarif:has-text("Premier contrôle") + tr')
    await expect(premierControle).toContainText('Durée : 30 minutes environ')
    await expect(premierControle).toContainText('Déduit du prix de la réparation')
    for (const cellule of await page.locator('td.tableau-tarifs__prix').allTextContents()) {
      if (cellule.startsWith('À partir de')) expect(cellule).toMatch(PRIX_A_PARTIR_DE)
    }
    // J1, J2 : « À partir de » et le montant ne se coupent jamais, même au téléphone.
    const morceauxCoupes = await page.locator('.catalogue-tarif__morceau').evaluateAll(
      (morceaux) =>
        morceaux.filter((morceau) => {
          const hauteur = morceau.getBoundingClientRect().height
          return hauteur > 1.6 * Number.parseFloat(getComputedStyle(morceau).lineHeight || '24')
        }).length,
    )
    expect(morceauxCoupes).toBe(0)
    expect(await tientEnLargeur(page)).toBe(true)
  })

  test('une recherche qui décrit un symptôme propose d’abord le pré-diagnostic', async ({
    page,
  }) => {
    await page.goto('/pieces-et-reparations')
    await chercher(page, 'freins qui grincent')
    const encart = page.locator('.catalogue-symptome')
    await expect(
      encart.getByRole('heading', { name: 'Un bruit, un voyant, une fuite ?' }),
    ).toBeVisible()
    await expect(resultats(page)).toHaveText(['Freinage'])
    const encartAvantResultats = await page.evaluate(() => {
      const encartDom = document.querySelector('.catalogue-symptome')
      const resultatsDom = document.querySelector('.catalogue-resultats')
      return (
        encartDom !== null &&
        resultatsDom !== null &&
        (encartDom.compareDocumentPosition(resultatsDom) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      )
    })
    expect(encartAvantResultats).toBe(true)
    await encart.getByRole('link', { name: 'Faire le pré-diagnostic' }).click()
    await expect(page).toHaveURL(/\/pre-diagnostic$/)
  })

  test('aucune image cassée : chaque dessin cité par l’accueil, la liste et les familles se charge', async ({
    page,
    request,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/pieces-et-reparations')
    const familles = await page
      .locator('.catalogue-liste > section .carte-famille')
      .evaluateAll((liens) => liens.map((lien) => lien.getAttribute('href') ?? ''))
    const images = new Set<string>()
    for (const chemin of ['/', '/pieces-et-reparations', '/tarifs', ...familles]) {
      await page.goto(chemin)
      const cites = await page.evaluate(() => [
        ...[...document.querySelectorAll('use')].map(
          (use) => (use.getAttribute('href') ?? '').split('#')[0] ?? '',
        ),
        ...[...document.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? ''),
      ])
      for (const cite of cites) if (cite.startsWith('/')) images.add(cite)
    }
    expect(images.size).toBeGreaterThanOrEqual(FAMILLES_PROPOSEES)
    for (const image of images) {
      const reponse = await request.get(image)
      expect(reponse.status(), image).toBe(200)
      expect(reponse.headers()['content-type'], image).toMatch(/^image\//)
    }
    expect(erreurs).toEqual([])
  })
})

testDemonstration.describe('catalogue en démonstration, avec JavaScript', () => {
  testDemonstration(
    'de la bande de l’accueil : recherche trouvée, figure légendée, deux offres, puis la demande de prix',
    async ({ page, demonstration }, infos) => {
      const erreurs = surveillerErreurs(page)
      await page.goto(`${demonstration}/`)
      await expect(page.getByText('Version de démonstration')).toBeVisible()
      const bande = page.locator('.accueil__zone--recherche-pieces')
      await expect(bande.getByRole('heading', { name: 'Pièces détachées' })).toBeVisible()
      await expect(bande.locator('.puce-famille').filter({ visible: true })).toHaveCount(
        infos.project.name === 'bureau' ? PUCES_BUREAU : PUCES_TELEPHONE,
      )
      await expect(bande.getByRole('link', { name: 'Toutes les familles (18)' })).toHaveAttribute(
        'href',
        '/pieces-et-reparations',
      )
      await bande.getByLabel(LIBELLE_RECHERCHE).fill('plaquettes')
      await bande.getByRole('button', { name: 'Chercher' }).click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations?q=plaquettes#recherche`)
      await expect(page.getByRole('heading', { name: 'Résultat de votre recherche' })).toBeVisible()
      await expect(resultats(page)).toHaveText(['Freinage'])
      await expect(page.getByLabel(LIBELLE_RECHERCHE)).toHaveValue('plaquettes')

      await page
        .locator('.catalogue-resultats')
        .getByRole('link', { name: /^Freinage/ })
        .click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/freinage`)
      await expect(page).toHaveTitle('Freinage à Choisy-le-Roi : plaquettes, disques | BF Auto')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Freinage')
      const figure = page.getByRole('figure', { name: /Fig\. 1 Frein à disque/ })
      await expect(figure).toBeVisible()
      await expect(page.locator('.catalogue-nomenclature li')).toHaveText([
        /^1\s*Disque/,
        /^2\s*Étrier/,
        /^3\s*Plaquettes/,
      ])
      await expect(page.locator('.catalogue-prix__montant')).toHaveText(PRIX_A_PARTIR_DE)
      await expect(page.getByRole('heading', { name: 'Plaquettes avant posées' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Retrait au garage' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Pose à l’atelier' })).toBeVisible()
      await expect(page.getByText('Vérifiée avant commande.')).toBeVisible()
      await expect(page.getByText('Pièces neuves uniquement.')).toBeVisible()
      await expect(page.getByRole('main')).not.toContainText('d’occasion ou reconditionnée')
      await expect(page.getByText('Avant de commander une pièce')).toHaveCount(1)
      await expect(page.getByRole('link', { name: 'Faites le pré-diagnostic' })).toHaveAttribute(
        'href',
        '/pre-diagnostic',
      )
      expect(await tientEnLargeur(page)).toBe(true)

      const [reponse] = await Promise.all([
        page.waitForResponse((r) => r.request().resourceType() === 'document'),
        page.getByRole('link', { name: 'Demander un prix' }).click(),
      ])
      expect(reponse.status()).toBe(200)
      const adresse = new URL(page.url())
      expect(adresse.pathname).toBe('/demande')
      expect(Object.fromEntries(adresse.searchParams)).toEqual({
        type: 'devis',
        famille: 'freinage',
      })
      expect(erreurs).toEqual([])
    },
  )

  testDemonstration(
    'la recherche trouve par synonyme, pluriel et faute de frappe',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/pieces-et-reparations`)
      for (const [requete, famille] of [
        ['pot', 'Échappement'],
        ['FAP', 'Échappement'],
        ['plaquete', 'Freinage'],
        ['Les bosses', 'Carrosserie'],
        ['clim', 'Climatisation'],
        ['valise', 'Diagnostic électronique'],
      ] as const) {
        await chercher(page, requete)
        await expect(resultats(page), requete).toHaveText([famille])
      }
      await chercher(page, 'courroie')
      await expect(resultats(page)).toHaveText(['Distribution', 'Démarrage et charge'])
    },
  )

  testDemonstration(
    'rien trouvé : la page le dit et propose la demande de prix, l’appel et toutes les familles',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/pieces-et-reparations`)
      await chercher(page, 'trottinette électrique')
      await expect(
        page.getByRole('heading', { name: 'Aucune famille ne correspond à votre recherche' }),
      ).toBeVisible()
      const issue = page.locator('.catalogue-resultats--vide')
      await expect(issue.getByRole('link', { name: /^Appeler le / })).toHaveAttribute(
        'href',
        /^tel:/,
      )
      await expect(page.locator('main .carte-famille')).toHaveCount(FAMILLES_PROPOSEES)
      await expect(page.getByRole('main')).not.toContainText('trottinette')
      await issue.getByRole('link', { name: 'Demander un prix' }).click()
      await expect(page).toHaveURL(`${demonstration}/demande?type=devis`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Faire une demande')
    },
  )

  testDemonstration(
    'chaque famille : figure légendée et ses pièces, deux offres, deux actions vers la demande',
    async ({ page, demonstration }) => {
      const erreurs = surveillerErreurs(page)
      await page.goto(`${demonstration}/pieces-et-reparations`)
      const cartes = page.locator('.catalogue-liste > section .carte-famille')
      await expect(cartes).toHaveCount(FAMILLES_PROPOSEES)
      const adresses = await cartes.evaluateAll((liens) =>
        liens.map((lien) => lien.getAttribute('href') ?? ''),
      )
      for (const adresse of adresses) {
        const identifiant = adresse.split('/').at(-1) ?? ''
        const reponse = await page.goto(`${demonstration}${adresse}`)
        expect(reponse?.status(), adresse).toBe(200)
        await expect(page.locator('.figure-technique__planche svg'), adresse).toBeVisible()
        await expect(page.locator('.figure-technique__legende'), adresse).toContainText('Fig. 1')
        await expect(page.locator('.catalogue-nomenclature li'), adresse).toHaveCount(
          PIECES_PAR_FIGURE,
        )
        if (PRESTATIONS.includes(identifiant)) {
          await expect(
            page.getByRole('heading', { name: 'Ce que fait l’atelier' }),
            adresse,
          ).toBeVisible()
          await expect(page.getByText('acheter la pièce seule'), adresse).toHaveCount(0)
          await expect(
            page.getByRole('heading', { name: 'Retrait au garage' }),
            adresse,
          ).toHaveCount(0)
        } else {
          await expect(
            page.getByRole('heading', { name: 'Retrait au garage' }),
            adresse,
          ).toBeVisible()
          await expect(
            page.getByRole('heading', { name: 'Pose à l’atelier' }),
            adresse,
          ).toBeVisible()
        }
        await expect(page.getByText('Avant de commander une pièce'), adresse).toHaveCount(
          PRESTATIONS.includes(identifiant) ? 0 : 1,
        )
        await expect(page.getByRole('link', { name: 'Demander un prix' }), adresse).toHaveAttribute(
          'href',
          `/demande?type=devis&famille=${identifiant}`,
        )
        await expect(
          page.getByRole('link', { name: 'Demander un rendez-vous' }),
          adresse,
        ).toHaveAttribute('href', `/demande?type=rendez-vous&famille=${identifiant}`)
        expect(await tientEnLargeur(page), adresse).toBe(true)
      }
      await page.goto(`${demonstration}/pieces-et-reparations/carrosserie`)
      await expect(page).toHaveTitle('Carrosserie à Choisy-le-Roi : chocs, bosses | BF Auto')
      await page.getByRole('link', { name: 'Demander un rendez-vous' }).click()
      await expect(page).toHaveURL(`${demonstration}/demande?type=rendez-vous&famille=carrosserie`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Faire une demande')
      expect(erreurs).toEqual([])
    },
  )

  testDemonstration(
    'l’accueil : six familles en puces dans la bande, toutes les familles en cartes dessous',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/`)
      const grille = page.locator('.accueil__zone--catalogue')
      await expect(grille.getByRole('heading', { name: 'Toutes les familles' })).toBeVisible()
      await expect(grille.locator('.carte-famille').filter({ visible: true })).toHaveCount(
        FAMILLES_PROPOSEES,
      )
      await expect(grille.locator('.carte-famille__dessin').first()).toBeVisible()
      await page
        .locator('.accueil__zone--recherche-pieces')
        .getByRole('link', { name: 'Batterie' })
        .click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/batterie`)
      await page.goto(`${demonstration}/`)
      await grille.getByRole('link', { name: /^Peinture/ }).click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/peinture`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Peinture')
    },
  )

  testDemonstration(
    'des tarifs à une famille et retour : un seul prix, deux entrées',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/pieces-et-reparations/batterie`)
      const surLaFamille = await page.locator('.catalogue-prix__montant').textContent()
      await page.getByRole('link', { name: 'Tous les tarifs' }).click()
      await expect(page).toHaveURL(`${demonstration}/tarifs`)
      const ligne = page.getByRole('row', { name: /Batterie posée/ })
      await expect(ligne.getByRole('cell')).toHaveText(surLaFamille ?? 'absent')
      await expect(ligne.getByRole('cell')).toHaveText(PRIX_A_PARTIR_DE)
      await ligne.getByRole('link', { name: 'Batterie posée' }).click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/batterie`)
      await page.goto(`${demonstration}/tarifs`)
      await page.getByRole('link', { name: 'Distribution', exact: true }).click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/distribution`)
      await expect(page.getByText('Prix sur devis', { exact: true })).toBeVisible()
    },
  )

  testDemonstration(
    'au clavier, la demande de prix s’atteint avec un focus visible',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/pieces-et-reparations/freinage`)
      const devis = page.getByRole('link', { name: 'Demander un prix' })
      const TABULATIONS_MAX = 40
      for (let essai = 0; essai < TABULATIONS_MAX; essai += 1) {
        await page.keyboard.press('Tab')
        if (await devis.evaluate((lien) => lien === document.activeElement)) break
      }
      await expect(devis).toBeFocused()
      expect(await devis.evaluate((lien) => getComputedStyle(lien).outlineStyle)).toBe('solid')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${demonstration}/demande?type=devis&famille=freinage`)
    },
  )

  testDemonstration(
    'chaque lien isolé offre une cible tactile de 44 px (P-04)',
    async ({ page, demonstration }) => {
      const liensIsoles = [
        '.carte-famille',
        '.puce-famille',
        '.catalogue-bande__toutes a',
        '.fil-ariane a',
        '.catalogue-renvois a',
        '.catalogue-tarifs__famille',
        'main .bouton',
        'main .champ__saisie',
      ].join(', ')
      for (const chemin of [
        '/',
        '/pieces-et-reparations',
        '/pieces-et-reparations?q=trottinette',
        '/pieces-et-reparations/freinage',
        '/tarifs',
        '/pieces-et-reparations/inconnue',
      ]) {
        await page.goto(`${demonstration}${chemin}`)
        const cibles = await page
          .locator(liensIsoles)
          .filter({ visible: true })
          .evaluateAll((liens) =>
            liens.map((lien) => ({
              texte: lien.textContent?.trim() ?? '',
              hauteur: lien.getBoundingClientRect().height,
            })),
          )
        expect(cibles.length, chemin).toBeGreaterThan(0)
        for (const { texte, hauteur } of cibles) {
          expect(hauteur, `${chemin} : ${texte}`).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
        }
      }
    },
  )

  testDemonstration(
    'tient dans un écran de 320 px sans défilement horizontal',
    async ({ page, demonstration }) => {
      await page.setViewportSize({ width: 320, height: 568 })
      for (const chemin of [
        '/',
        '/pieces-et-reparations',
        '/pieces-et-reparations?q=plaquettes',
        '/pieces-et-reparations?q=trottinette',
        '/pieces-et-reparations/amortisseurs-et-suspension',
        '/pieces-et-reparations/diagnostic-electronique',
        '/tarifs',
      ]) {
        await page.goto(`${demonstration}${chemin}`)
        expect(await tientEnLargeur(page), chemin).toBe(true)
      }
    },
  )
})

testDemonstration.describe('catalogue en démonstration, sans JavaScript', () => {
  testDemonstration.use({ javaScriptEnabled: false })

  testDemonstration(
    'la recherche fonctionne sans script, puis mène à une demande de rendez-vous préremplie',
    async ({ page, demonstration }) => {
      await page.goto(`${demonstration}/pieces-et-reparations`)
      await chercher(page, 'huile moteur')
      await expect(resultats(page)).toHaveText(['Vidange et filtres'])
      await page
        .locator('.catalogue-resultats')
        .getByRole('link', { name: /^Vidange et filtres/ })
        .click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/vidange-et-filtres`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vidange et filtres')
      await page.getByRole('link', { name: 'Demander un rendez-vous' }).click()
      const adresse = new URL(page.url())
      expect(adresse.pathname).toBe('/demande')
      expect(Object.fromEntries(adresse.searchParams)).toEqual({
        type: 'rendez-vous',
        famille: 'vidange-et-filtres',
      })
    },
  )

  testDemonstration(
    'une famille inconnue répond 404 avec les familles proposées',
    async ({ page, demonstration }) => {
      const reponse = await page.goto(`${demonstration}/pieces-et-reparations/turbo-magique`)
      expect(reponse?.status()).toBe(404)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Famille introuvable')
      await expect(page.getByText('turbo-magique')).toHaveCount(0)
      await page.getByRole('link', { name: /^Embrayage/ }).click()
      await expect(page).toHaveURL(`${demonstration}/pieces-et-reparations/embrayage`)
    },
  )
})
