/**
 * Boîte de réception en mémoire, pour les tests et le développement : même
 * tri que le serveur (recherche puis en-têtes), même analyse, même filigrane.
 * Elle compte les contenus analysés pour prouver que rien d'autre n'est lu.
 */
import { simpleParser } from 'mailparser'
import { analyserSource, enTetesDepuisAnalyse } from './analyse.js'
import { avancerFiligrane, planifierReleve, uidsNouveaux, type EtatDossier } from './filigrane.js'
import type { BoiteDeReception, MessageRecu, Releve } from './ports.js'
import { correspondRechercheServeur, trierEnTetes } from './tri.js'

export interface BoiteMemoire extends BoiteDeReception {
  /** Dépose un message brut ; renvoie son UID. */
  deposer(source: string, recuLe?: Date): number
  /** Simule un dossier recréé : les UID sont renumérotés, l'UIDVALIDITY change. */
  recreerDossier(): void
  /** UID dont le contenu a été analysé comme réponse ou non-remise. */
  readonly contenusLus: readonly number[]
}

interface MessageDepose {
  readonly uid: number
  readonly source: string
  readonly recuLe: Date
}

const DOSSIER = 'INBOX'
const VALIDITE_INITIALE = 1
const PREMIER_UID = 1

export function creerBoiteMemoire(maintenant: () => Date = () => new Date()): BoiteMemoire {
  let messages: MessageDepose[] = []
  let validite = VALIDITE_INITIALE
  let prochainUid = PREMIER_UID
  const contenusLus: number[] = []

  const etat = (): EtatDossier => ({ validiteUid: String(validite), prochainUid })

  async function lire(candidats: readonly MessageDepose[]) {
    const lus: MessageRecu[] = []
    let ecartes = 0
    for (const depose of candidats) {
      const enTetes = enTetesDepuisAnalyse(await simpleParser(depose.source))
      if (!correspondRechercheServeur(enTetes)) continue
      const tri = trierEnTetes(enTetes)
      if (tri.decision !== 'reponse' && tri.decision !== 'non-remise') {
        ecartes += 1
        continue
      }
      contenusLus.push(depose.uid)
      const { message } = await analyserSource(depose.uid, depose.source, depose.recuLe)
      if (message === null) ecartes += 1
      else lus.push(message)
    }
    return { messages: lus, ecartes }
  }

  return {
    contenusLus,
    deposer(source, recuLe = maintenant()) {
      const uid = prochainUid
      prochainUid += 1
      messages.push({ uid, source, recuLe })
      return uid
    },
    recreerDossier() {
      validite += 1
      messages = messages.map((message, rang) => ({ ...message, uid: PREMIER_UID + rang }))
      prochainUid = PREMIER_UID + messages.length
    },
    async relever(filigrane): Promise<Releve> {
      const dossier = etat()
      const plan = planifierReleve(filigrane, dossier)
      const uids = plan.nouveautes
        ? uidsNouveaux(
            messages.map((message) => message.uid),
            plan.depart,
          )
        : []
      const { messages: lus, ecartes } = await lire(
        messages.filter((message) => uids.includes(message.uid)),
      )
      return {
        messages: lus,
        filigrane: avancerFiligrane(plan.depart, dossier, uids),
        ecartes,
        illisibles: 0,
        reinitialise: plan.reinitialise,
      }
    },
    async listerRecents(depuis) {
      const recents = messages.filter((message) => message.recuLe >= depuis)
      return (await lire(recents)).messages
    },
    async verifier() {
      return { dossier: DOSSIER, messages: messages.length }
    },
  }
}
