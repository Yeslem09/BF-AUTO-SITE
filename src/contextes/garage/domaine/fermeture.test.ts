import { describe, expect, it } from 'vitest'
import {
  chevauchent,
  couvre,
  DUREE_MAX_JOURS,
  fermetureCouvrant,
  dateSaisissable,
  lireDateSaisie,
  lirePeriode,
  periodeEnLettres,
  type PeriodeFermeture,
} from './fermeture.js'

const AUJOURDHUI = { annee: 2026, mois: 9, jour: 23 }
const periode = (du: string, au: string): PeriodeFermeture => {
  const lue = lirePeriode({ du, au, motif: 'conges' }, { annee: 2026, mois: 1, jour: 1 })
  if (!lue.valide) throw new Error(`période d’essai invalide : ${JSON.stringify(lue.erreurs)}`)
  return lue.periode
}

describe('saisie d’une période de fermeture', () => {
  it('accepte du, au et motif, au format du champ date', () => {
    expect(
      lirePeriode({ du: '2026-09-28', au: '2026-10-07', motif: 'conges' }, AUJOURDHUI),
    ).toEqual({
      valide: true,
      periode: {
        du: { annee: 2026, mois: 9, jour: 28 },
        au: { annee: 2026, mois: 10, jour: 7 },
        motif: 'conges',
      },
    })
  })

  it('accepte une journée unique, aujourd’hui compris', () => {
    const lue = lirePeriode({ du: '2026-09-23', au: '2026-09-23', motif: 'imprevu' }, AUJOURDHUI)
    expect(lue.valide).toBe(true)
  })

  it('accepte une date écrite JJ/MM/AAAA (navigateur sans champ date)', () => {
    expect(lireDateSaisie(' 8/10/2026 ')).toEqual({ annee: 2026, mois: 10, jour: 8 })
    expect(lireDateSaisie('31/02/2026')).toBeNull()
  })

  it('lit la date à la française sans barre oblique, et l’affiche jj/mm/aaaa (J4, passe 2)', () => {
    for (const saisie of ['24.09.2026', '24-09-2026', '24 09 2026', '24092026']) {
      expect(lireDateSaisie(saisie)).toEqual({ annee: 2026, mois: 9, jour: 24 })
    }
    expect(lireDateSaisie('2409202')).toBeNull()
    expect(dateSaisissable({ annee: 2026, mois: 9, jour: 4 })).toBe('04/09/2026')
  })

  it('rattache chaque erreur à son champ, toutes d’un coup', () => {
    expect(lirePeriode({ du: '', au: '2026-02-30', motif: 'vacances' }, AUJOURDHUI)).toEqual({
      valide: false,
      erreurs: {
        du: 'Indiquez le premier jour de fermeture.',
        au: 'Date non reconnue : écrivez-la sous la forme jj/mm/aaaa, par exemple 24/09/2026.',
        motif: 'Choisissez le motif dans la liste.',
      },
    })
  })

  it('refuse une fin avant le début', () => {
    const lue = lirePeriode({ du: '2026-10-07', au: '2026-09-28', motif: 'conges' }, AUJOURDHUI)
    expect(lue).toEqual({
      valide: false,
      erreurs: { au: 'Le dernier jour doit être le premier jour ou le suivre.' },
    })
  })

  it('refuse une période déjà passée', () => {
    const lue = lirePeriode({ du: '2026-09-01', au: '2026-09-22', motif: 'conges' }, AUJOURDHUI)
    expect(lue).toEqual({ valide: false, erreurs: { au: 'Cette période est déjà passée.' } })
  })

  it(`refuse une fermeture de plus de ${DUREE_MAX_JOURS} jours (faute de frappe probable)`, () => {
    const lue = lirePeriode({ du: '2026-10-01', au: '2027-10-01', motif: 'conges' }, AUJOURDHUI)
    expect(lue.valide).toBe(false)
    if (!lue.valide) expect(lue.erreurs.au).toMatch(/92 jours au plus/)
    const limite = lirePeriode({ du: '2026-10-01', au: '2026-12-31', motif: 'conges' }, AUJOURDHUI)
    expect(limite.valide).toBe(true)
  })

  it('refuse une fermeture qui commence dans plus d’un an', () => {
    const lue = lirePeriode({ du: '2028-01-01', au: '2028-01-02', motif: 'conges' }, AUJOURDHUI)
    expect(lue).toEqual({
      valide: false,
      erreurs: { du: 'Déclarez une fermeture qui commence dans les douze prochains mois.' },
    })
  })
})

describe('périodes de fermeture', () => {
  const conges = periode('2026-09-28', '2026-10-07')

  it('couvre ses deux bornes, et rien au-delà', () => {
    expect(couvre(conges, { annee: 2026, mois: 9, jour: 28 })).toBe(true)
    expect(couvre(conges, { annee: 2026, mois: 10, jour: 7 })).toBe(true)
    expect(couvre(conges, { annee: 2026, mois: 9, jour: 27 })).toBe(false)
    expect(couvre(conges, { annee: 2026, mois: 10, jour: 8 })).toBe(false)
  })

  it('détecte un chevauchement, même d’un seul jour', () => {
    expect(chevauchent(conges, periode('2026-10-07', '2026-10-09'))).toBe(true)
    expect(chevauchent(conges, periode('2026-09-20', '2026-09-28'))).toBe(true)
    expect(chevauchent(conges, periode('2026-10-08', '2026-10-09'))).toBe(false)
  })

  it('trouve la fermeture qui couvre une date', () => {
    expect(fermetureCouvrant([conges], { annee: 2026, mois: 10, jour: 1 })).toBe(conges)
    expect(fermetureCouvrant([conges], { annee: 2026, mois: 10, jour: 8 })).toBeNull()
  })

  it('se dit en toutes lettres, un jour ou une période', () => {
    expect(periodeEnLettres(conges)).toBe('du lundi 28 septembre au mercredi 7 octobre')
    expect(periodeEnLettres(periode('2026-09-24', '2026-09-24'), true)).toBe(
      'le jeudi 24 septembre 2026',
    )
  })
})
