// module/item/MarvelHeadquartersItem.js

/**
 * Extend the base Item document to support headquarters specific data.
 * @extends {Item}
 */
export class MarvelHeadquartersItem extends Item {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            type: new fields.StringField({initial: "headquarters"}),
            size: new fields.StringField(),
            materialStrength: new fields.StringField(),
            cost: new fields.SchemaField({
                rent: new fields.StringField(),
                purchase: new fields.StringField()
            }),
            rooms: new fields.ObjectField(),
            security: new fields.SchemaField({
                type: new fields.StringField(),
                cost: new fields.StringField()
            }),
            defense: new fields.SchemaField({
                type: new fields.StringField(),
                cost: new fields.StringField()
            }),
            roomsUsed: new fields.NumberField({initial: 0}),
            maxRooms: new fields.NumberField({initial: 0}),
            monthlyMaintenance: new fields.NumberField({initial: 0})
        };
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "item", "headquarters"]
        });
    }

    /** @override */
    static get schema() {
        return {
            type: "headquarters",
            template: {
                description: String,
                rules: String
            },
            size: String,
            materialStrength: String,
            type: String,
            cost: {
                type: Object,
                default: {
                    rent: "",
                    purchase: ""
                }
            },
            rooms: {
                type: Array,
                default: []
            },
            security: {
                type: Object,
                default: {
                    type: "",
                    cost: ""
                }
            },
            defense: {
                type: Object,
                default: {
                    type: "",
                    cost: ""
                }
            },
            roomsUsed: {
                type: Number,
                default: 0
            },
            maxRooms: {
                type: Number,
                default: 0
            },
            monthlyMaintenance: {
                type: Number,
                default: 0
            }
        };
    }

    /** @override */
    prepareData() {
        super.prepareData();
        const itemData = this.system;

        // Make sure all properties exist
        if (!itemData.rooms) itemData.rooms = [];
        if (!itemData.cost) {
            itemData.cost = {
                rent: "",
                purchase: ""
            };
        }
        if (!itemData.security) {
            itemData.security = {
                type: "",
                cost: ""
            };
        }
        if (!itemData.defense) {
            itemData.defense = {
                type: "",
                cost: ""
            };
        }

        // Initialize numeric values
        itemData.roomsUsed = itemData.roomsUsed || 0;
        itemData.maxRooms = itemData.maxRooms || 0;
        itemData.monthlyMaintenance = itemData.monthlyMaintenance || 0;

        // Calculate rooms used and max rooms based on size
        this._calculateRoomMetrics();
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        
        // Set default icon if none provided
        if (!this.img || this.img === "icons/svg/item-bag.svg") {
            this.updateSource({img: "icons/svg/house.svg"});
        }
    }

    /**
     * Calculate room metrics based on size and installed rooms
     * @private
     */
    _calculateRoomMetrics() {
        const data = this.system;
        
        // Calculate rooms used
        let roomsUsed = 0;
        if (data.rooms && Array.isArray(data.rooms)) {
            roomsUsed = data.rooms.reduce((total, room) => {
                const roomData = CONFIG.marvel.ROOM_PACKAGES[room.type];
                return total + (roomData ? roomData.size : 0);
            }, 0);
        }
        data.roomsUsed = roomsUsed;

        // Set max rooms based on size
        switch (data.size) {
            case "Small":
                data.maxRooms = 3;
                break;
            case "Mid-sized":
                data.maxRooms = 5;
                break;
            case "Large":
                data.maxRooms = 10;
                break;
            case "Deluxe":
                data.maxRooms = 20;
                break;
            default:
                data.maxRooms = 0;
        }
    }
}