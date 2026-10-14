import {
  chevauchent,
  lirePeriode,
  periodeEnLettres,
  type ErreursPeriode,
  type Fermeture,
  type SaisiePeriode,
} from '../domaine/fermeture.js'
import { instantLocal } from '../domaine/temps-local.js'
import type { DepotFermetures, Horloge } from './ports.js'

export type ResultatDeclaration =
  | { readonly enregistree: true; readonly fermeture: Fermeture }
  | { readonly enregistree: false; readonly erreurs: ErreursPeriode }

export type DeclarerFermeture = (saisie: SaisiePeriode) => Promise<ResultatDeclaration>

/**
 * Le garagiste déclare une période de fermeture (du, au, motif). Une période
 * qui en chevauche une autre est refusée : la liste reste lisible, sans doublon.
 */
export function creerDeclarerFermeture(
  depot: DepotFermetures,
  horloge: Horloge,
): DeclarerFermeture {
  return async (saisie) => {
    const maintenant = horloge.maintenant()
    const aujourdhui = instantLocal(maintenant).date
    const lecture = lirePeriode(saisie, aujourdhui)
    if (!lecture.valide) return { enregistree: false, erreurs: lecture.erreurs }
    const existantes = await depot.listerDepuis(lecture.periode.du)
    const chevauchee = existantes.find((existante) => chevauchent(existante, lecture.periode))
    if (chevauchee !== undefined) {
      return {
        enregistree: false,
        erreurs: {
          du: `Cette période chevauche la fermeture déjà déclarée ${periodeEnLettres(chevauchee)} : supprimez-la d’abord, ou choisissez d’autres dates.`,
        },
      }
    }
    return { enregistree: true, fermeture: await depot.ajouter(lecture.periode, maintenant) }
  }
}
