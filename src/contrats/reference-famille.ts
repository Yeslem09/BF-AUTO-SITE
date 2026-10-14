/** Famille d'intervention du catalogue citée dans une demande (devis, disponibilité). */
export interface ReferenceFamille {
  readonly identifiant: string
  readonly libelle: string
  /**
   * Faux pour une famille qui est une prestation (peinture, carrosserie,
   * diagnostic électronique, climatisation) : la demande de devis ne propose
   * alors ni « Retrait au garage » ni le choix de la gamme de pièce. Absent :
   * vrai (lecteurs antérieurs au champ).
   */
  readonly ventePieceSeule?: boolean
  /**
   * Faux quand la gamme « d'occasion ou reconditionnée » ne peut pas être
   * proposée : famille rattachée à un organe exclu du réemploi par la loi
   * (`ORGANES_EXCLUS_DU_REEMPLOI` : freinage, trains roulants, liaison au sol)
   * ou prestation sans pièce à choisir. Absent : vrai.
   */
  readonly piecesDOccasion?: boolean
  /**
   * Pièces de la famille que le client peut cocher dans sa demande de prix,
   * au pluriel et avec leur côté quand il compte (freinage : « Plaquettes
   * avant », « Plaquettes arrière », « Disques avant », « Disques arrière »,
   * « Étriers »), noms exacts, publiés par le catalogue (donnée `pieces` de la
   * famille, distincte des repères de sa figure). Absent ou vide : aucune case
   * proposée (prestation). Une valeur du paramètre `piece` de la demande
   * (`PARAMETRES_DEMANDE.piece`) qui n'y figure pas est ignorée.
   */
  readonly pieces?: readonly string[]
  /**
   * Prestations d'atelier nommées de la famille, sans pièce à choisir
   * (« Révision », « Géométrie (parallélisme) ») : une demande dont le
   * paramètre `prestation` (`PARAMETRES_DEMANDE.prestation`) en désigne une,
   * nom exact, ne propose ni pièces, ni gamme, ni retrait. Absent ou vide :
   * aucune. Une famille prestation (`ventePieceSeule` faux) les liste toutes.
   */
  readonly prestations?: readonly string[]
  /**
   * Prix indicatif de la famille, prêt à afficher après son nom, en minuscule
   * initiale : « dès 89,00 € TTC », « 60,00 € TTC », « sur devis après examen »,
   * « prix sur devis ». Celui du premier forfait (le prix mis en avant), au
   * format unique du catalogue, seule source des prix. Absent : ne rien afficher.
   */
  readonly prixIndicatif?: string
  /**
   * Prix indicatif de chaque prestation nommée (`prestations`), au même
   * format : « Révision » : « dès 129,00 € TTC ». Une demande de prestation
   * affiche le sien, jamais celui de la famille, qui est le prix d'un autre
   * forfait. Prestation absente : ne rien afficher.
   */
  readonly prixDesPrestations?: Readonly<Record<string, string>>
}
