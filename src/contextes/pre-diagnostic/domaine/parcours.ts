import type { NiveauUrgence, ReponseLisible } from '../../../contrats/index.js'
import {
  CODE_AUCUN_SIGNE,
  CODE_NE_SAIS_PAS,
  CODE_QUESTION_SIGNES,
  LIBELLE_AUCUN_SIGNE,
  LIBELLE_NE_SAIS_PAS,
  signesDeBranche,
  type Arbre,
  type Branche,
  type Question,
  type Resultat,
  type SigneDanger,
} from './arbre.js'
import { questionDe, QUESTIONS_COMMUNES, resultatDe, type Pas } from './chemins.js'
import { coderEtat } from './code-parcours.js'
import { NIVEAU_MINIMAL, niveauLePlusGrave } from './niveau.js'

/**
 * Moteur du parcours : à partir des réponses reçues (des codes fermés venus de
 * l'adresse), dit quelle étape afficher. Fonction pure : aucune réponse n'est
 * enregistrée, tout l'état voyage dans l'adresse.
 *
 * Toute valeur inconnue est ignorée : un code qui ne désigne aucun choix de la
 * question en cours arrête la lecture des réponses à cet endroit, et la
 * question s'affiche de nouveau. Aucun texte reçu n'est jamais rendu.
 */

export const NUMERO_SYMPTOME = 1
export const NUMERO_SIGNES = 2
/** Ce que l'adresse transporte, déjà découpé en listes de codes. */
export interface EtatParcours {
  /** Branche choisie à la première question. */
  readonly symptome: string | null
  /** Cases cochées à la question des signes de danger. */
  readonly signes: readonly string[]
  /** Réponses aux questions de la branche, dans l'ordre. */
  readonly reponses: readonly string[]
  /** Réponse à pré-cocher sur la question affichée (lien « Revenir à la question précédente »). */
  readonly coches: readonly string[]
  /** Question dont le formulaire vient d'être envoyé : sans réponse, elle s'affiche en erreur. */
  readonly etapeEnvoyee: string | null
}

export const ETAT_INITIAL: EtatParcours = {
  symptome: null,
  signes: [],
  reponses: [],
  coches: [],
  etapeEnvoyee: null,
}

export interface Option {
  readonly code: string
  readonly libelle: string
}

export interface EtapeSymptome {
  readonly type: 'symptome'
  readonly numero: number
  readonly intitule: string
  readonly options: readonly Option[]
  readonly cochee: string | null
}

export interface EtapeSignes {
  readonly type: 'signes'
  readonly numero: number
  readonly branche: Branche
  readonly intitule: string
  readonly options: readonly Option[]
  readonly cochees: readonly string[]
  readonly erreur: boolean
  /** Réponses déjà données, à reporter dans le formulaire. */
  readonly etat: EtatParcours
  readonly retour: EtatParcours
}

export interface EtapeQuestion {
  readonly type: 'question'
  readonly numero: number
  readonly branche: Branche
  readonly question: Question
  readonly cochee: string | null
  readonly erreur: boolean
  readonly etat: EtatParcours
  readonly retour: EtatParcours
}

/** Un signe de danger est coché : le questionnaire s'arrête net. */
export interface EtapeArret {
  readonly type: 'arret'
  readonly branche: Branche
  readonly niveau: NiveauUrgence
  readonly signes: readonly SigneDanger[]
  readonly reponses: readonly ReponseLisible[]
  readonly etat: EtatParcours
  readonly retour: EtatParcours
  /** Code opaque qui permet de reconstituer ce parcours (demande de rappel). */
  readonly code: string
}

export type Conclusion =
  | { readonly type: 'pistes'; readonly resultat: Resultat }
  /** Réponses insuffisantes, ou branche refusée à la relecture : l'atelier doit voir la voiture. */
  | { readonly type: 'insuffisante' }

export interface EtapeResultat {
  readonly type: 'resultat'
  readonly branche: Branche
  readonly niveau: NiveauUrgence
  readonly conclusion: Conclusion
  /** Signes à rappeler quand le conducteur ne sait pas s'ils sont présents. */
  readonly signesARappeler: readonly SigneDanger[]
  readonly reponses: readonly ReponseLisible[]
  readonly etat: EtatParcours
  readonly retour: EtatParcours
  readonly code: string
}

export type Etape = EtapeSymptome | EtapeSignes | EtapeQuestion | EtapeArret | EtapeResultat

export type EtapeFinale = EtapeArret | EtapeResultat

/** Le conducteur ne sait pas si un signe est présent : au moins « faire contrôler ». */
const NIVEAU_SI_INCERTAIN: NiveauUrgence = 'a-controler'
/** On ne sait pas orienter : l'atelier doit voir la voiture, au moins « faire contrôler ». */
const NIVEAU_SI_INSUFFISANT: NiveauUrgence = 'a-controler'
const NIVEAU_ARRET: NiveauUrgence = 'ne-pas-rouler'
const SEPARATEUR_SIGNES = ' ; '

export function avancer(arbre: Arbre, etat: EtatParcours): Etape {
  const branche = arbre.branches.find((candidate) => candidate.code === etat.symptome)
  if (branche === undefined) return etapeSymptome(arbre, etat)

  const options = optionsSignes(arbre, branche)
  const signes = retenir(options, etat.signes)
  const surLeSymptome: EtatParcours = { ...ETAT_INITIAL, symptome: branche.code }
  if (signes.length === 0) {
    return {
      type: 'signes',
      numero: NUMERO_SIGNES,
      branche,
      intitule: arbre.questionSignes,
      options,
      cochees: retenir(options, etat.coches),
      erreur: etat.etapeEnvoyee === CODE_QUESTION_SIGNES,
      etat: surLeSymptome,
      retour: { ...ETAT_INITIAL, coches: [branche.code] },
    }
  }

  const dangers = signes.flatMap((code) => {
    const signe = arbre.signes.get(code)
    return signe === undefined ? [] : [signe]
  })
  const niveauDesSignes = niveauLePlusGrave(dangers.map((signe) => signe.niveau))
  const incertain = dangers.length === 0 && signes.includes(CODE_NE_SAIS_PAS)
  const retourAuxSignes: EtatParcours = { ...surLeSymptome, coches: signes }
  const reponsesCommunes: ReponseLisible[] = [
    { question: arbre.premiereQuestion, reponse: branche.libelle },
    { question: arbre.questionSignes, reponse: reponseAuxSignes(dangers, incertain) },
  ]

  if (niveauDesSignes === NIVEAU_ARRET) {
    const etatFinal: EtatParcours = { ...surLeSymptome, signes }
    return {
      type: 'arret',
      branche,
      niveau: NIVEAU_ARRET,
      signes: dangers,
      reponses: reponsesCommunes,
      etat: etatFinal,
      retour: retourAuxSignes,
      code: coderEtat(etatFinal),
    }
  }

  const elaguee = arbre.branchesNonValidees.has(branche.code)
  const avancement = elaguee ? SANS_QUESTION : suivreReponses(arbre, branche, etat.reponses)
  const { pas, resultat, question } = avancement
  const surLesReponses: EtatParcours = {
    ...surLeSymptome,
    signes,
    reponses: pas.map((etape) => etape.choix.code),
  }
  const retour = retourDepuis(surLesReponses, retourAuxSignes)

  if (question !== null) {
    return {
      type: 'question',
      numero: QUESTIONS_COMMUNES + pas.length + 1,
      branche,
      question,
      cochee: question.choix.find((choix) => etat.coches.includes(choix.code))?.code ?? null,
      erreur: etat.etapeEnvoyee === question.code,
      etat: surLesReponses,
      retour,
    }
  }

  const toutIgnore =
    branche.code === CODE_NE_SAIS_PAS &&
    incertain &&
    pas.every((etape) => etape.choix.code === CODE_NE_SAIS_PAS)
  const insuffisante = elaguee || toutIgnore || resultat === null
  const niveau = niveauLePlusGrave([
    resultat?.niveau ?? NIVEAU_MINIMAL,
    branche.plancher,
    niveauDesSignes,
    incertain ? NIVEAU_SI_INCERTAIN : NIVEAU_MINIMAL,
    insuffisante ? NIVEAU_SI_INSUFFISANT : NIVEAU_MINIMAL,
  ])
  return {
    type: 'resultat',
    branche,
    niveau,
    conclusion:
      insuffisante || resultat === null ? { type: 'insuffisante' } : { type: 'pistes', resultat },
    signesARappeler: incertain ? signesDeBranche(arbre, branche) : [],
    reponses: [
      ...reponsesCommunes,
      ...pas.map((etape) => ({ question: etape.question.intitule, reponse: etape.choix.libelle })),
    ],
    etat: surLesReponses,
    retour,
    code: coderEtat(surLesReponses),
  }
}

export function estEtapeFinale(etape: Etape): etape is EtapeFinale {
  return etape.type === 'arret' || etape.type === 'resultat'
}

/** Première question : le symptôme, choisi parmi les branches (accueil et entrée du parcours). */
export function etapeSymptome(arbre: Arbre, etat: EtatParcours = ETAT_INITIAL): EtapeSymptome {
  const options = arbre.branches.map((branche) => ({
    code: branche.code,
    libelle: branche.libelle,
  }))
  return {
    type: 'symptome',
    numero: NUMERO_SYMPTOME,
    intitule: arbre.premiereQuestion,
    options,
    cochee: options.find((option) => etat.coches.includes(option.code))?.code ?? null,
  }
}

/** Choix de la question des signes : ceux de la branche, puis « Aucun » et « Je ne sais pas ». */
function optionsSignes(arbre: Arbre, branche: Branche): readonly Option[] {
  return [
    ...signesDeBranche(arbre, branche).map((signe) => ({
      code: signe.code,
      libelle: signe.libelle,
    })),
    { code: CODE_AUCUN_SIGNE, libelle: LIBELLE_AUCUN_SIGNE },
    { code: CODE_NE_SAIS_PAS, libelle: LIBELLE_NE_SAIS_PAS },
  ]
}

/** Codes reçus qui désignent une option, sans doublon, dans l'ordre des options. */
function retenir(options: readonly Option[], recus: readonly string[]): readonly string[] {
  return options.filter((option) => recus.includes(option.code)).map((option) => option.code)
}

/** Un signe coché l'emporte sur « Aucun de ces signes » et sur « Je ne sais pas ». */
function reponseAuxSignes(dangers: readonly SigneDanger[], incertain: boolean): string {
  if (dangers.length > 0) return dangers.map((signe) => signe.libelle).join(SEPARATEUR_SIGNES)
  return incertain ? LIBELLE_NE_SAIS_PAS : LIBELLE_AUCUN_SIGNE
}

interface Avancement {
  readonly pas: readonly Pas[]
  /** Résultat atteint, ou `null` si une question reste à poser. */
  readonly resultat: Resultat | null
  /** Question à poser, ou `null` si un résultat est atteint. */
  readonly question: Question | null
}

/** Branche refusée à la relecture : aucune de ses questions n'est posée. */
const SANS_QUESTION: Avancement = { pas: [], resultat: null, question: null }

function suivreReponses(arbre: Arbre, branche: Branche, reponses: readonly string[]): Avancement {
  const pas: Pas[] = []
  let question = questionDe(arbre, branche.depart)
  for (const code of reponses) {
    const choix = question.choix.find((candidat) => candidat.code === code)
    if (choix === undefined) break
    pas.push({ question, choix })
    if (choix.suite.vers === 'resultat') {
      return { pas, resultat: resultatDe(arbre, choix.suite.code), question: null }
    }
    question = questionDe(arbre, choix.suite.code)
  }
  return { pas, resultat: null, question }
}

/** Revenir à la question précédente : la dernière réponse s'y retrouve pré-cochée. */
function retourDepuis(etat: EtatParcours, retourAuxSignes: EtatParcours): EtatParcours {
  const derniere = etat.reponses.at(-1)
  if (derniere === undefined) return retourAuxSignes
  return { ...etat, reponses: etat.reponses.slice(0, -1), coches: [derniere] }
}
