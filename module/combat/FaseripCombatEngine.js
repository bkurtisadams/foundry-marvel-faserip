// module/combat/FaseripCombatEngine.js
import { MARVEL_RANKS, ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripCombatEngine {
    constructor() {
        this.initializeListeners();
    }

    async resolveAction(actor, target, actionType, options = {}) {
        try {
            // Input validation
            if (!actor || !target) {
                console.error("Invalid actor or target");
                return this._createErrorResult("Invalid actor or target");
            }
    
            actionType = actionType.toUpperCase();
            const actionDefinition = CONFIG.marvel.actionResults[actionType];
            if (!actionDefinition) {
                return this._createErrorResult(`Invalid action type: ${actionType}`);
            }
    
            // Get ability scores and calculate base chance
            const ability = actionDefinition.ability.toLowerCase();
            const abilityScore = actor.system.primaryAbilities[ability];
            let baseChance = abilityScore.number;
            
            // Apply column shift if specified
            let columnShift = options.columnShift || 0;
            if (columnShift) {
                baseChance = this._applyColumnShift(baseChance, columnShift);
            }
            
            // Handle karma points correctly
            const karmaPoints = options.karmaPoints || 0;
    
            // Roll and get result
            const rankName = this._getRankFromValue(baseChance);
            const roll = await (new Roll("1d100")).evaluate();
    
            // Apply Karma to the roll total
            let finalRollTotal = roll.total;
            if (karmaPoints > 0) {
                finalRollTotal += karmaPoints;
                
                // Reduce actor's karma
                await actor.update({
                    "system.secondaryAbilities.karma.value": Math.max(0, actor.system.secondaryAbilities.karma.value - karmaPoints)
                });
                
                // Add entry to karma history
                const currentHistory = actor.system.karmaHistory || [];
                const newEntry = {
                    date: game.time.worldTime,
                    amount: -karmaPoints,
                    reason: `Spent on ${actionType} action`,
                    description: `Used ${karmaPoints} karma to boost attack roll`
                };
                
                await actor.update({
                    "system.karmaHistory": [...currentHistory, newEntry]
                });
            }
    
            // Get result color based on adjusted roll
            const resultColor = this._getColorResult(finalRollTotal, rankName);
    
            // Handle wrestling moves specially
            if (["GP", "GB", "ES"].includes(actionType)) {
                return this._handleWrestlingResult(actor, target, actionType, resultColor);
            }
    
            // Calculate regular combat results
            const damage = await this._calculateDamage(actor, target, actionType, resultColor, options);
            const effect = await this._handleCombatEffect(actionType, resultColor, actor, target, damage.base);
            
            // Format result for display
            const formattedText = this._formatCombatResult(actor, target, actionType, resultColor, damage, effect);
    
            return {
                roll,
                adjustedRoll: finalRollTotal,
                result: resultColor,
                effect,
                damage,
                ability,
                abilityScore,
                formattedText,
                columnShift,
                karmaPoints
            };
    
        } catch (error) {
            console.error("Error in resolveAction:", error);
            return this._createErrorResult("Combat resolution error");
        }
    }

    _createErrorResult(message) {
        return {
            roll: null,
            result: "white",
            effect: { effect: "Miss", damage: 0 },
            ability: "none",
            abilityScore: null,
            error: true,
            formattedText: `<div class="marvel-damage"><h3>Error: ${message}</h3></div>`
        };
    }

    // Your existing helper methods remain the same
    _getRankFromValue(value) {
        const rankValues = CONFIG.marvel.rankValues;
        
        for (const [rankName, range] of Object.entries(rankValues)) {
            if (value >= range.min && value <= range.max) {
                return rankName;
            }
        }
        
        // Default to Shift 0 if no match
        return "Shift 0";
    }
    _applyColumnShift(baseValue, shift) {
        if (shift === 0) return baseValue;
        
        // Get rank names in order
        const ranks = Object.keys(CONFIG.marvel.selectableRanks);
        
        // Find current rank
        const currentRank = this._getRankFromValue(baseValue);
        const currentIndex = ranks.indexOf(currentRank);
        
        if (currentIndex === -1) return baseValue; // Shouldn't happen
        
        // Calculate new rank index with shift
        const newIndex = Math.max(0, Math.min(ranks.length - 1, currentIndex + shift));
        const newRank = ranks[newIndex];
        
        // Get middle value of new rank range
        const range = CONFIG.marvel.rankValues[newRank];
        if (!range) return baseValue;
        
        return Math.floor((range.min + range.max) / 2);
    }
    
    _getColorResult(rollTotal, targetRank) {
        const ranges = CONFIG.marvel.universalTableRanges[targetRank];
        if (!ranges) return "white"; // Default to miss
        
        if (rollTotal <= ranges.white) return "white";
        if (rollTotal <= ranges.green) return "green";
        if (rollTotal <= ranges.yellow) return "yellow";
        return "red";
    }

    // Enhanced damage calculation incorporating resistance
    async _calculateDamage(actor, target, actionType, result, options) {
        let baseDamage = 0;
        
        // Calculate base damage by action type
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

    // Moving wrestling system from CombatSystem
    async _handleWrestlingResult(attacker, target, attackType, color) {
        let result;
        switch(attackType) {
            case "Gp":
                result = await this._handleGrapplingResult(attacker, target, color);
                break;
            case "Gb":
                result = await this._handleGrabbingResult(attacker, target, color);
                break;
            case "Es":
                result = await this._handleEscapeResult(attacker, target, color);
                break;
        }

        // Format wrestling result for display
        const formattedText = `
            <div class="marvel-combat">
                <h3>${attacker.name}'s Wrestling Attack</h3>
                <div class="wrestling-details">
                    <div class="detail-row">
                        <span class="detail-label">Effect:</span> ${result.effect}
                    </div>
                    ${result.description ? `
                        <div class="detail-row">
                            <span class="detail-label">Result:</span> ${result.description}
                        </div>
                    ` : ''}
                    ${result.damage ? `
                        <div class="detail-row">
                            <span class="detail-label">Damage:</span> ${result.damage}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Apply effects if needed
        if (result.effect === "Hold" || result.effect === "Partial") {
            await this._applyWrestlingEffect(target, result);
        }

        return {
            ...result,
            formattedText
        };
    }

    // Moving your existing wrestling methods
    async _handleGrapplingResult(attacker, target, color) { /* Your existing code */ }
    async _handleGrabbingResult(attacker, target, color) { /* Your existing code */ }
    async _handleEscapeResult(attacker, target, color) { /* Your existing code */ }
    async _handleHoldOptions(attacker, target) { /* Your existing code */ }
    async _applyWrestlingEffect(target, result) { /* Your existing code */ }

    // Enhanced effect handling for combat
    async _handleCombatEffect(attackType, color, attacker, target, baseDamage) {
        // Convert attack type to uppercase for consistency
        attackType = attackType.toUpperCase();
        
        // Return early for misses
        if (color === "white") {
            return { type: "Miss", description: "The attack misses completely." };
        }
        
        // Effect mapping based on attack type and result color
        switch(attackType) {
            case "BA": // Blunt Attack
                switch(color) {
                    case "green": return { type: "Hit", description: "A solid hit." };
                    case "yellow": return { type: "Slam", description: "Target may be knocked back." };
                    case "red": return { type: "Stun", description: "Target may be stunned." };
                }
                break;

            case "EA": // Edged Attack
                switch(color) {
                    case "green": return { type: "Hit", description: "A clean hit." };
                    case "yellow": return { type: "Stun", description: "Target may be stunned." };
                    case "red": return { type: "Kill", description: "A potentially lethal blow." };
                }
                break;

            case "SH": // Shooting
                switch(color) {
                    case "green": return { type: "Hit", description: "A direct hit." };
                    case "yellow": return { type: "Bullseye", description: "A precise shot." };
                    case "red": return { type: "Kill", description: "A potentially lethal shot." };
                }
                break;
                
            case "TE": // Throwing Edged
                switch(color) {
                    case "green": return { type: "Hit", description: "A clean hit." };
                    case "yellow": return { type: "Stun", description: "Target may be stunned." };
                    case "red": return { type: "Kill", description: "A potentially lethal blow." };
                }
                break;
                
            case "TB": // Throwing Blunt
                switch(color) {
                    case "green": return { type: "Hit", description: "A solid hit." };
                    case "yellow": return { type: "Hit", description: "A solid hit." };
                    case "red": return { type: "Stun", description: "Target may be stunned." };
                }
                break;
                
            case "EN": // Energy
                switch(color) {
                    case "green": return { type: "Hit", description: "A direct hit." };
                    case "yellow": return { type: "Bullseye", description: "A precise hit." };
                    case "red": return { type: "Kill", description: "A potentially lethal hit." };
                }
                break;
                
            case "FO": // Force
                switch(color) {
                    case "green": return { type: "Hit", description: "The force connects." };
                    case "yellow": return { type: "Bullseye", description: "A precise application of force." };
                    case "red": return { type: "Stun", description: "Target may be stunned." };
                }
                break;
                
            default:
                return { type: "Hit", description: "The attack connects." };
        }
        
        return { type: "Hit", description: "The attack connects." };
    }

    // Add this method for consistency
    _getAttackEffect(attackType, color) {
        const effect = this._handleCombatEffect(attackType, color);
        return effect ? effect.type : null;
    }

    // Add description method
    _getEffectDescription(effect) {
        switch(effect) {
            case "Stun":
                return "Target may be stunned for 1-10 rounds.";
            case "Slam":
                return "Target may be knocked back.";
            case "Kill":
                return "Target may be mortally wounded.";
            case "Bullseye":
                return "A precise hit at a vulnerable spot.";
            case "Hit":
                return "The attack connects.";
            case "Miss":
                return "The attack misses.";
            default:
                return "";
        }
    }

    _getAttackResistanceType(attackType) {
        // Case-insensitive mapping
        const attackTypeUpper = attackType.toUpperCase();
        
        const resistanceMap = {
            "BA": "physical",    // Blunt Attack
            "EA": "physical",    // Edged Attack
            "SH": "physical",    // Shooting
            "TE": "physical",    // Throwing Edged
            "TB": "physical",    // Throwing Blunt
            "EN": "energy",      // Energy Attack
            "FO": "force",       // Force Attack
            "GP": "physical",    // Grappling
            "GB": "physical",    // Grabbing
            "ES": "physical",    // Escaping
            "CH": "physical"     // Charging
        };
        
        return resistanceMap[attackTypeUpper] || "physical";
    }

    // Missing resistance calculation method
    _getApplicableResistance(target, attackType) {
        // Safety check
        if (!target?.system?.resistances?.list) {
            return 0;
        }

        // Get resistance type needed
        const resistanceType = this._getAttackResistanceType(attackType);
        
        // Convert object to array if needed
        let resistances = [];
        if (typeof target.system.resistances.list === 'object') {
            resistances = Object.values(target.system.resistances.list);
        } else if (Array.isArray(target.system.resistances.list)) {
            resistances = target.system.resistances.list;
        }
        
        // Find matching resistance
        const resistance = resistances.find(r => 
            r && r.type && r.type.toLowerCase() === resistanceType.toLowerCase()
        );
        
        // Return resistance number or 0 if none found
        return resistance?.number || 0;
    }
    // Format combat results for display
    _formatCombatResult(actor, target, actionType, result, damage, effect) {
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

        // Add a safety check for result being undefined
        const resultDisplay = result ? result.toUpperCase() : "UNKNOWN";

        return `
            <div class="marvel-damage">
                <h3>${actor.name} attacks ${target.name}</h3>
                <div class="attack-details">
                    <div class="detail-row"><span class="detail-label">Attack Type:</span> ${actionName}</div>
                    <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-${result || 'unknown'}">${resultDisplay}</span></div>
                    ${effect ? `<div class="detail-row"><span class="detail-label">Effect:</span> ${effect.type || 'None'}</div>` : ''}
                </div>
                <div class="damage-details">
                    <div class="detail-row"><span class="detail-label">Base Damage:</span> ${damage?.base || 0}</div>
                    <div class="detail-row"><span class="detail-label">Resistance:</span> ${damage?.resistance || 0} (${damage?.resistanceType || 'None'})</div>
                    <div class="detail-row"><span class="detail-label">Final Damage:</span> ${damage?.final || 0}</div>
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