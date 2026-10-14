# Analyse Kano : connecteurs courriel et SMS

Version 1 du 2026-09-23, écrite avant tout code des connecteurs. Elle complète
`kano-site-bf-auto.md` (D5 notification du garagiste, D9 aucun traceur, D11 exploitation,
D13 domaine et authentification des courriels) sans le contredire : ce qui y est tranché
reste tranché ici. À mettre à jour après chaque phase (tableaux « État appliqué » et
« Anomalies »). Toute donnée non confirmée reste marquée `[À VALIDER : ...]`.

Demande d'Anthony (2026-09-23) : « mets les connecteurs IMAP, etc., pour que ce soit
fonctionnel dès le début ». Décisions d'Anthony relayées par l'orchestrateur le même jour :
le garage utilise une boîte **Gmail** (préréglage par défaut, cas le mieux testé, pas à pas
Gmail en tête de la documentation d'exploitation) ; le **SMS au garagiste pour les demandes
« Ne roulez pas » est voulu**, actif dès que les identifiants du fournisseur sont fournis,
destinataire par défaut le portable du garage (06 05 92 28 38), surchargeable par variable.

## Verdict

1. Le site envoie ses courriels par la boîte Gmail du garage, avec un mot de passe d'application de 16 lettres : l'adresse et ce mot de passe suffisent, tout le reste vient du préréglage. Dix autres préréglages (Google Workspace, Outlook.com, Microsoft 365, Orange, Free, SFR, OVH, Ionos, Brevo, serveur personnalisé) disent ce qui marche et ce qui ne marche plus, au lieu de laisser chercher.
2. Une configuration mal formée empêche le démarrage et liste toutes ses fautes, avec le remède ; une panne du fournisseur au démarrage ne l'empêche jamais (le site doit continuer à recevoir des demandes, gardées en file de renvoi), mais elle s'écrit en clair dans le journal et fait répondre `/sante` en 503.
3. La lecture IMAP sert deux choses, et deux seulement : la réponse « fait », « rappelé » ou « traité » du garagiste au courriel de notification, qui range la demande « Traitée » sans qu'il se connecte ; le rapport de non-remise, qui rend visible un courriel jamais arrivé. La boîte est ouverte en lecture seule : aucun message n'est marqué, déplacé ni supprimé, et le contenu d'un message qui ne concerne pas une demande n'est jamais téléchargé.
4. Une demande « Ne roulez pas » part aussi par SMS (OVH SMS ou Brevo), écrit dans l'alphabet GSM pour tenir en un seul SMS facturé ; sans identifiants, le SMS est désactivé et le courriel reste le canal.
5. Deux commandes, `pnpm courriel:tester` et `pnpm sms:tester`, prouvent en une minute que les canaux marchent, et disent en français la cause et le remède d'un échec.
6. On refuse : courriel automatique au client, lecture de la boîte hors références, mot de passe dans le dépôt, en base ou dans un journal, réponse automatique du site au garagiste, service payant obligatoire, authentification OAuth2 en version 1.

## Sources opposables

| Source | Opposable pour |
|---|---|
| `docs/conception/kano-site-bf-auto.md` | D5 (canal lu dans la journée, message suffisant, file de renvoi à 1 min, 10 min, 1 h, `/sante` en 503 après une heure d'échec, relance « Ne roulez pas »), D8 (canal bloquant), D9 (aucune ressource tierce, aucun traceur), D11 (sonde, Render, région Francfort), D12 (port `Notificateur`, adaptateurs SMS, courriel, console), D13 (courriel du domaine avec SPF, DKIM, DMARC), B-24, P-14, AE-40, AE-41, US-16, US-50 |
| Décisions d'Anthony du 2026-09-23 (relais de l'orchestrateur) | Boîte Gmail, SMS « Ne roulez pas », destinataire par défaut |
| Google, mots de passe d'application : https://support.google.com/accounts/answer/185833 | 16 caractères, validation en deux étapes obligatoire |
| Google, limites d'envoi Gmail : https://support.google.com/mail/answer/22839 et Workspace : https://support.google.com/a/answer/166852 | 500 messages par jour (compte personnel), 2 000 (Workspace), reprise sous 1 à 24 heures |
| Microsoft, fin du mot de passe sur Outlook.com : https://support.microsoft.com/fr-fr/office/modern-authentication-methods-now-needed-to-continue-syncing-outlook-email-in-non-microsoft-email-apps-c5d65390-9676-4763-b41f-d7986499a90d | Depuis le 16/09/2024, Outlook.com, Hotmail et Live refusent IMAP et SMTP par mot de passe |
| Microsoft, calendrier SMTP AUTH d'Exchange Online (janvier 2026) : https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835 | SMTP par mot de passe inchangé jusqu'à fin décembre 2026, puis désactivé par défaut sur les locataires existants, réactivable par l'administrateur ; IMAP par mot de passe coupé depuis 2022 |
| Render, ports SMTP : https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports | Ports 25, 465 et 587 fermés en sortie sur l'offre gratuite ; 465 et 587 ouverts sur une instance payante, 25 fermé partout |
| Brevo, SMS transactionnel : https://developers.brevo.com/docs/transactional-sms-endpoints | `POST /v3/transactionalSMS/send`, en-tête `api-key`, `sender` de 11 caractères alphanumériques au plus, réponse 201 |
| OVHcloud, API SMS : https://docs.ovhcloud.com/en/guides/web-cloud/messaging/sms/send-sms-api-java | `POST /1.0/sms/{service}/jobs`, signature `$1$` + SHA-1, `senderForResponse`, `noStopClause`, réponse `ids`, `invalidReceivers` |
| RFC 3834 (`Auto-Submitted`), RFC 3464 (rapports de non-remise), RFC 5322 (`Message-ID`, `In-Reply-To`, `References`), 3GPP TS 23.038 (alphabet GSM) | Formats d'en-têtes et de rapports, segmentation des SMS |

## Personas

- **P4, le garagiste** (Kano principal) : il lit sa boîte Gmail sur son téléphone, entre deux interventions ; il répond d'un mot quand il a rappelé ; il ne se connectera à l'espace garagiste que s'il le faut.
- **P1, l'automobiliste inquiet** : sa demande « Ne roulez pas » doit être lue vite ; un courriel perdu le laisse sans appel.
- **E, Anthony, exploitant** : il configure les variables sur Render, lance les commandes de test, reçoit l'alerte de la sonde. Il n'a ni le temps ni l'envie de lire la documentation d'un fournisseur pour trouver un port.

## Décisions structurantes

### C1. Fournisseurs et préréglages

**Décision.** `COURRIEL_FOURNISSEUR` choisit un préréglage ; absent, c'est **Gmail**, sauf si
`SMTP_HOTE` est défini : c'est alors le fournisseur dont c'est le serveur (`smtp.gmail.com`
vaut Gmail, lecture comprise), à défaut un serveur personnalisé, ce qui garde valable la
configuration actuelle du site. Le préréglage fixe hôtes, ports et chiffrement ; chaque valeur reste surchargeable
par sa variable (`SMTP_HOTE`, `SMTP_PORT`, `SMTP_SECURISE`, `IMAP_*`).

| Préréglage | Envoi | Lecture | Règle propre |
|---|---|---|---|
| `gmail` (défaut) | smtp.gmail.com, 465, TLS direct (587 STARTTLS admis) | imap.gmail.com, 993, TLS | Mot de passe d'application de 16 lettres exigé, validation en deux étapes active ; expéditeur = l'adresse Gmail elle-même sauf alias vérifié ; 500 messages par jour |
| `google-workspace` | smtp.gmail.com, 465, TLS | imap.gmail.com, 993, TLS | Même règle ; 2 000 messages par jour ; l'administrateur peut interdire les mots de passe d'application ou IMAP |
| `outlook` (Outlook.com, Hotmail, Live) | refusé | refusé | Mot de passe refusé par Microsoft depuis le 16/09/2024 : la configuration échoue et conseille Gmail ou Brevo |
| `microsoft-365` | smtp.office365.com, 587, STARTTLS | aucune | SMTP par mot de passe seulement si l'administrateur l'active (désactivé par défaut fin décembre 2026) ; IMAP par mot de passe coupé par Microsoft : lecture désactivée, avertissement |
| `orange` | smtp.orange.fr, 465, TLS | imap.orange.fr, 993, TLS | Identifiant = adresse complète `[À VALIDER : identifiant et mot de passe propres à la messagerie Orange]` |
| `free` | smtp.free.fr, 465, TLS | imap.free.fr, 993, TLS | `[À VALIDER : identifiant (adresse complète ou partie avant @)]` |
| `sfr` | smtp.sfr.fr, 465, TLS | imap.sfr.fr, 993, TLS | Identifiant = adresse complète |
| `ovh` (MX Plan) | ssl0.ovh.net, 465, TLS | ssl0.ovh.net, 993, TLS | Offre Email Pro ou Exchange : surcharger `SMTP_HOTE` et `IMAP_HOTE` |
| `ionos` | smtp.ionos.fr, 465, TLS | imap.ionos.fr, 993, TLS | |
| `brevo` | smtp-relay.brevo.com, 587, STARTTLS | aucune (relais d'envoi) | Identifiant et clé SMTP Brevo, expéditeur vérifié chez Brevo ; lecture possible d'une autre boîte par `IMAP_HOTE`, `IMAP_UTILISATEUR`, `IMAP_MOT_DE_PASSE` |
| `personnalise` | `SMTP_HOTE` obligatoire | `IMAP_HOTE` s'il est donné | Identifiants facultatifs (relais local) |

**Motif.** Anthony a tranché Gmail. Un préréglage ramène la configuration à trois variables
(`SMTP_UTILISATEUR`, `SMTP_MOT_DE_PASSE`, `COURRIEL_GARAGE`) ; les fournisseurs courants d'un
petit garage restent couverts pour le jour où la boîte change. Les deux préréglages
Microsoft existent pour **dire pourquoi ils ne marchent pas** : sans eux, on perdrait une
heure sur un mot de passe que Microsoft refuse. L'authentification OAuth2 (seule voie
Microsoft pour IMAP) demanderait une application déclarée chez Microsoft et un jeton
rafraîchi : indifférente tant que la boîte est Gmail (voir « Indifférentes »).

### C2. Où vivent les secrets

**Décision.** Mots de passe, clés et jetons vivent **uniquement dans les variables
d'environnement** : sur Render, dans l'onglet Environment du service ; en local, dans un
fichier `.env` déjà ignoré par git. Jamais dans le dépôt, jamais en base, jamais dans un
journal, un message d'erreur, une page ni la sortie d'une commande : les commandes de test
affichent « défini » à la place. Le mot de passe Gmail est un **mot de passe d'application**,
révocable seul sans toucher au mot de passe du compte ; les espaces de l'affichage de Google
(`abcd efgh ijkl mnop`) sont acceptés et retirés. Le journal du client IMAP est coupé : il
écrirait les commandes échangées.

**Motif.** La boîte du garage contient ses échanges avec ses clients et ses fournisseurs :
son mot de passe principal ne doit jamais quitter le garage. Un mot de passe d'application
se révoque en un geste si le serveur est compromis (AE-C04).

### C3. Ce que porte un courriel envoyé

**Décision.** Texte brut en UTF-8, sans HTML, sans image, sans lien de suivi. En-têtes :
- `From` : l'adresse du compte (Gmail réécrit tout autre expéditeur qui n'est pas un alias vérifié ; la configuration avertit) et un nom facultatif (`SMTP_NOM_EXPEDITEUR`) ;
- `Subject` : l'objet rédigé par le contexte, puis la **référence** entre crochets en fin d'objet, par exemple « Ne roulez pas : rappel de Julie, 06 12 34 56 78 [BF-7K3Q9D] » : l'urgence reste lisible en tête sur un téléphone, et la référence survit au « Re : » de la réponse ;
- `Message-ID` **stable** : `<BF-7K3Q9D.1@domaine-de-l-expediteur>` pour le premier message d'une demande, `.2` pour la relance ; un renvoi après un échec douteux (serveur qui a accepté puis coupé) reprend le même identifiant et ne crée pas de doublon chez Gmail, qui fusionne les identifiants égaux ;
- `In-Reply-To` et `References` vers le premier message pour la relance : les deux messages se suivent dans le même fil ;
- `Reply-To` : `SMTP_REPONDRE_A`, à défaut l'adresse de la boîte lue par IMAP quand elle diffère de l'expéditeur ; sinon rien (la réponse va à l'expéditeur, qui est la boîte lue) ;
- `Auto-Submitted: auto-generated` (RFC 3834) : un répondeur d'absence ne répond pas au site, aucune boucle.

**Référence** : `BF-` suivi de 6 caractères de l'alphabet de Crockford (chiffres et lettres
sans I, L, O ni U), tirés au hasard par le générateur cryptographique : environ un milliard
de valeurs, **ni séquentielle ni devinable** (AE-40, AE-C09), lisible au téléphone sans
confusion entre 0 et O ou 1 et I.

**Chiffrement** : TLS direct ou STARTTLS **exigé** vers tout serveur distant ; seul un relais
sur la machine elle-même (127.0.0.1, ::1, localhost) peut s'en passer. Délais bornés :
connexion 10 s, envoi 20 s (valeurs actuelles du contexte demandes, reprises).

**Motif.** Le texte brut se lit partout et ne déclenche aucun filtre ; la référence et le
`Message-ID` relient une réponse ou un rapport de non-remise à sa demande sans rien lire
d'autre ; le renvoi de D5 ne doit jamais faire recevoir deux fois la même urgence.

### C4. Vérification au démarrage et état de santé

**Décision.**
- **Configuration** : lue et validée au démarrage, toutes les fautes rassemblées en un message (variable, valeur fautive sans secret, remède). En production, une configuration mal formée **bloque** le démarrage.
- **Connexion** : en production, le démarrage vérifie la connexion SMTP (connexion et authentification, sans envoi) et IMAP (connexion, ouverture du dossier en lecture seule), avec un délai borné. Un échec **ne bloque pas** le démarrage : il est journalisé avec sa cause et son remède, et `/sante` répond 503 tant qu'un envoi ou une vérification n'a pas réussi. La connexion SMTP est vérifiée de nouveau une fois par jour ; la connexion IMAP l'est de fait à chaque relevé, et des relevés en échec depuis plus d'une heure font aussi répondre `/sante` en 503.
- **Développement et démonstration** : sans configuration, les messages s'écrivent en console (convention actuelle) ; aucune vérification réseau.

**Motif.** Un service Render avec disque s'arrête puis redémarre à chaque déploiement (D11) :
refuser de démarrer sur une panne passagère de Gmail couperait le site pour tous les
visiteurs, pire que la panne elle-même (AE-C06). À l'inverse, un mot de passe révoqué ne se
verrait qu'à la première demande, peut-être dans deux jours : le garage croirait recevoir
des demandes qu'il ne reçoit pas (piège 2). La sonde de D11 transforme ce 503 en alerte à
Anthony sous 15 minutes.

### C5. Lecture IMAP : quoi, pourquoi, et rien d'autre

**Ce qu'on lit, et pourquoi.**
1. **La réponse du garagiste** au courriel de notification ou à sa relance : s'il répond « fait », « rappelé » ou « traité », la demande passe de « À rappeler » à « Traitée », sans connexion ni mot de passe. C'est le geste qu'il fait déjà sur son téléphone ; l'espace garagiste reste la voie normale et le bouton y reste.
2. **Le rapport de non-remise** (courriel revenu en erreur) : la notification de la demande est marquée « non remise », avec le code et le motif du serveur, sur la fiche ; elle compte comme un échec pour `/sante`. Un rapport de retard (« delayed ») n'est qu'une information : il ne change rien.

**Ce qu'on ne lit jamais.** La boîte Gmail du garage est aussi celle de ses clients et de
ses fournisseurs : le site n'en télécharge **aucun** message qui ne porte pas une référence
de demande. Règles, dans cet ordre :
- la boîte est ouverte **en lecture seule** (commande IMAP `EXAMINE`) : aucun drapeau (pas même « lu »), aucun déplacement, aucune suppression, aucune réponse ;
- le serveur trie d'abord : seuls les nouveaux messages dont l'objet contient `BF-`, dont les en-têtes de fil citent un `Message-ID` du site, ou qui viennent du système de messagerie (`MAILER-DAEMON`, `postmaster`, rapport `multipart/report`) sont retenus ;
- pour ceux-là seulement, le site lit les en-têtes (objet, expéditeur, en-têtes de fil, type, structure) et écarte tout message qui ne porte pas exactement une référence ou un `Message-ID` du site ; le **contenu** n'est téléchargé qu'après ce second tri ;
- d'un rapport de non-remise, le site ne lit d'abord que sa structure et les en-têtes du message d'origine qu'il joint (identifiant, objet) ; il ne télécharge le rapport que s'ils désignent un message du site, sinon il l'écarte sans le journaliser ; un message envoyé par le site lui-même (sa propre notification arrivée dans la boîte, puisque le garage s'écrit à lui-même) et une réponse automatique (absence, « Auto-Submitted ») sont écartés ;
- rien du texte n'est conservé : seuls la commande reconnue, l'heure et la référence servent.

**Filigrane.** Le dernier UID traité et l'UIDVALIDITY du dossier sont gardés en base (phase B)
et passés au relevé suivant : rien n'est relu. Au **premier** relevé, le filigrane part de la
fin actuelle du dossier : l'historique n'est jamais parcouru, et un vieux « fait » n'est
jamais appliqué (AE-C08). Si l'UIDVALIDITY change (dossier recréé), le filigrane repart de la
fin, avec un avertissement. Un message illisible fait avancer le filigrane (il est compté, pas
relu en boucle).

**Fréquence.** Relevé toutes les 120 secondes par défaut (`IMAP_INTERVALLE_SECONDES`, de 30 à
3 600), une connexion par relevé, fermée ensuite ; pas de connexion IDLE permanente.

**Commande reconnue.** Le texte de la réponse, **sans la citation** (Gmail, Outlook, Apple
Mail, en texte et en HTML) ni la signature de téléphone (« Envoyé de mon iPhone »...), doit
être **exactement** l'un de ces mots, casse, accents, espaces et ponctuation finale ignorés :
« fait », « faite », « rappelé », « rappelée », « traité », « traitée ». Tout autre texte
(« pas fait », « fait ? », « fait demain », « à rappeler », une phrase) n'est pas une
commande : la demande ne change pas, et la fiche porte « Réponse reçue, non reconnue » avec
l'heure (aucun rejet silencieux, AE-35). Le site ne répond jamais au garagiste (AE-C05).

**Qui peut commander.** La commande n'est appliquée que si (phase B) : la référence désigne
une demande existante ; l'expéditeur est l'adresse du garage (`COURRIEL_GARAGE`) ou celle de
la boîte ; le premier en-tête `Authentication-Results` (celui du serveur de réception, les
suivants pouvant être forgés), s'il existe, ne signale pas d'échec d'authentification :
DMARC fait foi, à défaut DKIM et SPF. La commande ne fait que ranger : elle ne supprime
rien et le bouton de l'espace la défait.

**Motif.** Le garagiste ne se connectera pas après chaque rappel (P4, pièges 1 et 3) ; un mot
en réponse à son courriel est le seul geste qu'il fera, et c'est facultatif : rien n'en
dépend (AE-34). Un courriel refusé par le serveur du destinataire est un échec que le seul
« envoyé » de SMTP cache : « envoyé » n'est pas « remis » (AE-C07). La lecture seule et le
double tri sont la seule façon honnête de lire la boîte principale du garage.

### C6. SMS au garagiste

**Décision.**
- **Quand** : à la réception d'une demande de niveau « Ne roulez pas », en plus du courriel, et pour la relance unique de D5 ; jamais plus de deux SMS par demande ; aucun SMS pour les autres demandes.
- **Quoi** (rédigé en phase B) : l'urgence, le prénom, le téléphone du client composable, le moment où il peut répondre, la référence ; pas de lien (une adresse longue fait passer à deux SMS, et le détail est dans le courriel). Le texte est converti dans l'**alphabet GSM** : apostrophes et guillemets typographiques, espaces insécables et points de suspension remplacés, lettres accentuées hors alphabet GSM ramenées à leur lettre de base (« fenêtre » devient « fenetre »), ce qui garde le tarif d'un SMS ; au-delà de deux SMS, l'envoi est refusé (erreur de rédaction, gardée par un test).
- **Fournisseurs** : OVH SMS (recommandé : société française, pas d'expéditeur à déclarer grâce au numéro court de réponse), Brevo (société française, crédits SMS prépayés), console (développement). Coût indicatif de l'ordre de quelques centimes d'euro par SMS en France `[À VALIDER : tarif au jour de la souscription, pack minimal, TVA]`.
- **Activation** : dès que les identifiants d'un fournisseur sont fournis (`SMS_OVH_*` ou `SMS_BREVO_*`) ; `SMS_FOURNISSEUR` n'est nécessaire que pour forcer la console ou lever une ambiguïté (identifiants des deux fournisseurs : configuration refusée). Sans identifiant : SMS désactivé, le courriel reste le canal. Identifiants incomplets : configuration refusée, variable manquante nommée.
- **Destinataire** : `SMS_DESTINATAIRE`, à défaut le téléphone de `donnees/garage.json` (06 05 92 28 38, source unique de l'identité) ; un numéro fixe français est refusé (un SMS n'y arrive pas).
- **Échec** : un SMS en échec ne retarde ni n'annule le courriel ; il suit la même file de renvoi (phase B). `pnpm sms:tester` affiche les crédits restants.

**Motif.** Rien n'établit que le garagiste lit ses courriels dans la journée (P4) ; il lit ses
SMS entre deux interventions (P-16). Réservé à « Ne roulez pas », le SMS garde sa valeur
d'alerte et son coût reste marginal. Une apostrophe typographique fait passer tout le
message en Unicode (70 caractères par SMS au lieu de 160) : le coût triplerait sans que
personne le voie (AE-C12).

### C7. Commandes d'exploitation

- `pnpm courriel:tester` : affiche la configuration résolue sans secret (fournisseur, serveurs, utilisateur, expéditeur, « mot de passe : défini »), vérifie la connexion SMTP puis IMAP, liste les messages référencés des 7 derniers jours (date, expéditeur, référence, nature, commande reconnue ou non) **sans les marquer ni afficher leur texte**. `--envoyer <adresse>` envoie en plus un courriel d'essai référencé et dit comment tester la réponse « fait » ; `--jours <n>` (1 à 90) règle la période. Code de sortie : 0 tout va bien, 1 un contrôle a échoué, 2 usage ou configuration invalide.
- `pnpm sms:tester` : affiche la configuration SMS sans secret, vérifie les identifiants auprès du fournisseur et les crédits restants ; `--envoyer [numéro]` envoie un SMS d'essai (au destinataire configuré par défaut). Mêmes codes de sortie.

### C8. Où vit le code

`src/infrastructure/` : connecteurs techniques partagés, **hors contextes**, sans domaine
métier. `courriel/` (préréglages, envoi SMTP, lecture IMAP, référence, diagnostic), `sms/`
(OVH, Brevo, console), la lecture typée de leurs variables et les deux commandes. Seuls les
adaptateurs des contextes, leur `module.ts` et la racine de composition peuvent l'importer ;
l'infrastructure n'importe aucun contexte ni la couche web (règles dependency-cruiser vues
rouges par injection). Ports offerts : `ExpediteurCourriel`, `BoiteDeReception`, `EnvoiSms`,
chacun avec un adaptateur réel, un adaptateur console ou mémoire pour les tests et le
développement.

## Basiques

| Id | Attribut | Justification |
|---|---|---|
| BC-01 | Gmail marche avec l'adresse et le mot de passe d'application seulement | Choix d'Anthony ; trois variables au plus |
| BC-02 | TLS exigé vers tout serveur distant | Le mot de passe ne circule jamais en clair |
| BC-03 | Secrets hors dépôt, hors base, jamais affichés ni journalisés | C2 ; boîte principale du garage |
| BC-04 | Configuration invalide : démarrage refusé, toutes les fautes et leur remède d'un coup | Un déploiement raté se corrige en une passe |
| BC-05 | Panne du fournisseur visible (journal, `/sante` en 503) sans couper le site | C4 ; piège 2 |
| BC-06 | Aucune lecture hors références ; boîte en lecture seule | C5 |
| BC-07 | Un renvoi ne crée pas de doublon chez le destinataire | `Message-ID` stable (C3) |
| BC-08 | Messages en texte brut UTF-8 | Lisibles sur tout téléphone |
| BC-09 | Aucune boucle avec les répondeurs | `Auto-Submitted` envoyé, réponses automatiques écartées |
| BC-10 | SMS désactivé sans identifiants ; identifiants incomplets refusés en nommant le manque | Aucun rejet silencieux |
| BC-11 | Un test d'envoi en une commande | Anthony vérifie sans lire de code |
| BC-12 | Aucun service payant obligatoire | Gmail gratuit, SMS facultatif |
| BC-13 | Délais bornés partout (SMTP 10 s et 20 s, IMAP 10 s et 30 s, HTTP SMS 10 s) | Une demande n'attend jamais un serveur muet |

## Performance

| Id | Attribut | Cible chiffrée mesurable |
|---|---|---|
| PC-01 | Remise au serveur d'envoi | ≤ 60 s après l'enregistrement de la demande, p95 (reprend P-14) |
| PC-02 | Prise en compte d'une réponse « fait » | ≤ intervalle de relevé + 30 s après sa réception (2 min 30 par défaut) |
| PC-03 | Sobriété de la lecture | 0 contenu téléchargé pour un message non référencé (test de l'adaptateur) ; 1 connexion IMAP au plus à la fois, fermée après chaque relevé |
| PC-04 | Coût SMS | 1 SMS (160 caractères GSM) pour le message type ; 2 au plus par message ; 2 messages au plus par demande |
| PC-05 | Diagnostic | 100 % des échecs classés parmi 7 natures (identifiants, injoignable, délai, certificat, refus, configuration, autre), chacune avec un remède en français, propre au fournisseur pour les identifiants |
| PC-06 | Détection d'une non-remise | ≤ intervalle de relevé après l'arrivée du rapport |
| PC-07 | Durée de `courriel:tester` | ≤ 60 s de bout en bout, bornée par les délais |

## Attractives

### AT-C1. « Répondez fait » (attractive phare)

- **Gisement** : geste existant (répondre d'un mot sur son téléphone) ; couture entre la notification et l'espace garagiste.
- **Ce que c'est** : le garagiste répond « fait » au courriel de la demande ; deux minutes plus tard, elle est rangée « Traitée ».
- **Pourquoi ça surprend** : aucun outil de garage observé ne se pilote par une réponse de courriel ; il n'a rien à apprendre.
- **Crédibilité** : lecture seule, double tri, référence non devinable, expéditeur vérifié (C5) ; facultatif, rien n'en dépend.

### AT-C2. Le courriel qui n'arrive pas devient visible

- **Ce que c'est** : une adresse du garage mal tapée ou une boîte pleine renvoie un rapport ; la fiche porte « Notification non remise : boîte pleine (552) » et la sonde alerte Anthony.
- **Pourquoi ça surprend** : partout ailleurs, « envoyé » vaut « reçu ».

### AT-C3. Le diagnostic qui dit quoi faire

- **Ce que c'est** : « Gmail refuse l'identifiant ou le mot de passe : créez un mot de passe d'application (validation en deux étapes activée) sur https://myaccount.google.com/apppasswords et collez les 16 lettres dans SMTP_MOT_DE_PASSE. »
- **Pourquoi ça surprend** : les bibliothèques répondent « 535-5.7.8 Username and Password not accepted ».

### AT-C4. Les crédits SMS visibles

- **Ce que c'est** : `pnpm sms:tester` affiche « Crédits restants : 97 » ; un compte vide se voit avant la panne.

### Notation (1 à 5 par axe)

| Attractive | Désirabilité | Ancrage | Faisabilité | Coût marginal | Démontrabilité | Total |
|---|---|---|---|---|---|---|
| AT-C1 Répondez fait | 5 | 4 | 4 | 4 | 5 | **22** |
| AT-C2 Non-remise visible | 4 | 4 | 4 | 4 | 4 | 20 |
| AT-C3 Diagnostic qui dit quoi faire | 3 | 5 | 5 | 5 | 4 | 22 |
| AT-C4 Crédits SMS visibles | 3 | 4 | 5 | 5 | 3 | 20 |

**Attractive phare : AT-C1**, à égalité de points avec AT-C3 mais seule à servir le
garagiste lui-même ; AT-C3 sert l'exploitant.

## Indifférentes

| Attribut | Motif |
|---|---|
| OAuth2 (Google, Microsoft) | Gmail accepte le mot de passe d'application ; OAuth2 impose une application déclarée et un jeton rafraîchi. Rouvert si la boîte passe chez Microsoft |
| Connexion IMAP permanente (IDLE) | Deux minutes suffisent ; une connexion ouverte en permanence se coupe et se surveille |
| Courriel en HTML, logo, modèle graphique | Aucune information de plus, du poids, des filtres |
| API REST de Gmail | Projet Google Cloud et OAuth2 obligatoires |
| Réponse « fait » par SMS | Demande une adresse de rappel publique chez le fournisseur ; différée |
| Accusé de lecture | Le client de messagerie le propose ou le refuse ; aucune fiabilité |
| WhatsApp Business | Service payant, validation Meta ; P-16 le réserve aux garages qui l'utilisent déjà |
| Plusieurs destinataires, listes de diffusion | Un seul garagiste |

## À éviter

| Id | Attribut à éviter | Motif |
|---|---|---|
| AEC-01 | Courriel automatique au client sans son accord | Démarchage (L223-1), minimisation, réputation de la boîte ; le client est rappelé au téléphone (D4) |
| AEC-02 | Lire, marquer, déplacer, archiver ou supprimer un message qui ne porte pas de référence | Boîte principale du garage (C5) |
| AEC-03 | Mot de passe dans le dépôt, en base, dans un journal, une erreur, une page ou une sortie de commande | C2 |
| AEC-04 | Mot de passe principal Gmail à la place d'un mot de passe d'application | Refusé par Google, et irrévocable seul : la configuration le refuse |
| AEC-05 | Réponse automatique du site au garagiste (« commande non comprise ») | Boucle possible, bruit ; la fiche le dit |
| AEC-06 | Démarrage bloqué par une panne du fournisseur | Site coupé pour tous (C4) |
| AEC-07 | Échec d'envoi silencieux ; « envoyé » affiché comme « reçu » | Piège 2 ; C5 |
| AEC-08 | Relire l'historique de la boîte au premier relevé | Vieilles réponses appliquées à tort |
| AEC-09 | Référence séquentielle ou devinable | Commande forgée par un tiers (AE-40) |
| AEC-10 | Commande acceptée d'un autre expéditeur, ou d'un message à l'authentification en échec | Une demande rangée à tort n'est jamais rappelée |
| AEC-11 | Pixel de suivi ou lien de redirection dans un courriel | D9 |
| AEC-12 | SMS pour autre chose que « Ne roulez pas » ; SMS passé en Unicode par un signe typographique | Coût triplé, alerte banalisée |
| AEC-13 | Service payant obligatoire | BC-12 |
| AEC-14 | Envoi en clair vers un serveur distant | BC-02 |
| AEC-15 | Journal du client IMAP actif | Commandes et en-têtes dans les journaux |
| AEC-16 | Texte d'un courriel reçu rendu à l'écran | Piège 40 : seule la commande reconnue sert |

### Pièges du catalogue transverse, appliqués aux connecteurs

| Piège | Où il menace | Garde retenue |
|---|---|---|
| 2. Écriture sans lecture | Courriel parti mais jamais remis ; canal cassé depuis deux jours | Non-remise lue (C5), vérification au démarrage et quotidienne, `/sante` (C4) |
| 3. Zéro qui ment | « 0 crédit » affiché quand le fournisseur ne le dit pas | Crédits « inconnus » quand l'information manque, jamais 0 |
| 6. Lot sans test | Adaptateurs non exercés | Test SMTP de bout en bout, faux serveurs HTTP, faux client IMAP |
| 22. Diagnostic perdu en transit | Cause d'un échec avalée par une bibliothèque | Nature et remède portés par l'erreur jusqu'au journal et à la commande |
| 26. Prose comptée comme invariant | « Ne lit rien d'autre », « lecture seule » | Test de l'adaptateur : commande `EXAMINE`, aucune méthode d'écriture appelée, aucun contenu téléchargé hors référence |
| 40. Texte libre rendu à l'écran | Texte d'une réponse | Rien du texte n'est conservé ni affiché |

## User stories

Format du Kano principal. Les adresses et numéros des critères sont des valeurs d'essai.

### Phase A : infrastructure (ce lot)

**US-C01. Gmail en trois variables** (basique BC-01, E)
En tant qu'exploitant, je veux configurer l'envoi par Gmail avec l'adresse et le mot de passe d'application seulement, afin de ne rien chercher.
- Étant donné `SMTP_UTILISATEUR=garage@gmail.com` et `SMTP_MOT_DE_PASSE=abcd efgh ijkl mnop` sans autre variable, quand la configuration est lue, alors le fournisseur est `gmail`, l'envoi part vers smtp.gmail.com:465 en TLS direct, la lecture vers imap.gmail.com:993 dossier `INBOX` toutes les 120 secondes, l'expéditeur est `garage@gmail.com` et le mot de passe retenu est `abcdefghijklmnop`.
- Étant donné le préréglage Gmail et `SMTP_MOT_DE_PASSE=MonMotDePasse2026`, quand la configuration est lue, alors elle est refusée avec un message qui nomme `SMTP_MOT_DE_PASSE`, « mot de passe d'application » et « 16 lettres », sans reproduire la valeur.
- Étant donné le préréglage Gmail et `SMTP_EXPEDITEUR=contact@bfauto.fr`, quand la configuration est lue, alors elle est acceptée avec un avertissement qui nomme l'alias vérifié.

**US-C02. Toutes les fautes d'un coup** (basique BC-04, E)
- Étant donné `COURRIEL_FOURNISSEUR=yahoo`, `SMTP_PORT=99999`, `IMAP_INTERVALLE_SECONDES=5` et `SMS_OVH_CLE_APPLICATION` seule, quand la configuration est lue, alors une seule erreur liste quatre problèmes au moins, chacun avec sa variable.
- Étant donné `COURRIEL_FOURNISSEUR=outlook`, quand la configuration est lue, alors elle est refusée avec un message qui cite le 16 septembre 2024 et propose `gmail`.

**US-C03. Un courriel relié à sa demande** (basique BC-07, BC-08, BC-09, P4)
- Étant donné un serveur SMTP d'essai et un courriel d'objet « Rappel de Julie » rattaché à la référence `BF-7K3Q9D` au rang 1, quand il est envoyé, alors le serveur reçoit l'objet « Rappel de Julie [BF-7K3Q9D] », un `Message-ID` égal à `<BF-7K3Q9D.1@` suivi du domaine de l'expéditeur, l'en-tête `Auto-Submitted: auto-generated`, un corps en texte brut UTF-8 dont les accents sont intacts.
- Étant donné le même courriel envoyé deux fois, quand le serveur les reçoit, alors les deux portent le même `Message-ID` ; étant donné le rang 2, alors `In-Reply-To` et `References` valent `<BF-7K3Q9D.1@...>`.
- Étant donné un mot de passe faux, quand la connexion est vérifiée, alors l'erreur est de nature « identifiants » et son remède, pour Gmail, cite le mot de passe d'application.
- Étant donné un serveur distant sans TLS, quand un envoi part, alors il est refusé ; un relais sur 127.0.0.1 est admis.

**US-C04. La boîte n'est lue que pour les demandes** (basique BC-06, AEC-02, P4)
- Étant donné une boîte de dix messages (deux réponses référencées, trois rapports de non-remise de messages du site, deux courriels de client, la propre notification du site, une réponse d'absence, un rapport étranger) et un serveur qui les renvoie tous à la recherche, quand un relevé s'exécute, alors il ne rend que les deux réponses et les trois rapports du site, n'a téléchargé le contenu d'aucun autre message, n'a lu que les en-têtes d'origine des rapports sans enveloppe, a ouvert le dossier en lecture seule et n'a appelé aucune commande d'écriture.
- Étant donné la propre notification du site arrivée dans la boîte, ou une réponse d'absence, quand le relevé s'exécute, alors elle est écartée.

**US-C05. Le texte de la réponse sans la citation** (P4)
- Étant donné une réponse Gmail, Outlook ou Apple Mail, en texte ou en HTML, dont la première ligne est « Fait » suivie de la citation du message d'origine, quand elle est analysée, alors le texte de réponse vaut « Fait ».
- Étant donné une réponse « Rappelé » suivie de « Envoyé de mon iPhone », alors le texte vaut « Rappelé ».

**US-C06. Trois mots, et rien d'autre** (attractive AT-C1, P4)
- Étant donné les réponses « fait », « Fait. », « FAIT ! », « rappele », « Rappelée », « traité », « Traitée », quand elles sont reconnues, alors chacune est la commande « marquer traitée ».
- Étant donné « pas fait », « fait ? », « fait demain », « à rappeler », « rappeler », une réponse vide ou une phrase, alors aucune commande n'est reconnue.

**US-C07. Le courriel revenu en erreur** (attractive AT-C2, P4)
- Étant donné un rapport de non-remise de Gmail, de Postfix ou d'Exchange qui contient le message d'origine `<BF-7K3Q9D.1@...>`, quand il est analysé, alors il est rendu comme non-remise de `BF-7K3Q9D`, avec l'action « échec », l'adresse refusée, le code d'état et le motif.
- Étant donné un rapport de retard, alors l'action est « retard ».

**US-C08. Rien n'est relu, l'historique n'est jamais lu** (basique, AEC-08)
- Étant donné aucun filigrane et un dossier dont le prochain UID est 51, quand le premier relevé s'exécute, alors il ne rend aucun message antérieur et le filigrane devient 50.
- Étant donné un filigrane à 50 et une recherche qui renvoie aussi l'UID 50 (plage `51:*` sur un dossier sans nouveau message), alors l'UID 50 n'est pas rendu de nouveau.
- Étant donné un UIDVALIDITY différent de celui du filigrane, alors le relevé repart de la fin et le signale.

**US-C09. SMS par OVH ou Brevo, sans réseau en test** (basique BC-10, C6)
- Étant donné un faux serveur OVH, quand un SMS part, alors la requête porte `X-Ovh-Application`, `X-Ovh-Consumer`, `X-Ovh-Timestamp` égal à l'heure rendue par `/auth/time`, et `X-Ovh-Signature` égal à `$1$` suivi du SHA-1 de secret, clé consommateur, méthode, adresse, corps et horodatage joints par « + » ; le corps porte le destinataire `+33605922838`, `noStopClause: true` et `senderForResponse: true` sans expéditeur déclaré.
- Étant donné une réponse OVH dont `invalidReceivers` n'est pas vide, alors l'envoi échoue en nommant le numéro refusé.
- Étant donné un faux serveur Brevo, quand un SMS part, alors la requête porte l'en-tête `api-key` et le corps `sender`, `recipient` `33605922838`, `content`, `type: transactional` ; une réponse 401 donne une erreur de nature « identifiants ».
- Étant donné les identifiants OVH seulement, sans `SMS_FOURNISSEUR`, alors OVH est actif et le destinataire est le téléphone du garage fourni par défaut ; étant donné aucun identifiant, le SMS est désactivé ; étant donné `SMS_DESTINATAIRE=01 45 00 00 00`, la configuration est refusée.

**US-C10. Un SMS au tarif d'un SMS** (performance PC-04, AEC-12)
- Étant donné « Ne roulez pas : rappelez Julie aujourd’hui, fenêtre « fin de journée » », quand le texte est préparé, alors il ne contient que des caractères de l'alphabet GSM, l'apostrophe et les guillemets sont droits, « fenêtre » devient « fenetre » et il tient en un SMS.
- Étant donné un texte de trois SMS, alors l'envoi est refusé avant tout appel réseau.

**US-C11. Tester en une commande** (basique BC-11, attractives AT-C3 et AT-C4, E)
- Étant donné une configuration Gmail complète et des faux connecteurs, quand `courriel:tester --envoyer garage@gmail.com` s'exécute, alors la sortie affiche « mot de passe : défini » et jamais sa valeur, les vérifications SMTP et IMAP, la référence du courriel d'essai et la liste des messages référencés ; le code de sortie est 0 ; si IMAP échoue, il est 1.
- Étant donné `sms:tester` avec un faux compte OVH à 97 crédits, alors la sortie affiche « Crédits restants : 97 ».

### Phase B : branchement (plus tard, sur demande de l'orchestrateur)

**US-C20. Le canal vérifié au démarrage** (basique BC-05, C4) : en production, une vérification SMTP en échec au démarrage est journalisée avec sa nature et son remède, le site démarre, `/sante` répond 503 jusqu'au premier envoi ou à la première vérification réussis.

**US-C21. La notification porte sa référence** (basique BC-07) : chaque demande reçoit une référence non devinable, stockée ; la notification et sa relance partent par `ExpediteurCourriel` avec les rangs 1 et 2.

**US-C22. « Fait » range la demande** (AT-C1) : une réponse « fait » du garagiste à la référence d'une demande « À rappeler » la passe « Traitée » au relevé suivant, avec l'heure ; une réponse non reconnue fait afficher « Réponse reçue, non reconnue » ; une réponse d'un autre expéditeur ne change rien.

**US-C23. La non-remise sur la fiche** (AT-C2) : un rapport de non-remise marque la notification « non remise » avec son motif et compte comme un échec pour `/sante`.

**US-C24. Le SMS « Ne roulez pas »** (C6) : une demande « Ne roulez pas » envoie un SMS au destinataire configuré, en plus du courriel ; deux au plus par demande.

**US-C25. Le lien de connexion par le même canal** (acces) : le lien de connexion de l'espace garagiste et les signalements partent par le même `ExpediteurCourriel`, sans référence de demande.

## Ordre d'exécution

| Phase | Contenu | US | Porte de sortie |
|---|---|---|---|
| A. Infrastructure | Préréglages, lecture typée des variables, envoi SMTP, référence et `Message-ID`, diagnostic, lecture IMAP (adaptateur imapflow et mémoire), extraction de réponse, commandes reconnues, non-remise, filigrane, SMS OVH, Brevo et console, texte GSM, commandes `courriel:tester` et `sms:tester`, règle dependency-cruiser, documentation d'exploitation | US-C01 à US-C11 | `pnpm run ci` exit 0 ; test SMTP de bout en bout sur serveur local ; appels SMS contre faux serveurs ; règles de frontière vues rouges par injection |
| B. Branchement | Composition, contextes demandes et acces, stockage de la référence et du filigrane, relevé périodique, `/sante`, SMS « Ne roulez pas » | US-C20 à US-C25 | Tests des contextes ; échec SMTP simulé au démarrage ; relevé d'une boîte mémoire qui range une demande |
| C. Mise en service, sans code | Mot de passe d'application créé, variables sur Render, `pnpm courriel:tester --envoyer`, réponse « fait » vue par la commande, compte SMS et `pnpm sms:tester --envoyer` | aucune | Sorties des deux commandes consignées dans `docs/collecte/`, datées |

## État appliqué

Phase A réalisée le 2026-09-24 sur la branche `vague3/connecteurs` ; porte `pnpm run ci`
en exit 0. Rien n'est encore branché dans les contextes (phase B).

| US | Phase | État | Preuve (test nommé) | Date |
|---|---|---|---|---|
| US-C01 | A | Fait | `courriel/reglages.test.ts` : « Gmail en deux variables », « refuse le mot de passe habituel », « avertit qu'un expéditeur autre » | 2026-09-24 |
| US-C02 | A | Fait | `reglages-connecteurs.test.ts` : « rassemble toutes les fautes » ; `courriel/reglages.test.ts` : « Outlook.com est refusé » | 2026-09-24 |
| US-C03 | A | Fait | `courriel/envoi/expediteur-smtp.test.ts` (serveur `smtp-server` local) : objet, `Message-ID`, `Auto-Submitted`, renvoi, relance, identifiants, refus, TLS | 2026-09-24 |
| US-C04 | A | Fait | `courriel/lecture/boite-imapflow.test.ts` : « ne télécharge que les réponses et les rapports du site, et n'écrit rien » ; `boite-memoire.test.ts` | 2026-09-24 |
| US-C05 | A | Fait | `courriel/lecture/reponse.test.ts` : Gmail, Outlook, Apple Mail en texte et en HTML | 2026-09-24 |
| US-C06 | A | Fait | `courriel/lecture/reponse.test.ts` : « commandes reconnues » (16 formes admises, 12 refusées) | 2026-09-24 |
| US-C07 | A | Fait | `courriel/lecture/analyse.test.ts` : rapports Gmail, Postfix (échec et retard), Exchange ; `non-remise.test.ts` | 2026-09-24 |
| US-C08 | A | Fait | `courriel/lecture/filigrane.test.ts` ; `boite-imapflow.test.ts` : « ne relit jamais le dernier message que la plage N:* renvoie » | 2026-09-24 |
| US-C09 | A | Fait | `sms/envoi-ovh.test.ts`, `sms/envoi-brevo.test.ts` (faux serveurs locaux), `sms/reglages.test.ts` | 2026-09-24 |
| US-C10 | A | Fait | `sms/texte-sms.test.ts` | 2026-09-24 |
| US-C11 | A | Fait | `cli/tester-courriel.test.ts`, `cli/tester-sms.test.ts` | 2026-09-24 |
| US-C20 | B | Fait | `composition.test.ts` : « un envoi injoignable au démarrage ne bloque pas le site mais fait répondre /sante en 503 » | 2026-09-24 |
| US-C21 | B | Fait | `domaine/reference.test.ts` (référence tirée de l'identifiant aléatoire, rien à stocker) ; `notificateurs.test.ts` : rang 1 | 2026-09-24 |
| US-C22 | B | Fait | `application/relever-boite.test.ts` : « fait » range, non reconnue notée, autre expéditeur ignoré ; `module.test.ts` : fiche | 2026-09-24 |
| US-C23 | B | Fait | `relever-boite.test.ts` : non-remise remet la notification en échec ; fiche « Notification non remise : motif » | 2026-09-24 |
| US-C24 | B | Fait, écart | `relever-boite.test.ts` : un SMS au premier essai, son échec n'empêche pas le courriel (voir Anomalies n° 1) | 2026-09-24 |
| US-C25 | B | Fait | `acces/.../messageries.test.ts` : liens et signalements par l'expéditeur partagé | 2026-09-24 |

## Anomalies détectées et corrigées

| N° | Constat | Cause | Correction | Garde ajoutée | Date |
|---|---|---|---|---|---|
| 1 | C6 prévoyait un SMS aussi à la relance et dans la file de renvoi ; la relance « Ne roulez pas » n'existe pas encore dans le contexte demandes | Relance de D5 non réalisée à ce jour | Un seul SMS, au premier envoi de la notification ; son échec est journalisé, le courriel et sa file de renvoi restent la garantie. À reprendre avec la relance | Test « part une seule fois, en plus du courriel » | 2026-09-24 |
| 2 | La référence n'a pas été stockée en base | Choix de phase B : tirée des 30 premiers bits de l'identifiant aléatoire, elle est stable sans colonne ni migration | Aucune correction nécessaire ; la lecture retrouve la demande parmi celles à rappeler ou traitées depuis 30 jours | `domaine/reference.test.ts` | 2026-09-24 |
