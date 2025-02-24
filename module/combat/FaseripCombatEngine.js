// module/combat/FaseripCombatEngine.js
// Import required configs
import { MARVEL_RANKS, ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripCombatEngine {
    async resolveAction(actor, target, actionType, options = {}) {
        try {
            actionType = actionType.toUpperCase();
            const actionDefinition = CONFIG.marvel.actionResults[actionType];
            if (!actionDefinition) {
                console.error(`Invalid action type: ${actionType}`);
                return {
                    roll: null,
                    result: "white",
                    effect: { effect: "Miss", damage: 0 },
                    ability: "none",
                    abilityScore: null,
                    error: true
                };
            }

            const ability = actionDefinition.ability.toLowerCase();
            const abilityScore = actor.system.primaryAbilities[ability];

            let baseChance = abilityScore.number;
            if (options.columnShift) {
                baseChance = this._applyColumnShift(baseChance, options.columnShift);
            }

            const rankName = this._getRankFromValue(baseChance);
            
            // Use await with evaluate()
            const roll = await (new Roll("1d100")).evaluate();
            const result = this._getColorResult(roll.total, rankName);

            const effect = actionDefinition.results[result];
            const damage = await this._calculateDamage(actor, target, actionType, result, options);

            return {
                roll,
                result,
                effect,
                damage,
                ability,
                abilityScore
            };
        } catch (error) {
            console.error("Error in resolveAction:", error);
            return {
                roll: null,
                result: "white",
                effect: { effect: "Miss", damage: 0 },
                ability: "none",
                abilityScore: null,
                error: true
            };
        }
    }

    _getRankFromValue(value) {
        for (const [rank, data] of Object.entries(CONFIG.marvel.ranks)) {
            if (value >= data.range[0] && value <= data.range[1]) {
                return rank;
            }
        }
        return "Typical"; // Default fallback
    }

    // Helper method for column shifts
    _applyColumnShift(baseValue, shift) {
        const ranks = Object.keys(MARVEL_RANKS);
        const currentIndex = ranks.findIndex(r => 
            MARVEL_RANKS[r].range[0] <= baseValue && 
            MARVEL_RANKS[r].range[1] >= baseValue
        );
        
        const newIndex = Math.min(Math.max(currentIndex + shift, 0), ranks.length - 1);
        return MARVEL_RANKS[ranks[newIndex]].standard;
    }

    // Helper for getting color result
    _getColorResult(rollTotal, targetRank) {
        // First get the ranges for this rank
        const ranges = UNIVERSAL_TABLE_RANGES[targetRank];
        if (!ranges) {
            console.error(`No ranges found for rank: ${targetRank}`);
            return "white";
        }

        // Check each color range
        for (const [color, [min, max]] of Object.entries(ranges)) {
            if (rollTotal >= min && rollTotal <= max) {
                return color;
            }
        }

        return "white"; // Default fallback
    }

    // Helper for damage calculation
    async _calculateDamage(actor, target, actionType, result, options) {
        let baseDamage = 0;
        
        switch(actionType) {
            case "BA": // Blunt Attack
                baseDamage = actor.system.primaryAbilities.strength.number;
                break;
            case "EA": // Edged Attack
                baseDamage = Math.max(
                    actor.system.primaryAbilities.strength.number,
                    options.weaponDamage || 0
                );
                break;
            // Add other action types...
        }

        // Apply result modifiers
        if (result === "red") baseDamage *= 2;
        if (result === "yellow") baseDamage *= 1.5;

        return baseDamage;
    }

    initializeListeners() {
        // Event handlers for system-wide combat events
        Hooks.on("marvelCombatAction", (data) => {
            return this.resolveAction(
                data.actor,
                data.target,
                data.actionType,
                data.options
            );
        });
    }
}