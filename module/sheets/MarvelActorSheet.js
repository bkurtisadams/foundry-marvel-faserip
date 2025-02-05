import { MARVEL_RANKS } from "../config.js";

export class MarvelActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["marvel-faserip", "sheet", "actor"],
            template: "systems/marvel-faserip/templates/actor/actor-sheet.html",
            width: 600,
            height: 680,
            dragDrop: [{ dragSelector: ".attack-row", dropSelector: null }]
        });
    }

    async getData(options={}) {
        const context = await super.getData(options);
    
        // Ensure context.actor.system exists
        const system = context.actor.system || {};
    
        // Get the active tab from flags or default to 'special'
        const activeTab = this.actor.getFlag('marvel-faserip', 'activeTab') || 'special';
        context.activeTab = activeTab;

        // Set up tabs context properly
        context.tabs = {
        special: activeTab === 'special',
        stunts: activeTab === 'stunts',
        attacks: activeTab === 'attacks',
        equipment: activeTab === 'equipment',
        headquarters: activeTab === 'headquarters',
        vehicles: activeTab === 'vehicles'
        };
        
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
        // Initialize powers if needed
        if (!system.powers) system.powers = { list: [], limitation: "" };
        if (!Array.isArray(system.powers.list)) system.powers.list = [];

        // Initialize stunts if needed
        if (!system.stunts) system.stunts = { list: [] };
        if (!Array.isArray(system.stunts.list)) system.stunts.list = [];
        
        // Initialize talents if needed
        if (!system.talents) system.talents = { list: [] };
        if (!Array.isArray(system.talents.list)) system.talents.list = [];
        
        // Initialize contacts if needed
        if (!system.contacts) system.contacts = { list: [] };
        if (!Array.isArray(system.contacts.list)) system.contacts.list = [];
    
        // Update context with initialized system
        context.actor.system = system;
    
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add tab switching functionality
        
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
            html.find('.clickable-resources').click(this._onResourceRoll.bind(this));
            html.find('.power-edit').click(this._onPowerEdit.bind(this));
            html.find('.roll-power').click(this._onPowerRoll.bind(this));
            html.find('.power-info-icon').click(this._onPowerInfo.bind(this));
            html.find('.karma-history-button').click(this._onKarmaTracking.bind(this));
            html.find('.add-power-stunt').click(this._onCreatePowerStunt.bind(this));
            html.find('.roll-power-stunt').click(this._onRollPowerStunt.bind(this));
            html.find('.nav-item').off('click').on('click', this._onTabChange.bind(this));
            
                        
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

    _onCategoryChange(event) {
        const category = event.currentTarget.dataset.category;
        const navItems = event.currentTarget.parentElement.children;
        
        // Update active state
        for (let item of navItems) {
            item.classList.remove('active');
        }
        event.currentTarget.classList.add('active');
        
        // Hide all category content
        const sheet = event.currentTarget.closest('.marvel-faserip');
        const categories = sheet.querySelectorAll('.category-content');
        categories.forEach(c => c.style.display = 'none');
        
        // Show selected category
        const selectedCategory = sheet.querySelector(`.category-${category}`);
        if (selectedCategory) {
            selectedCategory.style.display = 'block';
        }
    }

    async _onKarmaTracking(event) {
        event.preventDefault();
        
        // Get karma history from flags
        const karmaHistory = this.actor.getFlag("marvel-faserip", "karmaHistory") || [];
        
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/karma-tracking.html",
            {
                karmaHistory: karmaHistory.slice(-10).reverse() // Show last 10 entries
            }
        );
    
        return new Dialog({
            title: "Karma Tracking",
            content: html,
            buttons: {
                add: {
                    label: "Add Entry",
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        const amount = parseInt(form.amount.value) || 0;
                        const description = form.description.value;
                        
                        if (amount === 0 || !description) {
                            ui.notifications.warn("Please enter an amount and description");
                            return;
                        }
    
                        // Create new karma entry
                        const newEntry = {
                            date: new Date().toLocaleString(),
                            amount: amount,
                            description: description
                        };
    
                        // Update karma history
                        const updatedHistory = [...karmaHistory, newEntry];
                        await this.actor.setFlag("marvel-faserip", "karmaHistory", updatedHistory);
    
                        // Update karma pool
                        const currentPool = this.actor.system.karmaTracking.karmaPool || 0;
                        await this.actor.update({
                            "system.karmaTracking.karmaPool": currentPool + amount
                        });
    
                        // Create chat message
                        const messageContent = `
                            <div class="marvel-karma-update">
                                <h3>${this.actor.name} - Karma ${amount >= 0 ? 'Award' : 'Deduction'}</h3>
                                <div>Amount: <strong>${amount}</strong></div>
                                <div>Reason: ${description}</div>
                                <div>New Karma Pool: ${currentPool + amount}</div>
                            </div>
                        `;
    
                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: messageContent
                        });
                    }
                },
                clear: {
                    label: "Clear History",
                    callback: async (html) => {
                        const confirm = await Dialog.confirm({
                            title: "Clear Karma History",
                            content: "Are you sure you want to clear the karma history? This cannot be undone.",
                            defaultYes: false
                        });
    
                        if (confirm) {
                            await this.actor.setFlag("marvel-faserip", "karmaHistory", []);
                        }
                    }
                },
                close: {
                    label: "Close"
                }
            },
            default: "add"
        }).render(true);
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
                        
                        // Create updated power data
                        const updatedPower = {
                            name: formData.get("name"),
                            rank: formData.get("rank"),
                            rankNumber: parseInt(formData.get("rankNumber")) || 0,
                            damage: {
                                value: parseInt(formData.get("damage.value")) || 0,
                                type: formData.get("damage.type")
                            },
                            range: {
                                value: parseInt(formData.get("range.value")) || 0,
                                unit: formData.get("range.unit")
                            },
                            description: formData.get("description"),
                            limitations: formData.get("limitations"),
                            type: formData.get("type")
                        };
    
                        // Update the powers list
                        const updatedPowers = [...powers];
                        updatedPowers[powerIndex] = updatedPower;
    
                        // Update the actor
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
    
    // In MarvelActorSheet.js
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
        const newPower = {
            name: "",
            rank: "Feeble",  // Default starting rank
            rankNumber: 2,    // Corresponding to Feeble
            damage: {
                value: 0,
                type: ""
            },
            range: {
                value: 0,
                unit: "areas"
            },
            description: "",
            limitations: "",
            type: ""
        };
        
        const newPowers = [...powers, newPower];
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

        // Create update data
        const updateData = {
            [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
            [`system.primaryAbilities.${cleanPath}.number`]: newNumber
        };

        // Update the actor
        await this.actor.update(updateData);

        // Force a recalculation of derived values
        await this.actor.prepareData();
        this.render(false);
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

        // Resource FEAT roll method 
        // In MarvelActorSheet.js, update the _onResourceRoll method:

// In MarvelActorSheet.js, update the _onResourceRoll method:

async _onResourceRoll(event) {
    event.preventDefault();

    // Check if Simple Calendar is active
    if (!game.modules.get("simple-calendar")?.active) {
        ui.notifications.warn("Simple Calendar module is required for proper Resource FEAT timing restrictions.");
    }
    
    const resourceRank = this.actor.system.secondaryAbilities.resources.rank || "Shift 0";
    const resourceNumber = this.actor.system.secondaryAbilities.resources.number || 0;

    // Get stored values
    const stored = await game.user.getFlag("world", "marvelResourceOptions") || {
        itemRank: "Typical",
        columnShift: 0,
        karmaPoints: 0
    };

    // Get timing information
    const lastAttempt = this.actor.getFlag("marvel-faserip", "lastResourceAttempt");
    const lastFailure = this.actor.getFlag("marvel-faserip", "lastResourceFailure");

    let warningMessage = "";
    if (lastAttempt) {
        const daysSinceAttempt = Math.floor((Date.now() - lastAttempt.timestamp) / (24 * 60 * 60 * 1000));
        if (daysSinceAttempt < 7) {
            warningMessage = `Warning: Last Resource FEAT attempt was ${daysSinceAttempt} days ago. Must wait 7 days between attempts.`;
        }
    }

    const html = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/resource-roll.html",
        {
            config: CONFIG.marvel,
            ranks: Object.keys(CONFIG.marvel.ranks),
            resourceRank: resourceRank,
            itemRank: stored.itemRank,
            columnShift: stored.columnShift,
            karmaPoints: stored.karmaPoints,
            warningMessage: warningMessage,
            lastAttempt: lastAttempt,
            lastFailure: lastFailure
        }
    );

    return new Promise(resolve => {
        const dialog = new Dialog({
            title: "Resource FEAT Roll",
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml) => {
                        const form = dialogHtml[0].querySelector("form");
                        const options = {
                            itemRank: form.itemRank.value,
                            columnShift: parseInt(form.columnShift.value) || 0,
                            karmaPoints: parseInt(form.karmaPoints.value) || 0
                        };

                        // Store values for next time
                        await game.user.setFlag("world", "marvelResourceOptions", options);

                        // Check if the attempt is allowed
                        const canAttempt = await this.actor._canAttemptResourceFeat(options.itemRank);
                        if (!canAttempt.allowed) {
                            ui.notifications.warn(canAttempt.message);
                            return;
                        }

                        await this.actor.rollResourceFeat(options.itemRank, options);
                        resolve(true);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(false)
                }
            },
            default: "roll"
        });

        dialog.render(true);
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

    async _onPowerInfo(event) {
        event.preventDefault();
        const powerIndex = event.currentTarget.dataset.index;
        const power = this.actor.system.powers.list[powerIndex];
        
        if (!power) return;
    
        // Format description text or use name if no description
        const description = power.description || power.name;
        const formattedDesc = description.replace(/\n/g, '<br>');
    
        // Create chat message
        const messageContent = `
            <div class="marvel-power-info">
                <h2 style="color: #782e22; border-bottom: 2px solid #782e22; margin-bottom: 5px;">
                    ${power.name}
                </h2>
                <div class="power-details">
                    <div style="margin-bottom: 5px;">
                        <strong>Rank:</strong> ${power.rank}
                    </div>
                    <div class="power-description">
                        ${formattedDesc}
                    </div>
                </div>
            </div>
        `;
    
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: messageContent
        });
    }

    // create power stunt
    async _onCreatePowerStunt(event) {
        event.preventDefault();
        
        const powers = this.actor.system.powers?.list || [];
        if (powers.length === 0) {
            ui.notifications.warn("You need at least one power to create a stunt");
            return;
        }
    
        // Initialize stunts array if it doesn't exist
        const stunts = foundry.utils.getProperty(this.actor.system, "stunts.list") || [];
        
        // Create new stunt with all required properties
        const newStunt = {
            name: "",
            associatedPower: powers[0]?.name || "",  // Reference first power's name
            attempts: 0,
            description: "",
            status: "untried"  // Add a status tracker
        };
    
        // Add the new stunt to the list
        const newStunts = [...stunts, newStunt];
    
        // Update the actor with the new stunts list
        await this.actor.update({"system.stunts.list": newStunts});
    }

    async _onRollPowerStunt(event) {
        event.preventDefault();
        const stuntIndex = event.currentTarget.closest('.stunt-row').dataset.index;
        const stunt = this.actor.system.stunts.list[stuntIndex];
        
        // Check karma
        if (this.actor.system.karmaTracking.karmaPool < 100) {
            ui.notifications.error("Not enough Karma (100 required)");
            return;
        }

        // Roll based on attempts
        let difficulty;
        if (stunt.attempts === 0) difficulty = "red";
        else if (stunt.attempts < 4) difficulty = "yellow";
        else if (stunt.attempts < 11) difficulty = "green";
        else {
            ui.notifications.info("This stunt is now automatic!");
            return;
        }

    // Proceed with roll logic...
}
    // Add this method to the MarvelActorSheet class:
    _onTabChange(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.currentTarget;
        const category = target.dataset.tab;
        
        // Update DOM directly first
        $(this.element).find('.nav-item').removeClass('active');
        $(this.element).find(`.nav-item[data-tab="${category}"]`).addClass('active');
        
        $(this.element).find('.tab-panel').hide();
        $(this.element).find(`.tab-panel[data-tab="${category}"]`).show();
        
        // Store active tab without triggering a re-render
        this.actor.setFlag('marvel-faserip', 'activeTab', category).then(() => {
            // Only re-render if absolutely necessary
            if (this._tabs === undefined) {
                this.render(false);
            }
        });
    }

}