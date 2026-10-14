import type {
  NiveauUrgence,
  ReferenceFamille,
  ResumePreDiagnostic,
  TelephonePublic,
  TypeDemande,
} from '../../../contrats/index.js'
import type { EtatNotification } from './etat-notification.js'
import type { PromesseRappel } from './promesse.js'
import {
  MOTIFS_RAPPEL,
  OBJETS_DEMANDE,
  libelleDe,
  type Gamme,
  type ModalitePiece,
  type MomentRappel,
  type MotifRappel,
  type ObjetDemande,
} from './referentiels.js'
import type { Vehicule } from './vehicule.js'

/**
 * Ce qui amène le client. Un seul agrégat `Demande` pour tous les types (D4) :
 * le sujet dit d'où vient la demande et ce qu'elle porte déjà.
 */
export type Sujet =
  | { readonly nature: 'famille'; readonly famille: ReferenceFamille }
  | { readonly nature: 'objet'; readonly objet: ObjetDemande }
  | { readonly nature: 'motif'; readonly motif: MotifRappel }
  | { readonly nature: 'pre-diagnostic'; readonly resume: ResumePreDiagnostic }

/** Possibilité cochée pour un rendez-vous : une demi-journée proposée, ou un choix toujours présent. */
export interface CreneauChoisi {
  readonly code: string
  readonly libelle: string
}

export interface Contact {
  readonly prenom: string
  readonly telephone: TelephonePublic
  readonly moment: MomentRappel
}

/** Contenu validé d'une demande, avant qu'elle reçoive identité et date. */
export interface ContenuDemande {
  readonly type: TypeDemande
  readonly sujet: Sujet
  /** Rendez-vous seulement ; vide pour les autres types. */
  readonly creneaux: readonly CreneauChoisi[]
  readonly vehicule: Vehicule | null
  /**
   * Devis d'une famille qui publie ses pièces : les pièces cochées, noms du
   * catalogue ou « Je ne sais pas », dans l'ordre proposé ; vide sinon.
   */
  readonly pieces: readonly string[]
  /** Devis seulement ; `null` pour les autres types. */
  readonly gamme: Gamme | null
  /** Devis seulement, et seulement si la vente au comptoir est publiée ; `null` si rien n'est choisi. */
  readonly modalite: ModalitePiece | null
  readonly contact: Contact
  readonly precisions: string | null
}

/** Deux statuts, changés par un seul bouton facultatif ; aucune mesure n'en dépend (D5, AE-34). */
export const STATUTS_DEMANDE = ['a-rappeler', 'traitee'] as const

export type StatutDemande = (typeof STATUTS_DEMANDE)[number]

export const LIBELLES_STATUT: Readonly<Record<StatutDemande, string>> = {
  'a-rappeler': 'À rappeler',
  traitee: 'Traitée',
}

export interface Demande extends ContenuDemande {
  /** Identifiant aléatoire : jamais séquentiel, il ne permet pas de deviner une autre demande (AE-40). */
  readonly id: string
  readonly recueLe: Date
  readonly statut: StatutDemande
  readonly statutChangeLe: Date | null
  readonly premiereConsultationLe: Date | null
  readonly notification: EtatNotification
  /** Rappel promis au client à l'envoi ; `null` : rien n'a été promis (aucun délai validé). */
  readonly promesse: PromesseRappel | null
  /** Appels restés sans réponse, notés par le garagiste, du plus ancien au plus récent. */
  readonly tentativesAppel: readonly Date[]
}

export interface IdentiteDemande {
  readonly id: string
  readonly recueLe: Date
  /** Ce que la confirmation annonce au client ; absent : rien de promis. */
  readonly promesse?: PromesseRappel | null
}

export function creerDemande(contenu: ContenuDemande, identite: IdentiteDemande): Demande {
  return {
    ...contenu,
    id: identite.id,
    recueLe: identite.recueLe,
    statut: 'a-rappeler',
    statutChangeLe: null,
    premiereConsultationLe: null,
    notification: { etat: 'en-attente' },
    promesse: identite.promesse ?? null,
    tentativesAppel: [],
  }
}

/** Niveau de conduite à tenir porté par le pré-diagnostic, s'il y en a un. */
export function urgenceDe(demande: ContenuDemande): NiveauUrgence | null {
  return demande.sujet.nature === 'pre-diagnostic' ? demande.sujet.resume.urgence : null
}

export function estUrgente(demande: ContenuDemande): boolean {
  return urgenceDe(demande) === 'ne-pas-rouler'
}

const LIBELLES_TYPE: Readonly<Record<TypeDemande, string>> = {
  'rendez-vous': 'Demande de rendez-vous',
  devis: 'Demande de devis',
  rappel: 'Demande de rappel',
}

/** « Demande de devis », ou « Rappel après pré-diagnostic » quand un pré-diagnostic l'accompagne. */
export function libelleTypeDemande(demande: ContenuDemande): string {
  return demande.sujet.nature === 'pre-diagnostic'
    ? 'Rappel après pré-diagnostic'
    : LIBELLES_TYPE[demande.type]
}

/**
 * Deux contenus disent-ils la même demande ? Oui pour deux envois du même
 * formulaire (double clic) ; non dès qu'un choix ou une saisie diffère (retour
 * arrière puis autre demande). Comparaison champ par champ, indépendante de
 * l'ordre des clés et des libellés.
 */
export function memeContenu(a: ContenuDemande, b: ContenuDemande): boolean {
  return empreinte(a) === empreinte(b)
}

function empreinte(contenu: ContenuDemande): string {
  const { contact, vehicule } = contenu
  return JSON.stringify([
    contenu.type,
    empreinteSujet(contenu.sujet),
    contenu.creneaux.map((creneau) => creneau.code),
    vehicule === null
      ? null
      : [vehicule.plaque, vehicule.marque, vehicule.modele, vehicule.annee, vehicule.energie],
    contenu.pieces,
    contenu.gamme,
    contenu.modalite,
    [contact.prenom, contact.telephone.lien, contact.moment],
    contenu.precisions,
  ])
}

function empreinteSujet(sujet: Sujet): readonly unknown[] {
  switch (sujet.nature) {
    case 'famille':
      // Le libellé distingue deux prestations d'une même famille (vidange, révision).
      return [sujet.nature, sujet.famille.identifiant, sujet.famille.libelle]
    case 'objet':
      return [sujet.nature, sujet.objet]
    case 'motif':
      return [sujet.nature, sujet.motif]
    case 'pre-diagnostic': {
      const { resume } = sujet
      return [
        sujet.nature,
        resume.symptome.identifiant,
        resume.urgence,
        resume.reponses.map((reponse) => [reponse.question, reponse.reponse]),
        resume.conclusion,
      ]
    }
  }
}

/** Le sujet en une ligne : famille, objet, motif ou symptôme du pré-diagnostic. */
export function decrireSujet(sujet: Sujet): string {
  switch (sujet.nature) {
    case 'famille':
      return sujet.famille.libelle
    case 'objet':
      return libelleDe(OBJETS_DEMANDE, sujet.objet)
    case 'motif':
      return libelleDe(MOTIFS_RAPPEL, sujet.motif)
    case 'pre-diagnostic':
      return sujet.resume.symptome.libelle
  }
}

/** Première lettre en minuscule, sauf pour un sigle (« ABS ») : la suite d'une phrase. */
function enSuiteDePhrase(texte: string): string {
  return /^\p{Lu}\p{Ll}/u.test(texte)
    ? `${texte.charAt(0).toLocaleLowerCase('fr-FR')}${texte.slice(1)}`
    : texte
}

/**
 * Le sujet avec son détail (J1 et J4, passe 2 du jury) : pour un
 * pré-diagnostic, le symptôme puis chaque réponse qui ne le redit pas
 * (« Un bruit inhabituel, quand je freine, un sifflement ou un grincement
 * aigu ») ; ailleurs, le sujet en une ligne.
 */
export function detailDuSujet(sujet: Sujet): string {
  if (sujet.nature !== 'pre-diagnostic') return decrireSujet(sujet)
  const { symptome, reponses } = sujet.resume
  const normaliser = (texte: string) => texte.trim().toLocaleLowerCase('fr-FR')
  const suite = reponses
    .map((reponse) => reponse.reponse.trim())
    .filter((reponse) => reponse !== '' && normaliser(reponse) !== normaliser(symptome.libelle))
    .map(enSuiteDePhrase)
  return [symptome.libelle, ...suite].join(', ')
}

/**
 * Change le statut. Remettre le même statut ne change rien, pas même la date :
 * la date du dernier changement sert à la purge (12 mois, D5).
 */
export function changerStatut(demande: Demande, statut: StatutDemande, instant: Date): Demande {
  if (demande.statut === statut) return demande
  return { ...demande, statut, statutChangeLe: instant }
}

/**
 * Deux appuis sur « Pas de réponse » à moins d'une minute d'écart (double
 * appui, second téléphone) ne comptent qu'un appel.
 */
export const ECART_MINIMAL_TENTATIVES_MS = 60_000

/**
 * Note un appel resté sans réponse : la demande reste « À rappeler ». Sur une
 * demande traitée, ou à moins d'une minute du précédent, rien ne change.
 */
export function noterTentativeAppel(demande: Demande, instant: Date): Demande {
  if (demande.statut !== 'a-rappeler') return demande
  const derniere = demande.tentativesAppel.at(-1)
  if (
    derniere !== undefined &&
    instant.getTime() - derniere.getTime() < ECART_MINIMAL_TENTATIVES_MS
  ) {
    return demande
  }
  return { ...demande, tentativesAppel: [...demande.tentativesAppel, instant] }
}

/**
 * Annule le dernier « Pas de réponse » (appui par erreur, J4, passe 2 du
 * jury) : la dernière tentative notée est retirée ; rien sur une demande
 * traitée ou sans tentative.
 */
export function retirerDerniereTentative(demande: Demande): Demande {
  if (demande.statut !== 'a-rappeler' || demande.tentativesAppel.length === 0) return demande
  return { ...demande, tentativesAppel: demande.tentativesAppel.slice(0, -1) }
}

/** La première consultation se note une fois ; les ouvertures suivantes ne la modifient pas (US-30). */
export function noterConsultation(demande: Demande, instant: Date): Demande {
  if (demande.premiereConsultationLe !== null) return demande
  return { ...demande, premiereConsultationLe: instant }
}
