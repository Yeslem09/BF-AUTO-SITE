import type { OrganeExcluDuReemploi } from '../../../contrats/index.js'

/**
 * Modèle du catalogue : familles d'intervention (la pièce et sa pose réunies),
 * leurs forfaits, les tarifs transverses et ce que le garage ne fait pas.
 * Chaque donnée publiable porte son statut : rien de ce qui n'est pas validé
 * par le garage ne se lit comme un fait hors de la démonstration.
 */

/** `valide` : confirmé par le garage ; `a_valider` : en attente de sa confirmation. */
export const STATUTS = ['valide', 'a_valider'] as const
export type Statut = (typeof STATUTS)[number]

/**
 * `garage` : dit par le garagiste ; `anthony` : décidé par Anthony au nom du
 * garage, à une date consignée (`date_decision`) ; `proposition` : rédigé pour
 * être soumis.
 */
export const SOURCES = ['garage', 'anthony', 'proposition'] as const
export type Source = (typeof SOURCES)[number]

/** Sources qui peuvent valider un texte : jamais une proposition. */
export const SOURCES_QUI_VALIDENT: readonly Source[] = ['garage', 'anthony']

/** Provenance d'un texte publiable. Un texte validé vient du garage ou d'une décision d'Anthony. */
export interface Provenance {
  readonly statut: Statut
  readonly source: Source
}

/** Jour du calendrier, sans heure ni fuseau : date d'effet d'un prix. */
export interface DateCalendaire {
  readonly annee: number
  readonly mois: number
  readonly jour: number
}

/** Prix que personne n'a encore donné : aucun montant, seulement ce qu'il reste à obtenir. */
export interface PrixInconnu {
  readonly nature: 'inconnu'
  readonly statut: 'a_valider'
  readonly note: string
}

/**
 * Ce qui distingue un prix proposé d'un prix validé. Une proposition (prix
 * de démonstration calé sur le marché local) cite sa source et ce qu'il reste
 * à obtenir du garage : elle ne s'affiche qu'en démonstration et en relecture,
 * et la porte de démarrage la refuse en production.
 */
interface Origine {
  readonly statut: Statut
  /** D'où vient une proposition ; `null` pour un prix validé par le garage. */
  readonly source: string | null
  /** Ce qu'il reste à obtenir du garage ; `null` pour un prix validé. */
  readonly note: string | null
}

/** Pas de forfait, et on le dit : « Sur devis après examen ». */
export interface PrixSurDevis extends Origine {
  readonly nature: 'sur-devis'
  /** Ce qui précède le devis : « après examen ». */
  readonly precision: string
}

/** Montant TTC, ce qu'il comprend, sa date d'effet et, s'il le faut, le véhicule de référence. */
export interface PrixChiffre extends Origine {
  readonly nature: 'chiffre'
  readonly montantTtcCentimes: number
  /** « À partir de » : le montant vaut pour le véhicule de référence, le plus simple. */
  readonly aPartirDe: boolean
  readonly comprend: string
  readonly dateEffet: DateCalendaire
  /** Exigé pour un forfait et pour tout prix « à partir de » ; `null` sinon. */
  readonly vehiculeReference: string | null
  /** Premier contrôle seulement : durée annoncée ; `null` ailleurs. */
  readonly duree: string | null
  /** Premier contrôle seulement : déduit du prix de la réparation confiée au garage ; `null` ailleurs. */
  readonly deduitDeLaReparation: boolean | null
}

export type Prix = PrixInconnu | PrixSurDevis | PrixChiffre

/** Vrai pour un prix proposé mais pas encore confirmé : montant ou « sur devis » de démonstration. */
export function estProposition(prix: Prix): prix is PrixSurDevis | PrixChiffre {
  return prix.nature !== 'inconnu' && prix.statut === 'a_valider'
}

/** Une prestation chiffrée d'une famille : « Plaquettes avant posées », « Révision ». */
export interface Forfait {
  /** Unique dans tout le catalogue : ancre de la page des tarifs, exemple de l'accueil. */
  readonly identifiant: string
  readonly intitule: string
  readonly prix: Prix
  /**
   * Pièce de la famille que ce forfait pose (« Plaquettes avant » pour
   * « Plaquettes avant posées ») : son lien « Demander un prix » la pré-coche,
   * avec la pose à l'atelier. `null` : aucune.
   */
  readonly piece: string | null
  /**
   * Prestation d'atelier sans pièce à choisir (révision, géométrie) : sa
   * demande de prix ne propose ni pièces, ni gamme, ni retrait. Toujours
   * vrai dans une famille prestation (`ventePieceSeule` faux).
   */
  readonly prestation: boolean
}

export interface Famille {
  /** Identifiant d'adresse (`freinage`), repris par le paramètre `famille` d'une demande. */
  readonly identifiant: string
  readonly libelle: string
  readonly provenance: Provenance
  /** Mots du client, dans l'ordre d'importance : les deux premiers entrent dans le titre de la page. */
  readonly motsCourants: readonly string[]
  /**
   * Autres mots par lesquels un client cherche cette famille (« frein »,
   * « pot »), pour la recherche seulement : ils ne s'affichent pas. Un
   * synonyme mène à une seule famille, comme un mot courant.
   */
  readonly synonymes: readonly string[]
  /** À quoi sert la famille, en une phrase. */
  readonly role: string
  readonly signesUsure: readonly string[]
  readonly ceQueFaitLeGarage: string
  /** Au moins un : le premier est le prix mis en avant de la famille. */
  readonly forfaits: readonly Forfait[]
  /**
   * Faux pour une prestation (peinture, carrosserie, diagnostic électronique,
   * climatisation) : ni « Acheter la pièce seule », ni vérification de pièce,
   * ni choix de gamme.
   */
  readonly ventePieceSeule: boolean
  /**
   * Pièces que le client coche dans sa demande de prix, au pluriel et avec
   * leur côté quand il compte (« Plaquettes avant », « Disques arrière ») :
   * distinctes des repères de la figure, qui nomment le dessin. Vide pour une
   * prestation.
   */
  readonly pieces: readonly string[]
  /**
   * Prestation : ce que le client décrit dans sa demande de prix (« Décrivez
   * le dégât : où et quoi »), dit sur la page à côté de « Demander un prix » ;
   * `null` : rien de propre.
   */
  readonly consigneDemande: string | null
  /** Vrai quand une photo envoyée par SMS accélère le devis (un dégât de carrosserie). */
  readonly photoParSms: boolean
  /**
   * Organe que la loi exclut des pièces d'occasion (référentiel unique des
   * contrats) : la gamme « d'occasion ou reconditionnée » n'est jamais
   * proposée pour cette famille. `null` : aucun.
   */
  readonly organeExcluDuReemploi: OrganeExcluDuReemploi | null
}

/** Texte court soumis à validation : un élément de « Ce que nous ne faisons pas », un engagement. */
export interface Mention {
  readonly texte: string
  readonly provenance: Provenance
}

export interface TarifsTransverses {
  readonly tauxHoraire: Prix
  /** Un montant nul signifie « gratuit » ; chiffré, il dit sa durée et s'il est déduit de la réparation. */
  readonly premierControle: Prix
}

export interface Catalogue {
  readonly familles: readonly Famille[]
  readonly tarifsTransverses: TarifsTransverses
  readonly ceQueNousNeFaisonsPas: readonly Mention[]
  /** Vérification de la pièce avant toute commande (attractive AT-4), dite une seule fois par page. */
  readonly engagementPiecePosee: Mention
  /** Gamme au choix (neuve, d'occasion ou reconditionnée), jamais pour un organe exclu du réemploi. */
  readonly gammeAuChoix: Mention
  /**
   * Vente au comptoir : « Pièce seule, à retirer au garage », à côté de la pose
   * à l'atelier (arbitrage 4 du Kano). Publiée, la demande de devis propose
   * « Retrait au garage » ou « Pose à l'atelier ».
   */
  readonly venteAuComptoir: Mention
  /** Identifiants des forfaits montrés en exemple sur l'accueil (bloc atelier), trois au plus. */
  readonly exemplesAccueil: readonly string[]
}
