import type { Anomalie } from './anomalie.js'

/** L'arbre ne passe pas la porte : le site refuse de démarrer avec lui. */
export class ErreurArbreRefuse extends Error {
  override readonly name = 'ErreurArbreRefuse'

  constructor(readonly anomalies: readonly Anomalie[]) {
    super(
      `Arbre du pré-diagnostic refusé (${anomalies.length} anomalie(s)) :\n` +
        anomalies.map((anomalie) => `- [${anomalie.regle}] ${anomalie.message}`).join('\n'),
    )
  }
}

/**
 * Référence introuvable dans un arbre pourtant lu : ne peut arriver que si un
 * arbre est construit sans passer par la lecture. Défaut de programmation.
 */
export class ErreurArbreIncoherent extends Error {
  override readonly name = 'ErreurArbreIncoherent'
}
