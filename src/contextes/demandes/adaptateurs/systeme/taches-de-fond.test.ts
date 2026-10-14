import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { journalMemoire } from '../../essai.js'
import { INTERVALLE_RENVOI_MS, demarrerTachesDeFond } from './taches-de-fond.js'

afterEach(() => {
  vi.useRealTimers()
})

describe('tâches de fond (D5, D11)', () => {
  it('purge au démarrage ; un renvoi encore en cours n’est pas doublé par le suivant', async () => {
    vi.useFakeTimers()
    const app = Fastify()
    let purges = 0
    let renvois = 0
    let terminerRenvoi: () => void = () => undefined
    demarrerTachesDeFond(
      app,
      {
        purgerDemandes: async () => {
          purges += 1
          return { demandes: 0, envoisSuspects: 0 }
        },
        renvoyerNotifications: () =>
          new Promise<number>((resolve) => {
            renvois += 1
            terminerRenvoi = () => resolve(0)
          }),
      },
      journalMemoire(),
    )
    await app.ready()
    expect(purges).toBe(1)

    await vi.advanceTimersByTimeAsync(3 * INTERVALLE_RENVOI_MS)
    expect(renvois).toBe(1)
    terminerRenvoi()
    await vi.advanceTimersByTimeAsync(INTERVALLE_RENVOI_MS)
    expect(renvois).toBe(2)
    terminerRenvoi()
    await app.close()
  })

  it('une tâche en échec est journalisée, sans arrêter les suivantes', async () => {
    vi.useFakeTimers()
    const app = Fastify()
    const journal = journalMemoire()
    let renvois = 0
    demarrerTachesDeFond(
      app,
      {
        purgerDemandes: async () => ({ demandes: 0, envoisSuspects: 0 }),
        renvoyerNotifications: async () => {
          renvois += 1
          throw new Error('base verrouillée')
        },
      },
      journal,
    )
    await app.ready()
    await vi.advanceTimersByTimeAsync(2 * INTERVALLE_RENVOI_MS)
    expect(renvois).toBe(2)
    expect(journal.lignes.filter((ligne) => ligne.niveau === 'erreur')).toHaveLength(2)
    await app.close()
  })
})
