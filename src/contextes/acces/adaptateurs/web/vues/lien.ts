import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type VuePage } from '../../../../../web/index.js'
import type { EtatLien } from '../../../domaine/lien-connexion.js'
import { DUREE_SESSION_JOURS } from '../../../domaine/regles.js'
import { CHEMINS_ACCES, PARAMETRES_ACCES } from '../chemins-acces.js'
import { champJetonFormulaire, enTeteEspace, pageEspace } from './commun.js'

const STATUT_LIEN_PERIME = 410
const STATUT_LIEN_INCONNU = 404
const DESCRIPTION = 'Ouverture de l’espace garagiste par un lien de connexion.'

interface RefusLien {
  readonly titre: string
  readonly message: string
  readonly complement: string | null
  readonly statut: number
}

const REFUS: Readonly<Record<Exclude<EtatLien, 'valide'>, RefusLien>> = {
  expire: {
    titre: 'Lien expiré',
    message: 'Ce lien a expiré : demandez-en un nouveau.',
    complement: null,
    statut: STATUT_LIEN_PERIME,
  },
  'deja-utilise': {
    titre: 'Lien déjà utilisé',
    message: 'Ce lien a déjà servi : demandez-en un nouveau.',
    complement:
      'Si vous venez de l’ouvrir sur un autre appareil, votre session est ouverte sur celui-là.',
    statut: STATUT_LIEN_PERIME,
  },
  inconnu: {
    titre: 'Lien inconnu',
    message:
      'Ce lien n’est pas reconnu, il a peut-être été coupé en le copiant : demandez-en un nouveau.',
    complement: null,
    statut: STATUT_LIEN_INCONNU,
  },
}

export type EcranLien =
  | { readonly etat: 'valide'; readonly jetonLien: string; readonly jetonFormulaire: string }
  | { readonly etat: Exclude<EtatLien, 'valide'> }

/**
 * Page du lien reçu. Un lien valide n'est pas consommé à l'affichage : le
 * garagiste le confirme d'un geste (POST), si bien qu'un robot de messagerie
 * qui ouvre le lien pour en faire un aperçu ne le brûle pas.
 */
export function vueLien(ecran: EcranLien): VuePage {
  if (ecran.etat !== 'valide') return vueLienRefuse(REFUS[ecran.etat])
  return pageEspace({
    titre: 'Ouvrir votre espace',
    description: DESCRIPTION,
    chemin: CHEMINS_ACCES.lien,
    contenu: html`${enTeteEspace({
      titre: 'Ouvrir votre espace',
      intro: html`Ce lien est valable et ne sert qu’une fois. Touchez le bouton sur le téléphone
        où vous voulez rester connecté : la session y dure ${DUREE_SESSION_JOURS} jours.`,
    })}
    <div class="conteneur section pile acces">
      <form class="acces-formulaire panneau" method="post" action="${CHEMINS_ACCES.lien}" data-envoi-unique>
        ${champJetonFormulaire(ecran.jetonFormulaire)}
        <input type="hidden" name="${PARAMETRES_ACCES.jeton}" value="${ecran.jetonLien}">
        <button class="bouton bouton--principal acces-action" type="submit">Ouvrir mon espace garagiste</button>
      </form>
    </div>`,
  })
}

function vueLienRefuse(refus: RefusLien): VuePage {
  return pageEspace({
    titre: refus.titre,
    description: DESCRIPTION,
    chemin: CHEMINS_ACCES.lien,
    statutHttp: refus.statut,
    contenu: html`${enTeteEspace({ titre: refus.titre })}
    <div class="conteneur section pile acces">
      <p class="message message--erreur" role="alert">${refus.message}</p>
      ${refus.complement !== null && html`<p class="texte-courant">${refus.complement}</p>`}
      <ul class="liste-actions">
        <li><a class="bouton bouton--principal acces-action" href="${CHEMINS.garagisteConnexion}">Recevoir un nouveau lien</a></li>
      </ul>
    </div>`,
  })
}
