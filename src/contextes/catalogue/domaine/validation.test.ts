import { describe, expect, it } from 'vitest'
import {
  documentCatalogue,
  familleEssai,
  forfaitEssai,
  prixPropose,
  prixValide,
  type Document,
} from '../essai.js'
import { ErreurDonneesCatalogue } from './erreurs.js'
import { NOMBRE_MAX_FAMILLES, validerCatalogue } from './validation.js'

/** Problèmes relevés par la validation, ou liste vide si le document est accepté. */
function problemes(document: unknown): readonly string[] {
  try {
    validerCatalogue(document)
    return []
  } catch (erreur) {
    if (erreur instanceof ErreurDonneesCatalogue) return erreur.problemes
    throw erreur
  }
}

function avecFamilles(...familles: Document[]): Document {
  return documentCatalogue({ familles })
}

describe('validation du catalogue : document accepté', () => {
  it('convertit le document d’essai en modèle du domaine', () => {
    const catalogue = validerCatalogue(documentCatalogue())
    expect(catalogue.familles.map((famille) => famille.identifiant)).toEqual([
      'freinage',
      'batterie',
      'climatisation',
    ])
    const freinage = catalogue.familles[0]
    expect(freinage?.provenance).toEqual({ statut: 'valide', source: 'garage' })
    expect(freinage?.forfaits).toEqual([
      {
        identifiant: 'plaquettes-avant',
        intitule: 'Plaquettes avant',
        prix: {
          nature: 'chiffre',
          statut: 'valide',
          source: null,
          note: null,
          montantTtcCentimes: 8900,
          aPartirDe: false,
          vehiculeReference: 'citadine essence',
          comprend: 'plaquettes avant et main-d’œuvre',
          dateEffet: { annee: 2026, mois: 10, jour: 1 },
          duree: null,
          deduitDeLaReparation: null,
        },
        piece: 'Plaquettes avant',
        prestation: false,
      },
    ])
    expect(freinage?.pieces).toEqual(['Plaquettes avant', 'Plaquettes arrière', 'Disques avant'])
    // Une famille prestation n'a que des prestations, sans pièce à cocher.
    expect(catalogue.familles[2]?.pieces).toEqual([])
    expect(catalogue.familles[2]?.forfaits.every((forfait) => forfait.prestation)).toBe(true)
    expect(freinage?.organeExcluDuReemploi).toBe('freinage')
    expect(freinage?.ventePieceSeule).toBe(true)
    expect(catalogue.familles[2]?.ventePieceSeule).toBe(false)
    expect(catalogue.familles[2]?.provenance).toEqual({
      statut: 'a_valider',
      source: 'proposition',
    })
    expect(catalogue.tarifsTransverses.premierControle).toMatchObject({ montantTtcCentimes: 0 })
    expect(catalogue.ceQueNousNeFaisonsPas.map((mention) => mention.texte)).toEqual([
      'Carrosserie et peinture',
      'Poids lourds',
    ])
    expect(catalogue.engagementPiecePosee.provenance.statut).toBe('a_valider')
    expect(catalogue.venteAuComptoir.provenance).toEqual({ statut: 'valide', source: 'anthony' })
  })

  it('accepte un commentaire facultatif et retire les espaces de bord', () => {
    const catalogue = validerCatalogue(
      avecFamilles(familleEssai('freinage', { libelle: '  Freinage  ' })),
    )
    expect(catalogue.familles[0]?.libelle).toBe('Freinage')
  })
})

describe('validation du catalogue : structure', () => {
  it('refuse une racine qui n’est pas un objet', () => {
    expect(problemes([])).toEqual(['la racine doit être un objet JSON'])
  })

  it('signale les champs manquants et inconnus, tous à la fois', () => {
    const { tarifs_transverses: _retire, ...document } = documentCatalogue({ tarif: {} })
    expect(problemes(document)).toEqual([
      'tarifs_transverses : champ manquant',
      'tarif : champ inconnu',
    ])
  })

  it(`refuse plus de ${NOMBRE_MAX_FAMILLES} familles : la liste ne tiendrait plus sur un écran`, () => {
    const familles = Array.from({ length: NOMBRE_MAX_FAMILLES + 1 }, (_, index) =>
      familleEssai(`famille-${index}`, { libelle: `Famille ${index}` }),
    )
    expect(problemes(avecFamilles(...familles))).toEqual([
      `familles : ${NOMBRE_MAX_FAMILLES + 1} élément(s), de 1 à ${NOMBRE_MAX_FAMILLES} attendus`,
    ])
  })

  it('refuse une liste de familles vide', () => {
    expect(problemes(avecFamilles())).toEqual([
      `familles : 0 élément(s), de 1 à ${NOMBRE_MAX_FAMILLES} attendus`,
    ])
  })

  it('signale une famille qui n’est pas un objet sans cascade de champs manquants', () => {
    expect(
      problemes(avecFamilles(familleEssai('freinage'), 'batterie' as unknown as Document)),
    ).toEqual(['familles[1] : objet attendu'])
  })
})

describe('validation du catalogue : familles', () => {
  it.each(['Freinage', 'vidange_filtres', 'vidange--filtres', '-freinage', 'éclairage'])(
    'refuse l’identifiant « %s », qui ne ferait pas une adresse propre',
    (identifiant) => {
      const famille = familleEssai(identifiant, { forfaits: [forfaitEssai('forfait')] })
      expect(problemes(avecFamilles(famille))).toEqual([
        `familles[0].identifiant : « ${identifiant} » : minuscules sans accent, chiffres et tirets simples attendus (exemple : vidange-et-filtres)`,
      ])
    },
  )

  it('refuse deux familles de même identifiant ou de même libellé', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', { libelle: 'Freinage' }),
          familleEssai('freinage', {
            libelle: 'freinage',
            mots_courants: ['disques', 'étriers'],
            forfaits: [forfaitEssai('autre')],
          }),
        ),
      ),
    ).toEqual([
      'familles (identifiant) : « freinage » figure deux fois',
      'familles (libelle) : « freinage » figure deux fois',
    ])
  })

  it('exige de deux à six mots courants, sans doublon', () => {
    expect(
      problemes(avecFamilles(familleEssai('freinage', { mots_courants: ['plaquettes'] }))),
    ).toEqual(['familles[0].mots_courants : 1 élément(s), de 2 à 6 attendus'])
    expect(
      problemes(avecFamilles(familleEssai('freinage', { mots_courants: ['disques', 'Disques'] }))),
    ).toEqual(['familles[0].mots_courants : « Disques » figure deux fois'])
  })

  it('refuse un mot courant qui répète le nom de la famille, au titre de la page près', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('pneus', { libelle: 'Pneus', mots_courants: ['crevaison', 'PNEUS'] }),
          familleEssai('eclairage', {
            libelle: 'Éclairage',
            mots_courants: ['eclairage', 'phares'],
          }),
        ),
      ),
    ).toEqual([
      'familles[0].mots_courants[1] : « PNEUS » répète le nom de la famille',
      'familles[1].mots_courants[0] : « eclairage » répète le nom de la famille',
    ])
  })

  it('refuse un mot courant partagé par deux familles : un besoin mène à une seule page (D1)', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', {
            libelle: 'Freinage',
            mots_courants: ['plaquettes', 'liquide de frein'],
          }),
          familleEssai('liquides', {
            libelle: 'Liquides',
            mots_courants: ['Liquide de frein', 'liquide de refroidissement'],
          }),
        ),
      ),
    ).toEqual([
      'familles (mots_courants) : « Liquide de frein » figure dans deux familles (Freinage, Liquides) : un besoin mène à une seule page',
    ])
  })

  it.each([
    ['sans point final', 'Le freinage arrête la voiture'],
    ['en deux phrases', 'Le freinage arrête la voiture. Il s’use.'],
  ])('exige un rôle en une seule phrase (refusé : %s)', (_cas, role) => {
    expect(problemes(avecFamilles(familleEssai('freinage', { role })))).toEqual([
      'familles[0].role : une seule phrase attendue, terminée par un point',
    ])
  })

  it('exige au moins un signe d’usure et ce que fait le garage', () => {
    expect(
      problemes(
        avecFamilles(familleEssai('freinage', { signes_usure: [], ce_que_fait_le_garage: ' ' })),
      ),
    ).toEqual([
      'familles[0].signes_usure : 0 élément(s), de 1 à 6 attendus',
      'familles[0].ce_que_fait_le_garage : texte non vide attendu',
    ])
  })

  it('refuse un statut ou une source hors de la liste fermée', () => {
    expect(
      problemes(avecFamilles(familleEssai('freinage', { statut: 'confirme', source: 'internet' }))),
    ).toEqual([
      'familles[0].statut : une valeur parmi valide, a_valider attendue',
      'familles[0].source : une valeur parmi garage, anthony, proposition attendue',
    ])
  })

  it('refuse une famille validée dont la source reste une proposition', () => {
    expect(
      problemes(
        avecFamilles(familleEssai('freinage', { statut: 'valide', source: 'proposition' })),
      ),
    ).toEqual([
      'familles[0].source : une valeur validée vient du garage ou d’une décision d’Anthony : source « garage » ou « anthony » attendue',
    ])
  })

  it('refuse une promesse que personne ne tient, où qu’elle soit écrite', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', {
            ce_que_fait_le_garage: 'Pièce en stock, compatible avec votre véhicule.',
            signes_usure: ['Vérification gratuite'],
          }),
        ),
      ),
    ).toEqual([
      'familles[0].signes_usure[0] : expression interdite « vérification gratuite »',
      'familles[0].ce_que_fait_le_garage : expression interdite « stock »',
      'familles[0].ce_que_fait_le_garage : expression interdite « compatible »',
    ])
  })
})

/** Une famille « freinage » dont le seul forfait porte ce prix. */
function avecPrix(prix: unknown): Document {
  return avecFamilles(
    familleEssai('freinage', { forfaits: [forfaitEssai('plaquettes', prix as Document)] }),
  )
}
const CHEMIN_PRIX = 'familles[0].forfaits[0].prix'

describe('validation du catalogue : prix', () => {
  it('accepte un prix de démonstration : proposé, sourcé, « à partir de », avec son véhicule de référence', () => {
    expect(problemes(avecPrix(prixPropose()))).toEqual([])
    const catalogue = validerCatalogue(avecPrix(prixPropose()))
    expect(catalogue.familles[0]?.forfaits[0]?.prix).toMatchObject({
      nature: 'chiffre',
      statut: 'a_valider',
      aPartirDe: true,
      source: 'proposition calée sur le marché local (étude 06)',
    })
  })

  it('refuse un montant proposé sans source : ce serait un prix inventé', () => {
    const { source: _retiree, ...sansSource } = prixPropose()
    expect(problemes(avecPrix(sansSource))).toEqual([
      `${CHEMIN_PRIX}.source : un prix proposé cite sa source (étude, relevé) : sans elle, ce serait un prix inventé`,
    ])
  })

  it('refuse un détail sur un prix sans montant, et exige sa note', () => {
    expect(
      problemes(avecPrix({ statut: 'a_valider', note: 'À obtenir.', comprend: 'plaquettes' })),
    ).toEqual([
      `${CHEMIN_PRIX}.comprend : un prix sans montant ne porte ni détail ni source : ajoutez montant_ttc_centimes, ou retirez ce champ`,
    ])
    expect(problemes(avecPrix({ statut: 'a_valider' }))).toEqual([
      `${CHEMIN_PRIX}.note : champ manquant`,
    ])
  })

  it('refuse un prix validé sans montant ni mention sur devis', () => {
    expect(problemes(avecPrix({ statut: 'valide', note: 'Validé ?' }))).toEqual([
      `${CHEMIN_PRIX}.statut : un prix validé porte un montant (montant_ttc_centimes) ou sur_devis`,
    ])
  })

  it('refuse sur un prix validé la source et la note de sa proposition', () => {
    expect(problemes(avecPrix(prixValide({ source: 'étude', note: 'À confirmer.' })))).toEqual([
      `${CHEMIN_PRIX}.source : un prix validé ne porte ni source ni note : retirez-les en le validant`,
      `${CHEMIN_PRIX}.note : un prix validé ne porte ni source ni note : retirez-les en le validant`,
    ])
  })

  it('exige d’un forfait chiffré son véhicule de référence, son contenu et sa date', () => {
    const prix = { statut: 'valide', montant_ttc_centimes: 8900 }
    expect(problemes(avecPrix(prix))).toEqual([
      `${CHEMIN_PRIX}.comprend : champ manquant`,
      `${CHEMIN_PRIX}.date_effet : champ manquant`,
      `${CHEMIN_PRIX}.vehicule_reference : champ manquant`,
    ])
  })

  it('accepte « sur devis après examen », pour un forfait seulement, jamais avec un montant', () => {
    const surDevis = {
      statut: 'a_valider',
      source: 'étude',
      note: 'À confirmer.',
      sur_devis: 'après examen',
    }
    expect(problemes(avecPrix(surDevis))).toEqual([])
    expect(problemes(avecPrix({ ...prixValide(), sur_devis: 'après examen' }))).toEqual([
      `${CHEMIN_PRIX} : un prix est chiffré ou sur devis, pas les deux`,
      `${CHEMIN_PRIX}.sur_devis : champ inconnu`,
    ])
    const tarifs = documentCatalogue()['tarifs_transverses'] as Document
    expect(
      problemes(documentCatalogue({ tarifs_transverses: { ...tarifs, taux_horaire: surDevis } })),
    ).toEqual([
      'tarifs_transverses.taux_horaire.source : un prix sans montant ne porte ni détail ni source : ajoutez montant_ttc_centimes, ou retirez ce champ',
      'tarifs_transverses.taux_horaire.sur_devis : un prix sans montant ne porte ni détail ni source : ajoutez montant_ttc_centimes, ou retirez ce champ',
    ])
  })

  it.each([
    [89.9, `${CHEMIN_PRIX}.montant_ttc_centimes : nombre entier attendu`],
    ['8900', `${CHEMIN_PRIX}.montant_ttc_centimes : nombre entier attendu`],
    [0, `${CHEMIN_PRIX}.montant_ttc_centimes : 0 hors de l’intervalle 1 à 1000000`],
  ])('refuse le montant de forfait %s', (montant, probleme) => {
    expect(problemes(avecPrix(prixValide({ montant_ttc_centimes: montant })))).toEqual([probleme])
  })

  it.each(['2026-02-30', '2026-13-01', '01/10/2026'])('refuse la date d’effet « %s »', (date) => {
    const attendu =
      date === '01/10/2026'
        ? `${CHEMIN_PRIX}.date_effet : date au format AAAA-MM-JJ attendue`
        : `${CHEMIN_PRIX}.date_effet : « ${date} » n’existe pas dans le calendrier`
    expect(problemes(avecPrix(prixValide({ date_effet: date })))).toEqual([attendu])
  })

  it('accepte un premier contrôle gratuit, mais pas un taux horaire nul', () => {
    const tarifs = documentCatalogue()['tarifs_transverses'] as Document
    const tauxNul = { ...(tarifs['taux_horaire'] as Document), montant_ttc_centimes: 0 }
    expect(
      problemes(documentCatalogue({ tarifs_transverses: { ...tarifs, taux_horaire: tauxNul } })),
    ).toEqual([
      'tarifs_transverses.taux_horaire.montant_ttc_centimes : 0 hors de l’intervalle 1 à 1000000',
    ])
  })

  it('exige du premier contrôle chiffré sa durée et s’il est déduit de la réparation, et les refuse ailleurs', () => {
    const tarifs = documentCatalogue()['tarifs_transverses'] as Document
    const {
      duree: _d,
      deduit_de_la_reparation: _r,
      ...sansDetails
    } = tarifs['premier_controle'] as Document
    const tauxAvecDuree = { ...(tarifs['taux_horaire'] as Document), duree: '1 heure' }
    expect(
      problemes(
        documentCatalogue({
          tarifs_transverses: { taux_horaire: tauxAvecDuree, premier_controle: sansDetails },
        }),
      ),
    ).toEqual([
      'tarifs_transverses.taux_horaire.duree : champ inconnu',
      'tarifs_transverses.premier_controle.duree : champ manquant',
      'tarifs_transverses.premier_controle.deduit_de_la_reparation : champ manquant',
    ])
  })

  it('un tarif transverse « à partir de » nomme son véhicule de référence ; un prix gratuit ne l’est jamais', () => {
    const tarifs = documentCatalogue()['tarifs_transverses'] as Document
    const taux = { ...(tarifs['taux_horaire'] as Document), a_partir_de: true }
    const gratuit = { ...(tarifs['premier_controle'] as Document), a_partir_de: true }
    expect(
      problemes(
        documentCatalogue({
          tarifs_transverses: { taux_horaire: taux, premier_controle: gratuit },
        }),
      ),
    ).toEqual([
      'tarifs_transverses.taux_horaire.vehicule_reference : un prix « à partir de » nomme son véhicule de référence',
      'tarifs_transverses.premier_controle.vehicule_reference : un prix « à partir de » nomme son véhicule de référence',
      'tarifs_transverses.premier_controle.a_partir_de : un prix gratuit ne se dit pas « à partir de »',
    ])
  })
})

describe('validation du catalogue : forfaits et exemples de l’accueil', () => {
  it('exige d’un à quatre forfaits par famille, aux identifiants uniques dans tout le catalogue', () => {
    expect(problemes(avecFamilles(familleEssai('freinage', { forfaits: [] })))).toEqual([
      'familles[0].forfaits : 0 élément(s), de 1 à 4 attendus',
    ])
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', { forfaits: [forfaitEssai('commun')] }),
          familleEssai('batterie', { forfaits: [forfaitEssai('commun')] }),
        ),
      ),
    ).toEqual(['familles (forfaits, identifiant) : « commun » figure deux fois'])
  })

  it('exige que chaque exemple de l’accueil désigne un forfait, trois au plus', () => {
    expect(problemes(documentCatalogue({ exemples_accueil: ['plaquettes-avant'] }))).toEqual([])
    expect(problemes(documentCatalogue({ exemples_accueil: ['vidange'] }))).toEqual([
      'exemples_accueil[0] : « vidange » ne désigne aucun forfait du catalogue',
    ])
    expect(
      problemes(
        documentCatalogue({
          exemples_accueil: [
            'plaquettes-avant',
            'plaquettes-avant',
            'forfait-batterie',
            'recharge',
          ],
        }),
      ),
    ).toEqual([
      'exemples_accueil : 4 élément(s), de 0 à 3 attendus',
      'exemples_accueil : « plaquettes-avant » figure deux fois',
    ])
  })

  it('lit l’organe exclu du réemploi dans le référentiel unique des contrats, et la vente de la pièce seule', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', { organe_exclu_du_reemploi: 'frein', vente_piece_seule: 'non' }),
        ),
      ),
    ).toEqual([
      'familles[0].vente_piece_seule : true ou false attendu',
      'familles[0].organe_exclu_du_reemploi : une valeur parmi trains-roulants, direction, freinage, liaison-au-sol attendue',
    ])
  })
})

describe('validation du catalogue : ce que nous ne faisons pas, engagement', () => {
  it('accepte une liste vide (le garage n’exclut rien), refuse les doublons', () => {
    expect(problemes(documentCatalogue({ ce_que_nous_ne_faisons_pas: [] }))).toEqual([])
    const element = { libelle: 'Carrosserie', statut: 'a_valider', source: 'proposition' }
    expect(
      problemes(documentCatalogue({ ce_que_nous_ne_faisons_pas: [element, element] })),
    ).toEqual(['ce_que_nous_ne_faisons_pas : « Carrosserie » figure deux fois'])
  })

  it('refuse un engagement validé sans venir du garage, ou qui promet une vérification gratuite', () => {
    const engagement = {
      texte: 'Vérification gratuite de chaque pièce.',
      statut: 'valide',
      source: 'proposition',
    }
    expect(problemes(documentCatalogue({ engagement_piece_posee: engagement }))).toEqual([
      'engagement_piece_posee.texte : expression interdite « vérification gratuite »',
      'engagement_piece_posee.source : une valeur validée vient du garage ou d’une décision d’Anthony : source « garage » ou « anthony » attendue',
    ])
  })
})

describe('validation du catalogue : vente au comptoir et décisions d’Anthony (arbitrage 4)', () => {
  const vente = (modifications: Document) =>
    documentCatalogue({
      vente_au_comptoir: {
        texte: 'Vous pouvez aussi acheter la pièce seule et la retirer au garage.',
        statut: 'valide',
        source: 'anthony',
        date_decision: '2026-09-23',
        ...modifications,
      },
    })

  it('une décision d’Anthony valide la vente au comptoir, avec sa date', () => {
    expect(problemes(vente({}))).toEqual([])
  })

  it('une décision d’Anthony sans date, ou à une date impossible, est refusée', () => {
    expect(problemes(vente({ date_decision: undefined }))).toEqual([
      'vente_au_comptoir.date_decision : date de la décision d’Anthony (AAAA-MM-JJ) attendue',
    ])
    expect(problemes(vente({ date_decision: '2026-02-30' }))).toEqual([
      'vente_au_comptoir.date_decision : « 2026-02-30 » n’existe pas dans le calendrier',
    ])
  })

  it('une date de décision sans décision d’Anthony est refusée', () => {
    expect(problemes(vente({ source: 'garage' }))).toEqual([
      'vente_au_comptoir.date_decision : réservée à une décision d’Anthony (source « anthony »)',
    ])
  })

  it('la vente au comptoir est obligatoire et ne promet rien d’interdit', () => {
    const { vente_au_comptoir: _retiree, ...sansVente } = documentCatalogue()
    expect(problemes(sansVente)).toEqual([expect.stringMatching(/vente_au_comptoir/)])
    expect(problemes(vente({ texte: 'Pièce compatible, en stock.' }))).toEqual([
      'vente_au_comptoir.texte : expression interdite « stock »',
      'vente_au_comptoir.texte : expression interdite « compatible »',
    ])
  })
})

describe('validation du catalogue : synonymes de la recherche', () => {
  it('les accepte facultatifs, et les lit dans le modèle', () => {
    const catalogue = validerCatalogue(
      avecFamilles(familleEssai('freinage', { synonymes: ['frein', 'tambours'] })),
    )
    expect(catalogue.familles[0]?.synonymes).toEqual(['frein', 'tambours'])
    expect(validerCatalogue(avecFamilles(familleEssai('freinage'))).familles[0]?.synonymes).toEqual(
      [],
    )
  })

  it('refuse un synonyme qui mène à deux familles, ou qui répète un mot de sa famille', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', {
            libelle: 'Freinage',
            mots_courants: ['plaquettes', 'disques'],
            synonymes: ['frein', 'Plaquettes', 'frein'],
          }),
          familleEssai('echappement', {
            libelle: 'Échappement',
            mots_courants: ['silencieux', 'catalyseur'],
            synonymes: ['Frein'],
          }),
        ),
      ),
    ).toEqual([
      'familles (synonymes) : « Plaquettes » figure déjà dans la famille Freinage',
      'familles (synonymes) : « frein » figure déjà dans la famille Freinage',
      'familles (synonymes) : « Frein » figure dans deux familles (Freinage, Échappement) : un besoin mène à une seule page',
    ])
  })

  it('refuse un synonyme trop long, vide ou porteur d’une expression interdite', () => {
    expect(
      problemes(
        avecFamilles(
          familleEssai('freinage', { synonymes: ['x'.repeat(41), '', 'frein en stock'] }),
        ),
      ),
    ).toEqual([
      'familles[0].synonymes[0] : 41 caractères, 40 au plus',
      'familles[0].synonymes[1] : texte non vide attendu',
      'familles[0].synonymes[2] : expression interdite « stock »',
    ])
  })
})

describe('validation du catalogue : pièces à cocher et prestations', () => {
  it('refuse la pièce d’un forfait absente des pièces de la famille, et des pièces pour une prestation', () => {
    const document = documentCatalogue()
    const familles = document['familles'] as Record<string, unknown>[]
    const freinage = familles[0] as Record<string, unknown>
    const forfaits = freinage['forfaits'] as Record<string, unknown>[]
    forfaits[0] = { ...forfaits[0], piece: 'Plaquettes' }
    const climatisation = familles[2] as Record<string, unknown>
    climatisation['pieces'] = ['Condenseur']
    expect(() => validerCatalogue(document)).toThrow(
      /« Plaquettes » ne figure pas dans les pièces de la famille[\s\S]*une prestation n’a pas de pièces à cocher/,
    )
  })

  it('refuse un forfait prestation qui pose une pièce', () => {
    const document = documentCatalogue()
    const freinage = (document['familles'] as Record<string, unknown>[])[0] as Record<
      string,
      unknown
    >
    const forfaits = freinage['forfaits'] as Record<string, unknown>[]
    forfaits[0] = { ...forfaits[0], prestation: true }
    expect(() => validerCatalogue(document)).toThrow(/une prestation ne pose pas de pièce/)
  })
})
