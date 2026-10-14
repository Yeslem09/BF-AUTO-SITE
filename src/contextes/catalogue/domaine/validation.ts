import { CODES_ORGANES_EXCLUS, type OrganeExcluDuReemploi } from '../../../contrats/index.js'
import {
  SOURCES,
  SOURCES_QUI_VALIDENT,
  STATUTS,
  type Catalogue,
  type DateCalendaire,
  type Famille,
  type Forfait,
  type Mention,
  type Prix,
  type PrixInconnu,
  type Provenance,
  type Statut,
  type TarifsTransverses,
} from './catalogue.js'
import { ErreurDonneesCatalogue } from './erreurs.js'
import {
  estObjet,
  lireBooleen,
  lireChoix,
  lireEntier,
  lireListe,
  lireObjet,
  lireTexte,
  Rapport,
  signalerDoublons,
  sousChemin,
  verifierCles,
  type Bornes,
  type ObjetJson,
} from './lecture-json.js'
import { expressionsInterditesDans, normaliser } from './mots-interdits.js'

/**
 * Quatre rangées de six au bureau. Au-delà de 14 familles, la liste ne tient
 * plus sur un écran de téléphone : la recherche par mot prend le relais (D1).
 */
export const NOMBRE_MAX_FAMILLES = 24
const FAMILLES: Bornes = { min: 1, max: NOMBRE_MAX_FAMILLES }
/** Deux mots au moins : ils forment le titre de la page (« Freinage à Choisy-le-Roi : plaquettes, disques »). */
const MOTS_COURANTS: Bornes = { min: 2, max: 6 }
/** Facultatifs : les mots d'une recherche qui ne figurent pas déjà dans les mots courants. */
const SYNONYMES: Bornes = { min: 0, max: 24 }
const SIGNES_USURE: Bornes = { min: 1, max: 6 }
/** Pièces à cocher dans une demande de prix : au plus douze, une liste qu'un client lit encore. */
const PIECES: Bornes = { min: 0, max: 12 }
/** Vide tant que le garage n'exclut rien : le bloc « Ce que nous ne faisons pas » est alors masqué. */
const EXCLUSIONS: Bornes = { min: 0, max: 12 }
/** Au moins un forfait par famille (le prix mis en avant), quatre au plus. */
const FORFAITS: Bornes = { min: 1, max: 4 }
/** Trois exemples au plus sur l'accueil : le bloc atelier reste court. */
const EXEMPLES_ACCUEIL: Bornes = { min: 0, max: 3 }
/**
 * Un centime au moins, 10 000 € au plus : au-delà, c'est une faute de saisie.
 * Le premier contrôle peut être gratuit : zéro y est un fait, pas une donnée inconnue.
 */
const BORNES_MONTANT: Readonly<Record<'forfait' | 'taux-horaire' | 'premier-controle', Bornes>> = {
  forfait: { min: 1, max: 1_000_000 },
  'taux-horaire': { min: 1, max: 1_000_000 },
  'premier-controle': { min: 0, max: 1_000_000 },
}

const LONGUEUR_MAX_IDENTIFIANT = 40
const LONGUEUR_MAX_LIBELLE = 40
const LONGUEUR_MAX_MOT = 40
const LONGUEUR_MAX_ROLE = 220
const LONGUEUR_MAX_SIGNE = 140
const LONGUEUR_MAX_CE_QUE_FAIT = 400
const LONGUEUR_MAX_NOTE = 300
const LONGUEUR_MAX_VEHICULE = 60
const LONGUEUR_MAX_COMPREND = 200
const LONGUEUR_MAX_EXCLUSION = 100
const LONGUEUR_MAX_ENGAGEMENT = 400
const LONGUEUR_MAX_VENTE = 300
const LONGUEUR_MAX_GAMME = 300
const LONGUEUR_MAX_INTITULE = 60
const LONGUEUR_MAX_SOURCE_PRIX = 200
const LONGUEUR_MAX_SUR_DEVIS = 40
const LONGUEUR_MAX_DUREE = 40

/** Minuscules, chiffres et tirets simples : l'identifiant devient une adresse (`/pieces-et-reparations/freinage`). */
const FORMAT_IDENTIFIANT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FORMAT_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const FIN_DE_PHRASE = /[.!?]$/
/** Une ponctuation finale suivie d'un espace trahit une deuxième phrase. */
const FIN_DE_PHRASE_INTERIEURE = /[.!?]\s/

const CLES_RACINE = [
  'familles',
  'tarifs_transverses',
  'ce_que_nous_ne_faisons_pas',
  'engagement_piece_posee',
  'gamme_au_choix',
  'vente_au_comptoir',
  'exemples_accueil',
] as const
const CLES_RACINE_FACULTATIVES = ['commentaire'] as const
const CLES_FAMILLE = [
  'identifiant',
  'libelle',
  'statut',
  'source',
  'mots_courants',
  'role',
  'signes_usure',
  'ce_que_fait_le_garage',
  'forfaits',
  'vente_piece_seule',
] as const
const CLES_TARIFS = ['taux_horaire', 'premier_controle'] as const
const CLES_EXCLUSION = ['libelle', 'statut', 'source'] as const
const CLES_ENGAGEMENT = ['texte', 'statut', 'source'] as const
/** Date d'une décision d'Anthony : seule clé facultative d'un texte, exigée pour la source « anthony ». */
const CLE_DATE_DECISION = 'date_decision'
const CLES_FACULTATIVES_TEXTE = [CLE_DATE_DECISION] as const
const CLE_ORGANE = 'organe_exclu_du_reemploi'
const CLES_FACULTATIVES_FAMILLE = [
  ...CLES_FACULTATIVES_TEXTE,
  'synonymes',
  CLE_ORGANE,
  'pieces',
  'consigne_demande',
  'photo_par_sms',
] as const
const CLES_FORFAIT = ['identifiant', 'intitule', 'prix'] as const
const CLES_FACULTATIVES_FORFAIT = ['piece', 'prestation'] as const
/** Ce qui accompagne une proposition : sa source et ce qu'il reste à obtenir du garage. */
const CLES_PROPOSITION = ['source', 'note'] as const
const CLES_MONTANT = ['montant_ttc_centimes', 'comprend', 'date_effet'] as const
const CLE_A_PARTIR_DE = 'a_partir_de'
const CLE_VEHICULE = 'vehicule_reference'
const CLE_SUR_DEVIS = 'sur_devis'
const CLES_PREMIER_CONTROLE = ['duree', 'deduit_de_la_reparation'] as const

/** Ce qu'un prix désigne : forfait d'une famille, taux horaire, premier contrôle. */
type GenrePrix = 'forfait' | 'taux-horaire' | 'premier-controle'

/** Valeurs de repli d'une partie illisible : la lecture continue, l'erreur est déjà signalée. */
const PROVENANCE_ILLISIBLE: Provenance = { statut: 'a_valider', source: 'proposition' }
const PRIX_ILLISIBLE: PrixInconnu = { nature: 'inconnu', statut: 'a_valider', note: '' }
const DATE_ILLISIBLE: DateCalendaire = { annee: 1970, mois: 1, jour: 1 }
const MENTION_ILLISIBLE: Mention = { texte: '', provenance: PROVENANCE_ILLISIBLE }

/**
 * Valide le fichier du catalogue et le convertit en modèle du domaine.
 * Lève `ErreurDonneesCatalogue` avec la liste complète des problèmes.
 */
export function validerCatalogue(brut: unknown): Catalogue {
  if (!estObjet(brut)) throw new ErreurDonneesCatalogue(['la racine doit être un objet JSON'])
  const lecteur = new Lecteur(new Rapport())
  const catalogue = lecteur.catalogue(brut)
  if (lecteur.rapport.problemes.length > 0) {
    throw new ErreurDonneesCatalogue(lecteur.rapport.problemes)
  }
  return catalogue
}

/** Lecture guidée du document : chaque méthode lit une partie et signale ce qui cloche. */
class Lecteur {
  constructor(readonly rapport: Rapport) {}

  catalogue(racine: ObjetJson): Catalogue {
    verifierCles(racine, '', CLES_RACINE, this.rapport, CLES_RACINE_FACULTATIVES)
    if ('commentaire' in racine && typeof racine['commentaire'] !== 'string') {
      this.rapport.signaler('commentaire', 'texte attendu')
    }
    const familles = this.familles(racine['familles'], 'familles')
    return {
      familles,
      tarifsTransverses: this.tarifs(racine['tarifs_transverses'], 'tarifs_transverses'),
      ceQueNousNeFaisonsPas: this.exclusions(
        racine['ce_que_nous_ne_faisons_pas'],
        'ce_que_nous_ne_faisons_pas',
      ),
      engagementPiecePosee: this.engagement(
        racine['engagement_piece_posee'],
        'engagement_piece_posee',
      ),
      gammeAuChoix: this.mention(racine['gamme_au_choix'], 'gamme_au_choix', LONGUEUR_MAX_GAMME),
      venteAuComptoir: this.mention(
        racine['vente_au_comptoir'],
        'vente_au_comptoir',
        LONGUEUR_MAX_VENTE,
      ),
      exemplesAccueil: this.exemplesAccueil(racine['exemples_accueil'], familles),
    }
  }

  /**
   * Exemples de l'accueil : des forfaits existants, trois au plus, sans
   * doublon. Un identifiant inconnu montrerait un prix qui n'existe pas.
   */
  private exemplesAccueil(valeur: unknown, familles: readonly Famille[]): readonly string[] {
    const chemin = 'exemples_accueil'
    const connus = new Set(
      familles.flatMap((famille) => famille.forfaits.map((f) => f.identifiant)),
    )
    const exemples = lireListe(valeur, chemin, this.rapport, EXEMPLES_ACCUEIL).map(
      (element, index) => {
        const identifiant = lireTexte(
          element,
          sousChemin(chemin, index),
          this.rapport,
          LONGUEUR_MAX_IDENTIFIANT,
        )
        if (identifiant !== '' && !connus.has(identifiant)) {
          this.rapport.signaler(
            sousChemin(chemin, index),
            `« ${identifiant} » ne désigne aucun forfait du catalogue`,
          )
        }
        return identifiant
      },
    )
    signalerDoublons(exemples, chemin, this.rapport)
    return exemples
  }

  private familles(valeur: unknown, chemin: string): readonly Famille[] {
    const familles = lireListe(valeur, chemin, this.rapport, FAMILLES).flatMap((element, index) => {
      const famille = this.famille(element, sousChemin(chemin, index))
      return famille === null ? [] : [famille]
    })
    signalerDoublons(
      familles.map((famille) => famille.identifiant),
      `${chemin} (identifiant)`,
      this.rapport,
    )
    signalerDoublons(
      familles.map((famille) => famille.libelle),
      `${chemin} (libelle)`,
      this.rapport,
    )
    signalerDoublons(
      familles.flatMap((famille) => famille.forfaits.map((forfait) => forfait.identifiant)),
      `${chemin} (forfaits, identifiant)`,
      this.rapport,
    )
    this.signalerMotsPartages(familles, chemin)
    return familles
  }

  /**
   * Un mot courant ou un synonyme mène à une seule famille (D1 : une seule
   * page par besoin). Partagé, il enverrait le client sur deux pages pour un
   * même besoin ; répété dans sa propre famille, il ne sert à rien.
   */
  private signalerMotsPartages(familles: readonly Famille[], chemin: string): void {
    const familleDuMot = new Map<string, string>()
    for (const famille of familles) {
      const vusDansLaFamille = new Set<string>()
      for (const [champ, mots] of [
        ['mots_courants', famille.motsCourants],
        ['synonymes', famille.synonymes],
      ] as const) {
        for (const mot of mots) {
          const cle = normaliser(mot)
          if (cle === '') continue
          if (vusDansLaFamille.has(cle)) {
            if (champ === 'synonymes') {
              this.rapport.signaler(
                `${chemin} (synonymes)`,
                `« ${mot} » figure déjà dans la famille ${famille.libelle}`,
              )
            }
            continue
          }
          vusDansLaFamille.add(cle)
          const autre = familleDuMot.get(cle)
          if (autre === undefined) {
            familleDuMot.set(cle, famille.libelle)
          } else {
            this.rapport.signaler(
              `${chemin} (${champ})`,
              `« ${mot} » figure dans deux familles (${autre}, ${famille.libelle}) : un besoin mène à une seule page`,
            )
          }
        }
      }
    }
  }

  private famille(valeur: unknown, chemin: string): Famille | null {
    const objet = lireObjet(valeur, chemin, this.rapport, CLES_FAMILLE, CLES_FACULTATIVES_FAMILLE)
    if (objet === null) return null
    const cheminMots = sousChemin(chemin, 'mots_courants')
    const motsCourants = this.textes(objet['mots_courants'], cheminMots, MOTS_COURANTS, {
      longueurMax: LONGUEUR_MAX_MOT,
    })
    signalerDoublons(motsCourants, cheminMots, this.rapport)
    const synonymes = this.textes(objet['synonymes'], sousChemin(chemin, 'synonymes'), SYNONYMES, {
      longueurMax: LONGUEUR_MAX_MOT,
    })
    const identifiant = this.identifiant(objet['identifiant'], sousChemin(chemin, 'identifiant'))
    const libelle = this.texte(
      objet['libelle'],
      sousChemin(chemin, 'libelle'),
      LONGUEUR_MAX_LIBELLE,
    )
    this.signalerRepetitionDuLibelle(motsCourants, libelle, cheminMots)
    const ventePieceSeule = lireBooleen(
      objet['vente_piece_seule'],
      sousChemin(chemin, 'vente_piece_seule'),
      this.rapport,
      true,
    )
    const forfaits = this.forfaits(
      objet['forfaits'],
      sousChemin(chemin, 'forfaits'),
      ventePieceSeule,
    )
    const pieces = this.pieces(objet, chemin, ventePieceSeule, forfaits)
    return {
      identifiant,
      libelle,
      provenance: this.provenance(objet, chemin),
      motsCourants,
      synonymes,
      role: this.phrase(objet['role'], sousChemin(chemin, 'role'), LONGUEUR_MAX_ROLE),
      signesUsure: this.textes(
        objet['signes_usure'],
        sousChemin(chemin, 'signes_usure'),
        SIGNES_USURE,
        { longueurMax: LONGUEUR_MAX_SIGNE },
      ),
      ceQueFaitLeGarage: this.texte(
        objet['ce_que_fait_le_garage'],
        sousChemin(chemin, 'ce_que_fait_le_garage'),
        LONGUEUR_MAX_CE_QUE_FAIT,
      ),
      forfaits,
      ventePieceSeule,
      pieces,
      consigneDemande:
        objet['consigne_demande'] === undefined
          ? null
          : this.phrase(
              objet['consigne_demande'],
              sousChemin(chemin, 'consigne_demande'),
              LONGUEUR_MAX_SIGNE,
            ),
      photoParSms: lireBooleen(
        objet['photo_par_sms'],
        sousChemin(chemin, 'photo_par_sms'),
        this.rapport,
        false,
      ),
      organeExcluDuReemploi: this.organe(objet[CLE_ORGANE], sousChemin(chemin, CLE_ORGANE)),
    }
  }

  /**
   * Pièces à cocher d'une famille : aucune pour une prestation ; la pièce
   * d'un forfait est l'une d'elles, et un forfait prestation n'en pose aucune.
   */
  private pieces(
    objet: ObjetJson,
    chemin: string,
    ventePieceSeule: boolean,
    forfaits: readonly Forfait[],
  ): readonly string[] {
    const cheminPieces = sousChemin(chemin, 'pieces')
    const pieces = this.textes(objet['pieces'], cheminPieces, PIECES, {
      longueurMax: LONGUEUR_MAX_MOT,
    })
    signalerDoublons(pieces, cheminPieces, this.rapport)
    if (!ventePieceSeule && pieces.length > 0) {
      this.rapport.signaler(cheminPieces, 'une prestation n’a pas de pièces à cocher')
    }
    forfaits.forEach((forfait, index) => {
      const cheminForfait = sousChemin(sousChemin(chemin, 'forfaits'), index)
      if (forfait.piece !== null && !pieces.includes(forfait.piece)) {
        this.rapport.signaler(
          sousChemin(cheminForfait, 'piece'),
          `« ${forfait.piece} » ne figure pas dans les pièces de la famille`,
        )
      }
      if (forfait.piece !== null && forfait.prestation) {
        this.rapport.signaler(cheminForfait, 'une prestation ne pose pas de pièce')
      }
    })
    return pieces
  }

  /** Organe exclu du réemploi, pris dans le référentiel unique des contrats ; `null` si absent. */
  private organe(valeur: unknown, chemin: string): OrganeExcluDuReemploi | null {
    if (valeur === undefined) return null
    const organe = CODES_ORGANES_EXCLUS.find((code) => code === valeur)
    if (organe === undefined) {
      this.rapport.signaler(chemin, `une valeur parmi ${CODES_ORGANES_EXCLUS.join(', ')} attendue`)
      return null
    }
    return organe
  }

  private forfaits(valeur: unknown, chemin: string, ventePieceSeule: boolean): readonly Forfait[] {
    return lireListe(valeur, chemin, this.rapport, FORFAITS).flatMap((element, index) => {
      const cheminForfait = sousChemin(chemin, index)
      const objet = lireObjet(
        element,
        cheminForfait,
        this.rapport,
        CLES_FORFAIT,
        CLES_FACULTATIVES_FORFAIT,
      )
      if (objet === null) return []
      const piece =
        objet['piece'] === undefined
          ? null
          : lireTexte(
              objet['piece'],
              sousChemin(cheminForfait, 'piece'),
              this.rapport,
              LONGUEUR_MAX_MOT,
            )
      // Une famille prestation n'a que des prestations.
      const prestation =
        !ventePieceSeule ||
        lireBooleen(
          objet['prestation'],
          sousChemin(cheminForfait, 'prestation'),
          this.rapport,
          false,
        )
      return [
        {
          identifiant: this.identifiant(
            objet['identifiant'],
            sousChemin(cheminForfait, 'identifiant'),
          ),
          intitule: this.texte(
            objet['intitule'],
            sousChemin(cheminForfait, 'intitule'),
            LONGUEUR_MAX_INTITULE,
          ),
          prix: this.prix(objet['prix'], sousChemin(cheminForfait, 'prix'), 'forfait'),
          piece: piece === '' ? null : piece,
          prestation,
        },
      ]
    })
  }

  /**
   * Un mot courant ajoute un mot du client au nom de la famille : identique au
   * nom, il le répète dans la liste et dans le titre (« Pneus à Choisy-le-Roi : pneus »).
   */
  private signalerRepetitionDuLibelle(
    motsCourants: readonly string[],
    libelle: string,
    chemin: string,
  ): void {
    const nom = normaliser(libelle)
    motsCourants.forEach((mot, index) => {
      if (nom !== '' && normaliser(mot) === nom) {
        this.rapport.signaler(sousChemin(chemin, index), `« ${mot} » répète le nom de la famille`)
      }
    })
  }

  private identifiant(valeur: unknown, chemin: string): string {
    const identifiant = lireTexte(valeur, chemin, this.rapport, LONGUEUR_MAX_IDENTIFIANT)
    if (identifiant !== '' && !FORMAT_IDENTIFIANT.test(identifiant)) {
      this.rapport.signaler(
        chemin,
        `« ${identifiant} » : minuscules sans accent, chiffres et tirets simples attendus (exemple : vidange-et-filtres)`,
      )
    }
    return identifiant
  }

  private tarifs(valeur: unknown, chemin: string): TarifsTransverses {
    const objet = lireObjet(valeur, chemin, this.rapport, CLES_TARIFS)
    if (objet === null) return { tauxHoraire: PRIX_ILLISIBLE, premierControle: PRIX_ILLISIBLE }
    return {
      tauxHoraire: this.prix(
        objet['taux_horaire'],
        sousChemin(chemin, 'taux_horaire'),
        'taux-horaire',
      ),
      premierControle: this.prix(
        objet['premier_controle'],
        sousChemin(chemin, 'premier_controle'),
        'premier-controle',
      ),
    }
  }

  /**
   * Un prix, selon ce qu'il désigne, sous l'une de trois formes :
   * - inconnu : `a_valider` et la note de ce qu'il reste à obtenir, sans montant ;
   * - chiffré : montant, contenu et date d'effet ; le véhicule de référence pour
   *   un forfait et pour tout prix « à partir de » ; la durée et la déduction
   *   pour le premier contrôle ;
   * - sur devis (forfait seulement) : `sur_devis`, par exemple « après examen ».
   * Une proposition (à valider) cite sa source et ce qu'il reste à obtenir :
   * sans source, un montant proposé serait un prix inventé (AE-05). Un prix
   * validé n'a plus ni source ni note.
   */
  private prix(valeur: unknown, chemin: string, genre: GenrePrix): Prix {
    if (!estObjet(valeur)) return this.prixIllisible(valeur, chemin)
    const statut = this.statut(valeur, chemin)
    const chiffre = 'montant_ttc_centimes' in valeur
    const surDevis = genre === 'forfait' && CLE_SUR_DEVIS in valeur
    if (chiffre && surDevis) {
      this.rapport.signaler(chemin, 'un prix est chiffré ou sur devis, pas les deux')
    }
    if (chiffre) return this.prixChiffre(valeur, chemin, genre, statut)
    if (surDevis) return this.prixSurDevis(valeur, chemin, statut)
    return this.prixInconnu(valeur, chemin, statut, genre)
  }

  /** Prix absent (déjà signalé comme champ manquant) ou qui n'est pas un objet. */
  private prixIllisible(valeur: unknown, chemin: string): PrixInconnu {
    if (valeur !== undefined) this.rapport.signaler(chemin, 'objet attendu')
    return PRIX_ILLISIBLE
  }

  /** Aucun montant : seule la note de ce qu'il reste à obtenir du garage. */
  private prixInconnu(
    objet: ObjetJson,
    chemin: string,
    statut: Statut,
    genre: GenrePrix,
  ): PrixInconnu {
    const details = [
      ...CLES_PROPOSITION.filter((cle) => cle !== 'note'),
      ...CLES_MONTANT,
      CLE_A_PARTIR_DE,
      CLE_VEHICULE,
      ...CLES_PREMIER_CONTROLE,
      ...(genre === 'forfait' ? [] : [CLE_SUR_DEVIS]),
    ]
    for (const cle of details) {
      if (cle in objet) {
        this.rapport.signaler(
          sousChemin(chemin, cle),
          'un prix sans montant ne porte ni détail ni source : ajoutez montant_ttc_centimes, ou retirez ce champ',
        )
      }
    }
    verifierCles(objet, chemin, ['statut', 'note'], this.rapport, details)
    if (statut === 'valide') {
      this.rapport.signaler(
        sousChemin(chemin, 'statut'),
        genre === 'forfait'
          ? 'un prix validé porte un montant (montant_ttc_centimes) ou sur_devis'
          : 'un prix validé porte un montant (montant_ttc_centimes)',
      )
    }
    return {
      nature: 'inconnu',
      statut: 'a_valider',
      note: this.texte(objet['note'], sousChemin(chemin, 'note'), LONGUEUR_MAX_NOTE),
    }
  }

  /** « Sur devis après examen » : pas de forfait, et on le dit. */
  private prixSurDevis(objet: ObjetJson, chemin: string, statut: Statut): Prix {
    const origine = this.origine(objet, chemin, statut, [CLE_SUR_DEVIS])
    return {
      nature: 'sur-devis',
      ...origine,
      precision: this.texte(
        objet[CLE_SUR_DEVIS],
        sousChemin(chemin, CLE_SUR_DEVIS),
        LONGUEUR_MAX_SUR_DEVIS,
      ),
    }
  }

  private prixChiffre(objet: ObjetJson, chemin: string, genre: GenrePrix, statut: Statut): Prix {
    const premierControle = genre === 'premier-controle'
    const obligatoires = [
      ...CLES_MONTANT,
      ...(genre === 'forfait' ? [CLE_VEHICULE] : []),
      ...(premierControle ? CLES_PREMIER_CONTROLE : []),
    ]
    const facultatives = [CLE_A_PARTIR_DE, ...(genre === 'forfait' ? [] : [CLE_VEHICULE])]
    const origine = this.origine(objet, chemin, statut, obligatoires, facultatives)
    const bornes = BORNES_MONTANT[genre]
    const montantTtcCentimes = lireEntier(
      objet['montant_ttc_centimes'],
      sousChemin(chemin, 'montant_ttc_centimes'),
      this.rapport,
      bornes,
    )
    const aPartirDe = lireBooleen(
      objet[CLE_A_PARTIR_DE],
      sousChemin(chemin, CLE_A_PARTIR_DE),
      this.rapport,
      false,
    )
    const vehiculeReference =
      objet[CLE_VEHICULE] === undefined
        ? null
        : this.texte(objet[CLE_VEHICULE], sousChemin(chemin, CLE_VEHICULE), LONGUEUR_MAX_VEHICULE)
    if (aPartirDe && vehiculeReference === null && genre !== 'forfait') {
      this.rapport.signaler(
        sousChemin(chemin, CLE_VEHICULE),
        'un prix « à partir de » nomme son véhicule de référence',
      )
    }
    if (aPartirDe && montantTtcCentimes === 0 && 'montant_ttc_centimes' in objet) {
      this.rapport.signaler(
        sousChemin(chemin, CLE_A_PARTIR_DE),
        'un prix gratuit ne se dit pas « à partir de »',
      )
    }
    return {
      nature: 'chiffre',
      ...origine,
      montantTtcCentimes,
      aPartirDe,
      comprend: this.texte(
        objet['comprend'],
        sousChemin(chemin, 'comprend'),
        LONGUEUR_MAX_COMPREND,
      ),
      dateEffet: this.date(objet['date_effet'], sousChemin(chemin, 'date_effet')),
      vehiculeReference,
      duree: premierControle
        ? this.texte(objet['duree'], sousChemin(chemin, 'duree'), LONGUEUR_MAX_DUREE)
        : null,
      deduitDeLaReparation: premierControle
        ? lireBooleen(
            objet['deduit_de_la_reparation'],
            sousChemin(chemin, 'deduit_de_la_reparation'),
            this.rapport,
            false,
          )
        : null,
    }
  }

  /**
   * Source et note d'un prix chiffré ou sur devis : exigées d'une proposition,
   * refusées d'un prix validé (on les retire en le validant).
   */
  private origine(
    objet: ObjetJson,
    chemin: string,
    statut: Statut,
    obligatoires: readonly string[],
    facultatives: readonly string[] = [],
  ): { readonly statut: Statut; readonly source: string | null; readonly note: string | null } {
    if (statut === 'valide') {
      for (const cle of CLES_PROPOSITION) {
        if (cle in objet) {
          this.rapport.signaler(
            sousChemin(chemin, cle),
            'un prix validé ne porte ni source ni note : retirez-les en le validant',
          )
        }
      }
      verifierCles(objet, chemin, ['statut', ...obligatoires], this.rapport, [
        ...facultatives,
        ...CLES_PROPOSITION,
      ])
      return { statut, source: null, note: null }
    }
    if (!('source' in objet)) {
      this.rapport.signaler(
        sousChemin(chemin, 'source'),
        'un prix proposé cite sa source (étude, relevé) : sans elle, ce serait un prix inventé',
      )
    }
    verifierCles(objet, chemin, ['statut', ...obligatoires, 'note'], this.rapport, [
      ...facultatives,
      'source',
    ])
    return {
      statut,
      source:
        objet['source'] === undefined
          ? ''
          : this.texte(objet['source'], sousChemin(chemin, 'source'), LONGUEUR_MAX_SOURCE_PRIX),
      note: this.texte(objet['note'], sousChemin(chemin, 'note'), LONGUEUR_MAX_NOTE),
    }
  }

  /** Statut lu ; une absence est déjà signalée comme champ manquant par la vérification des clés. */
  private statut(objet: ObjetJson, chemin: string): Statut {
    if (!('statut' in objet)) return 'a_valider'
    return lireChoix(
      objet['statut'],
      sousChemin(chemin, 'statut'),
      STATUTS,
      this.rapport,
      'a_valider',
    )
  }

  /** Date réelle du calendrier (le 30 février est refusé). */
  private date(valeur: unknown, chemin: string): DateCalendaire {
    if (valeur === undefined) return DATE_ILLISIBLE
    const parties = typeof valeur === 'string' ? FORMAT_DATE.exec(valeur) : null
    if (parties === null) {
      this.rapport.signaler(chemin, 'date au format AAAA-MM-JJ attendue')
      return DATE_ILLISIBLE
    }
    const date = { annee: Number(parties[1]), mois: Number(parties[2]), jour: Number(parties[3]) }
    if (!estDateReelle(date)) {
      this.rapport.signaler(chemin, `« ${String(valeur)} » n’existe pas dans le calendrier`)
      return DATE_ILLISIBLE
    }
    return date
  }

  private exclusions(valeur: unknown, chemin: string): readonly Mention[] {
    const exclusions = lireListe(valeur, chemin, this.rapport, EXCLUSIONS).map((element, index) => {
      const cheminElement = sousChemin(chemin, index)
      const objet = lireObjet(
        element,
        cheminElement,
        this.rapport,
        CLES_EXCLUSION,
        CLES_FACULTATIVES_TEXTE,
      )
      if (objet === null) return MENTION_ILLISIBLE
      return {
        texte: this.texte(
          objet['libelle'],
          sousChemin(cheminElement, 'libelle'),
          LONGUEUR_MAX_EXCLUSION,
        ),
        provenance: this.provenance(objet, cheminElement),
      }
    })
    signalerDoublons(
      exclusions.map((exclusion) => exclusion.texte),
      chemin,
      this.rapport,
    )
    return exclusions
  }

  private engagement(valeur: unknown, chemin: string): Mention {
    return this.mention(valeur, chemin, LONGUEUR_MAX_ENGAGEMENT)
  }

  /** Texte court publiable, avec sa provenance : engagement, vente au comptoir. */
  private mention(valeur: unknown, chemin: string, longueurMax: number): Mention {
    const objet = lireObjet(valeur, chemin, this.rapport, CLES_ENGAGEMENT, CLES_FACULTATIVES_TEXTE)
    if (objet === null) return MENTION_ILLISIBLE
    return {
      texte: this.texte(objet['texte'], sousChemin(chemin, 'texte'), longueurMax),
      provenance: this.provenance(objet, chemin),
    }
  }

  /**
   * Un texte validé vient du garage, ou d'une décision d'Anthony datée : une
   * proposition doit d'abord être soumise.
   */
  private provenance(objet: ObjetJson, chemin: string): Provenance {
    if (!('source' in objet)) return { statut: this.statut(objet, chemin), source: 'proposition' }
    const statut = this.statut(objet, chemin)
    const source = lireChoix(
      objet['source'],
      sousChemin(chemin, 'source'),
      SOURCES,
      this.rapport,
      'proposition',
    )
    if (statut === 'valide' && !SOURCES_QUI_VALIDENT.includes(source)) {
      this.rapport.signaler(
        sousChemin(chemin, 'source'),
        'une valeur validée vient du garage ou d’une décision d’Anthony : source « garage » ou « anthony » attendue',
      )
    }
    const cheminDate = sousChemin(chemin, CLE_DATE_DECISION)
    if (source === 'anthony') {
      if (objet[CLE_DATE_DECISION] === undefined) {
        this.rapport.signaler(cheminDate, 'date de la décision d’Anthony (AAAA-MM-JJ) attendue')
      } else {
        this.date(objet[CLE_DATE_DECISION], cheminDate)
      }
    } else if (CLE_DATE_DECISION in objet) {
      this.rapport.signaler(cheminDate, 'réservée à une décision d’Anthony (source « anthony »)')
    }
    return { statut, source }
  }

  private textes(
    valeur: unknown,
    chemin: string,
    bornes: Bornes,
    { longueurMax }: { readonly longueurMax: number },
  ): readonly string[] {
    return lireListe(valeur, chemin, this.rapport, bornes).map((element, index) =>
      this.texte(element, sousChemin(chemin, index), longueurMax),
    )
  }

  /** Une seule phrase, terminée par sa ponctuation. */
  private phrase(valeur: unknown, chemin: string, longueurMax: number): string {
    const phrase = this.texte(valeur, chemin, longueurMax)
    if (phrase !== '' && (!FIN_DE_PHRASE.test(phrase) || FIN_DE_PHRASE_INTERIEURE.test(phrase))) {
      this.rapport.signaler(chemin, 'une seule phrase attendue, terminée par un point')
    }
    return phrase
  }

  /** Texte non vide et borné, sans aucune expression interdite. */
  private texte(valeur: unknown, chemin: string, longueurMax: number): string {
    const texte = lireTexte(valeur, chemin, this.rapport, longueurMax)
    for (const expression of expressionsInterditesDans(texte)) {
      this.rapport.signaler(chemin, `expression interdite « ${expression} »`)
    }
    return texte
  }
}

function estDateReelle({ annee, mois, jour }: DateCalendaire): boolean {
  const date = new Date(Date.UTC(annee, mois - 1, jour))
  return (
    date.getUTCFullYear() === annee && date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour
  )
}
