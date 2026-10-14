import { describe, expect, it } from 'vitest'
import { calendrier, date, fermeture, JOURNEE_ESSAI } from '../essais/calendrier-essai.js'
import { estConnu, estFermeExceptionnellement, plagesDuJour } from './calendrier.js'

describe('calendrier d’ouverture', () => {
  const conges = calendrier([fermeture('2026-09-26', '2026-09-28')])

  it('un jour ordinaire garde ses plages habituelles', () => {
    expect(plagesDuJour(conges, date('2026-09-25'))).toBe(JOURNEE_ESSAI)
  })

  it('un jour de fermeture exceptionnelle n’a aucune plage', () => {
    expect(plagesDuJour(conges, date('2026-09-26'))).toEqual([])
  })

  it('le dimanche habituellement fermé, pris dans des congés, n’est pas une fermeture exceptionnelle', () => {
    expect(estFermeExceptionnellement(conges, date('2026-09-27'))).toBe(false)
    expect(estFermeExceptionnellement(conges, date('2026-09-28'))).toBe(true)
    expect(estFermeExceptionnellement(conges, date('2026-09-29'))).toBe(false)
  })

  it('un calendrier sans semaine publiable n’est pas connu', () => {
    expect(estConnu({ semaine: null, fermetures: [] })).toBe(false)
    expect(estConnu(conges)).toBe(true)
  })
})
