import { describe, expect, it } from 'vitest'
import { estFormeDeJeton } from './jeton.js'
import { etatDuLien, limiteConservationLiens, nouveauLien } from './lien-connexion.js'
import { DUREE_LIEN_MS, MINUTE_MS } from './regles.js'

const MAINTENANT = new Date('2026-09-23T08:00:00Z')

describe('lien de connexion', () => {
  it('vaut 15 minutes à partir de sa création, sans avoir servi', () => {
    const lien = nouveauLien('empreinte', MAINTENANT, '/garagiste')
    expect(lien.expireLe.getTime() - lien.creeLe.getTime()).toBe(15 * MINUTE_MS)
    expect(lien.utiliseLe).toBeNull()
    expect(etatDuLien(lien, MAINTENANT)).toBe('valide')
  })

  it('est encore valide une milliseconde avant l’échéance, expiré à l’échéance', () => {
    const lien = nouveauLien('empreinte', MAINTENANT, '/garagiste')
    expect(etatDuLien(lien, new Date(MAINTENANT.getTime() + DUREE_LIEN_MS - 1))).toBe('valide')
    expect(etatDuLien(lien, new Date(MAINTENANT.getTime() + DUREE_LIEN_MS))).toBe('expire')
  })

  it('reste « déjà utilisé » une fois servi, même après son échéance', () => {
    const lien = { ...nouveauLien('empreinte', MAINTENANT, '/garagiste'), utiliseLe: MAINTENANT }
    expect(etatDuLien(lien, MAINTENANT)).toBe('deja-utilise')
    expect(etatDuLien(lien, new Date(MAINTENANT.getTime() + 2 * DUREE_LIEN_MS))).toBe(
      'deja-utilise',
    )
  })

  it('est « inconnu » quand la base ne le connaît pas', () => {
    expect(etatDuLien(null, MAINTENANT)).toBe('inconnu')
  })

  it('reste connu un jour après son échéance, pour dire la vraie cause', () => {
    expect(limiteConservationLiens(MAINTENANT).toISOString()).toBe('2026-09-22T08:00:00.000Z')
  })
})

describe('forme d’un jeton', () => {
  it('admet un jeton base64url de 22 à 128 caractères', () => {
    expect(estFormeDeJeton('a'.repeat(22))).toBe(true)
    expect(estFormeDeJeton('Ab0_-'.repeat(8) + 'xyz')).toBe(true)
    expect(estFormeDeJeton('a'.repeat(128))).toBe(true)
  })

  it('écarte ce qui n’est pas un jeton avant toute recherche', () => {
    for (const valeur of [
      undefined,
      null,
      42,
      ['a'.repeat(30)],
      '',
      'a'.repeat(21),
      'a'.repeat(129),
      `${'a'.repeat(30)}=`,
      `${'a'.repeat(30)} `,
      `${'a'.repeat(30)}/`,
    ]) {
      expect(estFormeDeJeton(valeur), String(valeur)).toBe(false)
    }
  })
})
