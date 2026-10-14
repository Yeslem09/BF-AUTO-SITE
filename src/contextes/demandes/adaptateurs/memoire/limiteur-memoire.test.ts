import { describe, expect, it } from 'vitest'
import { ENVOIS_MAXIMUM_PAR_FENETRE, FENETRE_LIMITATION_MS } from '../../domaine/anti-abus.js'
import { creerLimiteurMemoire } from './limiteur-memoire.js'

const DEBUT = new Date('2026-09-16T08:00:00.000Z')

describe('limiteur en mémoire (US-47)', () => {
  it('compte par adresse, sur une heure glissante', () => {
    const limiteur = creerLimiteurMemoire()
    for (let rang = 0; rang < ENVOIS_MAXIMUM_PAR_FENETRE; rang += 1) {
      expect(limiteur.estAtteinte('203.0.113.7', DEBUT)).toBe(false)
      limiteur.compter('203.0.113.7', DEBUT)
    }
    expect(limiteur.estAtteinte('203.0.113.7', DEBUT)).toBe(true)
    expect(limiteur.estAtteinte('198.51.100.4', DEBUT)).toBe(false)
    expect(
      limiteur.estAtteinte('203.0.113.7', new Date(DEBUT.getTime() + FENETRE_LIMITATION_MS + 1)),
    ).toBe(false)
  })

  it('oublie les adresses sans envoi récent', () => {
    const limiteur = creerLimiteurMemoire()
    for (let rang = 0; rang < 1_200; rang += 1) limiteur.compter(`10.0.${rang}`, DEBUT)
    const plusTard = new Date(DEBUT.getTime() + 2 * FENETRE_LIMITATION_MS)
    limiteur.compter('203.0.113.7', plusTard)
    expect(limiteur.estAtteinte('10.0.1', plusTard)).toBe(false)
  })
})
