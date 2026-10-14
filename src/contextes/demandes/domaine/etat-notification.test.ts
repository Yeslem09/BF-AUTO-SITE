import { describe, expect, it } from 'vitest'
import { estEchecDurable, prochainEssai } from './etat-notification.js'
import { HEURE_MS, MINUTE_MS } from './temps.js'

const ECHEC = new Date('2026-09-16T08:00:00.000Z')
const plus = (millisecondes: number) => new Date(ECHEC.getTime() + millisecondes)

describe('file de renvoi des notifications (D5, US-16)', () => {
  it('essaie de nouveau à 1 minute, 10 minutes et 1 heure après le premier échec', () => {
    expect(prochainEssai(ECHEC, 1, ECHEC)).toEqual(plus(MINUTE_MS))
    expect(prochainEssai(ECHEC, 2, plus(MINUTE_MS))).toEqual(plus(10 * MINUTE_MS))
    expect(prochainEssai(ECHEC, 3, plus(10 * MINUTE_MS))).toEqual(plus(HEURE_MS))
  })

  it('puis toutes les heures, sans jamais abandonner la demande', () => {
    expect(prochainEssai(ECHEC, 4, plus(HEURE_MS))).toEqual(plus(2 * HEURE_MS))
    expect(prochainEssai(ECHEC, 5, plus(2 * HEURE_MS))).toEqual(plus(3 * HEURE_MS))
  })

  it('après un long arrêt, les essais en retard ne partent pas en rafale', () => {
    const reprise = plus(5 * HEURE_MS)
    expect(prochainEssai(ECHEC, 2, reprise)).toEqual(new Date(reprise.getTime() + MINUTE_MS))
  })

  it('un échec qui dure plus d’une heure est durable (sonde de santé)', () => {
    const echec = {
      etat: 'en-echec' as const,
      premierEchecLe: ECHEC,
      essais: 3,
      prochainEssaiLe: plus(HEURE_MS),
      derniereErreur: 'refus',
    }
    expect(estEchecDurable(echec, plus(HEURE_MS))).toBe(false)
    expect(estEchecDurable(echec, plus(2 * HEURE_MS))).toBe(true)
    expect(estEchecDurable({ etat: 'envoyee', envoyeeLe: ECHEC }, plus(2 * HEURE_MS))).toBe(false)
  })
})
