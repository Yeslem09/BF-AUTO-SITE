import { creerEmettreLienDeSecours } from '../../application/emettre-lien-secours.js'
import { creerReinitialiserAcces } from '../../application/reinitialiser-acces.js'
import type { Horloge } from '../../application/ports.js'
import {
  lireCheminBase,
  lireUrlPublique,
  type Environnement,
} from '../configuration/reglages-environnement.js'
import { generateurJetonAleatoire, hachageSha256 } from '../crypto/jetons.js'
import { horlogeSysteme } from '../horloge/horloge-systeme.js'
import { creerDepotAccesSqlite } from '../sqlite/depot-acces-sqlite.js'
import { adresseDuLien } from '../web/chemins-acces.js'

export const CODES_SORTIE = { succes: 0, echec: 1, usage: 2 } as const

export const USAGE = [
  'Usage : garagiste <commande>',
  '',
  '  reinitialiser  révoque toutes les sessions de l’espace garagiste et les liens non utilisés',
  '  lien           crée un lien de connexion de secours (15 minutes, usage unique) et l’affiche',
  '',
  'Variables lues : BASE_SQLITE (var/demandes.sqlite par défaut), URL_PUBLIQUE.',
].join('\n')

export interface Sorties {
  readonly ecrire: (texte: string) => void
  readonly ecrireErreur: (texte: string) => void
}

export interface ContexteCommande {
  readonly env: Environnement
  readonly repertoireCourant: string
  readonly sorties: Sorties
  readonly horloge?: Horloge
}

/**
 * Commandes d'exploitation d'Anthony, lancées sur le serveur (Kano D5). Elles
 * écrivent dans la même base que le site en marche : l'effet est immédiat,
 * sans redémarrage.
 */
export function executerCommande(
  argumentsRecus: readonly string[],
  contexte: ContexteCommande,
): number {
  const [commande, ...reste] = argumentsRecus
  if ((commande !== 'reinitialiser' && commande !== 'lien') || reste.length > 0) {
    contexte.sorties.ecrireErreur(USAGE)
    return CODES_SORTIE.usage
  }
  try {
    const depot = creerDepotAccesSqlite(lireCheminBase(contexte.env, contexte.repertoireCourant))
    try {
      if (commande === 'reinitialiser') {
        const bilan = creerReinitialiserAcces({ depot })()
        contexte.sorties.ecrire(
          `Accès réinitialisé : ${bilan.sessions} session(s) révoquée(s), ${bilan.liens} lien(s) non utilisé(s) annulé(s).\n` +
            'Le garagiste devra demander un nouveau lien de connexion.\n',
        )
        return CODES_SORTIE.succes
      }
      const urlPublique = lireUrlPublique(contexte.env)
      const lien = creerEmettreLienDeSecours({
        depot,
        generateur: generateurJetonAleatoire,
        hachage: hachageSha256,
        horloge: contexte.horloge ?? horlogeSysteme,
        adresseDuLien: (jeton) => adresseDuLien(urlPublique, jeton),
      })()
      contexte.sorties.ecrire(
        `Lien de connexion de secours, à usage unique, valable jusqu’à ${lien.expireLe.toISOString()} :\n${lien.adresse}\n`,
      )
      return CODES_SORTIE.succes
    } finally {
      depot.fermer()
    }
  } catch (erreur) {
    contexte.sorties.ecrireErreur(erreur instanceof Error ? erreur.message : String(erreur))
    return CODES_SORTIE.echec
  }
}
