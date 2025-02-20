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
        const rooms = this.item.system.rooms;
        return Object.entries(rooms)
            .filter(([key, room]) => room.installed)
            .reduce((total, [key, room]) => {
                const packageData = CONFIG.marvel.ROOM_PACKAGES[key];
                return total + (packageData?.size || 0);
            }, 0);
    }

    _getMaxRooms() {
        const type = this.item.system.type;
        const sizeMap = {
            "Small": 5,
            "Mid-sized": 10,
            "Large": 20,
            "Deluxe": 30
        };
        return sizeMap[CONFIG.marvel.HQ_TYPES[type]?.size] || 0;
    }

    _calculateMonthlyCost() {
        // Implementation would calculate total monthly cost based on:
        // - Base HQ rent
        // - Room package costs
        // - Security costs
        // - Defense costs
        return ""; // TODO: Implement cost calculation
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        // Your existing listeners
        html.find('.package-item input[type="checkbox"]').change(this._onRoomToggle.bind(this));
        html.find('.hq-type-select').change(this._onHQTypeChange.bind(this));
        html.find('select[name="system.security.type"]').change(this._onSecurityChange.bind(this));
        html.find('select[name="system.defense.type"]').change(this._onDefenseChange.bind(this));

        // Add upgrade listeners
        html.find('.upgrade-option input[type="checkbox"]').change(this._onUpgradeToggle.bind(this));
    }

    // Your existing event handlers, plus:

    async _onUpgradeToggle(event) {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const [roomKey, upgradeKey] = checkbox.name.split('.').slice(-2);
        
        await this.item.update({
            [`system.rooms.${roomKey}.upgrades.${upgradeKey}`]: checkbox.checked
        });
    }
}