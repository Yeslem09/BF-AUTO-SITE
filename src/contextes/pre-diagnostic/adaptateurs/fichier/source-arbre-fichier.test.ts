import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FICHIER_ARBRE_DU_SITE } from '../../essais/arbre-essai.js'
import { creerSourceArbreFichier, ErreurFichierArbre } from './source-arbre-fichier.js'

describe('source de l’arbre en fichier', () => {
  it('rend le contenu analysé, sans l’interpréter', async () => {
    const brut = await creerSourceArbreFichier(FICHIER_ARBRE_DU_SITE).lire()
    expect(brut).toMatchObject({ version: expect.any(String), branches: expect.any(Array) })
  })

  it('signale un fichier absent', async () => {
    await expect(creerSourceArbreFichier('/absent/pre-diagnostic.json').lire()).rejects.toThrow(
      ErreurFichierArbre,
    )
  })

  it('signale un JSON invalide, avec le chemin du fichier', async () => {
    const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-arbre-'))
    const fichier = join(dossier, 'pre-diagnostic.json')
    await writeFile(fichier, '{ "version": ')
    try {
      await expect(creerSourceArbreFichier(fichier).lire()).rejects.toThrow(
        `${fichier} n’est pas un JSON valide`,
      )
    } finally {
      await rm(dossier, { recursive: true })
    }
  })
})
