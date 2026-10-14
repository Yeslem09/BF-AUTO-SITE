/**
 * Ressources publiques communes à toutes les pages. La feuille de style et le
 * script commun sont produits par `scripts/construire-client.mjs` ; icônes et
 * image de partage sont copiées du logo final (docs/logo/final-ecrou), avec
 * icon-192.png et icon-512.png pour un futur manifeste.
 */
const POLICE_TEXTE = '/fonts/hanken-grotesk-400.woff2'
const POLICE_TITRES = '/fonts/hanken-grotesk-600.woff2'

export const RESSOURCES = {
  feuilleDeStyle: '/css/bf-auto.css',
  scriptCommun: '/js/commun.js',
  /** Les deux seules graisses du site, préchargées (P-02 : deux fichiers au plus). */
  polices: [POLICE_TEXTE, POLICE_TITRES],
  faviconSvg: '/favicon.svg',
  faviconPng: '/favicon-32.png',
  faviconPetit: '/favicon-16.png',
  iconeApple: '/apple-touch-icon.png',
  imagePartage: '/og-image.png',
} as const

/** Sans elles, la page s'affiche cassée : le serveur refuse de démarrer. */
export const RESSOURCES_INDISPENSABLES: readonly string[] = [
  RESSOURCES.feuilleDeStyle,
  RESSOURCES.scriptCommun,
  ...RESSOURCES.polices,
  RESSOURCES.faviconSvg,
  RESSOURCES.faviconPng,
  RESSOURCES.faviconPetit,
  RESSOURCES.iconeApple,
  RESSOURCES.imagePartage,
]
