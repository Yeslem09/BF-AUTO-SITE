import { describe, expect, it } from 'vitest'
import { MODES_SITE } from '../../../contrats/index.js'
import {
  documentCatalogue,
  familleEssai,
  forfaitEssai,
  prixPropose,
  prixValide,
  SOURCE_PROPOSITION,
} from '../essai.js'
import {
  affichage,
  piecesDOccasionPossibles,
  publierCatalogue,
  publierTarifsDuSocle,
  recenserBloquantsAValider,
  trouverFamillePubliee,
} from './publication.js'
import { validerCatalogue } from './validation.js'

const CATALOGUE = validerCatalogue(documentCatalogue())

describe('politique de publication', () => {
  it('rend toujours une valeur validée, quel que soit le mode', () => {
    expect(MODES_SITE.map((mode) => affichage('valide', mode))).toEqual([
      'normal',
      'normal',
      'normal',
    ])
  })

  it('masque en production, marque en relecture, montre en démonstration une valeur à valider', () => {
    expect(affichage('a_valider', 'production')).toBe('masque')
    expect(affichage('a_valider', 'relecture')).toBe('a-relire')
    expect(affichage('a_valider', 'demonstration')).toBe('normal')
  })
})

describe('catalogue publié en production', () => {
  const publie = publierCatalogue(CATALOGUE, 'production')

  it('ne publie que les familles validées par le garage', () => {
    expect(publie.familles.map((famille) => famille.identifiant)).toEqual(['freinage', 'batterie'])
    expect(publie.familles.every((famille) => !famille.aRelire)).toBe(true)
  })

  it('ne publie que les exclusions validées, et masque l’engagement proposé', () => {
    expect(publie.ceQueNousNeFaisonsPas).toEqual([
      { texte: 'Carrosserie et peinture', aRelire: false },
    ])
    expect(publie.engagementPiecePosee).toBeNull()
  })

  it('présente le forfait validé et replie le forfait à valider sur « Prix sur devis », sans note', () => {
    const [freinage, batterie] = publie.familles
    expect(freinage?.forfaits[0]?.prix.montant).toBe('89,00\u00a0€\u00a0TTC')
    expect(batterie?.forfaits[0]?.prix).toEqual({
      montant: 'Prix sur devis',
      precisions: [],
      reference: null,
      indicatif: 'prix sur devis',
      estPublie: false,
      noteARelire: null,
      proposition: false,
    })
  })

  it('présente les tarifs transverses validés', () => {
    expect(publie.tauxHoraire.montant).toBe('65,00\u00a0€\u00a0TTC')
    expect(publie.premierControle.montant).toBe('Gratuit')
  })
})

describe('catalogue publié en relecture et en démonstration', () => {
  it('relecture : tout est rendu, les valeurs à valider sont marquées avec ce qu’il reste à obtenir', () => {
    const publie = publierCatalogue(CATALOGUE, 'relecture')
    expect(publie.familles.map((famille) => [famille.identifiant, famille.aRelire])).toEqual([
      ['freinage', false],
      ['batterie', false],
      ['climatisation', true],
    ])
    expect(publie.familles[1]?.forfaits[0]?.prix.noteARelire).toBe('Forfait à obtenir.')
    expect(publie.familles[0]?.forfaits[0]?.prix.noteARelire).toBeNull()
    expect(publie.ceQueNousNeFaisonsPas).toEqual([
      { texte: 'Carrosserie et peinture', aRelire: false },
      { texte: 'Poids lourds', aRelire: true },
    ])
    expect(publie.engagementPiecePosee?.aRelire).toBe(true)
  })

  it('démonstration : les propositions sont rendues normalement, sans marque ni note', () => {
    const publie = publierCatalogue(CATALOGUE, 'demonstration')
    expect(publie.familles.map((famille) => famille.identifiant)).toEqual([
      'freinage',
      'batterie',
      'climatisation',
    ])
    expect(publie.familles.some((famille) => famille.aRelire)).toBe(false)
    expect(publie.familles.map((famille) => famille.forfaits[0]?.prix.noteARelire)).toEqual([
      null,
      null,
      null,
    ])
    expect(publie.engagementPiecePosee).toEqual({
      texte: 'Nous vérifions la pièce avant de la commander, puis nous la posons.',
      aRelire: false,
    })
  })

  it('démonstration : un prix inconnu reste « Prix sur devis », jamais un montant inventé', () => {
    const publie = publierCatalogue(CATALOGUE, 'demonstration')
    expect(publie.familles[2]?.forfaits[0]?.prix.montant).toBe('Prix sur devis')
  })
})

describe('prix de démonstration (proposés, calés sur le marché local)', () => {
  const AVEC_PROPOSITIONS = validerCatalogue(
    documentCatalogue({
      familles: [
        familleEssai('vidange-et-filtres', {
          libelle: 'Vidange et filtres',
          forfaits: [
            forfaitEssai('vidange', prixPropose()),
            forfaitEssai('revision', prixPropose({ montant_ttc_centimes: 12900 })),
          ],
        }),
        familleEssai('carrosserie', {
          libelle: 'Carrosserie',
          forfaits: [
            forfaitEssai('carrosserie', {
              statut: 'a_valider',
              source: SOURCE_PROPOSITION,
              note: 'À confirmer.',
              sur_devis: 'après examen',
            }),
          ],
          vente_piece_seule: false,
        }),
      ],
      tarifs_transverses: {
        taux_horaire: prixPropose({ montant_ttc_centimes: 6000, comprend: 'une heure' }),
        premier_controle: prixPropose({
          montant_ttc_centimes: 2900,
          comprend: 'écoute et essai',
          duree: '30 minutes environ',
          deduit_de_la_reparation: true,
        }),
      },
      exemples_accueil: ['vidange', 'revision'],
    }),
  )

  it('en production : jamais un montant proposé, le repli sans montant, aucune trace de proposition', () => {
    const publie = publierCatalogue(AVEC_PROPOSITIONS, 'production')
    const prix = [
      publie.tauxHoraire,
      publie.premierControle,
      ...publie.familles.flatMap((famille) => famille.forfaits.map((forfait) => forfait.prix)),
    ]
    expect(prix.map((unPrix) => unPrix.montant)).toEqual([
      'Sur demande',
      'Sur demande',
      'Prix sur devis',
      'Prix sur devis',
      'Prix sur devis',
    ])
    expect(prix.some((unPrix) => unPrix.estPublie || unPrix.proposition)).toBe(false)
    expect(publie.tauxHoraire).toEqual({
      montant: 'Sur demande',
      precisions: [],
      reference: null,
      indicatif: 'sur demande',
      estPublie: false,
      noteARelire: null,
      proposition: false,
    })
    expect(publie.premierControle.montant).toBe('Sur demande')
    expect(JSON.stringify(publie)).not.toMatch(/\d+,\d{2}|après examen|calée/)
  })

  it('en démonstration : « À partir de », le véhicule de référence, et la marque de la proposition', () => {
    const publie = publierCatalogue(AVEC_PROPOSITIONS, 'demonstration')
    const [vidange, revision] = publie.familles[0]?.forfaits ?? []
    expect(vidange?.prix.montant).toBe('À partir de 69,00\u00a0€\u00a0TTC')
    expect(vidange?.prix.reference).toBe('Exemple : citadine essence, prix au 1er octobre 2026')
    expect(vidange?.prix.indicatif).toBe('dès 69,00\u00a0€\u00a0TTC')
    expect(vidange?.prix.proposition).toBe(true)
    expect(vidange?.prix.noteARelire).toBeNull()
    expect(revision?.prix.montant).toBe('À partir de 129,00\u00a0€\u00a0TTC')
    expect(publie.familles[1]?.forfaits[0]?.prix.montant).toBe('Sur devis après examen')
    expect(publie.premierControle.precisions).toEqual([
      'Comprend : écoute et essai',
      'Durée : 30 minutes environ',
      'Déduit du prix de la réparation si vous la confiez au garage',
    ])
    expect(publie.premierControle.reference).toBe(
      'Exemple : citadine essence, prix au 1er octobre 2026',
    )
  })

  it('en relecture : la note de ce qu’il reste à obtenir et la source de la proposition', () => {
    const publie = publierCatalogue(AVEC_PROPOSITIONS, 'relecture')
    expect(publie.tauxHoraire.noteARelire).toBe(
      `Montant proposé, à confirmer par le garagiste. Source : ${SOURCE_PROPOSITION}.`,
    )
  })

  it('offerts au garage : les exemples de l’accueil et le socle, jamais en production', () => {
    const production = publierTarifsDuSocle(AVEC_PROPOSITIONS, 'production')
    expect(production).toEqual({ tauxHoraire: null, premierControle: null, exemples: [] })
    const demonstration = publierTarifsDuSocle(AVEC_PROPOSITIONS, 'demonstration')
    expect(demonstration.exemples).toEqual([
      {
        intitule: 'Forfait vidange',
        montant: 'À partir de 69,00\u00a0€\u00a0TTC',
        precision: 'Citadine essence, prix au 1er octobre 2026',
        lien: '/pieces-et-reparations/vidange-et-filtres',
        aValider: true,
      },
      expect.objectContaining({ intitule: 'Forfait revision', aValider: true }),
    ])
    expect(demonstration.premierControle).toEqual({
      montant: 'À partir de 29,00\u00a0€\u00a0TTC',
      gratuit: false,
      comprend: 'écoute et essai',
      dateEffet: '1er octobre 2026',
      duree: '30 minutes environ',
      deduitDeLaReparation: true,
      aValider: true,
    })
  })

  it('bloquent la mise en production : la porte de démarrage les nomme tous', () => {
    expect(recenserBloquantsAValider(AVEC_PROPOSITIONS)).toContain(
      'Prix de démonstration à confirmer par le garage ou à retirer avant la mise en ligne : Taux horaire de main-d’œuvre, Premier contrôle à l’atelier, Forfait vidange, Forfait revision, Forfait carrosserie',
    )
  })
})

describe('gamme de pièce et pièce seule', () => {
  it('pas de gamme d’occasion pour un organe exclu du réemploi, ni pour une prestation', () => {
    const publie = publierCatalogue(CATALOGUE, 'demonstration')
    const [freinage, batterie, climatisation] = publie.familles
    expect(freinage?.organeExcluDuReemploi).toBe('freinage')
    expect(freinage !== undefined && piecesDOccasionPossibles(freinage)).toBe(false)
    expect(batterie !== undefined && piecesDOccasionPossibles(batterie)).toBe(true)
    expect(climatisation?.ventePieceSeule).toBe(false)
    expect(climatisation !== undefined && piecesDOccasionPossibles(climatisation)).toBe(false)
  })
})

describe('recherche d’une famille publiée', () => {
  it('trouve par identifiant exact, et seulement parmi les familles publiées', () => {
    const production = publierCatalogue(CATALOGUE, 'production')
    expect(trouverFamillePubliee(production, 'freinage')?.libelle).toBe('Freinage')
    expect(trouverFamillePubliee(production, 'climatisation')).toBeNull()
    expect(trouverFamillePubliee(production, 'Freinage')).toBeNull()
    expect(trouverFamillePubliee(production, 'inconnue')).toBeNull()
    const demonstration = publierCatalogue(CATALOGUE, 'demonstration')
    expect(trouverFamillePubliee(demonstration, 'climatisation')?.libelle).toBe('Climatisation')
  })
})

describe('données bloquantes à valider (D8)', () => {
  it('nomme les familles, les exclusions et les tarifs transverses encore à valider', () => {
    const catalogue = validerCatalogue(
      documentCatalogue({
        tarifs_transverses: {
          taux_horaire: { statut: 'a_valider', note: 'À obtenir.' },
          premier_controle: { statut: 'a_valider', note: 'À obtenir.' },
        },
      }),
    )
    expect(recenserBloquantsAValider(catalogue)).toEqual([
      'Familles d’intervention à confirmer par le garage : Climatisation',
      '« Ce que nous ne faisons pas » à confirmer par le garage : Poids lourds',
      'Taux horaire de main-d’œuvre à obtenir du garage',
      'Premier contrôle à l’atelier : prix ou gratuité à obtenir du garage',
    ])
  })

  it('est vide quand tout le bloquant est validé, même si des forfaits restent sur devis', () => {
    const catalogue = validerCatalogue(
      documentCatalogue({
        familles: [
          familleEssai('freinage', { forfaits: [forfaitEssai('plaquettes', prixValide())] }),
          familleEssai('batterie', { libelle: 'Batterie' }),
        ],
        ce_que_nous_ne_faisons_pas: [
          { libelle: 'Carrosserie', statut: 'valide', source: 'garage' },
        ],
      }),
    )
    expect(recenserBloquantsAValider(catalogue)).toEqual([])
  })
})
