export class MarvelPowerItemSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "item", "power"],
            template: "systems/marvel-faserip/templates/items/power-item.html",
            width: 500,
            height: 400,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.system = context.item.system;
        context.config = CONFIG.marvel;
        return context;
    }
}