import type { TypeDemande } from '../../../contrats/index.js'
import type { SaisieDemande } from '../domaine/validation.js'
import type { EnvoiDemande } from './envoyer-demande.js'
import type { SignatureJetons } from './ports.js'
import type { FormulaireDemande, PreparerFormulaire } from './preparer-formulaire.js'

export interface DependancesChangerType {
  readonly preparerFormulaire: PreparerFormulaire
  readonly jetons: SignatureJetons
}

/** Le formulaire du nouveau type, rempli de ce que le client avait déjà saisi. */
export interface FormulaireChange {
  readonly formulaire: FormulaireDemande
  readonly valeurs: SaisieDemande
}

/**
 * Changer de type de demande sans perdre sa saisie (J2, passe 1 du jury) : les
 * onglets envoient le formulaire, qui revient au nouveau type avec prénom,
 * téléphone, moment, précisions et véhicule déjà remplis, sans script. Rien
 * n'est validé ni enregistré ; le jeton du formulaire est gardé (délai de
 * saisie et envoi unique compris), la famille et le pré-diagnostic retrouvés
 * le restent d'un type à l'autre.
 */
export type ChangerType = (envoi: EnvoiDemande, type: TypeDemande) => Promise<FormulaireChange>

export function creerChangerType(dependances: DependancesChangerType): ChangerType {
  return async (envoi, type) => {
    const jetonValable = dependances.jetons.lire(envoi.jeton) !== null
    const formulaire = await dependances.preparerFormulaire(
      { type, ...envoi.rattachements },
      jetonValable ? envoi.jeton : undefined,
    )
    return { formulaire, valeurs: { ...envoi.saisie, type: formulaire.type } }
  }
}
