import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { Remise } from '../../../application/ports.js'
import {
  DEMANDES_MAX_PAR_ADRESSE,
  DUREE_LIEN_MINUTES,
  DUREE_SESSION_JOURS,
} from '../../../domaine/regles.js'
import { champJetonFormulaire, enTeteEspace, pageEspace, pluriel } from './commun.js'

export const STATUT_TROP_DE_DEMANDES = 429
export const STATUT_ENVOI_IMPOSSIBLE = 503

const DESCRIPTION = 'Connexion à l’espace réservé au garagiste, par un lien envoyé par courriel.'

export interface EcranConnexion {
  /** Faux tant que l'adresse du garagiste n'est pas configurée : aucun bouton qui ne mènerait à rien. */
  readonly canalDisponible: boolean
  readonly jetonFormulaire: string
  /** Chemin de l'espace où revenir, déjà nettoyé. */
  readonly retour: string
  readonly deconnecte: boolean
}

export function vueConnexion(ecran: EcranConnexion): VuePage {
  return pageEspace({
    titre: 'Espace garagiste',
    description: DESCRIPTION,
    chemin: CHEMINS.garagisteConnexion,
    contenu: html`${enTeteEspace({
      titre: 'Espace garagiste',
      surtitre: 'Réservé au garagiste',
      intro: html`Pas de mot de passe à retenir : un lien de connexion part vers l’adresse de
        courriel du garage. Il est valable ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois.`,
    })}
    <div class="conteneur section pile acces">
      ${
        ecran.deconnecte &&
        html`<p class="message message--succes" role="status">
        Vous êtes déconnecté. Pour revenir sur ce téléphone, demandez un nouveau lien.
      </p>`
      }
      ${
        ecran.canalDisponible
          ? html`<div class="panneau pile">
          <form class="acces-formulaire" method="post" action="${CHEMINS.garagisteConnexion}" data-envoi-unique>
            ${champJetonFormulaire(ecran.jetonFormulaire)}
            <input type="hidden" name="retour" value="${ecran.retour}">
            <button class="bouton bouton--principal acces-action" type="submit">Recevoir un lien de connexion</button>
          </form>
          <p class="acces-note">
            Ouvrez le lien sur le téléphone où vous voulez rester connecté : la session y dure
            ${DUREE_SESSION_JOURS} jours, prolongée à chaque visite.
          </p>
        </div>`
          : html`<p class="message message--erreur" role="alert">
            Aucun lien ne peut partir pour l’instant : l’adresse de courriel du garagiste n’est pas
            encore configurée sur le site. Prévenez Anthony, qui peut aussi vous remettre un lien de
            secours.
          </p>`
      }
    </div>`,
  })
}

interface EcranLienRemis {
  readonly titre: string
  readonly message: Html
}

/** Ce que dit la page selon ce qu'est réellement devenu le lien : jamais « parti » s'il ne l'est pas. */
const LIEN_REMIS: Readonly<Record<Remise, EcranLienRemis>> = {
  courriel: {
    titre: 'Lien envoyé',
    message: html`<p class="message message--succes" role="status">
        Un lien de connexion vient de partir vers l’adresse de courriel du garage.
      </p>
      <p class="texte-courant">
        Ouvrez-le dans les ${DUREE_LIEN_MINUTES} minutes, sur le téléphone où vous voulez rester
        connecté. Il ne sert qu’une fois.
      </p>
      <p class="texte-courant">
        Rien reçu après quelques minutes ? Regardez dans les courriers indésirables, puis demandez
        un nouveau lien.
      </p>`,
  },
  journal: {
    titre: 'Lien non envoyé par courriel',
    message: html`<p class="message" role="status">
        Aucun serveur d’envoi de courriels n’est configuré sur le site : le lien a été écrit dans
        le journal du serveur au lieu de partir.
      </p>
      <p class="texte-courant">
        Prévenez Anthony : il peut vous le transmettre, ou vous remettre un lien de secours. Le lien
        vaut ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois.
      </p>`,
  },
  demonstration: {
    titre: 'Votre lien de connexion',
    message: html`<p class="texte-courant">
        Il vaut ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois : ouvrez-le sur le téléphone où
        vous voulez rester connecté.
      </p>`,
  },
}

/** Après la demande : la page dit ce qu'est devenu le lien. En démonstration seulement, il s'affiche ici. */
export function vueLienEnvoye(remise: Remise, lienVisible: string | null): VuePage {
  const ecran = LIEN_REMIS[remise]
  return pageEspace({
    titre: ecran.titre,
    description: DESCRIPTION,
    chemin: CHEMINS.garagisteConnexion,
    contenu: html`${enTeteEspace({ titre: ecran.titre })}
    <div class="conteneur section pile acces">
      ${
        lienVisible !== null &&
        html`<div class="message acces-demonstration" role="status">
        <p><strong>Démonstration :</strong> aucun courriel ne part. Voici le lien qui aurait été envoyé.</p>
        <p><a class="bouton bouton--principal acces-action" href="${cheminLocal(lienVisible)}">Ouvrir le lien de connexion</a></p>
      </div>`
      }
      ${ecran.message}
      <p><a class="acces-lien-retour" href="${CHEMINS.garagisteConnexion}">Demander un nouveau lien</a></p>
    </div>`,
  })
}

export function vueTropDeDemandes(minutes: number): VuePage {
  return pageEspace({
    titre: 'Trop de demandes de lien',
    description: DESCRIPTION,
    chemin: CHEMINS.garagisteConnexion,
    statutHttp: STATUT_TROP_DE_DEMANDES,
    contenu: html`${enTeteEspace({ titre: 'Trop de demandes de lien' })}
    <div class="conteneur section pile acces">
      <p class="message message--erreur" role="alert">
        Déjà ${DEMANDES_MAX_PAR_ADRESSE} liens demandés depuis cette connexion en moins d’une heure.
        Réessayez dans ${pluriel(minutes, 'minute', 'minutes')}.
      </p>
      <p class="texte-courant">
        Le dernier lien reçu reste utilisable ${DUREE_LIEN_MINUTES} minutes après son envoi.
      </p>
      <p><a class="acces-lien-retour" href="${CHEMINS.garagisteConnexion}">Revenir à la connexion</a></p>
    </div>`,
  })
}

export type CauseEnvoiImpossible = 'canal-absent' | 'echec-envoi'

const EXPLICATIONS: Readonly<Record<CauseEnvoiImpossible, string>> = {
  'canal-absent':
    'Aucun lien n’est parti : l’adresse de courriel du garagiste n’est pas configurée sur le site. Prévenez Anthony.',
  'echec-envoi':
    'Le lien n’a pas pu partir : le serveur d’envoi des courriels n’a pas répondu. Réessayez dans quelques minutes ; si cela continue, prévenez Anthony.',
}

export function vueEnvoiImpossible(cause: CauseEnvoiImpossible): VuePage {
  return pageEspace({
    titre: 'Lien non envoyé',
    description: DESCRIPTION,
    chemin: CHEMINS.garagisteConnexion,
    statutHttp: STATUT_ENVOI_IMPOSSIBLE,
    contenu: html`${enTeteEspace({ titre: 'Lien non envoyé' })}
    <div class="conteneur section pile acces">
      <p class="message message--erreur" role="alert">${EXPLICATIONS[cause]}</p>
      <p><a class="acces-lien-retour" href="${CHEMINS.garagisteConnexion}">Revenir à la connexion</a></p>
    </div>`,
  })
}

/** Chemin et paramètres d'une adresse absolue : le lien reste sur l'hôte que l'on visite. */
function cheminLocal(adresse: string): string {
  const url = new URL(adresse)
  return `${url.pathname}${url.search}`
}
