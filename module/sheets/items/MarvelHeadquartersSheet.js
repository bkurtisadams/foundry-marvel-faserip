// Add this to MarvelHeadquartersSheet.js before the class definition

const HQ_SCHEMA = {
    type: "", // HQ type key
    size: "", // Calculated from type
    materialStrength: "", // From type
    cost: {
        rent: "",    // Monthly rent cost
        purchase: "" // Purchase price
    },
    rooms: {}, // Will be populated with installed room packages
    security: {
        type: "",      // Security system type
        cost: ""       // Calculated cost
    },
    defense: {
        type: "",     // Defense system type
        cost: ""      // Calculated cost
    },
    monthlyMaintenance: "" // Total monthly cost
};

export class MarvelHeadquartersSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "item"],
            template: "systems/marvel-faserip/templates/item/headquarters-sheet.html",
            width: 600,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "basic"
            }]
        });
    }

    /** @override */
    getData() {
        const context = super.getData();
        const itemData = context.item;

        // Add config references
        context.config = CONFIG.marvel;
        
        // Calculate rooms used
        const roomsUsed = this._calculateRoomsUsed();
        const maxRooms = this._getMaxRooms();
        
        // Calculate monthly maintenance
        const monthlyMaintenance = this._calculateMonthlyCost();
        
        context.roomsUsed = roomsUsed;
        context.maxRooms = maxRooms;
        context.monthlyMaintenance = monthlyMaintenance;
        
        return context;
    }

    _calculateRoomsUsed() {
        const rooms = this.item.system.rooms || {};
        let totalSize = 0;
        
        for (const [key, room] of Object.entries(rooms)) {
            if (room.installed) {
                const packageData = CONFIG.marvel.ROOM_PACKAGES[key];
                if (packageData) {
                    totalSize += packageData.size;
                }
            }
        }
        
        return totalSize;
    }

    _getMaxRooms() {
        const type = this.item.system.type;
        const hqType = CONFIG.marvel.HQ_TYPES[type];
        if (!hqType) return 0;

        const sizeMap = {
            "Small": 5,
            "Mid-sized": 10,
            "Large": 20,
            "Deluxe": 30
        };

        return sizeMap[hqType.size] || 0;
    }

    _calculateMonthlyCost() {
        const system = this.item.system;
        if (!system.type) return 0;

        let totalCost = 0;
        const hqType = CONFIG.marvel.HQ_TYPES[system.type];
        
        // Add base rent cost
        if (hqType?.cost) {
            const [rentRank] = hqType.cost.split('/');
            totalCost += CONFIG.marvel.RANK_VALUES[rentRank] || 0;
        }

        // Add room costs
        if (system.rooms) {
            for (const [key, room] of Object.entries(system.rooms)) {
                if (room.installed) {
                    const packageData = CONFIG.marvel.ROOM_PACKAGES[key];
                    if (packageData) {
                        totalCost += CONFIG.marvel.RANK_VALUES[packageData.cost] || 0;
                    }

                    // Add upgrade costs
                    if (room.upgrades) {
                        for (const [upgradeKey, isInstalled] of Object.entries(room.upgrades)) {
                            if (isInstalled && packageData.upgrades?.[upgradeKey]) {
                                totalCost += CONFIG.marvel.RANK_VALUES[packageData.upgrades[upgradeKey].cost] || 0;
                            }
                        }
                    }
                }
            }
        }

        // Add security system cost
        if (system.security?.type) {
            const securitySystem = CONFIG.marvel.SECURITY_SYSTEMS[system.security.type];
            if (securitySystem?.cost) {
                totalCost += CONFIG.marvel.RANK_VALUES[securitySystem.cost] || 0;
            }
        }

        // Add defense system cost
        if (system.defense?.type) {
            const defenseSystem = CONFIG.marvel.DEFENSE_SYSTEMS[system.defense.type];
            if (defenseSystem?.cost) {
                totalCost += CONFIG.marvel.RANK_VALUES[defenseSystem.cost] || 0;
            }
        }

        // Convert numeric total back to FASERIP rank
        return this._valueToRank(totalCost);
    }

    _valueToRank(value) {
        // Convert numeric values back to FASERIP ranks
        if (value <= 0) return "Sh0";
        else if (value <= 2) return "Fe";
        else if (value <= 4) return "Pr";
        else if (value <= 6) return "Ty";
        else if (value <= 10) return "Gd";
        else if (value <= 20) return "Ex";
        else if (value <= 30) return "Rm";
        else if (value <= 40) return "In";
        else if (value <= 50) return "Am";
        else if (value <= 75) return "Mn";
        else return "Un";
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        // Handle room package toggles
        html.find('.package-item input[type="checkbox"]').change(this._onRoomToggle.bind(this));
        
        // Handle room upgrade toggles 
        html.find('.upgrade-option input[type="checkbox"]').change(this._onUpgradeToggle.bind(this));
        
        // Handle HQ type changes
        html.find('.hq-type-select').change(this._onHQTypeChange.bind(this));
        
        // Handle security/defense changes
        html.find('select[name="system.security.type"]').change(this._onSecurityChange.bind(this));
        html.find('select[name="system.defense.type"]').change(this._onDefenseChange.bind(this));
    }

    async _onRoomToggle(event) {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const roomKey = checkbox.dataset.room;
        
        // Get current rooms
        const rooms = foundry.utils.duplicate(this.item.system.rooms || {});
        
        // Update or initialize room data
        rooms[roomKey] = rooms[roomKey] || { installed: false, upgrades: {} };
        rooms[roomKey].installed = checkbox.checked;
        
        // If uninstalling, remove all upgrades
        if (!checkbox.checked) {
            rooms[roomKey].upgrades = {};
        }
        
        // Check if we have space
        const newTotal = this._calculateRoomsUsed();
        const maxRooms = this._getMaxRooms();
        
        if (newTotal > maxRooms) {
            ui.notifications.error("Not enough space for this room package!");
            return;
        }
        
        // Update the item
        await this.item.update({
            "system.rooms": rooms
        });
    }

    async _onUpgradeToggle(event) {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const [roomKey, upgradeKey] = checkbox.name.split('.').slice(-2);
        
        // Update the specific upgrade
        await this.item.update({
            [`system.rooms.${roomKey}.upgrades.${upgradeKey}`]: checkbox.checked
        });
    }

    async _onHQTypeChange(event) {
        event.preventDefault();
        const select = event.currentTarget;
        const type = select.value;
        
        const hqType = CONFIG.marvel.HQ_TYPES[type];
        if (!hqType) return;

        // Update HQ properties
        await this.item.update({
            "system.type": type,
            "system.size": hqType.size,
            "system.materialStrength": hqType.material
        });
    }

    async _onSecurityChange(event) {
        event.preventDefault();
        const select = event.currentTarget;
        const type = select.value;
        
        const security = CONFIG.marvel.SECURITY_SYSTEMS[type];
        if (!security) return;

        await this.item.update({
            "system.security.type": type,
            "system.security.cost": security.cost
        });
    }

    async _onDefenseChange(event) {
        event.preventDefault();
        const select = event.currentTarget;
        const type = select.value;
        
        const defense = CONFIG.marvel.DEFENSE_SYSTEMS[type];
        if (!defense) return;

        await this.item.update({
            "system.defense.type": type,
            "system.defense.cost": defense.cost
        });
    }
}