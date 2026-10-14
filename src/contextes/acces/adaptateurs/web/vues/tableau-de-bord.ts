import { CHEMINS, type DemandesARappeler } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import { DUREE_SESSION_JOURS } from '../../../domaine/regles.js'
import { CHEMINS_ACCES } from '../chemins-acces.js'
import { champJetonFormulaire, enTeteEspace, pageEspace, pluriel } from './commun.js'

interface Raccourci {
  readonly titre: string
  readonly description: string
  readonly chemin: string
  /** Ce qui attend sur la page du raccourci, dit avant d'y entrer. */
  readonly etat?: Html | null
}

/** Les trois gestes de l'espace, dans l'ordre de leur fréquence d'usage (Kano D5). */
const RACCOURCIS: readonly Raccourci[] = [
  {
    titre: 'Demandes des clients',
    description:
      'Les demandes reçues par le site, avec le téléphone du client à appeler en un geste.',
    chemin: CHEMINS.garagisteDemandes,
  },
  {
    titre: 'Fermetures exceptionnelles',
    description: 'Un imprévu aujourd’hui, des congés : déclarez-les pour que le site les affiche.',
    chemin: CHEMINS.garagisteFermetures,
  },
  {
    titre: 'Signaler un changement',
    description:
      'Horaires habituels, prix, prestation : un message part vers Anthony, qui met le site à jour.',
    chemin: CHEMINS_ACCES.signaler,
  },
]

function rendreRaccourci(raccourci: Raccourci): Html {
  return html`<li class="carte carte--lien acces-raccourci">
    <h2 class="titre-carte"><a class="lien-etendu" href="${raccourci.chemin}">${raccourci.titre}</a></h2>
    ${raccourci.etat}
    <p>${raccourci.description}</p>
  </li>`
}

/**
 * « 3 à rappeler, dont 1 Ne roulez pas » (J4, passe 1 du jury) : le nombre
 * de la liste des demandes, dit dès l'accueil de l'espace ; l'urgence en rouge.
 * Aucune mesure de délai (US-30). Rien si les demandes ne répondent pas.
 */
export function etatDesDemandes(demandes: DemandesARappeler | null): Html | null {
  if (demandes === null) return null
  if (demandes.total === 0) {
    return html`<p class="acces-compteur">Aucune demande à rappeler.</p>`
  }
  return html`<p class="acces-compteur"><strong>${pluriel(demandes.total, 'demande', 'demandes')} à rappeler</strong>${
    demandes.neRoulezPas > 0 &&
    html`, dont <span class="acces-compteur__urgent">${demandes.neRoulezPas} « Ne roulez pas »</span>`
  }</p>`
}

/**
 * Garage fermé aujourd'hui (J4, passe 2 du jury) : dit dès l'accueil de
 * l'espace, avec les rappels promis pour aujourd'hui à reporter. Rien sinon.
 */
export function bandeauFermeAujourdhui(demandes: DemandesARappeler | null): Html | null {
  const ferme = demandes?.fermeAujourdhui
  if (ferme === undefined) return null
  const nombre =
    ferme.rappelsAReporter === 0
      ? 'aucun rappel promis à reporter'
      : `${pluriel(ferme.rappelsAReporter, 'rappel promis', 'rappels promis')} à reporter`
  return html`<div class="message message--erreur acces-ferme-aujourdhui" role="status">
        <p><strong>Garage fermé aujourd’hui\u00a0: ${nombre}.</strong></p>
        <p><a href="${CHEMINS.garagisteDemandes}">Voir les demandes</a></p>
        <p><a href="${CHEMINS.garagisteFermetures}">Rouvrir le garage</a></p>
      </div>`
}

export function vueTableauDeBord(
  jetonFormulaire: string,
  demandes: DemandesARappeler | null = null,
): VuePage {
  return pageEspace({
    titre: 'Votre espace garagiste',
    description: 'Espace réservé au garagiste : demandes, fermetures et changements à signaler.',
    chemin: CHEMINS.garagiste,
    contenu: html`${enTeteEspace({
      titre: 'Votre espace',
      intro: html`Tout ce que vous avez à faire sur le site, depuis votre téléphone.`,
    })}
    <div class="conteneur section pile acces">
      ${bandeauFermeAujourdhui(demandes)}
      <ul class="grille-cartes acces-raccourcis">
        ${RACCOURCIS.map((raccourci) =>
          rendreRaccourci(
            raccourci.chemin === CHEMINS.garagisteDemandes
              ? { ...raccourci, etat: etatDesDemandes(demandes) }
              : raccourci,
          ),
        )}
      </ul>
      <aside class="encart" aria-labelledby="acces-titre-fiche-google">
        <div class="encart__corps">
          <p class="encart__surtitre">À faire aussi</p>
          <h2 class="encart__titre" id="acces-titre-fiche-google">Pensez aussi à votre fiche Google</h2>
          <p>
            Quand vos horaires changent ou que vous fermez exceptionnellement, faites la même
            modification sur votre fiche Google : c’est souvent elle que les clients voient en
            premier.
          </p>
        </div>
      </aside>
      <section class="panneau acces-telephone" aria-labelledby="acces-titre-telephone">
        <h2 class="titre-carte" id="acces-titre-telephone">Sur ce téléphone</h2>
        <div class="liste-volets">
          <details class="volet">
            <summary class="volet__titre">Mettre l’espace sur l’écran d’accueil du téléphone</summary>
            <div class="volet__contenu">
              <ul class="acces-astuce__liste">
                <li>iPhone, dans Safari : touchez Partager, puis « Sur l’écran d’accueil ».</li>
                <li>Android, dans Chrome : touchez le menu (les trois points), puis « Ajouter à l’écran d’accueil ».</li>
              </ul>
              <p>
                Vous restez connecté ${DUREE_SESSION_JOURS} jours sur ce téléphone, et chaque visite
                prolonge ce délai.
              </p>
            </div>
          </details>
        </div>
        <form method="post" action="${CHEMINS_ACCES.deconnexion}" data-envoi-unique>
          ${champJetonFormulaire(jetonFormulaire)}
          <button class="bouton bouton--secondaire acces-action" type="submit">Se déconnecter</button>
        </form>
      </section>
    </div>`,
  })
}
