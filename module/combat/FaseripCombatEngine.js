// module/combat/FaseripCombatEngine.js
import { MARVEL_RANKS, ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripCombatEngine {
    constructor() {
        this.initializeListeners();
    }

    /**
     * Initialize global event listeners for combat
     */
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

    /**
     * Core combat resolution method
     * @param {Actor} actor - Attacking actor
     * @param {Actor} target - Target actor
     * @param {string} actionType - Type of action (BA, EA, SH, etc.)
     * @param {Object} options - Additional options for the attack
     * @returns {Object} Result of the combat action
     */
    async resolveAction(actor, target, actionType, options = {}) {
        try {
            // Input validation
            if (!actor || !target) {
                console.error("Invalid actor or target");
                return this._createErrorResult("Invalid actor or target");
            }
    
            console.log(`Resolving action: ${actionType}`, {actor: actor.name, target: target.name, options});
    
            // Find the action in CONFIG regardless of case
            const normalizedActionType = Object.keys(CONFIG.marvel.actionResults).find(
                key => key.toLowerCase() === actionType.toLowerCase()
            );
            
            if (!normalizedActionType) {
                console.error(`Invalid action type: ${actionType}`);
                return this._createErrorResult(`Invalid action type: ${actionType}`);
            }
            
            // Use the correctly cased key
            const actionDefinition = CONFIG.marvel.actionResults[normalizedActionType];

    
            // Get ability scores and calculate base chance
            const ability = actionDefinition.ability.toLowerCase();
            const abilityScore = actor.system.primaryAbilities[ability];
            let baseChance = abilityScore.number;
            
            // Apply column shift if specified
            if (options.columnShift) {
                baseChance = this._applyColumnShift(baseChance, options.columnShift);
                console.log(`Applied column shift ${options.columnShift}, new base chance: ${baseChance}`);
            }
    
            // Handle karma points
            const karmaPoints = options.karmaPoints || 0;
    
            // Roll and get result
            const rankName = this._getRankFromValue(baseChance);
            console.log(`Rolling 1d100 for rank ${rankName} (${baseChance})`);

            // Ensure dice are always shown:
            const roll = new Roll("1d100");
            await roll.evaluate(); // Correct syntax for Foundry v12
            if (game.dice3d) {
                await game.dice3d.showForRoll(roll, game.user, true);
            }
            
            // Apply Karma to the roll total
            let finalRollTotal = roll.total;
            if (karmaPoints > 0) {
                console.log(`Adding ${karmaPoints} karma to roll ${roll.total}`);
                finalRollTotal += karmaPoints;
                
                // Reduce actor's karma
                await this._spendKarma(actor, karmaPoints, `${actionType} action`);
            }
    
            // Get result color based on adjusted roll
            const result = this._getColorResult(finalRollTotal, rankName);
            console.log(`Roll result: ${roll.total}, with karma: ${finalRollTotal}, color: ${result}`);
    
            // Handle wrestling moves specially
            if (["Gp", "Gb", "Es"].includes(normalizedActionType)) {
                return await this._handleWrestlingResult(
                    actor, 
                    target, 
                    normalizedActionType, 
                    result,
                    roll,
                    finalRollTotal
                );
            }
    
            // Calculate damage
            const damage = await this._calculateDamage(actor, target, actionType, result, options);
            console.log("Calculated damage:", damage);
            
            // Get combat effect
            const effect = this._getCombatEffect(actionType, result);
            console.log("Combat effect:", effect);
            
            // Format result for display
            const formattedText = this._formatCombatResult(
                actor, 
                target, 
                normalizedActionType, // Use normalized action type
                result, 
                damage, 
                effect,
                roll,
                finalRollTotal
            );
    
            // APPLY DAMAGE TO TARGET
            if (damage && damage.final > 0) {
                console.log(`Applying ${damage.final} damage to ${target.name}`);
                try {
                    await target.applyDamage(damage.final);
                    console.log(`Successfully applied ${damage.final} damage to ${target.name}`);
                } catch (error) {
                    console.error("Error applying damage to target:", error);
                }
            }
            
            // Apply special effects if necessary (Stun, Slam, Kill)
            if (result !== "white" && effect.type !== "Hit" && effect.type !== "Miss") {
                await this._applySpecialEffect(effect.type, target, actor, damage.final);
            }
    
            return {
                roll,
                adjustedRoll: finalRollTotal,
                result,
                effect,
                damage,
                ability,
                abilityScore,
                formattedText,
                columnShift: options.columnShift || 0,
                karmaPoints
            };
    
        } catch (error) {
            console.error("Error in resolveAction:", error);
            return this._createErrorResult("Combat resolution error");
        }
    }

    /**
     * Spend karma points and update actor's karma history
     * @param {Actor} actor - Actor spending karma
     * @param {number} amount - Amount of karma to spend
     * @param {string} reason - Reason for spending karma
     */
    async _spendKarma(actor, amount, reason) {
        if (!actor || amount <= 0) return;
        
        const currentKarma = actor.system.secondaryAbilities.karma.value;
        console.log(`Current karma: ${currentKarma}, will be reduced to: ${Math.max(0, currentKarma - amount)}`);
        
        await actor.update({
            "system.secondaryAbilities.karma.value": Math.max(0, currentKarma - amount)
        });
        
        // Add to karma history
        let historyPath = "system.karmaHistory";
        let currentHistory = actor.system.karmaHistory;
        
        // If not found directly, check in karmaTracking structure
        if (!currentHistory && actor.system.karmaTracking?.history) {
            historyPath = "system.karmaTracking.history";
            currentHistory = actor.system.karmaTracking.history;
        }
        
        if (currentHistory) {
            console.log("Adding karma history entry");
            
            const newEntry = {
                date: new Date().toLocaleString(),
                amount: -amount,
                description: `Used ${amount} karma on ${reason}`
            };
            
            const updateData = {};
            updateData[historyPath] = [...currentHistory, newEntry];
            await actor.update(updateData);
        }
    }

    /**
     * Create an error result object
     */
    _createErrorResult(message) {
        return {
            roll: null,
            result: "white",
            effect: { type: "Miss", description: "The attack misses completely." },
            ability: "none",
            abilityScore: null,
            error: true,
            formattedText: `<div class="marvel-damage"><h3>Error: ${message}</h3></div>`
        };
    }

    /**
     * Get the rank name from a numeric value
     */
    _getRankFromValue(value) {
        console.log(`DEBUG: _getRankFromValue called with value: ${value}`);
        
        // Get the MARVEL_RANKS which has range information
        const marvelRanks = CONFIG.marvel.ranks;
        console.log("DEBUG: Available ranks in marvel.ranks:", marvelRanks);
        
        // Find the matching rank based on value
        for (const [rankName, rankData] of Object.entries(marvelRanks)) {
            console.log(`DEBUG: Checking rank ${rankName} with data:`, rankData);
            
            // Check if value is within range
            if (rankData.range && 
                value >= rankData.range[0] && 
                value <= rankData.range[1]) {
                console.log(`DEBUG: Found matching rank: ${rankName}`);
                return rankName;
            }
        }
        
        // Default to Shift 0 if no match
        console.log(`DEBUG: No matching rank found for value ${value}, defaulting to Shift 0`);
        return "Shift 0";
    }

    /**
     * Apply column shift to a rank value
     */
    _applyColumnShift(baseValue, shift) {
        if (shift === 0) return baseValue;
        
        // Debug the input values
        console.log(`DEBUG: _applyColumnShift called with baseValue: ${baseValue}, shift: ${shift}`);
        
        // Make sure baseValue is a number
        baseValue = Number(baseValue);
        if (isNaN(baseValue)) {
            console.error(`Invalid baseValue: ${baseValue}`);
            return 0; // Return a safe default
        }
        
        // Get rank names in order
        const ranks = Object.keys(CONFIG.marvel.selectableRanks);
        console.log(`DEBUG: Available ranks: ${ranks.join(', ')}`);
        
        // Find current rank
        const currentRank = this._getRankFromValue(baseValue);
        const currentIndex = ranks.indexOf(currentRank);
        
        console.log(`DEBUG: Current rank: ${currentRank}, index: ${currentIndex}`);
        
        if (currentIndex === -1) {
            console.error(`Rank not found: ${currentRank}`);
            return baseValue; // Return original value
        }
        
        // Calculate new rank index with shift
        const newIndex = Math.max(0, Math.min(ranks.length - 1, currentIndex + shift));
        const newRank = ranks[newIndex];
        
        console.log(`DEBUG: New rank after shift: ${newRank}, index: ${newIndex}`);
        
        // Get middle value of new rank range
        const range = CONFIG.marvel.rankValues[newRank];
        if (!range) {
            console.error(`No range found for rank: ${newRank}`);
            return baseValue;
        }
        
        // Check if we have range as an array or as min/max properties
        let minVal, maxVal;
        if (range.range && Array.isArray(range.range)) {
            // If using the format from MARVEL_RANKS
            [minVal, maxVal] = range.range;
        } else if (range.min !== undefined && range.max !== undefined) {
            // If using min/max properties
            minVal = range.min;
            maxVal = range.max;
        } else {
            console.error(`Invalid range format for rank: ${newRank}`, range);
            return baseValue;
        }
        
        // Calculate the middle value of the range
        const newValue = Math.floor((minVal + maxVal) / 2);
        console.log(`DEBUG: New value after shift: ${newValue} (range: ${minVal}-${maxVal})`);
        
        return newValue;
    }
    
 /**
 * Get color result from roll total and target rank
 */
 _getColorResult(rollTotal, targetRank) {
    // Detailed debugging
    console.log("DEBUG: _getColorResult called with:", { rollTotal, targetRank });
    console.log("DEBUG: CONFIG.marvel:", CONFIG.marvel);
    console.log("DEBUG: Available ranks in universalTableRanges:", 
        CONFIG.marvel.universalTableRanges ? Object.keys(CONFIG.marvel.universalTableRanges) : "Not available");
    
    // Check if the target rank exists exactly as provided
    const exactRankExists = CONFIG.marvel.universalTableRanges && CONFIG.marvel.universalTableRanges[targetRank];
    console.log(`DEBUG: Exact rank "${targetRank}" exists:`, exactRankExists ? "Yes" : "No");
    
    // Try to find a close match if exact doesn't exist
    let matchedRank = targetRank;
    if (!exactRankExists && CONFIG.marvel.universalTableRanges) {
        matchedRank = Object.keys(CONFIG.marvel.universalTableRanges).find(
            rank => rank.toLowerCase() === targetRank.toLowerCase()
        );
        console.log(`DEBUG: Found case-insensitive match:`, matchedRank || "None");
    }
    
    // Get ranges for the matched rank
    const ranges = CONFIG.marvel.universalTableRanges[matchedRank];
    
    if (!ranges) {
        console.error(`DEBUG: No ranges found for rank: ${targetRank}`, {
            availableRanks: CONFIG.marvel.universalTableRanges ? 
                            Object.keys(CONFIG.marvel.universalTableRanges) : "None",
            targetRank,
            matchedRank
        });
        return "white"; // Default to miss
    }
    
    console.log(`DEBUG: Using ranges for ${matchedRank}:`, ranges);
    
    // Check each color range
    if (rollTotal >= ranges.white[0] && rollTotal <= ranges.white[1]) {
        console.log(`DEBUG: Roll ${rollTotal} is WHITE in range ${ranges.white[0]}-${ranges.white[1]}`);
        return "white";
    }
    if (rollTotal >= ranges.green[0] && rollTotal <= ranges.green[1]) {
        console.log(`DEBUG: Roll ${rollTotal} is GREEN in range ${ranges.green[0]}-${ranges.green[1]}`);
        return "green";
    }
    if (rollTotal >= ranges.yellow[0] && rollTotal <= ranges.yellow[1]) {
        console.log(`DEBUG: Roll ${rollTotal} is YELLOW in range ${ranges.yellow[0]}-${ranges.yellow[1]}`);
        return "yellow";
    }
    if (rollTotal >= ranges.red[0] && rollTotal <= ranges.red[1]) {
        console.log(`DEBUG: Roll ${rollTotal} is RED in range ${ranges.red[0]}-${ranges.red[1]}`);
        return "red";
    }
    
    console.warn(`DEBUG: Roll ${rollTotal} didn't match any range for ${matchedRank}, defaulting to white`);
    return "white"; // Default if somehow no match is found
}

/**
 * Calculate damage for an attack - FIXED VERSION
 * @param {Actor} actor - Attacking actor
 * @param {Actor} target - Target actor
 * @param {string} actionType - Type of action (BA, EA, SH, etc.)
 * @param {string} result - Color result (white, green, yellow, red)
 * @param {Object} options - Additional options for the attack
 * @returns {Object} Damage calculation result
 */
 // In FaseripCombatEngine.js, modify the _calculateDamage method to handle all action types:

async _calculateDamage(actor, target, actionType, result, options) {
    // Return zero damage for misses
    if (result === "white") {
        return {
            base: 0,
            resistance: 0,
            final: 0,
            resistanceType: this._getAttackResistanceType(actionType)
        };
    }
    
    let baseDamage = 0;
    const strengthValue = actor.system.primaryAbilities.strength.number;
    console.log(`${actor.name}'s strength value: ${strengthValue}`);
    
    // Normalize action type to uppercase
    actionType = actionType.toUpperCase();
    
    // Calculate base damage by attack type - CORRECT FASERIP RULES
    switch(actionType) {
        case "BA": // Blunt Attack
        case "TB": // Throwing Blunt
        case "CH": // Charging
            baseDamage = strengthValue;
            console.log(`Base damage for ${actionType} set to strength: ${baseDamage}`);
            break;
        case "EA": // Edged Attack
        case "TE": // Throwing Edged
            baseDamage = Math.max(
                strengthValue,
                options.weaponDamage || 0
            );
            console.log(`Base damage for ${actionType} set to max of strength (${strengthValue}) or weapon (${options.weaponDamage || 0}): ${baseDamage}`);
            break;
        case "SH": // Shooting
        case "EN": // Energy
        case "FO": // Force
            baseDamage = options.weaponDamage || 0;
            console.log(`Base damage for ${actionType} set to weapon damage: ${baseDamage}`);
            break;
        case "GP": // Grappling
            // Grappling only does damage on a full hold
            if (result === "red") {
                baseDamage = strengthValue;
                console.log(`Grappling full hold damage: ${baseDamage}`);
            } else {
                baseDamage = 0;
                console.log(`Grappling no damage for result: ${result}`);
            }
            break;
        case "GB": // Grabbing
        case "ES": // Escaping
            // These typically don't do direct damage
            baseDamage = 0;
            console.log(`${actionType} actions don't typically do direct damage`);
            break;
        default:
            console.log(`Unknown attack type ${actionType}, defaulting to strength damage`);
            baseDamage = strengthValue;
    }
    
    // Get and apply resistance
    const resistanceType = this._getAttackResistanceType(actionType);
    const resistance = await this._getApplicableResistance(target, actionType);
    console.log(`Target resistance (${resistanceType}): ${resistance}`);
    
    const finalDamage = Math.max(0, baseDamage - resistance);
    console.log(`Final damage after resistance: ${finalDamage}`);

    return {
        base: baseDamage,
        resistance: resistance,
        final: finalDamage,
        resistanceType: resistanceType
    };
}

    /**
     * Handle wrestling result
     */
    async _handleWrestlingResult(attacker, target, attackType, color, roll, adjustedRoll) {
        let result;
        
        switch(attackType.toLowerCase()) {
            case "gp": // Grappling
                result = await this._handleGrapplingResult(attacker, target, color);
                break;
            case "gb": // Grabbing
                result = await this._handleGrabbingResult(attacker, target, color);
                break;
            case "es": // Escaping
                result = await this._handleEscapeResult(attacker, target, color);
                break;
            default:
                result = { effect: "None", description: "Invalid wrestling action type" };
        }
        
        // Apply damage if it's a hold with damage
        if (attackType.toLowerCase() === "gp" && color === "red" && result.finalDamage > 0) {
            console.log(`Applying ${result.finalDamage} damage to ${target.name} from wrestling hold`);
            try {
                await target.applyDamage(result.finalDamage);
            } catch (error) {
                console.error("Error applying wrestling damage:", error);
            }
        }
        
        // Use the same formatting as regular combat
        const effectObj = {
            type: result.effect,
            description: result.description
        };
        
        const damageObj = result.damage ? {
            base: result.damage,
            resistance: result.resistance || 0,
            final: result.finalDamage || 0,
            resistanceType: result.resistanceType || 'physical'
        } : null;
        
        // Format wrestling result using the main formatter
        const formattedText = this._formatCombatResult(
            attacker,
            target,
            attackType,
            color,
            damageObj,
            effectObj,
            roll,
            adjustedRoll
        );
        
        // Apply hold effects if needed
        if (result.effect === "Hold" || result.effect === "Partial") {
            await this._applyWrestlingEffect(target, result);
        }
        
        // Add any additional action information for holds
        if (result.holdAction === "other") {
            // We could modify the formatted text here to add the additional action info
        }
        
        return {
            ...result,
            formattedText
        };
    }
    
    /**
     * Handle grappling result
     */
    async _handleGrapplingResult(attacker, target, color) {
        switch(color) {
            case "white":
            case "green":
                return {
                    effect: "Miss",
                    description: "The grappling attempt fails",
                    damage: 0
                };
            case "yellow":
                return {
                    effect: "Partial",
                    description: "Target is partially held and suffers -2CS to actions",
                    damage: 0
                };
            case "red":
                // For a red result (Hold), show the options dialog to select damage
                const holdOptions = await this._handleHoldOptions(attacker, target);
                
                // Calculate final damage after resistance
                const baseStrength = attacker.system.primaryAbilities.strength.number;
                const selectedDamage = holdOptions.holdDamage;
                const resistance = await this._getApplicableResistance(target, "Gp");
                const finalDamage = Math.max(0, selectedDamage - resistance);
                
                return {
                    effect: "Hold",
                    description: "Target is fully held",
                    damage: selectedDamage,
                    resistance: resistance,
                    resistanceType: "physical",
                    finalDamage: finalDamage,
                    holdAction: holdOptions.holdAction
                };
        }
    }

    /**
     * Handle grabbing result
     */
    async _handleGrabbingResult(attacker, target, color) {
        switch(color) {
            case "white":
                return {
                    effect: "Miss",
                    description: "The grabbing attempt fails completely"
                };
            case "green":
                // Take requires strength check
                const attackerStrength = attacker.system.primaryAbilities.strength.number;
                const targetStrength = target.system.primaryAbilities.strength.number;
                const canTake = attackerStrength >= targetStrength;
                
                return {
                    effect: canTake ? "Take" : "Miss",
                    description: canTake ? 
                        "Successfully take item - Strength sufficient" : 
                        "Failed to take item - insufficient Strength"
                };
            case "yellow":
                return {
                    effect: "Grab",
                    description: "Successfully grab item regardless of Strength"
                };
            case "red":
                return {
                    effect: "Break",
                    description: "Can break/activate item or move away"
                };
        }
    }

    /**
     * Handle escape result
     */
    async _handleEscapeResult(attacker, target, color) {
        switch(color) {
            case "white":
            case "green":
                return {
                    effect: "Miss",
                    description: "Failed to escape, still held"
                };
            case "yellow":
                return {
                    effect: "Escape",
                    description: "Break free and can move at half speed"
                };
            case "red":
                return {
                    effect: "Reverse",
                    description: "Break free and can counter-attack or move at half speed"
                };
        }
    }

    /**
     * Get hold options from user
     */
    async _handleHoldOptions(attacker, target) {
        const maxDamage = attacker.system.primaryAbilities.strength.number;
        
        const content = `
            <form>
                <div class="form-group">
                    <label>Apply Damage:</label>
                    <div class="form-fields">
                        <input type="number" name="holdDamage" min="0" max="${maxDamage}" value="0">
                        <span class="notes">Maximum: ${maxDamage}</span>
                    </div>
                    <p class="notes">With a full hold, you can apply up to your Strength value in damage.</p>
                </div>
                <div class="form-group">
                    <label>Additional Action:</label>
                    <select name="holdAction">
                        <option value="none">None - Just maintain hold</option>
                        <option value="other">Perform another action at -2CS</option>
                    </select>
                </div>
            </form>
        `;
        
        return new Promise((resolve) => {
            new Dialog({
                title: "Hold Options",
                content: content,
                buttons: {
                    apply: {
                        label: "Apply",
                        callback: (html) => {
                            const holdDamage = Number(html.find('[name="holdDamage"]').val());
                            const holdAction = html.find('[name="holdAction"]').val();
                            resolve({ holdDamage, holdAction });
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve({ holdDamage: 0, holdAction: "none" })
                    }
                },
                default: "apply"
            }).render(true);
        });
    }

    /**
     * Apply wrestling effect to target
     */
    async _applyWrestlingEffect(target, result) {
        // Remove any existing wrestling effects
        await target.effects.forEach(e => {
            if (e.flags?.marvel?.wrestlingEffect) {
                e.delete();
            }
        });
    
        // Apply new effect
        const effectData = {
            label: result.effect === "Hold" ? "Held" : "Partially Held",
            icon: "icons/svg/net.svg",
            duration: { rounds: 1 },
            flags: { marvel: { wrestlingEffect: true }}
        };
    
        if (result.effect === "Partial") {
            effectData.changes = [
                {
                    key: "system.columnShift",
                    mode: 2,
                    value: -2
                },
                {
                    key: "system.cannotMove",
                    mode: 5,
                    value: true // This will need to be conditional based on Strength comparison
                }
            ];
        } else if (result.effect === "Hold") {
            effectData.changes = [
                {
                    key: "system.held",
                    mode: 5,
                    value: true
                },
                {
                    key: "system.cannotAct",
                    mode: 5,
                    value: true
                }
            ];
        }
    
        await target.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }

_getCombatEffect(attackType, color) {
    // Normalize attack type to uppercase
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
            
        case "GP": // Grappling
            switch(color) {
                case "green": return { type: "Miss", description: "The grappling attempt fails." };
                case "yellow": return { type: "Partial", description: "Partial hold, target at -2CS to actions." };
                case "red": return { type: "Hold", description: "Full hold, target is restrained." };
            }
            break;
            
        case "GB": // Grabbing
            switch(color) {
                case "green": return { type: "Take", description: "Take item if Strength sufficient." };
                case "yellow": return { type: "Grab", description: "Successfully grab item." };
                case "red": return { type: "Break", description: "Can break item or move away." };
            }
            break;
            
        case "ES": // Escaping
            switch(color) {
                case "green": return { type: "Miss", description: "Failed to escape." };
                case "yellow": return { type: "Escape", description: "Break free, can move half speed." };
                case "red": return { type: "Reverse", description: "Break free and can counter-attack." };
            }
            break;
            
        case "CH": // Charging
            switch(color) {
                case "green": return { type: "Hit", description: "A solid hit." };
                case "yellow": return { type: "Slam", description: "Target may be knocked back." };
                case "red": return { type: "Stun", description: "Target may be stunned." };
            }
            break;
    }
    
    return { type: "Hit", description: "The attack connects." };
}

    /**
     * Apply special effects (Stun, Slam, Kill)
     */
    async _applySpecialEffect(effect, target, attacker, damage) {
        // Special effects only apply if damage was dealt
        if (damage <= 0) return;
        
        // Create message about special effect
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: attacker}),
            content: `
                <div class="marvel-effect">
                    <h3>${attacker.name} scores a ${effect} on ${target.name}!</h3>
                    <div class="effect-details">
                        <div>${this._getEffectDescription(effect)}</div>
                        <div>${target.name} must make an Endurance FEAT to resist.</div>
                    </div>
                </div>`
        });
        
        // Have target roll to resist the effect
        if (target.handleCombatEffect) {
            await target.handleCombatEffect(effect);
        } else {
            console.warn(`Target actor ${target.name} does not have handleCombatEffect method for: ${effect}`);
        }
    }

    /**
     * Get description of effect
     */
    _getEffectDescription(effect) {
        switch(effect) {
            case "Stun": return "Target may be stunned for 1-10 rounds.";
            case "Slam": return "Target may be knocked back.";
            case "Kill": return "Target may be mortally wounded.";
            case "Bullseye": return "A precise hit at a vulnerable spot.";
            case "Hit": return "The attack connects.";
            case "Miss": return "The attack misses.";
            default: return "";
        }
    }

    /**
     * Get resistance type for attack
     */
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

    /**
     * Get applicable resistance from target
     */
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

    /**
 * Format combat result for chat display
 * @param {Actor} actor - Attacking actor
 * @param {Actor} target - Target actor
 * @param {string} actionType - Type of action (BA, EA, SH, etc.)
 * @param {string} result - Color result (white, green, yellow, red)
 * @param {Object} damage - Damage calculation result
 * @param {Object} effect - Combat effect
 * @param {Roll} roll - The d100 roll object
 * @param {number} adjustedRoll - Roll total after karma adjustments
 * @returns {string} Formatted HTML for chat message
 */
    _formatCombatResult(actor, target, actionType, result, damage, effect, roll, adjustedRoll) {
        // Get proper action name
        const actionName = CONFIG.marvel.actionResults[actionType]?.name || actionType;
        
        // Calculate karma used if any
        const rollTotal = roll?.total || 0;
        const karmaUsed = (adjustedRoll && adjustedRoll > rollTotal) ? adjustedRoll - rollTotal : 0;
        
        // Get column shift information (passed in via options.columnShift)
        const columnShift = effect.columnShift || 0;
        const columnShiftText = columnShift !== 0 ? 
            `<div style="color: #0077cc; font-weight: bold;">Column Shift: ${columnShift > 0 ? '+' : ''}${columnShift}</div>` : '';
        
        // Format karma text with blue color if used
        const karmaText = karmaUsed > 0 ? 
            `<div style="color: #0077cc; font-weight: bold;">Karma Spent: ${karmaUsed}</div>` : '';
        
        // Start building the chat card
        let html = `
        <div class="faserip-roll">
            <h3>${actor.name} attacks ${target.name}</h3>
            <div>Attack Type: ${actionName}</div>
            ${columnShiftText}
            ${karmaText}
            <div style="font-weight: bold;">Roll: ${rollTotal}${karmaUsed > 0 ? ` + <span style="color: #0077cc;">${karmaUsed}</span> = ${adjustedRoll}` : ``}</div>
            <div class="roll-result" style="background-color: ${result}; color: ${result === 'yellow' || result === 'white' ? 'black' : 'white'}; padding: 5px; text-align: center; font-weight: bold; border: 1px solid black; margin-top: 3px;">
                ${effect.type || (result === 'white' ? 'Miss' : 'Hit')} (${result.toUpperCase()})
            </div>`;
        
        // Add effect description if available
        if (effect.description) {
            html += `<div>${effect.description}</div>`;
        }
        
        // Add damage information if applicable and not a miss
        if (result !== "white" && damage) {
            html += `
            <div style="margin-top: 3px;">
                <div>Base Damage: ${damage.base || 0}</div>
                <div>Resistance: ${damage.resistance || 0} (${damage.resistanceType || 'None'})</div>
                <div>Final Damage: ${damage.final || 0}</div>
            </div>`;
        }
        
        // Close the div
        html += `</div>`;
        
        return html;
    }
}