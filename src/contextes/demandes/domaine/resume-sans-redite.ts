import type { ReponseLisible, ResumePreDiagnostic } from '../../../contrats/index.js'
import { libelleUrgence } from './message-notification.js'

/**
 * Le résumé du pré-diagnostic se relit sans redite (J1 et J4, passe 1 du
 * jury) : le symptôme n'est pas répété quand une réponse le dit déjà, et le
 * verdict, affiché à part, ne revient pas dans la conclusion. Le résumé
 * transmis au garage reste entier : seul l'affichage l'allège.
 */

function normaliser(texte: string): string {
  return texte.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR')
}

/** Vrai si une réponse dit déjà le symptôme (« Que remarquez-vous ? Un bruit inhabituel »). */
export function symptomeDejaDit(resume: ResumePreDiagnostic): boolean {
  const symptome = normaliser(resume.symptome.libelle)
  return resume.reponses.some((reponse) => normaliser(reponse.reponse) === symptome)
}

/** Les lignes à relire : le symptôme d'abord s'il n'est dit nulle part, puis les réponses. */
export function lignesDuResume(resume: ResumePreDiagnostic): readonly ReponseLisible[] {
  const symptome: readonly ReponseLisible[] = symptomeDejaDit(resume)
    ? []
    : [{ question: 'Symptôme', reponse: resume.symptome.libelle }]
  return [...symptome, ...resume.reponses]
}

/**
 * La conclusion sans le verdict qui l'ouvre (« Ne roulez pas : appelez-nous. »),
 * affiché à part ; `null` s'il ne reste rien à dire.
 */
export function conclusionSansVerdict(resume: ResumePreDiagnostic): string | null {
  const verdict = `${libelleUrgence(resume.urgence)}.`
  const conclusion = resume.conclusion.trim()
  // Comparaison exacte : un texte qui ne commence pas par le verdict reste entier.
  const reste = conclusion.startsWith(verdict)
    ? conclusion.slice(verdict.length).trim()
    : conclusion
  return reste === '' ? null : reste
}
