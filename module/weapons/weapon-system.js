/**
 * @file weapon-system.js
 * Implements the FASERIP weapon system for Foundry VTT
 */

/**
 * Enum for weapon attack types
 * @readonly
 * @enum {string}
 */
const WEAPON_TYPES = {
    SHOOTING: 'S',      // Standard shooting weapons
    FORCE: 'F',         // Force/impact weapons
    ENERGY: 'E',        // Energy weapons like lasers
    EDGED_ATTACK: 'EA', // Melee edged weapons
    EDGED_THROWING: 'ET', // Thrown edged weapons
    BLUNT_ATTACK: 'BA', // Melee blunt weapons
    BLUNT_THROWING: 'BT'  // Thrown blunt weapons
};

/**
 * Rank values and names
 * @readonly
 * @enum {Object}
 */
const RANKS = {
    'Fe': { name: 'Feeble', value: 2 },
    'Pr': { name: 'Poor', value: 4 }, 
    'Ty': { name: 'Typical', value: 6 },
    'Gd': { name: 'Good', value: 10 },
    'Ex': { name: 'Excellent', value: 20 },
    'Rm': { name: 'Remarkable', value: 30 },
    'In': { name: 'Incredible', value: 40 },
    'Am': { name: 'Amazing', value: 50 },
    'Mn': { name: 'Monstrous', value: 75 },
    'Un': { name: 'Unearthly', value: 100 }
};

/**
 * Shooting weapon definitions, with corrected price/range columns
 * @readonly
 * @enum {Object}
 */
const SHOOTING_WEAPONS = {
    CHEAP_HANDGUN: {
        name: 'Cheap Handgun',
        range: 2,        // Fe range
        price: 'Fe',     // Fe resource rank 
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 6,
        material: 'Pr',
        notes: ['One-handed', 'No special ammo']
    },
    HANDGUN: {
        name: 'Handgun/Pistol', 
        range: 3,
        price: 'Ty',
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: [6, 8, 9],
        material: 'Ex',
        notes: ['One-handed']
    },
    TARGET_PISTOL: {
        name: 'Target Pistol',
        range: 5,
        price: 'Ty', 
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 1,
        material: 'Ex',
        notes: ['One-handed', 'No range penalty with two hands']
    },
    VARIABLE_PISTOL: {
        name: 'Variable Pistol',
        range: 3,
        price: 'Gd',
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: [6, 8, 9],
        material: 'Ex',
        notes: ['One-handed', 'Can change ammo type in field']
    },
    GYROJET_PISTOL: {
        name: 'GyroJet Pistol',
        range: 5,
        price: 'Ex',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 0.5,  // 1 per 2 rounds
        shots: 3,
        material: 'Gd',
        notes: ['One-handed', 'Fires gyro-jet ammo', 'Illegal']
    },
	LASER_PISTOL: {
        name: 'Laser Pistol',
        price: 10,
        range: 'Rm',
        damage: 10,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 10,
        material: 'Pr',
        notes: ['One-handed', 'Power pack', 'Illegal']
    },
    STUN_PISTOL: {
        name: 'Stun Pistol',
        price: 2,
        range: 'Rm',
        damage: 0,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 10,
        material: 'Pr',
        special: 'Typical Intensity stunning',
        notes: ['One-handed', 'Power pack']
    },
    CONCUSSION_PISTOL: {
        name: 'Concussion Pistol',
        price: 4,
        range: 'In',
        damage: 10,
        type: WEAPON_TYPES.FORCE,
        rate: 1,
        shots: 5,
        material: 'Ty',
        notes: ['One-handed', 'Power pack', 'Illegal']
    },
    PLASMA_BEAM_HANDGUN: {
        name: 'Plasma Beam Handgun',
        price: 7,
        range: 'Am',
        damage: 20,
        type: WEAPON_TYPES.FORCE,
        rate: 1,
        shots: 10,
        material: 'Ex',
        notes: ['One-handed', 'Power pack']
    },
    MACHINE_PISTOL: {
        name: 'Machine Pistol',
        price: 3,
        range: 'Ex',
        damage: 20,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 6,
        material: 'Ex',
        notes: ['Bursts', 'One-handed', 'Military']
    },

    // Rifles
    RIFLE: {
        name: 'Rifle',
        price: 10,
        range: 'Ty',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 4,
        material: 'Gd'
    },
    HUNTING_RIFLE: {
        name: 'Hunting Rifle',
        price: 10,
        range: 'Gd',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: [6, 7, 8],
        material: 'Gd'
    },
    SNIPER_RIFLE: {
        name: 'Sniper Rifle',
        price: 10,
        range: 'Gd',
        damage: 15,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 1,
        material: 'Gd',
        notes: ['Two-handed']
    },
	ASSAULT_RIFLE: {
        name: 'Assault Rifle',
        price: 7,
        range: 'Ex',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 2,
        shots: 20,
        material: 'Gd',
        notes: ['Military']
    },
    LASER_RIFLE: {
        name: 'Laser Rifle',
        price: 4,
        range: 'Rm',
        damage: 20,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 20,
        material: 'Ty',
        notes: ['Power pack', 'Illegal']
    },
    STUN_RIFLE: {
        name: 'Stun Rifle',
        price: 5,
        range: 'Rm',
        special: 'Remarkable Intensity stunning',
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 20,
        material: 'Ty',
        notes: ['Power pack', 'Illegal']
    },
    CONCUSSION_RIFLE: {
        name: 'Concussion Rifle',
        price: 7,
        range: 'Rm',
        damage: 10,
        type: WEAPON_TYPES.FORCE,
        rate: 1,
        shots: 12,
        material: 'Gd',
        notes: ['Power pack', 'Illegal']
    },
    AUTOMATIC_RIFLE: {
        name: 'Automatic Rifle',
        price: 5,
        range: 'Ex',
        damage: 15,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 20,
        material: 'Gd',
        notes: ['Military', 'Bursts']
    },

    // Heavy Weapons
    SHOTGUN: {
        name: 'Shotgun',
        price: 3,
        range: 'Gd',
        damage: 20,
        type: WEAPON_TYPES.SHOOTING,
        rate: [1, 2],
        shots: 2,
        material: 'Gd',
        notes: ['Bursts']
    },
    RIOT_GUN: {
        name: 'Riot Gun',
        price: 2,
        range: 'Gd',
        damage: 15,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 6,
        material: 'Ex',
        notes: ['Fire one-handed at -1CS']
    },
    GRENADE_LAUNCHER: {
        name: 'Grenade Launcher',
        price: 4,
        range: 'Ex',
        special: 'Varies by grenade type',
        type: WEAPON_TYPES.SHOOTING,
        rate: 0.5, // 1 per 2 rounds
        shots: 1,
        material: 'Gd',
        notes: ['Military']
    },
    SUB_MACHINE_GUN: {
        name: 'Sub-Machine Gun',
        price: 7,
        range: 'Rm',
        damage: 25,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 7,
        material: 'Gd',
        notes: ['Fire one-handed at -2CS', 'Bursts', 'Military']
    },
    MACHINE_GUN: {
        name: 'Machine Gun',
        price: 10,
        range: 'In',
        damage: 30,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 20,
        material: 'Gd',
        notes: ['Bursts', 'Military']
    },
    FLAMETHROWER: {
        name: 'Flamethrower',
        price: 2,
        range: 'In',
        damage: 30,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 5,
        material: 'Ty/Gd',
        notes: ['Fire burns for 10 points/damage/round', 'Scatters', 'Military']
    },
    BAZOOKA: {
        name: 'Bazooka',
        price: 4,
        range: 'In',
        damage: 40,
        type: WEAPON_TYPES.SHOOTING,
        rate: 0.5, // 1 per 2 rounds
        shots: 1,
        material: 'Gd',
        notes: ['Two men to fire', 'Military']
    },
    LAW: {
        name: 'LAW',
        price: 4,
        range: 'Am',
        damage: 40,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 6,
        material: 'Gd',
        notes: ['Military']
    },

    // Artillery
    LIGHT_ARTILLERY: {
        name: 'Light Artillery',
        price: 10,
        range: 'Am',
        damage: 40,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 20,
        material: 'Ex',
        notes: ['Two men to operate', 'Military']
    },
    STUN_CANNON: {
        name: 'Stun Cannon',
        price: 10,
        range: 'Am',
        special: 'Incredible Intensity stunning',
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 10,
        material: 'Rm',
        notes: ['Two men to fire', 'One-man firing at -1CS', 'Bursts', 'Power pack']
    },
    CONCUSSION_CANNON: {
        name: 'Concussion Cannon',
        price: 15,
        range: 'Am',
        damage: 40,
        type: WEAPON_TYPES.FORCE,
        rate: 1,
        shots: 10,
        material: 'Rm',
        notes: ['Power pack']
    },
    LASER_CANNON: {
        name: 'Laser Cannon',
        price: 20,
        range: 'Am',
        damage: 30,
        type: WEAPON_TYPES.ENERGY,
        rate: 1,
        shots: 10,
        material: 'Ex',
        notes: ['Power pack']
    },
    HEAVY_ARTILLERY: {
        name: 'Heavy Artillery',
        price: 40,
        range: 'Mn',
        damage: 50,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 30,
        material: 'Rm',
        notes: ['Two men to fire', 'Scatters', 'Military']
    },
    SUPERHEAVY_ARTILLERY: {
        name: 'Superheavy Artillery',
        price: 80,
        range: 'Un',
        damage: 50,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 30,
        material: 'In',
        notes: ['Stationary', 'Two men to fire', 'Military']
    },
    MISSILE_LAUNCHER: {
        name: 'Missile Launcher',
        price: 0, // Varies by missile type
        range: 'In',
        special: 'Varies by missile type',
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 10,
        material: 'Rm',
        notes: ['Fires missiles of various capabilities', 'Military']
    },

    // Bows
    REGULAR_BOW: {
        name: 'Regular Bow',
        price: 5,
        range: 'Pr',
        damage: 6,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 1,
        material: 'Pr',
        notes: ['Two-handed']
    },
    LONG_BOW: {
        name: 'Long Bow',
        price: 6,
        range: 'Ty',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 1,
        material: 'Ty',
        notes: ['Two-handed']
    },
    COMPOUND_BOW: {
        name: 'Compound Bow',
        price: 7,
        range: 'Ex',
        damage: 15,
        type: WEAPON_TYPES.SHOOTING,
        rate: 1,
        shots: 1,
        material: 'Gd',
        notes: ['Two-handed']
    },
    CROSSBOW: {
        name: 'Crossbow',
        price: 3,
        range: 'Gd',
        damage: 10,
        type: WEAPON_TYPES.SHOOTING,
        rate: 0.5, // 1 per 2 rounds
        shots: 1,
        material: 'Ty',
        notes: ['Fire one-handed at -2CS']
    }

};
    
/**
 * Ammunition type definitions 
 * @readonly
 * @enum {Object}
 */
const AMMUNITION_TYPES = {
    STANDARD: {
        name: 'Standard',
        weapons: ['All Handguns', 'All Rifles', 'Assault Rifle', 'Automatic Rifle', 
                 'Sub-Machine Gun', 'Machine Gun', 'Shotgun', 'Bazooka', 'LAW', 
                 'Light Artillery', 'Heavy Artillery', 'Superheavy Artillery'],
        price: 'Fe',
        amount: {
            handguns: 50,
            rifles: 50,
            assaultRifle: 30,
            automaticRifle: '20 (1 clip)',
            subMachineGun: '7 (1 clip)',
            machineGun: '20 (1 clip)',
            shotgun: 10,
            bazooka: 1,
            law: 1,
            lightArtillery: 1,
            heavyArtillery: 1,
            superheavyArtillery: 1
        }
    },
    POWER_PACK: {
        name: 'Power Pack',
        weapons: ['Pistol', 'Rifle', 'Cannon'],
        price: {
            pistol: 'Ty',
            rifle: 'Gd', 
            cannon: 'Ex'
        },
        amount: '1 pack'
    },
    MERCY_SHOT: {
        name: 'Mercy Shot',
        weapons: ['Handgun', 'Rifle', 'Assault Rifle', 'Automatic Rifle'],
        price: {
            handgun: 'Fe',
            rifle: 'Fe',
            assaultRifle: 'Fe',
            automaticRifle: 'Ty'
        },
        amount: {
            handgun: 10,
            rifle: 10,
            assaultRifle: 5,
            automaticRifle: '20 (1 clip)'
        },
        effect: 'Remarkable Intensity knock-out drug'
    },
    
	AP_SHOT: {
        name: 'AP Shot',
        weapons: ['Handgun', 'Sniper Rifle', 'LAW', 'Bazooka'],
        price: 'Fe',
        amount: {
            handgun: '10 rounds',
            sniperRifle: '10 rounds',
            heavyWeapons: '1 round'
        },
        effect: 'Reduces Body Armor by 2CS'
    },
    RUBBER_SHOT: {
        name: 'Rubber Shot',
        weapons: ['Handgun', 'Rifle'],
        price: 'Fe',
        amount: {
            handgun: '40 rounds',
            rifle: '40 rounds'
        },
        effect: 'Inflicts slugfest damage, ignore Slam results'
    },
    EXPLOSIVE_SHOT: {
        name: 'Explosive Shot',
        weapons: ['Handgun', 'Rifle', 'Bazooka'],
        price: {
            handgun: 'Ty',
            rifle: 'Ty',
            bazooka: 'Gd'
        },
        amount: {
            handgun: '10 rounds',
            rifle: '10 rounds',
            bazooka: '1 round'
        },
        effect: 'Inflicts twice normal damage'
    },
    CANISTER_SHOT: {
        name: 'Canister Shot',
        weapons: ['LAW', 'Bazooka', 'Riot gun', 'Light Artillery', 'Heavy Artillery', 'Superheavy Artillery'],
        price: {
            riotGun: 'Gd',
            lightArtillery: 'Gd',
            heavyArtillery: 'Ex',
            superheavyArtillery: 'Rm'
        },
        amount: '1 round',
        variants: {
            gas: 'Incredible Intensity Tear Gas, Cover one area',
            knockout: 'Remarkable Intensity Knock-Out gas, Cover one area',
            smoke: 'Excellent Intensity smoke, Cover one area',
            explosive: 'Double damage to target area, normal to adjacent',
            incendiary: 'Burns at weapon damage Intensity for 1-10 rounds'
        }
    },
    GYROJET: {
        name: 'Gyrojet',
        weapons: ['Gyro-jet Pistol'],
        variants: {
            standard: {
                price: 'Pr',
                amount: '5 rounds'
            },
            explosive: {
                price: 'Pr',
                amount: '1 round'
            },
            heatSeeker: {
                price: 'Pr',
                amount: '1 round'
            },
            explosiveHeatSeeker: {
                price: 'Gd',
                amount: '1 round'
            }
        }
    },
};

/**
 * Manages weapon functionality for FASERIP system
 */
class WeaponSystem {
    constructor() {
        this.weapons = SHOOTING_WEAPONS;
        this.ranks = RANKS;
        this.types = WEAPON_TYPES;
        this.ammunition = AMMUNITION_TYPES;
    }

    /**
     * Calculate range modifier for a weapon
     * @param {number} range - Areas of distance to target
     * @param {number} baseRange - Weapon's base range
     * @returns {number} Column shift modifier
     */
    getRangeModifier(range, baseRange) {
        // -1CS per area beyond first
        const areasBeyondFirst = range - 1;
        return areasBeyondFirst > 0 ? -areasBeyondFirst : 0;
    }

    /**
     * Calculate weapon damage based on strength and material
     * @param {Object} weapon - Weapon data
     * @param {number} strength - Wielder's strength value
     * @returns {number} Final damage value
     */
    getWeaponDamage(weapon, strength) {
        // Minimum of listed damage, maximum of strength or material
        const baseDamage = weapon.damage;
        const materialStrength = this.ranks[weapon.material].value;
        const maxDamage = Math.min(strength, materialStrength);
        return Math.max(baseDamage, maxDamage);
    }

    /**
     * Get ammunition effects for a weapon
     * @param {string} ammoType - Type of ammunition
     * @param {number} baseDamage - Weapon's base damage
     * @returns {Object} Ammunition effects
     */
    getAmmunitionEffect(ammoType, baseDamage) {
        const ammo = this.ammunition[ammoType];
        if (!ammo) return { damage: baseDamage };
        
        return {
            damage: ammo.effect?.includes('twice') ? baseDamage * 2 : baseDamage,
            special: ammo.effect,
            variants: ammo.variants
        };
    }

    /**
     * Check if weapon is restricted or illegal
     * @param {Object} weapon - Weapon data
     * @returns {boolean} True if weapon is restricted
     */
    isRestricted(weapon) {
        return weapon.notes?.some(note => 
            note.includes('Illegal') || note.includes('Military')
        );
    }

    /**
     * Get compatible ammunition types for a weapon
     * @param {string} weaponName - Name of the weapon
     * @returns {Array} List of compatible ammo types
     */
    getCompatibleAmmo(weaponName) {
        return Object.entries(this.ammunition)
            .filter(([_, ammo]) => 
                ammo.weapons.some(w => 
                    w === weaponName || 
                    w.includes('All') && weaponName.toLowerCase().includes(w.split(' ')[1].toLowerCase())
                )
            )
            .map(([key, _]) => key);
    }
}

export default WeaponSystem;