import {
  NIVEAUX_URGENCE,
  TYPES_DEMANDE,
  type ReferenceFamille,
  type ResumePreDiagnostic,
  type TelephonePublic,
} from '../../../../contrats/index.js'
import type { ContenuDemande, CreneauChoisi, Sujet } from '../../domaine/demande.js'
import {
  CODE_ANNEE_ANCIENNE,
  ENERGIES,
  GAMMES,
  MARQUES,
  MODALITES_PIECE,
  MOMENTS_RAPPEL,
  MOTIFS_RAPPEL,
  OBJETS_DEMANDE,
  trouverChoix,
  type Choix,
} from '../../domaine/referentiels.js'
import type { AnneeVehicule, Vehicule } from '../../domaine/vehicule.js'

/**
 * Passage du contenu d'une demande à la colonne JSON et retour. La relecture
 * contrôle chaque valeur (piège 8, type au retour de la base) : une ligne
 * altérée devient « illisible », elle ne fait jamais tomber une page entière.
 */

/** Forme stockée : le contenu sans le type, qui a sa propre colonne. */
type ContenuStocke = Omit<ContenuDemande, 'type'>

export function serialiserContenu(contenu: ContenuDemande): string {
  const stocke: ContenuStocke = {
    sujet: contenu.sujet,
    creneaux: contenu.creneaux,
    vehicule: contenu.vehicule,
    pieces: contenu.pieces,
    gamme: contenu.gamme,
    modalite: contenu.modalite,
    contact: contenu.contact,
    precisions: contenu.precisions,
  }
  return JSON.stringify(stocke)
}

type Objet = Readonly<Record<string, unknown>>

class LigneIllisible extends Error {
  override readonly name = 'LigneIllisible'
}

function objet(valeur: unknown): Objet {
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    throw new LigneIllisible('objet attendu')
  }
  return valeur as Objet
}

function texte(valeur: unknown): string {
  if (typeof valeur !== 'string') throw new LigneIllisible('texte attendu')
  return valeur
}

function texteOuNul(valeur: unknown): string | null {
  return valeur === null ? null : texte(valeur)
}

function tableau(valeur: unknown): readonly unknown[] {
  if (!Array.isArray(valeur)) throw new LigneIllisible('tableau attendu')
  return valeur
}

function code<C extends string>(referentiel: readonly Choix<C>[], valeur: unknown): C {
  const choix = trouverChoix(referentiel, texte(valeur))
  if (choix === null) throw new LigneIllisible('code inconnu')
  return choix.code
}

function codeOuNul<C extends string>(referentiel: readonly Choix<C>[], valeur: unknown): C | null {
  return valeur === null ? null : code(referentiel, valeur)
}

function famille(valeur: unknown): ReferenceFamille {
  const lu = objet(valeur)
  return { identifiant: texte(lu['identifiant']), libelle: texte(lu['libelle']) }
}

function resume(valeur: unknown): ResumePreDiagnostic {
  const lu = objet(valeur)
  const symptome = objet(lu['symptome'])
  const urgence = NIVEAUX_URGENCE.find((niveau) => niveau === lu['urgence'])
  if (urgence === undefined) throw new LigneIllisible('urgence inconnue')
  return {
    symptome: { identifiant: texte(symptome['identifiant']), libelle: texte(symptome['libelle']) },
    reponses: tableau(lu['reponses']).map((reponse) => {
      const r = objet(reponse)
      return { question: texte(r['question']), reponse: texte(r['reponse']) }
    }),
    urgence,
    conclusion: texte(lu['conclusion']),
  }
}

function sujet(valeur: unknown): Sujet {
  const lu = objet(valeur)
  switch (lu['nature']) {
    case 'famille':
      return { nature: 'famille', famille: famille(lu['famille']) }
    case 'objet':
      return { nature: 'objet', objet: code(OBJETS_DEMANDE, lu['objet']) }
    case 'motif':
      return { nature: 'motif', motif: code(MOTIFS_RAPPEL, lu['motif']) }
    case 'pre-diagnostic':
      return { nature: 'pre-diagnostic', resume: resume(lu['resume']) }
    default:
      throw new LigneIllisible('sujet inconnu')
  }
}

function annee(valeur: unknown): AnneeVehicule | null {
  if (valeur === null || valeur === CODE_ANNEE_ANCIENNE) return valeur
  if (typeof valeur === 'number' && Number.isInteger(valeur)) return valeur
  throw new LigneIllisible('année illisible')
}

function vehicule(valeur: unknown): Vehicule | null {
  if (valeur === null) return null
  const lu = objet(valeur)
  return {
    plaque: texteOuNul(lu['plaque']),
    marque: codeOuNul(MARQUES, lu['marque']),
    modele: texteOuNul(lu['modele']),
    annee: annee(lu['annee']),
    energie: codeOuNul(ENERGIES, lu['energie']),
  }
}

/** Un lien d'appel relu doit rester un lien d'appel français : jamais un autre schéma. */
const FORMAT_LIEN_TELEPHONE = /^tel:\+33\d{9}$/

function telephone(valeur: unknown): TelephonePublic {
  const lu = objet(valeur)
  const lien = texte(lu['lien'])
  if (!FORMAT_LIEN_TELEPHONE.test(lien)) throw new LigneIllisible('lien d’appel illisible')
  return { affichable: texte(lu['affichable']), lien }
}

function creneau(valeur: unknown): CreneauChoisi {
  const lu = objet(valeur)
  return { code: texte(lu['code']), libelle: texte(lu['libelle']) }
}

/** Contenu relu et contrôlé, ou `null` si la ligne est illisible. */
export function lireContenu(type: string, json: string): ContenuDemande | null {
  try {
    const typeLu = TYPES_DEMANDE.find((connu) => connu === type)
    if (typeLu === undefined) return null
    const lu = objet(JSON.parse(json))
    const contact = objet(lu['contact'])
    return {
      type: typeLu,
      sujet: sujet(lu['sujet']),
      creneaux: tableau(lu['creneaux']).map(creneau),
      vehicule: vehicule(lu['vehicule']),
      // Absentes des demandes enregistrées avant les pièces de famille : aucune.
      pieces: tableau(lu['pieces'] ?? []).map(texte),
      gamme: codeOuNul(GAMMES, lu['gamme']),
      // Absente des demandes enregistrées avant la vente au comptoir : aucun choix.
      modalite: codeOuNul(MODALITES_PIECE, lu['modalite'] ?? null),
      contact: {
        prenom: texte(contact['prenom']),
        telephone: telephone(contact['telephone']),
        moment: code(MOMENTS_RAPPEL, contact['moment']),
      },
      precisions: texteOuNul(lu['precisions']),
    }
  } catch (erreur) {
    if (erreur instanceof LigneIllisible || erreur instanceof SyntaxError) return null
    throw erreur
  }
}
