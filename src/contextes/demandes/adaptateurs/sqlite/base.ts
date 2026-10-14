import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

export type Base = Database.Database

/** Chemin spécial : base en mémoire, pour les tests qui n'ont pas besoin du disque. */
export const BASE_EN_MEMOIRE = ':memory:'

/** Attente maximale d'un verrou tenu par un autre accès au même fichier (contexte accès). */
const ATTENTE_VERROU_MS = 5_000

/**
 * Tables propres au contexte, préfixées « demandes_ » : le fichier SQLite est
 * partagé avec le contexte accès, qui a les siennes. Tables STRICT : un type
 * inattendu est refusé à l'écriture plutôt que découvert à la lecture.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS demandes_recues (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  contenu TEXT NOT NULL,
  statut TEXT NOT NULL,
  recue_le TEXT NOT NULL,
  statut_change_le TEXT,
  premiere_consultation_le TEXT,
  jeton_formulaire TEXT NOT NULL UNIQUE,
  jeton_confirmation TEXT NOT NULL UNIQUE,
  notification_etat TEXT NOT NULL,
  notification_envoyee_le TEXT,
  notification_premier_echec_le TEXT,
  notification_essais INTEGER NOT NULL DEFAULT 0,
  notification_prochain_essai_le TEXT,
  notification_derniere_erreur TEXT,
  promesse_phrase TEXT,
  promesse_date TEXT,
  promesse_demi_journee TEXT,
  tentatives_appel TEXT NOT NULL DEFAULT '[]'
) STRICT;
CREATE INDEX IF NOT EXISTS demandes_recues_statut ON demandes_recues (statut, recue_le);
CREATE INDEX IF NOT EXISTS demandes_recues_renvoi
  ON demandes_recues (notification_etat, notification_prochain_essai_le);
CREATE TABLE IF NOT EXISTS demandes_envois_suspects (
  jeton TEXT PRIMARY KEY,
  recu_le TEXT NOT NULL,
  confirme_le TEXT
) STRICT;
CREATE TABLE IF NOT EXISTS demandes_suivi_courriel (
  demande_id TEXT NOT NULL REFERENCES demandes_recues (id) ON DELETE CASCADE,
  nature TEXT NOT NULL,
  le TEXT NOT NULL,
  motif TEXT,
  PRIMARY KEY (demande_id, nature)
) STRICT;
CREATE TABLE IF NOT EXISTS demandes_filigrane_boite (
  dossier TEXT PRIMARY KEY,
  validite_uid TEXT NOT NULL,
  dernier_uid INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS demandes_cles (
  nom TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
) STRICT;
`

/**
 * Colonnes ajoutées après la première mise en service : une base existante
 * les reçoit à l'ouverture, vides (aucune promesse connue, aucun appel noté).
 */
const COLONNES_AJOUTEES: readonly (readonly [nom: string, definition: string])[] = [
  ['promesse_phrase', 'TEXT'],
  ['promesse_date', 'TEXT'],
  ['promesse_demi_journee', 'TEXT'],
  ['tentatives_appel', "TEXT NOT NULL DEFAULT '[]'"],
]

/** Index posés après les colonnes qu'ils utilisent. */
const INDEX_TARDIFS = `
CREATE INDEX IF NOT EXISTS demandes_recues_promesse ON demandes_recues (statut, promesse_date);
`

function migrer(base: Base): void {
  const presentes = new Set(
    base
      .prepare<[], { name: string }>("SELECT name FROM pragma_table_info('demandes_recues')")
      .all()
      .map((colonne) => colonne.name),
  )
  for (const [nom, definition] of COLONNES_AJOUTEES) {
    if (!presentes.has(nom))
      base.exec(`ALTER TABLE demandes_recues ADD COLUMN ${nom} ${definition}`)
  }
  base.exec(INDEX_TARDIFS)
}

/**
 * Ouvre (ou crée) la base des demandes : dossier créé si besoin, journal WAL
 * (lectures sans blocage, écriture durable), schéma posé puis complété.
 */
export function ouvrirBaseDemandes(chemin: string): Base {
  if (chemin !== BASE_EN_MEMOIRE) mkdirSync(dirname(chemin), { recursive: true })
  const base = new Database(chemin)
  base.pragma('journal_mode = WAL')
  base.pragma('synchronous = NORMAL')
  base.pragma(`busy_timeout = ${ATTENTE_VERROU_MS}`)
  base.pragma('foreign_keys = ON')
  base.exec(SCHEMA)
  base.transaction(() => migrer(base)).immediate()
  return base
}
