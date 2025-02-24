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
            
            if (options.columnShift) {
                baseChance = this._applyColumnShift(baseChance, options.columnShift);
            }

            // Roll and get result
            const rankName = this._getRankFromValue(baseChance);
            const roll = await (new Roll("1d100")).evaluate();
            const result = this._getColorResult(roll.total, rankName);

            // Handle wrestling moves specially
            if (["Gp", "Gb", "Es"].includes(actionType)) {
                return this._handleWrestlingResult(actor, target, actionType, result);
            }

            // Calculate regular combat results
            const damage = await this._calculateDamage(actor, target, actionType, result, options);
            const effect = await this._handleCombatEffect(actionType, result, actor, target, damage.base);
            
            // Format result for display
            const formattedText = this._formatCombatResult(actor, target, actionType, result, damage, effect);

            return {
                roll,
                result,
                effect,
                damage,
                ability,
                abilityScore,
                formattedText
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
    _getRankFromValue(value) { /* ... */ }
    _applyColumnShift(baseValue, shift) { /* ... */ }
    _getColorResult(rollTotal, targetRank) { /* ... */ }

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

    // Enhanced effect handling
    async _handleCombatEffect(attackType, color, attacker, target, baseDamage) {
        // Your existing _handleCombatEffect code
    }

    _getAttackEffect(attackType, color) {
        // Your existing _getAttackEffect code
    }

    _getEffectDescription(effect) {
        // Your existing _getEffectDescription code
    }

    // Moving resistance system
    _getAttackResistanceType(attackType) {
        // Your existing _getAttackResistanceType code
    }

    _getApplicableResistance(target, attackType) {
        // Your existing _getApplicableResistance code
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

        return `
            <div class="marvel-damage">
                <h3>${actor.name} attacks ${target.name}</h3>
                <div class="attack-details">
                    <div class="detail-row"><span class="detail-label">Attack Type:</span> ${actionName}</div>
                    <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-${result}">${result.toUpperCase()}</span></div>
                    ${effect ? `<div class="detail-row"><span class="detail-label">Effect:</span> ${effect.type}</div>` : ''}
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