# Infrastructure : connecteurs courriel et SMS

Connecteurs techniques partagés, sans métier (Kano : `docs/conception/kano-connecteurs.md` ;
exploitation : `docs/exploitation/courriel-et-sms.md`).

## Règles de voisinage

- Seuls les **adaptateurs** d'un contexte, son `module.ts` et `src/composition.ts` importent
  ce dossier ; le domaine, l'application, `src/web` et `src/contrats` jamais
  (`infrastructure-reservee-aux-adaptateurs` dans `.dependency-cruiser.cjs`).
- Ce dossier n'importe aucun contexte, ni `src/web`, ni la composition, ni
  `src/configuration.ts` (`infrastructure-sans-contexte`).

## Contenu

| Fichier                    | Rôle                                                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reglages-connecteurs.ts`  | `lireReglagesConnecteurs(env, { telephoneGarage })` : toutes les variables, fautes rassemblées (`ErreurReglagesConnecteurs`), avertissements à part ; `decrireReglages` sans secret |
| `connecteurs.ts`           | `creerConnecteurs(reglages)` et `verifierConnecteurs(connecteurs)` (démarrage, commandes)                                                                                           |
| `erreurs.ts`               | `ErreurConnecteur` : connecteur, nature (7), détail, remède                                                                                                                         |
| `courriel/fournisseurs.ts` | Préréglages (Gmail par défaut)                                                                                                                                                      |
| `courriel/reference.ts`    | Référence `BF-XXXXXX`, objet, `Message-ID` stable par demande et par rang                                                                                                           |
| `courriel/envoi/`          | Port `ExpediteurCourriel` ; adaptateurs SMTP (nodemailer) et console                                                                                                                |
| `courriel/lecture/`        | Port `BoiteDeReception` ; adaptateurs imapflow et mémoire ; tri, extraction de réponse, commandes, non-remise, filigrane                                                            |
| `sms/`                     | Port `EnvoiSms` ; adaptateurs OVHcloud, Brevo et console ; numéro, alphabet GSM                                                                                                     |
| `cli/`                     | `pnpm courriel:tester` et `pnpm sms:tester`                                                                                                                                         |
| `essai/`                   | Faux serveur HTTP local pour les tests                                                                                                                                              |

## Tests

Envoi SMTP de bout en bout contre `smtp-server` local ; API SMS contre un faux serveur HTTP
local ; lecture IMAP contre un faux client qui renvoie tous les messages à chaque
recherche (le pire cas) et refuse toute méthode d'écriture. Aucun test ne touche le réseau.
