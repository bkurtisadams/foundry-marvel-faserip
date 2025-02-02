/**
 * Extends the basic Item class for attack items.
 * @extends {Item}
 */
export class MarvelAttackItem extends Item {
    /**
     * Roll the attack
     * @returns {Promise<Roll>} The roll result
     */
    async roll() {
        if (!this.actor) {
            console.error("This item is not owned by an actor.");
            return null;
        }

        // Get attack parameters and ensure they match the config values
        let ability = this.system.ability.toUpperCase();
        const attackType = this.system.attackType;
        
        // Validate the ability matches our combat types
        if (!["FIGHTING", "AGILITY", "STRENGTH", "ENDURANCE"].includes(ability)) {
            console.error(`Invalid ability: ${ability}, defaulting to FIGHTING`);
            ability = "FIGHTING";
        }
        
        console.log(`Rolling attack with ability ${ability} and type ${attackType}`);
        
        // Roll the attack
        const result = await this.actor.rollAttack(ability, attackType, {
            weaponDamage: this.system.weaponDamage,
            columnShift: this.system.columnShift
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
        if (!this.system.attackType) this.system.attackType = "BLUNT";
        if (!this.system.weaponDamage) this.system.weaponDamage = 0;
        if (!this.system.columnShift) this.system.columnShift = 0;
    }
}