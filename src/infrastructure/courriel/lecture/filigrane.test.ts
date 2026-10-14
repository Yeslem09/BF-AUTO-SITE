import { describe, expect, it } from 'vitest'
import { avancerFiligrane, planifierReleve, uidsNouveaux } from './filigrane.js'

const DOSSIER = { validiteUid: '1700000000', prochainUid: 51 }

describe('filigrane de lecture (US-C08)', () => {
  it('au premier relevé, repart de la fin : l’historique n’est jamais lu', () => {
    expect(planifierReleve(null, DOSSIER)).toEqual({
      premierUid: 51,
      depart: { validiteUid: '1700000000', dernierUid: 50 },
      reinitialise: false,
      nouveautes: false,
    })
  })

  it('reprend après le dernier UID vu quand de nouveaux messages existent', () => {
    expect(planifierReleve({ validiteUid: '1700000000', dernierUid: 47 }, DOSSIER)).toEqual({
      premierUid: 48,
      depart: { validiteUid: '1700000000', dernierUid: 47 },
      reinitialise: false,
      nouveautes: true,
    })
    expect(planifierReleve({ validiteUid: '1700000000', dernierUid: 50 }, DOSSIER).nouveautes).toBe(
      false,
    )
  })

  it('UIDVALIDITY changé : repart de la fin et le signale', () => {
    expect(planifierReleve({ validiteUid: '1600000000', dernierUid: 900 }, DOSSIER)).toEqual({
      premierUid: 51,
      depart: { validiteUid: '1700000000', dernierUid: 50 },
      reinitialise: true,
      nouveautes: false,
    })
  })

  it('un dossier vide n’a pas de filigrane négatif', () => {
    expect(planifierReleve(null, { validiteUid: '1', prochainUid: 1 }).depart.dernierUid).toBe(0)
  })

  it('écarte l’UID que la plage « N:* » renvoie même s’il est avant N', () => {
    const filigrane = { validiteUid: '1700000000', dernierUid: 50 }
    expect(uidsNouveaux([50], filigrane)).toEqual([])
    expect(uidsNouveaux([53, 51, 50, 53], filigrane)).toEqual([51, 53])
  })

  it('avance jusqu’à la fin connue à l’ouverture et à tout ce qui a été vu', () => {
    const depart = { validiteUid: '1700000000', dernierUid: 47 }
    expect(avancerFiligrane(depart, DOSSIER, [])).toEqual({
      validiteUid: '1700000000',
      dernierUid: 50,
    })
    expect(avancerFiligrane(depart, DOSSIER, [52])).toEqual({
      validiteUid: '1700000000',
      dernierUid: 52,
    })
  })
})
