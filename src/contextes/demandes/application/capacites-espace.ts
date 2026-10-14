import type {
  CompterDemandesARappeler,
  GarageFermeAujourdhui,
  ListerRappelsPromis,
  RappelPromis,
} from '../../../contrats/index.js'
import { estUrgente } from '../domaine/demande.js'
import { quandPromis, rangEcheance } from '../domaine/promesse.js'
import { dateAParis, estDateValide } from '../domaine/temps.js'
import type { DepotDemandes, Horloge } from './ports.js'

/**
 * Capacités que les demandes offrent aux autres pages de l'espace garagiste
 * (contrats `CompterDemandesARappeler` et `ListerRappelsPromis`). Une ligne
 * illisible n'y figure pas : la liste des demandes la signale déjà.
 */

export interface DependancesCapacitesEspace {
  readonly depot: DepotDemandes
  /** Fiche d'une demande dans l'espace garagiste. */
  readonly cheminFiche: (id: string) => string
}

export interface DependancesCompteur extends DependancesCapacitesEspace {
  readonly horloge: Horloge
  /** Fournie par le garage ; absente ou en panne : rien n'est dit de la fermeture. */
  readonly garageFermeAujourdhui?: GarageFermeAujourdhui
}

/** Le garage est-il fermé aujourd'hui ? Une capacité absente ou en panne ne dit rien. */
export async function fermeAujourdhui(garage: GarageFermeAujourdhui | undefined): Promise<boolean> {
  if (garage === undefined) return false
  try {
    return await garage()
  } catch {
    return false
  }
}

/**
 * Accueil de l'espace : « 3 à rappeler, dont 1 Ne roulez pas » ; garage fermé
 * aujourd'hui, les rappels promis pour aujourd'hui, à reporter (J4, passe 2).
 */
export function creerCompterDemandesARappeler(
  dependances: DependancesCompteur,
): CompterDemandesARappeler {
  return async () => {
    const [{ demandes }, ferme] = await Promise.all([
      dependances.depot.listerARappeler(),
      fermeAujourdhui(dependances.garageFermeAujourdhui),
    ])
    const compte = { total: demandes.length, neRoulezPas: demandes.filter(estUrgente).length }
    if (!ferme) return compte
    const aujourdhui = dateAParis(dependances.horloge.maintenant())
    const rappelsAReporter = demandes.filter(
      (demande) => demande.promesse?.date === aujourdhui,
    ).length
    return { ...compte, fermeAujourdhui: { rappelsAReporter } }
  }
}

function verifierDate(date: string): void {
  if (!estDateValide(date)) throw new RangeError(`Date attendue au format AAAA-MM-JJ : ${date}`)
}

/** Fermetures : les clients à qui un rappel a été promis ces jours-là. */
export function creerListerRappelsPromis(
  dependances: DependancesCapacitesEspace,
): ListerRappelsPromis {
  return async (du, au = du) => {
    verifierDate(du)
    verifierDate(au)
    if (au < du) return []
    const { demandes } = await dependances.depot.listerARappeler()
    const promis = demandes.flatMap((demande) => {
      const { promesse } = demande
      if (promesse === null || promesse.date < du || promesse.date > au) return []
      const rappel: RappelPromis = {
        prenom: demande.contact.prenom,
        telephone: demande.contact.telephone,
        date: promesse.date,
        quand: quandPromis(demande.contact.moment, promesse.demiJournee),
        phrase: promesse.phrase,
        neRoulezPas: estUrgente(demande),
        chemin: dependances.cheminFiche(demande.id),
      }
      return [{ rappel, rang: rangEcheance(promesse), recueLe: demande.recueLe.getTime() }]
    })
    return promis
      .sort(
        (a, b) =>
          Number(b.rappel.neRoulezPas) - Number(a.rappel.neRoulezPas) ||
          a.rang.localeCompare(b.rang) ||
          a.recueLe - b.recueLe,
      )
      .map(({ rappel }) => rappel)
  }
}
