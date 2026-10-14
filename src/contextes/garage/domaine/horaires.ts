import type { MinuteDuJour } from './heure.js'
import type { JourSemaine } from './jours.js'

/** Plage d'ouverture d'une journée, ouverture incluse, fermeture exclue. */
export interface Plage {
  readonly ouverture: MinuteDuJour
  readonly fermeture: MinuteDuJour
}

/** Semaine type : pour chaque jour, ses plages triées et disjointes ; un jour sans plage est fermé. */
export type SemaineType = Readonly<Record<JourSemaine, readonly Plage[]>>

export const SEMAINE_FERMEE: SemaineType = {
  lundi: [],
  mardi: [],
  mercredi: [],
  jeudi: [],
  vendredi: [],
  samedi: [],
  dimanche: [],
}
