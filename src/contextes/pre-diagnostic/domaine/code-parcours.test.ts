import { describe, expect, it } from 'vitest'
import { coderEtat, lireCode } from './code-parcours.js'

describe('code d’un parcours', () => {
  it('met bout à bout le symptôme, les signes et les réponses', () => {
    expect(
      coderEtat({ symptome: 'bruit', signes: ['aucun'], reponses: ['freinage', 'sifflement'] }),
    ).toBe('bruit.aucun.freinage.sifflement')
    expect(coderEtat({ symptome: 'bruit', signes: ['fumee-brule', 'aucun'], reponses: [] })).toBe(
      'bruit.fumee-brule_aucun',
    )
  })

  it('se relit à l’identique', () => {
    const reponses = { symptome: 'voyant', signes: ['ne-sais-pas'], reponses: ['orange', 'abs'] }
    expect(lireCode(coderEtat(reponses))).toEqual(reponses)
  })

  it.each([
    [''],
    ['bruit'],
    ['bruit.'],
    ['Bruit.aucun'],
    ['bruit.aucun..sifflement'],
    ['bruit.aucun.<script>'],
    ['bruit.aucun.texte libre'],
    [`bruit.aucun.${'a'.repeat(300)}`],
  ])('refuse « %s », qui n’a pas la forme d’un code', (code) => {
    expect(lireCode(code)).toBeNull()
  })
})
