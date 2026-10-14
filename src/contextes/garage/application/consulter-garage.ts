import type { IdentiteGaragePublique, ModeSite, StatutOuverture } from '../../../contrats/index.js'
import { estConnu } from '../domaine/calendrier.js'
import { decrireSemaineGlissante, type LigneHoraire } from '../domaine/description-horaires.js'
import type { Fermeture } from '../domaine/fermeture.js'
import type { Garage, MoyenPaiement, PhotoFacade } from '../domaine/garage.js'
import type { SemaineType } from '../domaine/horaires.js'
import { calculerStatutOuverture } from '../domaine/statut-ouverture.js'
import { instantLocal } from '../domaine/temps-local.js'
import { ENGAGEMENTS } from '../domaine/textes.js'
import { publier, type Publication, type ValeurPubliee } from '../domaine/valeur-publiee.js'
import { lireCalendrierPublie } from './calendrier-publie.js'
import type { DepotFermetures, SourceIdentiteGarage } from './ports.js'

/** Mention ajoutée en mode relecture là où le texte ne peut pas être surligné. */
export const MENTION_A_VALIDER = ' (à valider)'
const MENTION_HORAIRES_A_VALIDER = ' (horaires à valider)'

export interface HorairesPublies {
  /** Les sept prochains jours, aujourd'hui en tête. */
  readonly semaineGlissante: readonly LigneHoraire[]
  readonly semaineType: SemaineType
  readonly aSurligner: boolean
}

export type CleEngagement = keyof typeof ENGAGEMENTS

export interface EngagementPublie {
  readonly cle: CleEngagement
  readonly texte: string
  readonly aSurligner: boolean
}

/** Les deux engagements bloquants du socle de confiance (Kano D6). */
const ENGAGEMENTS_DU_SOCLE: readonly CleEngagement[] = ['devisEcrit', 'appelAvantSupplement']

/** Ce que le public voit du garage à un instant donné, dans le mode du site. */
export interface FicheGarage {
  readonly identite: IdentiteGaragePublique
  readonly ancienNom: Publication<string>
  /** Ce que fait l'atelier, en une phrase : toutes les pages publiques le disent pareil. */
  readonly activites: Publication<string>
  readonly statut: StatutOuverture
  /** `null` tant qu'aucune semaine n'est publiable : aucune heure n'est inventée. */
  readonly horaires: HorairesPublies | null
  readonly fermeturesAVenir: readonly Fermeture[]
  readonly prenomGaragiste: Publication<string>
  readonly photoFacade: Publication<PhotoFacade>
  readonly engagements: readonly EngagementPublie[]
  /** Les deux engagements du socle sont publiés : « travaux sans accord » a sa réponse. */
  readonly engagementsDuSoclePublies: boolean
  readonly accueilSansRendezVous: Publication<boolean>
  /** Ouvert maintenant et accueil sans rendez-vous publié (Kano B-29, US-45). */
  readonly passerSansRendezVous: boolean
  readonly moyensPaiement: Publication<readonly MoyenPaiement[]>
  readonly documentsAApporter: Publication<readonly string[]>
  readonly stationnement: Publication<string>
  readonly attenteSurPlace: Publication<string>
  readonly enseigneActuelle: Publication<string>
  readonly reperes: Publication<readonly string[]>
  /** Arrêts de tramway et de bus proches, relevés sur une source officielle. */
  readonly transports: Publication<readonly string[]>
  readonly memeExploitant: Publication<boolean>
  /** Lien d'avis Google, seulement s'il est validé (sinon `/avis` répond 404). */
  readonly lienAvis: string | null
}

export type ConsulterGarage = (maintenant: Date) => Promise<FicheGarage>

export function creerConsulterGarage(
  source: SourceIdentiteGarage,
  depot: DepotFermetures,
  mode: ModeSite,
): ConsulterGarage {
  return async (maintenant) => {
    const garage = await source.charger()
    const local = instantLocal(maintenant)
    const { calendrier, fermetures, semaineASurligner } = await lireCalendrierPublie(
      garage,
      depot,
      mode,
      local.date,
    )
    const statutCalcule = calculerStatutOuverture(calendrier, maintenant)
    const statut =
      semaineASurligner && statutCalcule.etat !== 'a-confirmer'
        ? { ...statutCalcule, libelle: `${statutCalcule.libelle}${MENTION_HORAIRES_A_VALIDER}` }
        : statutCalcule
    const engagements = engagementsPublies(garage, mode)
    const engagementsDuSoclePublies = ENGAGEMENTS_DU_SOCLE.every((cle) =>
      engagements.some((engagement) => engagement.cle === cle),
    )
    const accueilSansRendezVous = publier(garage.socle.accueilSansRendezVous, mode)
    const { pratique } = garage
    return {
      identite: identitePublique(garage, engagementsDuSoclePublies, mode),
      ancienNom: publier(garage.identite.ancienNom, mode),
      activites: publier(garage.identite.activites, mode),
      statut,
      horaires: estConnu(calendrier)
        ? {
            semaineGlissante: decrireSemaineGlissante(calendrier, local.date),
            semaineType: calendrier.semaine,
            aSurligner: semaineASurligner,
          }
        : null,
      fermeturesAVenir: fermetures,
      prenomGaragiste: publier(garage.socle.prenomGaragiste, mode),
      photoFacade: publier(garage.socle.photoFacade, mode),
      engagements,
      engagementsDuSoclePublies,
      accueilSansRendezVous,
      passerSansRendezVous:
        statutCalcule.etat === 'ouvert' &&
        accueilSansRendezVous.visible &&
        accueilSansRendezVous.valeur,
      moyensPaiement: publier(pratique.moyensPaiement, mode),
      documentsAApporter: publier(pratique.documentsAApporter, mode),
      stationnement: publier(pratique.stationnement, mode),
      attenteSurPlace: publier(pratique.attenteSurPlace, mode),
      enseigneActuelle: publier(pratique.enseigneActuelle, mode),
      reperes: publier(pratique.reperes, mode),
      transports: publier(pratique.transports, mode),
      memeExploitant: publier(garage.suivi.memeExploitant, mode),
      lienAvis:
        garage.suivi.lienAvisGoogle.statut === 'valide' ? garage.suivi.lienAvisGoogle.valeur : null,
    }
  }
}

/** Un engagement ne se publie que s'il est pris (valeur vraie). */
function engagementsPublies(garage: Garage, mode: ModeSite): readonly EngagementPublie[] {
  const sources: readonly (readonly [CleEngagement, ValeurPubliee<boolean>])[] = [
    ['devisEcrit', garage.socle.devisEcritAvantTravaux],
    ['appelAvantSupplement', garage.socle.appelAvantTravauxSupplementaires],
    ['piecesRestituees', garage.pratique.piecesRemplaceesRestituees],
  ]
  return sources.flatMap(([cle, valeur]) => {
    const publication = publier(valeur, mode)
    return publication.visible && publication.valeur
      ? [{ cle, texte: ENGAGEMENTS[cle], aSurligner: publication.aSurligner }]
      : []
  })
}

/**
 * Identité pour l'en-tête, l'accueil et le pied de page. L'accroche n'est
 * affichée que si les deux engagements du socle sont publiés (Kano D7) ;
 * sinon, un titre factuel qui ne restreint pas l'atelier à la mécanique (il
 * fait aussi la carrosserie, décision d'Anthony du 2026-09-24). Les activités
 * (« Mécanique, entretien, carrosserie et peinture, toutes marques ») suivent,
 * une fois publiées : la couche web les dit sous l'accroche, dès le premier
 * écran (champ `activites` du contrat, facultatif).
 */
function identitePublique(
  garage: Garage,
  engagementsDuSoclePublies: boolean,
  mode: ModeSite,
): IdentiteGaragePublique {
  const { identite } = garage
  const accroche = publier(identite.accroche, mode)
  const accrochePubliable = accroche.visible && engagementsDuSoclePublies
  const courriel = publier(identite.courriel, mode)
  const coordonnees = publier(identite.coordonnees, mode)
  const activites = publier(identite.activites, mode)
  return {
    nom: identite.nom.valeur,
    accroche: accrochePubliable
      ? `${accroche.valeur}${accroche.aSurligner ? MENTION_A_VALIDER : ''}`
      : `${identite.nom.valeur}, garage automobile à ${identite.adresse.valeur.ville}`,
    ...(activites.visible && {
      activites: `${activites.valeur}${activites.aSurligner ? MENTION_A_VALIDER : ''}`,
    }),
    adresse: identite.adresse.valeur,
    telephone: identite.telephone.valeur,
    ...(courriel.visible && { courriel: courriel.valeur }),
    ...(coordonnees.visible && { coordonnees: coordonnees.valeur }),
  }
}
