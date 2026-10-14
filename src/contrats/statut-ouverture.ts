/**
 * État d'ouverture à un instant donné, prêt à afficher.
 *
 * `a-confirmer` n'est pas un « fermé » déguisé : tant que les horaires ne sont
 * pas confirmés par le garage, le site ne prétend rien.
 */
export type EtatOuverture = 'ouvert' | 'ferme' | 'a-confirmer'

export interface StatutOuverture {
  readonly etat: EtatOuverture
  /** Libellé humain : « Ouvert, ferme à 19 h », « Fermé, ouvre vendredi à 9 h ». */
  readonly libelle: string
}
