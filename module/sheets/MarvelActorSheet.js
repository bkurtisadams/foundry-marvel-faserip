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
            dragDrop: [{ dragSelector: ".attack-row", dropSelector: null }]
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

            html.find('.ability-label').click(this._onAbilityRoll.bind(this));
            html.find('.clickable-popularity').click(this._onPopularityRoll.bind(this));

            html.find('.power-edit').click(this._onPowerEdit.bind(this));
            html.find('.roll-power').click(this._onPowerRoll.bind(this));
                        
            html.find('.roll-attack').click(async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const itemId = ev.currentTarget.closest(".attack-row").dataset.itemId;
                if (!itemId) return;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                return await item.roll();
            });
            
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
            
            // Handle both attack items and special ability deletions
            html.find('.item-delete').click(async ev => {
                const element = ev.currentTarget;
                const type = element.dataset.type;
                const id = element.dataset.id;

                // Get the name of the item being deleted
                let itemName = "";
                if (type && id !== undefined) {
                    // For powers, talents, and contacts
                    const path = `system.${type}.list`;
                    const items = foundry.utils.getProperty(this.actor, path) || [];
                    itemName = items[id]?.name || `${type} entry`;
                } else {
                    // For attacks
                    const li = $(element).parents(".attack-row");
                    const item = this.actor.items.get(li.data("itemId"));
                    itemName = item?.name || "attack";
                }

                // Show confirmation dialog
                const confirmDelete = await Dialog.confirm({
                    title: "Confirm Deletion",
                    content: `<p>Are you sure you want to delete "${itemName}"?</p>`,
                    defaultYes: false
                });

                if (!confirmDelete) return;

                if (type && id !== undefined) {
                    // Handle special abilities, talents, and contacts
                    const path = `system.${type}.list`;
                    const items = foundry.utils.getProperty(this.actor, path) || [];
                    const updatedItems = items.filter((_, idx) => idx !== Number(id));
                    return this.actor.update({[path]: updatedItems});
                } else {
                    // Handle attack items
                    const li = $(element).parents(".attack-row");
                    const item = this.actor.items.get(li.data("itemId"));
                    if (item) await item.delete();
                }
            });
        }
    }

    // Helper method to get color text formatting
_getColorClass(color) {
    switch(color.toLowerCase()) {
        case 'white': return 'white-result';
        case 'green': return 'green-result';
        case 'yellow': return 'yellow-result';
        case 'red': return 'red-result';
        default: return '';
    }
}
    /**
 * Handle clicking the edit button for a power
 * @param {Event} event The originating click event
 * @private
 */
    async _onPowerEdit(event) {
        event.preventDefault();
        const powerIndex = event.currentTarget.dataset.id;
        const powers = this.actor.system.powers.list;
        const power = powers[powerIndex];
    
        if (!power) return;
    
        const template = "systems/marvel-faserip/templates/dialogs/edit-power.html";
        const ranks = Object.entries(CONFIG.marvel.ranks).reduce((obj, [key]) => {
            obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
            return obj;
        }, {});
        
        const html = await renderTemplate(template, {
            power: power,
            config: {
                ranks: ranks
            }
        });
    
        return new Dialog({
            title: "Edit Power",
            content: html,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        const formData = new FormData(form);
                        
                        // Update the power data
                        const updatedPower = {
                            name: formData.get("name"),
                            rank: formData.get("rank"),
                            description: formData.get("description")
                        };
    
                        // Create a copy of the powers list and update the specific power
                        const updatedPowers = [...powers];
                        updatedPowers[powerIndex] = updatedPower;
    
                        // Update the actor with the new powers list
                        await this.actor.update({
                            "system.powers.list": updatedPowers
                        });
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "save"
        }).render(true);
    }

/**
 * Handle rolling a power
 * @param {Event} event The originating click event
 * @private
 */
async _onPowerRoll(event) {
    event.preventDefault();
    const powerIndex = event.currentTarget.dataset.id;
    const power = this.actor.system.powers.list[powerIndex];
    
    if (!power) return;

    const stored = await game.user.getFlag("world", "marvelRollOptions") || {
        columnShift: 0,
        karmaPoints: 0
    };

    const template = "systems/marvel-faserip/templates/dialogs/ability-roll.html";
    const templateData = {
        config: CONFIG.marvel,
        columnShift: stored.columnShift,
        karmaPoints: stored.karmaPoints,
        power: power
    };

    const html = await renderTemplate(template, templateData);

    return new Dialog({
        title: `${power.name} Power FEAT Roll`,
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (html) => {
                    const form = html[0].querySelector("form");
                    const options = {
                        columnShift: parseInt(form.columnShift.value) || 0,
                        karmaPoints: parseInt(form.karmaPoints.value) || 0
                    };

                    // Store values for next time
                    await game.user.setFlag("world", "marvelRollOptions", options);

                    // Roll using the power's rank
                    const roll = await new Roll("1d100").evaluate();
                    const finalRoll = Math.min(100, roll.total + options.karmaPoints);
                    
                    const baseRank = power.rank;
                    const shiftedRank = this.actor.applyColumnShift(baseRank, options.columnShift);
                    const color = this.actor.getColorResult(finalRoll, shiftedRank);

                    const messageContent = `
                        <div class="marvel-roll">
                            <h3>${this.actor.name} - ${power.name} Power FEAT</h3>
                            <div class="roll-details">
                                <div>Power Rank: ${baseRank}</div>
                                ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                                <div>Roll: ${roll.total}${options.karmaPoints ? ` + ${options.karmaPoints} Karma = ${finalRoll}` : ''}</div>
                            </div>
                            <div style="text-align: center; font-weight: bold; padding: 5px; background-color: ${color};">
                                ${color.toUpperCase()}
                            </div>
                        </div>`;

                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        content: messageContent,
                        rolls: [roll],
                        sound: CONFIG.sounds.dice
                    });
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "roll"
    }).render(true);
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

    // Add this method before _onAbilityRoll
async _onPopularityRoll(event) {
    event.preventDefault();
    const popularityType = event.currentTarget.dataset.popularityType;
    
    const stored = await game.user.getFlag("world", "marvelPopularityOptions") || {
        disposition: "neutral",
        benefits: false,
        danger: false,
        goodValue: false,
        remarkableValue: false,
        noReturn: false,
        unique: false,
        additionalShift: 0,
        karmaPoints: 0
    };

    const templateData = {
        config: CONFIG.marvel,
        stored: stored
    };

    const html = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/popularity-roll.html",
        templateData
    );

    return new Promise(resolve => {
        new Dialog({
            title: "Popularity FEAT Roll",
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        const formData = new FormData(form);
                        
                        const options = {
                            disposition: formData.get("disposition"),
                            modifiers: {
                                benefits: formData.get("benefits") ? parseInt(formData.get("benefits")) : 0,
                                danger: formData.get("danger") ? parseInt(formData.get("danger")) : 0,
                                goodValue: formData.get("goodValue") ? parseInt(formData.get("goodValue")) : 0,
                                remarkableValue: formData.get("remarkableValue") ? parseInt(formData.get("remarkableValue")) : 0,
                                noReturn: formData.get("noReturn") ? parseInt(formData.get("noReturn")) : 0,
                                unique: formData.get("unique") ? parseInt(formData.get("unique")) : 0
                            },
                            additionalShift: parseInt(formData.get("additionalShift")) || 0,
                            karmaPoints: parseInt(formData.get("karmaPoints")) || 0
                        };

                        await game.user.setFlag("world", "marvelPopularityOptions", options);
                        await this.actor.rollPopularityFeat(popularityType, options);
                        resolve(true);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(false)
                }
            },
            default: "roll"
        }).render(true);
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