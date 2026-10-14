import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { DepotAcces } from '../../application/ports.js'
import { limiteConservationLiens, type LienConnexion } from '../../domaine/lien-connexion.js'
import type { Session } from '../../domaine/session.js'

/** Base en mémoire, pour les tests : le même moteur que la production. */
export const BASE_EN_MEMOIRE = ':memory:'

/**
 * Tables propres à ce contexte, dans le fichier SQLite partagé avec les
 * demandes (préfixe `acces_`). Les instants sont en millisecondes depuis 1970 ;
 * les jetons n'y figurent jamais en clair, seulement leur empreinte.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS acces_liens (
  empreinte TEXT PRIMARY KEY,
  cree_le INTEGER NOT NULL,
  expire_le INTEGER NOT NULL,
  utilise_le INTEGER,
  retour TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS acces_sessions (
  empreinte TEXT PRIMARY KEY,
  cree_le INTEGER NOT NULL,
  expire_le INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS acces_secrets (
  nom TEXT PRIMARY KEY,
  valeur BLOB NOT NULL
) STRICT;
`

interface LigneLien {
  readonly empreinte: string
  readonly cree_le: number
  readonly expire_le: number
  readonly utilise_le: number | null
  readonly retour: string
}

interface LigneSession {
  readonly empreinte: string
  readonly cree_le: number
  readonly expire_le: number
}

export class ErreurDepotAcces extends Error {
  override readonly name = 'ErreurDepotAcces'
}

/** Lecture défensive : une ligne au mauvais type est une base corrompue, dite comme telle. */
function entier(valeur: unknown, colonne: string): number {
  if (typeof valeur !== 'number' || !Number.isInteger(valeur)) {
    throw new ErreurDepotAcces(`Colonne ${colonne} : entier attendu, reçu ${typeof valeur}.`)
  }
  return valeur
}

function versLien(ligne: LigneLien): LienConnexion {
  return {
    empreinte: ligne.empreinte,
    creeLe: new Date(entier(ligne.cree_le, 'cree_le')),
    expireLe: new Date(entier(ligne.expire_le, 'expire_le')),
    utiliseLe: ligne.utilise_le === null ? null : new Date(entier(ligne.utilise_le, 'utilise_le')),
    retour: ligne.retour,
  }
}

function versSession(ligne: LigneSession): Session {
  return {
    empreinte: ligne.empreinte,
    creeLe: new Date(entier(ligne.cree_le, 'cree_le')),
    expireLe: new Date(entier(ligne.expire_le, 'expire_le')),
  }
}

export interface DepotAccesSqlite extends DepotAcces {
  /**
   * Secret nommé, tiré une fois par `creer` puis conservé dans la base : il
   * survit aux redémarrages et aux déploiements, comme les sessions qu'il protège.
   */
  secret(nom: string, creer: () => Buffer): Buffer
  fermer(): void
}

export function creerDepotAccesSqlite(chemin: string): DepotAccesSqlite {
  if (chemin !== BASE_EN_MEMOIRE) mkdirSync(dirname(chemin), { recursive: true })
  const base = new Database(chemin)
  base.pragma('journal_mode = WAL')
  base.pragma('busy_timeout = 5000')
  base.exec(SCHEMA)

  const requetes = {
    insererLien: base.prepare<[string, number, number, string]>(
      'INSERT INTO acces_liens (empreinte, cree_le, expire_le, utilise_le, retour) VALUES (?, ?, ?, NULL, ?)',
    ),
    trouverLien: base.prepare<[string], LigneLien>(
      'SELECT empreinte, cree_le, expire_le, utilise_le, retour FROM acces_liens WHERE empreinte = ?',
    ),
    consommerLien: base.prepare<[number, string, number]>(
      'UPDATE acces_liens SET utilise_le = ? WHERE empreinte = ? AND utilise_le IS NULL AND expire_le > ?',
    ),
    insererSession: base.prepare<[string, number, number]>(
      'INSERT INTO acces_sessions (empreinte, cree_le, expire_le) VALUES (?, ?, ?)',
    ),
    trouverSession: base.prepare<[string], LigneSession>(
      'SELECT empreinte, cree_le, expire_le FROM acces_sessions WHERE empreinte = ?',
    ),
    prolongerSession: base.prepare<[number, string]>(
      'UPDATE acces_sessions SET expire_le = ? WHERE empreinte = ?',
    ),
    supprimerSession: base.prepare<[string]>('DELETE FROM acces_sessions WHERE empreinte = ?'),
    supprimerSessions: base.prepare('DELETE FROM acces_sessions'),
    supprimerLiensNonUtilises: base.prepare('DELETE FROM acces_liens WHERE utilise_le IS NULL'),
    purgerSessions: base.prepare<[number]>('DELETE FROM acces_sessions WHERE expire_le <= ?'),
    purgerLiens: base.prepare<[number]>('DELETE FROM acces_liens WHERE expire_le <= ?'),
    insererSecret: base.prepare<[string, Buffer]>(
      'INSERT OR IGNORE INTO acces_secrets (nom, valeur) VALUES (?, ?)',
    ),
    lireSecret: base.prepare<[string], { readonly valeur: unknown }>(
      'SELECT valeur FROM acces_secrets WHERE nom = ?',
    ),
  }

  const echanger = base.transaction(
    (empreinteLien: string, session: Session, maintenant: Date): boolean => {
      const temps = maintenant.getTime()
      if (requetes.consommerLien.run(temps, empreinteLien, temps).changes !== 1) return false
      requetes.insererSession.run(
        session.empreinte,
        session.creeLe.getTime(),
        session.expireLe.getTime(),
      )
      return true
    },
  )
  const toutRevoquer = base.transaction(() => ({
    sessions: requetes.supprimerSessions.run().changes,
    liens: requetes.supprimerLiensNonUtilises.run().changes,
  }))

  return {
    enregistrerLien: (lien) => {
      requetes.insererLien.run(
        lien.empreinte,
        lien.creeLe.getTime(),
        lien.expireLe.getTime(),
        lien.retour,
      )
    },
    trouverLien: (empreinte) => {
      const ligne = requetes.trouverLien.get(empreinte)
      return ligne === undefined ? null : versLien(ligne)
    },
    echangerLienContreSession: (empreinteLien, session, maintenant) =>
      echanger(empreinteLien, session, maintenant),
    trouverSession: (empreinte) => {
      const ligne = requetes.trouverSession.get(empreinte)
      return ligne === undefined ? null : versSession(ligne)
    },
    prolongerSession: (empreinte, expireLe) => {
      requetes.prolongerSession.run(expireLe.getTime(), empreinte)
    },
    supprimerSession: (empreinte) => {
      requetes.supprimerSession.run(empreinte)
    },
    toutRevoquer: () => toutRevoquer(),
    purger: (maintenant) => {
      requetes.purgerSessions.run(maintenant.getTime())
      requetes.purgerLiens.run(limiteConservationLiens(maintenant).getTime())
    },
    secret: (nom, creer) => {
      // Deux processus qui démarrent ensemble gardent le même secret : le premier écrit gagne.
      requetes.insererSecret.run(nom, creer())
      const valeur = requetes.lireSecret.get(nom)?.valeur
      if (!Buffer.isBuffer(valeur) || valeur.length === 0) {
        throw new ErreurDepotAcces(`Secret ${nom} illisible dans la base.`)
      }
      return valeur
    },
    fermer: () => {
      base.close()
    },
  }
}
