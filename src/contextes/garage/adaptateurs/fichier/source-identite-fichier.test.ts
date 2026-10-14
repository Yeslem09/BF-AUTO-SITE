import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FICHIER_DU_SITE } from '../../essais/donnees-essai.js'
import { creerSourceIdentiteFichier, ErreurFichierGarage } from './source-identite-fichier.js'

let dossier = ''
beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'bf-auto-garage-'))
})
afterEach(async () => rm(dossier, { recursive: true, force: true }))

describe('source d’identité : fichier JSON', () => {
  it('charge et valide le vrai fichier du site', async () => {
    const garage = await creerSourceIdentiteFichier(FICHIER_DU_SITE).charger()
    expect(garage.identite.nom.valeur).toBe('BF Auto')
    expect(garage.identite.adresse.valeur).toEqual({
      voie: '7 rue Demanieux',
      codePostal: '94600',
      ville: 'Choisy-le-Roi',
    })
    expect(garage.identite.telephone.valeur.lien).toBe('tel:+33605922838')
    expect(garage.horaires.statut).toBe('a_valider')
  })

  it('ne lit le fichier qu’une fois', async () => {
    const chemin = join(dossier, 'garage.json')
    await writeFile(chemin, await readFile(FICHIER_DU_SITE, 'utf8'))
    const source = creerSourceIdentiteFichier(chemin)
    const premier = await source.charger()
    await writeFile(chemin, '{ cassé')
    expect(await source.charger()).toBe(premier)
  })

  it('nomme le fichier absent', async () => {
    const chemin = join(dossier, 'absent.json')
    await expect(creerSourceIdentiteFichier(chemin).charger()).rejects.toThrow(
      new ErreurFichierGarage(`Fichier du garage illisible : ${chemin}.`),
    )
  })

  it('signale un JSON mal formé avec le chemin du fichier', async () => {
    const chemin = join(dossier, 'garage.json')
    await writeFile(chemin, '{ "nom": ')
    await expect(creerSourceIdentiteFichier(chemin).charger()).rejects.toThrow(
      `${chemin} n’est pas un JSON valide`,
    )
  })

  it('relaie chaque problème de validation avec le chemin du fichier', async () => {
    const chemin = join(dossier, 'garage.json')
    await writeFile(chemin, JSON.stringify({ identite: {} }))
    const erreur = await creerSourceIdentiteFichier(chemin)
      .charger()
      .catch((e: unknown) => e)
    expect(erreur).toBeInstanceOf(ErreurFichierGarage)
    expect(String((erreur as Error).message)).toContain(`${chemin} : Données du garage invalides`)
    expect(String((erreur as Error).message)).toContain('- identite.telephone : champ manquant')
  })
})
