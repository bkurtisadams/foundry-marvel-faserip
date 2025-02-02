import { MarvelAttackItemSheet } from "../../sheets/items/MarvelAttackItemSheet.js";

/**
 * Extends the basic Item class for attack items.
 * @extends {Item}
 */
export class MarvelAttackItem extends Item {
    /**
     * @override
     * Create a new sheet for the item
     */
    _getSheetClass() {
        return MarvelAttackItemSheet;
    }

    /**
     * Roll the attack
     * @returns {Promise<Roll>} The roll result
     */
    async roll() {
        if (!this.actor) {
            console.error("This item is not owned by an actor.");
            return null;
        }

        // Validate we have the required data
        if (!this.system.ability) {
            console.error("Attack item is missing ability.");
            return null;
        }
        if (!this.system.attackType) {
            console.error("Attack item is missing attack type.");
            return null;
        }

        // Get the ability from the item's system data
        const ability = this.system.ability.toLowerCase();
                
        // Get the attack type from the item's system data
        const attackType = this.system.attackType;

        console.log(`Rolling attack with ability ${ability} and type ${attackType}`);

        // Roll the attack
        const result = await this.actor.rollAttack(ability, attackType, {
            weaponDamage: this.system.weaponDamage,
            columnShift: this.system.columnShift,
            range: this.system.range
        });

        return result;
    }

    /** @override */
    static get defaultIcon() {
        return "systems/marvel-faserip/assets/icons/attack.webp";
    }

    /** @override */
    prepareData() {
        super.prepareData();
        
        // Ensure system data exists
        if (!this.system) this.system = {};
        if (!this.system.ability) this.system.ability = "fighting";
        if (!this.system.attackType) this.system.attackType = "BA";  // Default to Blunt Attack
        if (!this.system.weaponDamage) this.system.weaponDamage = 0;
        if (!this.system.range) this.system.range = 0;
        if (!this.system.columnShift) this.system.columnShift = 0;
    }
}