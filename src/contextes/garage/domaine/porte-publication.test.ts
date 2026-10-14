import { beforeEach, describe, expect, it } from 'vitest'
import {
  aValider,
  donneesDuSite,
  donneesEssai,
  remplacer,
  valide,
  type Donnees,
} from '../essais/donnees-essai.js'
import { manquesPourLaProduction } from './porte-publication.js'
import { validerDonneesGarage } from './validation.js'

let essai: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
})

describe('porte de démarrage en production (Kano D8, US-05)', () => {
  it('une configuration entièrement validée démarre', () => {
    const garage = validerDonneesGarage(essai)
    expect(manquesPourLaProduction(garage)).toEqual([])
  })

  it('le médiateur à valider arrête le démarrage, et le message le nomme', () => {
    remplacer(essai, 'mediateur', aValider('médiateur à choisir'))
    const garage = validerDonneesGarage(essai)
    expect(manquesPourLaProduction(garage)).toEqual([
      'mediateur (médiateur de la consommation) à valider : médiateur à choisir',
    ])
  })

  // Toutes les données bloquantes du Kano D8 tenues par le garage : en retirer
  // une de la porte fait échouer sa ligne (vu rouge par injection).
  it.each([
    ['socle_de_confiance.prenom_garagiste', 'prénom du garagiste'],
    ['socle_de_confiance.photo_facade', 'photo de la façade'],
    ['socle_de_confiance.devis_ecrit_avant_travaux', 'Devis écrit avant travaux'],
    [
      'socle_de_confiance.appel_avant_travaux_supplementaires',
      'Nous vous appelons avant tout travail supplémentaire',
    ],
    ['socle_de_confiance.accueil_sans_rendez_vous', 'accueil sans rendez-vous'],
    ['identite.courriel', 'courriel public'],
    ['horaires', 'horaires jour par jour'],
    ['editeur.raison_sociale', 'dénomination sociale'],
    ['editeur.forme_juridique', 'forme juridique'],
    ['editeur.capital', 'capital social'],
    ['editeur.siege', 'siège social'],
    ['editeur.registre', 'registre d’immatriculation'],
    ['editeur.siret', 'SIRET'],
    ['editeur.tva', 'TVA intracommunautaire'],
    ['editeur.directeur_publication', 'directeur de la publication'],
    ['hebergement.hebergeur', 'hébergeur'],
    ['hebergement.region', 'région d’hébergement'],
    ['hebergement.prestataires_envoi', 'prestataires d’envoi'],
    ['hebergement.encadrement_transferts', 'transferts hors de l’Union'],
    ['mediateur', 'médiateur de la consommation'],
    ['marque.nom_de_domaine', 'nom de domaine'],
    ['marque.anteriorite_marque', 'antériorité de la marque'],
  ])('%s à valider arrête le démarrage et nomme « %s »', (chemin, libelle) => {
    remplacer(essai, chemin, aValider('à obtenir'))
    const manques = manquesPourLaProduction(validerDonneesGarage(essai))
    expect(manques).toHaveLength(1)
    expect(manques[0]).toContain(chemin)
    expect(manques[0]).toContain(libelle)
  })

  // Nom, adresse et téléphone ne peuvent pas être vides (le site ne se rendrait
  // pas) : à valider, ils portent une proposition, qui ne suffit pas non plus.
  it.each([
    ['identite.nom', 'nom du garage', 'BF Auto'],
    [
      'identite.adresse',
      'adresse',
      { voie: '7 rue Demanieux', code_postal: '94600', ville: 'Choisy-le-Roi' },
    ],
    ['identite.telephone', 'téléphone', '06 05 92 28 38'],
  ])('%s proposé mais à valider arrête le démarrage et nomme « %s »', (chemin, libelle, valeur) => {
    remplacer(essai, chemin, aValider('à confirmer', valeur))
    const manques = manquesPourLaProduction(validerDonneesGarage(essai))
    expect(manques).toHaveLength(1)
    expect(manques[0]).toContain(`${chemin} (${libelle})`)
  })

  it('une proposition ne suffit pas : seule une valeur validée ouvre la production', () => {
    remplacer(essai, 'socle_de_confiance.devis_ecrit_avant_travaux', aValider('à confirmer', true))
    expect(manquesPourLaProduction(validerDonneesGarage(essai))).toHaveLength(1)
  })

  it('un engagement refusé par le garagiste n’est pas un repli : il rouvre la décision', () => {
    remplacer(essai, 'socle_de_confiance.appel_avant_travaux_supplementaires', valide(false))
    expect(manquesPourLaProduction(validerDonneesGarage(essai))).toEqual([
      expect.stringMatching(/refusé par le garagiste : le site ne sort pas en l’état/),
    ])
  })

  it('l’accueil sans rendez-vous refusé est une réponse valable, pas un refus', () => {
    remplacer(essai, 'socle_de_confiance.accueil_sans_rendez_vous', valide(false))
    expect(manquesPourLaProduction(validerDonneesGarage(essai))).toEqual([])
  })

  it('une donnée non bloquante à valider ne bloque pas (accroche, moyens de paiement, avis)', () => {
    remplacer(essai, 'identite.accroche', aValider('à valider'))
    remplacer(essai, 'pratique.moyens_paiement', aValider('à obtenir'))
    remplacer(essai, 'suivi_client.lien_avis_google', aValider('après renommage'))
    expect(manquesPourLaProduction(validerDonneesGarage(essai))).toEqual([])
  })

  it('le vrai fichier du site ne peut pas partir en production aujourd’hui', async () => {
    const garage = validerDonneesGarage(await donneesDuSite())
    const manques = manquesPourLaProduction(garage)
    expect(manques.length).toBeGreaterThan(10)
    expect(manques.join('\n')).toContain('médiateur de la consommation')
  })
})
