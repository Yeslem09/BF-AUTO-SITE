import { describe, expect, it } from 'vitest'
import { echeanceDuRappel, libellePromesse, quandPromis, rangEcheance } from './promesse.js'

/** Mercredi 23 septembre après-midi fermé (imprévu), jeudi 24 complet, samedi matin seul. */
const PROPOSEES = [
  { code: '2026-09-23-matin', libelle: 'Mercredi 23 septembre, matin' },
  { code: '2026-09-24-matin', libelle: 'Jeudi 24 septembre, matin' },
  { code: '2026-09-24-apres-midi', libelle: 'Jeudi 24 septembre, après-midi' },
  { code: '2026-09-26-matin', libelle: 'Samedi 26 septembre, matin' },
]

/** Jeudi 24 septembre 2026, 1 h 45 à Paris (la nuit du jury). */
const NUIT_DE_JEUDI = new Date('2026-09-23T23:45:00.000Z')

describe('promesse de rappel retenue à l’envoi (AT-3 ; J4 et item 7)', () => {
  it('la première demi-journée proposée qui convient au client, comme l’annonce du garage', () => {
    expect(echeanceDuRappel(PROPOSEES, 'des-que-possible')).toEqual({
      date: '2026-09-23',
      demiJournee: 'matin',
    })
    expect(echeanceDuRappel(PROPOSEES, 'matin')).toEqual({
      date: '2026-09-23',
      demiJournee: 'matin',
    })
    // « À midi » se tient à la fin du matin ; « en fin de journée », l'après-midi.
    expect(echeanceDuRappel(PROPOSEES, 'midi')).toEqual({
      date: '2026-09-23',
      demiJournee: 'matin',
    })
    expect(echeanceDuRappel(PROPOSEES, 'fin-de-journee')).toEqual({
      date: '2026-09-24',
      demiJournee: 'apres-midi',
    })
  })

  it('aucune demi-journée qui convienne, ou aucune lisible : rien de daté', () => {
    expect(echeanceDuRappel([], 'matin')).toBeNull()
    expect(echeanceDuRappel(PROPOSEES.slice(0, 2), 'fin-de-journee')).toBeNull()
    expect(
      echeanceDuRappel(
        [
          { code: 'demain-matin', libelle: 'Demain' },
          { code: '2026-02-30-matin', libelle: 'Date impossible' },
        ],
        'des-que-possible',
      ),
    ).toBeNull()
  })

  it('le moment promis en toutes lettres, selon ce que le client a choisi', () => {
    expect(quandPromis('matin', 'matin')).toBe('le matin')
    expect(quandPromis('midi', 'matin')).toBe('à midi')
    expect(quandPromis('fin-de-journee', 'apres-midi')).toBe('en fin de journée')
    expect(quandPromis('des-que-possible', 'apres-midi')).toBe('l’après-midi')
  })

  it('lue le jour même : « ce matin », « aujourd’hui, en fin de journée » ; sinon le jour nommé, jamais « demain »', () => {
    const jeudi = { date: '2026-09-24', demiJournee: 'matin' } as const
    expect(libellePromesse(jeudi, 'matin', NUIT_DE_JEUDI)).toBe('ce matin')
    expect(libellePromesse(jeudi, 'midi', NUIT_DE_JEUDI)).toBe('aujourd’hui, à midi')
    expect(
      libellePromesse(
        { date: '2026-09-24', demiJournee: 'apres-midi' },
        'des-que-possible',
        NUIT_DE_JEUDI,
      ),
    ).toBe('cet après-midi')
    expect(
      libellePromesse(
        { date: '2026-09-24', demiJournee: 'apres-midi' },
        'fin-de-journee',
        NUIT_DE_JEUDI,
      ),
    ).toBe('aujourd’hui, en fin de journée')
    // Mercredi soir 23 h 30, la veille : le jour est nommé.
    expect(libellePromesse(jeudi, 'fin-de-journee', new Date('2026-09-23T21:30:00.000Z'))).toBe(
      'jeudi 24 septembre, en fin de journée',
    )
    expect(
      libellePromesse({ date: '2027-01-04', demiJournee: 'matin' }, 'matin', NUIT_DE_JEUDI),
    ).toBe('lundi 4 janvier 2027, le matin')
  })

  it('les échéances se rangent par date, le matin avant l’après-midi', () => {
    const rangs = [
      { date: '2026-09-25', demiJournee: 'matin' },
      { date: '2026-09-24', demiJournee: 'apres-midi' },
      { date: '2026-09-24', demiJournee: 'matin' },
    ] as const
    expect([...rangs].sort((a, b) => rangEcheance(a).localeCompare(rangEcheance(b)))).toEqual([
      rangs[2],
      rangs[1],
      rangs[0],
    ])
  })
})
