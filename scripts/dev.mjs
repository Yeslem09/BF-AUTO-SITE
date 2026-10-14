// @ts-check
// Développement : ressources client reconstruites en continu, serveur relancé
// à chaque modification du code TypeScript.
import { spawn } from 'node:child_process'
import { construire, RACINE } from './construire-client.mjs'

await construire({ surveiller: true })
const serveur = spawn('pnpm', ['exec', 'tsx', 'watch', 'src/demarrer.ts'], {
  cwd: RACINE,
  stdio: 'inherit',
})
for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.once(signal, () => {
    serveur.kill(signal)
    process.exit(0)
  })
}
serveur.on('exit', (code) => process.exit(code ?? 0))
