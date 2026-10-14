import type { DateCalendaire, Prix, PrixChiffre } from './catalogue.js'

/**
 * Format unique des prix (B-22) : une seule fonction met un prix en mots,
 * pour la page de famille, les tarifs et l'accueil. Un même prix ne peut donc
 * pas s'afficher de deux façons (AE-05).
 */

/** Forfait sans montant : jamais un chiffre d'attente (D8). */
export const LIBELLE_PRIX_SUR_DEVIS = 'Prix sur devis'
/** Taux horaire ou premier contrôle non publié : le garage le donne à la demande. */
export const LIBELLE_SUR_DEMANDE = 'Sur demande'
/** Premier contrôle à zéro euro. */
export const LIBELLE_GRATUIT = 'Gratuit'
/** Devant un montant qui vaut pour le véhicule de référence, toujours nommé à côté. */
export const LIBELLE_A_PARTIR_DE = 'À partir de'
export const DEDUIT_DE_LA_REPARATION =
  'Déduit du prix de la réparation si vous la confiez au garage'
export const NON_DEDUIT_DE_LA_REPARATION = 'Non déduit du prix de la réparation'
const MENTION_TTC = 'TTC'

const CENTIMES_PAR_EURO = 100
const CHIFFRES_CENTIMES = 2
const TAILLE_GROUPE_MILLIERS = 3
/** Espace fine insécable entre les milliers, espace insécable avant le symbole (typographie française). */
const SEPARATEUR_MILLIERS = '\u202f'
const ESPACE_INSECABLE = '\u00a0'
const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

export interface PrixPresente {
  /** « 89,00 € TTC », « À partir de 59,00 € TTC », « Gratuit », « Sur devis après examen », « Prix sur devis » ou « Sur demande ». */
  readonly montant: string
  /** Ce que le prix comprend, durée, déduction ; vide sans montant. */
  readonly precisions: readonly string[]
  /**
   * Véhicule de référence et date d'effet, en une ligne : « Exemple :
   * citadine essence, prix au 24 septembre 2026 », ou « Prix au 24 septembre
   * 2026 » sans véhicule ; `null` sans montant. Dite une seule fois par tableau.
   */
  readonly reference: string | null
  /**
   * Le prix dans une phrase, en minuscule initiale : « dès 89,00 € TTC »,
   * « 60,00 € TTC », « gratuit », « sur devis après examen », « prix sur devis ».
   */
  readonly indicatif: string
  /** Vrai quand le prix dit quelque chose de propre (montant, gratuité, « sur devis après examen »). */
  readonly estPublie: boolean
}

/** « 1 234,56 € » : virgule décimale, deux décimales toujours, espaces insécables. */
export function formaterMontant(centimes: number): string {
  const euros = Math.trunc(centimes / CENTIMES_PAR_EURO)
  const reste = String(centimes % CENTIMES_PAR_EURO).padStart(CHIFFRES_CENTIMES, '0')
  return `${grouperMilliers(String(euros))},${reste}${ESPACE_INSECABLE}€`
}

/** « 1er octobre 2026 », « 15 mars 2026 ». */
export function formaterDate({ annee, mois, jour }: DateCalendaire): string {
  const nomDuMois = MOIS[mois - 1] ?? ''
  return `${jour === 1 ? '1er' : String(jour)} ${nomDuMois} ${annee}`
}

/** Un forfait de famille ; sans montant, « Prix sur devis ». */
export function presenterForfait(prix: Prix): PrixPresente {
  return presenter(prix, LIBELLE_PRIX_SUR_DEVIS)
}

/** Taux horaire ou premier contrôle ; sans montant, « Sur demande ». */
export function presenterTarif(prix: Prix): PrixPresente {
  return presenter(prix, LIBELLE_SUR_DEMANDE)
}

/** Le repli d'un prix que le mode ne permet pas de montrer : le même que sans montant. */
export function presenterRepli(libelle: string): PrixPresente {
  return {
    montant: libelle,
    precisions: [],
    reference: null,
    indicatif: enMinuscule(libelle),
    estPublie: false,
  }
}

/** Devant un montant « à partir de », dans une phrase : « dès 89,00 € TTC ». */
export const LIBELLE_DES = 'dès'

/** Le prix dans une phrase : « dès 89,00 € TTC », « 60,00 € TTC », « gratuit ». */
export function indicatifEnMots(prix: PrixChiffre): string {
  if (prix.montantTtcCentimes === 0) return enMinuscule(LIBELLE_GRATUIT)
  const montant = `${formaterMontant(prix.montantTtcCentimes)}${ESPACE_INSECABLE}${MENTION_TTC}`
  return prix.aPartirDe ? `${LIBELLE_DES} ${montant}` : montant
}

function enMinuscule(texte: string): string {
  return texte.charAt(0).toLocaleLowerCase('fr') + texte.slice(1)
}

/** « 59,00 € TTC », « À partir de 59,00 € TTC » ou « Gratuit ». */
export function montantEnMots(prix: PrixChiffre): string {
  if (prix.montantTtcCentimes === 0) return LIBELLE_GRATUIT
  const montant = `${formaterMontant(prix.montantTtcCentimes)}${ESPACE_INSECABLE}${MENTION_TTC}`
  return prix.aPartirDe ? `${LIBELLE_A_PARTIR_DE} ${montant}` : montant
}

/** « Sur devis après examen ». */
export function surDevisEnMots(precision: string): string {
  return `Sur devis ${precision}`
}

function presenter(prix: Prix, repli: string): PrixPresente {
  switch (prix.nature) {
    case 'inconnu':
      return presenterRepli(repli)
    case 'sur-devis': {
      const montant = surDevisEnMots(prix.precision)
      return {
        montant,
        precisions: [],
        reference: null,
        indicatif: enMinuscule(montant),
        estPublie: true,
      }
    }
    case 'chiffre':
      return {
        montant: montantEnMots(prix),
        precisions: precisionsDe(prix),
        reference: referenceDe(prix),
        indicatif: indicatifEnMots(prix),
        estPublie: true,
      }
  }
}

/** « Exemple : citadine essence, prix au 24 septembre 2026 », ou « Prix au 24 septembre 2026 ». */
function referenceDe(prix: PrixChiffre): string {
  const date = formaterDate(prix.dateEffet)
  return prix.vehiculeReference === null
    ? `Prix au ${date}`
    : `Exemple : ${prix.vehiculeReference}, prix au ${date}`
}

function precisionsDe(prix: PrixChiffre): readonly string[] {
  // Un premier contrôle gratuit n'a rien à déduire.
  const deduction =
    prix.deduitDeLaReparation === null || prix.montantTtcCentimes === 0
      ? null
      : prix.deduitDeLaReparation
        ? DEDUIT_DE_LA_REPARATION
        : NON_DEDUIT_DE_LA_REPARATION
  return [
    `Comprend : ${prix.comprend}`,
    prix.duree === null ? null : `Durée : ${prix.duree}`,
    deduction,
  ].filter((precision): precision is string => precision !== null)
}

function grouperMilliers(chiffres: string): string {
  const groupes: string[] = []
  for (let fin = chiffres.length; fin > 0; fin -= TAILLE_GROUPE_MILLIERS) {
    groupes.unshift(chiffres.slice(Math.max(0, fin - TAILLE_GROUPE_MILLIERS), fin))
  }
  return groupes.join(SEPARATEUR_MILLIERS)
}
