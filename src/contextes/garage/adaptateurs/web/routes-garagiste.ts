import type { FastifyInstance } from 'fastify'
import type { OutilsPage } from '../../../../web/index.js'
import type { ConsulterLienFicheGoogle } from '../../application/consulter-lien-fiche-google.js'
import type { DeclarerFermeture } from '../../application/declarer-fermeture.js'
import type { DeclarerImprevu } from '../../application/declarer-imprevu.js'
import type { EtatFermetures, ListerFermetures } from '../../application/lister-fermetures.js'
import type { RappelsPromisPendant } from '../../application/rappels-promis-pendant.js'
import type { SupprimerFermeture } from '../../application/supprimer-fermeture.js'
import {
  CHEMINS_FERMETURES,
  lireCompteRendu,
  PARAMETRE_COMPTE_RENDU,
  type CompteRendu,
} from './chemins-garagiste.js'
import { estMotifFermeture, type PeriodeFermeture } from '../../domaine/fermeture.js'
import { comparerDates, dateIso, lireDateIso } from '../../domaine/temps-local.js'
import { champ, poserEnTetesPrives } from './requete.js'
import { CHAMP_RETABLIR, vueConfirmationImprevu, vueFermetures } from './vues/fermetures.js'

export interface CasUsageFermetures {
  readonly listerFermetures: ListerFermetures
  readonly declarerFermeture: DeclarerFermeture
  readonly declarerImprevu: DeclarerImprevu
  readonly supprimerFermeture: SupprimerFermeture
  readonly consulterLienFicheGoogle: ConsulterLienFicheGoogle
  readonly rappelsPromisPendant: RappelsPromisPendant
}

/** Après un envoi, on revient à la liste par une lecture (motif POST, redirection, GET). */
const STATUT_VOIR_AILLEURS = 303
const IDENTIFIANT_ENTIER = /^[1-9]\d{0,15}$/

function vers(compteRendu: CompteRendu, periode: PeriodeFermeture | null = null): string {
  const parametres = new URLSearchParams({ [PARAMETRE_COMPTE_RENDU]: compteRendu })
  if (periode !== null) {
    parametres.set('du', dateIso(periode.du))
    parametres.set('au', dateIso(periode.au))
    parametres.set('motif', periode.motif)
  }
  return `${CHEMINS_FERMETURES.liste}?${parametres.toString()}`
}

/**
 * Période supprimée, relue dans l'adresse du compte rendu pour « Annuler » :
 * deux dates du calendrier et un motif de la liste fermée, sinon rien ; aucun
 * texte libre de l'adresse n'est rendu (piège 40).
 */
function periodeSupprimee(requete: Record<string, unknown>): PeriodeFermeture | null {
  const texte = (nom: string) => (typeof requete[nom] === 'string' ? (requete[nom] as string) : '')
  const du = lireDateIso(texte('du'))
  const au = lireDateIso(texte('au'))
  const motif = texte('motif')
  if (du === null || au === null || !estMotifFermeture(motif) || comparerDates(du, au) > 0) {
    return null
  }
  return { du, au, motif }
}

/**
 * Espace garagiste, fermetures exceptionnelles (Kano D5, US-31). Chaque route
 * exige une session garagiste ; chaque envoi passe l'anti-falsification
 * partagée de l'espace (provenance et jeton lié à la session) ; aucune lecture
 * ne change l'état.
 */
export function enregistrerRoutesGaragiste(
  app: FastifyInstance,
  outils: OutilsPage,
  casUsage: CasUsageFermetures,
): void {
  const protection = { preHandler: outils.exigerGaragiste }
  const envoiProtege = { preHandler: [outils.exigerGaragiste, outils.exigerFormulaireGaragiste] }

  /** Rappels promis pendant chaque fermeture prévue, par identifiant de fermeture. */
  const rappelsDesFermetures = async (etat: EtatFermetures) =>
    new Map(
      await Promise.all(
        etat.prevues.map(
          async (fermeture) =>
            [fermeture.identifiant, await casUsage.rappelsPromisPendant(fermeture)] as const,
        ),
      ),
    )

  app.get(CHEMINS_FERMETURES.liste, protection, async (requete, reponse) => {
    poserEnTetesPrives(reponse)
    const requeteLue = requete.query as Record<string, unknown>
    const [etat, lienFicheGoogle] = await Promise.all([
      casUsage.listerFermetures(),
      casUsage.consulterLienFicheGoogle(),
    ])
    const compteRendu = lireCompteRendu(requeteLue[PARAMETRE_COMPTE_RENDU])
    return outils.envoyerPage(
      reponse,
      vueFermetures({
        etat,
        lienFicheGoogle,
        jetonFormulaire: outils.jetonFormulaireGaragiste(requete),
        compteRendu,
        supprimee: compteRendu === 'supprimee' ? periodeSupprimee(requeteLue) : null,
        rappelsPromis: await rappelsDesFermetures(etat),
      }),
    )
  })

  app.post(CHEMINS_FERMETURES.liste, envoiProtege, async (requete, reponse) => {
    poserEnTetesPrives(reponse)
    const saisie = {
      du: champ(requete.body, 'du'),
      au: champ(requete.body, 'au'),
      motif: champ(requete.body, 'motif'),
    }
    const resultat = await casUsage.declarerFermeture(saisie)
    if (resultat.enregistree) {
      const retablie = champ(requete.body, CHAMP_RETABLIR) === '1'
      return reponse.redirect(vers(retablie ? 'retablie' : 'enregistree'), STATUT_VOIR_AILLEURS)
    }
    const [etat, lienFicheGoogle] = await Promise.all([
      casUsage.listerFermetures(),
      casUsage.consulterLienFicheGoogle(),
    ])
    return outils.envoyerPage(
      reponse,
      vueFermetures({
        etat,
        lienFicheGoogle,
        jetonFormulaire: outils.jetonFormulaireGaragiste(requete),
        compteRendu: null,
        saisie,
        erreurs: resultat.erreurs,
        rappelsPromis: await rappelsDesFermetures(etat),
      }),
    )
  })

  app.get(CHEMINS_FERMETURES.imprevu, protection, async (requete, reponse) => {
    poserEnTetesPrives(reponse)
    const etat = await casUsage.listerFermetures()
    if (etat.fermetureDuJour !== null) {
      return reponse.redirect(CHEMINS_FERMETURES.liste, STATUT_VOIR_AILLEURS)
    }
    const aujourdhui = { du: etat.aujourdhui, au: etat.aujourdhui }
    return outils.envoyerPage(
      reponse,
      vueConfirmationImprevu(
        etat.aujourdhui,
        outils.jetonFormulaireGaragiste(requete),
        await casUsage.rappelsPromisPendant(aujourdhui),
      ),
    )
  })

  app.post(CHEMINS_FERMETURES.imprevu, envoiProtege, async (_requete, reponse) => {
    poserEnTetesPrives(reponse)
    const { dejaFerme } = await casUsage.declarerImprevu()
    return reponse.redirect(vers(dejaFerme ? 'deja-fermee' : 'enregistree'), STATUT_VOIR_AILLEURS)
  })

  app.post<{ Params: { identifiant: string } }>(
    CHEMINS_FERMETURES.suppression,
    envoiProtege,
    async (requete, reponse) => {
      poserEnTetesPrives(reponse)
      if (!IDENTIFIANT_ENTIER.test(requete.params.identifiant)) return reponse.callNotFound()
      const identifiant = Number(requete.params.identifiant)
      // La période est lue avant la suppression : « Annuler » la rétablit telle quelle.
      const { prevues } = await casUsage.listerFermetures()
      const fermeture = prevues.find((prevue) => prevue.identifiant === identifiant) ?? null
      const supprimee = await casUsage.supprimerFermeture(identifiant)
      return reponse.redirect(
        supprimee ? vers('supprimee', fermeture) : vers('introuvable'),
        STATUT_VOIR_AILLEURS,
      )
    },
  )
}
