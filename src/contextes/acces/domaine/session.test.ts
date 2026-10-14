import { describe, expect, it } from 'vitest'
import { DUREE_SESSION_MS } from './regles.js'
import { nouvelleSession, prolongationDue, sessionValide } from './session.js'

const JOUR = 24 * 60 * 60 * 1000
const OUVERTURE = new Date('2026-09-23T08:00:00Z')
const apres = (jours: number, millisecondes = 0): Date =>
  new Date(OUVERTURE.getTime() + jours * JOUR + millisecondes)

describe('session du garagiste', () => {
  it('dure 90 jours à partir de son ouverture', () => {
    const session = nouvelleSession('empreinte', OUVERTURE)
    expect(session.expireLe.getTime() - OUVERTURE.getTime()).toBe(90 * JOUR)
    expect(DUREE_SESSION_MS).toBe(90 * JOUR)
  })

  it('est valide jusqu’à la dernière milliseconde, plus à l’échéance', () => {
    const session = nouvelleSession('empreinte', OUVERTURE)
    expect(sessionValide(session, apres(90, -1))).toBe(true)
    expect(sessionValide(session, apres(90))).toBe(false)
  })

  it('glisse : utilisée au 60e jour, elle court 90 jours à partir de là', () => {
    const session = nouvelleSession('empreinte', OUVERTURE)
    expect(prolongationDue(session, apres(60))?.toISOString()).toBe(apres(150).toISOString())
  })

  it('n’est pas réécrite plus d’une fois par jour', () => {
    const session = nouvelleSession('empreinte', OUVERTURE)
    expect(prolongationDue(session, apres(0, 23 * 60 * 60 * 1000))).toBeNull()
    expect(prolongationDue(session, apres(1))?.toISOString()).toBe(apres(91).toISOString())
  })
})
