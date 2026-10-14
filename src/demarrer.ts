/** Point d'entrée : lit la configuration, compose le site et écoute. */
import { lireConfiguration } from './configuration.js'
import { composer } from './composition.js'

const SIGNAUX_ARRET = ['SIGINT', 'SIGTERM'] as const
const CODE_ECHEC = 1

async function demarrer(): Promise<void> {
  const configuration = lireConfiguration(process.env)
  const serveur = await composer(configuration)
  for (const signal of SIGNAUX_ARRET) {
    process.once(signal, () => {
      serveur.log.info({ signal }, 'Arrêt demandé')
      void serveur.close().then(() => process.exit(0))
    })
  }
  await serveur.listen({ port: configuration.port, host: configuration.hote })
  serveur.log.info(`BF Auto en ligne sur ${configuration.urlPublique}`)
}

demarrer().catch((erreur: unknown) => {
  console.error(erreur instanceof Error ? erreur.message : erreur)
  process.exit(CODE_ECHEC)
})
