/**
 * Faux serveur HTTP local pour tester les API de fournisseurs sans réseau :
 * il enregistre chaque requête reçue et répond selon une table de routes.
 */
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface RequeteRecue {
  readonly methode: string
  readonly chemin: string
  readonly enTetes: IncomingHttpHeaders
  readonly corps: string
}

export interface ReponsePreparee {
  readonly statut: number
  readonly corps: unknown
}

/** Clé de route : « MÉTHODE /chemin ». Une route absente répond 404. */
export type Routes = Readonly<
  Record<string, ReponsePreparee | ((requete: RequeteRecue) => ReponsePreparee)>
>

export interface FauxServeur {
  /** Origine du serveur, par exemple `http://127.0.0.1:53211`. */
  readonly origine: string
  readonly requetes: readonly RequeteRecue[]
  fermer(): Promise<void>
}

const STATUT_INTROUVABLE = 404

export async function demarrerFauxServeur(routes: Routes): Promise<FauxServeur> {
  const requetes: RequeteRecue[] = []
  const serveur: Server = createServer((requete, reponse) => {
    const morceaux: Buffer[] = []
    requete.on('data', (morceau: Buffer) => morceaux.push(morceau))
    requete.on('end', () => {
      const recue: RequeteRecue = {
        methode: requete.method ?? '',
        chemin: requete.url ?? '',
        enTetes: requete.headers,
        corps: Buffer.concat(morceaux).toString('utf8'),
      }
      requetes.push(recue)
      const route = routes[`${recue.methode} ${recue.chemin}`]
      const preparee =
        route === undefined
          ? { statut: STATUT_INTROUVABLE, corps: { message: 'route inconnue' } }
          : typeof route === 'function'
            ? route(recue)
            : route
      reponse.writeHead(preparee.statut, { 'Content-Type': 'application/json' })
      reponse.end(JSON.stringify(preparee.corps))
    })
  })
  await new Promise<void>((resolu) => serveur.listen(0, '127.0.0.1', resolu))
  const { port } = serveur.address() as AddressInfo
  return {
    origine: `http://127.0.0.1:${port}`,
    requetes,
    fermer: () =>
      new Promise<void>((resolu, rejete) => {
        serveur.closeAllConnections()
        serveur.close((erreur) => (erreur === undefined ? resolu() : rejete(erreur)))
      }),
  }
}
