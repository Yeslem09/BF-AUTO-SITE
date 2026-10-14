/**
 * Gabarit étiqueté `html` : toute interpolation est échappée par défaut.
 *
 * Seul un fragment `Html` (produit par `html` ou par `brut`) s'insère tel quel.
 * Le contexte de chaque interpolation est déduit des seules parties statiques
 * du gabarit, écrites par le développeur : une valeur échappée ne peut pas le
 * modifier, puisqu'elle ne contient plus ni chevron ni guillemet.
 */

declare const marqueHtml: unique symbol

/** Fragment HTML sûr. Type opaque : on ne l'obtient que par `html` ou `brut`. */
export interface Html {
  readonly [marqueHtml]: true
  toString(): string
}

export type Interpolable =
  Html | string | number | null | undefined | false | readonly Interpolable[]

export class ErreurGabarit extends Error {
  override readonly name = 'ErreurGabarit'
}

class FragmentHtml {
  constructor(private readonly texte: string) {}

  toString(): string {
    return this.texte
  }
}

const ECHAPPEMENTS: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
const CARACTERES_A_ECHAPPER = /[&<>"']/g

/** Attributs dont la valeur est une adresse : le schéma y est contrôlé. */
const ATTRIBUTS_URL = new Set(['href', 'src', 'action', 'formaction', 'poster'])
/** Éléments dont le contenu n'est pas du HTML : aucune interpolation n'y est sûre. */
const ELEMENTS_BRUTS = new Set(['script', 'style'])
const SCHEMA_URL = /^([a-z][a-z\d+.-]*):/i
/** `sms` : lien « Envoyer un SMS » au garage (US-52), qui ne charge rien (Kano D9). */
const SCHEMAS_AUTORISES = new Set(['http', 'https', 'mailto', 'tel', 'sms'])
/** Les navigateurs ignorent ces caractères en analysant une adresse. */
const CARACTERES_IGNORES_DANS_URL = /[\x00-\x20\x7f]/g
const NOM_ATTRIBUT_AVANT_VALEUR = /([^\s=<>"']+)\s*=\s*$/
const SIGNE_EGAL_FINAL = /=\s*$/
const NOM_ELEMENT_OUVRANT = /^<([a-z][a-z\d-]*)/i
const DEBUT_BALISE = /[a-z!/]/i
const OUVERTURE_COMMENTAIRE = '<!--'
const FERMETURE_COMMENTAIRE = '-->'

type Contexte = 'texte' | 'debut-url' | 'element-brut' | 'attribut-sans-guillemets'

type Etat =
  | { readonly mode: 'texte' }
  | { readonly mode: 'commentaire' }
  | { readonly mode: 'balise'; readonly debut: number }
  | {
      readonly mode: 'valeur'
      readonly debut: number
      readonly guillemet: string
      readonly attribut: string
      readonly debutValeur: number
    }
  | { readonly mode: 'brut'; readonly element: string }

/**
 * Suit, caractère par caractère, où l'on se trouve dans le HTML statique :
 * texte, commentaire, intérieur de balise, valeur d'attribut entre guillemets,
 * ou contenu d'un élément script ou style.
 */
class AnalyseurStatique {
  private texte = ''
  private position = 0
  private etat: Etat = { mode: 'texte' }

  lire(partie: string): Contexte {
    this.texte += partie
    while (this.position < this.texte.length) this.avancer()
    return this.contexte()
  }

  private avancer(): void {
    const index = this.position
    const caractere = this.texte[index]
    this.position += 1
    const etat = this.etat
    switch (etat.mode) {
      case 'texte':
        if (this.texte.startsWith(OUVERTURE_COMMENTAIRE, index)) {
          this.etat = { mode: 'commentaire' }
          this.position = index + OUVERTURE_COMMENTAIRE.length
        } else if (caractere === '<' && DEBUT_BALISE.test(this.texte[index + 1] ?? '')) {
          this.etat = { mode: 'balise', debut: index }
        }
        return
      case 'commentaire':
        if (this.texte.startsWith(FERMETURE_COMMENTAIRE, index)) {
          this.etat = { mode: 'texte' }
          this.position = index + FERMETURE_COMMENTAIRE.length
        }
        return
      case 'balise':
        if (caractere === '"' || caractere === "'") {
          const avant = this.texte.slice(etat.debut, index)
          this.etat = {
            mode: 'valeur',
            debut: etat.debut,
            guillemet: caractere,
            attribut: NOM_ATTRIBUT_AVANT_VALEUR.exec(avant)?.[1]?.toLowerCase() ?? '',
            debutValeur: index + 1,
          }
        } else if (caractere === '>') {
          const element = NOM_ELEMENT_OUVRANT.exec(this.texte.slice(etat.debut, index))?.[1]
          const nom = element?.toLowerCase() ?? ''
          this.etat = ELEMENTS_BRUTS.has(nom) ? { mode: 'brut', element: nom } : { mode: 'texte' }
        }
        return
      case 'valeur':
        if (caractere === etat.guillemet) this.etat = { mode: 'balise', debut: etat.debut }
        return
      case 'brut':
        if (
          this.texte.slice(index, index + etat.element.length + 2).toLowerCase() ===
          `</${etat.element}`
        ) {
          this.etat = { mode: 'balise', debut: index }
        }
        return
    }
  }

  private contexte(): Contexte {
    const etat = this.etat
    switch (etat.mode) {
      case 'texte':
      case 'commentaire':
        return 'texte'
      case 'brut':
        return 'element-brut'
      case 'balise':
        return SIGNE_EGAL_FINAL.test(this.texte.slice(etat.debut))
          ? 'attribut-sans-guillemets'
          : 'texte'
      case 'valeur':
        return etat.debutValeur === this.texte.length && ATTRIBUTS_URL.has(etat.attribut)
          ? 'debut-url'
          : 'texte'
    }
  }
}

const contextesParGabarit = new WeakMap<TemplateStringsArray, readonly Contexte[]>()

export function echapper(texte: string): string {
  return texte.replace(CARACTERES_A_ECHAPPER, (caractere) => ECHAPPEMENTS[caractere] ?? caractere)
}

export function estHtml(valeur: unknown): valeur is Html {
  return valeur instanceof FragmentHtml
}

/** HTML de confiance inséré sans échappement. Jamais pour une donnée saisie ou lue. */
export function brut(texte: string): Html {
  return new FragmentHtml(texte) as unknown as Html
}

export function html(parties: TemplateStringsArray, ...valeurs: readonly Interpolable[]): Html {
  const contextes = contextesDe(parties)
  let resultat = parties[0] ?? ''
  valeurs.forEach((valeur, index) => {
    resultat += rendreValeur(valeur, contextes[index] ?? 'texte') + (parties[index + 1] ?? '')
  })
  return brut(resultat)
}

function contextesDe(parties: TemplateStringsArray): readonly Contexte[] {
  const connus = contextesParGabarit.get(parties)
  if (connus) return connus
  const analyseur = new AnalyseurStatique()
  const contextes = parties.slice(0, -1).map((partie) => analyseur.lire(partie))
  contextesParGabarit.set(parties, contextes)
  return contextes
}

function rendreValeur(valeur: Interpolable, contexte: Contexte): string {
  if (contexte === 'element-brut') {
    throw new ErreurGabarit(
      'Interpolation interdite dans un élément script ou style : servir un fichier statique.',
    )
  }
  if (contexte === 'attribut-sans-guillemets') {
    throw new ErreurGabarit('Valeur d’attribut sans guillemets : écrire attribut="${valeur}".')
  }
  if (valeur === null || valeur === undefined || valeur === false) return ''
  if (estHtml(valeur)) return valeur.toString()
  if (Array.isArray(valeur)) {
    return valeur.map((element: Interpolable) => rendreValeur(element, contexte)).join('')
  }
  if (typeof valeur === 'string') {
    if (contexte === 'debut-url') verifierSchema(valeur)
    return echapper(valeur)
  }
  if (typeof valeur === 'number') return String(valeur)
  throw new ErreurGabarit(`Valeur non interpolable dans un gabarit HTML : ${typeof valeur}.`)
}

function verifierSchema(adresse: string): void {
  const schema = SCHEMA_URL.exec(adresse.replace(CARACTERES_IGNORES_DANS_URL, ''))?.[1]
  if (schema !== undefined && !SCHEMAS_AUTORISES.has(schema.toLowerCase())) {
    throw new ErreurGabarit(`Schéma d’adresse refusé : « ${schema}: ».`)
  }
}
