// Import required classes and configurations
import { MARVEL_RANKS, UNIVERSAL_TABLE_RANGES, ACTION_RESULTS } from "./config.js";
import { MarvelActor } from "./documents/MarvelActor.js";
import { MarvelActorSheet } from "./sheets/MarvelActorSheet.js";

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
    const intuitionMod = await getHighestIntuition(side);
    const roll = await (new Roll("1d10")).evaluate();
    
    // Natural 1 always counts as 1
    const total = roll.total === 1 ? 1 : roll.total + intuitionMod;
    
    // Set initiative for all members of the side
    for (let i = 0; i < side.length; i++) {
        const adjustedTotal = total - (i * 0.01);
        await combat.setInitiative(side[i].id, adjustedTotal);
    }
    
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: sideName }),
        content: `
            <div class="dice-roll">
                <div class="dice-result">
                    <h4>${sideName} Initiative: ${total}</h4>
                    <div class="dice-formula">1d10 ${roll.total === 1 ? '(natural 1)' : 
                        `(${roll.total}) + ${intuitionMod} (highest Intuition modifier)`}</div>
                </div>
            </div>`
    });
    
    return { total, side: sideName, firstCombatant: side[0] };
}

Hooks.once('init', async function() {
    console.log('marvel-faserip | Initializing Marvel FASERIP System');

    // Add configuration to CONFIG
    CONFIG.marvel = {
        ranks: MARVEL_RANKS,
        universalTableRanges: UNIVERSAL_TABLE_RANGES,
        actionResults: ACTION_RESULTS
    };

    // Set initiative formula
    CONFIG.Combat.initiative = {
        formula: "1d10",
        decimals: 2
    };

    // Register system settings
    game.settings.register("marvel-faserip", "combatPhase", {
        name: "Combat Phase",
        scope: "world",
        config: false,
        type: String,
        default: "preAction"
    });

    // Define custom Document classes
    CONFIG.Actor.documentClass = MarvelActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("marvel-faserip", MarvelActorSheet, { makeDefault: true });

    // Load templates
    loadTemplates([
        "systems/marvel-faserip/templates/dialogs/ability-roll.html"
    ]);
});

// Override Combat class's rollInitiative method
Combat.prototype.rollInitiative = async function(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
    const heroes = [];
    const villains = [];
    
    for (let id of ids) {
        const combatant = this.combatants.get(id);
        if (!combatant?.isOwner) continue;
        
        if (combatant.token?.disposition === 1) {
            heroes.push(combatant);
        } else {
            villains.push(combatant);
        }
    }

    let heroResult = heroes.length ? await rollSideInitiative(this, heroes, "Heroes") : null;
    let villainResult = villains.length ? await rollSideInitiative(this, villains, "Villains") : null;

    // Handle initiative tie
    while (heroResult && villainResult && heroResult.total === villainResult.total) {
        await ChatMessage.create({
            content: `<h3>Initiative Tie (${heroResult.total})!</h3><p>Rerolling initiative...</p>`
        });
        heroResult = await rollSideInitiative(this, heroes, "Heroes");
        villainResult = await rollSideInitiative(this, villains, "Villains");
    }

    // Announce turn order and set current combatant
    if (heroResult || villainResult) {
        const results = [heroResult, villainResult]
            .filter(r => r !== null)
            .sort((a, b) => b.total - a.total);
        
        // Set the current turn to the first combatant of the winning side
        const winningTeam = results[0];
        if (winningTeam && winningTeam.firstCombatant) {
            await this.update({turn: this.turns.findIndex(t => t.id === winningTeam.firstCombatant.id)});
        }
        
        await ChatMessage.create({
            content: `<h2>Turn Order for Round ${this.round}</h2>` +
                     results.map((r, i) => `<p>${i + 1}. ${r.side}: ${r.total}</p>`).join('')
        });
    }

    return this;
};

// Handle new rounds
Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (!("round" in changed) || !game.user.isGM || changed.round < 1) return;
    
    await game.settings.set("marvel-faserip", "combatPhase", "preAction");
    
    await ChatMessage.create({
        content: `<h2>Round ${changed.round}</h2>
                 <p>1. GM determines situation</p>
                 <p>2. Players declare actions</p>
                 <p>3. Pre-Action Phase:</p>
                 <ul>
                   <li>Make defensive action FEAT rolls (dodging, blocking, evading)</li>
                   <li>Resolve pre-planned events</li>
                   <li>Characters may attempt to change actions (requires yellow Agility FEAT, -1CS penalty)</li>
                 </ul>`
    });
});

// Add the Pre-Action button to combat tracker
Hooks.on("renderCombatTracker", (app, html, data) => {
    if (!game.user.isGM) return;
    
    const combat = game.combat;
    if (!combat) return;

    const currentPhase = game.settings.get("marvel-faserip", "combatPhase");
    
    const controls = html.find("#combat-controls");
    if (currentPhase === "preAction") {
        controls.prepend(`
            <button class="complete-pre-action">
                <i class="fas fa-check"></i> Complete Pre-Action Phase
            </button>
        `);
        
        html.find(".complete-pre-action").click(async () => {
            await game.settings.set("marvel-faserip", "combatPhase", "action");
            const ids = combat.combatants.map(c => c.id);
            await combat.rollInitiative(ids);
            await game.settings.set("marvel-faserip", "combatPhase", "preAction");
        });
    }
});