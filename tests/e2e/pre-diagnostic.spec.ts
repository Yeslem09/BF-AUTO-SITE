import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, expect, type Page } from '@playwright/test'
import { CANAL_DE_NOTIFICATION_FICTIF, preparerDonneesDeProduction } from './donnees-production.js'

// Sur téléphone, la barre fixe basse porte aussi « Être rappelé » et le menu <details>
// compte comme un groupe : les repères de la page se cherchent dans <main>.

/**
 * Parcours navigateur du pré-diagnostic. Sans relecture datée de l'arbre, le
 * pré-diagnostic n'existe pas en production (404) : ce fichier démarre donc ses
 * propres serveurs, un en démonstration et un en production, chacun sur un port
 * libre, quel que soit le mode du serveur de la configuration commune. Celui de
 * production reçoit des données qui passent la porte de démarrage (garage et
 * catalogue d'essai validés, serveur d'envoi fictif) et le vrai arbre, non relu.
 */

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const DELAI_DEMARRAGE_MS = 60_000
const INTERVALLE_SONDE_MS = 150
const CIBLE_TACTILE_PX = 44
const STATUT_INTROUVABLE = 404
/** Réponse de /sante quand un connecteur (courriel, SMS) est en échec. */
const STATUT_DEGRADE = 503

type ModeServeur = 'demonstration' | 'production'

interface Serveur {
  readonly origine: string
  /** Tout ce que le serveur a écrit dans son journal depuis son démarrage. */
  journal(): string
  arreter(): Promise<void>
}

async function portLibre(): Promise<number> {
  const serveur = createServer()
  serveur.listen(0, '127.0.0.1')
  await once(serveur, 'listening')
  const adresse = serveur.address()
  serveur.close()
  if (adresse === null || typeof adresse === 'string') throw new Error('Port introuvable')
  return adresse.port
}

async function demarrerServeur(mode: ModeServeur): Promise<Serveur> {
  const port = await portLibre()
  const origine = `http://127.0.0.1:${port}`
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-e2e-pre-diagnostic-'))
  const production =
    mode === 'production'
      ? {
          CHEMIN_DONNEES: await preparerDonneesDeProduction(dossier),
          ...CANAL_DE_NOTIFICATION_FICTIF,
        }
      : {}
  const processus = spawn(process.execPath, ['--import', 'tsx', 'src/demarrer.ts'], {
    cwd: RACINE,
    env: {
      ...process.env,
      ...production,
      PORT: String(port),
      HOTE: '127.0.0.1',
      URL_PUBLIQUE: origine,
      MODE_SITE: mode,
      BASE_SQLITE: join(dossier, 'demandes.sqlite'),
      // Niveau info : le journal d'accès est actif, pour vérifier qu'il tait les réponses.
      NIVEAU_JOURNAL: 'info',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let journal = ''
  processus.stdout.on('data', (morceau: Buffer) => (journal += morceau.toString()))
  processus.stderr.on('data', (morceau: Buffer) => (journal += morceau.toString()))
  const arreter = async (): Promise<void> => {
    if (processus.exitCode === null) {
      processus.kill('SIGTERM')
      await once(processus, 'exit')
    }
    await rm(dossier, { recursive: true, force: true })
  }
  const limite = Date.now() + DELAI_DEMARRAGE_MS
  while (Date.now() < limite) {
    if (processus.exitCode !== null) break
    // Démarré, même « dégradé » : en production, le serveur d'envoi fictif est
    // injoignable et /sante répond 503 ; seule compte ici une réponse du serveur.
    const pret = await fetch(`${origine}/sante`).then(
      (reponse) => reponse.ok || reponse.status === STATUT_DEGRADE,
      () => false,
    )
    if (pret) return { origine, journal: () => journal, arreter }
    await new Promise((resoudre) => setTimeout(resoudre, INTERVALLE_SONDE_MS))
  }
  await arreter()
  throw new Error(`Serveur ${mode} non démarré sur ${origine} :\n${journal}`)
}

/** Un serveur par processus de test, arrêté à la fin ; toutes les adresses relatives y mènent. */
function testSur(mode: ModeServeur) {
  return base.extend<object, { serveur: Serveur }>({
    serveur: [
      async ({}, utiliser) => {
        const serveur = await demarrerServeur(mode)
        await utiliser(serveur)
        await serveur.arreter()
      },
      { scope: 'worker', timeout: DELAI_DEMARRAGE_MS },
    ],
    baseURL: async ({ serveur }, utiliser) => utiliser(serveur.origine),
  })
}

const test = testSur('demonstration')
const testProduction = testSur('production')

/** Collecte tout ce qui trahit une page cassée : erreurs de script, de console, ressources en échec. */
function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(`console : ${message.text()}`)
  })
  page.on('pageerror', (erreur) => erreurs.push(`script : ${erreur.message}`))
  page.on('requestfailed', (requete) => erreurs.push(`requête en échec : ${requete.url()}`))
  return erreurs
}

async function continuer(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continuer' }).click()
}

/** Question de branche : un bouton de choix envoie la réponse d'un seul geste. */
async function choisir(page: Page, libelle: string): Promise<void> {
  await page.getByRole('main').getByRole('button', { name: libelle }).click()
}

/** Question des signes : aucun signe de danger coché. */
async function aucunSigne(page: Page): Promise<void> {
  await page.getByLabel('Aucun de ces signes', { exact: true }).check()
  await continuer(page)
}

/** Accueil ou entrée : « Un bruit inhabituel », aucun signe, freinage, sifflement. */
async function parcourirJusquAuResultat(page: Page): Promise<void> {
  await page.goto('/pre-diagnostic')
  await page.getByRole('link', { name: 'Un bruit inhabituel' }).click()
  await aucunSigne(page)
  await expect(page.getByText('Question 3 sur 5 au plus')).toBeVisible()
  await choisir(page, 'Quand je freine')
  await expect(page.getByText('Question 4 sur 5 au plus')).toBeVisible()
  await choisir(page, 'Un sifflement ou un grincement aigu')
}

/** Orange de marque (atelier, clair, foncé), tel que le navigateur le calcule. */
const ORANGES = ['rgb(228, 104, 43)', 'rgb(245, 154, 99)', 'rgb(168, 74, 23)']

/**
 * Relève tout orange de marque dans la zone de résultat (fiche), hors boutons
 * d'action : couleurs de texte, de fond, de bord, de trait et de remplissage
 * des figures, pseudo-éléments compris (le trait à talons des surtitres).
 */
async function orangesDansLaFiche(page: Page): Promise<string[]> {
  return page.evaluate((oranges) => {
    const fiche = document.querySelector('.pre-diagnostic-fiche')
    if (fiche === null) return ['fiche absente']
    const proprietes = [
      'color',
      'background-color',
      'background-image',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'fill',
      'stroke',
      'text-decoration-color',
    ]
    const fautes: string[] = []
    for (const element of [fiche, ...fiche.querySelectorAll('*')]) {
      if (element.closest('.bouton') !== null) continue
      for (const pseudo of [null, '::before', '::after']) {
        const style = getComputedStyle(element, pseudo)
        if (pseudo !== null && style.content === 'none') continue
        for (const propriete of proprietes) {
          const valeur = style.getPropertyValue(propriete)
          if (oranges.some((orange) => valeur.includes(orange))) {
            fautes.push(
              `${element.tagName.toLowerCase()}.${element.className}${pseudo ?? ''} ${propriete}`,
            )
          }
        }
      }
    }
    return fautes
  }, ORANGES)
}

test.describe('pré-diagnostic : du premier geste au relais', () => {
  test('depuis l’accueil, « Un voyant s’allume » mène à la question 2 sur 5 au plus', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/')
    const bloc = page.locator('.accueil__zone--pre-diagnostic')
    await expect(bloc.getByText('Pré-diagnostic, question 1 sur 5 au plus')).toBeVisible()
    await expect(bloc.getByRole('heading', { name: 'Que remarquez-vous ?' })).toBeVisible()
    await expect(bloc.locator('a.bouton-choix')).toHaveCount(7)
    await expect(bloc.getByText('le diagnostic se fait à l’atelier.')).toBeVisible()
    await bloc.getByRole('link', { name: 'Un voyant s’allume' }).click()
    await expect(page).toHaveURL(/\/pre-diagnostic\?q1=voyant$/)
    await expect(page.getByText('Question 2 sur 5 au plus', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Remarquez-vous l’un de ces signes ?',
    )
    expect(erreurs).toEqual([])
  })

  test('chacune des sept entrées de l’accueil mène, au clic, de la question des signes à un résultat', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/')
    const bloc = page.locator('.accueil__zone--pre-diagnostic')
    await expect(bloc.locator('a.bouton-choix--incertain')).toHaveText(
      'Autre chose ou je ne sais pas',
    )
    const libelles = await bloc.locator('a.bouton-choix').allInnerTexts()
    expect(libelles).toHaveLength(7)
    for (const libelle of libelles) {
      await page.goto('/')
      const lien = bloc.getByRole('link', { name: libelle, exact: true })
      const boite = await lien.boundingBox()
      expect(boite?.height ?? 0, libelle).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
      await lien.click()
      await expect(page, libelle).toHaveURL(/\/pre-diagnostic\?q1=[a-z-]+$/)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Remarquez-vous l’un de ces signes ?',
      )
      await expect(page.getByText('Question 2 sur 5 au plus', { exact: true })).toBeVisible()
      await expect(page.getByLabel('Je ne sais pas', { exact: true })).toBeVisible()
      // Puis jusqu'au résultat, en touchant chaque fois la première réponse proposée.
      await aucunSigne(page)
      const conduite = page.locator('.pre-diagnostic-conduite')
      for (let question = 3; question <= 5 && (await conduite.count()) === 0; question += 1) {
        await expect(page.getByText(`Question ${question} sur 5 au plus`)).toBeVisible()
        await page.locator('main .bouton-choix').first().click()
      }
      await expect(conduite, libelle).toHaveClass(/\balerte\b/)
      await expect(conduite.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await orangesDansLaFiche(page), libelle).toEqual([])
    }
    expect(erreurs).toEqual([])
  })

  test('les trois niveaux au clic : alerte rouge, ambre ou grise, sans orange de marque hors boutons', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    // Niveau « Ne roulez pas » : un frottement métallique au freinage.
    await page.goto('/pre-diagnostic?q1=bruit')
    await aucunSigne(page)
    await choisir(page, 'Quand je freine')
    await choisir(page, 'Un frottement métallique ou un raclement')
    await expect(page.locator('.alerte--danger h1')).toHaveText('Ne roulez pas : appelez-nous')
    await expect(page.getByRole('heading', { name: 'Que faire, dans cet ordre' })).toBeVisible()
    expect(await orangesDansLaFiche(page)).toEqual([])
    // Niveau « faire contrôler » : un sifflement, avec la figure du frein légendée.
    await parcourirJusquAuResultat(page)
    await expect(page.locator('.alerte--attention h1')).toHaveText(
      'Roulez prudemment et faites contrôler dans les prochains jours',
    )
    const figure = page.locator('.pre-diagnostic-piste .figure-technique')
    await expect(figure).toHaveCount(1)
    await expect(figure).toBeVisible()
    // Nommée par sa légende, sans dessin annoncé une seconde fois (J5, passe 2 du jury).
    await expect(figure).toHaveAccessibleName(/^Fig\. 1 Frein à disque/)
    await expect(figure.getByRole('img')).toHaveCount(0)
    await expect(page.getByText('Pièces concernées : voir Fig. 1.')).toBeVisible()
    expect(await orangesDansLaFiche(page)).toEqual([])
    // Niveau « Pas d'urgence » : le voyant d'entretien, cadre gris.
    await page.goto('/pre-diagnostic?q1=voyant')
    await aucunSigne(page)
    await choisir(page, 'Orange ou jaune')
    await choisir(page, 'Une clé plate, ou le mot SERVICE')
    const neutre = page.locator('.pre-diagnostic-conduite')
    await expect(neutre).toHaveClass(/pre-diagnostic-conduite--sans-urgence/)
    await expect(neutre).not.toHaveClass(/alerte--(danger|attention)/)
    await expect(neutre.getByRole('heading', { level: 1 })).toHaveText(
      'Pas d’urgence : à vérifier lors d’un prochain passage',
    )
    expect(await orangesDansLaFiche(page)).toEqual([])
    expect(erreurs).toEqual([])
  })

  test('le relais : « Être rappelé » ouvre la demande avec le résumé du pré-diagnostic', async ({
    page,
  }) => {
    await parcourirJusquAuResultat(page)
    await page
      .getByRole('main')
      .getByRole('link', { name: /Être rappelé/ })
      .click()
    await expect(page).toHaveURL(
      /\/demande\?type=rappel&prediagnostic=bruit\.aucun\.freinage\.sifflement$/,
    )
    const principal = page.getByRole('main')
    // Le résumé suit les coordonnées, replié (J1) : on l'ouvre pour le relire.
    const resume = principal.locator('summary', { hasText: 'Votre pré-diagnostic' })
    await expect(resume).toBeVisible()
    await resume.click()
    await expect(
      principal.getByText('Roulez prudemment et faites contrôler dans les prochains jours').first(),
    ).toBeVisible()
    await expect(principal.getByText('Un sifflement ou un grincement aigu').first()).toBeVisible()
  })

  test('carrosserie : une pièce qui pend mène à « Ne roulez pas », avec les consignes', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic')
    await page.getByRole('link', { name: 'Autre chose ou je ne sais pas' }).click()
    await aucunSigne(page)
    await choisir(page, 'Un choc, une bosse ou une rayure sur la carrosserie')
    await expect(page.getByText('Question 4 sur 5 au plus')).toBeVisible()
    await choisir(page, 'Une pièce pend, frotte ou traîne, ou un feu est cassé')
    await expect(page.locator('.alerte--danger h1')).toHaveText('Ne roulez pas : appelez-nous')
    await expect(page.locator('.pre-diagnostic-consigne')).toHaveCount(3)
    await expect(page.locator('.pre-diagnostic-piste')).toHaveCount(2)
  })

  test('parcours au clic jusqu’au résultat : conduite, pistes, relais « Être rappelé »', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await parcourirJusquAuResultat(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Roulez prudemment et faites contrôler dans les prochains jours',
    )
    const pistes = page.locator('.pre-diagnostic-piste')
    await expect(pistes).toHaveCount(2)
    for (const piste of await pistes.all()) {
      await expect(piste).toContainText('Ce que l’atelier vérifiera :')
    }
    await expect(
      page.getByText(
        'Pré-diagnostic établi à partir de vos seules réponses. Il ne remplace pas l’examen du véhicule.',
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Être rappelé' }),
    ).toHaveAttribute('href', '/demande?type=rappel&prediagnostic=bruit.aucun.freinage.sifflement')
    await expect(page.getByRole('button', { name: 'Imprimer la fiche' })).toBeVisible()
    expect(erreurs).toEqual([])
  })

  test('le focus suit la question : à chaque étape sur son titre, puis sur la conduite à tenir', async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto('/pre-diagnostic')
    await page.getByRole('link', { name: 'Un bruit inhabituel' }).click()
    const question = page.locator('h1.pre-diagnostic-question')
    await expect(question).toHaveText('Remarquez-vous l’un de ces signes ?')
    await expect(question).toBeFocused()
    await aucunSigne(page)
    await expect(page.getByText('Question 3 sur 5 au plus')).toBeVisible()
    await expect(question).toBeFocused()
    await choisir(page, 'Quand je freine')
    await expect(page.getByText('Question 4 sur 5 au plus')).toBeVisible()
    await expect(question).toBeFocused()
    await choisir(page, 'Un sifflement ou un grincement aigu')
    await expect(page.locator('h1.alerte__titre')).toBeFocused()
    // Une tabulation depuis le titre mène au contenu de l'étape, pas à l'en-tête.
    await page.keyboard.press('Tab')
    const dansLeContenu = await page.evaluate(
      () => document.activeElement?.closest('main') !== null,
    )
    expect(dansLeContenu).toBe(true)
    expect(erreurs).toEqual([])
  })

  test('question 2 : « Aucun de ces signes » visible sans défiler, « Continuer » pleine largeur, titre sans coupure au trait d’union', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    const aucun = page.getByLabel('Aucun de ces signes', { exact: true })
    await expect(aucun).toBeInViewport({ ratio: 1 })
    // Au-dessus de la barre fixe du téléphone, qui recouvre le bas de l'écran.
    const barre = page.locator('.barre-fixe')
    if (await barre.isVisible()) {
      const tuile = await page.locator('.pre-diagnostic-choix-aucun').boundingBox()
      const haut = await barre.boundingBox()
      expect((tuile?.y ?? Infinity) + (tuile?.height ?? 0)).toBeLessThanOrEqual(haut?.y ?? 0)
    }
    const largeurs = await page.evaluate(() => {
      const bouton = document.querySelector('.pre-diagnostic-continuer')
      const liste = document.querySelector('.pre-diagnostic-etape .liste-choix')
      return [bouton?.getBoundingClientRect().width, liste?.getBoundingClientRect().width]
    })
    expect(largeurs[0]).toBeCloseTo(largeurs[1] ?? 0, 0)
    await expect(page.locator('h1 .pre-diagnostic-mot-lie')).toHaveText('Remarquez-vous')
  })

  test('une question envoyée sans réponse pose le focus sur le message d’erreur', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    await continuer(page)
    await expect(page.locator('.pre-diagnostic-erreur')).toBeFocused()
  })

  test('sous les pistes, « Demander un prix pour le freinage » et son prix mènent à la demande préremplie', async ({
    page,
  }) => {
    await parcourirJusquAuResultat(page)
    // Hors de la liste des pistes, nommé, avec le prix indicatif du catalogue.
    await expect(
      page.locator('.pre-diagnostic-pistes__liste').getByRole('link', { name: /Demander un prix/ }),
    ).toHaveCount(0)
    const lien = page.getByRole('link', { name: 'Demander un prix pour le freinage' })
    await expect(lien).toHaveCount(1)
    await expect(lien.locator('xpath=..')).toContainText(/dès\s89,00\s€\sTTC/u)
    // « Faites contrôler » : un rendez-vous prérempli, famille et réponses.
    await expect(page.getByRole('link', { name: 'Demander un rendez-vous' })).toHaveAttribute(
      'href',
      '/demande?type=rendez-vous&famille=freinage&prediagnostic=bruit.aucun.freinage.sifflement',
    )
    await lien.click()
    const adresse = new URL(page.url())
    expect(adresse.pathname).toBe('/demande')
    expect(Object.fromEntries(adresse.searchParams)).toEqual({
      type: 'devis',
      famille: 'freinage',
      prediagnostic: 'bruit.aucun.freinage.sifflement',
    })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Faire une demande')
  })

  test('un signe de danger arrête net : « Ne roulez pas. », 112 puis assistance', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    await page.getByLabel('Aucun de ces signes', { exact: true }).check()
    await page.getByLabel('De la fumée sous le capot ou une odeur de brûlé').check()
    await continuer(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ne roulez pas.')
    await expect(page.locator('main form')).toHaveCount(0)
    const consignes = page.locator('.pre-diagnostic-consigne')
    await expect(consignes).toHaveCount(3)
    await expect(consignes.nth(0)).toContainText('112')
    await expect(consignes.nth(0).getByRole('link', { name: '112' })).toHaveAttribute(
      'href',
      'tel:112',
    )
    await expect(consignes.nth(1)).toContainText('assistance de votre assureur')
    await expect(consignes.nth(2).getByRole('link', { name: 'Être rappelé' })).toBeVisible()
  })

  test('« Je ne sais pas » partout : l’atelier doit voir la voiture, rappel proposé', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic')
    await page.getByRole('link', { name: 'Autre chose ou je ne sais pas' }).click()
    await page.getByLabel('Je ne sais pas', { exact: true }).check()
    await continuer(page)
    await choisir(page, 'Je ne sais pas')
    await expect(
      page.getByText(
        'Vos réponses ne suffisent pas pour orienter : l’atelier doit voir la voiture.',
      ),
    ).toBeVisible()
    await expect(
      page.getByText('Vous ne savez pas si l’un de ces signes est présent.'),
    ).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Être rappelé' })).toBeVisible()
  })

  test('au clavier : un lien de la question 1 s’active par Entrée', async ({ page }) => {
    await page.goto('/pre-diagnostic')
    const lien = page.getByRole('link', { name: 'Le freinage a changé' })
    await lien.focus()
    await expect(lien).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q1=freinage/)
    await page.getByLabel('La pédale de frein est molle ou s’enfonce').focus()
    await page.keyboard.press('Space')
    await expect(page.getByLabel('La pédale de frein est molle ou s’enfonce')).toBeChecked()
  })

  test('l’écran d’arrêt offre des cibles de 44 pixels : le 112 et « Être rappelé »', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=freinage&q2=pedale-molle')
    for (const cible of [
      page.getByRole('link', { name: '112' }),
      page.getByRole('main').getByRole('link', { name: 'Être rappelé' }),
    ]) {
      const boite = await cible.boundingBox()
      expect(boite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
  })

  test('le journal du serveur ne garde pas les réponses données', async ({ page, serveur }) => {
    await parcourirJusquAuResultat(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Roulez prudemment et faites contrôler dans les prochains jours',
    )
    const journal = serveur.journal()
    // Vivacité : le journal d'accès tourne bien (la sonde de démarrage y figure).
    expect(journal).toContain('"url":"/sante"')
    expect(journal).not.toContain('q1=')
    expect(journal).not.toContain('sifflement')
  })

  test('les choix offrent des cibles tactiles d’au moins 44 pixels de haut', async ({ page }) => {
    await page.goto('/pre-diagnostic')
    await expect(page.locator('main .bouton-choix')).toHaveCount(7)
    for (const lien of await page.locator('main .bouton-choix').all()) {
      const boite = await lien.boundingBox()
      expect(boite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
    await page.goto('/pre-diagnostic?q1=bruit')
    await expect(page.locator('main .choix-tuile')).toHaveCount(7)
    for (const option of await page.locator('main .choix-tuile').all()) {
      const boite = await option.boundingBox()
      expect(boite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
    const continuerBoite = await page.getByRole('button', { name: 'Continuer' }).boundingBox()
    expect(continuerBoite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    await page.goto('/pre-diagnostic?q1=bruit&q2=aucun')
    for (const bouton of await page.locator('main .bouton-choix').all()) {
      const boite = await bouton.boundingBox()
      expect(boite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
    }
  })

  test('la fiche imprimée garde réponses, conduite, pistes, téléphone et adresse, sans le menu', async ({
    page,
  }) => {
    await parcourirJusquAuResultat(page)
    await page.emulateMedia({ media: 'print' })
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.pre-diagnostic-piste').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Vos réponses' })).toBeVisible()
    await expect(page.getByRole('contentinfo').getByText('7 rue Demanieux')).toBeVisible()
    await expect(page.getByRole('contentinfo').getByText('06 05 92 28 38')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Imprimer la fiche' })).toBeHidden()
    await expect(page.getByRole('main').getByRole('link', { name: 'Être rappelé' })).toBeHidden()
    // La figure et l'alerte restent sur le papier ; l'alerte imprime son aplat ou son cadre.
    await expect(page.locator('.pre-diagnostic-piste .figure-technique')).toBeVisible()
    await expect(page.locator('.pre-diagnostic-conduite')).toHaveCSS('print-color-adjust', 'exact')
    await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeHidden()
  })

  test('le livret de relecture compte une section par branche', async ({ page }) => {
    await page.goto('/pre-diagnostic/livret')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Livret de relecture du pré-diagnostic',
    )
    await expect(page.locator('.pre-diagnostic-livret__branche')).toHaveCount(7)
  })
})

test.describe('pré-diagnostic sans JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('le parcours va de la première question au résultat', async ({ page }) => {
    await parcourirJusquAuResultat(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Roulez prudemment et faites contrôler dans les prochains jours',
    )
    await expect(page.getByRole('button', { name: 'Imprimer la fiche' })).toBeHidden()
  })

  test('la question des signes envoyée vide revient en erreur, reliée au groupe', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=voyant')
    await continuer(page)
    const erreur = page.locator('#pre-diagnostic-erreur')
    await expect(erreur).toBeVisible()
    await expect(erreur).toContainText('Cochez au moins une case')
    await expect(page.getByRole('main').getByRole('group')).toHaveAttribute(
      'aria-describedby',
      'pre-diagnostic-aide pre-diagnostic-erreur',
    )
    await expect(page).toHaveTitle(/^Erreur\s: /)
  })

  test('« Aucun » et la fumée cochés ensemble mènent à l’écran d’arrêt', async ({ page }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    await page.getByLabel('Aucun de ces signes', { exact: true }).check()
    await page.getByLabel('De la fumée sous le capot ou une odeur de brûlé').check()
    await continuer(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ne roulez pas.')
  })

  test('« Revenir à la question précédente » rouvre la question 2 avec la réponse pré-cochée', async ({
    page,
  }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    await aucunSigne(page)
    await expect(page.getByText('Question 3 sur 5 au plus')).toBeVisible()
    await choisir(page, 'Quand je freine')
    await expect(page.getByText('Question 4 sur 5 au plus')).toBeVisible()
    await page.getByRole('link', { name: 'Revenir à la question précédente' }).click()
    await expect(page.getByText('Question 3 sur 5 au plus')).toBeVisible()
    await expect(
      page.getByRole('main').getByRole('button', { name: /Quand je freine/ }),
    ).toContainText('Votre réponse précédente')
    await page.getByRole('link', { name: 'Revenir à la question précédente' }).click()
    await expect(page.getByText('Question 2 sur 5 au plus')).toBeVisible()
    await expect(page.getByLabel('Aucun de ces signes', { exact: true })).toBeChecked()
  })

  test('le bouton retour du navigateur ramène à la question 2', async ({ page }) => {
    await page.goto('/pre-diagnostic?q1=bruit')
    await aucunSigne(page)
    await expect(page.getByText('Question 3 sur 5 au plus')).toBeVisible()
    await page.goBack()
    await expect(page.getByText('Question 2 sur 5 au plus')).toBeVisible()
  })
})

testProduction.describe('pré-diagnostic en production, sans relecture datée', () => {
  testProduction(
    'l’entrée et le livret répondent 404, l’accueil invite à appeler sans lier le parcours',
    async ({ page }) => {
      const entree = await page.goto('/pre-diagnostic')
      expect(entree?.status()).toBe(STATUT_INTROUVABLE)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable')
      expect((await page.goto('/pre-diagnostic?q1=bruit'))?.status()).toBe(STATUT_INTROUVABLE)
      expect((await page.goto('/pre-diagnostic/livret'))?.status()).toBe(STATUT_INTROUVABLE)
      const accueil = await page.goto('/')
      expect(accueil?.status()).toBe(200)
      const zone = page.locator('.accueil__zone--pre-diagnostic')
      await expect(
        zone.getByRole('heading', { name: 'Un souci avec votre voiture ?' }),
      ).toBeVisible()
      await expect(zone.getByRole('link', { name: /Appelez-nous|Être rappelé/ })).toBeVisible()
      await expect(page.getByRole('main').locator('a[href^="/pre-diagnostic"]')).toHaveCount(0)
    },
  )
})
