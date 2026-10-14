import type { NiveauUrgence } from '../../../contrats/index.js'
import {
  ACTIONS_RESULTAT,
  CODE_AUCUN_SIGNE,
  CODE_NE_SAIS_PAS,
  CODE_QUESTION_SIGNES,
  type ActionResultat,
  type Arbre,
  type Branche,
  type Choix,
  type Piste,
  type Question,
  type Relecture,
  type Resultat,
  type SigneDanger,
} from './arbre.js'
import { estNiveau } from './niveau.js'

/**
 * Lecture du fichier de l'arbre : forme, types, codes et références. Toutes
 * les anomalies sont rassemblées avec leur chemin (`questions[3].choix[1]`) :
 * qui corrige le fichier voit tout d'un coup. Les règles de contenu (nombre de
 * questions, mots interdits...) relèvent de la porte, pas de la lecture.
 */
export type LectureArbre =
  | { readonly lisible: true; readonly arbre: Arbre }
  | { readonly lisible: false; readonly problemes: readonly string[] }

/** Minuscules, chiffres et tirets : un code voyage dans l'adresse sans être encodé. */
const FORMAT_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/
const LONGUEUR_DATE = 'AAAA-MM-JJ'.length
const LONGUEUR_MAX_TEXTE = 320
const LONGUEUR_MAX_CODE = 40
const STATUT_A_VALIDER = 'a_valider'
const STATUT_VALIDE = 'valide'
/** Codes que la deuxième question ajoute d'elle-même : un signe ne peut pas les porter. */
const CODES_RESERVES_AUX_SIGNES: ReadonlySet<string> = new Set([CODE_AUCUN_SIGNE, CODE_NE_SAIS_PAS])

const CLES_RACINE = [
  'version',
  'statut',
  'source',
  'relu_par',
  'relu_le',
  'branches_non_validees',
  'mention',
  'actions',
  'premiere_question',
  'question_signes',
  'signes',
  'branches',
  'questions',
  'resultats',
] as const
const CLES_RACINE_FACULTATIVES = ['commentaire'] as const

type ObjetJson = Readonly<Record<string, unknown>>

/**
 * Un champ absent est déjà signalé « champ manquant » par `verifierCles` : les
 * lecteurs ci-dessous ne le signalent pas une seconde fois et rendent une
 * valeur neutre, jamais retenue puisque la lecture échoue.
 */
const NIVEAU_PAR_DEFAUT: NiveauUrgence = 'ne-pas-rouler'

class Rapport {
  readonly problemes: string[] = []

  signaler(chemin: string, message: string): void {
    this.problemes.push(`${chemin} : ${message}`)
  }
}

export function lireArbre(brut: unknown): LectureArbre {
  const rapport = new Rapport()
  const arbre = lireRacine(brut, rapport)
  if (arbre === null || rapport.problemes.length > 0) {
    return { lisible: false, problemes: rapport.problemes }
  }
  return { lisible: true, arbre }
}

function lireRacine(brut: unknown, rapport: Rapport): Arbre | null {
  if (!estObjet(brut)) {
    rapport.signaler('racine', 'objet JSON attendu')
    return null
  }
  verifierCles(brut, '', CLES_RACINE, CLES_RACINE_FACULTATIVES, rapport)
  const signes = lireListe(brut, 'signes', rapport).map((valeur, index) =>
    lireSigne(valeur, `signes[${index}]`, rapport),
  )
  const branches = lireListe(brut, 'branches', rapport).map((valeur, index) =>
    lireBranche(valeur, `branches[${index}]`, rapport),
  )
  const questions = lireListe(brut, 'questions', rapport).map((valeur, index) =>
    lireQuestion(valeur, `questions[${index}]`, rapport),
  )
  const resultats = lireListe(brut, 'resultats', rapport).map((valeur, index) =>
    lireResultat(valeur, `resultats[${index}]`, rapport),
  )
  const arbre: Arbre = {
    version: lireTexte(brut['version'], 'version', rapport),
    relecture: lireRelecture(brut, rapport),
    branchesNonValidees: new Set(lireCodes(brut, 'branches_non_validees', rapport)),
    mention: lireTexte(brut['mention'], 'mention', rapport),
    actions: lireActions(brut, rapport),
    premiereQuestion: lireTexte(brut['premiere_question'], 'premiere_question', rapport),
    questionSignes: lireTexte(brut['question_signes'], 'question_signes', rapport),
    signes: indexer(signes, 'signes', rapport),
    branches: sansDoublon(branches, 'branches', rapport),
    questions: indexer(questions, 'questions', rapport),
    resultats: indexer(resultats, 'resultats', rapport),
  }
  lireTexte(brut['source'], 'source', rapport)
  verifierReferences(arbre, rapport)
  return arbre
}

function lireRelecture(racine: ObjetJson, rapport: Rapport): Relecture | null {
  const reluPar = lireTexteOuVide(racine['relu_par'], 'relu_par', rapport)
  const reluLe = lireTexteOuVide(racine['relu_le'], 'relu_le', rapport)
  const relu = reluPar !== '' || reluLe !== ''
  if (relu && (reluPar === '' || reluLe === '')) {
    rapport.signaler('relu_par', 'relu_par et relu_le se remplissent ensemble, ou restent vides')
  }
  if (reluLe !== '' && !estDateCalendaire(reluLe)) {
    rapport.signaler('relu_le', `« ${reluLe} » n’est pas une date AAAA-MM-JJ`)
  }
  const statutAttendu = relu ? STATUT_VALIDE : STATUT_A_VALIDER
  if (racine['statut'] !== statutAttendu) {
    rapport.signaler(
      'statut',
      relu
        ? `« ${STATUT_VALIDE} » attendu une fois la relecture datée`
        : `« ${STATUT_A_VALIDER} » attendu tant que la relecture n’est pas datée`,
    )
  }
  return relu ? { reluPar, reluLe } : null
}

function lireActions(racine: ObjetJson, rapport: Rapport): readonly ActionResultat[] {
  const actions: ActionResultat[] = []
  lireListe(racine, 'actions', rapport).forEach((valeur, index) => {
    const action = ACTIONS_RESULTAT.find((connue) => connue === valeur)
    if (action === undefined) {
      rapport.signaler(`actions[${index}]`, `action inconnue (${ACTIONS_RESULTAT.join(', ')})`)
    } else if (actions.includes(action)) {
      rapport.signaler(`actions[${index}]`, `action « ${action} » en double`)
    } else {
      actions.push(action)
    }
  })
  if (actions.length === 0) rapport.signaler('actions', 'au moins une action attendue')
  return actions
}

function lireSigne(valeur: unknown, chemin: string, rapport: Rapport): SigneDanger | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['code', 'libelle', 'niveau'], [], rapport)
  const code = lireCode(valeur['code'], `${chemin}.code`, rapport)
  if (CODES_RESERVES_AUX_SIGNES.has(code)) {
    rapport.signaler(`${chemin}.code`, `« ${code} » est réservé à la deuxième question`)
  }
  return {
    code,
    libelle: lireTexte(valeur['libelle'], `${chemin}.libelle`, rapport),
    niveau: lireNiveau(valeur['niveau'], `${chemin}.niveau`, rapport),
  }
}

function lireBranche(valeur: unknown, chemin: string, rapport: Rapport): Branche | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['code', 'libelle', 'plancher', 'signes', 'depart'], [], rapport)
  return {
    code: lireCode(valeur['code'], `${chemin}.code`, rapport),
    libelle: lireTexte(valeur['libelle'], `${chemin}.libelle`, rapport),
    plancher: lireNiveau(valeur['plancher'], `${chemin}.plancher`, rapport),
    signes: lireCodes(valeur, 'signes', rapport, chemin),
    depart: lireCode(valeur['depart'], `${chemin}.depart`, rapport),
  }
}

function lireQuestion(valeur: unknown, chemin: string, rapport: Rapport): Question | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['code', 'intitule', 'choix'], ['aide'], rapport)
  const code = lireCode(valeur['code'], `${chemin}.code`, rapport)
  if (code === CODE_QUESTION_SIGNES) {
    rapport.signaler(`${chemin}.code`, `« ${code} » est réservé à la question des signes de danger`)
  }
  const choix = lireListe(valeur, 'choix', rapport, chemin).map((brut, index) =>
    lireChoix(brut, `${chemin}.choix[${index}]`, rapport),
  )
  if (choix.length === 0) rapport.signaler(`${chemin}.choix`, 'au moins un choix attendu')
  return {
    code,
    intitule: lireTexte(valeur['intitule'], `${chemin}.intitule`, rapport),
    aide:
      valeur['aide'] === undefined ? null : lireTexte(valeur['aide'], `${chemin}.aide`, rapport),
    choix: sansDoublon(choix, `${chemin}.choix`, rapport),
  }
}

function lireChoix(valeur: unknown, chemin: string, rapport: Rapport): Choix | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['code', 'libelle'], ['question', 'resultat'], rapport)
  const code = lireCode(valeur['code'], `${chemin}.code`, rapport)
  const libelle = lireTexte(valeur['libelle'], `${chemin}.libelle`, rapport)
  const versQuestion = valeur['question'] !== undefined
  if (versQuestion === (valeur['resultat'] !== undefined)) {
    rapport.signaler(chemin, 'un seul champ attendu parmi « question » et « resultat »')
    return null
  }
  return versQuestion
    ? {
        code,
        libelle,
        suite: {
          vers: 'question',
          code: lireCode(valeur['question'], `${chemin}.question`, rapport),
        },
      }
    : {
        code,
        libelle,
        suite: {
          vers: 'resultat',
          code: lireCode(valeur['resultat'], `${chemin}.resultat`, rapport),
        },
      }
}

function lireResultat(valeur: unknown, chemin: string, rapport: Rapport): Resultat | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['code', 'niveau', 'pistes'], [], rapport)
  return {
    code: lireCode(valeur['code'], `${chemin}.code`, rapport),
    niveau: lireNiveau(valeur['niveau'], `${chemin}.niveau`, rapport),
    pistes: lireListe(valeur, 'pistes', rapport, chemin).flatMap((brut, index) => {
      const piste = lirePiste(brut, `${chemin}.pistes[${index}]`, rapport)
      return piste === null ? [] : [piste]
    }),
  }
}

function lirePiste(valeur: unknown, chemin: string, rapport: Rapport): Piste | null {
  if (!exigerObjet(valeur, chemin, rapport)) return null
  verifierCles(valeur, chemin, ['texte', 'verification'], ['famille'], rapport)
  return {
    texte: lireTexte(valeur['texte'], `${chemin}.texte`, rapport),
    verification: lireTexte(valeur['verification'], `${chemin}.verification`, rapport),
    famille:
      valeur['famille'] === undefined
        ? null
        : lireCode(valeur['famille'], `${chemin}.famille`, rapport),
  }
}

/** Chaque code cité existe : signe, question de départ, suite d'un choix, branche non validée. */
function verifierReferences(arbre: Arbre, rapport: Rapport): void {
  arbre.branches.forEach((branche, index) => {
    branche.signes.forEach((signe, rang) => {
      if (!arbre.signes.has(signe)) {
        rapport.signaler(`branches[${index}].signes[${rang}]`, `signe inconnu « ${signe} »`)
      }
    })
    if (new Set(branche.signes).size !== branche.signes.length) {
      rapport.signaler(`branches[${index}].signes`, 'signe cité deux fois')
    }
    if (!arbre.questions.has(branche.depart)) {
      rapport.signaler(`branches[${index}].depart`, `question inconnue « ${branche.depart} »`)
    }
  })
  for (const question of arbre.questions.values()) {
    for (const choix of question.choix) {
      const connue =
        choix.suite.vers === 'question'
          ? arbre.questions.has(choix.suite.code)
          : arbre.resultats.has(choix.suite.code)
      if (!connue) {
        rapport.signaler(
          `question « ${question.code} », choix « ${choix.code} »`,
          `${choix.suite.vers} inconnu(e) « ${choix.suite.code} »`,
        )
      }
    }
  }
  const codesBranches = new Set(arbre.branches.map((branche) => branche.code))
  for (const code of arbre.branchesNonValidees) {
    if (!codesBranches.has(code)) {
      rapport.signaler('branches_non_validees', `branche inconnue « ${code} »`)
    }
  }
}

function indexer<T extends { readonly code: string }>(
  elements: readonly (T | null)[],
  chemin: string,
  rapport: Rapport,
): ReadonlyMap<string, T> {
  return new Map(sansDoublon(elements, chemin, rapport).map((element) => [element.code, element]))
}

function sansDoublon<T extends { readonly code: string }>(
  elements: readonly (T | null)[],
  chemin: string,
  rapport: Rapport,
): readonly T[] {
  const vus = new Set<string>()
  const retenus: T[] = []
  for (const element of elements) {
    if (element === null) continue
    if (vus.has(element.code)) {
      rapport.signaler(chemin, `code « ${element.code} » en double`)
      continue
    }
    vus.add(element.code)
    retenus.push(element)
  }
  return retenus
}

function lireListe(
  objet: ObjetJson,
  cle: string,
  rapport: Rapport,
  parent = '',
): readonly unknown[] {
  const valeur = objet[cle]
  if (valeur === undefined) return []
  if (!Array.isArray(valeur)) {
    rapport.signaler(parent === '' ? cle : `${parent}.${cle}`, 'liste attendue')
    return []
  }
  return valeur
}

function lireCodes(objet: ObjetJson, cle: string, rapport: Rapport, parent = ''): string[] {
  const chemin = parent === '' ? cle : `${parent}.${cle}`
  return lireListe(objet, cle, rapport, parent).map((valeur, index) =>
    lireCode(valeur, `${chemin}[${index}]`, rapport),
  )
}

function lireCode(valeur: unknown, chemin: string, rapport: Rapport): string {
  if (valeur === undefined) return ''
  if (
    typeof valeur !== 'string' ||
    !FORMAT_CODE.test(valeur) ||
    valeur.length > LONGUEUR_MAX_CODE
  ) {
    rapport.signaler(chemin, 'code attendu : minuscules, chiffres et tirets, 40 caractères au plus')
    return ''
  }
  return valeur
}

function lireTexte(valeur: unknown, chemin: string, rapport: Rapport): string {
  if (valeur === undefined) return ''
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    rapport.signaler(chemin, 'texte non vide attendu')
    return ''
  }
  if (valeur.length > LONGUEUR_MAX_TEXTE) {
    rapport.signaler(chemin, `${valeur.length} caractères, ${LONGUEUR_MAX_TEXTE} au plus`)
  }
  return valeur.trim()
}

function lireTexteOuVide(valeur: unknown, chemin: string, rapport: Rapport): string {
  if (valeur === undefined) return ''
  if (typeof valeur !== 'string') {
    rapport.signaler(chemin, 'texte attendu (vide tant que la relecture n’a pas eu lieu)')
    return ''
  }
  return valeur.trim()
}

function lireNiveau(valeur: unknown, chemin: string, rapport: Rapport): NiveauUrgence {
  if (valeur === undefined) return NIVEAU_PAR_DEFAUT
  if (!estNiveau(valeur)) {
    rapport.signaler(chemin, 'niveau attendu : sans-urgence, a-controler ou ne-pas-rouler')
    return NIVEAU_PAR_DEFAUT
  }
  return valeur
}

function estObjet(valeur: unknown): valeur is ObjetJson {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

function exigerObjet(valeur: unknown, chemin: string, rapport: Rapport): valeur is ObjetJson {
  if (estObjet(valeur)) return true
  rapport.signaler(chemin, 'objet attendu')
  return false
}

/** Signale les champs manquants et les champs inconnus (souvent une faute de frappe). */
function verifierCles(
  objet: ObjetJson,
  chemin: string,
  obligatoires: readonly string[],
  facultatives: readonly string[],
  rapport: Rapport,
): void {
  const prefixe = chemin === '' ? '' : `${chemin}.`
  for (const cle of obligatoires) {
    if (!(cle in objet)) rapport.signaler(`${prefixe}${cle}`, 'champ manquant')
  }
  const admises = new Set([...obligatoires, ...facultatives])
  for (const cle of Object.keys(objet)) {
    if (!admises.has(cle)) rapport.signaler(`${prefixe}${cle}`, 'champ inconnu')
  }
}

function estDateCalendaire(texte: string): boolean {
  if (!FORMAT_DATE.test(texte)) return false
  const date = new Date(`${texte}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, LONGUEUR_DATE) === texte
}
