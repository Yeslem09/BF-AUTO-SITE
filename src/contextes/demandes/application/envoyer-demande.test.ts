import { afterEach, describe, expect, it } from 'vitest'
import {
  DELAI_HUMAIN_MS,
  environnementEssai,
  saisieEssai,
  type EnvironnementEssai,
} from '../essai.js'
import { ENVOIS_MAXIMUM_PAR_FENETRE } from '../domaine/anti-abus.js'
import { debutTraiteesAffichees } from '../domaine/conservation.js'
import type { EnvoiDemande, IssueEnvoi } from './envoyer-demande.js'

let environnement: EnvironnementEssai

afterEach(() => environnement.base.close())

/** Un formulaire affiché maintenant, rempli par un humain puis envoyé. */
async function formulaireAffiche(
  env: EnvironnementEssai,
  parametres: { type: string; famille?: string; prediagnostic?: string },
) {
  return env.preparerFormulaire({ famille: '', prediagnostic: '', ...parametres })
}

function envoi(jeton: string, surcharges: Partial<EnvoiDemande> = {}): EnvoiDemande {
  return {
    saisie: saisieEssai('rendez-vous'),
    rattachements: { famille: '', prediagnostic: '' },
    jeton,
    piegeRempli: false,
    cleClient: '203.0.113.7',
    ...surcharges,
  }
}

async function compter(env: EnvironnementEssai): Promise<number> {
  const liste = await env.depot.listerPourLeGaragiste(
    debutTraiteesAffichees(env.horloge.maintenant()),
  )
  return liste.demandes.length
}

function attendre<I extends IssueEnvoi['issue']>(
  issue: IssueEnvoi,
  attendue: I,
): Extract<IssueEnvoi, { issue: I }> {
  expect(issue.issue).toBe(attendue)
  return issue as Extract<IssueEnvoi, { issue: I }>
}

describe('envoyer une demande', () => {
  it('enregistre la demande AVANT de notifier, puis notifie une fois (B-24)', async () => {
    environnement = environnementEssai()
    const env = environnement
    let enregistreeAuMomentDeNotifier = false
    const envoyer = env.notificateur.envoyer.bind(env.notificateur)
    env.notificateur.envoyer = async (message) => {
      enregistreeAuMomentDeNotifier = (await compter(env)) === 1
      return envoyer(message)
    }
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const resultat = attendre(await env.envoyerDemande(envoi(jeton)), 'enregistree')
    await resultat.notification
    expect(resultat.jetonConfirmation).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(enregistreeAuMomentDeNotifier).toBe(true)
    expect(env.notificateur.messages).toHaveLength(1)
    const lecture = await env.depot.trouverParConfirmation(resultat.jetonConfirmation)
    expect(lecture.etat === 'trouvee' && lecture.demande.notification.etat).toBe('envoyee')
  })

  it('une saisie invalide revient avec ses erreurs, le même jeton, et rien n’est enregistré', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const resultat = attendre(
      await env.envoyerDemande(
        envoi(jeton, { saisie: saisieEssai('rendez-vous', { telephone: '12' }) }),
      ),
      'invalide',
    )
    expect(Object.keys(resultat.erreurs)).toEqual(['telephone'])
    expect(resultat.formulaire.jeton).toBe(jeton)
    expect(await compter(env)).toBe(0)
  })

  it('champ piège rempli : écran de confirmation, rien d’enregistré ; la confirmation enregistre (US-15)', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rappel' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const suspect = attendre(
      await env.envoyerDemande(envoi(jeton, { saisie: saisieEssai('rappel'), piegeRempli: true })),
      'a-confirmer',
    )
    expect(await compter(env)).toBe(0)
    expect(env.jetons.lire(suspect.formulaire.jeton)?.nature).toBe('confirmation')
    const confirme = attendre(
      await env.envoyerDemande(envoi(suspect.formulaire.jeton, { saisie: saisieEssai('rappel') })),
      'enregistree',
    )
    await confirme.notification
    expect(await compter(env)).toBe(1)
    expect(await env.registre.compterNonConfirmesDepuis(new Date(0))).toBe(0)
  })

  it('un envoi 1 seconde après l’affichage demande confirmation, sans rien perdre', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(1_000)
    const suspect = attendre(await env.envoyerDemande(envoi(jeton)), 'a-confirmer')
    expect(suspect.formulaire.type).toBe('rendez-vous')
    expect(await compter(env)).toBe(0)
  })

  it('un jeton absent ou altéré demande confirmation', async () => {
    environnement = environnementEssai()
    const env = environnement
    attendre(await env.envoyerDemande(envoi('')), 'a-confirmer')
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    // Dernier caractère toujours changé : un « x » remplacé par « x » ne falsifierait rien (1 fois sur 64).
    const altere = `${jeton.slice(0, -1)}${jeton.endsWith('x') ? 'y' : 'x'}`
    attendre(await env.envoyerDemande(envoi(altere)), 'a-confirmer')
  })

  it('une confirmation elle-même suspecte reste un seul envoi non confirmé', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rappel' })
    const premier = attendre(
      await env.envoyerDemande(envoi(jeton, { saisie: saisieEssai('rappel'), piegeRempli: true })),
      'a-confirmer',
    )
    attendre(
      await env.envoyerDemande(
        envoi(premier.formulaire.jeton, { saisie: saisieEssai('rappel'), piegeRempli: true }),
      ),
      'a-confirmer',
    )
    expect(await env.registre.compterNonConfirmesDepuis(new Date(0))).toBe(1)
  })

  it('le même jeton envoyé deux fois ne crée qu’une demande (envoi unique)', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const premier = attendre(await env.envoyerDemande(envoi(jeton)), 'enregistree')
    const second = attendre(await env.envoyerDemande(envoi(jeton)), 'deja-enregistree')
    expect(second.jetonConfirmation).toBe(premier.jetonConfirmation)
    expect(await compter(env)).toBe(1)
  })

  it('retour arrière puis autre demande avec le même formulaire : confirmée, jamais jetée (AE-35)', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const premiere = attendre(await env.envoyerDemande(envoi(jeton)), 'enregistree')
    env.horloge.avancer(10 * 60_000)
    const autre = saisieEssai('rendez-vous', { prenom: 'Karim', telephone: '07 11 22 33 44' })
    const aConfirmer = attendre(
      await env.envoyerDemande(envoi(jeton, { saisie: autre })),
      'a-confirmer',
    )
    expect(aConfirmer.motif).toBe('formulaire-deja-envoye')
    expect(env.jetons.lire(aConfirmer.formulaire.jeton)?.nature).toBe('confirmation')
    expect(await compter(env)).toBe(1)
    const seconde = attendre(
      await env.envoyerDemande(envoi(aConfirmer.formulaire.jeton, { saisie: autre })),
      'enregistree',
    )
    expect(seconde.jetonConfirmation).not.toBe(premiere.jetonConfirmation)
    expect(await compter(env)).toBe(2)
    const confirmation = await env.depot.trouverParConfirmation(seconde.jetonConfirmation)
    expect(confirmation.etat === 'trouvee' && confirmation.demande.contact.prenom).toBe('Karim')
    expect(await env.registre.compterNonConfirmesDepuis(new Date(0))).toBe(0)
    // Un double clic sur « Confirmer l'envoi » ne crée pas de troisième demande.
    attendre(
      await env.envoyerDemande(envoi(aConfirmer.formulaire.jeton, { saisie: autre })),
      'deja-enregistree',
    )
    expect(await compter(env)).toBe(2)
  })

  it('deux envois simultanés du même jeton ne créent qu’une demande', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const issues = await Promise.all([
      env.envoyerDemande(envoi(jeton)),
      env.envoyerDemande(envoi(jeton)),
    ])
    expect(issues.map((issue) => issue.issue).sort()).toEqual(['deja-enregistree', 'enregistree'])
    expect(await compter(env)).toBe(1)
  })

  it('refuse le sixième envoi d’une même adresse dans l’heure, pas celui d’une autre (US-47)', async () => {
    environnement = environnementEssai()
    const env = environnement
    for (let rang = 0; rang < ENVOIS_MAXIMUM_PAR_FENETRE; rang += 1) {
      const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
      env.horloge.avancer(DELAI_HUMAIN_MS)
      attendre(await env.envoyerDemande(envoi(jeton)), 'enregistree')
    }
    const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    attendre(await env.envoyerDemande(envoi(jeton)), 'limite-atteinte')
    attendre(await env.envoyerDemande(envoi(jeton, { cleClient: '198.51.100.4' })), 'enregistree')
    expect(await compter(env)).toBe(ENVOIS_MAXIMUM_PAR_FENETRE + 1)
  })

  it('sans clé client, aucun envoi n’est limité', async () => {
    environnement = environnementEssai()
    const env = environnement
    for (let rang = 0; rang <= ENVOIS_MAXIMUM_PAR_FENETRE; rang += 1) {
      const { jeton } = await formulaireAffiche(env, { type: 'rendez-vous' })
      env.horloge.avancer(DELAI_HUMAIN_MS)
      attendre(await env.envoyerDemande(envoi(jeton, { cleClient: null })), 'enregistree')
    }
  })

  it('le résumé du pré-diagnostic est retrouvé par le serveur, jamais lu dans l’envoi', async () => {
    environnement = environnementEssai()
    const env = environnement
    const { jeton } = await formulaireAffiche(env, { type: 'rappel', prediagnostic: 'code-urgent' })
    env.horloge.avancer(DELAI_HUMAIN_MS)
    const resultat = attendre(
      await env.envoyerDemande(
        envoi(jeton, {
          saisie: saisieEssai('rappel', { motif: '' }),
          rattachements: { famille: '', prediagnostic: 'code-urgent' },
        }),
      ),
      'enregistree',
    )
    await resultat.notification
    const lecture = await env.depot.trouverParConfirmation(resultat.jetonConfirmation)
    expect(lecture.etat === 'trouvee' && lecture.demande.sujet.nature).toBe('pre-diagnostic')
    expect(env.notificateur.messages[0]?.texte.startsWith('Ne roulez pas')).toBe(true)
  })
})
