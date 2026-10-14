/**
 * Point d'entrée de `pnpm sms:tester` (voir `tester-sms.ts`).
 *
 *   développement : pnpm sms:tester -- --envoyer
 *   serveur       : node dist/infrastructure/cli/sms-tester.js --envoyer
 */
import { lireTelephoneGarage } from './telephone-garage.js'
import { executerTestSms } from './tester-sms.js'

process.exitCode = await executerTestSms(process.argv.slice(2), {
  env: process.env,
  telephoneGarage: await lireTelephoneGarage(process.env, process.cwd()),
  sorties: {
    ecrire: (texte) => process.stdout.write(texte),
    ecrireErreur: (texte) => process.stderr.write(`${texte}\n`),
  },
})
