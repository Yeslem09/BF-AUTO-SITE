import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ErreurDonneesDemandes } from '../../domaine/erreurs.js'
import { chargerParametresDemandes } from './parametres-fichier.js'

const FICHIER_DU_DEPOT = fileURLToPath(
  new URL('../../../../../donnees/demandes.json', import.meta.url),
)

describe('fichier des paramètres des demandes', () => {
  let dossier: string

  beforeEach(async () => {
    dossier = await mkdtemp(join(tmpdir(), 'bf-auto-parametres-'))
  })
  afterEach(async () => rm(dossier, { recursive: true, force: true }))

  it('le fichier versionné est valide : numéro proposé, à valider, jamais présenté comme un fait', async () => {
    expect(await chargerParametresDemandes(FICHIER_DU_DEPOT)).toEqual({
      numeroRappel: {
        telephone: { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' },
        statut: 'a_valider',
      },
    })
  })

  it('un fichier absent ou mal formé empêche le démarrage en nommant le chemin', async () => {
    const absent = join(dossier, 'absent.json')
    await expect(chargerParametresDemandes(absent)).rejects.toThrow(ErreurDonneesDemandes)
    await expect(chargerParametresDemandes(absent)).rejects.toThrow(absent)
    const casse = join(dossier, 'casse.json')
    await writeFile(casse, '{ pas du json')
    await expect(chargerParametresDemandes(casse)).rejects.toThrow(/JSON invalide/)
  })
})
