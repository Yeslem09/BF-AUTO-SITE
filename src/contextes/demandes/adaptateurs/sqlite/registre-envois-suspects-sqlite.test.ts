import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BASE_EN_MEMOIRE, ouvrirBaseDemandes, type Base } from './base.js'
import { lireOuCreerCleJetons } from './cle-sqlite.js'
import { creerRegistreEnvoisSuspectsSqlite } from './registre-envois-suspects-sqlite.js'

let base: Base
const LUNDI = new Date('2026-09-14T08:00:00.000Z')

beforeEach(() => {
  base = ouvrirBaseDemandes(BASE_EN_MEMOIRE)
})
afterEach(() => base.close())

describe('registre des envois suspects (D9, US-15)', () => {
  it('compte les envois non confirmés depuis une date', async () => {
    const registre = creerRegistreEnvoisSuspectsSqlite(base)
    await registre.noter('a', LUNDI, null)
    await registre.noter('b', LUNDI, null)
    await registre.confirmer('b', LUNDI)
    await registre.noter('ancien', new Date('2026-09-10T08:00:00.000Z'), null)
    expect(await registre.compterNonConfirmesDepuis(LUNDI)).toBe(1)
  })

  it('une confirmation elle-même suspecte remplace son jeton : le même envoi compte une fois', async () => {
    const registre = creerRegistreEnvoisSuspectsSqlite(base)
    await registre.noter('premier', LUNDI, null)
    await registre.noter('second', new Date(LUNDI.getTime() + 5_000), 'premier')
    expect(await registre.compterNonConfirmesDepuis(LUNDI)).toBe(1)
    await registre.confirmer('second', LUNDI)
    expect(await registre.compterNonConfirmesDepuis(LUNDI)).toBe(0)
  })

  it('purge les envois antérieurs à la limite', async () => {
    const registre = creerRegistreEnvoisSuspectsSqlite(base)
    await registre.noter('ancien', new Date('2026-08-01T00:00:00.000Z'), null)
    await registre.noter('recent', LUNDI, null)
    expect(await registre.purger(new Date('2026-09-01T00:00:00.000Z'))).toBe(1)
    expect(await registre.compterNonConfirmesDepuis(new Date(0))).toBe(1)
  })
})

describe('clé de signature des jetons', () => {
  it('est créée une fois puis relue à l’identique', () => {
    const premiere = lireOuCreerCleJetons(base)
    expect(premiere).toHaveLength(32)
    expect(lireOuCreerCleJetons(base).equals(premiere)).toBe(true)
  })
})
