import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { date, fermeture } from '../../essais/calendrier-essai.js'
import { creerDepotFermeturesSqlite } from './depot-fermetures-sqlite.js'

const DECLAREE_LE = new Date('2026-09-23T08:00:00Z')

let dossier = ''
beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'bf-auto-fermetures-'))
})
afterEach(async () => rm(dossier, { recursive: true, force: true }))

describe('dépôt SQLite des fermetures (moteur réel)', () => {
  it('conserve les fermetures après une réouverture de la base (redémarrage du service)', async () => {
    const chemin = join(dossier, 'sous-dossier', 'base.sqlite')
    const premier = creerDepotFermeturesSqlite(chemin)
    const ajoutee = await premier.ajouter(fermeture('2026-09-28', '2026-10-07'), DECLAREE_LE)
    premier.fermer()
    const second = creerDepotFermeturesSqlite(chemin)
    expect(await second.listerDepuis(date('2026-09-23'))).toEqual([ajoutee])
    second.fermer()
  })

  it('ne rend que les fermetures non terminées, dans l’ordre de leur début', async () => {
    const depot = creerDepotFermeturesSqlite(join(dossier, 'base.sqlite'))
    await depot.ajouter(fermeture('2026-10-10', '2026-10-12'), DECLAREE_LE)
    await depot.ajouter(fermeture('2026-09-01', '2026-09-10'), DECLAREE_LE)
    await depot.ajouter(fermeture('2026-09-23', '2026-09-23', 'imprevu'), DECLAREE_LE)
    const lues = await depot.listerDepuis(date('2026-09-23'))
    expect(lues.map((lue) => [lue.du, lue.au, lue.motif])).toEqual([
      [date('2026-09-23'), date('2026-09-23'), 'imprevu'],
      [date('2026-10-10'), date('2026-10-12'), 'conges'],
    ])
    expect(lues.every((lue) => Number.isInteger(lue.identifiant))).toBe(true)
    depot.fermer()
  })

  it('supprime par identifiant, et dit quand il n’y a rien à supprimer', async () => {
    const depot = creerDepotFermeturesSqlite(join(dossier, 'base.sqlite'))
    const ajoutee = await depot.ajouter(fermeture('2026-10-10', '2026-10-12'), DECLAREE_LE)
    expect(await depot.supprimer(ajoutee.identifiant)).toBe(true)
    expect(await depot.supprimer(ajoutee.identifiant)).toBe(false)
    depot.fermer()
  })

  it('écarte une ligne illisible sans emporter les autres, et la signale', async () => {
    const chemin = join(dossier, 'base.sqlite')
    const signalees: unknown[] = []
    const depot = creerDepotFermeturesSqlite(chemin, {
      signalerLigneIllisible: (ligne) => signalees.push(ligne),
    })
    await depot.ajouter(fermeture('2026-10-10', '2026-10-12'), DECLAREE_LE)
    const brute = new Database(chemin)
    brute
      .prepare('INSERT INTO garage_fermetures (du, au, motif, declaree_le) VALUES (?, ?, ?, ?)')
      .run('2026-10-01', '2026-10-02', 'grève', DECLAREE_LE.toISOString())
    brute.close()
    const lues = await depot.listerDepuis(date('2026-09-23'))
    expect(lues).toHaveLength(1)
    expect(signalees).toHaveLength(1)
    depot.fermer()
  })

  it('écarte aussi une date qui n’existe pas au calendrier (30 février), sans lever d’erreur', async () => {
    const chemin = join(dossier, 'base.sqlite')
    const signalees: unknown[] = []
    const depot = creerDepotFermeturesSqlite(chemin, {
      signalerLigneIllisible: (ligne) => signalees.push(ligne),
    })
    const brute = new Database(chemin)
    brute
      .prepare('INSERT INTO garage_fermetures (du, au, motif, declaree_le) VALUES (?, ?, ?, ?)')
      .run('2027-02-30', '2027-03-02', 'conges', DECLAREE_LE.toISOString())
    brute.close()
    await expect(depot.listerDepuis(date('2026-09-23'))).resolves.toEqual([])
    expect(signalees).toHaveLength(1)
    depot.fermer()
  })

  it('refuse au niveau de la base une période à l’envers', () => {
    const chemin = join(dossier, 'base.sqlite')
    creerDepotFermeturesSqlite(chemin).fermer()
    const brute = new Database(chemin)
    expect(() =>
      brute
        .prepare('INSERT INTO garage_fermetures (du, au, motif, declaree_le) VALUES (?, ?, ?, ?)')
        .run('2026-10-02', '2026-10-01', 'conges', DECLAREE_LE.toISOString()),
    ).toThrow(/CHECK/)
    brute.close()
  })

  it('se ferme deux fois sans erreur (fermeture du serveur puis des essais)', () => {
    const depot = creerDepotFermeturesSqlite(join(dossier, 'base.sqlite'))
    depot.fermer()
    expect(() => depot.fermer()).not.toThrow()
  })
})
