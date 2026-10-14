import type { FastifyInstance } from 'fastify'
import type { Journal } from '../../application/ports.js'
import type { PurgerDemandes } from '../../application/purger-demandes.js'
import type { RenvoyerNotifications } from '../../application/renvoyer-notifications.js'
import { JOUR_MS } from '../../domaine/temps.js'

/** La file de renvoi est relue toutes les 30 secondes : aucun essai ne part plus d'une demi-minute en retard. */
export const INTERVALLE_RENVOI_MS = 30_000
/** La purge passe chaque jour (D5, US-34), en plus du démarrage. */
export const INTERVALLE_PURGE_MS = JOUR_MS

export interface TachesDeFond {
  readonly renvoyerNotifications: RenvoyerNotifications
  readonly purgerDemandes: PurgerDemandes
  /** Relevé de la boîte du garage (Kano connecteurs, C5) ; absent si la lecture est désactivée. */
  readonly releverBoite?: { readonly executer: () => Promise<void>; readonly intervalleMs: number }
}

/**
 * Tâches dans le processus (D5, D11) : purge au démarrage puis quotidienne,
 * file de renvoi des notifications. Minuteurs arrêtés à la fermeture du
 * serveur, et qui ne retiennent jamais le processus. Un passage encore en
 * cours n'est jamais doublé par le suivant : un renvoi lent (serveur de
 * courriel muet) ne s'empile pas toutes les 30 secondes.
 */
export function demarrerTachesDeFond(
  app: FastifyInstance,
  taches: TachesDeFond,
  journal: Journal,
): void {
  const executer = (nom: string, tache: () => Promise<unknown>) => {
    let enCours = false
    return async () => {
      if (enCours) return
      enCours = true
      try {
        await tache()
      } catch (erreur) {
        journal.erreur(`Tâche « ${nom} » en échec`, {
          erreur: erreur instanceof Error ? erreur.message : String(erreur),
        })
      } finally {
        enCours = false
      }
    }
  }
  const purger = executer('purge des demandes', taches.purgerDemandes)
  const renvoyer = executer('renvoi des notifications', taches.renvoyerNotifications)
  const minuteurs = [
    setInterval(() => void renvoyer(), INTERVALLE_RENVOI_MS),
    setInterval(() => void purger(), INTERVALLE_PURGE_MS),
  ]
  const { releverBoite } = taches
  if (releverBoite !== undefined) {
    const relever = executer('relevé de la boîte', releverBoite.executer)
    minuteurs.push(setInterval(() => void relever(), releverBoite.intervalleMs))
    app.addHook('onReady', async () => void relever())
  }
  for (const minuteur of minuteurs) minuteur.unref()
  app.addHook('onReady', purger)
  app.addHook('onClose', async () => {
    for (const minuteur of minuteurs) clearInterval(minuteur)
  })
}
