// module/combat/FaseripCombatEngine.js
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
            
            // Get additional effect and format results
            const effectResult = this._getAttackEffect(actionType, result);
            const formattedResult = this._formatActionResult(actor, target, actionType, result, damage, effectResult);

            return {
                roll,
                result,
                effect,
                damage,
                ability,
                abilityScore,
                formattedText: formattedResult
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

    _applyColumnShift(baseValue, shift) {
        const ranks = Object.keys(MARVEL_RANKS);
        const currentIndex = ranks.findIndex(r => 
            MARVEL_RANKS[r].range[0] <= baseValue && 
            MARVEL_RANKS[r].range[1] >= baseValue
        );
        
        const newIndex = Math.min(Math.max(currentIndex + shift, 0), ranks.length - 1);
        return MARVEL_RANKS[ranks[newIndex]].standard;
    }

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

    async _calculateDamage(actor, target, actionType, result, options) {
        let baseDamage = 0;
        
        switch(actionType) {
            case "BA": // Blunt Attack
            case "TB": // Throwing Blunt
                baseDamage = actor.system.primaryAbilities.strength.number;
                break;
            case "EA": // Edged Attack
            case "TE": // Throwing Edged
                baseDamage = Math.max(
                    actor.system.primaryAbilities.strength.number,
                    options.weaponDamage || 0
                );
                break;
            case "Sh": // Shooting
            case "En": // Energy
            case "Fo": // Force
                baseDamage = options.weaponDamage || 0;
                break;
        }

        // Apply result modifiers
        if (result === "red") baseDamage *= 2;
        if (result === "yellow") baseDamage *= 1.5;

        // Get and apply resistance
        const resistance = await this._getApplicableResistance(target, actionType);
        const finalDamage = Math.max(0, baseDamage - resistance);

        return {
            base: baseDamage,
            resistance: resistance,
            final: finalDamage,
            resistanceType: this._getAttackResistanceType(actionType)
        };
    }

    _getAttackResistanceType(attackType) {
        const resistanceMap = {
            "BA": "physical",    // Blunt Attack
            "EA": "physical",    // Edged Attack
            "Sh": "physical",    // Shooting
            "TE": "physical",    // Throwing Edged
            "TB": "physical",    // Throwing Blunt
            "En": "energy",      // Energy Attack
            "Fo": "force",       // Force Attack
            "Gr": "physical",    // Grappling
            "Ch": "physical"     // Charging
        };
        return resistanceMap[attackType] || "physical";
    }

    async _getApplicableResistance(target, attackType) {
        if (!target?.system?.resistances?.list) {
            return 0;
        }

        const resistanceType = this._getAttackResistanceType(attackType);
        
        let resistances = [];
        if (typeof target.system.resistances.list === 'object') {
            resistances = Object.values(target.system.resistances.list);
        } else if (Array.isArray(target.system.resistances.list)) {
            resistances = target.system.resistances.list;
        }

        const resistance = resistances.find(r => 
            r && r.type && r.type.toLowerCase() === resistanceType.toLowerCase()
        );

        return resistance?.number || 0;
    }

    _getAttackEffect(attackType, color) {
        if (color === "white") return null;
        
        const effectMap = {
            "BA": { // Blunt Attack
                green: null,
                yellow: "Slam",
                red: "Stun"
            },
            "EA": { // Edged Attack
                green: null,
                yellow: "Stun",
                red: "Kill"
            },
            "Sh": { // Shooting
                green: null,
                yellow: "Bullseye",
                red: "Kill"
            },
            "TE": { // Throwing Edged
                green: null,
                yellow: "Stun",
                red: "Kill"
            },
            "TB": { // Throwing Blunt
                green: null,
                yellow: null,
                red: "Stun"
            },
            "En": { // Energy
                green: null,
                yellow: "Bullseye",
                red: "Kill"
            },
            "Fo": { // Force
                green: null,
                yellow: "Bullseye",
                red: "Stun"
            }
        };
        
        return effectMap[attackType]?.[color] || null;
    }

    _getEffectDescription(effect) {
        const descriptions = {
            "Stun": "Target may be stunned for 1-10 rounds",
            "Slam": "Target may be knocked back",
            "Kill": "Target may be mortally wounded",
            "Bullseye": "A precise hit at a vulnerable spot"
        };
        return descriptions[effect] || "";
    }

    _formatActionResult(actor, target, actionType, result, damage, effect) {
        const actionName = CONFIG.marvel.actionResults[actionType]?.name || actionType;
        
        if (result === "white") {
            return `
                <div class="marvel-damage">
                    <h3>${actor.name} misses ${target.name}!</h3>
                    <div class="attack-details">
                        <div class="detail-row"><span class="detail-label">Attack Type:</span> ${actionName}</div>
                        <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-white">MISS</span></div>
                    </div>
                </div>`;
        }

        return `
            <div class="marvel-damage">
                <h3>${actor.name} attacks ${target.name}</h3>
                <div class="attack-details">
                    <div class="detail-row"><span class="detail-label">Attack Type:</span> ${actionName}</div>
                    <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-${result}">${result.toUpperCase()}</span></div>
                    ${effect ? `<div class="detail-row"><span class="detail-label">Effect:</span> ${effect}</div>` : ''}
                </div>
                <div class="damage-details">
                    <div class="detail-row"><span class="detail-label">Base Damage:</span> ${damage.base}</div>
                    <div class="detail-row"><span class="detail-label">Resistance:</span> ${damage.resistance} (${damage.resistanceType})</div>
                    <div class="detail-row"><span class="detail-label">Final Damage:</span> ${damage.final}</div>
                </div>
            </div>`;
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