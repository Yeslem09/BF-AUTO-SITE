import { describe, expect, it } from 'vitest'
import {
  ajouterJours,
  comparerDates,
  dateIso,
  ecartEnJours,
  estDateIsoValide,
  instantLocal,
  jourDeLaSemaine,
  lireDateIso,
} from './temps-local.js'

describe('temps local du garage', () => {
  it('convertit un instant en heure murale de Paris, hiver comme été', () => {
    expect(instantLocal(new Date('2026-01-05T08:00:00Z'))).toEqual({
      date: { annee: 2026, mois: 1, jour: 5 },
      minutes: 540,
    })
    expect(instantLocal(new Date('2026-07-01T08:00:00Z')).minutes).toBe(600)
  })

  it('bascule de date à minuit heure de Paris, pas à minuit UTC', () => {
    expect(instantLocal(new Date('2025-12-31T23:30:00Z')).date).toEqual({
      annee: 2026,
      mois: 1,
      jour: 1,
    })
  })

  it('ajoute des jours à travers les fins de mois et d’année', () => {
    expect(ajouterJours({ annee: 2026, mois: 12, jour: 31 }, 1)).toEqual({
      annee: 2027,
      mois: 1,
      jour: 1,
    })
    expect(ajouterJours({ annee: 2028, mois: 2, jour: 28 }, 1)).toEqual({
      annee: 2028,
      mois: 2,
      jour: 29,
    })
  })

  it('donne le jour de la semaine d’une date', () => {
    expect(jourDeLaSemaine({ annee: 2026, mois: 1, jour: 5 })).toBe('lundi')
    expect(jourDeLaSemaine({ annee: 2026, mois: 3, jour: 29 })).toBe('dimanche')
  })

  it('écrit et valide les dates AAAA-MM-JJ', () => {
    expect(dateIso({ annee: 2026, mois: 8, jour: 1 })).toBe('2026-08-01')
    expect(estDateIsoValide('2028-02-29')).toBe(true)
    expect(estDateIsoValide('2026-02-29')).toBe(false)
    expect(estDateIsoValide('2026-13-01')).toBe(false)
    expect(estDateIsoValide('2026-1-01')).toBe(false)
  })
})

describe('comparaison de dates', () => {
  it('lit une date AAAA-MM-JJ qui existe', () => {
    expect(lireDateIso('2026-10-08')).toEqual({ annee: 2026, mois: 10, jour: 8 })
    expect(lireDateIso('2026-02-29')).toBeNull()
  })

  it('compare deux dates et compte les jours qui les séparent', () => {
    const a = { annee: 2026, mois: 9, jour: 29 }
    const b = { annee: 2026, mois: 10, jour: 8 }
    expect(comparerDates(a, b)).toBeLessThan(0)
    expect(comparerDates(b, a)).toBeGreaterThan(0)
    expect(comparerDates(a, { ...a })).toBe(0)
    expect(ecartEnJours(a, b)).toBe(9)
    expect(ecartEnJours(b, a)).toBe(-9)
  })

  it('compte les jours à travers un changement d’heure', () => {
    expect(
      ecartEnJours({ annee: 2026, mois: 3, jour: 28 }, { annee: 2026, mois: 3, jour: 30 }),
    ).toBe(2)
    expect(
      ecartEnJours({ annee: 2026, mois: 10, jour: 24 }, { annee: 2026, mois: 10, jour: 26 }),
    ).toBe(2)
  })
})
