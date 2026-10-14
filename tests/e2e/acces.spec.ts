import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Parcours de l'espace garagiste (Kano D5, US-33, US-49), au clic réel, sur
 * ordinateur et sur iPhone 13, avec et sans JavaScript.
 *
 * Le serveur commun des parcours tourne en démonstration : le lien s'y affiche
 * dans la page. Ce fichier démarre donc, en plus, son propre serveur en
 * relecture (mêmes canaux qu'en production) avec une adresse configurée et sans
 * serveur d'envoi : chaque lien s'écrit dans le journal du serveur (la page le
 * dit), que le parcours lit comme Anthony le lirait. La production elle-même
 * refuse de démarrer sans serveur d'envoi (porte de démarrage, Kano D8). Journal
 * au niveau info, comme en production, pour vérifier qu'aucun jeton n'y figure
 * dans les lignes d'accès. Base SQLite jetable, port libre tiré au hasard.
 */

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const TSX = join(RACINE, 'node_modules', '.bin', 'tsx')
const COMMANDE_GARAGISTE = 'src/contextes/acces/adaptateurs/cli/garagiste.ts'
const GARAGISTE = 'garagiste@exemple.fr'
const RESPONSABLE = 'anthony@exemple.fr'
const DELAI_DEMARRAGE_MS = 60_000
const INTERVALLE_SONDE_MS = 200
const CIBLE_TACTILE_PX = 44
const MOTIF_LIEN = /http:\/\/127\.0\.0\.1:\d+\/garagiste\/connexion\/lien\?jeton=[A-Za-z0-9_-]+/g
/** Ligne d'accès du journal qui porterait l'adresse de la page du lien, jeton compris. */
const ACCES_JOURNALISE_AU_LIEN = '"url":"/garagiste/connexion/lien?jeton='
const TITRE_LIEN_AU_JOURNAL = 'Lien non envoyé par courriel'
const TITRE_SIGNALEMENT_AU_JOURNAL = 'Signalement non envoyé par courriel'

interface ServeurAcces {
  readonly origine: string
  readonly base: string
  readonly sortie: () => string
  readonly arreter: () => void
}

function portLibre(): Promise<number> {
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

async function attendreSante(origine: string, processus: ChildProcess): Promise<void> {
  const limite = Date.now() + DELAI_DEMARRAGE_MS
  while (Date.now() < limite) {
    if (processus.exitCode !== null) throw new Error('Le serveur d’essai s’est arrêté au démarrage')
    try {
      if ((await fetch(`${origine}/sante`)).ok) return
    } catch {
      // Pas encore à l'écoute.
    }
    await new Promise((resoudre) => setTimeout(resoudre, INTERVALLE_SONDE_MS))
  }
  throw new Error(`Serveur d’essai muet après ${DELAI_DEMARRAGE_MS} ms`)
}

async function demarrerServeurAcces(): Promise<ServeurAcces> {
  const port = await portLibre()
  const origine = `http://127.0.0.1:${port}`
  const dossier = mkdtempSync(join(tmpdir(), 'bf-auto-e2e-acces-'))
  const base = join(dossier, 'base.sqlite')
  let sortie = ''
  const processus = spawn(TSX, ['src/demarrer.ts'], {
    cwd: RACINE,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(port),
      HOTE: '127.0.0.1',
      URL_PUBLIQUE: origine,
      BASE_SQLITE: base,
      MODE_SITE: 'relecture',
      COURRIEL_GARAGISTE: GARAGISTE,
      COURRIEL_RESPONSABLE_SITE: RESPONSABLE,
      SMTP_HOTE: '',
      NIVEAU_JOURNAL: 'info',
    },
  })
  processus.stdout?.on('data', (morceau: Buffer) => {
    sortie += morceau.toString('utf8')
  })
  processus.stderr?.on('data', (morceau: Buffer) => {
    sortie += morceau.toString('utf8')
  })
  await attendreSante(origine, processus)
  return {
    origine,
    base,
    sortie: () => sortie,
    arreter: () => {
      if (processus.pid !== undefined && processus.exitCode === null) {
        process.kill(-processus.pid, 'SIGTERM')
      }
      rmSync(dossier, { recursive: true, force: true })
    },
  }
}

/** Commande d'exploitation, lancée comme Anthony la lancerait sur le serveur. */
function commandeGaragiste(serveur: ServeurAcces, commande: 'lien' | 'reinitialiser'): string {
  const resultat = spawnSync(TSX, [COMMANDE_GARAGISTE, commande], {
    cwd: RACINE,
    encoding: 'utf8',
    env: { ...process.env, BASE_SQLITE: serveur.base, URL_PUBLIQUE: serveur.origine },
  })
  expect(resultat.status, resultat.stderr).toBe(0)
  return resultat.stdout
}

/** Liens de connexion écrits jusqu'ici par le serveur (messagerie console). */
function liensEnvoyes(serveur: ServeurAcces): string[] {
  return serveur.sortie().match(MOTIF_LIEN) ?? []
}

async function attendreNouveauLien(serveur: ServeurAcces, avant: number): Promise<string> {
  await expect.poll(() => liensEnvoyes(serveur).length).toBeGreaterThan(avant)
  const lien = liensEnvoyes(serveur).at(-1)
  if (lien === undefined) throw new Error('Aucun lien envoyé')
  return lien
}

async function seConnecterParLienDeSecours(page: Page, serveur: ServeurAcces): Promise<void> {
  const [adresse] = commandeGaragiste(serveur, 'lien').match(MOTIF_LIEN) ?? []
  if (adresse === undefined) throw new Error('La commande n’a affiché aucun lien')
  await page.goto(adresse)
  await page.getByRole('button', { name: 'Ouvrir mon espace garagiste' }).click()
  await expect(page).toHaveURL(`${serveur.origine}/garagiste`)
}

async function attendreCibleTactile(cible: Locator): Promise<void> {
  const boite = await cible.boundingBox()
  expect(boite).not.toBeNull()
  expect(boite?.height ?? 0).toBeGreaterThanOrEqual(CIBLE_TACTILE_PX)
}

function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      erreurs.push(`console ${message.type()} : ${message.text()}`)
    }
  })
  page.on('pageerror', (erreur) => erreurs.push(`script : ${erreur.message}`))
  page.on('requestfailed', (requete) => erreurs.push(`requête en échec : ${requete.url()}`))
  return erreurs
}

test.describe('espace garagiste sur le serveur commun (démonstration)', () => {
  test('sans session, /garagiste mène à la connexion, jamais indexée', async ({ page }) => {
    const reponse = await page.goto('/garagiste')
    expect(page.url()).toMatch(/\/garagiste\/connexion\?retour=%2Fgaragiste$/)
    expect(reponse?.status()).toBe(200)
    expect(reponse?.headers()['x-robots-tag']).toBe('noindex')
    expect(reponse?.headers()['cache-control']).toBe('no-store')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Espace garagiste')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })
})

test.describe('espace garagiste : connexion par lien, espace, signalement', () => {
  let serveur: ServeurAcces

  test.beforeAll(async () => {
    serveur = await demarrerServeurAcces()
  })
  test.afterAll(() => {
    serveur.arreter()
  })

  test('recevoir un lien au clic, l’ouvrir, entrer dans l’espace ; le lien ne resservira pas', async ({
    page,
    browser,
  }) => {
    const erreurs = surveillerErreurs(page)
    await page.goto(`${serveur.origine}/garagiste`)
    await expect(page).toHaveURL(`${serveur.origine}/garagiste/connexion?retour=%2Fgaragiste`)
    const bouton = page.getByRole('button', { name: 'Recevoir un lien de connexion' })
    await attendreCibleTactile(bouton)
    const avant = liensEnvoyes(serveur).length
    await bouton.click()
    // Aucun serveur d'envoi : la page dit où est allé le lien, jamais « parti ».
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITRE_LIEN_AU_JOURNAL)
    await expect(page.getByRole('status')).toContainText('écrit dans le journal du serveur')
    await expect(page.getByText('vient de partir')).toHaveCount(0)

    const lien = await attendreNouveauLien(serveur, avant)
    expect(serveur.sortie()).toContain(`À : ${GARAGISTE}`)
    // Hors démonstration, le lien n'apparaît que dans le message, jamais dans la page.
    expect(await page.content()).not.toContain(new URL(lien).searchParams.get('jeton') ?? '')

    await page.goto(lien)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ouvrir votre espace')
    const ouvrir = page.getByRole('button', { name: 'Ouvrir mon espace garagiste' })
    await attendreCibleTactile(ouvrir)
    await ouvrir.click()
    await expect(page).toHaveURL(`${serveur.origine}/garagiste`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Votre espace')
    // Le journal d'accès est actif (sans chaîne de requête), mais la page du lien n'y a pas laissé son adresse.
    expect(serveur.sortie()).toContain('"url":"/garagiste/connexion"')
    expect(serveur.sortie()).not.toContain(ACCES_JOURNALISE_AU_LIEN)
    for (const raccourci of [
      'Demandes des clients',
      'Fermetures exceptionnelles',
      'Signaler un changement',
    ]) {
      await expect(page.getByRole('link', { name: raccourci })).toBeVisible()
    }
    await expect(
      page.getByRole('heading', { name: 'Pensez aussi à votre fiche Google' }),
    ).toBeVisible()

    const [cookie] = (await page.context().cookies(`${serveur.origine}/garagiste`)).filter(
      (candidat) => candidat.name === 'bf_session',
    )
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
    expect(cookie?.path).toBe('/garagiste')
    expect(await page.evaluate(() => document.cookie)).not.toContain('bf_session')
    expect(erreurs).toEqual([])

    // Un autre téléphone qui rouvrirait le même lien est éconduit.
    const autre = await browser.newContext()
    const autrePage = await autre.newPage()
    const reponse = await autrePage.goto(lien)
    expect(reponse?.status()).toBe(410)
    await expect(autrePage.getByRole('alert')).toHaveText(
      'Ce lien a déjà servi : demandez-en un nouveau.',
    )
    await autre.close()
  })

  test('l’accueil de l’espace explique l’écran d’accueil du téléphone, cibles tactiles comprises', async ({
    page,
  }) => {
    await seConnecterParLienDeSecours(page, serveur)
    // Le compteur des demandes, sur la carte qui y mène (J4) : base neuve, rien n'attend.
    await expect(page.locator('.acces-compteur')).toHaveText('Aucune demande à rappeler.')
    const astuce = page.locator('summary', { hasText: 'Mettre l’espace sur l’écran d’accueil' })
    await attendreCibleTactile(astuce)
    await astuce.click()
    await expect(page.getByText('iPhone, dans Safari')).toBeVisible()
    await attendreCibleTactile(page.getByRole('button', { name: 'Se déconnecter' }))
  })

  test('signaler un changement : erreurs reliées aux champs, puis message structuré vers Anthony', async ({
    page,
  }) => {
    await seConnecterParLienDeSecours(page, serveur)
    await page.getByRole('link', { name: 'Signaler un changement' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signaler un changement')
    // Le retour à l'espace est une cible de 44 px (J4), les champs vides ne sont pas « invalides » (J5).
    await attendreCibleTactile(page.getByRole('link', { name: 'Revenir à l’espace' }))
    await expect(page.getByLabel('Ce qui change')).toHaveAttribute('aria-invalid', 'false')

    await page.getByRole('button', { name: 'Envoyer à Anthony' }).click()
    const resume = page.locator('#acces-signalement-erreurs')
    await expect(resume).toBeFocused()
    await expect(resume).toContainText('Le signalement n’est pas parti')
    const nature = page.getByLabel('Ce qui change')
    await expect(nature).toHaveAttribute('aria-invalid', 'true')
    await expect(nature).toHaveAccessibleDescription('Choisissez ce qui change.')
    const texte = page.getByLabel('Votre message')
    await expect(texte).toHaveAttribute('aria-invalid', 'true')

    await nature.selectOption({ label: 'Horaires habituels' })
    // 500 caractères pour le champ, retour à la ligne compris : le navigateur l'envoie en CRLF.
    const saisie = `${'Fermeture à 18 h le samedi. '.repeat(8)}\n${'x'.repeat(275)}`
    expect(saisie).toHaveLength(500)
    await texte.fill(saisie)
    const envoyer = page.getByRole('button', { name: 'Envoyer à Anthony' })
    await attendreCibleTactile(envoyer)
    await envoyer.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITRE_SIGNALEMENT_AU_JOURNAL)
    await expect(page.getByRole('status')).toContainText(
      'votre message a été écrit dans le journal du serveur',
    )
    await expect(page.locator('.acces-texte-libre')).toContainText('Fermeture à 18 h le samedi.')
    await expect
      .poll(() => serveur.sortie())
      .toContain('Objet : Signalement du garagiste : Horaires habituels')
    expect(serveur.sortie()).toContain(`À : ${RESPONSABLE}`)
  })

  test('se déconnecter ferme la session sur ce téléphone', async ({ page }) => {
    await seConnecterParLienDeSecours(page, serveur)
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(`${serveur.origine}/garagiste/connexion?etat=deconnexion`)
    await expect(page.getByRole('status')).toContainText('Vous êtes déconnecté.')
    await page.goto(`${serveur.origine}/garagiste`)
    await expect(page).toHaveURL(`${serveur.origine}/garagiste/connexion?retour=%2Fgaragiste`)
  })

  test('la commande de réinitialisation ferme la session du téléphone', async ({ page }) => {
    await seConnecterParLienDeSecours(page, serveur)
    expect(commandeGaragiste(serveur, 'reinitialiser')).toContain('Accès réinitialisé')
    await page.reload()
    await expect(page).toHaveURL(`${serveur.origine}/garagiste/connexion?retour=%2Fgaragiste`)
  })

  test('un formulaire de l’espace posté depuis un autre site est refusé, et la session reste ouverte', async ({
    page,
  }) => {
    await seConnecterParLienDeSecours(page, serveur)
    const jeton = await page.locator('input[name="jeton_formulaire"]').inputValue()
    const falsifiee = await page.request.post(`${serveur.origine}/garagiste/deconnexion`, {
      form: { jeton_formulaire: jeton },
      headers: { origin: 'https://pirate.exemple' },
      maxRedirects: 0,
    })
    expect(falsifiee.status()).toBe(403)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Votre espace')
  })

  test.describe('sans JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('recevoir le lien, ouvrir l’espace et signaler un changement', async ({ page }) => {
      await page.goto(`${serveur.origine}/garagiste/connexion`)
      const avant = liensEnvoyes(serveur).length
      await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITRE_LIEN_AU_JOURNAL)
      await page.goto(await attendreNouveauLien(serveur, avant))
      await page.getByRole('button', { name: 'Ouvrir mon espace garagiste' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Votre espace')

      await page.getByRole('link', { name: 'Signaler un changement' }).click()
      await page.getByLabel('Ce qui change').selectOption({ label: 'Prix' })
      await page.getByLabel('Votre message').fill('Nouveau prix du premier contrôle')
      await page.getByRole('button', { name: 'Envoyer à Anthony' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITRE_SIGNALEMENT_AU_JOURNAL)
    })
  })
})
