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
        
        // Ensure context.actor.system exists and initialize if needed
        const system = context.actor.system || {};
        
        // Initialize primary abilities if not set
        if (!system.primaryAbilities) {
            system.primaryAbilities = {
                fighting: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                agility: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                strength: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                endurance: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                reason: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                intuition: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                psyche: { initialRoll: "", initialRank: "", rank: "", number: 0 }
            };
        }

        // Initialize secondary abilities if not set
        if (!system.secondaryAbilities) {
            system.secondaryAbilities = {
                health: { value: 0, max: 0 },
                karma: { value: 0, max: 0 },
                resources: { rank: "", number: 0 },
                popularity: { hero: 0, secret: 0 }
            };
        }

        // Initialize karma tracking if not set
        if (!system.karmaTracking) {
            system.karmaTracking = {
                karmaPool: 0,
                advancementFund: 0,
                history: []
            };
        }

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
        
        // Initialize powers according to template.json schema
        if (!system.powers) {
            system.powers = {
                templates: ["base"],
                list: [],
                schema: {
                    name: "",
                    rank: "",
                    rankNumber: 0,
                    damage: 0,
                    range: 0,
                    description: "",
                    limitations: "",
                    type: ""
                }
            };
        }

        // Initialize stunts according to template.json schema
        if (!system.stunts) {
            system.stunts = {
                list: [],
                templates: ["base"],
                description: "",
                schema: {
                    name: "",
                    associatedPower: "",
                    attempts: 0,
                    status: "untried",
                    description: ""
                }
            };
        }
        
        // Initialize talents according to template.json schema
        if (!system.talents) {
            system.talents = {
                talents: {
                    list: []
                }
            };
        }
        
        // Initialize contacts according to template.json schema
        if (!system.contacts) {
            system.contacts = {
                contacts: {
                    list: []
                }
            };
        }
    
        // Update context with initialized system
        context.actor.system = system;
    
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
    
        if (this.isEditable) {
            console.log("Setting up listeners"); // Add this line
            // Test each method exists before binding
            const bindings = [
                { selector: '.add-power', method: this._onAddPower },
                { selector: '.add-talent', method: this._onAddTalent },
                { selector: '.add-contact', method: this._onAddContact },
                { selector: '.ability-number', method: this._onNumberChange },
                { selector: '.rank-select', method: this._onRankChange },
                { selector: '.add-attack', method: this._onAddAttack },
                { selector: '.ability-label', method: this._onAbilityRoll },
                { selector: '.clickable-popularity', method: this._onPopularityRoll },
                { selector: '.clickable-resources', method: this._onResourceRoll },
                { selector: '.power-edit', method: this._onPowerEdit },
                { selector: '.roll-power', method: this._onPowerRoll },
                { selector: '.power-info-icon', method: this._onPowerInfo },
                { selector: '.karma-history-button', method: this._onKarmaTracking },
                { selector: '.add-power-stunt', method: this._onCreatePowerStunt },
                { selector: '.roll-power-stunt', method: this._onRollPowerStunt }
            ];
    
            // Add power button binding
            html.find('.add-power').click(async (ev) => this._onAddPower(ev));

            // Power-related button bindings (these are correct but should be first)
            html.find('.power-info-icon').click(async (ev) => this._onPowerInfo(ev));
            html.find('.power-edit').click(async (ev) => this._onPowerEdit(ev));
            html.find('.roll-power').click(async (ev) => this._onPowerRoll(ev));
            html.find('.item-delete[data-type="powers"]').click(async (ev) => {});

            // Add event listeners for ability, popularity, and resource rolls
            html.find('.ability-label').click(async (ev) => this._onAbilityRoll(ev));
            html.find('.clickable-popularity').click(async (ev) => this._onPopularityRoll(ev));
            html.find('.clickable-resources').click(async (ev) => this._onResourceRoll(ev));

            // Alternative approach using arrow functions
            html.find('.add-talent').on('click', (ev) => this._onAddTalent(ev));
            html.find('.add-contact').on('click', (ev) => this._onAddContact(ev));
    
            // Navigation tabs
            html.find('.nav-item').off('click').on('click', this._onTabChange.bind(this));
    
            // Attack roll button
            html.find('.roll-attack').click(async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const itemId = ev.currentTarget.closest(".attack-row").dataset.itemId;
                if (!itemId) return;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                return await item.roll();
            });
    
            // Edit item button
            html.find('.item-edit').click(ev => {
                ev.preventDefault();
                const attackRow = ev.currentTarget.closest(".attack-row");
                if (!attackRow) return;
                const itemId = attackRow.dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                return item.sheet.render(true);
            });
    
            // Delete item handling updated to match template.json structure
            html.find('.item-delete').click(async ev => {
                const element = ev.currentTarget;
                const type = element.dataset.type;
                const id = element.dataset.id;
    
                let itemName = "";
                if (type && id !== undefined) {
                    // Handle deleting from list arrays based on template.json structure
                    let path;
                    switch(type) {
                        case 'powers':
                            path = 'system.powers.list';
                            break;
                        case 'stunts':
                            path = 'system.stunts.list';
                            break;
                        case 'talents':
                            path = 'system.talents.talents.list';
                            break;
                        case 'contacts':
                            path = 'system.contacts.contacts.list';
                            break;
                        default:
                            path = null;
                    }
                    
                    if (path) {
                        const items = foundry.utils.getProperty(this.actor, path) || [];
                        itemName = items[id]?.name || `${type} entry`;
                    }
                } else {
                    const li = $(element).parents(".attack-row");
                    const item = this.actor.items.get(li.data("itemId"));
                    itemName = item?.name || "attack";
                }
    
                const confirmDelete = await Dialog.confirm({
                    title: "Confirm Deletion",
                    content: `<p>Are you sure you want to delete "${itemName}"?</p>`,
                    defaultYes: false
                });
    
                if (!confirmDelete) return;
    
                if (type && id !== undefined) {
                    // Handle deleting from list arrays based on template.json structure
                    let path;
                    switch(type) {
                        case 'powers':
                            path = 'system.powers.list';
                            break;
                        case 'stunts':
                            path = 'system.stunts.list';
                            break;
                        case 'talents':
                            path = 'system.talents.talents.list';
                            break;
                        case 'contacts':
                            path = 'system.contacts.contacts.list';
                            break;
                        default:
                            return;
                    }
                    
                    const items = foundry.utils.getProperty(this.actor, path) || [];
                    const updatedItems = items.filter((_, idx) => idx !== Number(id));
                    return this.actor.update({[path]: updatedItems});
                } else {
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
        
        // Get karma history from flags, matching template.json karmaTracking structure
        const karmaHistory = this.actor.system.karmaTracking.history || [];
        
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
    
                        // Create new karma entry following template.json structure
                        const newEntry = {
                            date: new Date().toLocaleString(),
                            amount: amount,
                            description: description
                        };
    
                        // Update karma history in system data
                        const updatedHistory = [...karmaHistory, newEntry];
                        
                        // Update both karma pool and history according to template.json
                        const currentPool = this.actor.system.karmaTracking.karmaPool || 0;
                        await this.actor.update({
                            "system.karmaTracking.karmaPool": currentPool + amount,
                            "system.karmaTracking.history": updatedHistory
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
                    callback: async () => {
                        const confirm = await Dialog.confirm({
                            title: "Clear Karma History",
                            content: "Are you sure you want to clear the karma history? This cannot be undone.",
                            defaultYes: false
                        });
    
                        if (confirm) {
                            await this.actor.update({
                                "system.karmaTracking.history": []
                            });
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
        // Handle nested data structure from template.json
        const expandedData = foundry.utils.expandObject(formData);
        
        // Handle powers list according to template.json structure
        if (expandedData.system?.powers?.list) {
            const powers = Object.values(expandedData.system.powers.list);
            expandedData.system.powers.list = powers;
        }
        
        // Handle talents list
        if (expandedData.system?.talents?.talents?.list) {
            const talents = Object.values(expandedData.system.talents.talents.list);
            expandedData.system.talents.talents.list = talents;
        }
        
        // Handle contacts list
        if (expandedData.system?.contacts?.contacts?.list) {
            const contacts = Object.values(expandedData.system.contacts.contacts.list);
            expandedData.system.contacts.contacts.list = contacts;
        }

        // Handle stunts list according to template.json structure
        if (expandedData.system?.stunts?.list) {
            const stunts = Object.values(expandedData.system.stunts.list);
            expandedData.system.stunts.list = stunts;
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

    async _onPowerEdit(event) {
        event.preventDefault();
        const powerIndex = event.currentTarget.dataset.id;
        const powers = this.actor.system.powers.list;
        const power = powers[powerIndex];
        
        if (!power) return;
    
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/edit-power.html", 
            {
                power: power,
                config: {
                    ranks: Object.entries(CONFIG.marvel.ranks).reduce((obj, [key, value]) => {
                        obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
                        return obj;
                    }, {})
                }
            }
        );
    
        return new Dialog({
            title: "Edit Power",
            content: html,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        if (!form) return;
                        
                        const rankKey = form.querySelector('[name="rank"]').value;
                        const rankNumber = CONFIG.marvel.ranks[rankKey]?.standard || 0;
                        
                        // Create updated power data matching template.json schema
                        const updatedPower = {
                            name: form.querySelector('[name="name"]').value || "",
                            rank: rankKey,
                            rankNumber: rankNumber,
                            damage: parseInt(form.querySelector('[name="damage"]').value) || 0,
                            range: parseInt(form.querySelector('[name="range"]').value) || 0,
                            description: form.querySelector('[name="description"]').value || "",
                            limitations: form.querySelector('[name="limitations"]').value || "",
                            type: form.querySelector('[name="type"]').value || ""
                        };
    
                        // Update the powers list
                        const updatedPowers = duplicate(powers);
                        updatedPowers[powerIndex] = updatedPower;
                        
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
    
                        await game.user.setFlag("world", "marvelRollOptions", options);
    
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

                    const formData = new FormData(form);
                    
                    // Create attack data matching template.json Item.attack schema
                    const data = {
                        name: formData.get("attackName"),
                        type: "attack",
                        system: {
                            ability: formData.get("ability").toLowerCase(),
                            attackType: formData.get("attackType"),
                            weaponDamage: parseInt(formData.get("weaponDamage")) || 0,
                            range: parseInt(formData.get("range")) || 0,
                            columnShift: parseInt(formData.get("columnShift")) || 0,
                            description: "",
                            rules: ""
                        }
                    };

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

async _onAddPower(event) {
    event.preventDefault();
    const powers = foundry.utils.getProperty(this.actor.system, "powers.list") || [];
    
    // Create new power matching template.json power schema
    const newPower = {
        name: "",
        rank: "Feeble",
        rankNumber: CONFIG.marvel.ranks["Feeble"]?.standard || 2,
        damage: 0,
        range: 0,
        description: "",
        limitations: "",
        type: ""
    };
    
    const newPowers = powers.map(p => duplicate(p));
    newPowers.push(newPower);
    
    await this.actor.update({
        "system.powers.list": newPowers
    });
}                        

async _onAddContact(event) {
    console.log("Add contact clicked");
    event.preventDefault();
    const contacts = this.actor.system.contacts?.contacts?.list || [];
    const newContacts = contacts.concat([{ 
        name: "",
        type: "",
        reliability: "",
        description: "",
        rules: ""
    }]);
    await this.actor.update({
        "system": {
            "contacts": {
                "contacts": {
                    "list": newContacts
                }
            }
        }
    });
    this.render(false); // Add this line
}

async _onNumberChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const abilityPath = element.dataset.ability;
    const newNumber = parseInt(element.value) || 0;
    const cleanPath = abilityPath.replace('primaryAbilities.', '');
    const newRank = this.actor.getRankFromValue(newNumber);

    // Create update data matching template.json primaryAbilities structure
    const updateData = {
        [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
        [`system.primaryAbilities.${cleanPath}.number`]: newNumber
    };

    await this.actor.update(updateData);
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
    
    // Update according to template.json primaryAbilities structure
    if (element.classList.contains('initial-rank-select')) {
        await this.actor.update({
            [`system.primaryAbilities.${cleanPath}.initialRank`]: newRank,
            [`system.primaryAbilities.${cleanPath}.initialRoll`]: "",
            [`system.primaryAbilities.${cleanPath}.number`]: MARVEL_RANKS[newRank]?.standard || 0
        });
    } else {
        const rankNumber = MARVEL_RANKS[newRank]?.standard || currentAbility.number || 0;
        await this.actor.update({
            [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
            [`system.primaryAbilities.${cleanPath}.number`]: rankNumber
        });
    }
}

async _onPopularityRoll(event) {
    event.preventDefault();
    const popularityType = event.currentTarget.dataset.popularityType;
    
    const stored = await game.user.getFlag("world", "marvelPopularityOptions") || {
        disposition: "neutral",
        modifiers: {
            benefits: false,
            danger: false,
            goodValue: false,
            remarkableValue: false,
            noReturn: false,
            unique: false
        },
        additionalShift: 0,
        karmaPoints: 0
    };

    const templateData = {
        config: CONFIG.marvel,
        stored: stored,
        popularity: this.actor.system.secondaryAbilities.popularity // Using correct path from template.json
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
                                benefits: formData.get("benefits") === "on",
                                danger: formData.get("danger") === "on",
                                goodValue: formData.get("goodValue") === "on",
                                remarkableValue: formData.get("remarkableValue") === "on",
                                noReturn: formData.get("noReturn") === "on",
                                unique: formData.get("unique") === "on"
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

async _onResourceRoll(event) {
    event.preventDefault();

    if (!game.modules.get("simple-calendar")?.active) {
        ui.notifications.warn("Simple Calendar module is required for proper Resource FEAT timing restrictions.");
    }
    
    // Get resources from proper template.json path
    const resourceRank = this.actor.system.secondaryAbilities.resources.rank || "Shift 0";
    const resourceNumber = this.actor.system.secondaryAbilities.resources.number || 0;

    const stored = await game.user.getFlag("world", "marvelResourceOptions") || {
        itemRank: "Typical",
        columnShift: 0,
        karmaPoints: 0
    };

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

                        await game.user.setFlag("world", "marvelResourceOptions", options);

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
    
    // Prepare template data using template.json ability structure
    const ability = this.actor.system.primaryAbilities[abilityId];
    const templateData = {
        config: CONFIG.marvel,
        defaultFeatType: stored.featType,
        defaultAction: stored.actionType,
        columnShift: stored.columnShift,
        karmaPoints: stored.karmaPoints,
        showActionSelect: stored.featType === "combat",
        actionTypes: CONFIG.marvel.actionResults,
        ability: ability
    };
    
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
                        
                        // Update karma tracking if karma points were spent
                        if (options.karmaPoints > 0) {
                            const currentKarma = this.actor.system.karmaTracking.karmaPool;
                            const newHistory = [...(this.actor.system.karmaTracking.history || []), {
                                date: new Date().toLocaleString(),
                                amount: -options.karmaPoints,
                                description: `Spent on ${abilityId.toUpperCase()} FEAT roll`
                            }];
                            
                            await this.actor.update({
                                "system.karmaTracking.karmaPool": currentKarma - options.karmaPoints,
                                "system.karmaTracking.history": newHistory
                            });
                        }
                        
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
    const powerIndex = event.currentTarget.dataset.id;
    const power = this.actor.system.powers.list[powerIndex];
    
    if (!power) return;

    // Format description text or use name if no description
    const description = power.description || power.name;
    const formattedDesc = description.replace(/\n/g, '<br>');
    const limitations = power.limitations ? `<div class="power-limitations">Limitations: ${power.limitations}</div>` : '';

    // Create chat message with template.json power structure
    const messageContent = `
        <div class="marvel-power-info">
            <h2 style="color: #782e22; border-bottom: 2px solid #782e22; margin-bottom: 5px;">
                ${power.name}
            </h2>
            <div class="power-details">
                <div style="margin-bottom: 5px;">
                    <strong>Rank:</strong> ${power.rank}
                    ${power.damage ? `<br><strong>Damage:</strong> ${power.damage}` : ''}
                    ${power.range ? `<br><strong>Range:</strong> ${power.range}` : ''}
                    ${power.type ? `<br><strong>Type:</strong> ${power.type}` : ''}
                </div>
                <div class="power-description">
                    ${formattedDesc}
                </div>
                ${limitations}
            </div>
        </div>
    `;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: messageContent
    });
}

async _onCreatePowerStunt(event) {
    event.preventDefault();
    
    const powers = this.actor.system.powers?.list || [];
    if (powers.length === 0) {
        ui.notifications.warn("You need at least one power to create a stunt");
        return;
    }

    // Initialize stunts according to template.json schema
    const stunts = foundry.utils.getProperty(this.actor.system, "stunts.list") || [];
    
    // Create new stunt with template.json stunt schema
    const newStunt = {
        name: "",
        associatedPower: powers[0]?.name || "",
        attempts: 0,
        status: "untried",
        description: ""
    };

    const newStunts = [...stunts, newStunt];

    await this.actor.update({"system.stunts.list": newStunts});
}

async _onRollPowerStunt(event) {
    event.preventDefault();
    const stuntIndex = event.currentTarget.closest('.stunt-row').dataset.index;
    const stunt = this.actor.system.stunts.list[stuntIndex];
    
    // Check karma pool from karmaTracking structure
    if (this.actor.system.karmaTracking.karmaPool < 100) {
        ui.notifications.error("Not enough Karma (100 required)");
        return;
    }
    
    // Calculate difficulty based on stunt attempts
    let difficulty;
    if (stunt.attempts === 0) difficulty = "red";
    else if (stunt.attempts < 4) difficulty = "yellow";
    else if (stunt.attempts < 11) difficulty = "green";
    else {
        ui.notifications.info("This stunt is now automatic!");
        return;
    }

    // Perform the roll and update karma tracking
    const roll = await new Roll("1d100").evaluate();
    const color = this.actor.getColorResult(roll.total, difficulty);

    // Update stunt attempts and status in template.json structure
    const stunts = duplicate(this.actor.system.stunts.list);
    stunts[stuntIndex].attempts += 1;
    stunts[stuntIndex].status = color === "white" ? "mastered" : "attempted";

    // Update karma tracking according to template.json structure
    const currentKarma = this.actor.system.karmaTracking.karmaPool;
    const newHistory = [...(this.actor.system.karmaTracking.history || []), {
        date: new Date().toLocaleString(),
        amount: -100,
        description: `Attempted Power Stunt: ${stunt.name}`
    }];

    await this.actor.update({
        "system.stunts.list": stunts,
        "system.karmaTracking.karmaPool": currentKarma - 100,
        "system.karmaTracking.history": newHistory
    });

    // Create chat message
    const messageContent = `
        <div class="marvel-stunt-roll">
            <h3>${this.actor.name} - Power Stunt Attempt</h3>
            <div class="stunt-details">
                <div>Stunt: ${stunt.name}</div>
                <div>Associated Power: ${stunt.associatedPower}</div>
                <div>Attempt #${stunt.attempts}</div>
                <div>Roll: ${roll.total}</div>
            </div>
            <div style="text-align: center; font-weight: bold; padding: 5px; background-color: ${color};">
                ${color.toUpperCase()}
            </div>
        </div>
    `;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: messageContent,
        rolls: [roll],
        sound: CONFIG.sounds.dice
    });
}

_onTabChange(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget;
    const category = target.dataset.tab;
    
    // Update DOM
    $(this.element).find('.nav-item').removeClass('active');
    $(this.element).find(`.nav-item[data-tab="${category}"]`).addClass('active');
    
    $(this.element).find('.tab-panel').hide();
    $(this.element).find(`.tab-panel[data-tab="${category}"]`).show();
    
    // Store active tab
    this.actor.setFlag('marvel-faserip', 'activeTab', category).then(() => {
        if (this._tabs === undefined) {
            this.render(false);
        }
    });
}
}