/**
 * Porte de démarrage vue de l'extérieur (Kano D8, US-05) : le vrai point
 * d'entrée, lancé dans un processus à part, doit s'arrêter avec un code non nul
 * et nommer la donnée bloquante. Un test qui appelle seulement la fonction
 * prouverait la règle, pas qu'elle s'exécute au démarrage (piège 26).
 */
import { spawn } from 'node:child_process'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { creerRacinePubliqueEssai } from '../../web/essai.js'
import { aValider, donneesEssai, FICHIER_DU_SITE, remplacer } from './essais/donnees-essai.js'

const RACINE_PROJET = resolve(import.meta.dirname, '../../..')
const DELAI_MAX_MS = 30_000
/** Port jamais écouté : le démarrage doit échouer avant. */
const PORT_INUTILISE = '4999'

interface Issue {
  readonly code: number | null
  readonly sortieErreur: string
}

const nettoyages: (() => Promise<void>)[] = []
afterEach(async () => {
  await Promise.all(nettoyages.splice(0).map((nettoyer) => nettoyer()))
})

/** Copie les vraies données du site, remplace éventuellement celles du garage, et démarre. */
async function demarrer(mode: string | undefined, garage?: unknown): Promise<Issue> {
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-demarrage-'))
  const donnees = join(dossier, 'donnees')
  await cp(dirname(FICHIER_DU_SITE), donnees, { recursive: true })
  if (garage !== undefined) await writeFile(join(donnees, 'garage.json'), JSON.stringify(garage))
  const racinePublique = await creerRacinePubliqueEssai()
  nettoyages.push(() => rm(dossier, { recursive: true, force: true }))
  nettoyages.push(() => rm(racinePublique, { recursive: true, force: true }))

  const environnement: Record<string, string> = {
    PATH: process.env['PATH'] ?? '',
    PORT: PORT_INUTILISE,
    CHEMIN_DONNEES: donnees,
    CHEMIN_PUBLIC: racinePublique,
    BASE_SQLITE: join(dossier, 'base.sqlite'),
    NIVEAU_JOURNAL: 'silent',
    ...(mode !== undefined && { MODE_SITE: mode }),
  }
  return new Promise((accepter, refuser) => {
    const processus = spawn(process.execPath, ['--import', 'tsx', 'src/demarrer.ts'], {
      cwd: RACINE_PROJET,
      env: environnement,
    })
    let sortieErreur = ''
    processus.stderr.on('data', (morceau: Buffer) => {
      sortieErreur += morceau.toString()
    })
    const minuterie = setTimeout(() => {
      processus.kill()
      refuser(new Error(`le serveur a démarré au lieu d’échouer :\n${sortieErreur}`))
    }, DELAI_MAX_MS)
    processus.on('close', (code) => {
      clearTimeout(minuterie)
      accepter({ code, sortieErreur })
    })
  })
}

describe('porte de démarrage du vrai point d’entrée', () => {
  it(
    'sans MODE_SITE (production par défaut), le vrai fichier arrête le site et nomme ses manques',
    async () => {
      const issue = await demarrer(undefined)
      expect(issue.code).not.toBe(0)
      expect(issue.sortieErreur).toContain('Démarrage refusé en production')
      expect(issue.sortieErreur).toContain('mediateur (médiateur de la consommation) à valider')
      expect(issue.sortieErreur).toContain('horaires (horaires jour par jour) à valider')
      // Les prix de démonstration du catalogue ne partent jamais en ligne.
      expect(issue.sortieErreur).toContain(
        'Prix de démonstration à confirmer par le garage ou à retirer avant la mise en ligne',
      )
    },
    DELAI_MAX_MS,
  )

  it(
    'un fichier complet sauf le médiateur : échec qui nomme le seul médiateur',
    async () => {
      const donnees = remplacer(await donneesEssai(), 'mediateur', aValider('médiateur à choisir'))
      const issue = await demarrer('production', donnees)
      expect(issue.code).not.toBe(0)
      expect(issue.sortieErreur).toContain('- mediateur (médiateur de la consommation) à valider')
      expect(issue.sortieErreur).not.toContain('horaires (')
    },
    DELAI_MAX_MS,
  )

  it(
    'un mode inconnu arrête le démarrage et nomme les valeurs admises',
    async () => {
      const issue = await demarrer('demo')
      expect(issue.code).not.toBe(0)
      expect(issue.sortieErreur).toContain('production, relecture, demonstration')
    },
    DELAI_MAX_MS,
  )
})
