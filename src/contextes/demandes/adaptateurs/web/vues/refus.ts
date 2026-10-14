import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type VuePage } from '../../../../../web/index.js'
import { appelerLeGarage, type GarageAffiche } from './communs.js'

export const STATUT_ORIGINE_REFUSEE = 403
export const STATUT_TROP_D_ENVOIS = 429

/**
 * Formulaire envoyé depuis un autre site (D9) : rien n'est enregistré, et la
 * page le dit ; jamais une fausse confirmation (AE-35).
 */
export function vueOrigineRefusee(garage: GarageAffiche): VuePage {
  return {
    titre: 'Demande non envoyée',
    description: 'La demande n’a pas été enregistrée.',
    chemin: CHEMINS.demande,
    indexable: false,
    statutHttp: STATUT_ORIGINE_REFUSEE,
    contenu: html`<div class="conteneur section demandes-page">
  <div class="demandes-colonne pile">
    <h1>Demande non envoyée</h1>
    <p class="texte-intro">Ce formulaire a été envoyé depuis un autre site que celui du garage\u00a0: par précaution, il n’a pas été enregistré.</p>
    <p>${appelerLeGarage(garage, 'Remplissez le formulaire sur ce site, ou appelez le garage')}</p>
    <ul class="liste-actions">
      <li><a class="bouton bouton--principal" href="${CHEMINS.demande}">Faire une demande</a></li>
    </ul>
  </div>
</div>`,
  }
}

/** Limite par adresse client atteinte (US-47) : refus annoncé, avec le téléphone du garage. */
export function vueLimiteAtteinte(garage: GarageAffiche): VuePage {
  return {
    titre: 'Demande non envoyée',
    description: 'La demande n’a pas été enregistrée.',
    chemin: CHEMINS.demande,
    indexable: false,
    statutHttp: STATUT_TROP_D_ENVOIS,
    contenu: html`<div class="conteneur section demandes-page">
  <div class="demandes-colonne pile">
    <h1>Demande non envoyée</h1>
    <p class="texte-intro">Plusieurs demandes sont déjà parties de votre connexion en moins d’une heure\u00a0: par précaution, celle-ci n’a pas été enregistrée.</p>
    <p>${appelerLeGarage(garage, 'Pour ne pas attendre, appelez le garage')}</p>
  </div>
</div>`,
  }
}
