console.log("Marvel FASERIP System: marvel-faserip.js has been loaded into Foundry VTT");

// Import required classes and configurations
/* import { MARVEL_RANKS, ACTION_RESULTS, ACTION_CATEGORIES, getAvailableActions } from "./config.js"; */
import { MarvelActor } from "./documents/MarvelActor.js";
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";
import { MarvelAttackItem } from "./documents/items/MarvelAttackItem.js";
import { MarvelAttackItemSheet } from "./sheets/items/MarvelAttackItemSheet.js";
import { MarvelFaseripItem } from "./item/item.js";
import WeaponSystem from "./weapons/weapon-system.js";
import { MarvelHeadquartersSheet } from "./sheets/items/MarvelHeadquartersSheet.js";
import { FaseripCombatSystem } from "./combat/FaseripCombatSystem.js";
import { FaseripUniversalTable } from "./combat/FaseripUniversalTable.js";
import { MarvelCombatHUD } from "./combat/MarvelCombatHUD.js";
import { FaseripCombatEngine } from "./combat/FaseripCombatEngine.js";

import { 
    MARVEL_RANKS,
    RANK_VALUES,
    ACTION_RESULTS, 
    ACTION_CATEGORIES, 
    UNIVERSAL_TABLE_RANGES,
    getAvailableActions,
    COMBAT_EFFECTS,
    COMBAT_TYPES,
    ROOM_PACKAGES,
    SECURITY_SYSTEMS,
    KARMA_REASONS,
    RESISTANCE_TYPES,
    KARMA_SPEND_TYPES,
    FEAT_TYPES,
    STATUS_EFFECTS
} from "./config.js";

Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    // Initialize CONFIG.marvel first
    CONFIG.marvel = {
        combatHUD: null,  // Start with null
        ranks: MARVEL_RANKS,
        // Generate selectable ranks from MARVEL_RANKS
        selectableRanks: Object.keys(MARVEL_RANKS).reduce((obj, key) => {
            obj[key] = key;
            return obj;
        }, {}),
        rankValues: RANK_VALUES,
        universalTableRanges: UNIVERSAL_TABLE_RANGES,
        actionCategories: ACTION_CATEGORIES,
        actionResults: ACTION_RESULTS,
        combatEffects: COMBAT_EFFECTS,
        combatTypes: COMBAT_TYPES,
        roomPackages: ROOM_PACKAGES,
        securitySystems: SECURITY_SYSTEMS,
        karmaReasons: KARMA_REASONS,
        resistanceTypes: RESISTANCE_TYPES,
        karmaSpendTypes: KARMA_SPEND_TYPES,
        featTypes: FEAT_TYPES,
        getAvailableActions
    };

    // Add status effects
    CONFIG.statusEffects.push(...STATUS_EFFECTS);
    
    // Initialize game.marvel namespace
    game.marvel = {
        MarvelCombatHUD,
        WeaponSystem: new WeaponSystem(),
        combatSystem: new FaseripCombatSystem(),
        combatEngine: new FaseripCombatEngine(),
        FaseripUniversalTable
    };

    // Register sheet application classes
    globalThis.FaseripUniversalTable = FaseripUniversalTable;
    globalThis.MarvelCombatHUD = MarvelCombatHUD;

    // Make weapon system available globally for debugging
    globalThis.marvelWeapons = game.marvel.WeaponSystem;
    globalThis.marvelCombat = game.marvel.combatSystem;
    
    // Configure document classes
    CONFIG.Item.documentClass = MarvelFaseripItem;
    
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

    // HQ registration
    Items.registerSheet("marvel-faserip", MarvelHeadquartersSheet, {
        types: ["headquarters"],
        makeDefault: true
    });
    
    // ... rest of your initialization
});

// Define Combat Phases
const COMBAT_PHASES = {
    SETUP: 0,        // Initial setup, declares NPCs
    PREACTION: 1,    // Pre-action defensive declarations and rolls
    ACTIONS: 2,      // Players declare actions
    RESOLUTION: 3    // Initiative and resolution
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

  function rollItemMacro(itemName) {
    console.log("FASERIP | Rolling item macro for:", itemName);
    
    const speaker = ChatMessage.getSpeaker();
    console.log("FASERIP | Speaker:", speaker);
    
    let actor;
    if (speaker.token) {
        console.log("FASERIP | Getting actor from token");
        actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
        console.log("FASERIP | Getting actor from speaker ID");
        actor = game.actors.get(speaker.actor);
    }
    console.log("FASERIP | Found actor:", actor);

    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    console.log("FASERIP | Found item:", item);
    
    if (!item) {
        console.warn(`FASERIP | Actor does not have item named ${itemName}`);
        return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
    }

    // Trigger the item roll
    console.log("FASERIP | Attempting to roll item");
    if (item.type === "attack") {
        return actor.rollAttack(item.system.ability, item.system.attackType, {
            weaponDamage: item.system.weaponDamage,
            columnShift: item.system.columnShift,
            range: item.system.range
        });
    }
}
  
// Initialize system
Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    // Set up game.faserip
    game.faserip = {
        MarvelActor,
        rollItemMacro
    };

    // Add selectable ranks for dropdown menus
    CONFIG.marvel.selectableRanks = {
        'Shift 0': "Shift 0",
        'Feeble': "Feeble",
        'Poor': "Poor",
        'Typical': "Typical",
        'Good': "Good",
        'Excellent': "Excellent",
        'Remarkable': "Remarkable",
        'Incredible': "Incredible",
        'Amazing': "Amazing",
        'Monstrous': "Monstrous",
        'Unearthly': "Unearthly",
        'Shift X': "Shift X",
        'Shift Y': "Shift Y",
        'Shift Z': "Shift Z",
        'Class 1000': "Class 1000",
        'Class 3000': "Class 3000",
        'Class 5000': "Class 5000",
        'Beyond': "Beyond"
    };

    // Add resistance types configuration
    CONFIG.marvel.resistanceTypes = {
        physical: "Physical",
        energy: "Energy", 
        force: "Force",
        heat: "Heat",
        cold: "Cold",
        electricity: "Electricity",
        radiation: "Radiation",
        toxins: "Toxins",
        psychic: "Psychic",
        magic: "Magic"
    };

    CONFIG.Combat.initiative = {
        formula: "1d10",
        decimals: 0
    };

    // Register system settings
    // Around line 48 in init hook
    game.settings.register("marvel-faserip", "karmaPools", {
        name: "Karma Pools",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });
    
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
        "systems/marvel-faserip/templates/dialogs/add-attack.html",
        "systems/marvel-faserip/templates/dialogs/edit-equipment.html"
    ]);
});

// Add to Combat class
Combat.prototype.declareDefensiveAction = async function(tokenId, action) {
    const validDefenses = ["Do", "Bl", "Ev"];
    if (!validDefenses.includes(action)) {
        throw new Error("Invalid defensive action");
    }

    await this.setFlag("marvel-faserip", `defensiveActions.${tokenId}`, {
        action: action,
        declared: true,
        used: false
    });
};

Combat.prototype.hasDefensiveAction = function(tokenId) {
    return this.getFlag("marvel-faserip", `defensiveActions.${tokenId}`);
};

Combat.prototype.useDefensiveAction = async function(tokenId) {
    const defense = this.getFlag("marvel-faserip", `defensiveActions.${tokenId}`);
    if (defense && !defense.used) {
        await this.setFlag("marvel-faserip", `defensiveActions.${tokenId}`, {
            ...defense,
            used: true
        });
        return true;
    }
    return false;
};

// Override Combat class's rollInitiative method to handle Marvel's initiative rules
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
                
            case COMBAT_PHASES.PREACTION:
                await announcePreActionPhase(combat);
                break;
                
            case COMBAT_PHASES.ACTIONS:
                await announceActionPhase(combat);
                break;
                
            case COMBAT_PHASES.RESOLUTION:
                await resolveActions(combat);
                break;
        }
        
        await combat.setFlag("marvel-faserip", "currentPhase", nextPhase);
    });;
});
    // Disable individual initiative rolls when phase system is active
    Hooks.on("preUpdateCombat", (combat, updateData, options, userId) => {
        if (!game.user.isGM && 
            combat.getFlag("marvel-faserip", "currentPhase") !== undefined && 
            updateData.initiative !== undefined) {
            ui.notifications.warn("Initiative is handled through the combat phase system");
            return false;
        }
    });

// Get next phase button label
function getNextPhaseLabel(currentPhase) {
    switch(currentPhase) {
        case COMBAT_PHASES.SETUP: return "Begin Pre-Action Phase";
        case COMBAT_PHASES.PREACTION: return "Begin Action Declarations";
        case COMBAT_PHASES.ACTIONS: return "Resolve Actions";
        case COMBAT_PHASES.RESOLUTION: return "Next Round";
    }
}

// Get current phase info
function getCurrentPhaseInfo(currentPhase) {
    switch(currentPhase) {
        case COMBAT_PHASES.SETUP: return "GM Setup";
        case COMBAT_PHASES.PREACTION: return "Pre-Action Defensive Declarations";
        case COMBAT_PHASES.ACTIONS: return "Action Declarations";
        case COMBAT_PHASES.RESOLUTION: return "Resolution Phase";
    }
}

// A pre-action phase announcement
async function announcePreActionPhase(combat) {
    await ChatMessage.create({
        content: `
            <div class="marvel-phase">
                <h3>Pre-Action Phase</h3>
                <p>Characters may now declare and roll defensive actions:</p>
                <ul>
                    <li>Dodging (Do)</li>
                    <li>Blocking (Bl)</li>
                    <li>Evading (Ev)</li>
                </ul>
                <p>Once declared, these defensive actions must be used when attacked.</p>
            </div>
        `
    });
}

// Action phase announcement
async function announceActionPhase(combat) {
    await ChatMessage.create({
        content: `
            <div class="marvel-phase">
                <h3>Action Declaration Phase</h3>
                <ul>
                    <li>Declare your intended actions</li>
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

// Add a hook to create the universal table button in the scene controls
/* Hooks.on('getSceneControlButtons', (controls) => {
    controls.push({
        name: 'universal-table',
        title: 'Universal Table',
        icon: 'fas fa-table',
        layer: 'controls',
        tools: [{
            name: 'show-table',
            title: 'Show Universal Table',
            icon: 'fas fa-dice-d20',
            button: true,
            onClick: () => game.marvel.universalTable.render(true)
        }]
    });
}) */;

// Handle Macro Creation
Hooks.on("hotbarDrop", async (bar, rawData, slot) => {
    try {
        console.log("FASERIP | Hotbar Drop Raw Data:", rawData);
        
        // Parse the data if it's a string
        const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
        console.log("FASERIP | Parsed Hotbar Drop Data:", data);

        if (data.type !== "Item") {
            console.log("FASERIP | Not an item, ignoring drop");
            return;
        }
    
        const actor = game.actors.get(data.actorId);
        console.log("FASERIP | Found actor:", actor);

        const item = actor?.items.get(data.itemId);
        console.log("FASERIP | Found item:", item);

        if (!item || item.type !== "attack") {
            console.log("FASERIP | Item not found or not an attack:", {item});
            return;
        }

        console.log("FASERIP | Creating macro command for attack item:", item);

        const command = `(async () => {
            try {
                console.log("FASERIP | Executing attack macro");
                const actor = game.actors.get("${data.actorId}");
                if (!actor) {
                    console.error("FASERIP | Actor not found:", "${data.actorId}");
                    ui.notifications.warn("Actor not found");
                    return;
                }
            
                const item = actor.items.get("${data.itemId}");
                if (!item) {
                    console.error("FASERIP | Attack item not found:", "${data.itemId}");
                    ui.notifications.warn("Attack item not found");
                    return;
                }

                console.log("FASERIP | Rolling attack with:", {
                    ability: item.system.ability,
                    attackType: item.system.attackType,
                    weaponDamage: item.system.weaponDamage,
                    columnShift: item.system.columnShift,
                    range: item.system.range
                });

                // Instead of opening the sheet, execute the roll
                await actor.rollAttack(item.system.ability, item.system.attackType, {
                    weaponDamage: item.system.weaponDamage,
                    columnShift: item.system.columnShift,
                    range: item.system.range
                });
            } catch(err) {
                console.error("FASERIP | Error executing attack macro:", err);
                ui.notifications.error("Failed to roll attack");
            }
        })();`;

        // Create or update the macro
        console.log("FASERIP | Looking for existing macro with name:", item.name);
        let macro = game.macros.find(m => m.name === item.name && m.author.id === game.user.id);
        
        if (!macro) {
            console.log("FASERIP | Creating new macro");
            try {
                macro = await Macro.create({
                    name: item.name,
                    type: "script",
                    img: item.img,
                    command: command,
                    flags: { "marvel-faserip.attackMacro": true }
                });
                console.log("FASERIP | Created new macro:", macro);
            } catch (error) {
                console.error("FASERIP | Error creating macro:", error);
                return false;
            }
        } else {
            console.log("FASERIP | Updating existing macro");
            try {
                await macro.update({ command: command });
                console.log("FASERIP | Updated macro");
            } catch (error) {
                console.error("FASERIP | Error updating macro:", error);
                return false;
            }
        }
    
        try {
            await game.user.assignHotbarMacro(macro, slot);
            console.log("FASERIP | Assigned macro to hotbar slot:", slot);
        } catch (error) {
            console.error("FASERIP | Error assigning macro to hotbar:", error);
        }

        return false;
} catch (error) {
    console.error("FASERIP | Error in hotbar drop handler:", error);
    return false;
}
});