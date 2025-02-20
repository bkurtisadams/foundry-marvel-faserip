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
                initial: "rooms"
            }]
        });
    }

    /** @override */
    getData() {
        const context = super.getData();
        const itemData = context.item;

        // Add config references
        context.HQ_TYPES = CONFIG.marvel.HQ_TYPES;
        context.ROOM_PACKAGES = CONFIG.marvel.ROOM_PACKAGES;
        context.SECURITY_PACKAGES = CONFIG.marvel.SECURITY_PACKAGES;
        
        // Calculate rooms used and max rooms
        const roomsUsed = Object.values(itemData.system.rooms)
            .filter(room => room.installed)
            .reduce((total, room) => total + (CONFIG.marvel.ROOM_PACKAGES[room.name]?.size || 0), 0);
            
        const maxRooms = CONFIG.marvel.HQ_TYPES[itemData.system.type]?.maxRooms || 0;
        
        context.roomsUsed = roomsUsed;
        context.maxRooms = maxRooms;
        
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Only add listeners if editable
        if (!this.isEditable) return;

        // Room package toggles
        html.find('.package-item input[type="checkbox"]').change(this._onRoomToggle.bind(this));
        
        // HQ type selection
        html.find('.hq-type-select').change(this._onHQTypeChange.bind(this));
        
        // Security system selection
        html.find('select[name="system.security.type"]').change(this._onSecurityChange.bind(this));
        
        // Defense system selection
        html.find('select[name="system.defense.type"]').change(this._onDefenseChange.bind(this));
    }

    async _onRoomToggle(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const roomKey = target.dataset.room;
        const isInstalled = target.checked;

        await this.item.update({
            [`system.rooms.${roomKey}.installed`]: isInstalled
        });
    }

    async _onHQTypeChange(event) {
        event.preventDefault();
        const type = event.target.value;
        const hqData = CONFIG.marvel.HQ_TYPES[type];
        
        if (!hqData) return;

        await this.item.update({
            "system.type": type,
            "system.size": hqData.size,
            "system.cost": hqData.cost,
            "system.materialStrength": hqData.material
        });
    }

    async _onSecurityChange(event) {
        event.preventDefault();
        const type = event.target.value;
        const securityData = CONFIG.marvel.SECURITY_PACKAGES[type];
        
        if (!securityData) return;

        await this.item.update({
            "system.security.type": type,
            "system.security.level": securityData.level,
            "system.security.cost": securityData.cost
        });
    }

    async _onDefenseChange(event) {
        event.preventDefault();
        const type = event.target.value;

        // Defense costs are fixed in the rules
        const defenseCosts = {
            "standard": "Ex",
            "enhanced": "Rm",
            "maximum": "In"
        };

        await this.item.update({
            "system.defense.type": type,
            "system.defense.cost": defenseCosts[type] || ""
        });
    }
}