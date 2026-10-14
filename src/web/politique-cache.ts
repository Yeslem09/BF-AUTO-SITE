import { PARAMETRE_VERSION } from './versionneur.js'

const UN_AN_EN_SECONDES = 31_536_000
const UN_JOUR_EN_SECONDES = 86_400

export const CACHE_IMMUABLE = `public, max-age=${UN_AN_EN_SECONDES}, immutable`
export const CACHE_REVALIDER = 'no-cache'
export const CACHE_IMAGES = `public, max-age=${UN_JOUR_EN_SECONDES}`
export const CACHE_AUCUN = 'no-store'

const PREFIXE_POLICES = '/fonts/'
const PREFIXES_VERSIONNABLES = ['/js/', '/css/']

/**
 * En-tête Cache-Control d'une réponse.
 * - polices : immuables (un fichier de police ne change jamais de contenu sous
 *   le même nom ; en cas de remplacement, changer le nom du fichier) ;
 * - scripts et feuilles de style : immuables s'ils portent une empreinte,
 *   sinon revalidés à chaque usage ;
 * - HTML : toujours revalidé (le statut d'ouverture change dans la journée) ;
 * - le reste des fichiers publics (images, icônes) : un jour.
 */
export function politiqueCache(url: string, typeContenu: string | undefined): string {
  const [chemin = '', requete = ''] = url.split('?', 2)
  if (chemin.startsWith(PREFIXE_POLICES)) return CACHE_IMMUABLE
  if (PREFIXES_VERSIONNABLES.some((prefixe) => chemin.startsWith(prefixe))) {
    return new URLSearchParams(requete).has(PARAMETRE_VERSION) ? CACHE_IMMUABLE : CACHE_REVALIDER
  }
  if (typeContenu === undefined || typeContenu.startsWith('text/html')) return CACHE_REVALIDER
  if (typeContenu.startsWith('application/json')) return CACHE_AUCUN
  return CACHE_IMAGES
}
