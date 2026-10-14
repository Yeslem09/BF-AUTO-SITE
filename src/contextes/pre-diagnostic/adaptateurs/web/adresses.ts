import { CHEMINS, PARAMETRES_DEMANDE, type TypeDemande } from '../../../../contrats/index.js'
import { ETAT_INITIAL, type EtatParcours } from '../../domaine/parcours.js'

/**
 * L'état du parcours voyage dans l'adresse, en codes fermés. Seuls des codes
 * connus de l'arbre en ressortent : l'adresse n'est jamais recopiée à l'écran.
 */
export const PARAMETRES_PARCOURS = {
  symptome: 'q1',
  signes: 'q2',
  reponse: 'r',
  coche: 'coche',
  etape: 'etape',
} as const

export const CHEMIN_LIVRET = `${CHEMINS.preDiagnostic}/livret`

const TYPE_RAPPEL: TypeDemande = 'rappel'
const TYPE_DEVIS: TypeDemande = 'devis'
const TYPE_RENDEZ_VOUS: TypeDemande = 'rendez-vous'
/** Au-delà, les valeurs d'un même paramètre sont ignorées : aucun parcours n'en a besoin d'autant. */
const MAX_VALEURS_PAR_PARAMETRE = 12

type Requete = Readonly<Record<string, unknown>>

export function lireEtat(requete: unknown): EtatParcours {
  const parametres = estRequete(requete) ? requete : {}
  const valeurs = (nom: string): readonly string[] => {
    const brut = parametres[nom]
    const liste = Array.isArray(brut) ? brut : [brut]
    return liste
      .filter((valeur): valeur is string => typeof valeur === 'string')
      .slice(0, MAX_VALEURS_PAR_PARAMETRE)
  }
  return {
    symptome: valeurs(PARAMETRES_PARCOURS.symptome)[0] ?? null,
    signes: valeurs(PARAMETRES_PARCOURS.signes),
    reponses: valeurs(PARAMETRES_PARCOURS.reponse),
    coches: valeurs(PARAMETRES_PARCOURS.coche),
    etapeEnvoyee: valeurs(PARAMETRES_PARCOURS.etape)[0] ?? null,
  }
}

/** Vrai pour l'entrée nue `/pre-diagnostic`, seule page du parcours ouverte aux moteurs. */
export function estRequeteVide(requete: unknown): boolean {
  return !estRequete(requete) || Object.keys(requete).length === 0
}

/** Adresse d'une étape : les réponses déjà données et, s'il y en a, la réponse à pré-cocher. */
export function adresseEtat(etat: EtatParcours): string {
  const parametres = new URLSearchParams()
  if (etat.symptome !== null) parametres.append(PARAMETRES_PARCOURS.symptome, etat.symptome)
  for (const signe of etat.signes) parametres.append(PARAMETRES_PARCOURS.signes, signe)
  for (const reponse of etat.reponses) parametres.append(PARAMETRES_PARCOURS.reponse, reponse)
  for (const coche of etat.coches) parametres.append(PARAMETRES_PARCOURS.coche, coche)
  const requete = parametres.toString()
  return requete === '' ? CHEMINS.preDiagnostic : `${CHEMINS.preDiagnostic}?${requete}`
}

/** Lien direct vers une réponse de la première question (accueil, page d'entrée). */
export function adresseSymptome(code: string): string {
  return adresseEtat({ ...ETAT_INITIAL, symptome: code })
}

/** Demande de rappel préremplie avec le parcours : `/demande?type=rappel&prediagnostic=<code>`. */
export function adresseRappel(code: string): string {
  const parametres = new URLSearchParams({
    [PARAMETRES_DEMANDE.type]: TYPE_RAPPEL,
    [PARAMETRES_DEMANDE.prediagnostic]: code,
  })
  return `${CHEMINS.demande}?${parametres.toString()}`
}

/**
 * Demande de prix préremplie depuis une piste qui désigne une famille :
 * `/demande?type=devis&famille=<identifiant>&prediagnostic=<code>`. La famille
 * choisit les pièces, le code transmet les réponses au garagiste.
 */
export function adresseDevis(famille: string, code: string): string {
  const parametres = new URLSearchParams({
    [PARAMETRES_DEMANDE.type]: TYPE_DEVIS,
    [PARAMETRES_DEMANDE.famille]: famille,
    [PARAMETRES_DEMANDE.prediagnostic]: code,
  })
  return `${CHEMINS.demande}?${parametres.toString()}`
}

/**
 * Rendez-vous prérempli quand le verdict est « faites contrôler » :
 * `/demande?type=rendez-vous&famille=<identifiant>&prediagnostic=<code>`. La
 * famille n'est posée que si les pistes n'en désignent qu'une ; le code reste
 * attaché au formulaire d'un type de demande à l'autre.
 */
export function adresseRendezVous(code: string, famille: string | null): string {
  const parametres = new URLSearchParams({ [PARAMETRES_DEMANDE.type]: TYPE_RENDEZ_VOUS })
  if (famille !== null) parametres.set(PARAMETRES_DEMANDE.famille, famille)
  parametres.set(PARAMETRES_DEMANDE.prediagnostic, code)
  return `${CHEMINS.demande}?${parametres.toString()}`
}

function estRequete(valeur: unknown): valeur is Requete {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}
