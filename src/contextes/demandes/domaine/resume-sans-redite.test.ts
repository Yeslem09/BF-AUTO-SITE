import { describe, expect, it } from 'vitest'
import type { ResumePreDiagnostic } from '../../../contrats/index.js'
import { resumeEssai } from '../essai.js'
import { conclusionSansVerdict, lignesDuResume, symptomeDejaDit } from './resume-sans-redite.js'

/** Tel que le pré-diagnostic le transmet : la première réponse dit le symptôme, la conclusion s'ouvre sur le verdict. */
const FREINAGE: ResumePreDiagnostic = {
  symptome: { identifiant: 'freinage', libelle: 'Le freinage a changé' },
  reponses: [
    { question: 'Que remarquez-vous ?', reponse: 'Le freinage a changé' },
    {
      question: 'Remarquez-vous l’un de ces signes ?',
      reponse: 'La pédale de frein est molle ou s’enfonce',
    },
  ],
  urgence: 'ne-pas-rouler',
  conclusion:
    'Ne roulez pas : appelez-nous. Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.',
}

describe('résumé du pré-diagnostic sans redite (J1 et J4, passe 1 du jury)', () => {
  it('le symptôme n’est pas répété quand une réponse le dit déjà', () => {
    expect(symptomeDejaDit(FREINAGE)).toBe(true)
    expect(lignesDuResume(FREINAGE).map((ligne) => ligne.question)).toEqual([
      'Que remarquez-vous ?',
      'Remarquez-vous l’un de ces signes ?',
    ])
  })

  it('le symptôme reste en tête quand aucune réponse ne le dit', () => {
    const resume = resumeEssai('a-controler')
    expect(lignesDuResume(resume)[0]).toEqual({
      question: 'Symptôme',
      reponse: 'Un bruit ou une sensation au freinage',
    })
  })

  it('la conclusion perd le verdict qui l’ouvre, affiché à part ; un autre texte reste entier', () => {
    expect(conclusionSansVerdict(FREINAGE)).toBe(
      'Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.',
    )
    expect(
      conclusionSansVerdict({ ...FREINAGE, conclusion: 'Ne roulez pas : appelez-nous.' }),
    ).toBeNull()
    expect(conclusionSansVerdict(resumeEssai('ne-pas-rouler'))).toBe(
      'Le circuit de freinage doit être contrôlé avant de reprendre la route.',
    )
  })
})
