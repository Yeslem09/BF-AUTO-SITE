import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { nouveauLien } from '../../domaine/lien-connexion.js'
import { nouvelleSession } from '../../domaine/session.js'
import { BASE_EN_MEMOIRE, creerDepotAccesSqlite } from './depot-acces-sqlite.js'

const MAINTENANT = new Date('2026-09-23T08:00:00Z')
const MINUTE = 60_000
const JOUR = 24 * 60 * MINUTE
const plus = (millisecondes: number): Date => new Date(MAINTENANT.getTime() + millisecondes)

let dossier: string | null = null
afterEach(async () => {
  if (dossier !== null) await rm(dossier, { recursive: true, force: true })
  dossier = null
})

describe('dépôt SQLite de l’accès', () => {
  it('relit un lien et une session tels qu’enregistrés, dates comprises', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('lien-1', MAINTENANT, '/garagiste/demandes'))
    expect(depot.trouverLien('lien-1')).toEqual({
      empreinte: 'lien-1',
      creeLe: MAINTENANT,
      expireLe: plus(15 * MINUTE),
      utiliseLe: null,
      retour: '/garagiste/demandes',
    })
    expect(depot.trouverLien('absent')).toBeNull()
    expect(depot.trouverSession('absente')).toBeNull()
    depot.fermer()
  })

  it('échange un lien contre une session une seule fois, d’un seul tenant', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('lien-1', MAINTENANT, '/garagiste'))
    const premiere = nouvelleSession('session-1', MAINTENANT)
    expect(depot.echangerLienContreSession('lien-1', premiere, MAINTENANT)).toBe(true)
    expect(depot.trouverLien('lien-1')?.utiliseLe).toEqual(MAINTENANT)
    expect(depot.trouverSession('session-1')).toEqual(premiere)
    // Le même lien ne rouvre rien, et la session refusée n'est pas enregistrée.
    const seconde = nouvelleSession('session-2', MAINTENANT)
    expect(depot.echangerLienContreSession('lien-1', seconde, MAINTENANT)).toBe(false)
    expect(depot.trouverSession('session-2')).toBeNull()
    depot.fermer()
  })

  it('refuse d’échanger un lien expiré ou inconnu', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('lien-1', MAINTENANT, '/garagiste'))
    const session = nouvelleSession('session-1', plus(15 * MINUTE))
    expect(depot.echangerLienContreSession('lien-1', session, plus(15 * MINUTE))).toBe(false)
    expect(depot.echangerLienContreSession('inconnu', session, MAINTENANT)).toBe(false)
    expect(depot.trouverSession('session-1')).toBeNull()
    depot.fermer()
  })

  it('prolonge, supprime et purge', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('ancien', MAINTENANT, '/garagiste'))
    depot.enregistrerLien(nouveauLien('recent', plus(JOUR), '/garagiste'))
    depot.echangerLienContreSession('recent', nouvelleSession('vive', plus(JOUR)), plus(JOUR))
    depot.enregistrerLien(nouveauLien('pour-perimee', MAINTENANT, '/garagiste'))
    depot.echangerLienContreSession(
      'pour-perimee',
      nouvelleSession('perimee', MAINTENANT),
      MAINTENANT,
    )
    depot.prolongerSession('vive', plus(200 * JOUR))
    expect(depot.trouverSession('vive')?.expireLe).toEqual(plus(200 * JOUR))

    depot.purger(plus(91 * JOUR))
    expect(depot.trouverSession('perimee')).toBeNull()
    expect(depot.trouverSession('vive')).not.toBeNull()
    expect(depot.trouverLien('ancien')).toBeNull()

    depot.supprimerSession('vive')
    expect(depot.trouverSession('vive')).toBeNull()
    depot.fermer()
  })

  it('garde un lien expiré un jour, pour dire « expiré » plutôt qu’« inconnu »', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('lien-1', MAINTENANT, '/garagiste'))
    depot.purger(plus(15 * MINUTE + JOUR - 1))
    expect(depot.trouverLien('lien-1')).not.toBeNull()
    depot.purger(plus(15 * MINUTE + JOUR))
    expect(depot.trouverLien('lien-1')).toBeNull()
    depot.fermer()
  })

  it('révoque toutes les sessions et les seuls liens non utilisés', () => {
    const depot = creerDepotAccesSqlite(BASE_EN_MEMOIRE)
    depot.enregistrerLien(nouveauLien('servi', MAINTENANT, '/garagiste'))
    depot.echangerLienContreSession('servi', nouvelleSession('s1', MAINTENANT), MAINTENANT)
    depot.enregistrerLien(nouveauLien('en-attente', MAINTENANT, '/garagiste'))
    expect(depot.toutRevoquer()).toEqual({ sessions: 1, liens: 1 })
    expect(depot.trouverSession('s1')).toBeNull()
    expect(depot.trouverLien('en-attente')).toBeNull()
    expect(depot.trouverLien('servi')).not.toBeNull()
    depot.fermer()
  })

  it('tire un secret une seule fois, puis le rend tel quel, même après réouverture', async () => {
    dossier = await mkdtemp(join(tmpdir(), 'bf-auto-acces-'))
    const fichier = join(dossier, 'base.sqlite')
    let tirages = 0
    const tirer = (): Buffer => {
      tirages += 1
      return Buffer.from(`secret-${tirages}`)
    }
    const premier = creerDepotAccesSqlite(fichier)
    expect(premier.secret('formulaires', tirer).toString()).toBe('secret-1')
    expect(premier.secret('formulaires', tirer).toString()).toBe('secret-1')
    expect(premier.secret('autre', tirer).toString()).toBe('secret-3')
    premier.fermer()
    const second = creerDepotAccesSqlite(fichier)
    expect(second.secret('formulaires', tirer).toString()).toBe('secret-1')
    second.fermer()
  })

  it('persiste sur disque, survit à la réouverture, et partage le fichier sans toucher aux autres tables', async () => {
    dossier = await mkdtemp(join(tmpdir(), 'bf-auto-acces-'))
    const fichier = join(dossier, 'sous-dossier', 'base.sqlite')

    const premier = creerDepotAccesSqlite(fichier)
    premier.enregistrerLien(nouveauLien('lien-1', MAINTENANT, '/garagiste'))
    premier.echangerLienContreSession('lien-1', nouvelleSession('s1', MAINTENANT), MAINTENANT)
    premier.fermer()
    // Un autre contexte (les demandes) tient ses propres tables dans le même fichier.
    const demandes = new Database(fichier)
    demandes.exec('CREATE TABLE demandes (id INTEGER PRIMARY KEY)')
    demandes.close()

    const second = creerDepotAccesSqlite(fichier)
    expect(second.trouverSession('s1')?.expireLe).toEqual(plus(90 * JOUR))
    second.fermer()
    const lecture = new Database(fichier, { readonly: true })
    const tables = lecture
      .prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all()
      .map((ligne) => ligne.name)
    lecture.close()
    expect(tables).toEqual(['acces_liens', 'acces_secrets', 'acces_sessions', 'demandes'])
    expect((await readFile(fichier)).length).toBeGreaterThan(0)
  })
})
