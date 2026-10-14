import { describe, expect, it } from 'vitest'
import { analyserSource, lireAuthentification } from './analyse.js'
import {
  BOITE_GARAGE,
  courrielClient,
  nonRemiseEtrangere,
  nonRemiseExchange,
  nonRemiseGmail,
  nonRemisePostfix,
  notificationDuSite,
  REFERENCE_ESSAI,
  reponseAutomatique,
  reponseGmail,
  reponseOutlook,
  reponseTexteSeul,
} from './essai/echantillons.js'

const RECU_LE = new Date('2026-09-23T08:14:00Z')

describe('analyse d’un message téléchargé', () => {
  it('une réponse Gmail « Fait » : commande reconnue, référence, expéditeur, authentification', async () => {
    const { message } = await analyserSource(12, reponseGmail('Fait'), RECU_LE)
    expect(message).toEqual({
      nature: 'reponse',
      uid: 12,
      recuLe: RECU_LE,
      references: [REFERENCE_ESSAI],
      expediteur: BOITE_GARAGE,
      texte: 'Fait',
      commande: 'marquer-traitee',
      authentification: 'reussie',
    })
  })

  it('une réponse Outlook qui n’est pas une commande est rendue, sans commande', async () => {
    const { message } = await analyserSource(13, reponseOutlook('Je le rappelle demain'), RECU_LE)
    expect(message).toMatchObject({
      nature: 'reponse',
      texte: 'Je le rappelle demain',
      commande: null,
      authentification: 'inconnue',
    })
  })

  it('une réponse dont l’objet a été changé se rattache par ses en-têtes de fil', async () => {
    const { message } = await analyserSource(14, reponseTexteSeul('Fait', { objet: 'ok' }), RECU_LE)
    expect(message).toMatchObject({ references: [REFERENCE_ESSAI], commande: 'marquer-traitee' })
  })

  it('rapport de non-remise de Gmail (en-têtes d’origine joints) : échec, adresse, code et motif', async () => {
    const { message } = await analyserSource(20, nonRemiseGmail(), RECU_LE)
    expect(message).toEqual({
      nature: 'non-remise',
      uid: 20,
      recuLe: RECU_LE,
      references: [REFERENCE_ESSAI],
      action: 'echec',
      destinataire: 'atelier.inconnu@exemple.test',
      statut: '5.1.1',
      motif:
        "550-5.1.1 The email account that you tried to reach does not exist. Please try double-checking the recipient's email address.",
    })
  })

  it('rapports de Postfix (échec et retard) et d’Exchange (référence dans l’objet)', async () => {
    expect((await analyserSource(21, nonRemisePostfix(), RECU_LE)).message).toMatchObject({
      nature: 'non-remise',
      action: 'echec',
      statut: '5.2.2',
      references: [REFERENCE_ESSAI],
    })
    expect((await analyserSource(22, nonRemisePostfix('delayed'), RECU_LE)).message).toMatchObject({
      action: 'retard',
    })
    expect((await analyserSource(23, nonRemiseExchange(), RECU_LE)).message).toMatchObject({
      nature: 'non-remise',
      statut: '5.1.10',
      references: [REFERENCE_ESSAI],
    })
  })

  it.each([
    ['un courriel de client sans référence', courrielClient, 'sans-reference'],
    ['la propre notification du site', notificationDuSite, 'envoi-du-site'],
    ['une réponse d’absence', reponseAutomatique, 'reponse-automatique'],
    ['un rapport qui concerne un courriel du garage', nonRemiseEtrangere, 'non-remise-etrangere'],
  ] as const)('écarte %s', async (_cas, fabriquer, motif) => {
    const analyse = await analyserSource(30, fabriquer(), RECU_LE)
    expect(analyse.message).toBeNull()
    expect(analyse.tri).toEqual({ decision: 'ecarte', motif })
  })
})

describe('authentification posée par le serveur de réception', () => {
  it('DMARC fait foi, à défaut DKIM et SPF', () => {
    expect(lireAuthentification('mx.google.com; dkim=pass; spf=pass; dmarc=pass')).toBe('reussie')
    expect(lireAuthentification('mx.google.com; dkim=pass; spf=pass; dmarc=fail')).toBe('echouee')
    expect(lireAuthentification('mx.exemple.test; dkim=fail; spf=pass')).toBe('echouee')
    expect(lireAuthentification('mx.exemple.test; spf=pass smtp.mailfrom=x')).toBe('reussie')
    expect(lireAuthentification('mx.exemple.test; none')).toBe('inconnue')
    expect(lireAuthentification(null)).toBe('inconnue')
  })

  it('seul le premier en-tête compte : un en-tête plus bas peut être forgé', async () => {
    const source = reponseTexteSeul('Fait', {
      autres: [
        'Authentication-Results: mx.google.com; dkim=fail; spf=fail; dmarc=fail',
        'Authentication-Results: faux.test; dmarc=pass',
      ],
    })
    const { message } = await analyserSource(40, source, RECU_LE)
    expect(message).toMatchObject({ authentification: 'echouee', commande: 'marquer-traitee' })
  })
})
