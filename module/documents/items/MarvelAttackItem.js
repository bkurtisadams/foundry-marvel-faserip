import { MarvelAttackItemSheet } from "../../sheets/items/MarvelAttackItemSheet.js";

/**
 * Extends the basic Item class for attack items.
 * @extends {Item}
 */
export class MarvelAttackItem extends Item {
    /**
     * @override
     * Create a new sheet for the item
     */
    _getSheetClass() {
        return MarvelAttackItemSheet;
    }

    /**
     * Roll the attack
     * @returns {Promise<Roll>} The roll result
     */
    async roll() {
        if (!this.actor) {
            ui.notifications.error("This item is not owned by an actor.");
            return null;
        }
    
        // Validate required data
        if (!this.system.ability || !this.system.attackType) {
            ui.notifications.error("Attack item is missing required data.");
            return null;
        }
    
        try {
            // Get stored roll options
            const stored = await game.user.getFlag("world", "marvelRollOptions") || {
                columnShift: this.system.columnShift || 0,
                karmaPoints: 0
            };
    
            // Show roll dialog
            const template = "systems/marvel-faserip/templates/dialogs/ability-roll.html";
            const dialogData = {
                config: CONFIG.marvel,
                columnShift: stored.columnShift,
                karmaPoints: stored.karmaPoints,
                showActionSelect: false,
                item: this
            };
    
            const html = await renderTemplate(template, dialogData);
    
            return new Promise(resolve => {
                new Dialog({
                    title: `${this.name} Attack Roll`,
                    content: html,
                    buttons: {
                        roll: {
                            label: "Roll",
                            callback: async (html) => {
                                try {
                                    const form = html.find("form")[0];
                                    if (!form) throw new Error("Form not found in dialog");
    
                                    const options = {
                                        columnShift: (parseInt(form.columnShift.value) || 0) + (this.system.columnShift || 0),
                                        karmaPoints: parseInt(form.karmaPoints.value) || 0,
                                        weaponDamage: this.system.weaponDamage,
                                        range: this.system.range,
                                        itemId: this.id  // Add itemId to prevent double processing
                                    };
    
                                    // Store options for next time
                                    await game.user.setFlag("world", "marvelRollOptions", {
                                        columnShift: parseInt(form.columnShift.value) || 0,
                                        karmaPoints: parseInt(form.karmaPoints.value) || 0
                                    });
    
                                    // Get targets
                                    const targets = game.user.targets;
                                    if (!targets.size) {
                                        ui.notifications.warn("Please select a target first");
                                        resolve(null);
                                        return;
                                    }
    
                                    const target = targets.first().actor;
                                    if (!target) {
                                        ui.notifications.error("Invalid target");
                                        resolve(null);
                                        return;
                                    }
    
                                    // Use handleAttack instead of rollAttack
                                    const result = await this.actor.handleAttack(
                                        this.system.ability.toLowerCase(),
                                        this.system.attackType,
                                        options,
                                        target
                                    );
                                    resolve(result);
                                } catch (error) {
                                    console.error("Error in attack roll dialog:", error);
                                    ui.notifications.error("Error processing attack roll");
                                    resolve(null);
                                }
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            callback: () => resolve(null)
                        }
                    },
                    default: "roll"
                }).render(true);
            });
        } catch (error) {
            console.error("Error in attack roll:", error);
            ui.notifications.error("Error initiating attack roll");
            return null;
        }
    }

    /** @override */
    static get defaultIcon() {
        return "systems/marvel-faserip/assets/icons/attack.webp";
    }

    /** @override */
    prepareData() {
        super.prepareData();
       
        // Ensure system data exists
        if (!this.system) this.system = {};
        if (!this.system.ability) this.system.ability = "fighting";
        if (!this.system.attackType) this.system.attackType = "BA";  // Default to Blunt Attack
        if (!this.system.weaponDamage) this.system.weaponDamage = 0;
        if (!this.system.range) this.system.range = 0;
        if (!this.system.columnShift) this.system.columnShift = 0;
    }
}