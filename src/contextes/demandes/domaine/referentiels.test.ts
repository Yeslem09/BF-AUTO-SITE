import { describe, expect, it } from 'vitest'
import { MOMENTS_REPONSE } from '../../../contrats/index.js'
import { MOMENTS_RAPPEL } from './referentiels.js'

describe('moments où le client peut répondre (D4, AT-3)', () => {
  it('proposent exactement les moments du contrat, dans son ordre : le garage sait tous les annoncer', () => {
    expect(MOMENTS_RAPPEL.map((moment) => moment.code)).toEqual([...MOMENTS_REPONSE])
  })
})
