import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import {
  detailDuSujet,
  estUrgente,
  libelleTypeDemande,
  type Demande,
} from '../../../domaine/demande.js'
import { LIBELLE_PIECES, libelleUrgence } from '../../../domaine/message-notification.js'
import type { NumeroRappelAffiche } from '../../../domaine/numero-rappel.js'
import {
  GAMMES,
  LIBELLE_MODALITE,
  MODALITES_PIECE,
  MOMENTS_RAPPEL,
  libelleDe,
} from '../../../domaine/referentiels.js'
import { decrireVehicule } from '../../../domaine/vehicule.js'
import { alerteUrgence, appelerLeGarage, nomDuGarage, type GarageAffiche } from './communs.js'
import { enTetePage } from './entete-page.js'
import { insecables } from './typographie.js'

export interface PageConfirmation {
  readonly demande: Demande
  /** Suite annoncée par le garage (AT-3) ; `null` : aucune promesse de délai. */
  readonly suite: string | null
  readonly numeroRappel: NumeroRappelAffiche | null
  readonly garage: GarageAffiche
}

const DESCRIPTION = 'Confirmation de votre demande au garage.'

/** Première phrase : ce qui est enregistré, et pour un rendez-vous ce que ce n'est pas encore (D4). */
function phraseEnregistrement(demande: Demande): string {
  switch (demande.type) {
    case 'rendez-vous':
      return 'Votre demande est enregistrée. Ce n’est pas encore une réservation : nous vous appelons pour fixer l’heure.'
    case 'devis':
      return 'Votre demande de devis est enregistrée.'
    case 'rappel':
      return 'Votre demande de rappel est enregistrée.'
  }
}

/**
 * Qui rappelle, depuis quel numéro (B-08, US-12, US-13) : le numéro sortant
 * n'est cité que s'il peut l'être, sinon la phrase s'arrête au numéro indiqué.
 */
export function phraseRappel(garage: GarageAffiche, numero: NumeroRappelAffiche | null): Html {
  const nom = nomDuGarage(garage)
  if (numero === null) return html`${nom} vous rappelle au numéro indiqué.`
  const telephone = numero.surligne
    ? html`<mark class="demandes-a-valider" title="Valeur à valider par le garage">${numero.telephone.affichable}</mark>`
    : html`<span class="demandes-numero">${numero.telephone.affichable}</span>`
  return html`${nom} vous rappelle au numéro indiqué, depuis le ${telephone}\u00a0: enregistrez ce numéro pour décrocher.`
}

/** `/demande/envoyee` : récapitulatif et suite annoncée, sans aucune donnée personnelle dans l'adresse. */
export function vueConfirmation(page: PageConfirmation): VuePage {
  const { demande } = page
  return {
    titre: 'Demande enregistrée',
    description: DESCRIPTION,
    chemin: CHEMINS.demandeEnvoyee,
    indexable: false,
    // La demande est partie : la barre fixe basse proposerait d'en refaire une (J1).
    barreFixe: 'masquee',
    contenu: html`${enTetePage({
      fil: [{ libelle: 'Demande enregistrée', chemin: CHEMINS.demandeEnvoyee }],
      surtitre: libelleTypeDemande(demande),
      titre: 'Demande enregistrée',
    })}
<div class="conteneur section demandes-page demandes-page--avec-aparte">
  <div class="demandes-colonne pile">
    <div class="message message--succes demandes-suite">
      <p><strong>${insecables(phraseEnregistrement(demande))}</strong></p>
      ${page.suite !== null && html`<p>${insecables(page.suite)}</p>`}
      <p>${phraseRappel(page.garage, page.numeroRappel)}</p>
    </div>
    ${estUrgente(demande) && alerteUrgence('ne-pas-rouler')}
    <section class="panneau" aria-labelledby="demandes-recapitulatif-titre">
      <h2 class="titre-carte" id="demandes-recapitulatif-titre">Récapitulatif</h2>
      ${recapitulatif(demande)}
    </section>
    <ul class="liste-actions">
      <li><a class="bouton bouton--secondaire" href="${CHEMINS.accueil}">Revenir à l’accueil</a></li>
    </ul>
  </div>
  ${aparteChangement(page.garage)}
</div>`,
  }
}

/** Rien ne se modifie en ligne : un changement passe par un appel, et la page le dit. */
function aparteChangement(garage: GarageAffiche): Html {
  return html`<aside class="panneau demandes-aparte" aria-labelledby="demandes-changement-titre">
  <h2 class="titre-carte" id="demandes-changement-titre">Un changement\u00a0?</h2>
  <p>${appelerLeGarage(garage, 'Pour modifier ou annuler votre demande, appelez le garage')}</p>
</aside>`
}

function recapitulatif(demande: Demande): Html {
  const { sujet, contact } = demande
  return html`<dl class="liste-definitions demandes-recapitulatif">
  <dt>Demande</dt><dd>${libelleTypeDemande(demande)}</dd>
  <dt>${sujet.nature === 'pre-diagnostic' ? 'Pré-diagnostic' : 'Objet'}</dt><dd>${insecables(detailDuSujet(sujet))}</dd>
  ${sujet.nature === 'pre-diagnostic' && html`<dt>Conduite à tenir</dt><dd>${insecables(libelleUrgence(sujet.resume.urgence))}</dd>`}
  ${demande.pieces.length > 0 && html`<dt>${LIBELLE_PIECES}</dt><dd>${demande.pieces.join(', ')}</dd>`}
  ${demande.creneaux.length > 0 && html`<dt>Possibilités</dt><dd><ul class="demandes-liste-simple">${demande.creneaux.map((creneau) => html`<li>${insecables(creneau.libelle)}</li>`)}</ul></dd>`}
  ${demande.vehicule !== null && html`<dt>Véhicule</dt><dd>${decrireVehicule(demande.vehicule)}</dd>`}
  ${demande.gamme !== null && html`<dt>Pièce</dt><dd>${libelleDe(GAMMES, demande.gamme)}</dd>`}
  ${demande.modalite !== null && html`<dt>${LIBELLE_MODALITE}</dt><dd>${libelleDe(MODALITES_PIECE, demande.modalite)}</dd>`}
  ${demande.precisions !== null && html`<dt>Précisions</dt><dd class="demandes-texte-libre">${demande.precisions}</dd>`}
  <dt>Prénom</dt><dd>${contact.prenom}</dd>
  <dt>Téléphone</dt><dd class="demandes-numero">${contact.telephone.affichable}</dd>
  <dt>Joignable</dt><dd>${libelleDe(MOMENTS_RAPPEL, contact.moment)}</dd>
</dl>`
}

/**
 * Lien de confirmation trop ancien (plus d'une heure) : il a pu être partagé
 * ou gardé ; il ne montre plus rien de la demande (US-12).
 */
export function vueConfirmationNeutre(garage: GarageAffiche): VuePage {
  return {
    titre: 'Demande enregistrée',
    description: DESCRIPTION,
    chemin: CHEMINS.demandeEnvoyee,
    indexable: false,
    // Même confirmation, même règle : pas de barre qui inviterait à un doublon.
    barreFixe: 'masquee',
    contenu: html`${enTetePage({
      fil: [{ libelle: 'Demande enregistrée', chemin: CHEMINS.demandeEnvoyee }],
      surtitre: 'Demande',
      titre: 'Demande enregistrée',
      intro:
        'Votre demande a bien été enregistrée. Pour protéger vos informations, son récapitulatif n’est plus affiché.',
    })}
<div class="conteneur section demandes-page">
  <div class="demandes-colonne pile">
    <p>${appelerLeGarage(garage, 'Pour toute question, appelez le garage')}</p>
    <ul class="liste-actions">
      <li><a class="bouton bouton--secondaire" href="${CHEMINS.accueil}">Revenir à l’accueil</a></li>
    </ul>
  </div>
</div>`,
  }
}
