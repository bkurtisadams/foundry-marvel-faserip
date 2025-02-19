// weapons-config.js
// Constants for weapon types
export const WEAPON_TYPES = {
    SHOOTING: "S",
    FORCE: "F",
    ENERGY: "E",
    EDGED_ATTACK: "EA",
    BLUNT_ATTACK: "BA",
    THROWING_EDGED: "TE",
    THROWING_BLUNT: "TB",
    GRAPPLING: "GP",
    GRABBING: "GB"
};

// Weapon handling characteristics
export const WEAPON_HANDLING = {
    ONE_HANDED: "one-handed",
    TWO_HANDED: "two-handed",
    STATIONARY: "stationary",
    BURSTS: "bursts",
    SCATTERS: "scatters"
};

// Legal status of weapons
export const WEAPON_LEGALITY = {
    LEGAL: "legal",
    RESTRICTED: "restricted",
    MILITARY: "military",
    ILLEGAL: "illegal"
};

// Weapon data structure following the FASERIP manual
export const WEAPONS = {
    // Handguns
    CHEAP_HANDGUN: {
        name: "Cheap Handgun",
        price: "Poor",
        range: "Feeble",
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 6,
        material: "Poor",
        handling: [WEAPON_HANDLING.ONE_HANDED],
        legality: WEAPON_LEGALITY.RESTRICTED,
        ammunition: ["standard"],
        notes: "Common criminal weapon, inexpensive and readily available"
    },
    HANDGUN: {
        name: "Handgun/Pistol",
        price: "Typical",
        range: "Typical",
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: [6, 8, 9],
        material: "Excellent",
        handling: [WEAPON_HANDLING.ONE_HANDED],
        legality: WEAPON_LEGALITY.RESTRICTED,
        ammunition: ["standard", "mercy", "ap", "rubber", "explosive"],
        notes: "Standard law enforcement and military sidearm"
    },
    
    // Advanced weapons
    LASER_PISTOL: {
        name: "Laser Pistol",
        price: "Remarkable",
        range: "Remarkable",
        damage: 10,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 10,
        material: "Poor",
        handling: [WEAPON_HANDLING.ONE_HANDED],
        legality: WEAPON_LEGALITY.ILLEGAL,
        powerPack: true,
        notes: "High-tech weapon used by organizations like S.H.I.E.L.D. and A.I.M."
    },

    // ... Additional weapons would be defined here
};

// Ammunition types and characteristics
export const AMMUNITION_TYPES = {
    STANDARD: {
        name: "Standard",
        effect: "Normal damage",
        compatibility: ["all"]
    },
    MERCY: {
        name: "Mercy Shot",
        effect: "Remarkable Intensity knockout drug",
        compatibility: ["handgun", "rifle", "assault_rifle", "automatic_rifle"],
        special: "Requires successful damage to apply drug effect"
    },
    AP: {
        name: "Armor Piercing",
        effect: "Reduces target Body Armor by -2CS",
        compatibility: ["handgun", "sniper_rifle", "law", "bazooka"],
        special: "No effect on force fields"
    },
    // ... Additional ammo types would be defined here
};

// Helper functions for weapon system
export class WeaponSystem {
    /**
     * Calculate effective hit chance based on range
     * @param {string} baseAbility - Base ability rank
     * @param {number} range - Range in areas
     * @param {object} weapon - Weapon being used
     * @returns {string} Modified ability rank
     */
    static calculateRangeModifier(baseAbility, range, weapon) {
        // No penalty for ranged powers
        if (weapon.isPower) return baseAbility;
        
        // -1CS per area beyond first
        const rangePenalty = range - 1;
        return this.modifyRank(baseAbility, -rangePenalty);
    }

    /**
     * Calculate weapon damage
     * @param {number} baseDamage - Weapon's base damage
     * @param {string} ammoType - Type of ammunition used
     * @param {object} target - Target being hit
     * @returns {number} Final damage amount
     */
    static calculateDamage(baseDamage, ammoType, target) {
        let finalDamage = baseDamage;
        
        // Handle special ammunition effects
        switch(ammoType) {
            case "explosive":
                finalDamage *= 2;
                break;
            case "rubber":
                // Convert to slugfest damage
                // Ignore Slam results
                break;
            case "ap":
                // Handled in armor calculation
                break;
        }
        
        return finalDamage;
    }

    /**
     * Check if weapon is legal for character
     * @param {object} weapon - Weapon to check
     * @param {object} character - Character attempting to use weapon
     * @returns {boolean} Whether weapon is legal for character
     */
    static isLegalForCharacter(weapon, character) {
        // Military weapons only legal for military/authorized personnel
        if (weapon.legality === WEAPON_LEGALITY.MILITARY) {
            return character.hasAuthorization("military");
        }
        
        // Illegal weapons always illegal for normal characters
        if (weapon.legality === WEAPON_LEGALITY.ILLEGAL) {
            return false;
        }
        
        return true;
    }

    /**
     * Calculate resource cost for weapon purchase
     * @param {object} weapon - Weapon to purchase
     * @param {boolean} blackMarket - Whether purchasing from black market
     * @returns {string} Required resource rank
     */
    static getPurchaseDifficulty(weapon, blackMarket) {
        let rank = weapon.price;
        
        // Black market purchases are +1CS
        if (blackMarket) {
            rank = this.modifyRank(rank, 1);
        }
        
        return rank;
    }
}
