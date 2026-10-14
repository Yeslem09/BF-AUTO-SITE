import {
  CHEMINS,
  type ExemplePrix,
  type ModeSite,
  type OrganeExcluDuReemploi,
  type TarifPublie,
  type TarifsDuSocle,
} from '../../../contrats/index.js'
import {
  estProposition,
  type Catalogue,
  type Famille,
  type Forfait,
  type Mention,
  type Prix,
  type Statut,
} from './catalogue.js'
import {
  formaterDate,
  LIBELLE_PRIX_SUR_DEVIS,
  LIBELLE_SUR_DEMANDE,
  montantEnMots,
  presenterForfait,
  presenterRepli,
  presenterTarif,
  type PrixPresente,
} from './prix.js'

/**
 * Politique de publication (D8 et arbitrage 3 du Kano), pure :
 * - production : seule une valeur validée par le garage est rendue ;
 * - relecture (poste d'Anthony) : tout est rendu, les valeurs à valider sont marquées pour relecture ;
 * - démonstration : les propositions à valider sont rendues normalement, le bandeau de la mise en page l'annonce.
 */
export type Affichage = 'masque' | 'normal' | 'a-relire'

export function affichage(statut: Statut, mode: ModeSite): Affichage {
  if (statut === 'valide') return 'normal'
  switch (mode) {
    case 'production':
      return 'masque'
    case 'relecture':
      return 'a-relire'
    case 'demonstration':
      return 'normal'
  }
}

/** Libellés des deux tarifs transverses, les mêmes sur les pages et dans les rapports. */
export const LIBELLES_TARIFS = {
  tauxHoraire: 'Taux horaire de main-d’œuvre',
  premierControle: 'Premier contrôle à l’atelier',
} as const

export interface PrixPublie extends PrixPresente {
  /** En relecture seulement : ce qu'il reste à obtenir du garage, et la source d'une proposition. */
  readonly noteARelire: string | null
  /**
   * Le montant affiché est une proposition (prix de démonstration calé sur le
   * marché local), pas un prix confirmé : jamais vrai en production.
   */
  readonly proposition: boolean
}

export interface ForfaitPublie {
  readonly identifiant: string
  readonly intitule: string
  readonly prix: PrixPublie
  /** Pièce pré-cochée par le lien « Demander un prix » du forfait ; `null` : aucune. */
  readonly piece: string | null
  /** Prestation d'atelier : sa demande ne propose ni pièces, ni gamme, ni retrait. */
  readonly prestation: boolean
}

export interface FamillePubliee {
  readonly identifiant: string
  readonly libelle: string
  readonly motsCourants: readonly string[]
  /** Pour la recherche seulement : jamais affichés. */
  readonly synonymes: readonly string[]
  readonly role: string
  readonly signesUsure: readonly string[]
  readonly ceQueFaitLeGarage: string
  /** Dans l'ordre du fichier : le premier est le prix mis en avant de la famille. */
  readonly forfaits: readonly ForfaitPublie[]
  /** Faux pour une prestation : ni pièce seule, ni vérification de pièce, ni gamme. */
  readonly ventePieceSeule: boolean
  /** Pièces à cocher dans une demande de prix ; vide pour une prestation. */
  readonly pieces: readonly string[]
  /** Ce que le client décrit dans sa demande de prix (prestation) ; `null` : rien de propre. */
  readonly consigneDemande: string | null
  /** Une photo par SMS accélère le devis (dégât de carrosserie). */
  readonly photoParSms: boolean
  /** Organe exclu du réemploi par la loi : pièces neuves uniquement. */
  readonly organeExcluDuReemploi: OrganeExcluDuReemploi | null
  /** En relecture seulement : la famille elle-même attend la confirmation du garage. */
  readonly aRelire: boolean
}

export interface MentionPubliee {
  readonly texte: string
  readonly aRelire: boolean
}

/** Ce que le public (ou le relecteur) voit du catalogue, selon le mode. */
export interface CataloguePublie {
  readonly familles: readonly FamillePubliee[]
  readonly ceQueNousNeFaisonsPas: readonly MentionPubliee[]
  readonly engagementPiecePosee: MentionPubliee | null
  readonly gammeAuChoix: MentionPubliee | null
  /** « Pièce seule, à retirer au garage » ; `null` tant que la vente au comptoir n'est pas publiée. */
  readonly venteAuComptoir: MentionPubliee | null
  readonly tauxHoraire: PrixPublie
  readonly premierControle: PrixPublie
}

export function publierCatalogue(catalogue: Catalogue, mode: ModeSite): CataloguePublie {
  return {
    familles: catalogue.familles.flatMap((famille) => {
      const publiee = publierFamille(famille, mode)
      return publiee === null ? [] : [publiee]
    }),
    ceQueNousNeFaisonsPas: catalogue.ceQueNousNeFaisonsPas.flatMap((mention) => {
      const publiee = publierMention(mention, mode)
      return publiee === null ? [] : [publiee]
    }),
    engagementPiecePosee: publierMention(catalogue.engagementPiecePosee, mode),
    gammeAuChoix: publierMention(catalogue.gammeAuChoix, mode),
    venteAuComptoir: publierMention(catalogue.venteAuComptoir, mode),
    tauxHoraire: publierPrix(catalogue.tarifsTransverses.tauxHoraire, mode, LIBELLE_SUR_DEMANDE),
    premierControle: publierPrix(
      catalogue.tarifsTransverses.premierControle,
      mode,
      LIBELLE_SUR_DEMANDE,
    ),
  }
}

/**
 * Le prix mis en avant d'une famille : son premier forfait, avec son
 * intitulé (« Plaquettes avant posées ») et son prix dans une phrase
 * (« dès 89,00 € TTC », « prix sur devis »). `null` sans forfait.
 */
export function prixMisEnAvant(famille: FamillePubliee): ForfaitPublie | null {
  return famille.forfaits[0] ?? null
}

/** Famille publiée portant exactement cet identifiant, ou `null`. */
export function trouverFamillePubliee(
  catalogue: CataloguePublie,
  identifiant: string,
): FamillePubliee | null {
  return catalogue.familles.find((famille) => famille.identifiant === identifiant) ?? null
}

/**
 * La gamme « d'occasion ou reconditionnée » a-t-elle un sens pour cette
 * famille ? Jamais pour un organe exclu du réemploi par la loi, ni pour une
 * prestation, où il n'y a pas de pièce à choisir.
 */
export function piecesDOccasionPossibles(
  famille: Pick<FamillePubliee, 'ventePieceSeule' | 'organeExcluDuReemploi'>,
): boolean {
  return famille.ventePieceSeule && famille.organeExcluDuReemploi === null
}

/**
 * Données bloquantes de D8 encore à valider : familles traitées, « Ce que nous
 * ne faisons pas », taux horaire et premier contrôle, et tout prix de
 * démonstration encore présent (une proposition ne part jamais en ligne). Une
 * liste vide permet la mise en production du catalogue ; un forfait inconnu
 * n'y figure pas, puisqu'il se replie sur « Prix sur devis ».
 */
export function recenserBloquantsAValider(catalogue: Catalogue): readonly string[] {
  const manques: string[] = []
  const famillesAValider = catalogue.familles.filter(
    (famille) => famille.provenance.statut === 'a_valider',
  )
  if (famillesAValider.length > 0) {
    manques.push(
      `Familles d’intervention à confirmer par le garage : ${famillesAValider.map((famille) => famille.libelle).join(', ')}`,
    )
  }
  const exclusionsAValider = catalogue.ceQueNousNeFaisonsPas.filter(
    (mention) => mention.provenance.statut === 'a_valider',
  )
  if (exclusionsAValider.length > 0) {
    manques.push(
      `« Ce que nous ne faisons pas » à confirmer par le garage : ${exclusionsAValider.map((mention) => mention.texte).join(', ')}`,
    )
  }
  const { tauxHoraire, premierControle } = catalogue.tarifsTransverses
  if (tauxHoraire.nature === 'inconnu') {
    manques.push(`${LIBELLES_TARIFS.tauxHoraire} à obtenir du garage`)
  }
  if (premierControle.nature === 'inconnu') {
    manques.push(`${LIBELLES_TARIFS.premierControle} : prix ou gratuité à obtenir du garage`)
  }
  const propositions = [
    ...(estProposition(tauxHoraire) ? [LIBELLES_TARIFS.tauxHoraire] : []),
    ...(estProposition(premierControle) ? [LIBELLES_TARIFS.premierControle] : []),
    ...catalogue.familles.flatMap((famille) =>
      famille.forfaits.filter((forfait) => estProposition(forfait.prix)).map((f) => f.intitule),
    ),
  ]
  if (propositions.length > 0) {
    manques.push(
      `Prix de démonstration à confirmer par le garage ou à retirer avant la mise en ligne : ${propositions.join(', ')}`,
    )
  }
  return manques
}

/**
 * Prix du socle et exemples de l'accueil, au format du contrat, pour le
 * garage (AE-05 : le catalogue reste la seule source des prix). Un prix que
 * le mode ne publie pas vaut `null` ; un exemple dont la famille ou le prix
 * n'est pas publié est omis.
 */
export function publierTarifsDuSocle(catalogue: Catalogue, mode: ModeSite): TarifsDuSocle {
  const { tauxHoraire, premierControle } = catalogue.tarifsTransverses
  return {
    tauxHoraire: tarifDuSocle(tauxHoraire, mode),
    premierControle: tarifDuSocle(premierControle, mode),
    exemples: catalogue.exemplesAccueil.flatMap((identifiant) => {
      const exemple = exempleDePrix(catalogue, identifiant, mode)
      return exemple === null ? [] : [exemple]
    }),
  }
}

const POINT_FINAL = /\.$/

function tarifDuSocle(prix: Prix, mode: ModeSite): TarifPublie | null {
  if (prix.nature !== 'chiffre' || affichage(prix.statut, mode) === 'masque') return null
  return {
    montant: montantEnMots(prix),
    gratuit: prix.montantTtcCentimes === 0,
    comprend: prix.comprend.replace(POINT_FINAL, ''),
    dateEffet: formaterDate(prix.dateEffet),
    duree: prix.duree,
    deduitDeLaReparation: prix.deduitDeLaReparation,
    aValider: prix.statut === 'a_valider',
  }
}

function exempleDePrix(
  catalogue: Catalogue,
  identifiant: string,
  mode: ModeSite,
): ExemplePrix | null {
  for (const famille of catalogue.familles) {
    const forfait = famille.forfaits.find((candidat) => candidat.identifiant === identifiant)
    if (forfait === undefined) continue
    if (affichage(famille.provenance.statut, mode) === 'masque') return null
    return exempleDuForfait(famille, forfait, mode)
  }
  return null
}

function exempleDuForfait(famille: Famille, forfait: Forfait, mode: ModeSite): ExemplePrix | null {
  const { prix } = forfait
  if (prix.nature !== 'chiffre' || affichage(prix.statut, mode) === 'masque') return null
  // Une ligne courte sur l'accueil : le véhicule de référence et la date ; ce
  // que le prix comprend se lit sur la page de la famille et sur les tarifs.
  const date = `prix au ${formaterDate(prix.dateEffet)}`
  return {
    intitule: forfait.intitule,
    montant: montantEnMots(prix),
    precision:
      prix.vehiculeReference === null
        ? majusculeInitiale(date)
        : `${majusculeInitiale(prix.vehiculeReference)}, ${date}`,
    lien: `${CHEMINS.catalogue}/${encodeURIComponent(famille.identifiant)}`,
    aValider: prix.statut === 'a_valider',
  }
}

function majusculeInitiale(texte: string): string {
  return texte.charAt(0).toLocaleUpperCase('fr') + texte.slice(1)
}

function publierFamille(famille: Famille, mode: ModeSite): FamillePubliee | null {
  const etat = affichage(famille.provenance.statut, mode)
  if (etat === 'masque') return null
  return {
    identifiant: famille.identifiant,
    libelle: famille.libelle,
    motsCourants: famille.motsCourants,
    synonymes: famille.synonymes,
    role: famille.role,
    signesUsure: famille.signesUsure,
    ceQueFaitLeGarage: famille.ceQueFaitLeGarage,
    forfaits: famille.forfaits.map((forfait) => ({
      identifiant: forfait.identifiant,
      intitule: forfait.intitule,
      prix: publierPrix(forfait.prix, mode, LIBELLE_PRIX_SUR_DEVIS),
      piece: forfait.piece,
      prestation: forfait.prestation,
    })),
    ventePieceSeule: famille.ventePieceSeule,
    pieces: famille.pieces,
    consigneDemande: famille.consigneDemande,
    photoParSms: famille.photoParSms,
    organeExcluDuReemploi: famille.organeExcluDuReemploi,
    aRelire: etat === 'a-relire',
  }
}

function publierMention(mention: Mention, mode: ModeSite): MentionPubliee | null {
  const etat = affichage(mention.provenance.statut, mode)
  return etat === 'masque' ? null : { texte: mention.texte, aRelire: etat === 'a-relire' }
}

/**
 * Un prix tel que le mode permet de le montrer. Une proposition est repliée
 * sur le libellé sans montant en production (jamais un chiffre proposé en
 * ligne), rendue en démonstration, rendue et annotée en relecture.
 */
function publierPrix(prix: Prix, mode: ModeSite, repli: string): PrixPublie {
  const presente = repli === LIBELLE_SUR_DEMANDE ? presenterTarif(prix) : presenterForfait(prix)
  const relecture = mode === 'relecture'
  if (prix.nature === 'inconnu') {
    return { ...presente, noteARelire: relecture ? prix.note : null, proposition: false }
  }
  if (prix.statut === 'valide') return { ...presente, noteARelire: null, proposition: false }
  if (affichage(prix.statut, mode) === 'masque') {
    return { ...presenterRepli(repli), noteARelire: null, proposition: false }
  }
  return {
    ...presente,
    noteARelire: relecture ? `${prix.note ?? ''} Source : ${prix.source ?? ''}.`.trim() : null,
    proposition: true,
  }
}
