import type { NiveauUrgence } from '../../../contrats/index.js'
import type { Anomalie, RegleArbre } from './anomalie.js'
import {
  CODE_NE_SAIS_PAS,
  LIBELLE_NE_SAIS_PAS,
  type ActionResultat,
  type Arbre,
  type Branche,
  type Question,
  type Resultat,
} from './arbre.js'
import {
  cheminsDeBranche,
  MAX_QUESTIONS_PAR_CHEMIN,
  questionsPosees,
  type Chemin,
} from './chemins.js'
import { lireArbre } from './lecture-arbre.js'
import { CONDUITES, estMoinsGrave } from './niveau.js'
import { contientExpression, estUnePhrase, motsTrouves } from './texte.js'

/**
 * La porte de l'arbre : un invariant écrit en prose n'en est pas un. Chaque
 * règle de D3 (Kano) est ici une vérification nommée, exécutée au démarrage du
 * site, par la commande `porte-arbre` et par les tests, qui l'éprouvent par
 * injection sur l'arbre d'essai.
 */

export const MAX_CHOIX_PAR_QUESTION = 7
export const MAX_PISTES_PAR_RESULTAT = 3

/** Choix que la deuxième question ajoute toujours aux signes : « Aucun de ces signes », « Je ne sais pas ». */
const CHOIX_AJOUTES_AUX_SIGNES = 2
const NIVEAU_ARRET: NiveauUrgence = 'ne-pas-rouler'
const PLANCHER_EXIGE: NiveauUrgence = 'a-controler'
/** Branches où « Pas d'urgence » serait une promesse de sécurité faite au nom du garagiste. */
export const BRANCHES_A_PLANCHER: readonly string[] = ['bruit', 'freinage', 'vibrations']
/** Signes exigés sur toute branche : la pédale de frein, le voyant rouge et la fumée. */
export const SIGNES_OBLIGATOIRES: readonly string[] = [
  'pedale-molle',
  'voyant-rouge',
  'fumee-brule',
]
const SIGNE_VOYANT_ROUGE = 'voyant-rouge'
/** Un exemple entre parenthèses : « (huile, température, batterie, freins) ». */
const EXEMPLE_ENTRE_PARENTHESES = /\([^()]*\p{L}[^()]*\)/u
const ACTIONS_EXIGEES: readonly ActionResultat[] = ['appeler', 'rappel']

/** Certitude, probabilité, garantie, montant, et « avis » réservé aux avis Google. */
export const MOTS_INTERDITS: ReadonlySet<string> = new Set([
  'certain',
  'certainement',
  'surement',
  'forcement',
  'garanti',
  'avis',
  'euro',
  'euros',
])
const SIGNES_INTERDITS: readonly string[] = ['%', '€']
/** Gestes que le conducteur ne doit jamais être invité à faire (bricolage, antipollution). */
export const GESTES_INTERDITS: ReadonlySet<string> = new Set([
  'supprimer',
  'suppression',
  'defap',
  'desactiver',
  'debrancher',
  'demonter',
  'devisser',
])

export type Examen =
  | { readonly accepte: true; readonly arbre: Arbre }
  | { readonly accepte: false; readonly anomalies: readonly Anomalie[] }

/** Lecture puis vérification : ce que fait le démarrage, la commande et les tests. */
export function examinerArbre(brut: unknown): Examen {
  const lecture = lireArbre(brut)
  if (!lecture.lisible) {
    return {
      accepte: false,
      anomalies: lecture.problemes.map((message) => ({ regle: 'structure', message })),
    }
  }
  const anomalies = verifierArbre(lecture.arbre)
  return anomalies.length === 0
    ? { accepte: true, arbre: lecture.arbre }
    : { accepte: false, anomalies }
}

/** Règles de contenu d'un arbre bien formé. Liste vide : l'arbre passe. */
export function verifierArbre(arbre: Arbre): readonly Anomalie[] {
  const anomalies: Anomalie[] = []
  const signaler = (regle: RegleArbre, message: string): void => {
    anomalies.push({ regle, message })
  }
  verifierPremiereQuestion(arbre, signaler)
  verifierSignes(arbre, signaler)
  verifierActions(arbre, signaler)
  const atteints = { questions: new Set<string>(), resultats: new Set<string>() }
  for (const branche of arbre.branches) {
    verifierBranche(arbre, branche, signaler)
    for (const chemin of cheminsDeBranche(arbre, branche)) {
      verifierChemin(branche, chemin, signaler)
      for (const pas of chemin.pas) atteints.questions.add(pas.question.code)
      if (chemin.resultat !== null) atteints.resultats.add(chemin.resultat.code)
    }
  }
  for (const question of arbre.questions.values()) {
    verifierQuestion(question, signaler)
    if (!atteints.questions.has(question.code)) {
      signaler('orphelin', `La question « ${question.code} » n’est atteinte par aucune branche.`)
    }
  }
  for (const resultat of arbre.resultats.values()) {
    verifierResultat(resultat, signaler)
    if (!atteints.resultats.has(resultat.code)) {
      signaler('orphelin', `Le résultat « ${resultat.code} » n’est atteint par aucune branche.`)
    }
  }
  verifierMots(arbre, signaler)
  return anomalies
}

type Signaler = (regle: RegleArbre, message: string) => void

function verifierPremiereQuestion(arbre: Arbre, signaler: Signaler): void {
  if (arbre.branches.length > MAX_CHOIX_PAR_QUESTION) {
    signaler(
      'choix-par-question',
      `La première question propose ${arbre.branches.length} choix, ${MAX_CHOIX_PAR_QUESTION} au plus.`,
    )
  }
  const neSaitPas = arbre.branches.find((branche) => branche.code === CODE_NE_SAIS_PAS)
  if (neSaitPas === undefined || !contientExpression(neSaitPas.libelle, LIBELLE_NE_SAIS_PAS)) {
    signaler(
      'ne-sais-pas-absent',
      `La première question n’a pas de choix « ${CODE_NE_SAIS_PAS} » dont le libellé dit « ${LIBELLE_NE_SAIS_PAS} ».`,
    )
  }
  for (const code of BRANCHES_A_PLANCHER) {
    const branche = arbre.branches.find((candidate) => candidate.code === code)
    if (branche === undefined) {
      signaler(
        'plancher-obligatoire',
        `La branche « ${code} » est absente de la première question.`,
      )
    } else if (estMoinsGrave(branche.plancher, PLANCHER_EXIGE)) {
      signaler(
        'plancher-obligatoire',
        `La branche « ${code} » doit avoir pour plancher « ${CONDUITES[PLANCHER_EXIGE]} ».`,
      )
    }
  }
}

function verifierSignes(arbre: Arbre, signaler: Signaler): void {
  for (const signe of arbre.signes.values()) {
    if (signe.niveau !== NIVEAU_ARRET) {
      signaler(
        'signe-sans-arret',
        `Le signe « ${signe.code} » mène à « ${signe.niveau} » au lieu de « ${NIVEAU_ARRET} ».`,
      )
    }
  }
  const voyantRouge = arbre.signes.get(SIGNE_VOYANT_ROUGE)
  if (voyantRouge !== undefined && !EXEMPLE_ENTRE_PARENTHESES.test(voyantRouge.libelle)) {
    signaler(
      'signe-sans-exemple',
      `Le signe « ${SIGNE_VOYANT_ROUGE} » doit citer au moins un exemple entre parenthèses.`,
    )
  }
}

function verifierActions(arbre: Arbre, signaler: Signaler): void {
  for (const action of ACTIONS_EXIGEES) {
    if (!arbre.actions.includes(action)) {
      signaler('actions-incompletes', `Chaque résultat doit proposer l’action « ${action} ».`)
    }
  }
}

function verifierBranche(arbre: Arbre, branche: Branche, signaler: Signaler): void {
  const choixSignes = branche.signes.length + CHOIX_AJOUTES_AUX_SIGNES
  if (choixSignes > MAX_CHOIX_PAR_QUESTION) {
    signaler(
      'choix-par-question',
      `La question des signes de la branche « ${branche.code} » propose ${choixSignes} choix, ${MAX_CHOIX_PAR_QUESTION} au plus.`,
    )
  }
  for (const signe of SIGNES_OBLIGATOIRES) {
    if (!branche.signes.includes(signe) || !arbre.signes.has(signe)) {
      signaler(
        'signe-obligatoire-absent',
        `La branche « ${branche.code} » ne demande pas le signe « ${signe} ».`,
      )
    }
  }
}

function verifierChemin(branche: Branche, chemin: Chemin, signaler: Signaler): void {
  const parcours = chemin.pas.map((pas) => `${pas.question.code}=${pas.choix.code}`).join(', ')
  if (chemin.resultat === null) {
    signaler(
      'questions-par-chemin',
      `Branche « ${branche.code} » : le chemin ${parcours} dépasse ${MAX_QUESTIONS_PAR_CHEMIN} questions (${questionsPosees(chemin)} ou plus).`,
    )
    return
  }
  if (estMoinsGrave(chemin.resultat.niveau, branche.plancher)) {
    signaler(
      'plancher-non-tenu',
      `Branche « ${branche.code} » : le résultat « ${chemin.resultat.code} » (${chemin.resultat.niveau}) est sous le plancher « ${branche.plancher} ».`,
    )
  }
}

function verifierQuestion(question: Question, signaler: Signaler): void {
  if (question.choix.length > MAX_CHOIX_PAR_QUESTION) {
    signaler(
      'choix-par-question',
      `La question « ${question.code} » propose ${question.choix.length} choix, ${MAX_CHOIX_PAR_QUESTION} au plus.`,
    )
  }
  const neSaitPas = question.choix.find((choix) => choix.code === CODE_NE_SAIS_PAS)
  if (neSaitPas === undefined || !contientExpression(neSaitPas.libelle, LIBELLE_NE_SAIS_PAS)) {
    signaler(
      'ne-sais-pas-absent',
      `La question « ${question.code} » n’a pas de choix « ${CODE_NE_SAIS_PAS} » dont le libellé dit « ${LIBELLE_NE_SAIS_PAS} ».`,
    )
  }
}

function verifierResultat(resultat: Resultat, signaler: Signaler): void {
  const { code } = resultat
  const nombre = resultat.pistes.length
  if (nombre === 0 || nombre > MAX_PISTES_PAR_RESULTAT) {
    signaler(
      'pistes-par-resultat',
      `Le résultat « ${code} » compte ${nombre} piste(s), de 1 à ${MAX_PISTES_PAR_RESULTAT} attendues.`,
    )
  }
  resultat.pistes.forEach((piste, index) => {
    for (const [nom, texte] of [
      ['texte', piste.texte],
      ['verification', piste.verification],
    ] as const) {
      if (!estUnePhrase(texte)) {
        signaler(
          'piste-une-phrase',
          `Résultat « ${code} », piste ${index + 1}, ${nom} : une seule phrase terminée par un point.`,
        )
      }
    }
  })
}

/** Tous les textes affichés au conducteur, chacun avec l'endroit où il se trouve. */
function textesDe(arbre: Arbre): readonly (readonly [string, string])[] {
  const textes: (readonly [string, string])[] = [
    ['mention', arbre.mention],
    ['premiere_question', arbre.premiereQuestion],
    ['question_signes', arbre.questionSignes],
  ]
  for (const signe of arbre.signes.values()) textes.push([`signe « ${signe.code} »`, signe.libelle])
  for (const branche of arbre.branches)
    textes.push([`branche « ${branche.code} »`, branche.libelle])
  for (const question of arbre.questions.values()) {
    const ou = `question « ${question.code} »`
    textes.push([ou, question.intitule])
    if (question.aide !== null) textes.push([ou, question.aide])
    for (const choix of question.choix)
      textes.push([`${ou}, choix « ${choix.code} »`, choix.libelle])
  }
  for (const resultat of arbre.resultats.values()) {
    for (const piste of resultat.pistes) {
      textes.push([`résultat « ${resultat.code} »`, piste.texte])
      textes.push([`résultat « ${resultat.code} »`, piste.verification])
    }
  }
  return textes
}

function verifierMots(arbre: Arbre, signaler: Signaler): void {
  for (const [ou, texte] of textesDe(arbre)) {
    const interdits = [
      ...motsTrouves(texte, MOTS_INTERDITS),
      ...SIGNES_INTERDITS.filter((signe) => texte.includes(signe)),
    ]
    if (interdits.length > 0) {
      signaler('mot-interdit', `${ou} : ${interdits.map((mot) => `« ${mot} »`).join(', ')}.`)
    }
    const gestes = motsTrouves(texte, GESTES_INTERDITS)
    if (gestes.length > 0) {
      signaler('geste-interdit', `${ou} : ${gestes.map((mot) => `« ${mot} »`).join(', ')}.`)
    }
  }
}
