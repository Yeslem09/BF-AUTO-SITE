import { execFile } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import {
  creerArbreEssai,
  dossierDonneesAvec,
  FICHIER_ARBRE_DU_SITE,
  questionBrute,
} from '../../essais/arbre-essai.js'
import {
  executerPorteArbre,
  SORTIE_ACCEPTE,
  SORTIE_ILLISIBLE,
  SORTIE_REFUSE,
} from './porte-arbre.js'

const RACINE_PROJET = resolve(import.meta.dirname, '../../../../..')
const COMMANDE = 'src/contextes/pre-diagnostic/adaptateurs/console/porte-arbre.ts'
const executer = promisify(execFile)
const DELAI_COMMANDE_MS = 30_000

const dossiers: string[] = []
afterEach(async () => {
  await Promise.all(dossiers.splice(0).map((dossier) => rm(dossier, { recursive: true })))
})

async function fichierAvecSixiemeQuestion(): Promise<string> {
  const arbre = creerArbreEssai()
  const sifflement = questionBrute(arbre, 'frein-bruit').choix[0]
  if (sifflement === undefined) throw new Error('choix absent')
  delete sifflement.resultat
  sifflement.question = 'cinquieme'
  arbre.questions.push(
    {
      code: 'cinquieme',
      intitule: 'Cinquième question ?',
      choix: [
        { code: 'oui', libelle: 'Oui', question: 'sixieme' },
        { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'frein-sifflement' },
      ],
    },
    {
      code: 'sixieme',
      intitule: 'Sixième question ?',
      choix: [
        { code: 'oui', libelle: 'Oui', resultat: 'frein-sifflement' },
        { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'frein-sifflement' },
      ],
    },
  )
  const dossier = await dossierDonneesAvec(arbre)
  dossiers.push(dossier)
  return join(dossier, 'pre-diagnostic.json')
}

describe('porte de l’arbre en ligne de commande', () => {
  it('accepte l’arbre du site et le dit', async () => {
    const lignes: string[] = []
    expect(await executerPorteArbre(FICHIER_ARBRE_DU_SITE, (ligne) => lignes.push(ligne))).toBe(
      SORTIE_ACCEPTE,
    )
    expect(lignes[0]).toContain('Arbre du pré-diagnostic accepté')
    expect(lignes[1]).toBe(
      'Relecture : non datée, le pré-diagnostic ne sera pas publié en production.',
    )
  })

  it('refuse un arbre à six questions et liste l’anomalie', async () => {
    const lignes: string[] = []
    const code = await executerPorteArbre(await fichierAvecSixiemeQuestion(), (ligne) =>
      lignes.push(ligne),
    )
    expect(code).toBe(SORTIE_REFUSE)
    expect(lignes.join('\n')).toContain('[questions-par-chemin]')
  })

  it('distingue un fichier illisible', async () => {
    const lignes: string[] = []
    expect(await executerPorteArbre('/fichier/absent.json', (ligne) => lignes.push(ligne))).toBe(
      SORTIE_ILLISIBLE,
    )
    expect(lignes[0]).toContain('illisible')
  })

  it(
    'lancée pour de vrai, sort avec un code non nul sur l’arbre refusé et nul sur celui du site',
    async () => {
      const fichier = await fichierAvecSixiemeQuestion()
      const echec = await executer('pnpm', ['exec', 'tsx', COMMANDE, fichier], {
        cwd: RACINE_PROJET,
      }).then(
        () => null,
        (erreur: { code?: number; stdout?: string }) => erreur,
      )
      expect(echec?.code).toBe(SORTIE_REFUSE)
      expect(echec?.stdout).toContain('questions-par-chemin')
      const succes = await executer('pnpm', ['exec', 'tsx', COMMANDE], { cwd: RACINE_PROJET })
      expect(succes.stdout).toContain('accepté')
    },
    DELAI_COMMANDE_MS,
  )
})
