import { MARVEL_RANKS } from "../config.js";

export class MarvelActorSheet extends ActorSheet {
    /** @override */
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
        
        // Get attacks
        context.attacks = context.items.filter(item => item.type === "attack");

        // Add configuration
        context.config = {
            ranks: Object.entries(CONFIG.marvel.ranks).reduce((obj, [key]) => {
                obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
                return obj;
            }, {})
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
            // These need to be bound to this
            html.find('.add-power').click(this._onAddPower.bind(this));
            html.find('.add-talent').click(this._onAddTalent.bind(this));
            html.find('.add-contact').click(this._onAddContact.bind(this));
            html.find('.ability-number').change(this._onNumberChange.bind(this));
            html.find('.rank-select').change(this._onRankChange.bind(this));
            html.find('.add-attack').click(this._onAddAttack.bind(this));
            html.find('.roll-attack').click(this._onRollAttack.bind(this));
            
            // These can use arrow functions
            html.find('.item-edit').click(ev => {
                ev.preventDefault();
                const attackRow = ev.currentTarget.closest(".attack-row");
                if (!attackRow) return;
                const itemId = attackRow.dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                return item.sheet.render(true);
            });
            
            html.find('.item-delete').click(ev => {
                const li = $(ev.currentTarget).parents(".attack-row");
                const item = this.actor.items.get(li.data("itemId"));
                if (item) item.delete();
            });
        }

        // Add ability roll handlers
        html.find('.ability-label').click(this._onAbilityRoll.bind(this));
    }

    async _onAddAttack(event) {
        event.preventDefault();

        // Build abilities and their attacks from actionResults
        const abilities = {};
        for (const [code, action] of Object.entries(CONFIG.marvel.actionResults)) {
            const abilityName = action.ability.toLowerCase();
            if (!abilities[abilityName]) {
                abilities[abilityName] = {
                    label: action.ability,
                    attacks: {}
                };
            }
            abilities[abilityName].attacks[code] = action.name;
        }

        const template = "systems/marvel-faserip/templates/dialogs/add-attack.html";
        const html = await renderTemplate(template, { abilities });

        return new Dialog({
            title: "Add Attack",
            content: html,
            buttons: {
                create: {
                    label: "Create",
                    callback: async (dialogHtml) => {
                        const form = dialogHtml.find("form")[0];
                        if (!form) {
                            console.error("Form element not found in dialog!");
                            return;
                        }

                        // Get form values
                        const formData = new FormData(form);
                        console.log("Form values:", Object.fromEntries(formData.entries()));

                        const data = {
                            name: formData.get("attackName"),
                            type: "attack",
                            system: {
                                ability: formData.get("ability").toLowerCase(),
                                attackType: formData.get("attackType"),  // Should be BA, EA, etc.
                                weaponDamage: parseInt(formData.get("weaponDamage")) || 0,
                                range: parseInt(formData.get("range")) || 0,
                                columnShift: parseInt(formData.get("columnShift")) || 0
                            }
                        };

                        console.log("Creating attack with data:", data);
                        await this.actor.createEmbeddedDocuments("Item", [data]);
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "create"
        }).render(true);
    }

    async _onRollAttack(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".attack-row").dataset.itemId;
        if (!itemId) {
            console.error("No item ID found");
            return;
        }
        const item = this.actor.items.get(itemId);
        if (!item) {
            console.error(`No item found with ID ${itemId}`);
            return;
        }
        console.log("Rolling attack with item:", item);
        await item.roll();
    }

    async _onAddPower(event) {
        event.preventDefault();
        const powers = foundry.utils.getProperty(this.actor.system, "powers.list") || [];
        const newPowers = powers.concat([{ name: "", rank: "", number: 0 }]);
        await this.actor.update({ "system.powers.list": newPowers });
    }

    async _onAddTalent(event) {
        event.preventDefault();
        const talents = foundry.utils.getProperty(this.actor.system, "talents.list") || [];
        const newTalents = talents.concat([{ name: "" }]);
        await this.actor.update({ "system.talents.list": newTalents });
    }

    async _onAddContact(event) {
        event.preventDefault();
        const contacts = foundry.utils.getProperty(this.actor.system, "contacts.list") || [];
        const newContacts = contacts.concat([{ name: "" }]);
        await this.actor.update({ "system.contacts.list": newContacts });
    }

    async _onNumberChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityPath = element.dataset.ability;
        const newNumber = parseInt(element.value) || 0;
        const cleanPath = abilityPath.replace('primaryAbilities.', '');
        const newRank = this.actor.getRankFromValue(newNumber);
        await this.actor.update({
            [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
            [`system.primaryAbilities.${cleanPath}.number`]: newNumber
        });
    }

    async _onRankChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityPath = element.dataset.ability;
        const newRank = element.value;
        const cleanPath = abilityPath.replace('primaryAbilities.', '');
        const currentAbility = this.actor.system.primaryAbilities[cleanPath];
        
        if (element.classList.contains('initial-rank-select')) {
            await this.actor.update({
                [`system.primaryAbilities.${cleanPath}.initialRank`]: newRank,
                [`system.primaryAbilities.${cleanPath}.initialNumber`]: MARVEL_RANKS[newRank]?.standard || 0
            });
        } else {
            const rankNumber = MARVEL_RANKS[newRank]?.standard || currentAbility.number || 0;
            await this.actor.update({
                [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
                [`system.primaryAbilities.${cleanPath}.number`]: rankNumber
            });
        }
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
}