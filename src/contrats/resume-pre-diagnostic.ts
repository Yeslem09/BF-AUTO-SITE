/**
 * Conduite à tenir, du moins grave au plus grave. L'ordre du tableau fait foi.
 * `ne-pas-rouler` : « Ne roulez pas : appelez-nous » ;
 * `a-controler` : « Roulez prudemment et faites contrôler dans les prochains jours » ;
 * `sans-urgence` : « Pas d'urgence : à vérifier lors d'un prochain passage ».
 */
export const NIVEAUX_URGENCE = ['sans-urgence', 'a-controler', 'ne-pas-rouler'] as const

export type NiveauUrgence = (typeof NIVEAUX_URGENCE)[number]

export interface SymptomeChoisi {
  readonly identifiant: string
  readonly libelle: string
}

export interface ReponseLisible {
  readonly question: string
  readonly reponse: string
}

/**
 * Ce que le pré-diagnostic transmet à une demande pour la préremplir.
 * Tout est déjà formulé pour un humain : le garagiste lit, il ne décode pas.
 */
export interface ResumePreDiagnostic {
  readonly symptome: SymptomeChoisi
  readonly reponses: readonly ReponseLisible[]
  readonly urgence: NiveauUrgence
  readonly conclusion: string
}
