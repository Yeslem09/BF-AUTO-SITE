import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type VuePage } from '../../../../../web/index.js'
import { enTeteEspace, pageEspace } from './commun.js'

export const STATUT_REFUS = 403

/**
 * Formulaire de l'espace refusé par la protection anti-falsification : venu
 * d'un autre site, sans jeton valable, ou page de connexion ouverte depuis plus
 * d'une journée. Le cas légitime (page restée ouverte) se règle en rechargeant.
 */
export function vueEnvoiRefuse(chemin: string): VuePage {
  return pageEspace({
    titre: 'Envoi refusé',
    description: 'Formulaire de l’espace garagiste refusé.',
    chemin,
    statutHttp: STATUT_REFUS,
    contenu: html`${enTeteEspace({ titre: 'Envoi refusé' })}
    <div class="conteneur section pile acces">
      <p class="message message--erreur" role="alert">
        Ce formulaire n’a pas été reconnu : rien n’a été enregistré ni envoyé.
      </p>
      <p class="texte-courant">
        Il ne vient pas d’une page de ce site, ou la page était ouverte depuis trop longtemps.
        Revenez à l’espace, puis recommencez.
      </p>
      <ul class="liste-actions">
        <li><a class="bouton bouton--principal acces-action" href="${CHEMINS.garagiste}">Revenir à l’espace garagiste</a></li>
      </ul>
    </div>`,
  })
}
