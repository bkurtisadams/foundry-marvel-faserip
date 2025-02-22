// File: module/combat/defensive-actions.js

/**
 * Defensive Actions class to handle all defensive combat actions
 * including Dodge, Evade, Block, and Catch
 */
export class DefensiveActions {
    constructor() {
        this.activeDefenses = new Map(); // Track active defenses by actor ID
        
        // Initialize hooks
        this._registerHooks();
    }

    /**
     * Register relevant hooks
     * @private
     */
    _registerHooks() {
        // Clear defenses at the start of combat rounds
        Hooks.on('updateCombat', (combat, changes) => {
            if (changes.round && changes.round > 0) {
                this.clearDefensesForCombat(combat);
            }
        });
        
        // Hook into the attack roll to modify it based on defenses
        Hooks.on('marvel.preAttackRoll', this._modifyAttackRoll.bind(this));
    }

    /**
     * Initialize global access to defensive actions
     * @static
     */
    static init() {
        Hooks.once('ready', () => {
            game.marvel = game.marvel || {};
            game.marvel.defensiveActions = new DefensiveActions();
        });
    }

    /**
     * Perform a defensive action
     * @param {string} actionType - The type of defense (dodge, evade, block, catch)
     */
    async perform(actionType) {
        const actor = this._getActiveCharacter();
        if (!actor) {
            ui.notifications.warn("No active character selected");
            return;
        }
        
        switch (actionType.toLowerCase()) {
            case 'dodge':
                return this.performDodge(actor);
            case 'evade':
                return this.performEvade(actor);
            case 'block':
                return this.performBlock(actor);
            case 'catch':
                return this.performCatch(actor);
            default:
                ui.notifications.error(`Unknown defensive action: ${actionType}`);
                return null;
        }
    }

    /**
     * Get the active character for the current user
     * @returns {Actor|null} The active character or null
     * @private
     */
    _getActiveCharacter() {
        // First check for selected token
        const controlled = canvas.tokens?.controlled;
        if (controlled && controlled.length === 1 && controlled[0].actor) {
            return controlled[0].actor;
        }
        
        // Next try the assigned character
        const assigned = game.user.character;
        if (assigned) return assigned;
        
        // Fallback to the first owned character
        const owned = game.actors.filter(a => a.isOwner && (a.type === "hero" || a.type === "villain"));
        return owned.length > 0 ? owned[0] : null;
    }

    /**
     * Modify incoming attack rolls based on active defenses
     * @param {Object} data - The attack roll data
     * @param {Actor} attacker - The attacking actor
     * @param {Actor} target - The target actor
     * @private 
     */
    _modifyAttackRoll(data, attacker, target) {
        if (!target || !this.activeDefenses.has(target.id)) {
            return data; // No modification needed
        }
        
        const defense = this.activeDefenses.get(target.id);
        if (!defense) return data;
        
        // Apply defense based on type
        switch (defense.type) {
            case 'dodge':
                data.columnShift = (data.columnShift || 0) + defense.columnShift;
                break;
            case 'evade':
                if (defense.result === 'autohit') {
                    // Force hit regardless of roll
                    data.autoSuccess = true;
                } else if (['+1cs', '+2cs'].includes(defense.result)) {
                    // Add column shift bonus
                    const bonus = defense.result === '+1cs' ? 1 : 2;
                    data.columnShift = (data.columnShift || 0) + bonus;
                }
                break;
            case 'block':
                data.columnShift = (data.columnShift || 0) + defense.columnShift;
                break;
            case 'catch':
                if (defense.result === 'catch') {
                    // Force catch result
                    data.autoResult = 'catch';
                }
                break;
        }
        
        // Return modified data
        return data;
    }

    // Implementation for defensive actions will go here
    // We'll start with the dodge action for now

    /**
     * Handle Dodge defensive action
     * @param {Actor} actor - The actor performing the dodge
     */
    async performDodge(actor) {
        try {
            // We'll implement dialog and dodge logic in the next update
            ui.notifications.info(`${actor.name} prepares to dodge!`);
            
            // Placeholder defense data
            const defenseData = {
                type: "dodge",
                color: "green",
                columnShift: -2, // -2 CS to attacks
                expiresAt: game.combat ? game.combat.round + 1 : 0
            };
            
            // Record the active defense
            this.activeDefenses.set(actor.id, defenseData);
            
            return defenseData;
        } catch (error) {
            console.error("Error performing dodge:", error);
            ui.notifications.error("Error performing dodge action");
            return null;
        }
    }
}