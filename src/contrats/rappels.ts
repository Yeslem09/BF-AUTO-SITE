import type { TelephonePublic } from './identite-garage.js'

/**
 * Capacités que les demandes offrent à l'espace garagiste des autres
 * contextes : l'accueil de l'espace (accès) et les fermetures (garage).
 */

/**
 * Demandes encore « À rappeler » : le nombre qu'affiche la liste des
 * demandes, jamais une mesure de délai (US-30, AE-34).
 */
export interface DemandesARappeler {
  readonly total: number
  /** Dont celles dont le pré-diagnostic dit « Ne roulez pas ». */
  readonly neRoulezPas: number
  /**
   * Garage fermé aujourd'hui (fermeture exceptionnelle) : les rappels promis
   * pour aujourd'hui et pas encore faits, à reporter (J4, passe 2 du jury).
   * Absent : le garage n'est pas fermé aujourd'hui, ou on ne le sait pas.
   */
  readonly fermeAujourdhui?: { readonly rappelsAReporter: number }
}

/**
 * Fournie par le garage, lue par les demandes : vrai si une fermeture
 * exceptionnelle couvre la date du jour, heure de Paris.
 */
export type GarageFermeAujourdhui = () => Promise<boolean>

/** Fournie par les demandes, lue par l'accès : compteur de l'accueil de l'espace garagiste. */
export type CompterDemandesARappeler = () => Promise<DemandesARappeler>

/** Un rappel promis à un client et pas encore fait (demande « À rappeler »). */
export interface RappelPromis {
  /** Prénom saisi par le client : un texte à échapper à l'affichage. */
  readonly prenom: string
  /** Téléphone du client : `affichable` (« 06 12 34 56 78 ») et `lien` (`tel:+33612345678`). */
  readonly telephone: TelephonePublic
  /** Date promise, heure de Paris : `AAAA-MM-JJ`. */
  readonly date: string
  /** Moment promis ce jour-là, en toutes lettres : « le matin », « à midi », « l’après-midi », « en fin de journée ». */
  readonly quand: string
  /** Phrase lue par le client sur sa confirmation : « Nous vous rappelons jeudi, en fin de journée. » */
  readonly phrase: string
  /** Demande « Ne roulez pas » : à rappeler d'abord. */
  readonly neRoulezPas: boolean
  /** Fiche de la demande dans l'espace garagiste : `/garagiste/demandes/<identifiant>`. */
  readonly chemin: string
}

/**
 * Fournie par les demandes, lue par le garage : les rappels promis pour la
 * date `du`, ou pour chaque date de `du` à `au` (bornes comprises), et pas
 * encore faits. Dates `AAAA-MM-JJ`, heure de Paris. Le garage s'en sert pour
 * prévenir le garagiste qui déclare une fermeture ces jours-là (« 1 client
 * attend votre rappel aujourd'hui : Sophie, en fin de journée »). Ordre :
 * « Ne roulez pas » d'abord, puis par date et moment promis. Liste vide si
 * `au` précède `du` ; une date mal formée est refusée (`RangeError`).
 */
export type ListerRappelsPromis = (du: string, au?: string) => Promise<readonly RappelPromis[]>
