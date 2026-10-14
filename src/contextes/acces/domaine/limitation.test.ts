import { describe, expect, it } from 'vitest'
import {
  alerteGlobaleDue,
  debutFenetre,
  evaluerLimiteAdresse,
  minutesAttente,
} from './limitation.js'
import { DEMANDES_MAX_PAR_ADRESSE, SEUIL_ALERTE_GLOBALE } from './regles.js'

const MINUTE = 60_000
const MAINTENANT = new Date('2026-09-23T10:00:00Z')
const ilYA = (minutes: number): Date => new Date(MAINTENANT.getTime() - minutes * MINUTE)
const serie = (nombre: number, espacementMinutes = 1): Date[] =>
  Array.from({ length: nombre }, (_, rang) => ilYA((nombre - rang) * espacementMinutes))

describe('limite de cinq demandes de lien par adresse et par heure', () => {
  it('accepte les cinq premières', () => {
    expect(DEMANDES_MAX_PAR_ADRESSE).toBe(5)
    expect(evaluerLimiteAdresse([], MAINTENANT)).toEqual({ autorisee: true })
    expect(evaluerLimiteAdresse(serie(4), MAINTENANT)).toEqual({ autorisee: true })
  })

  it('refuse la sixième et annonce l’attente jusqu’à la sortie de la plus ancienne', () => {
    // Cinq demandes il y a 50, 40, 30, 20 et 10 minutes : la plus ancienne sort dans 10 minutes.
    const decision = evaluerLimiteAdresse(serie(5, 10), MAINTENANT)
    expect(decision).toEqual({ autorisee: false, attenteMs: 10 * MINUTE })
  })

  it('oublie les demandes de plus d’une heure', () => {
    const anciennes = [ilYA(61), ilYA(62), ilYA(70), ilYA(90), ilYA(60)]
    expect(evaluerLimiteAdresse([...anciennes, ...serie(4)], MAINTENANT)).toEqual({
      autorisee: true,
    })
  })

  it('ne compte pas un instant venu du futur (horloge décalée)', () => {
    const futures = Array.from(
      { length: 5 },
      (_, rang) => new Date(MAINTENANT.getTime() + rang + 1),
    )
    expect(evaluerLimiteAdresse(futures, MAINTENANT)).toEqual({ autorisee: true })
  })
})

describe('alerte globale au-delà de vingt demandes par heure', () => {
  it('se tait jusqu’à vingt, alerte à la vingt et unième', () => {
    expect(SEUIL_ALERTE_GLOBALE).toBe(20)
    expect(alerteGlobaleDue(serie(20), null, MAINTENANT)).toBe(false)
    expect(alerteGlobaleDue(serie(21), null, MAINTENANT)).toBe(true)
  })

  it('n’alerte qu’une fois par heure', () => {
    expect(alerteGlobaleDue(serie(25), ilYA(30), MAINTENANT)).toBe(false)
    expect(alerteGlobaleDue(serie(25), ilYA(60), MAINTENANT)).toBe(true)
  })
})

describe('attente annoncée', () => {
  it('s’arrondit à la minute supérieure, jamais moins d’une minute', () => {
    expect(minutesAttente(1)).toBe(1)
    expect(minutesAttente(MINUTE)).toBe(1)
    expect(minutesAttente(MINUTE + 1)).toBe(2)
    expect(minutesAttente(0)).toBe(1)
  })

  it('court sur une fenêtre d’une heure', () => {
    expect(debutFenetre(MAINTENANT).toISOString()).toBe('2026-09-23T09:00:00.000Z')
  })
})
