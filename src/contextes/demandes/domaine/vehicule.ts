import { EXEMPLE_PLAQUE_FNI, EXEMPLE_PLAQUE_SIV, normaliserPlaque } from './plaque.js'
import {
  ANNEE_MINIMALE,
  CODE_ANNEE_ANCIENNE,
  ENERGIES,
  LIBELLE_ANNEE_ANCIENNE,
  MARQUES,
  libelleDe,
  trouverChoix,
  type Energie,
  type Marque,
} from './referentiels.js'

/** Année du véhicule : un millésime de la liste, ou « avant 1990 ». */
export type AnneeVehicule = number | typeof CODE_ANNEE_ANCIENNE

/**
 * Objet valeur : ce que le client sait de son véhicule. Chaque partie est
 * facultative ; un devis exige la plaque, ou à défaut marque, modèle, année et
 * énergie (P-07), le seul cas où ces quatre champs deviennent nécessaires.
 */
export interface Vehicule {
  readonly plaque: string | null
  readonly marque: Marque | null
  readonly modele: string | null
  readonly annee: AnneeVehicule | null
  readonly energie: Energie | null
}

export interface SaisieVehicule {
  readonly plaque: string
  readonly marque: string
  readonly modele: string
  readonly annee: string
  readonly energie: string
}

export type ChampVehicule = keyof SaisieVehicule

export const LONGUEUR_MAX_MODELE = 40

export const MESSAGES_VEHICULE = {
  plaque: `Plaque non reconnue. Formats attendus : ${EXEMPLE_PLAQUE_SIV} (depuis 2009) ou ${EXEMPLE_PLAQUE_FNI} (ancien format).`,
  marque: 'Choisissez la marque dans la liste.',
  modele: `Le modèle ne doit pas dépasser ${LONGUEUR_MAX_MODELE} caractères.`,
  annee: 'Choisissez l’année dans la liste.',
  energie: 'Choisissez l’énergie dans la liste.',
} as const satisfies Record<ChampVehicule, string>

export type LectureVehicule =
  | { readonly ok: true; readonly vehicule: Vehicule | null }
  | { readonly ok: false; readonly erreurs: Partial<Record<ChampVehicule, string>> }

const ESPACES_MULTIPLES = /\s+/g
const CARACTERES_DE_CONTROLE = /\p{Cc}/gu

/** Années proposées, de l'année en cours à l'année minimale, la plus récente d'abord. */
export function anneesProposees(anneeCourante: number): readonly number[] {
  const annees: number[] = []
  for (let annee = anneeCourante; annee >= ANNEE_MINIMALE; annee -= 1) annees.push(annee)
  return annees
}

/**
 * Lit la saisie du véhicule. Un champ laissé vide est simplement absent ; un
 * champ rempli doit être valide. Un véhicule entièrement vide vaut `null`.
 */
export function lireVehicule(saisie: SaisieVehicule, anneeCourante: number): LectureVehicule {
  const erreurs: Partial<Record<ChampVehicule, string>> = {}
  const texte = (valeur: string) =>
    valeur.replace(CARACTERES_DE_CONTROLE, ' ').replace(ESPACES_MULTIPLES, ' ').trim()

  const plaqueSaisie = texte(saisie.plaque)
  const plaque = plaqueSaisie === '' ? null : normaliserPlaque(plaqueSaisie)
  if (plaqueSaisie !== '' && plaque === null) erreurs.plaque = MESSAGES_VEHICULE.plaque

  const marqueSaisie = texte(saisie.marque)
  const marque = marqueSaisie === '' ? null : (trouverChoix(MARQUES, marqueSaisie)?.code ?? null)
  if (marqueSaisie !== '' && marque === null) erreurs.marque = MESSAGES_VEHICULE.marque

  const modeleSaisi = texte(saisie.modele)
  if (modeleSaisi.length > LONGUEUR_MAX_MODELE) erreurs.modele = MESSAGES_VEHICULE.modele
  const modele = modeleSaisi === '' ? null : modeleSaisi

  const anneeSaisie = texte(saisie.annee)
  const annee = anneeSaisie === '' ? null : lireAnnee(anneeSaisie, anneeCourante)
  if (anneeSaisie !== '' && annee === null) erreurs.annee = MESSAGES_VEHICULE.annee

  const energieSaisie = texte(saisie.energie)
  const energie =
    energieSaisie === '' ? null : (trouverChoix(ENERGIES, energieSaisie)?.code ?? null)
  if (energieSaisie !== '' && energie === null) erreurs.energie = MESSAGES_VEHICULE.energie

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs }
  const vehicule: Vehicule = { plaque, marque, modele, annee, energie }
  return { ok: true, vehicule: estVide(vehicule) ? null : vehicule }
}

function lireAnnee(saisie: string, anneeCourante: number): AnneeVehicule | null {
  if (saisie === CODE_ANNEE_ANCIENNE) return CODE_ANNEE_ANCIENNE
  if (!/^\d{4}$/.test(saisie)) return null
  const annee = Number(saisie)
  return annee >= ANNEE_MINIMALE && annee <= anneeCourante ? annee : null
}

function estVide(vehicule: Vehicule): boolean {
  return Object.values(vehicule).every((valeur) => valeur === null)
}

/** Assez pour chiffrer un devis sans rappeler le client : la plaque, ou les quatre éléments. */
export function suffitPourUnDevis(vehicule: Vehicule | null): boolean {
  if (vehicule === null) return false
  if (vehicule.plaque !== null) return true
  return (
    vehicule.marque !== null &&
    vehicule.modele !== null &&
    vehicule.annee !== null &&
    vehicule.energie !== null
  )
}

/** Description lisible : « Peugeot 208, 2019, Essence, plaque AB-123-CD ». */
export function decrireVehicule(vehicule: Vehicule): string {
  const nom = [
    vehicule.marque === null ? null : libelleDe(MARQUES, vehicule.marque),
    vehicule.modele,
  ]
    .filter((partie): partie is string => partie !== null)
    .join(' ')
  const parties = [
    nom === '' ? null : nom,
    vehicule.annee === null ? null : libelleAnnee(vehicule.annee),
    vehicule.energie === null ? null : libelleDe(ENERGIES, vehicule.energie),
    vehicule.plaque === null ? null : `plaque ${vehicule.plaque}`,
  ].filter((partie): partie is string => partie !== null)
  return parties.join(', ')
}

export function libelleAnnee(annee: AnneeVehicule): string {
  return annee === CODE_ANNEE_ANCIENNE ? LIBELLE_ANNEE_ANCIENNE : String(annee)
}
