import { MARVEL_RANKS } from "../config.js";

export class MarvelActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "actor"],
            template: "systems/marvel-faserip/templates/actor/actor-sheet.html",
            width: 600,
            height: 800,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
        });
    }

    async getData(options={}) {
        const context = await super.getData(options);
        
        // Add configuration
        context.config = {
            ranks: Object.keys(MARVEL_RANKS)
        };
        
        // Ensure lists exist and are initialized properly
        const system = context.actor.system;
        
        // Initialize powers if needed
        if (!system.powers) system.powers = { list: [], limitation: "" };
        if (!Array.isArray(system.powers.list)) system.powers.list = [];
        
        // Initialize talents if needed
        if (!system.talents) system.talents = { list: [] };
        if (!Array.isArray(system.talents.list)) system.talents.list = [];
        
        // Initialize contacts if needed
        if (!system.contacts) system.contacts = { list: [] };
        if (!Array.isArray(system.contacts.list)) system.contacts.list = [];
        
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (this.isEditable) {
            html.find('.add-power').click(this._onAddPower.bind(this));
            html.find('.add-talent').click(this._onAddTalent.bind(this));
            html.find('.add-contact').click(this._onAddContact.bind(this));
            html.find('.rank-select').change(this._onRankChange.bind(this));
            html.find('.item-delete').click(this._onItemDelete.bind(this));

            // Add karma tracking handlers
            html.find('.karma-pool-input').change(this._onKarmaPoolChange.bind(this));
            html.find('.advancement-fund-input').change(this._onAdvancementFundChange.bind(this));
        }

        // Add ability roll handlers
        html.find('.ability-label').click(this._onAbilityRoll.bind(this));
    }

    async _onRankChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityPath = element.dataset.ability;
        const newRank = element.value;
        
        // Get the rank number
        const rankNumber = MARVEL_RANKS[newRank]?.standard || 0;
        
        // Update both rank and number
        await this.actor.update({
            [`system.${abilityPath}.rank`]: newRank,
            [`system.${abilityPath}.number`]: rankNumber
        });
    }

    async _onAddPower(event) {
        event.preventDefault();
        
        // Get current powers list or initialize it
        const powers = foundry.utils.getProperty(this.actor.system, "powers.list") || [];
        
        // Create new powers array with additional power
        const newPowers = powers.concat([{
            name: "",
            rank: "",
            number: 0
        }]);
        
        // Update the actor
        await this.actor.update({
            "system.powers.list": newPowers
        });
    }

/** @override */
async _updateObject(event, formData) {
    // Ensure the lists are properly handled
    const expandedData = foundry.utils.expandObject(formData);
    
    // Handle powers list
    if (expandedData.system?.powers?.list) {
        const powers = Object.values(expandedData.system.powers.list);
        expandedData.system.powers.list = powers;
    }
    
    // Handle talents list
    if (expandedData.system?.talents?.list) {
        const talents = Object.values(expandedData.system.talents.list);
        expandedData.system.talents.list = talents;
    }
    
    // Handle contacts list
    if (expandedData.system?.contacts?.list) {
        const contacts = Object.values(expandedData.system.contacts.list);
        expandedData.system.contacts.list = contacts;
    }
    
    // Update the actor
    return await super._updateObject(event, expandedData);
}
    async _onAddTalent(event) {
        event.preventDefault();
        
        // Get current talents list or initialize it
        const talents = foundry.utils.getProperty(this.actor.system, "talents.list") || [];
        
        // Create new talents array with additional talent
        const newTalents = talents.concat([{
            name: ""
        }]);
        
        // Update the actor
        await this.actor.update({
            "system.talents.list": newTalents
        });
    }

    async _onAddContact(event) {
        event.preventDefault();
        
        // Get current contacts list or initialize it
        const contacts = foundry.utils.getProperty(this.actor.system, "contacts.list") || [];
        
        // Create new contacts array with additional contact
        const newContacts = contacts.concat([{
            name: ""
        }]);
        
        // Update the actor
        await this.actor.update({
            "system.contacts.list": newContacts
        });
    }

    async _onItemDelete(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const type = button.dataset.type;
        const idx = parseInt(button.dataset.id);

        // Get the current list
        const currentList = foundry.utils.getProperty(this.actor.system, `${type}.list`) || [];
        
        // Make sure we have an array
        if (!Array.isArray(currentList)) return;
        
        // Remove the item at the specified index
        const updatedList = currentList.filter((_, index) => index !== idx);
        
        // Update the actor with the new list
        await this.actor.update({
            [`system.${type}.list`]: updatedList
        });
    }

    async _onKarmaPoolChange(event) {
        event.preventDefault();
        const value = Number(event.currentTarget.value);
        await this.actor.update({
            "system.karmaTracking.karmaPool": value
        });
    }

    async _onAdvancementFundChange(event) {
        event.preventDefault();
        const value = Number(event.currentTarget.value);
        await this.actor.update({
            "system.karmaTracking.advancementFund": value
        });
    }

    async _onAbilityRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityId = element.closest('.ability-row').dataset.ability;
        
        // Get stored values
        const stored = await game.user.getFlag("world", "marvelRollOptions") || {
            featType: "ability",
            actionType: "BA",
            columnShift: 0,
            karmaPoints: 0
        };
        
        // Prepare template data
        const templateData = {
            config: CONFIG.marvel,
            defaultFeatType: stored.featType,
            defaultAction: stored.actionType,
            columnShift: stored.columnShift,
            karmaPoints: stored.karmaPoints,
            showActionSelect: stored.featType === "combat",
            actionTypes: CONFIG.marvel.actionResults
        };
        
        // Render dialog
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/ability-roll.html",
            templateData
        );
        
        return new Promise(resolve => {
            const dialog = new Dialog({
                title: "FEAT Roll",
                content: html,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: async (html) => {
                            const form = html[0].querySelector("form");
                            const featType = form.querySelector('input[name="featType"]:checked').value;
                            const options = {
                                featType: featType,
                                actionType: featType === "combat" ? form.actionType.value : null,
                                columnShift: parseInt(form.columnShift.value) || 0,
                                karmaPoints: parseInt(form.karmaPoints.value) || 0
                            };
                            
                            // Store values for next time
                            await game.user.setFlag("world", "marvelRollOptions", options);
                            
                            // Perform the roll
                            await this.actor.rollAbility(abilityId, options);
                            resolve(true);
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(false)
                    }
                },
                default: "roll",
                render: (html) => {
                    // Add listeners for feat type changes
                    const radioButtons = html[0].querySelectorAll('input[name="featType"]');
                    radioButtons.forEach(radio => {
                        radio.addEventListener('change', (event) => {
                            const actionSelect = html[0].querySelector('.action-select');
                            if (event.currentTarget.value === "combat") {
                                actionSelect.style.display = "";
                            } else {
                                actionSelect.style.display = "none";
                            }
                        });
                    });
                }
            }).render(true);
        });
    }
}