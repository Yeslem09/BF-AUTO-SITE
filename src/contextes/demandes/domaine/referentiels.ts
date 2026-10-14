/**
 * Référentiels fermés des demandes : chaque choix proposé au client est une
 * liste connue (Kano, brief §4 : jamais de texte libre nu quand un choix suffit).
 * Le code sert au formulaire et au stockage, le libellé à l'affichage.
 */

import {
  MODALITES_DEMANDE,
  type ModaliteDemande,
  type MomentReponse,
} from '../../../contrats/index.js'

export interface Choix<C extends string> {
  readonly code: C
  readonly libelle: string
}

/**
 * « Quand pouvez-vous répondre au téléphone ? » (D4), obligatoire sur toute
 * demande. Les codes sont ceux du contrat `MomentReponse` : le garage en tient
 * compte pour annoncer son rappel.
 */
export const MOMENTS_RAPPEL = [
  { code: 'des-que-possible', libelle: 'Dès que possible' },
  { code: 'matin', libelle: 'Le matin' },
  { code: 'midi', libelle: 'À midi' },
  { code: 'fin-de-journee', libelle: 'En fin de journée' },
] as const satisfies readonly Choix<MomentReponse>[]

export type MomentRappel = (typeof MOMENTS_RAPPEL)[number]['code']

/** Motif du rappel simple, sans pré-diagnostic (formulaire court de l'accueil, D4). */
export const MOTIFS_RAPPEL = [
  { code: 'souci', libelle: 'Un souci avec ma voiture' },
  { code: 'devis', libelle: 'Un devis' },
  { code: 'rendez-vous', libelle: 'Un rendez-vous' },
  { code: 'autre', libelle: 'Une autre question' },
] as const satisfies readonly Choix<string>[]

export type MotifRappel = (typeof MOTIFS_RAPPEL)[number]['code']

/**
 * Objet d'un rendez-vous ou d'un devis quand aucune famille du catalogue n'est
 * citée (arrivée par la navigation plutôt que depuis une page de famille).
 */
export const OBJETS_DEMANDE = [
  { code: 'entretien', libelle: 'Un entretien ou une révision' },
  { code: 'souci', libelle: 'Un bruit, un voyant ou un souci à faire vérifier' },
  { code: 'reparation', libelle: 'Une réparation déjà identifiée' },
  { code: 'autre', libelle: 'Autre chose (à préciser dans les précisions)' },
] as const satisfies readonly Choix<string>[]

export type ObjetDemande = (typeof OBJETS_DEMANDE)[number]['code']

export const ENERGIES = [
  { code: 'essence', libelle: 'Essence' },
  { code: 'diesel', libelle: 'Diesel' },
  { code: 'hybride', libelle: 'Hybride' },
  { code: 'hybride-rechargeable', libelle: 'Hybride rechargeable' },
  { code: 'electrique', libelle: 'Électrique' },
  { code: 'gpl', libelle: 'GPL' },
  { code: 'e85', libelle: 'Superéthanol (E85)' },
] as const satisfies readonly Choix<string>[]

export type Energie = (typeof ENERGIES)[number]['code']

/** Gamme de pièce souhaitée pour un devis (US-28), facultative : « Sans préférence » par défaut. */
export const GAMMES = [
  { code: 'neuve', libelle: 'Neuve' },
  {
    code: 'occasion',
    libelle: 'D’occasion ou reconditionnée (pièce issue de l’économie circulaire)',
  },
  { code: 'sans-preference', libelle: 'Sans préférence' },
] as const satisfies readonly Choix<string>[]

export type Gamme = (typeof GAMMES)[number]['code']

/**
 * Retrait de la pièce au garage ou pose à l'atelier (arbitrage 4 du Kano,
 * vente au comptoir confirmée). Proposé sur le devis seulement quand le
 * catalogue publie la vente au comptoir ; facultatif, rien de pré-coché, sauf
 * si l'adresse le demande (`modalite=retrait` ou `modalite=pose`).
 */
export const MODALITES_PIECE = [
  { code: 'retrait-garage', libelle: 'Retrait au garage' },
  { code: 'pose-atelier', libelle: 'Pose à l’atelier' },
] as const satisfies readonly Choix<string>[]

export type ModalitePiece = (typeof MODALITES_PIECE)[number]['code']

/** Valeur du paramètre d'adresse (contrats) vers le code du formulaire. */
const MODALITE_DU_PARAMETRE: Readonly<Record<ModaliteDemande, ModalitePiece>> = {
  retrait: 'retrait-garage',
  pose: 'pose-atelier',
}

function estModaliteDemande(valeur: string): valeur is ModaliteDemande {
  return (MODALITES_DEMANDE as readonly string[]).includes(valeur)
}

/** Modalité à pré-cocher d'après le paramètre `modalite` de l'adresse ; `null` sinon. */
export function modaliteDuParametre(valeur: string): ModalitePiece | null {
  const parametre = valeur.trim()
  return estModaliteDemande(parametre) ? MODALITE_DU_PARAMETRE[parametre] : null
}

/** Intitulé de la modalité choisie, sur la confirmation, la fiche et la notification. */
export const LIBELLE_MODALITE = 'Retrait ou pose'

/** Marques courantes en France, puis « Autre marque » : la liste évite les fautes de saisie. */
export const MARQUES = [
  { code: 'abarth', libelle: 'Abarth' },
  { code: 'alfa-romeo', libelle: 'Alfa Romeo' },
  { code: 'alpine', libelle: 'Alpine' },
  { code: 'audi', libelle: 'Audi' },
  { code: 'bmw', libelle: 'BMW' },
  { code: 'byd', libelle: 'BYD' },
  { code: 'chevrolet', libelle: 'Chevrolet' },
  { code: 'citroen', libelle: 'Citroën' },
  { code: 'cupra', libelle: 'Cupra' },
  { code: 'dacia', libelle: 'Dacia' },
  { code: 'ds', libelle: 'DS' },
  { code: 'fiat', libelle: 'Fiat' },
  { code: 'ford', libelle: 'Ford' },
  { code: 'honda', libelle: 'Honda' },
  { code: 'hyundai', libelle: 'Hyundai' },
  { code: 'jaguar', libelle: 'Jaguar' },
  { code: 'jeep', libelle: 'Jeep' },
  { code: 'kia', libelle: 'Kia' },
  { code: 'land-rover', libelle: 'Land Rover' },
  { code: 'lexus', libelle: 'Lexus' },
  { code: 'mazda', libelle: 'Mazda' },
  { code: 'mercedes-benz', libelle: 'Mercedes-Benz' },
  { code: 'mg', libelle: 'MG' },
  { code: 'mini', libelle: 'Mini' },
  { code: 'mitsubishi', libelle: 'Mitsubishi' },
  { code: 'nissan', libelle: 'Nissan' },
  { code: 'opel', libelle: 'Opel' },
  { code: 'peugeot', libelle: 'Peugeot' },
  { code: 'porsche', libelle: 'Porsche' },
  { code: 'renault', libelle: 'Renault' },
  { code: 'seat', libelle: 'Seat' },
  { code: 'skoda', libelle: 'Škoda' },
  { code: 'smart', libelle: 'Smart' },
  { code: 'subaru', libelle: 'Subaru' },
  { code: 'suzuki', libelle: 'Suzuki' },
  { code: 'tesla', libelle: 'Tesla' },
  { code: 'toyota', libelle: 'Toyota' },
  { code: 'volkswagen', libelle: 'Volkswagen' },
  { code: 'volvo', libelle: 'Volvo' },
  { code: 'autre', libelle: 'Autre marque' },
] as const satisfies readonly Choix<string>[]

export type Marque = (typeof MARQUES)[number]['code']

/**
 * Pièces d'une famille cochées dans une demande de prix (J6, passe 1 du
 * jury) : les noms viennent du catalogue ; « Je ne sais pas » s'y ajoute
 * toujours, pour ne rien inventer quand le client ne sait pas.
 */
export const PIECE_INCONNUE = { code: 'je-ne-sais-pas', libelle: 'Je ne sais pas' } as const

/** Au plus, en cases : au-delà, le catalogue propose une liste qu'aucun client ne lira. */
export const PIECES_MAXIMUM = 12

/** Première année proposée dans la liste ; toute voiture plus ancienne est « Avant 1990 ». */
export const ANNEE_MINIMALE = 1990
export const CODE_ANNEE_ANCIENNE = 'avant-1990'
export const LIBELLE_ANNEE_ANCIENNE = `Avant ${ANNEE_MINIMALE}`

/** Deux possibilités toujours proposées pour un rendez-vous, même sans demi-journée confirmée (D4). */
export const CRENEAUX_TOUJOURS_PROPOSES = [
  { code: 'le-plus-tot', libelle: 'Le plus tôt possible' },
  { code: 'autre-date', libelle: 'Une autre date (nous en parlons au téléphone)' },
] as const satisfies readonly Choix<string>[]

/** Un rendez-vous propose d'une à trois possibilités (D4). */
export const CRENEAUX_MINIMUM = 1
export const CRENEAUX_MAXIMUM = 3

/** Libellé d'un code dans un référentiel, `null` si le code est inconnu. */
export function trouverChoix<C extends string>(
  referentiel: readonly Choix<C>[],
  code: string,
): Choix<C> | null {
  return referentiel.find((choix) => choix.code === code) ?? null
}

/** Libellé garanti d'un code déjà validé (le code vient du domaine, jamais d'une saisie). */
export function libelleDe<C extends string>(referentiel: readonly Choix<C>[], code: C): string {
  return trouverChoix(referentiel, code)?.libelle ?? code
}

const NOMBRES_EN_LETTRES: Readonly<Record<number, string>> = {
  1: 'une',
  2: 'deux',
  3: 'trois',
  4: 'quatre',
  5: 'cinq',
}

/** Petit nombre écrit en lettres dans une phrase (« de une à trois ») ; au-delà, en chiffres. */
export function enLettres(nombre: number): string {
  return NOMBRES_EN_LETTRES[nombre] ?? String(nombre)
}
