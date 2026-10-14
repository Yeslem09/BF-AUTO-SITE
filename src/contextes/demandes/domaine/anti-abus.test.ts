import { describe, expect, it } from 'vitest'
import {
  DELAI_MINIMAL_SAISIE_MS,
  ENVOIS_MAXIMUM_PAR_FENETRE,
  FENETRE_LIMITATION_MS,
  evaluerEnvoi,
  limiteAtteinte,
} from './anti-abus.js'

const AFFICHE = new Date('2026-09-16T08:00:00.000Z')
const apres = (millisecondes: number) => new Date(AFFICHE.getTime() + millisecondes)

describe('évaluation d’un envoi (D9, US-15)', () => {
  it('un formulaire envoyé après le délai minimal, champ piège vide, est conforme', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        formulaireDejaEnvoye: false,
        jeton: { nature: 'formulaire', emisLe: AFFICHE },
        recuLe: apres(DELAI_MINIMAL_SAISIE_MS),
      }),
    ).toEqual({ verdict: 'conforme' })
  })

  it('un envoi 1 seconde après l’affichage est suspect, jamais rejeté en silence', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        formulaireDejaEnvoye: false,
        jeton: { nature: 'formulaire', emisLe: AFFICHE },
        recuLe: apres(1_000),
      }),
    ).toEqual({ verdict: 'suspect', motif: 'envoi-trop-rapide' })
  })

  it('le champ piège rempli rend l’envoi suspect, même confirmé', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: true,
        formulaireDejaEnvoye: false,
        jeton: { nature: 'confirmation', emisLe: AFFICHE },
        recuLe: apres(60_000),
      }),
    ).toEqual({ verdict: 'suspect', motif: 'champ-piege' })
  })

  it('sans jeton authentifié, l’envoi est suspect', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        jeton: null,
        formulaireDejaEnvoye: false,
        recuLe: AFFICHE,
      }),
    ).toEqual({
      verdict: 'suspect',
      motif: 'jeton-absent',
    })
  })

  it('une confirmation, même immédiate, est conforme : un client rapide ne tourne pas en rond', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        formulaireDejaEnvoye: false,
        jeton: { nature: 'confirmation', emisLe: AFFICHE },
        recuLe: AFFICHE,
      }),
    ).toEqual({ verdict: 'conforme' })
  })

  it('un formulaire déjà envoyé avec une autre demande est confirmé, jamais jeté (AE-35)', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        jeton: { nature: 'formulaire', emisLe: AFFICHE },
        formulaireDejaEnvoye: true,
        recuLe: apres(10 * 60_000),
      }),
    ).toEqual({ verdict: 'suspect', motif: 'formulaire-deja-envoye' })
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        jeton: { nature: 'confirmation', emisLe: AFFICHE },
        formulaireDejaEnvoye: true,
        recuLe: apres(10 * 60_000),
      }),
    ).toEqual({ verdict: 'suspect', motif: 'formulaire-deja-envoye' })
  })

  it('une horloge qui recule ne fait pas passer un envoi pour lent', () => {
    expect(
      evaluerEnvoi({
        piegeRempli: false,
        formulaireDejaEnvoye: false,
        jeton: { nature: 'formulaire', emisLe: AFFICHE },
        recuLe: apres(-10_000),
      }),
    ).toEqual({ verdict: 'suspect', motif: 'envoi-trop-rapide' })
  })
})

describe('limitation de débit (US-47)', () => {
  const cinq = Array.from({ length: ENVOIS_MAXIMUM_PAR_FENETRE }, (_, rang) =>
    apres(rang * 60_000).getTime(),
  )

  it('cinq envois dans l’heure atteignent la limite', () => {
    expect(limiteAtteinte(cinq.slice(0, 4), apres(10 * 60_000))).toBe(false)
    expect(limiteAtteinte(cinq, apres(10 * 60_000))).toBe(true)
  })

  it('la fenêtre glisse : une heure après le premier envoi, la limite se relâche', () => {
    expect(limiteAtteinte(cinq, apres(FENETRE_LIMITATION_MS + 1))).toBe(false)
  })
})
