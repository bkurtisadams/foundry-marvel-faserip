// Import required classes and configurations
import { MARVEL_RANKS, UNIVERSAL_TABLE_RANGES, ACTION_RESULTS, COMBAT_TYPES, COMBAT_EFFECTS } from "./config.js";
import { MarvelActor } from "./documents/MarvelActor.js";
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";
import { MarvelAttackItem } from "./documents/items/MarvelAttackItem.js";
import { MarvelAttackItemSheet } from "./sheets/items/MarvelAttackItemSheet.js";

// Initialize system
Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    CONFIG.marvel = {
        ranks: MARVEL_RANKS,
        universalTableRanges: UNIVERSAL_TABLE_RANGES,
        actionResults: ACTION_RESULTS,
        combatTypes: COMBAT_TYPES,
        combatEffects: COMBAT_EFFECTS
    };

    CONFIG.Combat.initiative = {
        formula: "1d10",
        decimals: 2
    };

    // Register document classes
    CONFIG.Actor.documentClass = MarvelActor;
    CONFIG.Item.documentClass = MarvelAttackItem;

    // Register sheets
    Actors.unregisterSheet("core", ActorSheet);
    Items.unregisterSheet("core", ItemSheet);
    
    Items.registerSheet("marvel-faserip", MarvelAttackItemSheet, { 
        types: ["attack"],
        makeDefault: true,
        label: "MARVEL.SheetAttack"
    });

    Actors.registerSheet("marvel-faserip", MarvelActorSheet, { 
        makeDefault: true,
        label: "MARVEL.SheetCharacter"
    });

    // Load templates
    await loadTemplates([
        "systems/marvel-faserip/templates/dialogs/ability-roll.html",
        "systems/marvel-faserip/templates/dialogs/popularity-roll.html",
        "systems/marvel-faserip/templates/items/attack-item.html",
        "systems/marvel-faserip/templates/dialogs/add-attack.html"
    ]);
});

// Handle new rounds
Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (!("round" in changed) || !game.user.isGM) return;
    
    if (changed.round > 0) {
        // First announce the new round
        await ChatMessage.create({
            content: `
                <div class="marvel-combat-round">
                    <h2>Round ${changed.round}</h2>
                    <div class="combat-phases">
                        <h3>Combat Round</h3>
                        <p>1. Judge determines NPC actions</p>
                        <p>2. Players declare intended actions</p>
                    </div>
                </div>`
        });

        // Give players a moment to declare actions
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Then automatically roll initiative if there are opposing sides
        const heroes = combat.combatants.filter(c => c.token?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY);
        const villains = combat.combatants.filter(c => c.token?.disposition !== CONST.TOKEN_DISPOSITIONS.FRIENDLY);

        if (heroes.length && villains.length) {
            const ids = combat.combatants.map(c => c.id);
            await combat.rollInitiative(ids);
            
            await ChatMessage.create({
                content: `
                    <div class="marvel-combat-round">
                        <h3>Pre-Action Phase</h3>
                        <ul>
                            <li>Make defensive rolls (dodge, block, evade)</li>
                            <li>Change actions (yellow Agility FEAT, -1CS penalty)</li>
                            <li>Resolve planned events</li>
                        </ul>
                    </div>`
            });
        }
    }
});

// Combat tracker rendering
Hooks.on("renderCombatTracker", (app, html, data) => {
    if (!game.user.isGM) return;
    
    const combat = game.combat;
    if (!combat) return;
    
    // Add a note about the current phase based on initiative
    const turnOwner = combat.turns[combat.turn];
    if (turnOwner) {
        const isHeroSide = turnOwner.token?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        const phaseName = isHeroSide ? "Heroes" : "Villains";
        
        const header = html.find(".combat-round");
        header.after(`
            <div class="combat-phase-note">
                ${phaseName} are currently acting
                <div class="phase-reminder">Reminder: Actions from losing side may be negated</div>
            </div>
        `);
    }
});

// Handle Macro Creation
Hooks.on("hotbarDrop", async (bar, data, slot) => {
    if (data.type !== "Item") return;
    
    const actor = game.actors.get(data.actorId);
    const item = actor?.items.get(data.itemId);
    if (!item || item.type !== "attack") return;

    const command = `(async () => {
        try {
            const actor = game.actors.get("${data.actorId}");
            if (!actor) {
                ui.notifications.warn("Actor not found");
                return;
            }
            
            const item = actor.items.get("${data.itemId}");
            if (!item) {
                ui.notifications.warn("Attack item not found");
                return;
            }

            // Instead of opening the sheet, execute the roll
            await actor.rollAttack(item.system.ability, item.system.attackType, {
                weaponDamage: item.system.weaponDamage,
                columnShift: item.system.columnShift,
                range: item.system.range
            });
        } catch(err) {
            console.error(err);
            ui.notifications.error("Failed to roll attack");
        }
    })();`;

    // Create or update the macro
    let macro = game.macros.find(m => m.name === item.name && m.author.id === game.user.id);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "marvel-faserip.attackMacro": true }
        });
    } else {
        await macro.update({ command: command });
    }
    
    await game.user.assignHotbarMacro(macro, slot);
    return false;
});