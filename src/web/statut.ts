import type { StatutOuverture, TelephonePublic } from '../contrats/index.js'
import { html, type Html } from './html.js'

/**
 * Statut d'ouverture prêt à afficher en paragraphe (pied de page, fiche du
 * garage). Tant que les horaires ne sont pas confirmés, le site invite à
 * appeler plutôt que d'annoncer une heure.
 */
export function rendreStatutOuverture(statut: StatutOuverture, telephone: TelephonePublic): Html {
  if (statut.etat === 'a-confirmer') {
    return html`<p class="statut statut--a-confirmer">${statut.libelle}, <a href="${telephone.lien}">appelez-nous</a></p>`
  }
  return html`<p class="statut statut--${statut.etat}">${statut.libelle}</p>`
}

/**
 * Statut en pastille bordée, dans une ligne (en-tête, tête de l'accueil). Le
 * texte porte le sens, la couleur du point n'est qu'un appui. Un point masqué
 * clôt la phrase : un lecteur d'écran annonce le statut, marque une pause,
 * puis l'adresse qui suit, au lieu de « 8 h 30 7 rue Demanieux ».
 */
export function rendrePastilleStatut(statut: StatutOuverture): Html {
  return html`<span class="statut statut--pastille statut--${statut.etat}">${statut.libelle}</span><span class="visuellement-masque">.</span>`
}
