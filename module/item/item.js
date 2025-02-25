// module/item/item.js

export class MarvelFaseripItem extends Item {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "item"],
            template: "systems/marvel-faserip/templates/items/item-sheet.html",
            width: 530,
            height: 340,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
        });
    }

    /**
     * @override
     */
    prepareData() {
        super.prepareData();
        const itemData = this.system;
        
        // Handle different item types
        switch(this.type) {
            case "weapon":
                this._prepareWeaponData(itemData);
                break;
            case "equipment":
                this._prepareEquipmentData(itemData);
                break;
        }
    }

    /**
     * Prepare weapon-specific data
     * @private
     */
    _prepareWeaponData(itemData) {
        // Initialize weapon properties if not set
        if (!itemData.range) itemData.range = "Feeble";
        if (!itemData.damage) itemData.damage = 0;
        if (!itemData.shots) itemData.shots = 1;
        if (!itemData.maxShots) itemData.maxShots = itemData.shots;
        if (!itemData.rate) itemData.rate = 1;
        if (!itemData.type) itemData.type = "S"; // Shooting
        if (!itemData.ammoType) itemData.ammoType = "standard";
        if (!itemData.material) itemData.material = "Poor";
        if (!itemData.powerPack) itemData.powerPack = false;
        if (!itemData.powerPackCharge) itemData.powerPackCharge = 0;
        if (!itemData.powerPackMaxCharge) itemData.powerPackMaxCharge = 10;
    }

    /**
     * Prepare equipment-specific data
     * @private
     */
    _prepareEquipmentData(itemData) {
        // Initialize equipment properties if not set
        if (!itemData.type) itemData.type = "";
        if (!itemData.range) itemData.range = "Fe";
        if (!itemData.damage) itemData.damage = 0;
        if (!itemData.rate) itemData.rate = 1;
        if (!itemData.shots) itemData.shots = 0;
        if (!itemData.material) itemData.material = "Ty";
    }

    /**
     * Handle attack rolls for weapons and equipment
     * @param {Object} options Attack options
     * @returns {Promise} Promise that resolves with attack results
     */
    async rollAttack(options = {}) {
        if (!this.actor) return null;

        const itemData = this.system;
        
        // Determine ability based on weapon/equipment type
        let ability;
        switch(itemData.type) {
            case "S":  // Shooting
            case "ET": // Edged Thrown
            case "BT": // Blunt Thrown
                ability = "agility";
                break;
            case "F":  // Force
            case "BA": // Blunt Attack
            case "EA": // Edged Attack
                ability = "fighting";
                break;
            case "E":  // Energy
                ability = "reason";
                break;
            default:
                ability = "fighting";
        }

        // Check ammunition for weapons
        if (this.type === "weapon" && !this.canFire()) {
            ui.notifications.warn("Weapon is out of ammunition!");
            return null;
        }

        // Calculate range penalties
        const range = options.range || 1;
        const baseRank = this.actor.system.primaryAbilities[ability].rank;
        const modifiedRank = this._calculateRangeModifier(baseRank, range);

        // Perform the attack roll
        const roll = await this.actor.rollAbility(ability, {
            featType: "combat",
            actionType: itemData.type,
            rank: modifiedRank,
            ...options
        });

        // Handle ammunition/charges
        if (roll && this.type === "weapon" && itemData.shots > 0) {
            await this.update({
                "system.shots": Math.max(0, itemData.shots - 1)
            });
        }

        return roll;
    }

    /**
     * Calculate range penalty
     * @private
     */
    _calculateRangeModifier(baseRank, range) {
        // No penalty for first area
        if (range <= 1) return baseRank;
        
        // -1CS per area beyond first
        const penalty = -(range - 1);
        return this._modifyRank(baseRank, penalty);
    }

    /**
     * Check if weapon can fire
     * @returns {boolean} Whether weapon can fire
     */
    canFire() {
        const itemData = this.system;
        
        // Check standard ammunition
        if (itemData.shots === 0) return false;
        
        // Check power pack
        if (itemData.powerPack && itemData.powerPackCharge === 0) return false;
        
        return true;
    }

    /**
     * Handle reload
     * @returns {Promise} Promise that resolves when reload complete
     */
    async reload() {
        const itemData = this.system;
        
        // Handle power pack recharge
        if (itemData.powerPack) {
            return this.update({
                "system.powerPackCharge": itemData.powerPackMaxCharge,
                "system.shots": itemData.powerPackMaxCharge
            });
        }

        // Handle standard ammunition reload
        return this.update({
            "system.shots": itemData.maxShots
        });
    }

    /**
     * Modify rank by column shifts
     * @private
     */
    _modifyRank(rank, shifts) {
        const ranks = [
            "Shift 0", "Feeble", "Poor", "Typical", "Good", "Excellent",
            "Remarkable", "Incredible", "Amazing", "Monstrous", "Unearthly"
        ];
        
        const currentIndex = ranks.indexOf(rank);
        if (currentIndex === -1) return rank;
        
        const newIndex = Math.max(0, Math.min(currentIndex + shifts, ranks.length - 1));
        return ranks[newIndex];
    }
}

// Register the item class
CONFIG.Item.documentClass = MarvelFaseripItem;