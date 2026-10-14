import { beforeEach, describe, expect, it } from 'vitest'
import { creerConsulterGarage, type FicheGarage } from '../../application/consulter-garage.js'
import { fermeture } from '../../essais/calendrier-essai.js'
import { depotAvec, sourceDe } from '../../essais/contexte-essai.js'
import {
  donneesDuSite,
  donneesEssai,
  remplacer,
  valide,
  type Donnees,
} from '../../essais/donnees-essai.js'
import type { PeriodeFermeture } from '../../domaine/fermeture.js'
import { donneesStructurees, rendreDonneesStructurees } from './json-ld.js'

const MERCREDI_10H = new Date('2026-09-23T08:00:00Z')

let essai: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
})

async function fiche(
  donnees: Donnees,
  ...fermetures: readonly PeriodeFermeture[]
): Promise<FicheGarage> {
  return creerConsulterGarage(
    sourceDe(donnees),
    await depotAvec(...fermetures),
    'production',
  )(MERCREDI_10H)
}

describe('données structurées AutoRepair (Kano D10, B-17, US-04)', () => {
  it('reprend nom, adresse, téléphone, courriel, coordonnées et horaires de la configuration', async () => {
    const donnees = donneesStructurees(await fiche(essai))
    expect(donnees).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: 'BF Auto',
      telephone: '+33605922838',
      email: 'contact@garage-essai.example',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7 rue Demanieux',
        postalCode: '94600',
        addressLocality: 'Choisy-le-Roi',
        addressCountry: 'FR',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 48.77, longitude: 2.41 },
    })
    const horaires = donnees['openingHoursSpecification'] as readonly Record<string, string>[]
    expect(horaires).toHaveLength(12)
    expect(horaires[0]).toEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'https://schema.org/Monday',
      opens: '08:30',
      closes: '12:00',
    })
    expect(horaires.some((horaire) => horaire['dayOfWeek'] === 'https://schema.org/Sunday')).toBe(
      false,
    )
  })

  it('ne contient jamais de note ni d’avis', async () => {
    const texte = JSON.stringify(donneesStructurees(await fiche(essai)))
    expect(texte).not.toContain('aggregateRating')
    expect(texte).not.toContain('review')
  })

  it('déclare chaque fermeture à venir en horaires exceptionnels fermés', async () => {
    const donnees = donneesStructurees(await fiche(essai, fermeture('2026-09-28', '2026-10-03')))
    expect(donnees['specialOpeningHoursSpecification']).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        validFrom: '2026-09-28',
        validThrough: '2026-10-03',
        opens: '00:00',
        closes: '00:00',
      },
    ])
  })

  it('le vrai fichier en production : ni horaires ni coordonnées inventés, le courriel validé seul', async () => {
    const donnees = donneesStructurees(await fiche(await donneesDuSite()))
    expect(donnees['openingHoursSpecification']).toBeUndefined()
    // Courriel validé par Anthony le 2026-09-24 (donnees/garage.json) : publié tel quel.
    expect(donnees['email']).toBe('bfauto94@gmail.com')
    expect(donnees['geo']).toBeUndefined()
  })

  it('aucune valeur ne peut fermer l’élément script', async () => {
    remplacer(essai, 'identite.nom', valide('BF Auto</script><script>alert(1)</script>'))
    const rendu = rendreDonneesStructurees(await fiche(essai)).toString()
    expect(rendu.match(/<\/script>/g)).toHaveLength(1)
    expect(rendu).toContain('\\u003c/script\\u003e')
    const json = rendu.replace('<script type="application/ld+json">', '').replace('</script>', '')
    expect((JSON.parse(json) as { name: string }).name).toBe(
      'BF Auto</script><script>alert(1)</script>',
    )
  })
})
