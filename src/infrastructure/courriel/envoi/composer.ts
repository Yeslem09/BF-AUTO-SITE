import type { SendMailOptions } from 'nodemailer'
import { domaineDe, identifiantMessage, objetAvecReference } from '../reference.js'
import type { CourrielSortant } from './ports.js'

/** Qui écrit : l'adresse du compte, un nom affiché facultatif, une adresse de réponse facultative. */
export interface IdentiteExpediteur {
  readonly adresse: string
  readonly nom: string | null
  readonly repondreA: string | null
}

/** Le premier message d'une demande : celui auquel les suivants se rattachent. */
const RANG_PREMIER_MESSAGE = 1
const RETOURS_A_LA_LIGNE = /[\r\n]+/g

/**
 * Courriel prêt pour nodemailer (Kano connecteurs, C3) : texte brut UTF-8,
 * référence en fin d'objet, identifiant stable par demande et par rang,
 * fil de discussion, adresse de réponse, et `Auto-Submitted` pour qu'aucun
 * répondeur d'absence ne réponde au site (RFC 3834).
 */
export function composerCourriel(
  courriel: CourrielSortant,
  expediteur: IdentiteExpediteur,
): SendMailOptions {
  const objet = courriel.objet.replace(RETOURS_A_LA_LIGNE, ' ').trim()
  const options: SendMailOptions = {
    from:
      expediteur.nom === null
        ? expediteur.adresse
        : { name: expediteur.nom, address: expediteur.adresse },
    to: courriel.destinataire,
    subject: objet,
    text: courriel.texte,
    headers: { 'Auto-Submitted': 'auto-generated' },
  }
  if (expediteur.repondreA !== null && expediteur.repondreA !== expediteur.adresse) {
    options.replyTo = expediteur.repondreA
  }
  const { fil } = courriel
  if (fil === undefined) return options
  const domaine = domaineDe(expediteur.adresse)
  options.subject = objetAvecReference(objet, fil.reference)
  options.messageId = identifiantMessage(fil.reference, fil.rang, domaine)
  if (fil.rang > RANG_PREMIER_MESSAGE) {
    const premier = identifiantMessage(fil.reference, RANG_PREMIER_MESSAGE, domaine)
    options.inReplyTo = premier
    options.references = premier
  }
  return options
}
