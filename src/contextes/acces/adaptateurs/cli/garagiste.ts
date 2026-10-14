/**
 * Point d'entrée des commandes d'exploitation de l'espace garagiste.
 *
 *   développement : pnpm exec tsx src/contextes/acces/adaptateurs/cli/garagiste.ts reinitialiser
 *   serveur       : node dist/contextes/acces/adaptateurs/cli/garagiste.js reinitialiser
 */
import { executerCommande } from './commandes.js'

process.exitCode = executerCommande(process.argv.slice(2), {
  env: process.env,
  repertoireCourant: process.cwd(),
  sorties: {
    ecrire: (texte) => process.stdout.write(texte),
    ecrireErreur: (texte) => process.stderr.write(`${texte}\n`),
  },
})
