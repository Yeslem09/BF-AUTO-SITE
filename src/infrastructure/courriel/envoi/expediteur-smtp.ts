import nodemailer, { type SendMailOptions } from 'nodemailer'
import { ErreurConnecteur } from '../../erreurs.js'
import { estHoteLocal } from '../../reseau.js'
import { diagnostiquerCourriel, type ContexteDiagnostic } from '../diagnostic.js'
import type { ReglagesSmtp } from '../reglages.js'
import { composerCourriel } from './composer.js'
import type { ExpediteurCourriel } from './ports.js'

/** Délais courts : une demande n'attend pas un serveur muet, la file de renvoi reprendra (BC-13). */
export const DELAIS_SMTP = { connexionMs: 10_000, envoiMs: 20_000 } as const
const VERSION_TLS_MINIMALE = 'TLSv1.2' as const

/** Ce que l'expéditeur attend d'un transport : nodemailer, ou une doublure de test. */
export interface TransportSmtp {
  sendMail(options: SendMailOptions): Promise<{
    readonly messageId: string
    readonly rejected?: readonly unknown[]
  }>
  verify(): Promise<unknown>
}

/**
 * Options du transport : TLS direct si `securise`, sinon STARTTLS exigé
 * (le mot de passe ne circule jamais en clair), sauf vers la machine elle-même.
 */
export function optionsTransportSmtp(reglages: ReglagesSmtp) {
  const { hote, port, securise } = reglages.serveur
  return {
    host: hote,
    port,
    secure: securise,
    requireTLS: !securise && !estHoteLocal(hote),
    tls: { servername: hote, minVersion: VERSION_TLS_MINIMALE },
    connectionTimeout: DELAIS_SMTP.connexionMs,
    greetingTimeout: DELAIS_SMTP.connexionMs,
    socketTimeout: DELAIS_SMTP.envoiMs,
    ...(reglages.utilisateur !== null && reglages.motDePasse !== null
      ? { auth: { user: reglages.utilisateur, pass: reglages.motDePasse } }
      : {}),
  }
}

export function creerExpediteurSmtp(
  reglages: ReglagesSmtp,
  transport: TransportSmtp = nodemailer.createTransport(optionsTransportSmtp(reglages)),
): ExpediteurCourriel {
  const contexte: ContexteDiagnostic = {
    protocole: 'SMTP',
    fournisseur: reglages.fournisseur,
    serveur: reglages.serveur,
  }
  const identite = {
    adresse: reglages.expediteur,
    nom: reglages.nomExpediteur,
    repondreA: reglages.repondreA,
  }
  return {
    canal: 'smtp',
    async envoyer(courriel) {
      const options = composerCourriel(courriel, identite)
      let remise: Awaited<ReturnType<TransportSmtp['sendMail']>>
      try {
        remise = await transport.sendMail(options)
      } catch (erreur) {
        throw diagnostiquerCourriel(erreur, contexte)
      }
      if (remise.rejected !== undefined && remise.rejected.length > 0) {
        throw new ErreurConnecteur(
          'Envoi de courriel (SMTP)',
          'refus',
          `Destinataire refusé par le serveur : ${courriel.destinataire}`,
          'Vérifiez l’adresse du destinataire (COURRIEL_GARAGE pour les notifications).',
        )
      }
      return { identifiantMessage: remise.messageId }
    },
    async verifier() {
      try {
        await transport.verify()
      } catch (erreur) {
        throw diagnostiquerCourriel(erreur, contexte)
      }
    },
  }
}
