import { describe, expect, it } from 'vitest'
import { creerRegistreDemandesMemoire } from './registre-demandes-memoire.js'

const instant = (minute: number): Date => new Date(Date.UTC(2026, 8, 23, 8, minute))

describe('registre des demandes de lien en mémoire', () => {
  it('sépare les adresses et oublie ce qui précède la fenêtre', () => {
    const registre = creerRegistreDemandesMemoire()
    registre.noterAcceptation('203.0.113.7', instant(0))
    registre.noterAcceptation('203.0.113.7', instant(10))
    registre.noterAcceptation('198.51.100.2', instant(5))
    expect(registre.accepteesDepuis('203.0.113.7', instant(0))).toEqual([instant(10)])
    expect(registre.accepteesDepuis('198.51.100.2', instant(0))).toEqual([instant(5)])
    expect(registre.accepteesDepuis('198.51.100.2', instant(6))).toEqual([])
    expect(registre.accepteesDepuis('inconnue', instant(0))).toEqual([])
  })

  it('compte les réceptions et retient la dernière alerte', () => {
    const registre = creerRegistreDemandesMemoire()
    registre.noterReception(instant(1))
    registre.noterReception(instant(2))
    expect(registre.recuesDepuis(instant(1))).toEqual([instant(2)])
    expect(registre.derniereAlerte()).toBeNull()
    registre.noterAlerte(instant(3))
    expect(registre.derniereAlerte()).toEqual(instant(3))
  })
})
