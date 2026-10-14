import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { Remise } from '../../../application/ports.js'
import {
  libelleNature,
  NATURES_CHANGEMENT,
  TEXTE_SIGNALEMENT_MAX,
  type ChampSignalement,
  type ErreursSignalement,
  type SaisieSignalement,
  type Signalement,
} from '../../../domaine/signalement.js'
import { CHEMINS_ACCES } from '../chemins-acces.js'
import { champJetonFormulaire, enTeteEspace, pageEspace } from './commun.js'

export const STATUT_SAISIE_INVALIDE = 422
export const STATUT_SIGNALEMENT_IMPOSSIBLE = 503

const DESCRIPTION = 'Signaler à Anthony un changement d’horaires, de prix ou de prestation.'

const IDENTIFIANTS: Readonly<Record<ChampSignalement, string>> = {
  nature: 'acces-signalement-nature',
  texte: 'acces-signalement-texte',
}
const ID_AIDE_TEXTE = 'acces-signalement-texte-aide'
const ID_RESUME_ERREURS = 'acces-signalement-erreurs'

export type ProblemeEnvoi = 'canal-absent' | 'echec-envoi'

export interface EcranSignalement {
  readonly saisie: SaisieSignalement
  readonly erreurs: ErreursSignalement
  readonly jetonFormulaire: string
  /** Faux tant que l'adresse d'Anthony n'est pas configurée : le formulaire ne s'affiche pas. */
  readonly canalDisponible: boolean
  readonly probleme: ProblemeEnvoi | null
}

function idErreur(champ: ChampSignalement): string {
  return `${IDENTIFIANTS[champ]}-erreur`
}

/**
 * Attributs d'accessibilité d'un champ : description liée, et état invalide
 * explicite, `"false"` tant qu'aucune erreur n'est signalée : sans lui, un
 * champ obligatoire encore vide est annoncé « invalide » (J5, passe 1 du jury).
 */
function decritPar(champ: ChampSignalement, erreurs: ErreursSignalement, aide?: string): Html {
  const ids = [aide, erreurs[champ] === undefined ? undefined : idErreur(champ)].filter(
    (id): id is string => id !== undefined,
  )
  return html`${ids.length > 0 && html` aria-describedby="${ids.join(' ')}"`} aria-invalid="${erreurs[champ] === undefined ? 'false' : 'true'}"`
}

function rendreErreur(champ: ChampSignalement, erreurs: ErreursSignalement): Html | null {
  const erreur = erreurs[champ]
  return erreur === undefined
    ? null
    : html`<p class="champ__erreur" id="${idErreur(champ)}">${erreur}</p>`
}

/**
 * Résumé des erreurs en tête du formulaire : il reçoit le focus au chargement
 * (sans script, par `autofocus`) et chaque ligne mène au champ concerné.
 */
function rendreResumeErreurs(erreurs: ErreursSignalement): Html | null {
  const champs = (Object.keys(IDENTIFIANTS) as ChampSignalement[]).filter(
    (champ) => erreurs[champ] !== undefined,
  )
  if (champs.length === 0) return null
  return html`<div class="message message--erreur acces-resume-erreurs" id="${ID_RESUME_ERREURS}" role="alert" tabindex="-1" autofocus aria-labelledby="${ID_RESUME_ERREURS}-titre">
    <h2 class="acces-resume-erreurs__titre" id="${ID_RESUME_ERREURS}-titre">Le signalement n’est pas parti</h2>
    <ul>
      ${champs.map((champ) => html`<li><a href="#${IDENTIFIANTS[champ]}">${erreurs[champ]}</a></li>`)}
    </ul>
  </div>`
}

const MESSAGE_ECHEC_ENVOI =
  'Le message n’est pas parti : le serveur d’envoi n’a pas répondu. Votre texte est conservé ci-dessous ; réessayez dans quelques minutes.'

/**
 * Sans adresse d'Anthony, pas de formulaire. Si un texte arrive quand même
 * (page ouverte avant un changement de réglage), il est rendu pour être copié.
 */
function rendreEnvoiNonConfigure(saisie: SaisieSignalement): Html {
  return html`<p class="message message--erreur" role="alert">
      L’envoi des signalements n’est pas encore configuré sur le site (adresse d’Anthony
      manquante). Prévenez-le directement.
    </p>
    ${
      saisie.texte !== '' &&
      html`<section class="pile-serree" aria-labelledby="acces-titre-a-transmettre">
      <h2 id="acces-titre-a-transmettre">Votre message, à lui transmettre</h2>
      <p class="acces-texte-libre">${saisie.texte}</p>
    </section>`
    }`
}

function rendreFormulaire(ecran: EcranSignalement): Html {
  const { saisie, erreurs } = ecran
  const options = NATURES_CHANGEMENT.map(
    (nature) =>
      html`<option value="${nature.code}"${saisie.nature === nature.code && html` selected`}>${nature.libelle}</option>`,
  )
  return html`<form class="acces-formulaire panneau pile" method="post" action="${CHEMINS_ACCES.signaler}" novalidate data-envoi-unique>
    <div class="champ">
      <label class="champ__libelle" for="${IDENTIFIANTS.nature}">Ce qui change</label>
      <select class="champ__saisie" id="${IDENTIFIANTS.nature}" name="nature" required${decritPar('nature', erreurs)}>
        <option value="">Choisissez</option>
        ${options}
      </select>
      ${rendreErreur('nature', erreurs)}
    </div>
    <div class="champ">
      <label class="champ__libelle" for="${IDENTIFIANTS.texte}">Votre message</label>
      <textarea class="champ__saisie" id="${IDENTIFIANTS.texte}" name="texte" rows="5" maxlength="${TEXTE_SIGNALEMENT_MAX}" required${decritPar('texte', erreurs, ID_AIDE_TEXTE)}>${saisie.texte}</textarea>
      <p class="champ__aide" id="${ID_AIDE_TEXTE}">
        Par exemple : nouvelle heure de fermeture le samedi. ${TEXTE_SIGNALEMENT_MAX} caractères au plus.
      </p>
      ${rendreErreur('texte', erreurs)}
    </div>
    <div class="acces-envoi"><button class="bouton bouton--principal acces-action" type="submit">Envoyer à Anthony</button></div>
    ${champJetonFormulaire(ecran.jetonFormulaire)}
  </form>`
}

export function vueSignalement(ecran: EcranSignalement): VuePage {
  const invalide = Object.keys(ecran.erreurs).length > 0
  const statutHttp = invalide
    ? STATUT_SAISIE_INVALIDE
    : ecran.probleme === null
      ? undefined
      : STATUT_SIGNALEMENT_IMPOSSIBLE
  return pageEspace({
    titre: 'Signaler un changement',
    description: DESCRIPTION,
    chemin: CHEMINS_ACCES.signaler,
    ...(statutHttp === undefined ? {} : { statutHttp }),
    contenu: html`${enTeteEspace({
      titre: 'Signaler un changement',
      dansLEspace: true,
      intro: html`Le site ne se modifie pas d’ici : votre message part vers Anthony, qui met à
        jour les informations du site. Rien ne change en ligne tant qu’il ne l’a pas fait.`,
    })}
    <div class="conteneur section pile acces">
      ${rendreResumeErreurs(ecran.erreurs)}
      ${
        ecran.probleme === 'echec-envoi' &&
        html`<p class="message message--erreur" role="alert">${MESSAGE_ECHEC_ENVOI}</p>`
      }
      ${ecran.canalDisponible ? rendreFormulaire(ecran) : rendreEnvoiNonConfigure(ecran.saisie)}
      <p><a class="acces-lien-retour" href="${CHEMINS.garagiste}">Revenir à l’espace</a></p>
    </div>`,
  })
}

interface EcranRemis {
  readonly titre: string
  readonly classe: string
  readonly message: Html
}

/** Ce que dit la confirmation selon ce qu'est réellement devenu le message. */
const SIGNALEMENT_REMIS: Readonly<Record<Remise, EcranRemis>> = {
  courriel: {
    titre: 'Signalement envoyé',
    classe: 'message message--succes',
    message: html`Votre message est parti vers Anthony. Le site ne change pas tant qu’il n’a pas
      fait la mise à jour.`,
  },
  journal: {
    titre: 'Signalement non envoyé par courriel',
    classe: 'message',
    message: html`Aucun serveur d’envoi de courriels n’est configuré sur le site : votre message a
      été écrit dans le journal du serveur au lieu de partir. Prévenez Anthony, ou transmettez-lui
      le texte ci-dessous.`,
  },
  demonstration: {
    titre: 'Signalement de démonstration',
    classe: 'message acces-demonstration',
    message: html`<strong>Démonstration :</strong> aucun courriel ne part. En service, ce
      message partirait vers Anthony, qui met le site à jour.`,
  },
}

export function vueSignalementEnvoye(signalement: Signalement, remise: Remise): VuePage {
  const ecran = SIGNALEMENT_REMIS[remise]
  return pageEspace({
    titre: ecran.titre,
    description: DESCRIPTION,
    chemin: CHEMINS_ACCES.signaler,
    contenu: html`${enTeteEspace({ titre: ecran.titre, dansLEspace: true })}
    <div class="conteneur section pile acces">
      <p class="${ecran.classe}" role="status">${ecran.message}</p>
      <section class="panneau pile-serree" aria-labelledby="acces-titre-envoye">
        <h2 class="titre-carte" id="acces-titre-envoye">Votre signalement</h2>
        <dl class="liste-definitions">
          <dt>Ce qui change</dt>
          <dd>${libelleNature(signalement.nature)}</dd>
          <dt>Votre message</dt>
          <dd class="acces-texte-libre">${signalement.texte}</dd>
        </dl>
      </section>
      <ul class="liste-actions">
        <li><a class="bouton bouton--principal acces-action" href="${CHEMINS.garagiste}">Revenir à l’espace</a></li>
        <li><a class="bouton bouton--secondaire acces-action" href="${CHEMINS_ACCES.signaler}">Signaler autre chose</a></li>
      </ul>
    </div>`,
  })
}
