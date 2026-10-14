import {
  TYPES_DEMANDE,
  type DemiJourneeProposee,
  type ReferenceFamille,
  type ResumePreDiagnostic,
  type TypeDemande,
} from '../../../contrats/index.js'
import { champsObligatoires, type ChampDemande, type ChampObligatoire } from './champs.js'
import type { ContenuDemande, CreneauChoisi, Sujet } from './demande.js'
import {
  CRENEAUX_MAXIMUM,
  enLettres,
  CRENEAUX_MINIMUM,
  CRENEAUX_TOUJOURS_PROPOSES,
  GAMMES,
  MODALITES_PIECE,
  MOMENTS_RAPPEL,
  MOTIFS_RAPPEL,
  OBJETS_DEMANDE,
  PIECE_INCONNUE,
  trouverChoix,
  type Gamme,
  type ModalitePiece,
} from './referentiels.js'
import { occasionPossible, piecesProposees, sansPiece } from './famille.js'
import { normaliserTelephoneClient } from './telephone.js'
import { lireVehicule, suffitPourUnDevis, type SaisieVehicule } from './vehicule.js'

/** Saisie brute du client, champ par champ, telle que le formulaire l'envoie. */
export interface SaisieDemande extends SaisieVehicule {
  readonly type: string
  readonly objet: string
  readonly motif: string
  readonly creneaux: readonly string[]
  /** Pièces cochées (devis d'une famille qui les publie) : noms du catalogue ou `je-ne-sais-pas`. */
  readonly pieces: readonly string[]
  readonly gamme: string
  readonly modalite: string
  readonly prenom: string
  readonly telephone: string
  readonly moment: string
  readonly precisions: string
}

/** Ce que le serveur sait déjà au moment de valider : rien de cela ne vient du client. */
export interface ContexteValidation {
  /** Demi-journées proposées à l'instant de l'envoi (rendez-vous). */
  readonly demiJournees: readonly DemiJourneeProposee[]
  readonly anneeCourante: number
  /** Famille du catalogue retrouvée côté serveur à partir de son identifiant. */
  readonly famille: ReferenceFamille | null
  /**
   * Prestation de la famille reconnue côté serveur (« Révision ») : ni pièces,
   * ni gamme, ni retrait, et c'est elle que le garage lit comme sujet. Absente : aucune.
   */
  readonly prestation?: string | null
  /** Résumé du pré-diagnostic retrouvé côté serveur à partir de son code. */
  readonly resume: ResumePreDiagnostic | null
  /** Vente au comptoir publiée par le catalogue : « Retrait au garage » est alors proposé. */
  readonly venteAuComptoir: boolean
}

export type ErreursSaisie = Partial<Record<ChampDemande, string>>

export type ResultatValidation =
  | { readonly ok: true; readonly contenu: ContenuDemande }
  | { readonly ok: false; readonly erreurs: ErreursSaisie }

export const LONGUEUR_MAX_PRENOM = 60
export const LONGUEUR_MAX_PRECISIONS = 500

export const MESSAGES = {
  type: 'Choisissez le type de demande.',
  objet: 'Choisissez une intervention dans la liste.',
  motif: 'Choisissez l’objet de votre appel.',
  creneauxAucun: 'Cochez au moins une possibilité, par exemple «\u00a0Le plus tôt possible\u00a0».',
  creneauxTrop: `Cochez ${enLettres(CRENEAUX_MAXIMUM)} possibilités au plus.`,
  creneauxPerime:
    'Une demi-journée cochée n’est plus proposée : choisissez dans la liste mise à jour.',
  vehicule:
    'Indiquez la plaque, ou la marque, le modèle, l’année et l’énergie : sans cela, nous devrons vous rappeler pour le demander.',
  pieces: 'Cochez les pièces dans la liste proposée.',
  gamme: 'Choisissez le type de pièce dans la liste.',
  modalite: 'Choisissez «\u00a0Retrait au garage\u00a0» ou «\u00a0Pose à l’atelier\u00a0».',
  prenom: 'Indiquez votre prénom.',
  prenomLong: `Votre prénom ne doit pas dépasser ${LONGUEUR_MAX_PRENOM} caractères.`,
  telephone: 'Indiquez votre numéro de téléphone.',
  telephoneInvalide:
    'Numéro non reconnu : indiquez un numéro français à 10 chiffres, par exemple 06 12 34 56 78.',
  moment: 'Indiquez quand vous pouvez répondre au téléphone.',
  precisions: `Vos précisions ne doivent pas dépasser ${LONGUEUR_MAX_PRECISIONS} caractères.`,
} as const

/** Caractères de contrôle (U+0000 à U+001F, U+007F à U+009F), retour à la ligne excepté. */
const CONTROLE_SAUF_RETOUR_LIGNE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g
const CONTROLE = /\p{Cc}/gu
const ESPACES_MULTIPLES = /[^\S\n]+/g
const LIGNES_VIDES_MULTIPLES = /\n{3,}/g

/** Texte d'une ligne : caractères de contrôle retirés, espaces resserrés. */
export function nettoyerLigne(texte: string): string {
  return texte.replace(CONTROLE, ' ').replace(/\s+/g, ' ').trim()
}

/** Texte de plusieurs lignes : retours à la ligne gardés, le reste nettoyé. */
function nettoyerParagraphe(texte: string): string {
  return texte
    .replace(/\r\n?/g, '\n')
    .replace(CONTROLE_SAUF_RETOUR_LIGNE, ' ')
    .replace(ESPACES_MULTIPLES, ' ')
    .replace(LIGNES_VIDES_MULTIPLES, '\n\n')
    .trim()
}

export function lireType(saisie: string): TypeDemande | null {
  return TYPES_DEMANDE.find((type) => type === saisie) ?? null
}

/**
 * Valide une demande : chaque erreur nomme son champ et dit quoi faire. Les
 * champs obligatoires viennent de `champsObligatoires`, source unique.
 */
export function validerDemande(
  saisie: SaisieDemande,
  contexte: ContexteValidation,
): ResultatValidation {
  const type = lireType(saisie.type)
  if (type === null) return { ok: false, erreurs: { type: MESSAGES.type } }

  const famille = type === 'rappel' ? null : contexte.famille
  const resume = type === 'rappel' ? contexte.resume : null
  const obligatoires = new Set<ChampObligatoire>(
    champsObligatoires(type, { familleCitee: famille !== null, preDiagnostic: resume !== null }),
  )
  const erreurs: ErreursSaisie = {}

  const prestation = famille === null ? null : (contexte.prestation ?? null)
  const sujet = lireSujet(saisie, famille, prestation, resume, obligatoires, erreurs)
  const creneaux = obligatoires.has('creneaux')
    ? lireCreneaux(saisie.creneaux, contexte.demiJournees, erreurs)
    : []

  const vehicule = lireVehicule(saisie, contexte.anneeCourante)
  if (!vehicule.ok) Object.assign(erreurs, vehicule.erreurs)
  if (vehicule.ok && obligatoires.has('vehicule') && !suffitPourUnDevis(vehicule.vehicule)) {
    erreurs.vehicule = MESSAGES.vehicule
  }

  // Une prestation (carrosserie, révision, géométrie) n'a ni pièces, ni gamme,
  // ni retrait : rien de reçu n'est retenu.
  const sansPieces = sansPiece(famille, prestation)
  const pieces = type === 'devis' && !sansPieces ? lirePieces(saisie.pieces, famille, erreurs) : []
  const gamme =
    type === 'devis' && !sansPieces
      ? lireGamme(saisie.gamme, occasionPossible(famille), erreurs)
      : null
  // Sans vente au comptoir publiée, le choix n'est pas proposé : rien de reçu n'est retenu.
  const modalite =
    type === 'devis' && contexte.venteAuComptoir && !sansPieces
      ? lireModalite(saisie.modalite, erreurs)
      : null

  const precisions = nettoyerParagraphe(saisie.precisions)
  if (precisions.length > LONGUEUR_MAX_PRECISIONS) erreurs.precisions = MESSAGES.precisions

  const prenom = nettoyerLigne(saisie.prenom)
  if (prenom === '') erreurs.prenom = MESSAGES.prenom
  else if (prenom.length > LONGUEUR_MAX_PRENOM) erreurs.prenom = MESSAGES.prenomLong

  const telephoneSaisi = nettoyerLigne(saisie.telephone)
  const telephone = normaliserTelephoneClient(telephoneSaisi)
  if (telephoneSaisi === '') erreurs.telephone = MESSAGES.telephone
  else if (telephone === null) erreurs.telephone = MESSAGES.telephoneInvalide

  const moment = trouverChoix(MOMENTS_RAPPEL, saisie.moment)?.code ?? null
  if (moment === null) erreurs.moment = MESSAGES.moment

  if (
    Object.keys(erreurs).length > 0 ||
    sujet === null ||
    !vehicule.ok ||
    telephone === null ||
    moment === null
  ) {
    return { ok: false, erreurs }
  }
  return {
    ok: true,
    contenu: {
      type,
      sujet,
      creneaux,
      vehicule: vehicule.vehicule,
      pieces,
      gamme,
      modalite,
      contact: { prenom, telephone, moment },
      precisions: precisions === '' ? null : precisions,
    },
  }
}

function lireSujet(
  saisie: SaisieDemande,
  famille: ReferenceFamille | null,
  prestation: string | null,
  resume: ResumePreDiagnostic | null,
  obligatoires: ReadonlySet<ChampObligatoire>,
  erreurs: ErreursSaisie,
): Sujet | null {
  if (resume !== null) return { nature: 'pre-diagnostic', resume }
  // Une prestation se lit sous son nom (« Révision ») : le garage sait ce qui est demandé.
  if (famille !== null && prestation !== null) {
    return { nature: 'famille', famille: { identifiant: famille.identifiant, libelle: prestation } }
  }
  if (famille !== null) return { nature: 'famille', famille }
  if (obligatoires.has('motif')) {
    const motif = trouverChoix(MOTIFS_RAPPEL, saisie.motif)?.code ?? null
    if (motif === null) erreurs.motif = MESSAGES.motif
    return motif === null ? null : { nature: 'motif', motif }
  }
  const objet = trouverChoix(OBJETS_DEMANDE, saisie.objet)?.code ?? null
  if (objet === null) erreurs.objet = MESSAGES.objet
  return objet === null ? null : { nature: 'objet', objet }
}

function lireCreneaux(
  codes: readonly string[],
  demiJournees: readonly DemiJourneeProposee[],
  erreurs: ErreursSaisie,
): readonly CreneauChoisi[] {
  const proposes: readonly CreneauChoisi[] = [...demiJournees, ...CRENEAUX_TOUJOURS_PROPOSES]
  const uniques = [...new Set(codes.filter((code) => code !== ''))]
  const choisis = uniques.flatMap((code) => proposes.filter((creneau) => creneau.code === code))
  if (choisis.length < uniques.length) erreurs.creneaux = MESSAGES.creneauxPerime
  else if (choisis.length < CRENEAUX_MINIMUM) erreurs.creneaux = MESSAGES.creneauxAucun
  else if (choisis.length > CRENEAUX_MAXIMUM) erreurs.creneaux = MESSAGES.creneauxTrop
  // L'ordre de la liste proposée, pas celui de l'envoi : le garagiste lit dans l'ordre du calendrier.
  return proposes.filter((creneau) => choisis.includes(creneau))
}

export { piecesProposees }

/**
 * Facultatives : aucune case ne vaut « à voir au téléphone ». Seuls les noms
 * proposés par le catalogue et « Je ne sais pas » sont admis, dans l'ordre
 * de la liste ; « Je ne sais pas » garde son libellé pour le garagiste.
 */
function lirePieces(
  codes: readonly string[],
  famille: ReferenceFamille | null,
  erreurs: ErreursSaisie,
): readonly string[] {
  const proposees = piecesProposees(famille)
  const cochees = new Set(codes.filter((code) => code !== ''))
  if (cochees.size === 0) return []
  const connues = [...proposees, PIECE_INCONNUE.code]
  if (proposees.length === 0 || [...cochees].some((code) => !connues.includes(code))) {
    erreurs.pieces = MESSAGES.pieces
    return []
  }
  return connues
    .filter((code) => cochees.has(code))
    .map((code) => (code === PIECE_INCONNUE.code ? PIECE_INCONNUE.libelle : code))
}

/** Facultative : aucun choix ne vaut « à voir au téléphone ». */
function lireModalite(saisie: string, erreurs: ErreursSaisie): ModalitePiece | null {
  if (saisie === '') return null
  const modalite = trouverChoix(MODALITES_PIECE, saisie)?.code ?? null
  if (modalite === null) erreurs.modalite = MESSAGES.modalite
  return modalite
}

/** Gammes proposées : sans l'occasion pour une famille exclue du réemploi (freinage). */
export function gammesProposees(occasion: boolean): readonly (typeof GAMMES)[number][] {
  return occasion ? GAMMES : GAMMES.filter((gamme) => gamme.code !== 'occasion')
}

function lireGamme(saisie: string, occasion: boolean, erreurs: ErreursSaisie): Gamme {
  if (saisie === '') return 'sans-preference'
  const gamme = trouverChoix(gammesProposees(occasion), saisie)?.code ?? null
  if (gamme === null) erreurs.gamme = MESSAGES.gamme
  return gamme ?? 'sans-preference'
}
