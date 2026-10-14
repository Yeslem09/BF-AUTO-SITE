import { DELAI_REPRISE_EN_ATTENTE_MS } from '../domaine/etat-notification.js'
import type { NotifierDemande } from './notifier-demande.js'
import type { DepotDemandes, Horloge } from './ports.js'

export interface DependancesRenvoyerNotifications {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
  readonly notifierDemande: NotifierDemande
}

/**
 * File de renvoi : renvoie, une par une, les notifications en échec dont
 * l'essai est échu et celles jamais tentées. Renvoie leur nombre.
 */
export type RenvoyerNotifications = () => Promise<number>

export function creerRenvoyerNotifications(
  dependances: DependancesRenvoyerNotifications,
): RenvoyerNotifications {
  return async () => {
    const maintenant = dependances.horloge.maintenant()
    const dues = await dependances.depot.notificationsARenvoyer(
      maintenant,
      new Date(maintenant.getTime() - DELAI_REPRISE_EN_ATTENTE_MS),
    )
    for (const id of dues) await dependances.notifierDemande(id)
    return dues.length
  }
}
