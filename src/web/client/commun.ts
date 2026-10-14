/**
 * Script commun chargé sur toutes les pages (différé). Amélioration
 * progressive uniquement : chaque parcours fonctionne sans lui.
 */
import { installerEnvoiUnique } from './modules/envoi-unique.js'
import { installerFermetureMenu } from './modules/menu.js'

installerEnvoiUnique(window)
installerFermetureMenu(window)
