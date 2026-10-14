/**
 * Messages d'essai au format brut (RFC 5322), reproduisant la structure des
 * réponses de Gmail, Outlook et Apple Mail et des rapports de non-remise de
 * Gmail, Postfix et Exchange. Adresses du domaine réservé `.test` ou de Gmail
 * d'essai ; aucune donnée réelle.
 */

export const REFERENCE_ESSAI = 'BF-7K3Q9D'
export const BOITE_GARAGE = 'garage.essai@gmail.com'
export const IDENTIFIANT_NOTIFICATION = `<${REFERENCE_ESSAI}.1@gmail.com>`
export const OBJET_NOTIFICATION = `Ne roulez pas : rappel de Julie, 06 12 34 56 78 [${REFERENCE_ESSAI}]`
const DATE_ESSAI = 'Wed, 23 Sep 2026 10:14:00 +0200'
const RESULTATS_GMAIL =
  'mx.google.com; dkim=pass header.i=@gmail.com; spf=pass smtp.mailfrom=garage.essai@gmail.com; dmarc=pass (p=NONE) header.from=gmail.com'

const joindre = (lignes: readonly string[]): string => `${lignes.join('\r\n')}\r\n`

interface EnTetesEssai {
  readonly de?: string
  readonly objet?: string
  readonly identifiant?: string
  readonly enReponseA?: string | null
  readonly autres?: readonly string[]
}

function entetes(options: EnTetesEssai, typeContenu: string): string[] {
  const lignes = [
    `From: ${options.de ?? BOITE_GARAGE}`,
    `To: ${BOITE_GARAGE}`,
    `Subject: ${options.objet ?? `Re: ${OBJET_NOTIFICATION}`}`,
    `Date: ${DATE_ESSAI}`,
    `Message-ID: ${options.identifiant ?? '<CAreponse001@mail.gmail.com>'}`,
    'MIME-Version: 1.0',
    ...(options.autres ?? []),
  ]
  const enReponseA =
    options.enReponseA === undefined ? IDENTIFIANT_NOTIFICATION : options.enReponseA
  if (enReponseA !== null) lignes.push(`In-Reply-To: ${enReponseA}`, `References: ${enReponseA}`)
  lignes.push(`Content-Type: ${typeContenu}`)
  return lignes
}

function alternative(options: EnTetesEssai, texte: string | null, html: string | null): string {
  const frontiere = 'frontiere-alternative'
  const parties: string[] = []
  if (texte !== null) {
    parties.push(
      `--${frontiere}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      texte,
    )
  }
  if (html !== null) {
    parties.push(
      `--${frontiere}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
    )
  }
  return joindre([
    ...entetes(options, `multipart/alternative; boundary="${frontiere}"`),
    '',
    ...parties,
    `--${frontiere}--`,
  ])
}

/** Réponse Gmail : texte au-dessus, attribution coupée sur deux lignes, citation en « > ». */
export function reponseGmail(
  reponse: string,
  parties: 'texte-et-html' | 'html' = 'texte-et-html',
): string {
  const texte = [
    reponse,
    '',
    'Le mer. 23 sept. 2026 à 10:12, BF Auto <',
    `${BOITE_GARAGE}> a écrit :`,
    '',
    '> Ne roulez pas : appelez-nous.',
    '> Prénom : Julie',
  ].join('\r\n')
  const html = [
    `<div dir="ltr">${reponse}</div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">`,
    `Le mer. 23 sept. 2026 à 10:12, BF Auto &lt;${BOITE_GARAGE}&gt; a écrit&nbsp;:<br></div>`,
    '<blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex">Ne roulez pas : appelez-nous.<br>Prénom : Julie</blockquote></div>',
  ].join('\r\n')
  return alternative(
    { autres: [`Authentication-Results: ${RESULTATS_GMAIL}`] },
    parties === 'html' ? null : texte,
    html,
  )
}

/** Réponse Outlook : séparateur de soulignés, bloc « De : ... Envoyé : ... ». */
export function reponseOutlook(
  reponse: string,
  parties: 'texte-et-html' | 'html' = 'texte-et-html',
): string {
  const texte = [
    reponse,
    '',
    '________________________________',
    `De : BF Auto <${BOITE_GARAGE}>`,
    'Envoyé : mercredi 23 septembre 2026 10:12',
    `À : ${BOITE_GARAGE}`,
    `Objet : ${OBJET_NOTIFICATION}`,
    '',
    'Ne roulez pas : appelez-nous.',
  ].join('\r\n')
  const html = [
    '<html><head><style>p.MsoNormal{margin:0}</style></head><body>',
    `<div class="WordSection1"><p class="MsoNormal">${reponse}<o:p></o:p></p></div>`,
    '<div id="divRplyFwdMsg" dir="ltr"><font face="Calibri"><b>De :</b> BF Auto<br>',
    '<b>Envoyé :</b> mercredi 23 septembre 2026 10:12</font></div>',
    '<div>Ne roulez pas : appelez-nous.</div></body></html>',
  ].join('\r\n')
  return alternative(
    { objet: `RE: ${OBJET_NOTIFICATION}`, identifiant: '<AM0PR01MB0001@outlook.com>' },
    parties === 'html' ? null : texte,
    html,
  )
}

/** Réponse Apple Mail sur iPhone : signature « Envoyé de mon iPhone », citation en « > ». */
export function reponseAppleMail(
  reponse: string,
  parties: 'texte-et-html' | 'html' = 'texte-et-html',
): string {
  const texte = [
    reponse,
    '',
    'Envoyé de mon iPhone',
    '',
    `> Le 23 sept. 2026 à 10:12, BF Auto <${BOITE_GARAGE}> a écrit :`,
    '> ',
    '> Ne roulez pas : appelez-nous.',
  ].join('\r\n')
  const html = [
    '<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head>',
    `<body dir="auto">${reponse}<br><br><div dir="ltr">Envoyé de mon iPhone</div>`,
    `<div dir="ltr"><br><blockquote type="cite">Le 23 sept. 2026 à 10:12, BF Auto a écrit&nbsp;:<br><br>`,
    'Ne roulez pas : appelez-nous.</blockquote></div></body></html>',
  ].join('\r\n')
  return alternative(
    { identifiant: '<5E1F-ABCD@icloud.com>' },
    parties === 'html' ? null : texte,
    html,
  )
}

/** Réponse en texte seul, sans citation (client minimal, ou citation supprimée à la main). */
export function reponseTexteSeul(reponse: string, options: EnTetesEssai = {}): string {
  return joindre([
    ...entetes(options, 'text/plain; charset="UTF-8"'),
    'Content-Transfer-Encoding: 8bit',
    '',
    reponse,
  ])
}

/** Répondeur d'absence de Gmail, qui reprend l'objet et donc la référence. */
export function reponseAutomatique(): string {
  return reponseTexteSeul('Je suis absent jusqu’au 30 septembre.', {
    objet: `Réponse automatique : ${OBJET_NOTIFICATION}`,
    autres: ['Auto-Submitted: auto-replied'],
  })
}

/** La notification du site elle-même, arrivée dans la boîte du garage (il s'écrit à lui-même). */
export function notificationDuSite(): string {
  return reponseTexteSeul('Ne roulez pas : appelez-nous.', {
    objet: OBJET_NOTIFICATION,
    identifiant: IDENTIFIANT_NOTIFICATION,
    enReponseA: null,
    autres: ['Auto-Submitted: auto-generated'],
  })
}

/** Courriel ordinaire d'un client, sans référence : il ne doit jamais être lu. */
export function courrielClient(): string {
  return reponseTexteSeul('Bonjour, avez-vous des pneus 205/55 R16 ? Merci.', {
    de: 'client.essai@exemple.test',
    objet: 'Devis pneus',
    identifiant: '<client-001@exemple.test>',
    enReponseA: null,
  })
}

interface RapportEssai {
  readonly de: string
  readonly objet: string
  readonly action: 'failed' | 'delayed'
  readonly statut: string
  readonly diagnostic: string
  readonly destinataire: string
  /** Identifiant et objet du message d'origine. */
  readonly original: { readonly identifiant: string; readonly objet: string }
  /** `message/rfc822` (Postfix, Exchange) ou `text/rfc822-headers` (Gmail). */
  readonly forme: 'message/rfc822' | 'text/rfc822-headers'
  readonly autres?: readonly string[]
}

function rapport(options: RapportEssai): string {
  const frontiere = 'frontiere-rapport'
  const enTetesOriginal = [
    `From: BF Auto <${BOITE_GARAGE}>`,
    `To: ${options.destinataire}`,
    `Subject: ${options.original.objet}`,
    `Message-ID: ${options.original.identifiant}`,
    'Date: Wed, 23 Sep 2026 10:12:00 +0200',
  ]
  const original =
    options.forme === 'message/rfc822'
      ? [
          ...enTetesOriginal,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          'Ne roulez pas : appelez-nous.',
        ]
      : enTetesOriginal
  return joindre([
    `From: ${options.de}`,
    `To: ${BOITE_GARAGE}`,
    `Subject: ${options.objet}`,
    `Date: ${DATE_ESSAI}`,
    'Message-ID: <rapport-001@mx.exemple.test>',
    'MIME-Version: 1.0',
    'Auto-Submitted: auto-replied',
    ...(options.autres ?? []),
    `Content-Type: multipart/report; report-type=delivery-status; boundary="${frontiere}"`,
    '',
    `--${frontiere}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    'Votre message n’a pas pu être remis.',
    '',
    `--${frontiere}`,
    'Content-Type: message/delivery-status',
    '',
    'Reporting-MTA: dns; mx.exemple.test',
    '',
    `Final-Recipient: rfc822; ${options.destinataire}`,
    `Action: ${options.action}`,
    `Status: ${options.statut}`,
    `Diagnostic-Code: smtp; ${options.diagnostic}`,
    '',
    `--${frontiere}`,
    `Content-Type: ${options.forme}`,
    '',
    ...original,
    '',
    `--${frontiere}--`,
  ])
}

export function nonRemiseGmail(): string {
  return rapport({
    de: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>',
    objet: 'Delivery Status Notification (Failure)',
    action: 'failed',
    statut: '5.1.1',
    diagnostic:
      "550-5.1.1 The email account that you tried to reach does not exist.\r\n    Please try double-checking the recipient's email address.",
    destinataire: 'atelier.inconnu@exemple.test',
    original: { identifiant: IDENTIFIANT_NOTIFICATION, objet: OBJET_NOTIFICATION },
    forme: 'text/rfc822-headers',
    autres: ['X-Failed-Recipients: atelier.inconnu@exemple.test'],
  })
}

export function nonRemisePostfix(action: 'failed' | 'delayed' = 'failed'): string {
  return rapport({
    de: 'MAILER-DAEMON@mx.exemple.test (Mail Delivery System)',
    objet:
      action === 'failed'
        ? 'Undelivered Mail Returned to Sender'
        : 'Delayed Mail (still being retried)',
    action,
    statut: action === 'failed' ? '5.2.2' : '4.4.1',
    diagnostic: action === 'failed' ? '552 5.2.2 Mailbox full' : '421 4.4.1 Connection timed out',
    destinataire: 'atelier@exemple.test',
    original: { identifiant: `<${REFERENCE_ESSAI}.2@gmail.com>`, objet: OBJET_NOTIFICATION },
    forme: 'message/rfc822',
  })
}

export function nonRemiseExchange(): string {
  return rapport({
    de: 'postmaster@outlook.com',
    objet: `Non remis : ${OBJET_NOTIFICATION}`,
    action: 'failed',
    statut: '5.1.10',
    diagnostic:
      '550 5.1.10 RESOLVER.ADR.RecipientNotFound; Recipient not found by SMTP address lookup',
    destinataire: 'atelier@exemple.test',
    original: { identifiant: '<AM0PR-sans-reference@outlook.com>', objet: OBJET_NOTIFICATION },
    forme: 'message/rfc822',
  })
}

/** Rapport qui concerne un courriel du garage à un client, pas un message du site. */
export function nonRemiseEtrangere(): string {
  return rapport({
    de: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>',
    objet: 'Delivery Status Notification (Failure)',
    action: 'failed',
    statut: '5.1.1',
    diagnostic: '550 5.1.1 User unknown',
    destinataire: 'client.essai@exemple.test',
    original: { identifiant: '<CAdevis001@mail.gmail.com>', objet: 'Votre devis pneus' },
    forme: 'text/rfc822-headers',
  })
}
