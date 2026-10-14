/**
 * Point d'entrée de `pnpm courriel:tester` (voir `tester-courriel.ts`).
 *
 *   développement : pnpm courriel:tester -- --envoyer garage@gmail.com
 *   serveur       : node dist/infrastructure/cli/courriel-tester.js --envoyer garage@gmail.com
 */
import { executerTestCourriel } from './tester-courriel.js'

process.exitCode = await executerTestCourriel(process.argv.slice(2), {
  env: process.env,
  maintenant: () => new Date(),
  sorties: {
    ecrire: (texte) => process.stdout.write(texte),
    ecrireErreur: (texte) => process.stderr.write(`${texte}\n`),
  },
})
