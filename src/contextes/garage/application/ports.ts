import type { Fermeture, PeriodeFermeture } from '../domaine/fermeture.js'
import type { Garage } from '../domaine/garage.js'
import type { DateCalendaire } from '../domaine/temps-local.js'

/** Fournit les données du garage, déjà validées par le domaine. */
export interface SourceIdentiteGarage {
  charger(): Promise<Garage>
}

/** Donne l'instant présent. Remplacée par une horloge fixe dans les tests. */
export interface Horloge {
  maintenant(): Date
}

/** Fermetures exceptionnelles déclarées par le garagiste (Kano D5, D12). */
export interface DepotFermetures {
  /** Fermetures qui ne sont pas terminées à cette date (en cours ou à venir), triées par début. */
  listerDepuis(date: DateCalendaire): Promise<readonly Fermeture[]>
  ajouter(periode: PeriodeFermeture, declareeLe: Date): Promise<Fermeture>
  /** `false` si aucune fermeture ne porte cet identifiant. */
  supprimer(identifiant: number): Promise<boolean>
}

/**
 * Un rappel promis à un client et pas encore fait : la forme du contrat
 * `RappelPromis` de la capacité « rappels promis pour une date », offerte par
 * les demandes, réduite à ce que l'écran des fermetures affiche.
 */
export interface RappelPromisLu {
  /** Prénom saisi par le client : un texte à échapper à l'affichage. */
  readonly prenom: string
  readonly telephone: { readonly affichable: string; readonly lien: string }
  /** Date promise, heure de Paris : `AAAA-MM-JJ`. */
  readonly date: string
  /** « le matin », « en fin de journée ». */
  readonly quand: string
  readonly neRoulezPas: boolean
  /** Fiche de la demande dans l'espace garagiste. */
  readonly chemin: string
}

/**
 * Rappels promis pour la date `du`, ou de `du` à `au` bornes comprises
 * (`AAAA-MM-JJ`, heure de Paris) : même signature que le contrat
 * `ListerRappelsPromis` des demandes, branché par la composition.
 */
export type ListerRappelsPromis = (du: string, au?: string) => Promise<readonly RappelPromisLu[]>
