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
    activateListeners(html) {
        super.activateListeners(html);

        // Add roll handler
        html.find('.roll-attack').click(async ev => {
            ev.preventDefault();
            return await this.item.roll();
        });
    }
    
    /** @override */
    async getData() {
        const context = await super.getData();

        context.system = context.item.system;
        
        // Abilities with their associated attacks
        context.abilities = {
            fighting: {
                label: "Fighting",
                attacks: {
                    BA: "Blunt Attack (BA)",
                    EA: "Edged Attack (EA)"
                }
            },
            agility: {
                label: "Agility",
                attacks: {
                    Sh: "Shooting (Sh)",
                    TE: "Throwing Edged (TE)",
                    TB: "Throwing Blunt (TB)",
                    En: "Energy (En)",
                    Fo: "Force (Fo)",
                    Do: "Dodging (Do)"
                }
            },
            strength: {
                label: "Strength",
                attacks: {
                    Gp: "Grappling (Gp)",
                    Gb: "Grabbing (Gb)",
                    Bl: "Blocking (Bl)"
                }
            },
            endurance: {
                label: "Endurance",
                attacks: {
                    Ch: "Charging (Ch)",
                    Es: "Escaping (Es)",
                    Ev: "Evading (Ev)",
                    St: "Stun? (St)",
                    Sl: "Slam? (Sl)",
                    Ki: "Kill? (Ki)"
                }
            }
        };

        return context;
    }
}