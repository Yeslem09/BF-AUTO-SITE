import { describe, expect, it } from 'vitest'
import type { ModeSite } from '../../../contrats/index.js'
import { documentCatalogue } from '../essai.js'
import { validerCatalogue } from '../domaine/validation.js'
import { creerConsulterCatalogue } from './consulter-catalogue.js'
import { creerConsulterFamille } from './consulter-famille.js'
import type { SourceCatalogue } from './ports.js'
import { creerRechercherPieces } from './rechercher-pieces.js'
import { creerTrouverFamille } from './trouver-famille.js'

/** Doublure du port : le catalogue d'essai, validé par la même règle que la production. */
const SOURCE: SourceCatalogue = { charger: async () => validerCatalogue(documentCatalogue()) }

describe('cas d’usage : consulter le catalogue', () => {
  it.each<[ModeSite, readonly string[]]>([
    ['production', ['Freinage', 'Batterie']],
    ['relecture', ['Freinage', 'Batterie', 'Climatisation']],
    ['demonstration', ['Freinage', 'Batterie', 'Climatisation']],
  ])('en %s, publie les familles %j', async (mode, attendues) => {
    const catalogue = await creerConsulterCatalogue(SOURCE, mode)()
    expect(catalogue.familles.map((famille) => famille.libelle)).toEqual(attendues)
  })
})

describe('cas d’usage : consulter une famille', () => {
  it('rend la famille publiée et l’engagement tel que le mode le permet', async () => {
    const enProduction = await creerConsulterFamille(SOURCE, 'production')('freinage')
    expect(enProduction?.famille.libelle).toBe('Freinage')
    expect(enProduction?.engagementPiecePosee).toBeNull()
    const enDemonstration = await creerConsulterFamille(SOURCE, 'demonstration')('freinage')
    expect(enDemonstration?.engagementPiecePosee?.texte).toBe(
      'Nous vérifions la pièce avant de la commander, puis nous la posons.',
    )
  })

  it('rend null pour une famille inconnue ou pas encore publiée', async () => {
    const consulter = creerConsulterFamille(SOURCE, 'production')
    expect(await consulter('inconnue')).toBeNull()
    expect(await consulter('climatisation')).toBeNull()
  })
})

describe('capacité offerte aux demandes : trouver une famille', () => {
  it('rend la référence d’une famille publiée : pièce seule, gamme d’occasion, pièces à cocher (données, pas repères de figure) et prix indicatif', async () => {
    const trouver = creerTrouverFamille(SOURCE, 'production')
    const freinage = {
      identifiant: 'freinage',
      libelle: 'Freinage',
      ventePieceSeule: true,
      piecesDOccasion: false,
      pieces: ['Plaquettes avant', 'Plaquettes arrière', 'Disques avant'],
      prixIndicatif: expect.stringMatching(/^\d+,\d{2}\u00a0€\u00a0TTC$/),
    }
    expect(await trouver('freinage')).toEqual(freinage)
    expect(await trouver(' freinage ')).toEqual(freinage)
    expect(await trouver('batterie')).toEqual({
      identifiant: 'batterie',
      libelle: 'Batterie',
      ventePieceSeule: true,
      piecesDOccasion: true,
      prixIndicatif: expect.any(String),
    })
  })

  it('rend null en production pour une famille seulement proposée, inconnue ou mal écrite', async () => {
    const trouver = creerTrouverFamille(SOURCE, 'production')
    expect(await trouver('climatisation')).toBeNull()
    expect(await trouver('inconnue')).toBeNull()
    expect(await trouver('FREINAGE')).toBeNull()
    expect(await trouver('')).toBeNull()
  })

  it('rend en démonstration une famille proposée ; une prestation : ni pièce seule, ni gamme, ni pièces', async () => {
    const trouver = creerTrouverFamille(SOURCE, 'demonstration')
    const climatisation = await trouver('climatisation')
    expect(climatisation).toMatchObject({
      identifiant: 'climatisation',
      libelle: 'Climatisation',
      ventePieceSeule: false,
      piecesDOccasion: false,
      // Prix inconnu : la demande dit « prix sur devis », jamais un montant d'attente.
      prixIndicatif: 'prix sur devis',
    })
    expect(climatisation?.pieces).toBeUndefined()
    // Une famille prestation liste ses prestations : la demande n'y propose ni pièces, ni gamme, ni retrait.
    expect(climatisation?.prestations?.length).toBeGreaterThan(0)
    // Chaque prestation a son propre prix : jamais celui d'un autre forfait de la famille.
    for (const prestation of climatisation?.prestations ?? []) {
      expect(climatisation?.prixDesPrestations?.[prestation]).toBe('prix sur devis')
    }
  })
})

describe('cas d’usage : rechercher une pièce', () => {
  it('sans requête, rend le catalogue sans résultat', async () => {
    const { requete, resultat, catalogue } = await creerRechercherPieces(
      SOURCE,
      'production',
    )('   ')
    expect(requete).toBe('')
    expect(resultat).toBeNull()
    expect(catalogue.familles).toHaveLength(2)
  })

  it('trouve par synonyme les seules familles publiées dans le mode', async () => {
    const enProduction = await creerRechercherPieces(SOURCE, 'production')(' tambours ')
    expect(enProduction.requete).toBe('tambours')
    expect(enProduction.resultat?.familles.map(({ famille }) => famille.identifiant)).toEqual([
      'freinage',
    ])
    const climatisation = await creerRechercherPieces(SOURCE, 'production')('gaz')
    expect(climatisation.resultat?.familles).toEqual([])
    const enDemonstration = await creerRechercherPieces(SOURCE, 'demonstration')('gaz')
    expect(enDemonstration.resultat?.familles.map(({ famille }) => famille.identifiant)).toEqual([
      'climatisation',
    ])
  })
})
