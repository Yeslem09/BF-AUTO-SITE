import { html, type Html } from '../../../../../web/index.js'
import type { Publication } from '../../../domaine/valeur-publiee.js'

/**
 * Rendu d'une valeur selon sa publication : la valeur (surlignée en mode
 * relecture si elle reste à valider), le manque signalé avec sa note en mode
 * relecture, et rien du tout sinon.
 */
export function enLigne<T>(
  publication: Publication<T>,
  rendu: (valeur: T) => Html | string,
): Html | null {
  if (!publication.visible) return manque(publication.noteDeRelecture)
  return surligner(rendu(publication.valeur), publication.aSurligner)
}

export function surligner(contenu: Html | string, aSurligner: boolean): Html {
  return aSurligner ? html`<mark class="a-valider">${contenu}</mark>` : html`${contenu}`
}

/** Mode relecture seulement : dit ce qui manque, pour qu'Anthony le relise. */
export function manque(noteDeRelecture: string | null): Html | null {
  return noteDeRelecture === null
    ? null
    : html`<mark class="a-valider">À valider : ${noteDeRelecture}</mark>`
}
