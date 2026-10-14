import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { creerVersionneur, ErreurRessourceAbsente } from './versionneur.js'

let racine = ''

beforeEach(async () => {
  racine = await mkdtemp(join(tmpdir(), 'bf-auto-versionneur-'))
})
afterEach(async () => rm(racine, { recursive: true, force: true }))

describe('versionneur de ressources', () => {
  it('ajoute une empreinte stable tirée du contenu', async () => {
    await writeFile(join(racine, 'a.css'), 'body{}')
    await writeFile(join(racine, 'b.css'), 'body{}')
    const versionner = creerVersionneur(racine)
    const versionA = versionner('/a.css')
    expect(versionA).toMatch(/^\/a\.css\?v=[0-9a-f]{12}$/)
    expect(versionner('/a.css')).toBe(versionA)
    expect(versionner('/b.css').split('=')[1]).toBe(versionA.split('=')[1])
  })

  it('donne une empreinte différente à un contenu différent', async () => {
    await writeFile(join(racine, 'a.css'), 'body{}')
    await writeFile(join(racine, 'b.css'), 'p{}')
    const versionner = creerVersionneur(racine)
    expect(versionner('/a.css').split('=')[1]).not.toBe(versionner('/b.css').split('=')[1])
  })

  it('signale une ressource absente au lieu de servir un lien mort', () => {
    expect(() => creerVersionneur(racine)('/absent.js')).toThrow(ErreurRessourceAbsente)
  })
})
