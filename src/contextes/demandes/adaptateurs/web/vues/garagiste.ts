import { CHAMP_JETON_FORMULAIRE, CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { TableauDemandes } from '../../../application/lister-demandes.js'
import {
  LIBELLES_STATUT,
  decrireSujet,
  estUrgente,
  libelleTypeDemande,
  type Demande,
  type StatutDemande,
} from '../../../domaine/demande.js'
import type { EtatNotification } from '../../../domaine/etat-notification.js'
import type { SuiviCourriel } from '../../../domaine/suivi-courriel.js'
import { JOURS_TRAITEES_AFFICHEES } from '../../../domaine/conservation.js'
import { LIBELLE_PIECES } from '../../../domaine/message-notification.js'
import { libellePromesse } from '../../../domaine/promesse.js'
import {
  GAMMES,
  LIBELLE_MODALITE,
  MODALITES_PIECE,
  MOMENTS_RAPPEL,
  libelleDe,
} from '../../../domaine/referentiels.js'
import { formaterInstant, heureAParis } from '../../../domaine/temps.js'
import { decrireVehicule } from '../../../domaine/vehicule.js'
import {
  CHAMPS_HTML,
  CHAMP_DEPUIS,
  CHEMIN_DEMANDES_GARAGISTE,
  DEPUIS_FICHE,
  cheminAnnulerTentative,
  cheminFiche,
  cheminStatut,
  cheminTentative,
} from '../adresses.js'
import { resumePreDiagnostic } from './communs.js'
import { enTetePage, ESPACE_GARAGISTE } from './entete-page.js'
import { heureInsecable, insecables } from './typographie.js'

const DESCRIPTION = 'Espace réservé au garagiste.'
const MENTION_NOTIFICATION_ECHEC = 'Notification non envoyée'
const MENTION_NON_REMISE = 'Notification non remise'
const MENTION_REPONSE_NON_RECONNUE = 'Réponse reçue, non reconnue'
const MENTION_DOUBLON = 'Doublon possible'

/** Phrase des envois non confirmés (D9, US-15) : un nombre mesuré, jamais un pourcentage. */
export function phraseEnvoisNonConfirmes(nombre: number): string {
  if (nombre === 0) return 'Aucun envoi non confirmé cette semaine'
  return nombre === 1
    ? '1 envoi non confirmé cette semaine'
    : `${nombre} envois non confirmés cette semaine`
}

/**
 * Compte rendu d'une action du garagiste, affiché en tête de la liste où il
 * revient (J4, passe 1 du jury) : ce qui vient d'être fait, et l'annulation
 * d'un « Traitée » en un geste.
 */
export const ACTIONS_FAITES = [
  'traitee',
  'a-rappeler',
  'sans-reponse',
  'tentative-annulee',
] as const

/** Comptes rendus affichés sur la fiche, qu'un « Pas de réponse » ne quitte plus (J4, passe 2). */
export const ACTIONS_FICHE = ['sans-reponse', 'tentative-annulee'] as const

export type ActionFiche = (typeof ACTIONS_FICHE)[number]

export type ActionFaite = (typeof ACTIONS_FAITES)[number]

export interface CompteRendu {
  readonly action: ActionFaite
  readonly demande: Demande
}

/** Un instant, l'heure jamais coupée de son « h ». */
function instant(date: Date, maintenant: Date): string {
  return heureInsecable(formaterInstant(date, maintenant))
}

function champJeton(jeton: string): Html {
  return html`<input type="hidden" name="${CHAMP_JETON_FORMULAIRE}" value="${jeton}">`
}

export interface PageListe {
  readonly tableau: TableauDemandes
  /** Jeton anti-falsification de la session, posé dans chaque formulaire. */
  readonly jetonFormulaire: string
  readonly compteRendu: CompteRendu | null
}

/** Liste de l'espace garagiste (D5, US-30) : à rappeler d'abord, « Ne roulez pas » en tête. */
export function vueListeDemandes(page: PageListe): VuePage {
  const { tableau } = page
  const aRappeler = tableau.demandes.filter((demande) => demande.statut === 'a-rappeler')
  const traitees = tableau.demandes.filter((demande) => demande.statut === 'traitee')
  return {
    titre: 'Demandes reçues',
    description: DESCRIPTION,
    chemin: CHEMIN_DEMANDES_GARAGISTE,
    rubrique: 'garagiste',
    indexable: false,
    contenu: html`${enTetePage({
      fil: [ESPACE_GARAGISTE, { libelle: 'Demandes reçues', chemin: CHEMIN_DEMANDES_GARAGISTE }],
      surtitre: 'Espace garagiste',
      titre: 'Demandes reçues',
    })}
<div class="conteneur section demandes-page pile">
  ${tableau.fermeLe !== null && bandeauFermeAujourdhui(aRappeler.filter((demande) => demande.promesse?.date === tableau.fermeLe).length)}
  ${page.compteRendu !== null && messageCompteRendu(page.compteRendu, page.jetonFormulaire)}
  ${tableau.illisibles.length > 0 && html`<p class="message message--erreur">${tableau.illisibles.length} demande(s) illisible(s) en base\u00a0: prévenez Anthony (${tableau.illisibles.join(', ')}).</p>`}
  <section class="demandes-section" aria-labelledby="demandes-a-rappeler">
    <h2 id="demandes-a-rappeler">À rappeler (${aRappeler.length})</h2>
    ${
      aRappeler.length === 0
        ? html`<p class="panneau">Aucune demande à rappeler.</p>`
        : html`<ul class="demandes-liste">${aRappeler.map((demande) =>
            carteDemande(demande, {
              maintenant: tableau.maintenant,
              doublons: tableau.doublons.get(demande.id) ?? [],
              jetonFormulaire: page.jetonFormulaire,
              fermeLe: tableau.fermeLe,
            }),
          )}</ul>`
    }
  </section>
  <section class="panneau demandes-section" aria-labelledby="demandes-traitees">
    <h2 id="demandes-traitees">Traitées ces ${JOURS_TRAITEES_AFFICHEES} derniers jours (${traitees.length})</h2>
    ${
      traitees.length === 0
        ? html`<p>Aucune demande traitée ces ${JOURS_TRAITEES_AFFICHEES} derniers jours.</p>`
        : tableauTraitees(traitees, tableau.maintenant)
    }
  </section>
  <p class="demandes-envois-suspects"><strong>${phraseEnvoisNonConfirmes(tableau.envoisNonConfirmes)}.</strong>${tableau.envoisNonConfirmes > 0 && html` <span class="champ__aide">Formulaires qui ont demandé une confirmation, jamais donnée\u00a0: envoyés trop vite, remplis par un robot, ou renvoyés après un retour arrière.</span>`}</p>
  <p class="demandes-retour"><a class="bouton bouton--secondaire" href="${CHEMINS.garagiste}">Retour à l’espace garagiste</a></p>
</div>`,
  }
}

function messageCompteRendu(compteRendu: CompteRendu, jeton: string): Html {
  const { demande, action } = compteRendu
  const prenom = demande.contact.prenom
  switch (action) {
    case 'traitee':
      return html`<div class="message message--succes demandes-compte-rendu" role="status">
    <p>Demande de <strong>${prenom}</strong> rangée dans «\u00a0Traitées\u00a0».</p>
    ${formulaireStatut(demande, 'a-rappeler', jeton, 'Annuler', 'bouton bouton--secondaire')}
  </div>`
    case 'a-rappeler':
      return html`<div class="message message--succes demandes-compte-rendu" role="status">
    <p>Demande de <strong>${prenom}</strong> remise «\u00a0À rappeler\u00a0».</p>
  </div>`
    case 'sans-reponse':
    case 'tentative-annulee':
      return messageTentative(action, demande, jeton, false)
  }
}

/**
 * « Pas de réponse » noté, avec « Annuler » comme après « Traitée » (J4,
 * passe 2 du jury) ; ou son annulation. Sur la liste comme sur la fiche.
 */
function messageTentative(
  action: ActionFiche,
  demande: Demande,
  jeton: string,
  depuisFiche: boolean,
): Html {
  const prenom = demande.contact.prenom
  if (action === 'tentative-annulee') {
    return html`<div class="message message--succes demandes-compte-rendu" role="status">
    <p>Appel sans réponse retiré pour <strong>${prenom}</strong>.</p>
  </div>`
  }
  const derniere = demande.tentativesAppel.at(-1)
  return html`<div class="message message--succes demandes-compte-rendu" role="status">
    <p>Appel sans réponse noté pour <strong>${prenom}</strong>${derniere !== undefined && ` ${heureInsecable(`à ${heureAParis(derniere)}`)}`}\u00a0: la demande reste à rappeler.</p>
    ${
      derniere !== undefined &&
      demande.statut === 'a-rappeler' &&
      html`<form class="demandes-action" method="post" action="${cheminAnnulerTentative(demande.id)}" data-envoi-unique>
      ${champJeton(jeton)}
      ${depuisFiche && html`<input type="hidden" name="${CHAMP_DEPUIS}" value="${DEPUIS_FICHE}">`}
      <button class="bouton bouton--secondaire" type="submit">Annuler</button>
    </form>`
    }
  </div>`
}

/** Pastilles d'une demande ; sur la fiche, le type est déjà dans le surtitre. */
function pastilles(demande: Demande, doublon: boolean, avecType = true): Html {
  return html`<p class="demandes-carte__pastilles">
  ${estUrgente(demande) && html`<span class="pastille demandes-pastille--urgente">Ne roulez pas</span>`}
  ${avecType && html`<span class="pastille">${libelleTypeDemande(demande)}</span>`}
  ${doublon && html`<span class="pastille demandes-pastille--doublon">${MENTION_DOUBLON}</span>`}
  ${demande.notification.etat === 'en-echec' && html`<span class="pastille demandes-pastille--alerte">${MENTION_NOTIFICATION_ECHEC}</span>`}
  ${demande.statut === 'a-rappeler' && demande.premiereConsultationLe === null && html`<span class="pastille">Fiche pas encore ouverte</span>`}
</p>`
}

/**
 * Garage fermé aujourd'hui (J4, passe 2 du jury) : dit en tête de la liste,
 * avec les rappels promis pour aujourd'hui, qui ne pourront pas être tenus.
 */
export function bandeauFermeAujourdhui(rappelsAReporter: number): Html {
  const nombre =
    rappelsAReporter === 0
      ? 'aucun rappel promis à reporter'
      : rappelsAReporter === 1
        ? '1 rappel promis à reporter'
        : `${rappelsAReporter} rappels promis à reporter`
  return html`<div class="message message--erreur demandes-ferme-aujourdhui" role="status">
    <p><strong>Garage fermé aujourd’hui\u00a0: ${nombre}.</strong>${rappelsAReporter > 0 && ' Prévenez chaque client, marqué «\u00a0à reporter\u00a0» ci-dessous.'}</p>
    <p><a href="${CHEMINS.garagisteFermetures}">Voir les fermetures ou rouvrir le garage</a></p>
  </div>`
}

/**
 * « Promis au client : jeudi 24 septembre, en fin de journée » ; rien si rien
 * n'a été promis. Garage fermé ce jour-là : « à reporter ».
 */
function lignePromesse(
  demande: Demande,
  maintenant: Date,
  fermeLe: string | null = null,
): Html | null {
  if (demande.promesse === null) return null
  const aReporter = fermeLe !== null && demande.promesse.date === fermeLe
  return html`<p class="demandes-promesse"><strong>Promis au client\u00a0: ${heureInsecable(libellePromesse(demande.promesse, demande.contact.moment, maintenant))}</strong>${aReporter && html` <span class="pastille demandes-pastille--alerte">À reporter, garage fermé</span>`}</p>`
}

/** Appels restés sans réponse : le nombre, et le dernier. */
function ligneTentatives(demande: Demande, maintenant: Date): Html | null {
  const derniere = demande.tentativesAppel.at(-1)
  if (derniere === undefined) return null
  const nombre = demande.tentativesAppel.length
  return html`<p class="demandes-tentatives">${nombre === 1 ? 'Appel sans réponse le' : `${nombre} appels sans réponse, le dernier le`} ${instant(derniere, maintenant)}.</p>`
}

/** Liens vers les demandes du même numéro reçues à moins de 30 minutes d'écart. */
function ligneDoublons(doublons: readonly Demande[], maintenant: Date): Html | null {
  if (doublons.length === 0) return null
  const liens = doublons.map(
    (autre) =>
      html`<a href="${cheminFiche(autre.id)}">${autre.contact.prenom}, reçue le ${instant(autre.recueLe, maintenant)}${autre.statut === 'traitee' && ' (traitée)'}</a>`,
  )
  const [premier, ...suivants] = liens
  return html`<p class="demandes-doublon">Même numéro, moins de 30 minutes d’écart\u00a0: ${premier}${suivants.map((lien) => html` ; ${lien}`)}.</p>`
}

function formulaireTentative(demande: Demande, jeton: string, depuisFiche = false): Html {
  return html`<form class="demandes-action" method="post" action="${cheminTentative(demande.id)}" data-envoi-unique>
    ${champJeton(jeton)}
    ${depuisFiche && html`<input type="hidden" name="${CHAMP_DEPUIS}" value="${DEPUIS_FICHE}">`}
    <button class="bouton bouton--secondaire" type="submit">Pas de réponse</button>
  </form>`
}

function formulaireStatut(
  demande: Demande,
  statut: StatutDemande,
  jeton: string,
  libelle: string,
  classes: string,
): Html {
  return html`<form class="demandes-action" method="post" action="${cheminStatut(demande.id)}" data-envoi-unique>
    <input type="hidden" name="${CHAMPS_HTML.statut}" value="${statut}">
    ${champJeton(jeton)}
    <button class="${classes}" type="submit">${insecables(libelle)}</button>
  </form>`
}

/**
 * Pré-diagnostic : la dernière réponse, la plus précise (« La pédale de frein
 * est molle ou s'enfonce »), lisible sur la carte sans ouvrir la fiche (J4).
 */
function precisionDuSujet(demande: Demande): string | null {
  if (demande.sujet.nature !== 'pre-diagnostic') return null
  const { resume } = demande.sujet
  const derniere = resume.reponses.at(-1)?.reponse ?? null
  return derniere === null || derniere === resume.symptome.libelle ? null : derniere
}

interface ContexteCarte {
  readonly maintenant: Date
  readonly doublons: readonly Demande[]
  readonly jetonFormulaire: string
  /** Date du jour quand le garage est fermé aujourd'hui ; `null` sinon. */
  readonly fermeLe: string | null
}

/**
 * Demande à rappeler : un panneau, l'appel en un geste, « Pas de réponse »
 * juste dessous, à portée de pouce ; la promesse faite au client et les
 * doublons possibles en clair.
 */
function carteDemande(demande: Demande, contexte: ContexteCarte): Html {
  const { contact } = demande
  const { maintenant } = contexte
  const idTitre = `demande-${demande.id}`
  return html`<li class="panneau demandes-carte${estUrgente(demande) ? ' demandes-carte--urgente' : ''}" aria-labelledby="${idTitre}">
  ${pastilles(demande, contexte.doublons.length > 0)}
  <h3 class="titre-carte" id="${idTitre}"><a href="${cheminFiche(demande.id)}">${contact.prenom}</a></h3>
  <p>${insecables(decrireSujet(demande.sujet))}${precisionDuSujet(demande) !== null && html`<span class="demandes-carte__detail">${insecables(precisionDuSujet(demande) ?? '')}</span>`}${demande.vehicule !== null && html`<span class="demandes-carte__detail">${decrireVehicule(demande.vehicule)}</span>`}</p>
  ${lignePromesse(demande, maintenant, contexte.fermeLe)}
  <p class="champ__aide">Joignable\u00a0: ${libelleDe(MOMENTS_RAPPEL, contact.moment).toLowerCase()}. Reçue le ${instant(demande.recueLe, maintenant)}.</p>
  ${ligneTentatives(demande, maintenant)}
  ${ligneDoublons(contexte.doublons, maintenant)}
  <div class="demandes-boutons">
    <a class="bouton bouton--principal demandes-boutons__appel" href="${contact.telephone.lien}">${insecables(`Appeler le ${contact.telephone.affichable}`)}</a>
    ${formulaireTentative(demande, contexte.jetonFormulaire)}
    ${formulaireStatut(demande, 'traitee', contexte.jetonFormulaire, 'Marquer « Traitée »', 'bouton bouton--secondaire')}
  </div>
  <p class="demandes-carte__fiche"><a href="${cheminFiche(demande.id)}">Voir la fiche de ${contact.prenom}</a></p>
</li>`
}

/**
 * Demandes traitées : un tableau court à relire, la fiche au bout du prénom,
 * la plus récemment traitée d'abord (l'ordre de la colonne « Traitée le »).
 */
function tableauTraitees(traitees: readonly Demande[], maintenant: Date): Html {
  const lignes = traitees.map(
    (demande) => html`<tr>
    <th scope="row"><a href="${cheminFiche(demande.id)}">${demande.contact.prenom}</a></th>
    <td>${libelleTypeDemande(demande)}<span class="tableau-tarifs__detail">${insecables(decrireSujet(demande.sujet))}</span></td>
    <td>${instant(demande.statutChangeLe ?? demande.recueLe, maintenant)}</td>
  </tr>`,
  )
  return html`<table class="tableau-tarifs demandes-tableau">
  <caption class="visuellement-masque">Demandes traitées, la plus récemment traitée d’abord</caption>
  <thead><tr><th scope="col">Client</th><th scope="col">Demande</th><th scope="col">Traitée le</th></tr></thead>
  <tbody>
    ${lignes}
  </tbody>
</table>`
}

function decrireNotification(notification: EtatNotification, maintenant: Date): string {
  switch (notification.etat) {
    case 'en-attente':
      return 'En cours d’envoi'
    case 'envoyee':
      return `Envoyée le ${instant(notification.envoyeeLe, maintenant)}`
    case 'en-echec':
      return `${MENTION_NOTIFICATION_ECHEC} (${notification.essais} essai(s)). Nouvel essai prévu le ${instant(notification.prochainEssaiLe, maintenant)}.`
  }
}

export interface PageFiche {
  /** Ce qui vient d'être fait sur la fiche (« Pas de réponse », son annulation) ; `null` sinon. */
  readonly compteRendu?: ActionFiche | null
  readonly demande: Demande
  /** Ce que la boîte du garage a appris de la demande (Kano connecteurs, C5). */
  readonly suivi: SuiviCourriel
  /** Demandes du même numéro reçues à moins de 30 minutes d'écart. */
  readonly doublons: readonly Demande[]
  readonly maintenant: Date
  /** Jeton anti-falsification de la session, posé dans les formulaires d'action. */
  readonly jetonFormulaire: string
}

/**
 * Fiche d'une demande (US-22, US-30 ; J4, passe 1 du jury) : en haut, ce qui a
 * été promis au client et les trois gestes (appeler, « Pas de réponse »,
 * « Traitée ») sans défiler ; dessous, le cas en toutes lettres, précisions
 * du client en premier ; le suivi à part ; un retour aux demandes de 44 px.
 */
export function vueFicheDemande(page: PageFiche): VuePage {
  const { demande } = page
  const { contact, sujet } = demande
  return {
    titre: `${libelleTypeDemande(demande)} de ${contact.prenom}`,
    description: DESCRIPTION,
    chemin: cheminFiche(demande.id),
    rubrique: 'garagiste',
    indexable: false,
    contenu: html`${enTetePage({
      fil: [
        ESPACE_GARAGISTE,
        { libelle: 'Demandes reçues', chemin: CHEMIN_DEMANDES_GARAGISTE },
        { libelle: contact.prenom, chemin: cheminFiche(demande.id) },
      ],
      surtitre: libelleTypeDemande(demande),
      titre: contact.prenom,
      suite: pastilles(demande, page.doublons.length > 0, false),
    })}
<div class="conteneur section demandes-page demandes-page--avec-aparte">
  <div class="demandes-colonne pile">
    ${page.compteRendu !== undefined && page.compteRendu !== null && messageTentative(page.compteRendu, demande, page.jetonFormulaire, true)}
    ${mentionsNotification(page)}
    ${panneauActions(page)}
    ${page.doublons.length > 0 && html`<div class="message demandes-doublons">${ligneDoublons(page.doublons, page.maintenant)}</div>`}
    ${
      sujet.nature === 'pre-diagnostic' &&
      html`<div class="panneau">${resumePreDiagnostic(sujet.resume, {
        idTitre: 'fiche-resume-titre',
        titre: 'Pré-diagnostic',
        note: 'Ce que le client a répondu, tel qu’il l’a lu.',
        consigneAuClient: false,
      })}</div>`
    }
    <section class="panneau" aria-labelledby="fiche-demande-titre">
      <h2 class="titre-carte" id="fiche-demande-titre">La demande</h2>
      <dl class="liste-definitions demandes-fiche">
        <dt>Précisions</dt><dd class="demandes-texte-libre">${demande.precisions ?? 'Aucune'}</dd>
        ${sujet.nature !== 'pre-diagnostic' && html`<dt>Objet</dt><dd>${insecables(decrireSujet(sujet))}</dd>`}
        ${demande.pieces.length > 0 && html`<dt>${LIBELLE_PIECES}</dt><dd>${demande.pieces.join(', ')}</dd>`}
        ${demande.creneaux.length > 0 && html`<dt>Possibilités</dt><dd><ul class="demandes-liste-simple">${demande.creneaux.map((creneau) => html`<li>${insecables(creneau.libelle)}</li>`)}</ul></dd>`}
        <dt>Véhicule</dt><dd>${demande.vehicule === null ? 'Non indiqué' : decrireVehicule(demande.vehicule)}</dd>
        ${demande.gamme !== null && html`<dt>Pièce</dt><dd>${libelleDe(GAMMES, demande.gamme)}</dd>`}
        ${demande.modalite !== null && html`<dt>${LIBELLE_MODALITE}</dt><dd>${libelleDe(MODALITES_PIECE, demande.modalite)}</dd>`}
        <dt>Joignable</dt><dd>${libelleDe(MOMENTS_RAPPEL, contact.moment)}</dd>
        <dt>Téléphone</dt><dd><a href="${contact.telephone.lien}">${contact.telephone.affichable}</a></dd>
      </dl>
    </section>
  </div>
  ${panneauSuivi(page)}
</div>
<div class="conteneur demandes-page-fin">
  ${retourAuxDemandes()}
</div>`,
  }
}

/**
 * Les gestes de la fiche, en haut : appeler, noter « Pas de réponse », ranger
 * la demande (ou la remettre « À rappeler »). La promesse faite au client est
 * juste au-dessus, pour la tenir.
 */
function panneauActions(page: PageFiche): Html {
  const { demande, maintenant, jetonFormulaire } = page
  const { contact } = demande
  const aRappeler = demande.statut === 'a-rappeler'
  return html`<section class="panneau demandes-actions" aria-labelledby="fiche-actions-titre">
  <h2 class="visuellement-masque" id="fiche-actions-titre">Rappeler ${contact.prenom}</h2>
  ${lignePromesse(demande, maintenant)}
  <div class="demandes-boutons">
    <a class="bouton bouton--principal demandes-boutons__appel" href="${contact.telephone.lien}">Appeler ${contact.prenom} au ${insecables(contact.telephone.affichable)}</a>
    ${aRappeler && formulaireTentative(demande, jetonFormulaire, true)}
    ${
      aRappeler
        ? formulaireStatut(
            demande,
            'traitee',
            jetonFormulaire,
            'Marquer « Traitée »',
            'bouton bouton--secondaire',
          )
        : formulaireStatut(
            demande,
            'a-rappeler',
            jetonFormulaire,
            'Remettre « À rappeler »',
            'bouton bouton--secondaire',
          )
    }
  </div>
  ${ligneTentatives(demande, maintenant)}
</section>`
}

/**
 * Ce que le site sait de la notification et de la boîte du garage (D5, Kano
 * connecteurs C5) : l'échec d'envoi, le courriel revenu, la réponse illisible.
 */
function mentionsNotification(page: PageFiche): Html {
  const { demande, suivi, maintenant } = page
  return html`${demande.notification.etat === 'en-echec' && html`<p class="message message--erreur"><strong>${MENTION_NOTIFICATION_ECHEC}.</strong> Le site réessaie tout seul\u00a0; la demande, elle, est bien enregistrée.</p>`}
    ${suivi.nonRemise !== null && html`<p class="message message--erreur"><strong>${MENTION_NON_REMISE}\u00a0: ${insecables(suivi.nonRemise.motif)}</strong> (courriel revenu en erreur le ${instant(suivi.nonRemise.le, maintenant)}).</p>`}
    ${suivi.reponseNonReconnueLe !== null && html`<p class="message"><strong>${MENTION_REPONSE_NON_RECONNUE}</strong> le ${instant(suivi.reponseNonReconnueLe, maintenant)}. Pour ranger la demande par courriel, répondez d’un seul mot\u00a0: fait, rappelé ou traité.</p>`}`
}

/** Suivi : statut, promesse, appels sans réponse, lecture et notification ; aucune mesure (D5). */
function panneauSuivi(page: PageFiche): Html {
  const { demande, maintenant } = page
  return html`<aside class="panneau demandes-aparte" aria-labelledby="fiche-suivi-titre">
  <h2 class="titre-carte" id="fiche-suivi-titre">Suivi</h2>
  <dl class="liste-definitions demandes-suivi">
    <dt>Statut</dt><dd>${LIBELLES_STATUT[demande.statut]}${demande.statutChangeLe !== null && ` depuis le ${instant(demande.statutChangeLe, maintenant)}`}</dd>
    <dt>Reçue le</dt><dd>${instant(demande.recueLe, maintenant)}</dd>
    ${demande.promesse !== null && html`<dt>Promis au client</dt><dd>${insecables(demande.promesse.phrase)}</dd>`}
    ${demande.tentativesAppel.length > 0 && html`<dt>Appels sans réponse</dt><dd><ul class="demandes-liste-simple">${demande.tentativesAppel.map((tentative) => html`<li>${instant(tentative, maintenant)}</li>`)}</ul></dd>`}
    <dt>Fiche ouverte la première fois</dt><dd>${demande.premiereConsultationLe === null ? 'Pas encore' : instant(demande.premiereConsultationLe, maintenant)}</dd>
    <dt>Notification</dt><dd>${decrireNotification(demande.notification, maintenant)}</dd>
  </dl>
</aside>`
}

/** Retour à la liste, 44 px au moins : le fil d'Ariane seul est trop petit pour le pouce. */
function retourAuxDemandes(): Html {
  return html`<p class="demandes-retour"><a class="bouton bouton--secondaire" href="${CHEMIN_DEMANDES_GARAGISTE}">Retour aux demandes</a></p>`
}

/** Demande introuvable ou illisible : la fiche le dit et renvoie à la liste. */
export function vueFicheIllisible(id: string): VuePage {
  return {
    titre: 'Demande illisible',
    description: DESCRIPTION,
    chemin: cheminFiche(id),
    rubrique: 'garagiste',
    indexable: false,
    contenu: html`${enTetePage({
      fil: [
        ESPACE_GARAGISTE,
        { libelle: 'Demandes reçues', chemin: CHEMIN_DEMANDES_GARAGISTE },
        { libelle: 'Demande illisible', chemin: cheminFiche(id) },
      ],
      surtitre: 'Espace garagiste',
      titre: 'Demande illisible',
      intro: `Cette demande est enregistrée, mais ses informations ne peuvent pas être relues. Prévenez Anthony en lui donnant ce code : ${id}.`,
    })}
<div class="conteneur section demandes-page">
  ${retourAuxDemandes()}
</div>`,
  }
}

/**
 * Changement de statut refusé : statut inconnu (un envoi falsifié est arrêté
 * avant, par l'anti-falsification partagée de l'espace). Rien n'a été
 * modifié, et la page le dit.
 */
export function vueActionRefusee(id: string, statutHttp: number): VuePage {
  return {
    titre: 'Action refusée',
    description: DESCRIPTION,
    chemin: cheminFiche(id),
    rubrique: 'garagiste',
    indexable: false,
    statutHttp,
    contenu: html`${enTetePage({
      fil: [
        ESPACE_GARAGISTE,
        { libelle: 'Demandes reçues', chemin: CHEMIN_DEMANDES_GARAGISTE },
        { libelle: 'Action refusée', chemin: cheminFiche(id) },
      ],
      surtitre: 'Espace garagiste',
      titre: 'Action refusée',
      intro: 'Rien n’a été modifié. Rouvrez la fiche de la demande, puis recommencez.',
    })}
<div class="conteneur section demandes-page">
  <ul class="liste-actions">
    <li><a class="bouton bouton--principal" href="${cheminFiche(id)}">Rouvrir la fiche</a></li>
    <li><a class="bouton bouton--secondaire" href="${CHEMIN_DEMANDES_GARAGISTE}">Retour aux demandes</a></li>
  </ul>
</div>`,
  }
}
