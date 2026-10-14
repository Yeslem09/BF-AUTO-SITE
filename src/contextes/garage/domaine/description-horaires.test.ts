import { describe, expect, it } from 'vitest'
import { calendrier, date, fermeture, JOURNEE_ESSAI } from '../essais/calendrier-essai.js'
import { decrireLigne, decrirePlages, decrireSemaineGlissante } from './description-horaires.js'

describe('horaires jour par jour (Kano B-03, US-40)', () => {
  it('décrit les plages d’une journée, ou « Fermé »', () => {
    expect(decrirePlages(JOURNEE_ESSAI)).toBe('8 h 30 à 12 h, 14 h à 19 h')
    expect(decrirePlages([])).toBe('Fermé')
  })

  it('un jeudi : sept jours, jeudi en tête et marqué aujourd’hui', () => {
    const lignes = decrireSemaineGlissante(calendrier(), date('2026-09-24'))
    expect(lignes.map((ligne) => ligne.jour)).toEqual([
      'Jeudi',
      'Vendredi',
      'Samedi',
      'Dimanche',
      'Lundi',
      'Mardi',
      'Mercredi',
    ])
    expect(lignes.map((ligne) => ligne.aujourdhui)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ])
    expect(lignes[0]?.plages).toEqual(['8 h 30 à 12 h', '14 h à 19 h'])
    expect(lignes[3]).toMatchObject({ plages: [], fermeExceptionnellement: false })
  })

  it('une fermeture exceptionnelle de la semaine qui vient est dite comme telle', () => {
    const lignes = decrireSemaineGlissante(
      calendrier([fermeture('2026-09-26', '2026-09-28')]),
      date('2026-09-24'),
    )
    expect(lignes.map(decrireLigne)).toEqual([
      '8 h 30 à 12 h, 14 h à 19 h',
      '8 h 30 à 12 h, 14 h à 19 h',
      'Fermé exceptionnellement',
      'Fermé',
      'Fermé exceptionnellement',
      '8 h 30 à 12 h, 14 h à 19 h',
      '8 h 30 à 12 h, 14 h à 19 h',
    ])
  })
})
