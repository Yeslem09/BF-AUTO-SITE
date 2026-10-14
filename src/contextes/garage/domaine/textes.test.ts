import { describe, expect, it } from 'vitest'
import { listerMoyensPaiement } from './textes.js'

describe('textes du garage', () => {
  it('liste les moyens de paiement en français', () => {
    expect(listerMoyensPaiement(['carte'])).toBe('carte bancaire')
    expect(listerMoyensPaiement(['carte', 'especes', 'cheque'])).toBe(
      'carte bancaire, espèces ou chèque',
    )
  })
})
