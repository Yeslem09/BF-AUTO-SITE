import { describe, expect, it } from 'vitest'
import { numeroRappelAffiche, type NumeroRappel } from './numero-rappel.js'

const TELEPHONE = { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' }

describe('numéro depuis lequel le garage rappelle (D8, arbitrage 3)', () => {
  const aValider: NumeroRappel = { telephone: TELEPHONE, statut: 'a_valider' }

  it('validé, il s’affiche en tout mode', () => {
    expect(numeroRappelAffiche({ telephone: TELEPHONE, statut: 'valide' }, 'production')).toEqual({
      telephone: TELEPHONE,
      surligne: false,
    })
  })

  it('à valider, il est tu en production', () => {
    expect(numeroRappelAffiche(aValider, 'production')).toBeNull()
  })

  it('à valider, il est surligné en relecture et affiché normalement en démonstration', () => {
    expect(numeroRappelAffiche(aValider, 'relecture')).toEqual({
      telephone: TELEPHONE,
      surligne: true,
    })
    expect(numeroRappelAffiche(aValider, 'demonstration')).toEqual({
      telephone: TELEPHONE,
      surligne: false,
    })
  })

  it('sans proposition, rien ne s’affiche, même en démonstration', () => {
    expect(
      numeroRappelAffiche({ telephone: null, statut: 'a_valider' }, 'demonstration'),
    ).toBeNull()
  })
})
