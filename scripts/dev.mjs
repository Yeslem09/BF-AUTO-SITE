// @ts-check
// Développement : ressources client reconstruites en continu, serveur relancé
// à chaque modification du code TypeScript.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { construire, RACINE } from './construire-client.mjs'

// tsx lancé par Node lui-même : sous Windows, `spawn('pnpm')` sans shell échoue
// (ENOENT), pnpm n'y existant que sous forme de pnpm.cmd.
const CLI_TSX = fileURLToPath(import.meta.resolve('tsx/cli'))

await construire({ surveiller: true })
const serveur = spawn(process.execPath, [CLI_TSX, 'watch', 'src/demarrer.ts'], {
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
