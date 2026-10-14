import { describe, expect, it } from 'vitest'
import { sourceDe } from '../essais/contexte-essai.js'
import { donneesDuSite, donneesEssai } from '../essais/donnees-essai.js'
import { creerConsulterInformationsLegales } from './consulter-informations-legales.js'

describe('informations légales selon le mode', () => {
  it('production, configuration validée : tout est publié', async () => {
    const legales = await creerConsulterInformationsLegales(
      sourceDe(await donneesEssai()),
      'production',
    )()
    expect(legales.siret).toEqual({ visible: true, valeur: '12345678200002', aSurligner: false })
    expect(legales.mediateur).toMatchObject({ visible: true, valeur: { nom: "Médiateur d'essai" } })
  })

  it('vrai fichier en production : la dénomination relevée par l’étude n’est pas publiée', async () => {
    const legales = await creerConsulterInformationsLegales(
      sourceDe(await donneesDuSite()),
      'production',
    )()
    expect(legales.raisonSociale).toEqual({ visible: false, noteDeRelecture: null })
    expect(legales.nom).toBe('BF Auto')
  })

  it('vrai fichier en démonstration : ce qui est relevé s’affiche, l’inconnu reste absent', async () => {
    const legales = await creerConsulterInformationsLegales(
      sourceDe(await donneesDuSite()),
      'demonstration',
    )()
    expect(legales.raisonSociale).toMatchObject({ visible: true, valeur: 'GARAGE AUTO CHOISY 94' })
    expect(legales.siret).toMatchObject({ visible: true, valeur: '95334373800019' })
    expect(legales.mediateur.visible).toBe(false)
  })
})
