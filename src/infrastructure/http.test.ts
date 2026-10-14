import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { demarrerFauxServeur, type FauxServeur } from './essai/faux-serveur-http.js'
import { appelerJson, echecHttp, estSucces, lireChamp, messageDuCorps } from './http.js'

let serveur: FauxServeur | null = null

afterEach(async () => {
  await serveur?.fermer()
  serveur = null
})

describe('appel JSON vers un fournisseur', () => {
  it('envoie le corps tel quel et décode la réponse', async () => {
    serveur = await demarrerFauxServeur({
      'POST /essai': (requete) => ({
        statut: 201,
        corps: { recu: JSON.parse(requete.corps) as unknown },
      }),
    })
    const reponse = await appelerJson(
      {
        methode: 'POST',
        url: `${serveur.origine}/essai`,
        corps: '{"a":1}',
        enTetes: { 'X-Cle': 'k' },
      },
      'Essai',
    )
    expect(reponse).toEqual({ statut: 201, corps: { recu: { a: 1 } } })
    expect(estSucces(reponse)).toBe(true)
    expect(serveur.requetes[0]?.enTetes['x-cle']).toBe('k')
  })

  it('un serveur arrêté est « injoignable »', async () => {
    await expect(
      appelerJson({ methode: 'GET', url: 'http://127.0.0.1:1/' }, 'Essai'),
    ).rejects.toMatchObject({
      nature: 'injoignable',
      connecteur: 'Essai',
    })
  })

  it('un serveur muet dépasse le délai et le dit', async () => {
    const muet = createServer(() => undefined)
    await new Promise<void>((resolu) => muet.listen(0, '127.0.0.1', resolu))
    const { port } = muet.address() as AddressInfo
    try {
      await expect(
        appelerJson({ methode: 'GET', url: `http://127.0.0.1:${port}/` }, 'Essai', 50),
      ).rejects.toMatchObject({ nature: 'delai' })
    } finally {
      muet.closeAllConnections()
      await new Promise<void>((resolu) => muet.close(() => resolu()))
    }
  })

  it('traduit les statuts HTTP en natures d’échec', () => {
    const echec = (statut: number) =>
      echecHttp({ statut, corps: null }, 'Essai', null, 'remède').nature
    expect(echec(401)).toBe('identifiants')
    expect(echec(403)).toBe('identifiants')
    expect(echec(429)).toBe('refus')
    expect(echec(400)).toBe('refus')
    expect(echec(503)).toBe('injoignable')
    expect(
      echecHttp({ statut: 401, corps: null }, 'Essai', 'Clé inconnue', 'Changer la clé'),
    ).toMatchObject({
      detail: 'HTTP 401 : Clé inconnue',
      remede: 'Changer la clé',
    })
  })

  it('lit un champ et un message d’erreur sans supposer la forme du corps', () => {
    expect(lireChamp({ a: 1 }, 'a')).toBe(1)
    expect(lireChamp(null, 'a')).toBeUndefined()
    expect(lireChamp('texte', 'a')).toBeUndefined()
    expect(messageDuCorps({ message: 'Invalid signature' })).toBe('Invalid signature')
    expect(messageDuCorps({ error: 'Bad key' })).toBe('Bad key')
    expect(messageDuCorps({ message: '' })).toBeNull()
    expect(messageDuCorps([])).toBeNull()
  })
})
