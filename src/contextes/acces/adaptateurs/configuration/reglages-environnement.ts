/**
 * Variables lues par les commandes d'exploitation (`garagiste lien`,
 * `garagiste reinitialiser`), lancées à côté du site et non par lui : elles
 * n'ont pas de racine de composition. Mêmes noms et mêmes défauts que
 * `src/configuration.ts` ; le site, lui, reçoit ses réglages de la composition.
 *
 * | Variable     | Défaut                  | Rôle                                   |
 * |--------------|-------------------------|----------------------------------------|
 * | BASE_SQLITE  | var/demandes.sqlite     | Base partagée où vivent les sessions   |
 * | URL_PUBLIQUE | http://localhost:<PORT> | Origine du lien de connexion de secours |
 */
import { resolve } from 'node:path'

export type Environnement = Readonly<Record<string, string | undefined>>

export class ErreurReglagesAcces extends Error {
  override readonly name = 'ErreurReglagesAcces'

  constructor(readonly problemes: readonly string[]) {
    super(
      `Réglages de l’espace garagiste invalides :\n${problemes.map((p) => `- ${p}`).join('\n')}`,
    )
  }
}

const PORT_PAR_DEFAUT = '3000'
const BASE_PAR_DEFAUT = 'var/demandes.sqlite'

function lecteur(env: Environnement) {
  return (nom: string): string | null => {
    const valeur = env[nom]?.trim()
    return valeur === undefined || valeur === '' ? null : valeur
  }
}

/** Base SQLite partagée, résolue depuis `repertoireCourant` comme le fait la configuration du site. */
export function lireCheminBase(env: Environnement, repertoireCourant: string): string {
  return resolve(repertoireCourant, lecteur(env)('BASE_SQLITE') ?? BASE_PAR_DEFAUT)
}

/** Origine publique des liens de secours, réduite à son origine. */
export function lireUrlPublique(env: Environnement): string {
  const texte = lecteur(env)
  const brut = texte('URL_PUBLIQUE') ?? `http://localhost:${texte('PORT') ?? PORT_PAR_DEFAUT}`
  let adresse: URL
  try {
    adresse = new URL(brut)
  } catch {
    throw new ErreurReglagesAcces([`URL_PUBLIQUE : « ${brut} » n’est pas une adresse`])
  }
  if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') {
    throw new ErreurReglagesAcces(['URL_PUBLIQUE : http ou https attendu'])
  }
  return adresse.origin
}
