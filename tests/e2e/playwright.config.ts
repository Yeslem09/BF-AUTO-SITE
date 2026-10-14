import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

/**
 * Parcours navigateur de bout en bout. Le port est surchargeable (PORT_E2E) :
 * deux copies du dépôt testées en même temps ne doivent pas se disputer le
 * même serveur.
 *
 * Le serveur commun tourne en démonstration (MODE_SITE=demonstration) : en
 * production, la porte de démarrage refuse les vraies données tant qu'elles
 * restent à valider. Sa base SQLite est propre à chaque exécution, dans un
 * dossier temporaire : aucune demande d'une exécution précédente ne fausse les
 * listes, et le poste de développement garde la sienne intacte.
 */
const VARIABLE_BASE = 'BASE_SQLITE_E2E'
// Créée une fois par le processus principal ; les travailleurs, qui relisent ce
// fichier, héritent de la variable et ne créent rien.
process.env[VARIABLE_BASE] ??= join(mkdtempSync(join(tmpdir(), 'bf-auto-e2e-')), 'site.sqlite')
const BASE_SQLITE = process.env[VARIABLE_BASE]
const PORT_PAR_DEFAUT = 4178
const PORT = Number(process.env['PORT_E2E'] ?? PORT_PAR_DEFAUT)
const ORIGINE = `http://127.0.0.1:${PORT}`
const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const DELAI_DEMARRAGE_MS = 60_000

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: `${RACINE}/test-results`,
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: ORIGINE,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
    // Seul Chromium est installé : l'iPhone 13 est émulé dans Chromium.
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'node scripts/construire-client.mjs && pnpm exec tsx src/demarrer.ts',
    cwd: RACINE,
    url: `${ORIGINE}/sante`,
    reuseExistingServer: false,
    timeout: DELAI_DEMARRAGE_MS,
    env: {
      PORT: String(PORT),
      HOTE: '127.0.0.1',
      URL_PUBLIQUE: ORIGINE,
      NIVEAU_JOURNAL: 'warn',
      MODE_SITE: 'demonstration',
      BASE_SQLITE,
    },
  },
})
