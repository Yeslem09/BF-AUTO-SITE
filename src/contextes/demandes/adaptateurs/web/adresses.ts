import { CHEMINS, PARAMETRES_DEMANDE, type TypeDemande } from '../../../../contrats/index.js'

/** Espace garagiste des demandes : liste, fiche et changement de statut. */
export const CHEMIN_DEMANDES_GARAGISTE = CHEMINS.garagisteDemandes

export function cheminFiche(id: string): string {
  return `${CHEMIN_DEMANDES_GARAGISTE}/${id}`
}

export function cheminStatut(id: string): string {
  return `${cheminFiche(id)}/statut`
}

/** « Pas de réponse » : l'appel resté sans réponse est daté. */
export function cheminTentative(id: string): string {
  return `${cheminFiche(id)}/tentative`
}

/** Annuler le dernier « Pas de réponse » (appui par erreur). */
export function cheminAnnulerTentative(id: string): string {
  return `${cheminTentative(id)}/annuler`
}

/** Champ caché des gestes posés depuis la fiche : le compte rendu s'y affiche, sans quitter la fiche. */
export const CHAMP_DEPUIS = 'depuis'
export const DEPUIS_FICHE = 'fiche'

/** La fiche, avec le compte rendu de l'action qui vient d'y être faite. */
export function cheminFicheApres(action: string, id: string): string {
  const parametres = new URLSearchParams({ [PARAMETRES_COMPTE_RENDU.action]: action })
  return `${cheminFiche(id)}?${parametres.toString()}`
}

/** Paramètres du compte rendu de la liste, après une action : codes fermés et identifiant. */
export const PARAMETRES_COMPTE_RENDU = { action: 'fait', demande: 'demande' } as const

/** La liste, avec le compte rendu de l'action qui vient d'être faite sur une demande. */
export function cheminListeApres(action: string, id: string): string {
  const parametres = new URLSearchParams({
    [PARAMETRES_COMPTE_RENDU.action]: action,
    [PARAMETRES_COMPTE_RENDU.demande]: id,
  })
  return `${CHEMIN_DEMANDES_GARAGISTE}?${parametres.toString()}`
}

/** Paramètre de `/demande/envoyee` : le jeton aléatoire, seule donnée de l'adresse (B-30). */
export const PARAMETRE_JETON_CONFIRMATION = 'j'

export function cheminConfirmation(jeton: string): string {
  return `${CHEMINS.demandeEnvoyee}?${new URLSearchParams({ [PARAMETRE_JETON_CONFIRMATION]: jeton }).toString()}`
}

/** Adresse du formulaire d'un type, avec ce qui le prérempli (famille, pré-diagnostic). */
export function cheminFormulaire(
  type: TypeDemande,
  rattachements: { readonly famille?: string | null; readonly prediagnostic?: string | null } = {},
): string {
  const parametres = new URLSearchParams({ [PARAMETRES_DEMANDE.type]: type })
  if (rattachements.famille) parametres.set(PARAMETRES_DEMANDE.famille, rattachements.famille)
  if (rattachements.prediagnostic) {
    parametres.set(PARAMETRES_DEMANDE.prediagnostic, rattachements.prediagnostic)
  }
  return `${CHEMINS.demande}?${parametres.toString()}`
}

/**
 * Noms des champs du formulaire. Le champ piège porte un nom sans rapport avec
 * un nom, un téléphone ou un courriel : le remplissage automatique des
 * navigateurs ne doit pas le reconnaître (D9, US-15).
 */
export const CHAMPS_HTML = {
  type: 'type',
  famille: PARAMETRES_DEMANDE.famille,
  prediagnostic: PARAMETRES_DEMANDE.prediagnostic,
  /** Prestation reconnue (« Révision »), gardée d'un type de demande à l'autre. */
  prestation: PARAMETRES_DEMANDE.prestation,
  jeton: 'jeton',
  piege: 'reference_garage',
  objet: 'objet',
  motif: 'motif',
  creneaux: 'creneaux',
  pieces: 'pieces',
  plaque: 'plaque',
  marque: 'marque',
  modele: 'modele',
  annee: 'annee',
  energie: 'energie',
  gamme: 'gamme',
  modalite: 'modalite',
  precisions: 'precisions',
  prenom: 'prenom',
  telephone: 'telephone',
  moment: 'moment',
  statut: 'statut',
  /** Bouton d'un type de demande : le formulaire revient à ce type, saisie gardée (J2). */
  changerType: 'changer_type',
} as const
