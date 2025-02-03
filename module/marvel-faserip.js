console.log("Marvel FASERIP System: marvel-faserip.js has been loaded into Foundry VTT");
// Import required classes and configurations
import { MARVEL_RANKS, UNIVERSAL_TABLE_RANGES, ACTION_RESULTS, COMBAT_TYPES, COMBAT_EFFECTS } from "./config.js";
import { MarvelActor } from "./documents/MarvelActor.js";
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";
import { MarvelAttackItem } from "./documents/items/MarvelAttackItem.js";
import { MarvelAttackItemSheet } from "./sheets/items/MarvelAttackItemSheet.js";

// Define Combat Phases
const COMBAT_PHASES = {
    SETUP: 0,        // Initial setup, declares NPCs
    ACTIONS: 1,      // Players declare actions
    RESOLUTION: 2    // Initiative and resolution
};

async function getInitiativeModifier(intuitionValue) {
    if (intuitionValue <= 10) return 0;
    if (intuitionValue <= 20) return 1;
    if (intuitionValue <= 30) return 2;
    if (intuitionValue <= 40) return 3;
    if (intuitionValue <= 50) return 4;
    if (intuitionValue <= 75) return 5;
    return 6;
}

async function getHighestIntuition(combatants) {
    let highest = -999;
    for (let combatant of combatants) {
        if (!combatant.actor) continue;
        const intuitionValue = combatant.actor.system.primaryAbilities.intuition.number || 0;
        const intuitionMod = await getInitiativeModifier(intuitionValue);
        highest = Math.max(highest, intuitionMod);
    }
    return highest === -999 ? 0 : highest;
}

async function rollSideInitiative(combat, side, sideName) {
    // Find the highest intuition modifier for the side
    let highestIntuitionMod = 0;
    for (let combatant of side) {
        const intuitionValue = combatant.actor?.system.primaryAbilities.intuition.number || 0;
        const intuitionMod = await getInitiativeModifier(intuitionValue);
        highestIntuitionMod = Math.max(highestIntuitionMod, intuitionMod);
    }
    
    // Roll initiative with modifier
    const roll = await (new Roll("1d10")).evaluate();
    const total = roll.total === 1 ? 1 : roll.total + highestIntuitionMod;
    
    // Set initiative for all members of the side
    for (let i = 0; i < side.length; i++) {
        const adjustedTotal = total - (i * 0.01);  // Slight adjustment to break ties
        await combat.setInitiative(side[i].id, adjustedTotal);
    }
    
    // Create chat message about initiative
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: sideName }),
        content: `
            <div class="marvel-initiative-roll">
                <h3>${sideName} Initiative</h3>
                <div class="roll-details">
                    <div>Base Roll: ${roll.total}</div>
                    <div>Intuition Modifier: +${highestIntuitionMod}</div>
                    <div class="result">Total Initiative: ${total}</div>
                </div>
            </div>`
    });
    
    return { total, side: sideName, firstCombatant: side[0] };
}

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
        decimals: 0
    };

    // Register system settings
    game.settings.register("marvel-faserip", "combatPhase", {
        name: "Combat Phase",
        scope: "world",
        config: false,
        type: String,
        default: "preAction"
    });

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

// Override Combat class's rollInitiative method
Combat.prototype.rollInitiative = async function(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
    const heroes = [];
    const villains = [];
    
    // Separate combatants into hero and villain groups
    for (let id of ids) {
        const combatant = this.combatants.get(id);
        if (!combatant?.isOwner) continue;
        
        if (combatant.token?.disposition === 1) {
            heroes.push(combatant);
        } else {
            villains.push(combatant);
        }
    }

    // Roll initiative for each side
    let heroResult = heroes.length ? await rollSideInitiative(this, heroes, "Heroes") : null;
    let villainResult = villains.length ? await rollSideInitiative(this, villains, "Villains") : null;

    // Handle initiative tie
    while (heroResult && villainResult && heroResult.total === villainResult.total) {
        await ChatMessage.create({
            content: `<div class="marvel-initiative-roll">
                <h3>Initiative Tie (${heroResult.total})!</h3>
                <p>Rerolling initiative...</p>
            </div>`
        });
        heroResult = await rollSideInitiative(this, heroes, "Heroes");
        villainResult = await rollSideInitiative(this, villains, "Villains");
    }

    // Determine turn order
    if (heroResult || villainResult) {
        const results = [heroResult, villainResult]
            .filter(r => r !== null)
            .sort((a, b) => b.total - a.total);
        
        // Set the current turn to the first combatant of the winning side
        const winningTeam = results[0];
        if (winningTeam && winningTeam.firstCombatant) {
            await this.update({turn: this.turns.findIndex(t => t.id === winningTeam.firstCombatant.id)});
        }
        
        // Announce turn order
        await ChatMessage.create({
            content: `<div class="marvel-initiative-roll">
                <h3>Turn Order for Round ${this.round}</h3>
                ${results.map((r, i) => `<div class="${r.side.toLowerCase()}">${i + 1}. ${r.side}: ${r.total}</div>`).join('')}
            </div>`
        });
    }

    return this;
};

// Handle new combat rounds
Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (!("round" in changed) || !game.user.isGM) return;
    
    if (changed.round > 0) {
        // Reset phase for new round
        await combat.setFlag("marvel-faserip", "currentPhase", COMBAT_PHASES.SETUP);
        
        // Announce new round
        await ChatMessage.create({
            content: `
                <div class="marvel-combat-round">
                    <h2>Round ${changed.round}</h2>
                    <p>Beginning new round - awaiting GM to advance phases</p>
                </div>`
        });
    }
});

// Hook to manage combat phase progression
// Remove the separate ACTION_CHANGE phase and modify the existing PREACTION handling
// Phase manager for combat tracker
Hooks.on("renderCombatTracker", (app, html, data) => {
    if (!game.user.isGM) return;
    const combat = game.combat;
    if (!combat) return;

    const currentPhase = combat.getFlag("marvel-faserip", "currentPhase") || COMBAT_PHASES.SETUP;
    const controls = html.find("#combat-controls");
    
    // Add phase advancement button
    controls.prepend(`
        <div class="phase-controls">
            <button class="advance-phase">
                <i class="fas fa-forward"></i> ${getNextPhaseLabel(currentPhase)}
            </button>
            <div class="current-phase">${getCurrentPhaseInfo(currentPhase)}</div>
        </div>
    `);

    // Handle phase advancement
    html.find(".advance-phase").click(async () => {
        const nextPhase = (currentPhase + 1) % Object.keys(COMBAT_PHASES).length;
        
        switch(nextPhase) {
            case COMBAT_PHASES.SETUP:
                await combat.nextRound();
                break;
                
            case COMBAT_PHASES.ACTIONS:
                await announceActionPhase(combat);
                break;
                
            case COMBAT_PHASES.RESOLUTION:
                await resolveActions(combat);
                break;
        }
        
        await combat.setFlag("marvel-faserip", "currentPhase", nextPhase);
    });
});

// Get next phase button label
function getNextPhaseLabel(currentPhase) {
    switch(currentPhase) {
        case COMBAT_PHASES.SETUP: return "Begin Action Declarations";
        case COMBAT_PHASES.ACTIONS: return "Resolve Actions";
        case COMBAT_PHASES.RESOLUTION: return "Next Round";
    }
}

// Get current phase info
function getCurrentPhaseInfo(currentPhase) {
    switch(currentPhase) {
        case COMBAT_PHASES.SETUP: return "GM Setup";
        case COMBAT_PHASES.ACTIONS: return "Action Declarations";
        case COMBAT_PHASES.RESOLUTION: return "Resolution Phase";
    }
}

// Action phase announcement
async function announceActionPhase(combat) {
    await ChatMessage.create({
        content: `
            <div class="marvel-phase">
                <h3>Action Declaration Phase</h3>
                <ul>
                    <li>Declare your intended actions</li>
                    <li>Actions can be changed during resolution with yellow Agility FEAT (-1CS penalty)</li>
                </ul>
            </div>
        `
    });
}

// Resolution phase handling
async function resolveActions(combat) {
    // Roll initiative
    const ids = combat.combatants.map(c => c.id);
    await combat.rollInitiative(ids);
    
    await ChatMessage.create({
        content: `
            <div class="marvel-phase">
                <h3>Resolution Phase</h3>
                <p>Initiative rolled - actions resolve in order.</p>
                <p>To change action: use yellow Agility FEAT (applies -1CS to future rolls)</p>
            </div>
        `
    });
}

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