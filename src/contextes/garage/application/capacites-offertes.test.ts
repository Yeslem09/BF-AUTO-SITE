import { beforeEach, describe, expect, it } from 'vitest'
import { fermeture } from '../essais/calendrier-essai.js'
import { depotAvec, sourceDe } from '../essais/contexte-essai.js'
import {
  aValider,
  donneesDuSite,
  donneesEssai,
  remplacer,
  type Donnees,
} from '../essais/donnees-essai.js'
import { creerAnnoncerRappel } from './annoncer-rappel.js'
import { creerProposerDemiJournees } from './proposer-demi-journees.js'

const MERCREDI_21H = new Date('2026-09-23T19:00:00Z')

let essai: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
})

describe('capacité offerte aux demandes : proposer des demi-journées (Kano D4, US-11)', () => {
  it('dix demi-journées, sans le dimanche ni un lundi fermé exceptionnellement', async () => {
    const depot = await depotAvec(fermeture('2026-09-28', '2026-09-28'))
    const proposees = await creerProposerDemiJournees(
      sourceDe(essai),
      depot,
      'production',
    )(MERCREDI_21H)
    expect(proposees).toHaveLength(10)
    expect(proposees[0]).toEqual({ code: '2026-09-24-matin', libelle: 'Jeudi 24 septembre, matin' })
    expect(proposees.map((demi) => demi.code).filter((code) => /2026-09-2[78]/.test(code))).toEqual(
      [],
    )
  })

  it('aucune demi-journée tant que la semaine n’est pas publiable (vrai fichier en production)', async () => {
    const proposees = await creerProposerDemiJournees(
      sourceDe(await donneesDuSite()),
      await depotAvec(),
      'production',
    )(MERCREDI_21H)
    expect(proposees).toEqual([])
  })

  it('en démonstration, les horaires proposés donnent des demi-journées', async () => {
    const proposees = await creerProposerDemiJournees(
      sourceDe(await donneesDuSite()),
      await depotAvec(),
      'demonstration',
    )(MERCREDI_21H)
    expect(proposees[0]?.code).toBe('2026-09-24-matin')
  })
})

describe('capacité offerte aux demandes : annoncer le rappel (Kano AT-3, US-13)', () => {
  it('mercredi à 21 h : jeudi matin', async () => {
    const annoncer = creerAnnoncerRappel(sourceDe(essai), await depotAvec(), 'production')
    expect(await annoncer(MERCREDI_21H, 'des-que-possible')).toBe(
      'Nous vous rappelons jeudi matin.',
    )
  })

  it('mercredi à 21 h, client joignable en fin de journée : jeudi, en fin de journée', async () => {
    const annoncer = creerAnnoncerRappel(sourceDe(essai), await depotAvec(), 'production')
    expect(await annoncer(MERCREDI_21H, 'fin-de-journee')).toBe(
      'Nous vous rappelons jeudi, en fin de journée.',
    )
  })

  it('une fermeture qui couvre le jeudi repousse l’annonce après elle', async () => {
    const depot = await depotAvec(fermeture('2026-09-24', '2026-09-25'))
    const annoncer = creerAnnoncerRappel(sourceDe(essai), depot, 'production')
    expect(await annoncer(MERCREDI_21H, 'des-que-possible')).toBe(
      'Nous vous rappelons samedi matin.',
    )
  })

  it('un délai de rappel à valider : aucune demi-journée ni date annoncée', async () => {
    remplacer(essai, 'suivi_client.delai_rappel', aValider('à confirmer'))
    const annoncer = creerAnnoncerRappel(sourceDe(essai), await depotAvec(), 'production')
    expect(await annoncer(MERCREDI_21H, 'des-que-possible')).toBeNull()
  })

  it('le vrai fichier en production ne promet rien ; en démonstration, sa proposition s’applique', async () => {
    const site = sourceDe(await donneesDuSite())
    expect(
      await creerAnnoncerRappel(
        site,
        await depotAvec(),
        'production',
      )(MERCREDI_21H, 'des-que-possible'),
    ).toBeNull()
    expect(
      await creerAnnoncerRappel(
        site,
        await depotAvec(),
        'demonstration',
      )(MERCREDI_21H, 'des-que-possible'),
    ).toBe('Nous vous rappelons jeudi matin.')
  })
})
