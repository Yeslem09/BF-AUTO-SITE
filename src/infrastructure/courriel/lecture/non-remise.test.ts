import { describe, expect, it } from 'vitest'
import { lireRapportNonRemise } from './non-remise.js'

const RAPPORT = [
  'Reporting-MTA: dns; mx.exemple.test',
  '',
  'Final-Recipient: rfc822; Atelier@Exemple.test',
  'Action: failed',
  'Status: 5.1.1',
  'Diagnostic-Code: smtp; 550-5.1.1 The email account that you tried to reach does not exist.',
  '    Please try double-checking the recipient address.',
].join('\r\n')

describe('lecture d’un rapport de non-remise (US-C07)', () => {
  it('lit action, destinataire, code d’état et motif, lignes repliées comprises', () => {
    expect(lireRapportNonRemise([RAPPORT], null, null)).toEqual({
      action: 'echec',
      destinataire: 'atelier@exemple.test',
      statut: '5.1.1',
      motif:
        '550-5.1.1 The email account that you tried to reach does not exist. Please try double-checking the recipient address.',
    })
  })

  it('un rapport de retard est un retard, pas un échec', () => {
    const retard = RAPPORT.replace('Action: failed', 'Action: delayed').replace('5.1.1', '4.4.1')
    expect(lireRapportNonRemise([retard], null, null)?.action).toBe('retard')
  })

  it('un rapport de remise réussie n’est pas une non-remise', () => {
    expect(lireRapportNonRemise([RAPPORT.replace('failed', 'delivered')], null, null)).toBeNull()
  })

  it('sans champs RFC 3464 : destinataire pris de X-Failed-Recipients, retard déduit de l’objet', () => {
    expect(
      lireRapportNonRemise(
        ['Votre message n’a pas pu être remis.'],
        'Undelivered Mail',
        'a@x.test, b@x.test',
      ),
    ).toEqual({
      action: 'echec',
      destinataire: 'a@x.test',
      statut: null,
      motif: null,
    })
    expect(lireRapportNonRemise([''], 'Delayed Mail (still being retried)', null)?.action).toBe(
      'retard',
    )
  })

  it('code d’état tiré du motif quand le champ Status manque', () => {
    const sansStatut = 'Action: failed\nDiagnostic-Code: smtp; 552 5.2.2 Mailbox full'
    expect(lireRapportNonRemise([sansStatut], null, null)).toMatchObject({
      statut: '5.2.2',
      motif: '552 5.2.2 Mailbox full',
    })
  })
})
