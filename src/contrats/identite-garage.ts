/** Adresse postale telle qu'elle s'affiche et se référence (cohérence NAP). */
export interface AdressePostale {
  readonly voie: string
  readonly codePostal: string
  readonly ville: string
}

export interface TelephonePublic {
  /** Forme lisible, par paires de chiffres : « 06 05 92 28 38 ». */
  readonly affichable: string
  /** Lien d'appel international : « tel:+33605922838 ». */
  readonly lien: string
}

export interface CoordonneesGeographiques {
  readonly latitude: number
  readonly longitude: number
}

/** Ce que tout le site peut montrer du garage, et rien de plus. */
export interface IdentiteGaragePublique {
  readonly nom: string
  readonly accroche: string
  /**
   * Ce que fait le garage, en une ligne : « Mécanique, entretien, carrosserie
   * et peinture, toutes marques. ». L'accueil l'affiche sous l'accroche, dès le
   * premier écran. Absente : rien n'est affiché.
   */
  readonly activites?: string
  readonly adresse: AdressePostale
  readonly telephone: TelephonePublic
  readonly courriel?: string
  readonly coordonnees?: CoordonneesGeographiques
}
