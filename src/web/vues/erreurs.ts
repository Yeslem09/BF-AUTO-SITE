import { CHEMINS } from '../../contrats/index.js'
import { html, type Html } from '../html.js'
import { INTENTIONS, rendreListeIntentions } from '../intentions.js'
import type { VuePage } from '../page.js'

export const STATUT_NON_AUTHENTIFIE = 401
export const STATUT_INTROUVABLE = 404
export const STATUT_ERREUR_SERVEUR = 500

/**
 * Les intentions du visiteur (D7 : une page d'erreur y mène toujours) ; sans
 * pré-diagnostic publié, les tarifs prennent sa place (aucun lien vers une page absente).
 */
function suitesPossibles(preDiagnosticPublie: boolean) {
  return preDiagnosticPublie
    ? [INTENTIONS.preDiagnostic, INTENTIONS.catalogue, INTENTIONS.rendezVous]
    : [INTENTIONS.catalogue, INTENTIONS.rendezVous, INTENTIONS.tarifs]
}

/** Ce que les pages d'erreur doivent savoir de ce qui est publié. */
export interface PublicationErreurs {
  /** Faux : aucune suggestion ne mène au pré-diagnostic. Par défaut, publié. */
  readonly preDiagnosticPublie?: boolean
}

interface ContenuErreur {
  readonly surtitre: string
  readonly titre: string
  readonly explication: Html | string
  readonly action: { readonly libelle: string; readonly chemin: string }
  /** Vrai : propose aussi les intentions du site. */
  readonly suites: boolean
  readonly preDiagnosticPublie?: boolean
}

/** Mise en page commune des pages d'erreur : ce qui s'est passé, puis où aller. */
function rendreErreur(contenu: ContenuErreur): Html {
  return html`<div class="conteneur section page-erreur">
  <div class="pile page-erreur__texte">
    <p class="surtitre">${contenu.surtitre}</p>
    <h1>${contenu.titre}</h1>
    <p class="texte-intro">${contenu.explication}</p>
    <ul class="liste-actions">
      <li><a class="bouton bouton--principal" href="${contenu.action.chemin}">${contenu.action.libelle}</a></li>
    </ul>
  </div>
  ${
    contenu.suites &&
    html`<nav class="page-erreur__suites" aria-labelledby="titre-suites">
    <h2 class="titre-carte" id="titre-suites">Vous cherchiez peut-être</h2>
    ${rendreListeIntentions(suitesPossibles(contenu.preDiagnosticPublie ?? true))}
  </nav>`
  }
</div>`
}

const RETOUR_ACCUEIL = { libelle: 'Revenir à l’accueil', chemin: CHEMINS.accueil } as const

/** Envoi vers l'espace garagiste sans session valide (session expirée pendant une saisie). */
export function vueConnexionRequise(chemin: string): VuePage {
  return {
    titre: 'Connexion requise',
    description: 'Cette action est réservée au garagiste connecté.',
    chemin,
    statutHttp: STATUT_NON_AUTHENTIFIE,
    indexable: false,
    rubrique: 'garagiste',
    contenu: rendreErreur({
      surtitre: 'Espace garagiste',
      titre: 'Connexion requise',
      explication:
        'Votre session a expiré ou vous n’êtes pas connecté : rien n’a été enregistré. Connectez-vous, puis recommencez.',
      action: { libelle: 'Se connecter', chemin: CHEMINS.garagisteConnexion },
      suites: false,
    }),
  }
}

export function vueIntrouvable(chemin: string, publication: PublicationErreurs = {}): VuePage {
  return {
    titre: 'Page introuvable',
    description: 'Cette adresse ne correspond à aucune page du site.',
    chemin,
    statutHttp: STATUT_INTROUVABLE,
    indexable: false,
    contenu: rendreErreur({
      surtitre: 'Erreur 404',
      titre: 'Page introuvable',
      explication:
        'Cette adresse ne correspond à aucune page du site. Elle a peut-être changé, ou une faute s’est glissée dans le lien.',
      action: RETOUR_ACCUEIL,
      suites: true,
      ...publication,
    }),
  }
}

/** Page d'une requête refusée (4xx autre que 404), par exemple un formulaire mal formé. */
export function vueRequeteInvalide(chemin: string, statut: number): VuePage {
  return {
    titre: 'Demande non comprise',
    description: 'La demande envoyée au site n’a pas pu être comprise.',
    chemin,
    statutHttp: statut,
    indexable: false,
    contenu: rendreErreur({
      surtitre: `Erreur ${statut}`,
      titre: 'Demande non comprise',
      explication:
        'Le site n’a pas pu traiter cette demande. Revenez à la page précédente et réessayez.',
      action: RETOUR_ACCUEIL,
      suites: false,
    }),
  }
}

export function vueErreurServeur(chemin: string, publication: PublicationErreurs = {}): VuePage {
  return {
    titre: 'Erreur du site',
    description: 'Le site a rencontré un problème.',
    chemin,
    statutHttp: STATUT_ERREUR_SERVEUR,
    indexable: false,
    contenu: rendreErreur({
      surtitre: 'Erreur 500',
      titre: 'Le site a rencontré un problème',
      explication:
        'Ce n’est pas de votre fait. Réessayez dans un instant ; si le problème persiste, appelez le garage, le numéro figure en haut de la page.',
      action: RETOUR_ACCUEIL,
      suites: true,
      ...publication,
    }),
  }
}

/**
 * Dernier recours quand même la mise en page échoue (données du garage
 * illisibles) : aucune dépendance, aucune ressource externe.
 */
export const PAGE_SECOURS = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Erreur du site</title></head>
<body><main><h1>Le site a rencontré un problème</h1><p>Réessayez dans un instant.</p></main></body></html>
`
