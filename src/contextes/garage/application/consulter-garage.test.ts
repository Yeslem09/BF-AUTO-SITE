import { beforeEach, describe, expect, it } from 'vitest'
import { fermeture } from '../essais/calendrier-essai.js'
import { depotAvec, sourceDe } from '../essais/contexte-essai.js'
import {
  aValider,
  donneesDuSite,
  donneesEssai,
  remplacer,
  valide,
  type Donnees,
} from '../essais/donnees-essai.js'
import { creerConsulterGarage } from './consulter-garage.js'

/** Mercredi 23 septembre 2026, 10 h à Paris (heure d'été). */
const MERCREDI_10H = new Date('2026-09-23T08:00:00Z')
/** Mercredi 23 septembre 2026, 21 h à Paris. */
const MERCREDI_21H = new Date('2026-09-23T19:00:00Z')

let essai: Donnees = {}
let site: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
  site = await donneesDuSite()
})

async function fiche(
  donnees: Donnees,
  mode: 'production' | 'relecture' | 'demonstration',
  instant = MERCREDI_10H,
  depot?: Awaited<ReturnType<typeof depotAvec>>,
) {
  return creerConsulterGarage(sourceDe(donnees), depot ?? (await depotAvec()), mode)(instant)
}

describe('fiche publique en production (configuration d’essai validée)', () => {
  it('publie l’identité, l’accroche, les activités, le courriel et les coordonnées validés', async () => {
    const { identite } = await fiche(essai, 'production')
    expect(identite).toEqual({
      nom: 'BF Auto',
      accroche: "Accroche d'essai du garage",
      activites: "Activités d'essai du garage",
      adresse: { voie: '7 rue Demanieux', codePostal: '94600', ville: 'Choisy-le-Roi' },
      telephone: { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' },
      courriel: 'contact@garage-essai.example',
      coordonnees: { latitude: 48.77, longitude: 2.41 },
    })
  })

  it('activités : publiées dans l’identité (couche web, premier écran), jamais une proposition en production', async () => {
    remplacer(essai, 'identite.activites', aValider('à confirmer', 'Mécanique et carrosserie'))
    expect((await fiche(essai, 'production')).identite).not.toHaveProperty('activites')
    // `activites` est un champ facultatif du contrat, lu par la couche web.
    expect((await fiche(essai, 'demonstration')).identite).toHaveProperty(
      'activites',
      'Mécanique et carrosserie',
    )
    expect((await fiche(essai, 'relecture')).identite).toHaveProperty(
      'activites',
      'Mécanique et carrosserie (à valider)',
    )
  })

  it('calcule le statut et la semaine, aujourd’hui en tête', async () => {
    const resultat = await fiche(essai, 'production')
    expect(resultat.statut).toEqual({ etat: 'ouvert', libelle: 'Ouvert, ferme à 12 h' })
    expect(resultat.horaires?.semaineGlissante[0]).toEqual({
      jour: 'Mercredi',
      aujourdhui: true,
      plages: ['8 h 30 à 12 h', '14 h à 19 h'],
      fermeExceptionnellement: false,
    })
  })

  it('publie les trois engagements pris, et « passez sans rendez-vous » seulement quand c’est ouvert', async () => {
    const ouvert = await fiche(essai, 'production')
    expect(ouvert.engagements.map((engagement) => engagement.texte)).toEqual([
      'Devis écrit avant travaux',
      'Nous vous appelons avant tout travail supplémentaire',
      'Pièces remplacées restituées sur demande',
    ])
    expect(ouvert.engagementsDuSoclePublies).toBe(true)
    expect(ouvert.passerSansRendezVous).toBe(true)
    expect((await fiche(essai, 'production', MERCREDI_21H)).passerSansRendezVous).toBe(false)
  })

  it('un engagement refusé (faux) n’est jamais publié', async () => {
    remplacer(essai, 'pratique.pieces_remplacees_restituees', valide(false))
    const resultat = await fiche(essai, 'production')
    expect(resultat.engagements.map((engagement) => engagement.cle)).toEqual([
      'devisEcrit',
      'appelAvantSupplement',
    ])
  })

  it('le lien d’avis n’est publié que s’il est validé, quel que soit le mode', async () => {
    expect((await fiche(essai, 'production')).lienAvis).toBe('https://avis.example/bf-auto-essai')
    remplacer(
      essai,
      'suivi_client.lien_avis_google',
      aValider('à relever', 'https://avis.example/proposition'),
    )
    expect((await fiche(essai, 'demonstration')).lienAvis).toBeNull()
  })

  it('une fermeture déclarée pour aujourd’hui ferme le garage et figure dans les fermetures à venir', async () => {
    const depot = await depotAvec(fermeture('2026-09-23', '2026-09-23', 'imprevu'))
    const resultat = await fiche(essai, 'production', MERCREDI_10H, depot)
    expect(resultat.statut).toEqual({
      etat: 'ferme',
      libelle: 'Fermé exceptionnellement, ouvre jeudi à 8 h 30',
    })
    expect(resultat.fermeturesAVenir).toHaveLength(1)
    expect(resultat.horaires?.semaineGlissante[0]?.fermeExceptionnellement).toBe(true)
    expect(resultat.passerSansRendezVous).toBe(false)
  })
})

describe('fiche publique du vrai fichier, selon le mode', () => {
  it('production : rien de ce qui reste à valider ne fuit, pas même calculé', async () => {
    const resultat = await fiche(site, 'production')
    expect(resultat.identite.accroche).toBe('BF Auto, garage automobile à Choisy-le-Roi')
    expect(resultat.statut).toEqual({ etat: 'a-confirmer', libelle: 'Horaires à confirmer' })
    expect(resultat.horaires).toBeNull()
    expect(resultat.engagements).toEqual([])
    const transmis = JSON.stringify(resultat)
    for (const proposition of ['on explique', 'Devis écrit', 'carte grise', 'Séance', 'séance 1']) {
      expect(transmis).not.toContain(proposition)
    }
  })

  it('démonstration : les propositions s’affichent normalement, les inconnues restent absentes', async () => {
    const resultat = await fiche(site, 'demonstration')
    expect(resultat.identite.accroche).toBe(
      'Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez.',
    )
    expect(resultat.statut).toEqual({ etat: 'ouvert', libelle: 'Ouvert, ferme à 12 h' })
    expect(resultat.engagements).toHaveLength(3)
    expect(resultat.engagements.every((engagement) => !engagement.aSurligner)).toBe(true)
    expect(resultat.prenomGaragiste).toEqual({ visible: false, noteDeRelecture: null })
    // Courriel validé par Anthony le 2026-09-24 (donnees/garage.json) : il s'affiche.
    expect(resultat.identite.courriel).toBe('bfauto94@gmail.com')
    expect(resultat.lienAvis).toBeNull()
  })

  it('relecture : propositions signalées, manques accompagnés de leur note', async () => {
    const resultat = await fiche(site, 'relecture')
    expect(resultat.identite.accroche).toBe(
      'Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez. (à valider)',
    )
    expect(resultat.statut.libelle).toBe('Ouvert, ferme à 12 h (horaires à valider)')
    expect(resultat.horaires?.aSurligner).toBe(true)
    expect(resultat.engagements.every((engagement) => engagement.aSurligner)).toBe(true)
    expect(resultat.prenomGaragiste).toEqual({
      visible: false,
      noteDeRelecture: expect.stringContaining('Prénom du garagiste'),
    })
  })

  it('sans les deux engagements du socle, l’accroche cède la place au titre factuel', async () => {
    remplacer(site, 'socle_de_confiance.devis_ecrit_avant_travaux', aValider('à confirmer'))
    const resultat = await fiche(site, 'demonstration')
    expect(resultat.engagementsDuSoclePublies).toBe(false)
    expect(resultat.identite.accroche).toBe('BF Auto, garage automobile à Choisy-le-Roi')
  })
})
