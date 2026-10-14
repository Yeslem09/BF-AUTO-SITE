import { brut, type Html } from './html.js'

/**
 * Logo du site : jeu final « écrou » (docs/logo/final-ecrou, charte-logo.md).
 * Le B et le F serrent un écrou orange ; un chat dort sur le O. Tout ce qui
 * dessine le logo vit dans ce fichier (icônes : ressources.ts et public/).
 *
 * Deux versions du logotype compact (charte, section 6) : avec chat en en-tête
 * d'ordinateur (40 px de haut), sans chat sous 40 px (téléphone, 32 px). Tracés
 * en chemins, aucun élément texte, aucune couleur : lettres et chat suivent le
 * jeton `--logo-lettres`, l'écrou `--logo-ecrou` ; le symbole ajoute
 * `--symbole-fond` et `--symbole-lettres` (public/css/jetons.css). Sur une
 * zone sombre, les jetons donnent d'eux-mêmes la version négative.
 *
 * Les tracés sont posés une fois par page (`SPRITE_LOGO`) puis réutilisés par
 * `<use>` : en-tête et pied pour le poids d'un seul logo.
 */

/* Tracés en vigueur (docs/logo/final-ecrou/logo-compact.svg et symbole.svg). */
const CADRE_AVEC_CHAT = '-2 -349.2 1190 351.2'
const CADRE_SANS_CHAT = '-2 -242 1110 244'
const LETTRES =
  'M0 -240 124 -240 144 -205.4 144 -172.9 113.5 -120 144 -67.1 144 -34.6 124 0 0 0ZM100 -197.6 100 -184.7 73 -138 44 -138 44 -200 98.6 -200ZM98.6 -40 44 -40 44 -102 73 -102 100 -55.3 100 -42.4ZM202 -240 322 -240 322 -200 246 -200 246 -138 302.8 -138 302.8 -102 246 -102 246 0 202 0 202 -67.1 232.5 -120 202 -172.9ZM414 0 414 -181.1 448 -240 544 -240 578 -181.1 578 0 534 0 534 -86 458 -86 458 0ZM534 -173.3 534 -122 458 -122 458 -173.3 473.4 -200 518.6 -200ZM606 -240 650 -240 650 -42.4 651.4 -40 708.6 -40 710 -42.4 710 -240 754 -240 754 -34.6 734 0 626 0 606 -34.6ZM780 -240 924 -240 924 -200 874 -200 874 0 830 0 830 -200 780 -200ZM968 -240 1086 -240 1106 -205.4 1106 -34.6 1086 0 968 0 948 -34.6 948 -205.4ZM1062 -197.6 1062 -42.4 1060.6 -40 993.4 -40 992 -42.4 992 -197.6 993.4 -200 1060.6 -200Z'
const ECROU =
  'M221 -120 197 -78.4 149 -78.4 125 -120 149 -161.6 197 -161.6ZM157 -120a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z'
const CHAT =
  'M946 -281.2 946 -316 964 -347.2 982 -316 1006 -316 1024 -347.2 1042 -316 1042 -300 1112 -300 1138 -255 1138 -250 964 -250ZM1138 -254 1138 -180.9 1147.4 -164.8 1154.6 -164.8 1164 -180.9 1164 -194 1186 -194 1186 -175.1 1167.4 -142.8 1134.6 -142.8 1116 -175.1 1116 -254ZM965.7 -283 978.3 -283 980 -286 978.3 -289 965.7 -289 964 -286ZM1009.7 -283 1022.3 -283 1024 -286 1022.3 -289 1009.7 -289 1008 -286ZM994 -270 998.5 -277.8 989.5 -277.8Z'
const CADRE_SYMBOLE = '0 0 512 512'
const RAYON_SYMBOLE = 96
const LETTRES_SYMBOLE =
  'M48 96 208 96 240 151.4 240 183 197.8 256 240 329 240 360.6 208 416 48 416ZM176 152.6 176 165.8 133.2 240 112 240 112 144 171 144ZM171 368 112 368 112 272 133.2 272 176 346.2 176 359.4ZM304 96 464 96 464 144 368 144 368 240 438.4 240 438.4 272 368 272 368 416 304 416 304 329 346.2 256 304 183Z'
const ECROU_SYMBOLE =
  'M330 256 301 306.2 243 306.2 214 256 243 205.8 301 205.8ZM253 256a19 19 0 1 0 38 0a19 19 0 1 0 -38 0Z'

/** Hauteurs de référence de la charte, pour les attributs width et height (aucun décalage au chargement). */
const HAUTEUR_AVEC_CHAT = 40
const LARGEUR_AVEC_CHAT = 136
const HAUTEUR_SANS_CHAT = 32
const LARGEUR_SANS_CHAT = 146

/** Identifiants des tracés partagés, préfixés pour ne heurter aucun autre id de la page. */
const ID = { lettres: 'logo-lettres', ecrou: 'logo-ecrou', chat: 'logo-chat' } as const

/** Définitions des tracés, à poser une fois en tête du corps de chaque page. */
export const SPRITE_LOGO: Html = brut(
  '<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    `<path id="${ID.lettres}" fill-rule="evenodd" d="${LETTRES}"/>` +
    `<path id="${ID.ecrou}" fill-rule="evenodd" d="${ECROU}"/>` +
    `<path id="${ID.chat}" d="${CHAT}"/>` +
    '</defs></svg>',
)

const utiliser = (id: string, classe: string): string => `<use href="#${id}" class="${classe}"/>`

/** Logotype avec chat : en-tête d'ordinateur, pied de page (40 px de haut au moins). */
export const LOGO_AVEC_CHAT: Html = brut(
  `<svg class="logo logo--avec-chat" viewBox="${CADRE_AVEC_CHAT}" width="${LARGEUR_AVEC_CHAT}" height="${HAUTEUR_AVEC_CHAT}" aria-hidden="true" focusable="false">` +
    utiliser(ID.lettres, 'logo__lettres') +
    utiliser(ID.ecrou, 'logo__ecrou') +
    utiliser(ID.chat, 'logo__lettres') +
    '</svg>',
)

/** Logotype sans chat : en-tête de téléphone (32 px de haut, 24 px au plus petit). */
export const LOGO_SANS_CHAT: Html = brut(
  `<svg class="logo logo--sans-chat" viewBox="${CADRE_SANS_CHAT}" width="${LARGEUR_SANS_CHAT}" height="${HAUTEUR_SANS_CHAT}" aria-hidden="true" focusable="false">` +
    utiliser(ID.lettres, 'logo__lettres') +
    utiliser(ID.ecrou, 'logo__ecrou') +
    '</svg>',
)

/** Symbole carré (B, écrou, F sur fond graphite), autonome : encart « Nouveau nom », rappels de marque. */
export const SYMBOLE: Html = brut(
  `<svg class="symbole" viewBox="${CADRE_SYMBOLE}" width="76" height="76" aria-hidden="true" focusable="false">` +
    `<rect class="symbole__fond" width="512" height="512" rx="${RAYON_SYMBOLE}"/>` +
    `<path class="symbole__lettres" fill-rule="evenodd" d="${LETTRES_SYMBOLE}"/>` +
    `<path class="logo__ecrou" fill-rule="evenodd" d="${ECROU_SYMBOLE}"/>` +
    '</svg>',
)
