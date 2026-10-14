import { describe, expect, it } from 'vitest'
import { date, fermeture } from '../essais/calendrier-essai.js'
import { depotAvec, horlogeA } from '../essais/contexte-essai.js'
import { creerDeclarerFermeture } from './declarer-fermeture.js'
import { creerDeclarerImprevu } from './declarer-imprevu.js'
import { creerListerFermetures } from './lister-fermetures.js'
import { creerSupprimerFermeture } from './supprimer-fermeture.js'

/** Mercredi 23 septembre 2026, 23 h 30 à Paris (heure d'été). */
const HORLOGE = horlogeA('2026-09-23T21:30:00Z')

describe('déclarer une période de fermeture', () => {
  it('enregistre une période valide', async () => {
    const depot = await depotAvec()
    const resultat = await creerDeclarerFermeture(
      depot,
      HORLOGE,
    )({
      du: '2026-09-28',
      au: '2026-10-07',
      motif: 'conges',
    })
    expect(resultat).toMatchObject({ enregistree: true, fermeture: { motif: 'conges' } })
    expect(await depot.listerDepuis(date('2026-09-23'))).toHaveLength(1)
  })

  it('rend les erreurs de saisie sans rien enregistrer', async () => {
    const depot = await depotAvec()
    const resultat = await creerDeclarerFermeture(depot, HORLOGE)({ du: '', au: '', motif: '' })
    expect(resultat.enregistree).toBe(false)
    expect(await depot.listerDepuis(date('2026-09-23'))).toEqual([])
  })

  it('refuse une période qui chevauche une fermeture déjà déclarée, et la nomme', async () => {
    const depot = await depotAvec(fermeture('2026-10-01', '2026-10-03'))
    const resultat = await creerDeclarerFermeture(
      depot,
      HORLOGE,
    )({
      du: '2026-09-28',
      au: '2026-10-01',
      motif: 'conges',
    })
    expect(resultat).toEqual({
      enregistree: false,
      erreurs: {
        du: 'Cette période chevauche la fermeture déjà déclarée du jeudi 1er octobre au samedi 3 octobre : supprimez-la d’abord, ou choisissez d’autres dates.',
      },
    })
  })
})

describe('Imprévu aujourd’hui', () => {
  it('ferme la journée de Paris, une seule fois même en cas de double appui', async () => {
    const depot = await depotAvec()
    const declarer = creerDeclarerImprevu(depot, horlogeA('2026-09-23T22:30:00Z'))
    expect(await declarer()).toEqual({ dejaFerme: false })
    expect(await declarer()).toEqual({ dejaFerme: true })
    // 22 h 30 UTC = minuit et demi le 24 à Paris : c'est le 24 qui est fermé.
    expect(await depot.listerDepuis(date('2026-09-20'))).toEqual([
      expect.objectContaining({ du: date('2026-09-24'), au: date('2026-09-24'), motif: 'imprevu' }),
    ])
  })

  it('ne rajoute rien si des congés couvrent déjà la journée', async () => {
    const depot = await depotAvec(fermeture('2026-09-21', '2026-09-25'))
    expect(await creerDeclarerImprevu(depot, HORLOGE)()).toEqual({ dejaFerme: true })
  })
})

describe('lister et supprimer les fermetures', () => {
  it('liste les fermetures en cours et à venir, et dit si aujourd’hui est fermé', async () => {
    const depot = await depotAvec(
      fermeture('2026-09-01', '2026-09-10'),
      fermeture('2026-10-01', '2026-10-02'),
      fermeture('2026-09-22', '2026-09-23', 'imprevu'),
    )
    const etat = await creerListerFermetures(depot, HORLOGE)()
    expect(etat.aujourdhui).toEqual(date('2026-09-23'))
    expect(etat.fermetureDuJour?.motif).toBe('imprevu')
    expect(etat.prevues.map((prevue) => prevue.du)).toEqual([
      date('2026-09-22'),
      date('2026-10-01'),
    ])
  })

  it('supprime une fermeture, et dit quand elle n’existe plus', async () => {
    const depot = await depotAvec(fermeture('2026-10-01', '2026-10-02'))
    const [prevue] = await depot.listerDepuis(date('2026-09-23'))
    if (prevue === undefined) throw new Error('fermeture d’essai absente')
    const supprimer = creerSupprimerFermeture(depot)
    expect(await supprimer(prevue.identifiant)).toBe(true)
    expect(await supprimer(prevue.identifiant)).toBe(false)
    expect(await depot.listerDepuis(date('2026-09-23'))).toEqual([])
  })
})
