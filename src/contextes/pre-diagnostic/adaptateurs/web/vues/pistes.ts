import type { ReferenceFamille } from '../../../../../contrats/index.js'
import {
  FIGURES_FAMILLES,
  html,
  rendreFigureTechnique,
  type FigureTechnique,
  type Html,
} from '../../../../../web/index.js'
import type { Piste } from '../../../domaine/arbre.js'
import { adresseDevis } from '../adresses.js'
import { citer, insecable, LIBELLE_CE_QUE_VERIFIERA } from './commun.js'

export const TITRE_PISTES = 'Pistes possibles'
/** Les pistes ne sont pas classées : aucune n'est donnée pour plus probable qu'une autre. */
export const PRECISION_PISTES = 'Sans ordre de probabilité : l’atelier vérifie chacune.'
/** Début du lien de demande de prix d'une famille : « Demander un prix pour le freinage ». */
export const LIBELLE_DEMANDER_PRIX = 'Demander un prix pour'

/**
 * Nom de chaque famille citée par l'arbre, avec son article, dans une phrase
 * (« Demander un prix pour le freinage »). L'article ne se déduit pas du
 * libellé du catalogue (« Pneus », « Échappement ») : il est écrit ici, et un
 * essai vérifie que chaque famille de l'arbre du site a le sien.
 */
export const FAMILLES_EN_PHRASE: Readonly<Record<string, string>> = {
  'amortisseurs-et-suspension': 'les amortisseurs et la suspension',
  batterie: 'la batterie',
  carrosserie: 'la carrosserie',
  climatisation: 'la climatisation',
  'demarrage-et-charge': 'le démarrage et la charge',
  distribution: 'la distribution',
  echappement: 'l’échappement',
  eclairage: 'l’éclairage',
  freinage: 'le freinage',
  pneus: 'les pneus',
  'vidange-et-filtres': 'la vidange et les filtres',
}

/**
 * « Demander un prix pour le freinage » ; une famille que l'arbre citerait
 * sans article connu garde son libellé du catalogue entre guillemets, ou, à
 * défaut, « ces pièces ».
 */
export function libelleDemanderPrix(identifiant: string, famille: ReferenceFamille | null): string {
  const enPhrase =
    FAMILLES_EN_PHRASE[identifiant] ?? (famille === null ? 'ces pièces' : citer(famille.libelle))
  return `${LIBELLE_DEMANDER_PRIX} ${enPhrase}`
}

/** Familles désignées par les pistes, sans doublon, dans l'ordre des pistes. */
export function famillesDesPistes(pistes: readonly Piste[]): readonly string[] {
  return [...new Set(pistes.flatMap((piste) => (piste.famille === null ? [] : [piste.famille])))]
}
const PREFIXE_ID_FIGURE = 'pre-diagnostic-figure-'

/** Une piste prête à rendre : sa figure, ou le renvoi vers la figure déjà montrée. */
interface PisteIllustree {
  readonly piste: Piste
  readonly figure: { readonly dessin: FigureTechnique; readonly numero: number } | null
  /** La famille a déjà sa figure plus haut : on y renvoie plutôt que de la répéter. */
  readonly renvoi: number | null
}

/**
 * Numérote les figures dans l'ordre des pistes, une par famille concernée :
 * deux pistes de la même famille partagent la même figure. Une famille sans
 * figure connue n'en montre aucune.
 */
export function illustrerPistes(pistes: readonly Piste[]): readonly PisteIllustree[] {
  const numeros = new Map<string, number>()
  return pistes.map((piste) => {
    const dessin = piste.famille === null ? undefined : FIGURES_FAMILLES[piste.famille]
    if (piste.famille === null || dessin === undefined) return { piste, figure: null, renvoi: null }
    const dejaMontree = numeros.get(piste.famille)
    if (dejaMontree !== undefined) return { piste, figure: null, renvoi: dejaMontree }
    const numero = numeros.size + 1
    numeros.set(piste.famille, numero)
    return { piste, figure: { dessin, numero }, renvoi: null }
  })
}

/**
 * Pistes sans rang chiffré : une liste à puces, jamais numérotée. Chaque piste
 * qui désigne une famille montre sa figure technique légendée (Fig. N). Sous
 * la liste, jamais dans une piste (J5, passe 2 du jury : le lien semblait ne
 * concerner que la dernière), une demande de prix par famille, nommée
 * (« Demander un prix pour le freinage ») avec son prix indicatif
 * (« dès 89,00 € TTC »), famille et réponses préremplies (`code`).
 */
export function rendrePistes(
  pistes: readonly Piste[],
  code: string,
  familles: ReadonlyMap<string, ReferenceFamille> = new Map(),
): Html {
  return html`<section class="pre-diagnostic-pistes" aria-labelledby="pre-diagnostic-titre-pistes">
  <h2 id="pre-diagnostic-titre-pistes">${TITRE_PISTES}</h2>
  <p class="texte-note">${PRECISION_PISTES}</p>
  <ul class="pre-diagnostic-pistes__liste">
    ${illustrerPistes(pistes).map((illustree) => rendrePiste(illustree))}
  </ul>
  ${rendreDemandesDePrix(famillesDesPistes(pistes), code, familles)}
</section>`
}

function rendreDemandesDePrix(
  identifiants: readonly string[],
  code: string,
  familles: ReadonlyMap<string, ReferenceFamille>,
): Html | null {
  if (identifiants.length === 0) return null
  return html`<ul class="pre-diagnostic-prix">
    ${identifiants.map((identifiant) => {
      const famille = familles.get(identifiant) ?? null
      const prix = famille?.prixIndicatif?.trim() ?? ''
      return html`<li><a href="${adresseDevis(identifiant, code)}">${libelleDemanderPrix(identifiant, famille)}</a>${prix !== '' && html` <span class="pre-diagnostic-prix__indicatif">${insecable(prix)}</span>`}</li>`
    })}
  </ul>`
}

function rendrePiste({ piste, figure, renvoi }: PisteIllustree): Html {
  const illustree = figure !== null
  return html`<li class="carte pre-diagnostic-piste${illustree ? ' pre-diagnostic-piste--illustree' : ''}">
  <div class="pre-diagnostic-piste__texte">
    <p class="pre-diagnostic-piste__phrase">${piste.texte}</p>
    <p class="pre-diagnostic-piste__verification"><strong>${LIBELLE_CE_QUE_VERIFIERA}</strong> ${piste.verification}</p>
    ${renvoi !== null && html`<p class="texte-note">Pièces concernées : voir Fig. ${renvoi}.</p>`}
  </div>
  ${
    figure !== null &&
    rendreFigureTechnique(figure.dessin, {
      numero: figure.numero,
      id: `${PREFIXE_ID_FIGURE}${figure.numero}`,
    })
  }
</li>`
}
