import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { DepotFermetures } from '../../application/ports.js'
import {
  estMotifFermeture,
  type Fermeture,
  type PeriodeFermeture,
} from '../../domaine/fermeture.js'
import {
  comparerDates,
  dateIso,
  lireDateIso,
  type DateCalendaire,
} from '../../domaine/temps-local.js'

/** Base en mémoire, pour les essais. */
export const BASE_EN_MEMOIRE = ':memory:'
const DELAI_ATTENTE_VERROU_MS = 5000

/**
 * Tables propres au contexte garage, préfixées « garage_ » : le fichier SQLite
 * est partagé avec les demandes et l'accès. Les dates sont des jours du
 * calendrier de Paris au format AAAA-MM-JJ, qui se comparent comme du texte.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS garage_fermetures (
  identifiant INTEGER PRIMARY KEY,
  du TEXT NOT NULL,
  au TEXT NOT NULL,
  motif TEXT NOT NULL,
  declaree_le TEXT NOT NULL,
  CHECK (du <= au)
);
CREATE INDEX IF NOT EXISTS garage_fermetures_par_fin ON garage_fermetures (au);
`

interface LigneFermeture {
  readonly identifiant: unknown
  readonly du: unknown
  readonly au: unknown
  readonly motif: unknown
}

export interface OptionsDepotFermetures {
  /** Prévenu de chaque ligne illisible écartée (journal du serveur). */
  readonly signalerLigneIllisible?: (ligne: unknown) => void
}

/**
 * Dépôt SQLite des fermetures. Une ligne illisible (modifiée à la main, par
 * exemple) est écartée et signalée : elle n'emporte jamais la page entière.
 */
export function creerDepotFermeturesSqlite(
  chemin: string,
  options: OptionsDepotFermetures = {},
): DepotFermetures & { fermer(): void } {
  if (chemin !== BASE_EN_MEMOIRE) mkdirSync(dirname(chemin), { recursive: true })
  const base = new Database(chemin)
  base.pragma('journal_mode = WAL')
  base.pragma(`busy_timeout = ${DELAI_ATTENTE_VERROU_MS}`)
  base.exec(SCHEMA)
  const lister = base.prepare<[string], LigneFermeture>(
    'SELECT identifiant, du, au, motif FROM garage_fermetures WHERE au >= ? ORDER BY du, identifiant',
  )
  const inserer = base.prepare<[string, string, string, string]>(
    'INSERT INTO garage_fermetures (du, au, motif, declaree_le) VALUES (?, ?, ?, ?)',
  )
  const effacer = base.prepare<[number]>('DELETE FROM garage_fermetures WHERE identifiant = ?')
  const signaler = options.signalerLigneIllisible ?? (() => undefined)

  return {
    async listerDepuis(date) {
      return lister.all(dateIso(date)).flatMap((ligne) => {
        const fermeture = versFermeture(ligne)
        if (fermeture === null) signaler(ligne)
        return fermeture === null ? [] : [fermeture]
      })
    },
    async ajouter(periode: PeriodeFermeture, declareeLe: Date) {
      const resultat = inserer.run(
        dateIso(periode.du),
        dateIso(periode.au),
        periode.motif,
        declareeLe.toISOString(),
      )
      return { ...periode, identifiant: Number(resultat.lastInsertRowid) }
    },
    async supprimer(identifiant) {
      return effacer.run(identifiant).changes > 0
    },
    fermer() {
      if (base.open) base.close()
    },
  }
}

function lireDate(valeur: unknown): DateCalendaire | null {
  return typeof valeur === 'string' ? lireDateIso(valeur) : null
}

function versFermeture(ligne: LigneFermeture): Fermeture | null {
  const du = lireDate(ligne.du)
  const au = lireDate(ligne.au)
  const { identifiant, motif } = ligne
  if (du === null || au === null || comparerDates(du, au) > 0) return null
  if (typeof identifiant !== 'number' || typeof motif !== 'string' || !estMotifFermeture(motif)) {
    return null
  }
  return { identifiant, du, au, motif }
}
