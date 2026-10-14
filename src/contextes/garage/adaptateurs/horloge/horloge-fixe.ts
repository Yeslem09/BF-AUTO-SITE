import type { Horloge } from '../../application/ports.js'

/** Horloge arrêtée sur un instant : pour les tests et les captures d'écran reproductibles. */
export function creerHorlogeFixe(instant: Date): Horloge {
  const millisecondes = instant.getTime()
  return { maintenant: () => new Date(millisecondes) }
}
