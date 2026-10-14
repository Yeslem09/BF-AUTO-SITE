import { describe, expect, it } from 'vitest'
import { TYPES_DEMANDE } from '../../../contrats/index.js'
import { MAXIMUM_CHAMPS_OBLIGATOIRES, champsObligatoires } from './champs.js'

const VARIANTES = [
  { familleCitee: false, preDiagnostic: false },
  { familleCitee: true, preDiagnostic: false },
  { familleCitee: false, preDiagnostic: true },
]

describe('champs obligatoires (P-07)', () => {
  it.each(TYPES_DEMANDE.flatMap((type) => VARIANTES.map((variante) => [type, variante] as const)))(
    '%s %o : cinq champs obligatoires au plus, moment de rappel compris',
    (type, variante) => {
      const champs = champsObligatoires(type, variante)
      expect(champs.length).toBeLessThanOrEqual(MAXIMUM_CHAMPS_OBLIGATOIRES)
      expect(champs).toContain('moment')
      expect(champs.slice(-3)).toEqual(['prenom', 'telephone', 'moment'])
    },
  )

  it('un rappel après pré-diagnostic ne demande que prénom, téléphone et moment (US-22)', () => {
    expect(champsObligatoires('rappel', { familleCitee: false, preDiagnostic: true })).toEqual([
      'prenom',
      'telephone',
      'moment',
    ])
  })

  it('le rappel simple demande un motif en liste (D4)', () => {
    expect(champsObligatoires('rappel', { familleCitee: false, preDiagnostic: false })).toEqual([
      'motif',
      'prenom',
      'telephone',
      'moment',
    ])
  })

  it('une famille citée remplace l’intervention à choisir', () => {
    expect(champsObligatoires('devis', { familleCitee: true, preDiagnostic: false })).toEqual([
      'vehicule',
      'prenom',
      'telephone',
      'moment',
    ])
    expect(
      champsObligatoires('rendez-vous', { familleCitee: false, preDiagnostic: false }),
    ).toEqual(['objet', 'creneaux', 'prenom', 'telephone', 'moment'])
  })
})
