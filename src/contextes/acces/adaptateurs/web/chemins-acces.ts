import { CHEMINS } from '../../../../contrats/index.js'

/** Adresses propres à ce contexte, toutes sous `/garagiste` (cookie, `noindex`). */
export const CHEMINS_ACCES = {
  /** Page d'arrivée du lien reçu par courriel ; l'ouverture de session se fait par POST. */
  lien: `${CHEMINS.garagisteConnexion}/lien`,
  deconnexion: `${CHEMINS.garagiste}/deconnexion`,
  signaler: `${CHEMINS.garagiste}/signaler`,
} as const

export const PARAMETRES_ACCES = {
  /** Jeton du lien de connexion, dans l'adresse envoyée au garagiste. */
  jeton: 'jeton',
  /** Message d'état fixe de la page de connexion (jamais un texte repris de l'adresse). */
  etat: 'etat',
} as const

export const ETAT_DECONNEXION = 'deconnexion'

/** Adresse absolue d'un lien de connexion, bâtie sur l'origine publique configurée. */
export function adresseDuLien(urlPublique: string, jeton: string): string {
  const parametres = new URLSearchParams({ [PARAMETRES_ACCES.jeton]: jeton })
  return `${urlPublique}${CHEMINS_ACCES.lien}?${parametres.toString()}`
}
