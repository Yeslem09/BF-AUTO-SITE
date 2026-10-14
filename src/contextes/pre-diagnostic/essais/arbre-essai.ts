/**
 * Arbre d'essai et outils des tests du pré-diagnostic. L'arbre d'essai est
 * volontairement petit, conforme à la porte, et se modifie librement : chaque
 * test d'injection part d'une copie neuve, y glisse un défaut et exige que la
 * porte le refuse. Réservé aux fichiers de test.
 */
import { readFileSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Arbre } from '../domaine/arbre.js'
import { examinerArbre } from '../domaine/porte-arbre.js'

export const FICHIER_ARBRE_DU_SITE = resolve(
  import.meta.dirname,
  '../../../../donnees/pre-diagnostic.json',
)

export interface ChoixBrut {
  code: string
  libelle: string
  question?: string
  resultat?: string
}

export interface QuestionBrute {
  code: string
  intitule: string
  aide?: string
  choix: ChoixBrut[]
}

export interface PisteBrute {
  texte: string
  verification: string
  famille?: string
}

export interface ResultatBrut {
  code: string
  niveau?: string
  pistes: PisteBrute[]
}

export interface SigneBrut {
  code: string
  libelle: string
  niveau: string
}

export interface BrancheBrute {
  code: string
  libelle: string
  plancher: string
  signes: string[]
  depart: string
}

export interface ArbreBrut {
  version: string
  statut: string
  source: string
  relu_par: string
  relu_le: string
  branches_non_validees: string[]
  mention?: string
  actions: string[]
  premiere_question: string
  question_signes: string
  signes: SigneBrut[]
  branches: BrancheBrute[]
  questions: QuestionBrute[]
  resultats: ResultatBrut[]
}

const SIGNES_TOUS = ['voyant-rouge', 'pedale-molle', 'fumee-brule', 'direction']

function piste(texte: string, verification: string, famille?: string): PisteBrute {
  return famille === undefined ? { texte, verification } : { texte, verification, famille }
}

/** Une copie neuve à chaque appel : les tests la modifient sans se gêner. */
export function creerArbreEssai(): ArbreBrut {
  return {
    version: 'essai',
    statut: 'a_valider',
    source: 'proposition',
    relu_par: '',
    relu_le: '',
    branches_non_validees: [],
    mention:
      'Pré-diagnostic établi à partir de vos seules réponses. Il ne remplace pas l’examen du véhicule.',
    actions: ['appeler', 'rappel', 'imprimer'],
    premiere_question: 'Que remarquez-vous ?',
    question_signes: 'Remarquez-vous l’un de ces signes ?',
    signes: [
      {
        code: 'voyant-rouge',
        libelle: 'Un voyant rouge reste allumé (huile, freins)',
        niveau: 'ne-pas-rouler',
      },
      { code: 'pedale-molle', libelle: 'La pédale de frein est molle', niveau: 'ne-pas-rouler' },
      { code: 'fumee-brule', libelle: 'De la fumée sous le capot', niveau: 'ne-pas-rouler' },
      { code: 'direction', libelle: 'La direction devient dure', niveau: 'ne-pas-rouler' },
    ],
    branches: [
      {
        code: 'voyant',
        libelle: 'Un voyant s’allume',
        plancher: 'sans-urgence',
        signes: [...SIGNES_TOUS],
        depart: 'voyant-type',
      },
      {
        code: 'bruit',
        libelle: 'Un bruit inhabituel',
        plancher: 'a-controler',
        signes: [...SIGNES_TOUS],
        depart: 'bruit-moment',
      },
      {
        code: 'vibrations',
        libelle: 'Ça vibre',
        plancher: 'a-controler',
        signes: [...SIGNES_TOUS],
        depart: 'vibrations-ressenti',
      },
      {
        code: 'freinage',
        libelle: 'Le freinage a changé',
        plancher: 'a-controler',
        signes: [...SIGNES_TOUS],
        depart: 'freinage-changement',
      },
      {
        code: 'ne-sais-pas',
        libelle: 'Autre chose ou je ne sais pas',
        plancher: 'sans-urgence',
        signes: [...SIGNES_TOUS],
        depart: 'autre-situation',
      },
    ],
    questions: [
      {
        code: 'voyant-type',
        intitule: 'À quoi ressemble ce voyant ?',
        choix: [
          { code: 'entretien', libelle: 'Une clé plate', resultat: 'voyant-entretien' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'voyant-a-identifier' },
        ],
      },
      {
        code: 'bruit-moment',
        intitule: 'Quand entendez-vous ce bruit ?',
        aide: 'Écoutez sans ouvrir le capot.',
        choix: [
          { code: 'freinage', libelle: 'Quand je freine', question: 'frein-bruit' },
          { code: 'vitesse', libelle: 'Avec la vitesse', resultat: 'bruit-roulement' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'bruit-a-situer' },
        ],
      },
      {
        code: 'frein-bruit',
        intitule: 'À quoi ressemble ce bruit ?',
        choix: [
          { code: 'sifflement', libelle: 'Un sifflement', resultat: 'frein-sifflement' },
          { code: 'frottement', libelle: 'Un frottement métallique', resultat: 'frein-metal' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'bruit-a-situer' },
        ],
      },
      {
        code: 'vibrations-ressenti',
        intitule: 'Que ressentez-vous ?',
        choix: [
          { code: 'volant', libelle: 'Le volant vibre', resultat: 'vibrations-equilibrage' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'vibrations-a-situer' },
        ],
      },
      {
        code: 'freinage-changement',
        intitule: 'Qu’est-ce qui a changé ?',
        choix: [
          { code: 'bruit', libelle: 'Un bruit', question: 'frein-bruit' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'freinage-a-situer' },
        ],
      },
      {
        code: 'autre-situation',
        intitule: 'Qu’est-ce qui décrit le mieux la situation ?',
        choix: [
          { code: 'normal', libelle: 'Elle roule normalement', resultat: 'autre-inquietude' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'autre-a-voir' },
        ],
      },
    ],
    resultats: [
      {
        code: 'voyant-entretien',
        niveau: 'sans-urgence',
        pistes: [piste('Une échéance d’entretien.', 'le carnet d’entretien.')],
      },
      {
        code: 'voyant-a-identifier',
        niveau: 'a-controler',
        pistes: [piste('Un défaut enregistré.', 'la lecture des codes défaut.')],
      },
      {
        code: 'bruit-roulement',
        niveau: 'a-controler',
        pistes: [
          piste('Un roulement de roue usé.', 'le jeu de chaque roue.'),
          piste('Un pneu usé.', 'l’usure des pneus.', 'pneus'),
        ],
      },
      {
        code: 'bruit-a-situer',
        niveau: 'a-controler',
        pistes: [piste('Un bruit à situer.', 'un essai sur route avec vous.')],
      },
      {
        code: 'frein-sifflement',
        niveau: 'a-controler',
        pistes: [
          piste(
            'Des plaquettes arrivées au témoin d’usure.',
            'l’épaisseur des plaquettes.',
            'freinage',
          ),
          piste('Des disques encrassés.', 'l’état des disques.', 'freinage'),
        ],
      },
      {
        code: 'frein-metal',
        niveau: 'ne-pas-rouler',
        pistes: [
          piste(
            'Des plaquettes usées jusqu’au métal.',
            'les plaquettes et les disques.',
            'freinage',
          ),
        ],
      },
      {
        code: 'vibrations-equilibrage',
        niveau: 'a-controler',
        pistes: [piste('Une roue mal équilibrée.', 'l’équilibrage des roues.')],
      },
      {
        code: 'vibrations-a-situer',
        niveau: 'a-controler',
        pistes: [piste('Une roue ou un disque déformé.', 'les roues et les disques.')],
      },
      {
        code: 'freinage-a-situer',
        niveau: 'a-controler',
        pistes: [piste('Des plaquettes usées.', 'l’épaisseur des plaquettes.')],
      },
      {
        code: 'autre-inquietude',
        niveau: 'sans-urgence',
        pistes: [piste('Un détail à décrire au garagiste.', 'ce que vous avez remarqué.')],
      },
      {
        code: 'autre-a-voir',
        niveau: 'a-controler',
        pistes: [piste('Un souci à voir sur la voiture.', 'un essai sur route avec vous.')],
      },
    ],
  }
}

/** Contenu brut du vrai fichier `donnees/pre-diagnostic.json`, relu à chaque appel. */
export function lireArbreDuSite(): ArbreBrut {
  return JSON.parse(readFileSync(FICHIER_ARBRE_DU_SITE, 'utf8')) as ArbreBrut
}

/** Relecture datée, statut cohérent : l'arbre est publiable en production. */
export function relire(arbre: ArbreBrut, reluLe = '2026-10-01'): ArbreBrut {
  return { ...arbre, relu_par: 'Garagiste d’essai', relu_le: reluLe, statut: 'valide' }
}

/** Dossier de données jetable qui contient cet arbre sous le nom attendu par le module. */
export async function dossierDonneesAvec(arbre: unknown): Promise<string> {
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-pre-diagnostic-'))
  await writeFile(join(dossier, 'pre-diagnostic.json'), JSON.stringify(arbre, null, 2))
  return dossier
}

export function questionBrute(arbre: ArbreBrut, code: string): QuestionBrute {
  const question = arbre.questions.find((candidate) => candidate.code === code)
  if (question === undefined) throw new Error(`Question d’essai absente : ${code}`)
  return question
}

export function resultatBrut(arbre: ArbreBrut, code: string): ResultatBrut {
  const resultat = arbre.resultats.find((candidat) => candidat.code === code)
  if (resultat === undefined) throw new Error(`Résultat d’essai absent : ${code}`)
  return resultat
}

export function brancheBrute(arbre: ArbreBrut, code: string): BrancheBrute {
  const branche = arbre.branches.find((candidate) => candidate.code === code)
  if (branche === undefined) throw new Error(`Branche d’essai absente : ${code}`)
  return branche
}

/** L'arbre lu et accepté par la porte ; échoue bruyamment s'il ne l'est pas. */
export function arbreAccepte(brut: unknown = creerArbreEssai()): Arbre {
  const examen = examinerArbre(brut)
  if (!examen.accepte) {
    throw new Error(examen.anomalies.map((anomalie) => anomalie.message).join('\n'))
  }
  return examen.arbre
}
