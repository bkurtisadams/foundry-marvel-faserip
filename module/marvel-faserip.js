// Import required classes and configurations
import { MARVEL_RANKS } from "./config.js";
import { MarvelActor } from "./documents/MarvelActor.js";  // Fixed path to match actual filename
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";

Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    // Add ranks to CONFIG
    CONFIG.marvel = {
        ranks: MARVEL_RANKS
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
});