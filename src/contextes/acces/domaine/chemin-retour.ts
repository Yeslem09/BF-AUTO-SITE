import { CHEMINS } from '../../../contrats/index.js'

/** Origine fictive servant seulement à résoudre une adresse relative. */
const ORIGINE_DE_RESOLUTION = 'http://resolution.invalid'
const LONGUEUR_MAX = 512
const CARACTERES_REFUSES = /[\\\x00-\x1f\x7f]/

/**
 * Page où revenir après la connexion : uniquement un chemin local de l'espace
 * garagiste, hors page de connexion. Toute autre valeur (adresse d'un autre
 * site, `//hote`, barre oblique inverse, caractère de contrôle, chemin public)
 * ramène à l'accueil de l'espace : aucune redirection ouverte.
 */
export function cheminRetourSur(valeur: unknown): string {
  if (typeof valeur !== 'string' || valeur.length > LONGUEUR_MAX) return CHEMINS.garagiste
  if (!valeur.startsWith('/') || valeur.startsWith('//') || CARACTERES_REFUSES.test(valeur)) {
    return CHEMINS.garagiste
  }
  const adresse = new URL(valeur, ORIGINE_DE_RESOLUTION)
  if (adresse.origin !== ORIGINE_DE_RESOLUTION) return CHEMINS.garagiste
  const { pathname } = adresse
  const dansLEspace = pathname === CHEMINS.garagiste || pathname.startsWith(`${CHEMINS.garagiste}/`)
  const versLaConnexion =
    pathname === CHEMINS.garagisteConnexion || pathname.startsWith(`${CHEMINS.garagisteConnexion}/`)
  if (!dansLEspace || versLaConnexion) return CHEMINS.garagiste
  return `${pathname}${adresse.search}`
}
