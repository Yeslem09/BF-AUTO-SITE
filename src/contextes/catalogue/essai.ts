/**
 * Outils de test du catalogue : un document valide et modifiable, écrit dans
 * un dossier jetable. Réservé aux fichiers de test.
 *
 * Le document d'essai mêle exprès les statuts : Freinage validé avec son
 * forfait (organe exclu du réemploi), Batterie validée sans forfait,
 * Climatisation seulement proposée et prestation (sans pièce seule) ; taux
 * horaire validé, premier contrôle gratuit ; une exclusion validée, une
 * proposée ; engagement et gamme proposés ; vente au comptoir décidée par
 * Anthony ; aucun exemple d'accueil (un test qui en veut les nomme).
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type Document = Record<string, unknown>

export const MONTANT_FREINAGE_CENTIMES = 8900
export const SOURCE_PROPOSITION = 'proposition calée sur le marché local (étude 06)'

/** Un forfait d'essai ; sans prix donné, un prix inconnu (« Prix sur devis »). */
export function forfaitEssai(identifiant: string, prix: Document = prixInconnu()): Document {
  return { identifiant, intitule: `Forfait ${identifiant}`, prix }
}

export function prixInconnu(note = 'Forfait à obtenir.'): Document {
  return { statut: 'a_valider', note }
}

export function familleEssai(identifiant: string, modifications: Document = {}): Document {
  return {
    identifiant,
    libelle: `Famille ${identifiant}`,
    statut: 'valide',
    source: 'garage',
    // Propres à chaque famille : un mot courant ne mène qu'à une famille.
    mots_courants: [`${identifiant} un`, `${identifiant} deux`, `${identifiant} trois`],
    role: 'Une phrase qui dit à quoi sert la famille.',
    signes_usure: ['Un signe', 'Un autre signe'],
    ce_que_fait_le_garage: 'Ce que fait le garage pour cette famille.',
    forfaits: [forfaitEssai(`forfait-${identifiant}`)],
    vente_piece_seule: true,
    ...modifications,
  }
}

export function prixValide(modifications: Document = {}): Document {
  return {
    statut: 'valide',
    montant_ttc_centimes: MONTANT_FREINAGE_CENTIMES,
    vehicule_reference: 'citadine essence',
    comprend: 'plaquettes avant et main-d’œuvre',
    date_effet: '2026-10-01',
    ...modifications,
  }
}

/** Prix de démonstration : montant proposé « à partir de », avec sa source et sa note. */
export function prixPropose(modifications: Document = {}): Document {
  return {
    statut: 'a_valider',
    source: SOURCE_PROPOSITION,
    note: 'Montant proposé, à confirmer par le garagiste.',
    montant_ttc_centimes: 6900,
    a_partir_de: true,
    vehicule_reference: 'citadine essence',
    comprend: 'huile et filtre à huile',
    date_effet: '2026-10-01',
    ...modifications,
  }
}

export function documentCatalogue(modifications: Document = {}): Document {
  return {
    commentaire: 'Catalogue d’essai.',
    familles: [
      familleEssai('freinage', {
        libelle: 'Freinage',
        mots_courants: ['plaquettes', 'disques', 'liquide de frein'],
        synonymes: ['frein', 'tambours'],
        role: 'Le freinage ralentit et arrête la voiture.',
        signes_usure: ['Grincement quand vous freinez', 'Pédale molle'],
        ce_que_fait_le_garage: 'Nous remplaçons les plaquettes usées.',
        forfaits: [
          {
            identifiant: 'plaquettes-avant',
            intitule: 'Plaquettes avant',
            prix: prixValide(),
            piece: 'Plaquettes avant',
          },
        ],
        pieces: ['Plaquettes avant', 'Plaquettes arrière', 'Disques avant'],
        organe_exclu_du_reemploi: 'freinage',
      }),
      familleEssai('batterie', {
        libelle: 'Batterie',
        mots_courants: ['batterie à plat', 'démarrage difficile'],
        role: 'La batterie fait démarrer le moteur.',
      }),
      familleEssai('climatisation', {
        libelle: 'Climatisation',
        statut: 'a_valider',
        source: 'proposition',
        mots_courants: ['recharge de climatisation', 'gaz'],
        role: 'La climatisation refroidit l’habitacle.',
        forfaits: [forfaitEssai('recharge', prixInconnu('Forfait recharge à obtenir.'))],
        vente_piece_seule: false,
      }),
    ],
    tarifs_transverses: {
      taux_horaire: {
        statut: 'valide',
        montant_ttc_centimes: 6500,
        comprend: 'une heure de main-d’œuvre, pièces en sus',
        date_effet: '2026-10-01',
      },
      premier_controle: {
        statut: 'valide',
        montant_ttc_centimes: 0,
        comprend: 'écoute du bruit et essai sur place',
        duree: '30 minutes environ',
        deduit_de_la_reparation: false,
        date_effet: '2026-10-01',
      },
    },
    ce_que_nous_ne_faisons_pas: [
      { libelle: 'Carrosserie et peinture', statut: 'valide', source: 'garage' },
      { libelle: 'Poids lourds', statut: 'a_valider', source: 'proposition' },
    ],
    engagement_piece_posee: {
      texte: 'Nous vérifions la pièce avant de la commander, puis nous la posons.',
      statut: 'a_valider',
      source: 'proposition',
    },
    gamme_au_choix: {
      texte: 'Au devis, vous choisissez la gamme : neuve, d’occasion ou reconditionnée.',
      statut: 'a_valider',
      source: 'proposition',
    },
    vente_au_comptoir: {
      texte: 'Vous pouvez aussi acheter la pièce seule et la retirer au garage.',
      statut: 'valide',
      source: 'anthony',
      date_decision: '2026-09-23',
    },
    exemples_accueil: [],
    ...modifications,
  }
}

export interface DossierEssai {
  readonly chemin: string
  /** Remplace le contenu de `catalogue.json` dans le dossier. */
  ecrire(document: Document): Promise<void>
  supprimer(): Promise<void>
}

/** Dossier de données jetable contenant `catalogue.json`. */
export async function creerDossierEssai(
  document: Document = documentCatalogue(),
): Promise<DossierEssai> {
  const chemin = await mkdtemp(join(tmpdir(), 'bf-auto-catalogue-'))
  const dossier: DossierEssai = {
    chemin,
    ecrire: (contenu) => writeFile(join(chemin, 'catalogue.json'), JSON.stringify(contenu)),
    supprimer: () => rm(chemin, { recursive: true, force: true }),
  }
  await dossier.ecrire(document)
  return dossier
}
