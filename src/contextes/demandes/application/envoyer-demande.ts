import { evaluerEnvoi, type MotifSoupcon } from '../domaine/anti-abus.js'
import { creerDemande, memeContenu, type ContenuDemande } from '../domaine/demande.js'
import { validerDemande, type ErreursSaisie, type SaisieDemande } from '../domaine/validation.js'
import type { NotifierDemande } from './notifier-demande.js'
import type { PromettreRappel } from './promettre-rappel.js'
import type {
  DepotDemandes,
  GenerateurAleas,
  Horloge,
  Journal,
  LimiteurEnvois,
  RegistreEnvoisSuspects,
  SignatureJetons,
} from './ports.js'
import type {
  FormulaireDemande,
  ParametresFormulaire,
  PreparerFormulaire,
} from './preparer-formulaire.js'

/** Un envoi du formulaire, tel que l'adaptateur web l'a lu. */
export interface EnvoiDemande {
  readonly saisie: SaisieDemande
  /** Identifiant de famille et code de pré-diagnostic des champs cachés, retrouvés côté serveur. */
  readonly rattachements: Pick<ParametresFormulaire, 'famille' | 'prediagnostic' | 'prestation'>
  readonly jeton: string
  readonly piegeRempli: boolean
  /** Clé de limitation de débit (adresse client), `null` si l'envoi n'est pas limité. */
  readonly cleClient: string | null
}

export type IssueEnvoi =
  | {
      readonly issue: 'enregistree'
      readonly jetonConfirmation: string
      /** Notification lancée après l'enregistrement ; ne rejette jamais. */
      readonly notification: Promise<void>
    }
  /** Même formulaire, même contenu, déjà enregistré (double envoi) : on renvoie à la même confirmation. */
  | { readonly issue: 'deja-enregistree'; readonly jetonConfirmation: string }
  | {
      readonly issue: 'invalide'
      readonly formulaire: FormulaireDemande
      readonly erreurs: ErreursSaisie
    }
  /** Envoi suspect : jamais jeté, il est réaffiché pour confirmation (D9), avec son contenu validé. */
  | {
      readonly issue: 'a-confirmer'
      readonly formulaire: FormulaireDemande
      readonly contenu: ContenuDemande
      readonly motif: MotifSoupcon
    }
  | { readonly issue: 'limite-atteinte' }

export interface DependancesEnvoyerDemande {
  readonly preparerFormulaire: PreparerFormulaire
  readonly depot: DepotDemandes
  readonly registre: RegistreEnvoisSuspects
  readonly jetons: SignatureJetons
  readonly aleas: GenerateurAleas
  readonly limiteur: LimiteurEnvois
  readonly horloge: Horloge
  readonly journal: Journal
  readonly notifierDemande: NotifierDemande
  /** Ce que la confirmation promettra au client, retenu à l'envoi ; absent : rien de promis. */
  readonly promettreRappel?: PromettreRappel
}

export type EnvoyerDemande = (envoi: EnvoiDemande) => Promise<IssueEnvoi>

/** Ce que le jeton de formulaire a déjà enregistré : sa confirmation, et si c'est la même demande. */
interface EnvoiPrecedent {
  readonly jetonConfirmation: string
  readonly memeDemande: boolean
}

/**
 * Reçoit une demande. Dans l'ordre : validation (erreurs par champ), envoi
 * unique, limitation de débit, anti-abus sans rejet silencieux, puis
 * enregistrement AVANT toute notification (B-24).
 *
 * Envoi unique : un jeton déjà enregistré avec le MÊME contenu est un double
 * envoi, renvoyé à la même confirmation. Avec un autre contenu (retour
 * arrière, puis une autre demande), rien n'est jeté : la nouvelle demande
 * passe par l'écran « Confirmez l'envoi » (AE-35).
 */
export function creerEnvoyerDemande(dependances: DependancesEnvoyerDemande): EnvoyerDemande {
  const { depot, registre, jetons, aleas, limiteur, horloge, journal } = dependances

  async function envoiPrecedent(
    jeton: string,
    contenu: ContenuDemande,
  ): Promise<EnvoiPrecedent | null> {
    const jetonConfirmation = await depot.confirmationDuFormulaire(jeton)
    if (jetonConfirmation === null) return null
    const lecture = await depot.trouverParConfirmation(jetonConfirmation)
    return {
      jetonConfirmation,
      memeDemande: lecture.etat === 'trouvee' && memeContenu(lecture.demande, contenu),
    }
  }

  return async (envoi) => {
    const maintenant = horloge.maintenant()
    const jetonLu = jetons.lire(envoi.jeton)
    const parametres: ParametresFormulaire = { type: envoi.saisie.type, ...envoi.rattachements }
    const formulaire = await dependances.preparerFormulaire(
      parametres,
      jetonLu === null ? undefined : envoi.jeton,
    )
    const validation = validerDemande(envoi.saisie, {
      demiJournees: formulaire.demiJournees,
      anneeCourante: formulaire.anneeCourante,
      famille: formulaire.famille,
      prestation: formulaire.prestation,
      resume: formulaire.preDiagnostic?.resume ?? null,
      venteAuComptoir: formulaire.offrePieces.venteAuComptoir,
    })
    if (!validation.ok) return { issue: 'invalide', formulaire, erreurs: validation.erreurs }

    const precedent =
      jetonLu === null ? null : await envoiPrecedent(envoi.jeton, validation.contenu)
    if (precedent?.memeDemande === true) {
      return { issue: 'deja-enregistree', jetonConfirmation: precedent.jetonConfirmation }
    }

    if (envoi.cleClient !== null) {
      if (limiteur.estAtteinte(envoi.cleClient, maintenant)) {
        journal.avertir('Limite d’envois atteinte pour une adresse client')
        return { issue: 'limite-atteinte' }
      }
      limiteur.compter(envoi.cleClient, maintenant)
    }

    const evaluation = evaluerEnvoi({
      piegeRempli: envoi.piegeRempli,
      jeton: jetonLu,
      formulaireDejaEnvoye: precedent !== null,
      recuLe: maintenant,
    })
    if (evaluation.verdict === 'suspect') {
      const jetonConfirmation = jetons.emettre('confirmation', maintenant)
      const remplace = jetonLu?.nature === 'confirmation' ? envoi.jeton : null
      await registre.noter(jetonConfirmation, maintenant, remplace)
      journal.info('Envoi suspect : confirmation demandée au client', { motif: evaluation.motif })
      return {
        issue: 'a-confirmer',
        formulaire: { ...formulaire, jeton: jetonConfirmation },
        contenu: validation.contenu,
        motif: evaluation.motif,
      }
    }

    const promesse =
      dependances.promettreRappel === undefined
        ? null
        : await dependances.promettreRappel(maintenant, validation.contenu.contact.moment)
    const demande = creerDemande(validation.contenu, {
      id: aleas.identifiant(),
      recueLe: maintenant,
      promesse,
    })
    const jetonConfirmation = aleas.jetonConfirmation()
    const issue = await depot.enregistrer(demande, {
      formulaire: envoi.jeton,
      confirmation: jetonConfirmation,
    })
    if (issue === 'jeton-deja-utilise') {
      // Deux envois simultanés du même formulaire : le premier arrivé a gagné.
      const premier = await depot.confirmationDuFormulaire(envoi.jeton)
      if (premier !== null) return { issue: 'deja-enregistree', jetonConfirmation: premier }
      throw new Error('Jeton de formulaire déjà utilisé, mais aucune demande ne le porte.')
    }
    if (jetonLu?.nature === 'confirmation') await registre.confirmer(envoi.jeton, maintenant)
    journal.info('Demande enregistrée', { demande: demande.id, type: demande.type })
    return {
      issue: 'enregistree',
      jetonConfirmation,
      notification: dependances.notifierDemande(demande.id),
    }
  }
}
