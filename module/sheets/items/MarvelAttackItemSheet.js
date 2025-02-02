/**
 * @extends {ItemSheet}
 */
export class MarvelAttackItemSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "item", "attack"],
            template: "systems/marvel-faserip/templates/items/attack-item.html",
            width: 500,
            height: 400,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();

        context.system = context.item.system;
        context.abilities = {
            fighting: "Fighting",
            agility: "Agility",
            strength: "Strength",
            endurance: "Endurance"
        };
        context.attackTypes = {
            BLUNT: "Blunt Attack",
            EDGED: "Edged Attack",
            SHOOTING: "Shooting",
            THROWING: "Throwing"
        };

        return context;
    }
}