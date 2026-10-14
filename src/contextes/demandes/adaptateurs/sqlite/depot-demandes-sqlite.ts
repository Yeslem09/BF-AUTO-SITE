import Database from 'better-sqlite3'
import type {
  DepotDemandes,
  IssueEnregistrement,
  JetonsDemande,
  LectureDemande,
  ListeDemandes,
} from '../../application/ports.js'
import { STATUTS_DEMANDE, type Demande, type StatutDemande } from '../../domaine/demande.js'
import type { EtatNotification } from '../../domaine/etat-notification.js'
import { DEMI_JOURNEES, type PromesseRappel } from '../../domaine/promesse.js'
import { estDateValide } from '../../domaine/temps.js'
import { SUIVI_COURRIEL_VIDE, type SuiviCourriel } from '../../domaine/suivi-courriel.js'
import type { Base } from './base.js'
import { lireContenu, serialiserContenu } from './serialisation.js'

interface LigneDemande {
  readonly id: string
  readonly type: string
  readonly contenu: string
  readonly statut: string
  readonly recue_le: string
  readonly statut_change_le: string | null
  readonly premiere_consultation_le: string | null
  readonly notification_etat: string
  readonly notification_envoyee_le: string | null
  readonly notification_premier_echec_le: string | null
  readonly notification_essais: number
  readonly notification_prochain_essai_le: string | null
  readonly notification_derniere_erreur: string | null
  readonly promesse_phrase: string | null
  readonly promesse_date: string | null
  readonly promesse_demi_journee: string | null
  readonly tentatives_appel: string
}

const CONTRAINTE_UNIQUE = 'SQLITE_CONSTRAINT_UNIQUE'
const COLONNE_JETON_FORMULAIRE = 'demandes_recues.jeton_formulaire'

/** Date ISO relue : `null` si la valeur manque ou n'est pas une date. */
function date(valeur: string | null): Date | null {
  if (valeur === null) return null
  const lue = new Date(valeur)
  return Number.isNaN(lue.getTime()) ? null : lue
}

function iso(instant: Date | null): string | null {
  return instant === null ? null : instant.toISOString()
}

function notification(ligne: LigneDemande): EtatNotification | null {
  switch (ligne.notification_etat) {
    case 'en-attente':
      return { etat: 'en-attente' }
    case 'envoyee': {
      const envoyeeLe = date(ligne.notification_envoyee_le)
      return envoyeeLe === null ? null : { etat: 'envoyee', envoyeeLe }
    }
    case 'en-echec': {
      const premierEchecLe = date(ligne.notification_premier_echec_le)
      const prochainEssaiLe = date(ligne.notification_prochain_essai_le)
      if (premierEchecLe === null || prochainEssaiLe === null) return null
      return {
        etat: 'en-echec',
        premierEchecLe,
        prochainEssaiLe,
        essais: ligne.notification_essais,
        derniereErreur: ligne.notification_derniere_erreur ?? '',
      }
    }
    default:
      return null
  }
}

/** Valeur relue hors de son domaine : la ligne entière devient illisible. */
const ILLISIBLE = Symbol('illisible')

/** Promesse relue : les trois colonnes ensemble, ou aucune. */
function promesse(ligne: LigneDemande): PromesseRappel | null | typeof ILLISIBLE {
  const { promesse_phrase: phrase, promesse_date: jour, promesse_demi_journee: moitie } = ligne
  if (phrase === null && jour === null && moitie === null) return null
  const demiJournee = DEMI_JOURNEES.find((connue) => connue === moitie)
  if (phrase === null || phrase === '' || jour === null || !estDateValide(jour)) return ILLISIBLE
  if (demiJournee === undefined) return ILLISIBLE
  return { phrase, date: jour, demiJournee }
}

/** Appels sans réponse relus : un tableau JSON de dates ISO, dans l'ordre. */
function tentatives(json: string): readonly Date[] | typeof ILLISIBLE {
  try {
    const lues: unknown = JSON.parse(json)
    if (!Array.isArray(lues)) return ILLISIBLE
    const dates = lues.map((valeur) => (typeof valeur === 'string' ? date(valeur) : null))
    return dates.every((valeur): valeur is Date => valeur !== null) ? dates : ILLISIBLE
  } catch {
    return ILLISIBLE
  }
}

/** Ligne relue et contrôlée ; `null` si une seule valeur est hors de son domaine. */
function versDemande(ligne: LigneDemande): Demande | null {
  const contenu = lireContenu(ligne.type, ligne.contenu)
  const statut = STATUTS_DEMANDE.find((connu) => connu === ligne.statut)
  const recueLe = date(ligne.recue_le)
  const etatNotification = notification(ligne)
  const promesseLue = promesse(ligne)
  const appels = tentatives(ligne.tentatives_appel)
  if (contenu === null || statut === undefined || recueLe === null || etatNotification === null) {
    return null
  }
  if (promesseLue === ILLISIBLE || appels === ILLISIBLE) return null
  return {
    ...contenu,
    id: ligne.id,
    recueLe,
    statut,
    statutChangeLe: date(ligne.statut_change_le),
    premiereConsultationLe: date(ligne.premiere_consultation_le),
    notification: etatNotification,
    promesse: promesseLue,
    tentativesAppel: appels,
  }
}

/** Lignes relues : les demandes, et les identifiants des lignes illisibles. */
function relire(lignes: readonly LigneDemande[]): ListeDemandes {
  const demandes: Demande[] = []
  const illisibles: string[] = []
  for (const ligne of lignes) {
    const demande = versDemande(ligne)
    if (demande === null) illisibles.push(ligne.id)
    else demandes.push(demande)
  }
  return { demandes, illisibles }
}

function isoDesTentatives(tentativesAppel: readonly Date[]): string {
  return JSON.stringify(tentativesAppel.map((instant) => instant.toISOString()))
}

function lecture(ligne: LigneDemande | undefined): LectureDemande {
  if (ligne === undefined) return { etat: 'absente' }
  const demande = versDemande(ligne)
  return demande === null ? { etat: 'illisible' } : { etat: 'trouvee', demande }
}

/** Colonnes de suivi de la notification, selon son état. */
function colonnesNotification(etat: EtatNotification) {
  return {
    notification_etat: etat.etat,
    notification_envoyee_le: etat.etat === 'envoyee' ? iso(etat.envoyeeLe) : null,
    notification_premier_echec_le: etat.etat === 'en-echec' ? iso(etat.premierEchecLe) : null,
    notification_essais: etat.etat === 'en-echec' ? etat.essais : 0,
    notification_prochain_essai_le: etat.etat === 'en-echec' ? iso(etat.prochainEssaiLe) : null,
    notification_derniere_erreur: etat.etat === 'en-echec' ? etat.derniereErreur : null,
  }
}

export function creerDepotDemandesSqlite(base: Base): DepotDemandes {
  const inserer = base.prepare(`
    INSERT INTO demandes_recues (
      id, type, contenu, statut, recue_le, statut_change_le, premiere_consultation_le,
      jeton_formulaire, jeton_confirmation, notification_etat, notification_envoyee_le,
      notification_premier_echec_le, notification_essais, notification_prochain_essai_le,
      notification_derniere_erreur, promesse_phrase, promesse_date, promesse_demi_journee,
      tentatives_appel
    ) VALUES (
      @id, @type, @contenu, @statut, @recue_le, @statut_change_le, @premiere_consultation_le,
      @jeton_formulaire, @jeton_confirmation, @notification_etat, @notification_envoyee_le,
      @notification_premier_echec_le, @notification_essais, @notification_prochain_essai_le,
      @notification_derniere_erreur, @promesse_phrase, @promesse_date, @promesse_demi_journee,
      @tentatives_appel
    )`)
  const confirmationDuFormulaire = base
    .prepare('SELECT jeton_confirmation FROM demandes_recues WHERE jeton_formulaire = ?')
    .pluck()
  const parConfirmation = base.prepare('SELECT * FROM demandes_recues WHERE jeton_confirmation = ?')
  const parIdentifiant = base.prepare('SELECT * FROM demandes_recues WHERE id = ?')
  const pourLeGaragiste = base.prepare(`
    SELECT * FROM demandes_recues
    WHERE statut = 'a-rappeler' OR (statut = 'traitee' AND statut_change_le >= ?)`)
  const aRappeler = base.prepare("SELECT * FROM demandes_recues WHERE statut = 'a-rappeler'")
  const recuesEntre = base.prepare(
    'SELECT * FROM demandes_recues WHERE recue_le >= ? AND recue_le <= ? ORDER BY recue_le',
  )
  const tentativesAppel = base.prepare(
    'UPDATE demandes_recues SET tentatives_appel = ? WHERE id = ?',
  )
  const premiereConsultation = base.prepare(`
    UPDATE demandes_recues SET premiere_consultation_le = ?
    WHERE id = ? AND premiere_consultation_le IS NULL`)
  const statut = base.prepare(
    'UPDATE demandes_recues SET statut = ?, statut_change_le = ? WHERE id = ?',
  )
  const suiviNotification = base.prepare(`
    UPDATE demandes_recues SET
      notification_etat = @notification_etat,
      notification_envoyee_le = @notification_envoyee_le,
      notification_premier_echec_le = @notification_premier_echec_le,
      notification_essais = @notification_essais,
      notification_prochain_essai_le = @notification_prochain_essai_le,
      notification_derniere_erreur = @notification_derniere_erreur
    WHERE id = @id`)
  const aRenvoyer = base
    .prepare(
      `
      SELECT id FROM demandes_recues
      WHERE statut = 'a-rappeler' AND (
        (notification_etat = 'en-echec' AND notification_prochain_essai_le <= @echeance)
        OR (notification_etat = 'en-attente' AND recue_le <= @enAttenteAvant)
      )
      ORDER BY recue_le`,
    )
    .pluck()
  const echecsDepuis = base
    .prepare(
      `
      SELECT COUNT(*) FROM demandes_recues
      WHERE notification_etat = 'en-echec' AND statut = 'a-rappeler'
        AND notification_premier_echec_le < ?`,
    )
    .pluck()
  const purge = base.prepare(`
    DELETE FROM demandes_recues
    WHERE MAX(recue_le, COALESCE(statut_change_le, recue_le)) < ?`)

  const noterSuivi = base.prepare(
    `INSERT INTO demandes_suivi_courriel (demande_id, nature, le, motif)
     SELECT @id, @nature, @le, @motif WHERE EXISTS (SELECT 1 FROM demandes_recues WHERE id = @id)
     ON CONFLICT (demande_id, nature) DO UPDATE SET le = excluded.le, motif = excluded.motif`,
  )
  const lireSuivi = base.prepare<[string], { nature: string; le: string; motif: string | null }>(
    'SELECT nature, le, motif FROM demandes_suivi_courriel WHERE demande_id = ?',
  )

  return {
    async enregistrer(demande: Demande, jetons: JetonsDemande): Promise<IssueEnregistrement> {
      try {
        inserer.run({
          id: demande.id,
          type: demande.type,
          contenu: serialiserContenu(demande),
          statut: demande.statut,
          recue_le: demande.recueLe.toISOString(),
          statut_change_le: iso(demande.statutChangeLe),
          premiere_consultation_le: iso(demande.premiereConsultationLe),
          jeton_formulaire: jetons.formulaire,
          jeton_confirmation: jetons.confirmation,
          ...colonnesNotification(demande.notification),
          promesse_phrase: demande.promesse?.phrase ?? null,
          promesse_date: demande.promesse?.date ?? null,
          promesse_demi_journee: demande.promesse?.demiJournee ?? null,
          tentatives_appel: isoDesTentatives(demande.tentativesAppel),
        })
        return 'enregistree'
      } catch (erreur) {
        if (
          erreur instanceof Database.SqliteError &&
          erreur.code === CONTRAINTE_UNIQUE &&
          erreur.message.includes(COLONNE_JETON_FORMULAIRE)
        ) {
          return 'jeton-deja-utilise'
        }
        throw erreur
      }
    },

    async confirmationDuFormulaire(jetonFormulaire) {
      const jeton: unknown = confirmationDuFormulaire.get(jetonFormulaire)
      return typeof jeton === 'string' ? jeton : null
    },

    async trouverParConfirmation(jetonConfirmation) {
      return lecture(parConfirmation.get(jetonConfirmation) as LigneDemande | undefined)
    },

    async trouver(id) {
      return lecture(parIdentifiant.get(id) as LigneDemande | undefined)
    },

    async listerPourLeGaragiste(traiteesDepuis): Promise<ListeDemandes> {
      return relire(pourLeGaragiste.all(traiteesDepuis.toISOString()) as LigneDemande[])
    },

    async listerARappeler(): Promise<ListeDemandes> {
      return relire(aRappeler.all() as LigneDemande[])
    },

    async listerRecuesEntre(debut, fin): Promise<ListeDemandes> {
      return relire(recuesEntre.all(debut.toISOString(), fin.toISOString()) as LigneDemande[])
    },

    async noterTentativesAppel(id, liste) {
      tentativesAppel.run(isoDesTentatives(liste), id)
    },

    async noterPremiereConsultation(id, instant) {
      premiereConsultation.run(instant.toISOString(), id)
    },

    async changerStatut(id, nouveau: StatutDemande, instant) {
      statut.run(nouveau, instant.toISOString(), id)
    },

    async enregistrerNotification(id, etat) {
      suiviNotification.run({ id, ...colonnesNotification(etat) })
    },

    async notificationsARenvoyer(echeance, enAttenteAvant) {
      return aRenvoyer
        .all({ echeance: echeance.toISOString(), enAttenteAvant: enAttenteAvant.toISOString() })
        .filter((id) => typeof id === 'string')
    },

    async compterEchecsDepuis(avant) {
      const nombre: unknown = echecsDepuis.get(avant.toISOString())
      return typeof nombre === 'number' ? nombre : 0
    },

    async purger(limite) {
      return purge.run(limite.toISOString()).changes
    },

    async noterSuiviCourriel(id, evenement) {
      noterSuivi.run({
        id,
        nature: evenement.nature,
        le: evenement.le.toISOString(),
        motif: evenement.nature === 'non-remise' ? evenement.motif : null,
      })
    },

    async suiviCourriel(id): Promise<SuiviCourriel> {
      let suivi: SuiviCourriel = SUIVI_COURRIEL_VIDE
      for (const ligne of lireSuivi.all(id)) {
        const le = date(ligne.le)
        if (le === null) continue
        if (ligne.nature === 'reponse-non-reconnue') suivi = { ...suivi, reponseNonReconnueLe: le }
        if (ligne.nature === 'non-remise' && ligne.motif !== null) {
          suivi = { ...suivi, nonRemise: { le, motif: ligne.motif } }
        }
      }
      return suivi
    },
  }
}
