// Import required classes and configurations
import { MARVEL_RANKS, UNIVERSAL_TABLE_RANGES, ACTION_RESULTS } from "./config.js";
import { MarvelActor } from "./documents/MarvelActor.js";
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";

Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    // Add configuration to CONFIG
    CONFIG.marvel = {
        ranks: MARVEL_RANKS,
        universalTableRanges: UNIVERSAL_TABLE_RANGES,
        actionResults: ACTION_RESULTS
    };

    // Register document classes
    CONFIG.Actor.documentClass = MarvelActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("marvel-faserip", MarvelActorSheet, { makeDefault: true });

    // Register system settings
    game.settings.register("marvel-faserip", "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    // Register ability roll dialog template
    loadTemplates([
        "systems/marvel-faserip/templates/dialogs/ability-roll.html"
    ]);
});

// Hook into the actor creation process
Hooks.on('createActor', async (actor) => {
    // Initialize any required data here
});