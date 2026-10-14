import type {
  ConsulterOffrePieces,
  DemiJourneeProposee,
  ListerCeQueNousNeFaisonsPas,
  OffrePieces,
  ProposerDemiJournees,
  ReferenceFamille,
  ResumePreDiagnostic,
  RetrouverResumePreDiagnostic,
  TrouverFamille,
  TypeDemande,
} from '../../../contrats/index.js'
import { pieceDuParametre, prestationDuParametre, sansPiece } from '../domaine/famille.js'
import { modaliteDuParametre, type ModalitePiece } from '../domaine/referentiels.js'
import { anneeAParis } from '../domaine/temps.js'
import { lireType } from '../domaine/validation.js'
import type { Horloge, Journal, SignatureJetons } from './ports.js'

/** Sans type reconnu, le formulaire le plus court : être rappelé. */
export const TYPE_PAR_DEFAUT: TypeDemande = 'rappel'

/** Offre de pièces quand le catalogue ne répond pas : rien n'est promis. */
const OFFRE_PIECES_INCONNUE: OffrePieces = { engagementVerification: null, venteAuComptoir: false }

/** Au-delà, un identifiant de famille ou un code de pré-diagnostic n'est pas cherché. */
const LONGUEUR_MAX_REFERENCE = 120

/** Paramètres bruts de `/demande` (adresse) ou des champs cachés du formulaire. */
export interface ParametresFormulaire {
  readonly type: string
  readonly famille: string
  readonly prediagnostic: string
  /**
   * `retrait` ou `pose` (paramètre d'adresse) : le choix à pré-cocher. Absent
   * au réaffichage d'un envoi, où la saisie du client fait foi.
   */
  readonly modalite?: string
  /**
   * Nom d'une pièce de la famille (paramètre d'adresse `piece`, lien d'un
   * tarif) : la case à pré-cocher. Absent au réaffichage d'un envoi.
   */
  readonly piece?: string
  /**
   * Nom d'une prestation de la famille (paramètre `prestation`, lien d'un
   * tarif : « Révision ») ; gardé en champ caché d'un type à l'autre.
   */
  readonly prestation?: string
}

export interface PreDiagnosticJoint {
  readonly code: string
  readonly resume: ResumePreDiagnostic
}

/**
 * Références retrouvées par le serveur, gardées en champs cachés d'un type de
 * demande à l'autre : le client qui passe du rappel au devis puis revient ne
 * perd pas son pré-diagnostic. Jamais un texte de l'adresse qui n'a pas été
 * reconnu (piège 40).
 */
export interface RattachementsConserves {
  readonly famille: string | null
  readonly prediagnostic: string | null
  /** Prestation reconnue dans la famille (nom exact du catalogue), ou `null`. */
  readonly prestation: string | null
}

/** Tout ce qu'il faut pour afficher le formulaire : aucune valeur n'y vient du client sans contrôle. */
export interface FormulaireDemande {
  readonly type: TypeDemande
  readonly rattachements: RattachementsConserves
  /** Famille du catalogue retrouvée par le serveur (devis, rendez-vous). */
  readonly famille: ReferenceFamille | null
  /**
   * Prestation nommée de la famille (« Révision »), reconnue par le serveur
   * (devis, rendez-vous) : ni pièces, ni gamme, ni retrait ; `null` sinon.
   */
  readonly prestation: string | null
  /** Pré-diagnostic retrouvé par le serveur (rappel), résumé affiché et transmis. */
  readonly preDiagnostic: PreDiagnosticJoint | null
  /** Demi-journées à cocher (rendez-vous) ; vide tant que le garage n'a rien confirmé. */
  readonly demiJournees: readonly DemiJourneeProposee[]
  /** « Ce que nous ne faisons pas », dit avant que le client ne remplisse (US-44). */
  readonly ceQueNousNeFaisonsPas: readonly string[]
  /** Offre de pièces du catalogue (devis) : engagement de vérification (US-28). */
  readonly offrePieces: OffrePieces
  /**
   * Retrait ou pose pré-coché par l'adresse (devis, vente au comptoir
   * publiée) ; `null` : rien de pré-coché.
   */
  readonly modalitePreselectionnee: ModalitePiece | null
  /** Pièces pré-cochées par l'adresse (`piece`), noms exacts du catalogue ; vide sinon. */
  readonly piecesPreselectionnees: readonly string[]
  readonly anneeCourante: number
  /** Jeton signé du formulaire : date d'affichage et envoi unique. */
  readonly jeton: string
}

export interface DependancesPreparerFormulaire {
  readonly horloge: Horloge
  readonly jetons: SignatureJetons
  readonly journal: Journal
  readonly trouverFamille: TrouverFamille
  readonly retrouverResumePreDiagnostic: RetrouverResumePreDiagnostic
  readonly proposerDemiJournees: ProposerDemiJournees
  readonly listerCeQueNousNeFaisonsPas: ListerCeQueNousNeFaisonsPas
  readonly consulterOffrePieces: ConsulterOffrePieces
}

/**
 * Prépare le formulaire unique `/demande`. `jeton` : celui de l'envoi en cours
 * (réaffichage après erreur) ; absent, un nouveau jeton est émis maintenant.
 */
export type PreparerFormulaire = (
  parametres: ParametresFormulaire,
  jeton?: string,
) => Promise<FormulaireDemande>

export function creerPreparerFormulaire(
  dependances: DependancesPreparerFormulaire,
): PreparerFormulaire {
  const { horloge, jetons, journal } = dependances

  /** Une capacité voisine en panne ne doit pas empêcher d'écrire au garage : on s'en passe. */
  async function interroger<T>(capacite: string, appel: () => Promise<T>, defaut: T): Promise<T> {
    try {
      return await appel()
    } catch (erreur) {
      journal.erreur(`Capacité « ${capacite} » en échec : formulaire affiché sans elle`, {
        erreur: erreur instanceof Error ? erreur.message : String(erreur),
      })
      return defaut
    }
  }

  return async (parametres, jeton) => {
    const maintenant = horloge.maintenant()
    const type = lireType(parametres.type) ?? TYPE_PAR_DEFAUT
    const identifiantFamille = referenceUtilisable(parametres.famille)
    const code = referenceUtilisable(parametres.prediagnostic)
    // Famille et pré-diagnostic sont retrouvés quel que soit le type, pour
    // rester attachés au formulaire d'un type à l'autre ; chacun ne s'affiche
    // que sur le type qui s'en sert.
    const [famille, resume, demiJournees, ceQueNousNeFaisonsPas, offrePieces] = await Promise.all([
      identifiantFamille !== null
        ? interroger('trouverFamille', () => dependances.trouverFamille(identifiantFamille), null)
        : null,
      code !== null
        ? interroger(
            'retrouverResumePreDiagnostic',
            () => dependances.retrouverResumePreDiagnostic(code),
            null,
          )
        : null,
      type === 'rendez-vous'
        ? interroger('proposerDemiJournees', () => dependances.proposerDemiJournees(maintenant), [])
        : [],
      interroger('listerCeQueNousNeFaisonsPas', dependances.listerCeQueNousNeFaisonsPas, []),
      type === 'devis'
        ? interroger(
            'consulterOffrePieces',
            dependances.consulterOffrePieces,
            OFFRE_PIECES_INCONNUE,
          )
        : OFFRE_PIECES_INCONNUE,
    ])
    const prestation = prestationDuParametre(famille, parametres.prestation ?? '')
    return {
      type,
      rattachements: {
        famille: famille?.identifiant ?? null,
        prediagnostic: resume !== null ? code : null,
        prestation,
      },
      famille: type === 'rappel' ? null : famille,
      prestation: type === 'rappel' ? null : prestation,
      preDiagnostic:
        type === 'rappel' && resume !== null && code !== null ? { code, resume } : null,
      demiJournees,
      ceQueNousNeFaisonsPas,
      offrePieces,
      // Une prestation (carrosserie, révision, géométrie) ne se retire pas au comptoir.
      modalitePreselectionnee:
        type === 'devis' && offrePieces.venteAuComptoir && !sansPiece(famille, prestation)
          ? modaliteDuParametre(parametres.modalite ?? '')
          : null,
      piecesPreselectionnees:
        type === 'devis' && prestation === null
          ? pieceDuParametre(famille, parametres.piece ?? '')
          : [],
      anneeCourante: anneeAParis(maintenant),
      jeton: jeton ?? jetons.emettre('formulaire', maintenant),
    }
  }
}

function referenceUtilisable(texte: string): string | null {
  const reference = texte.trim()
  return reference === '' || reference.length > LONGUEUR_MAX_REFERENCE ? null : reference
}
