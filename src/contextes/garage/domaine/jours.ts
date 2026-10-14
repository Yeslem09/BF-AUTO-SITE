/** Jours de la semaine dans l'ordre d'affichage français (lundi d'abord). */
export const JOURS_SEMAINE = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const

export type JourSemaine = (typeof JOURS_SEMAINE)[number]

/** Index renvoyé par `Date.getUTCDay()` : 0 pour dimanche. */
const JOURS_DEPUIS_DIMANCHE: readonly JourSemaine[] = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
]

export function jourDepuisIndexUtc(index: number): JourSemaine {
  const jour = JOURS_DEPUIS_DIMANCHE[index]
  if (jour === undefined) throw new RangeError(`Index de jour invalide : ${index}.`)
  return jour
}

export function estJourSemaine(texte: string): texte is JourSemaine {
  return (JOURS_SEMAINE as readonly string[]).includes(texte)
}
