import { describe, expect, it } from 'vitest'
import { publier, valeurPubliee, type ValeurPubliee } from './valeur-publiee.js'

const VALIDEE: ValeurPubliee<string> = {
  statut: 'valide',
  valeur: '9 h',
  source: 'garagiste, séance 1',
  note: null,
}
const PROPOSITION: ValeurPubliee<string> = {
  statut: 'a_valider',
  valeur: '8 h 30',
  source: 'proposition',
  note: 'à confirmer en séance 1',
}
const INCONNUE: ValeurPubliee<string> = {
  statut: 'a_valider',
  valeur: null,
  source: null,
  note: 'prénom à obtenir',
}

describe('politique de publication (Kano D8)', () => {
  it('une valeur validée s’affiche dans les trois modes, sans surlignage', () => {
    for (const mode of ['production', 'relecture', 'demonstration'] as const) {
      expect(publier(VALIDEE, mode)).toEqual({ visible: true, valeur: '9 h', aSurligner: false })
    }
  })

  it('production : une proposition n’est jamais rendue, et sa note ne voyage pas', () => {
    expect(publier(PROPOSITION, 'production')).toEqual({ visible: false, noteDeRelecture: null })
    expect(publier(INCONNUE, 'production')).toEqual({ visible: false, noteDeRelecture: null })
  })

  it('démonstration : la proposition s’affiche normalement, le manque reste invisible', () => {
    expect(publier(PROPOSITION, 'demonstration')).toEqual({
      visible: true,
      valeur: '8 h 30',
      aSurligner: false,
    })
    expect(publier(INCONNUE, 'demonstration')).toEqual({ visible: false, noteDeRelecture: null })
  })

  it('relecture : la proposition est surlignée, le manque se signale avec sa note', () => {
    expect(publier(PROPOSITION, 'relecture')).toEqual({
      visible: true,
      valeur: '8 h 30',
      aSurligner: true,
    })
    expect(publier(INCONNUE, 'relecture')).toEqual({
      visible: false,
      noteDeRelecture: 'prénom à obtenir',
    })
  })

  it('valeurPubliee rend la valeur visible, ou null', () => {
    expect(valeurPubliee(publier(VALIDEE, 'production'))).toBe('9 h')
    expect(valeurPubliee(publier(PROPOSITION, 'production'))).toBeNull()
  })
})
