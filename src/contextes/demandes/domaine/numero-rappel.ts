import type { ModeSite, TelephonePublic } from '../../../contrats/index.js'

/**
 * Numéro depuis lequel le garage rappelle ses clients (D4, US-12) : un client
 * ne décroche pas un numéro inconnu. Donnée à valider par le garage.
 */
export interface NumeroRappel {
  /** `null` : aucune proposition, rien à afficher en aucun mode. */
  readonly telephone: TelephonePublic | null
  readonly statut: 'valide' | 'a_valider'
}

export interface NumeroRappelAffiche {
  readonly telephone: TelephonePublic
  /** Mode relecture : la valeur à valider est surlignée pour être relue. */
  readonly surligne: boolean
}

/**
 * Ce que la confirmation peut dire du numéro (D8, arbitrage 3) : validé, il
 * s'affiche partout ; à valider, il est tu en production, surligné en
 * relecture, affiché normalement en démonstration (bandeau en tête de page).
 */
export function numeroRappelAffiche(
  numero: NumeroRappel,
  mode: ModeSite,
): NumeroRappelAffiche | null {
  if (numero.telephone === null) return null
  if (numero.statut === 'valide') return { telephone: numero.telephone, surligne: false }
  switch (mode) {
    case 'production':
      return null
    case 'relecture':
      return { telephone: numero.telephone, surligne: true }
    case 'demonstration':
      return { telephone: numero.telephone, surligne: false }
  }
}
