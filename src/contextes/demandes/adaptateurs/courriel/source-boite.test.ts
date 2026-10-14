import { describe, expect, it } from 'vitest'
import { creerBoiteMemoire } from '../../../../infrastructure/courriel/lecture/boite-memoire.js'
import {
  courrielClient,
  nonRemiseGmail,
  nonRemisePostfix,
  REFERENCE_ESSAI,
  reponseGmail,
} from '../../../../infrastructure/courriel/lecture/essai/echantillons.js'
import { BASE_EN_MEMOIRE, ouvrirBaseDemandes } from '../sqlite/base.js'
import { creerDepotFiligraneSqlite } from '../sqlite/filigrane-sqlite.js'
import { creerSourceBoite } from './source-boite.js'

describe('relevé de la boîte pour les demandes (Kano connecteurs, C5)', () => {
  it('traduit réponses et non-remises en événements, sans texte, et ne relit rien une fois confirmé', async () => {
    const boite = creerBoiteMemoire()
    const filigranes = creerDepotFiligraneSqlite(ouvrirBaseDemandes(BASE_EN_MEMOIRE))
    const source = creerSourceBoite(boite, filigranes, 'INBOX')
    await (await source.relever()).confirmer()
    boite.deposer(reponseGmail('Fait'))
    boite.deposer(courrielClient())
    boite.deposer(nonRemiseGmail())
    boite.deposer(nonRemisePostfix('delayed'))

    const releve = await source.relever()
    expect(releve.evenements).toEqual([
      expect.objectContaining({
        nature: 'reponse',
        references: [REFERENCE_ESSAI],
        expediteur: 'garage.essai@gmail.com',
        commandeTraitee: true,
        authentificationEchouee: false,
      }),
      expect.objectContaining({
        nature: 'non-remise',
        references: [REFERENCE_ESSAI],
        motif: expect.stringContaining('5.1.1') as unknown,
      }),
    ])
    expect(JSON.stringify(releve.evenements)).not.toContain('Julie')

    expect((await source.relever()).evenements).toHaveLength(2)
    await releve.confirmer()
    expect((await source.relever()).evenements).toEqual([])
    expect(filigranes.lire('INBOX')?.dernierUid).toBe(4)
  })
})
