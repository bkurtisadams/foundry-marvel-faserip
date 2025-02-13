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

    async getData(options = {}) {
        const context = await super.getData(options);
        
        // Ensure context.actor.system exists and initialize if needed
        const system = context.actor.system || {};

        console.log("Current actor items:", this.actor.items);
        
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
        
        // Get all powers as items and log the process
        console.log("Sheet data context:", {
            actor: this.actor,
            items: context.items,
            powers: context.powers,
            config: context.config
        });
        context.powers = this.actor.items.filter(item => item.type === "power");
        console.log("Filtered powers:", context.powers);
    
        // Get attacks
        context.attacks = context.items.filter(item => item.type === "attack");
    
        // Add configuration for ranks
        context.config = {
            ranks: Object.entries(CONFIG.marvel.ranks).reduce((obj, [key]) => {
                obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
                return obj;
            }, {})
        };
        
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
                list: []
            };
        }
    
        // Initialize contacts according to template.json schema
        if (!system.contacts) {
            system.contacts = {
                list: []
            };
        }
        
        // Update context with initialized system
        context.actor.system = system;

        console.log("Actor items:", this.actor.items);
        console.log("Filtered powers:", context.powers);
        
        return context;
    }
    
    _onDragStart(event) {
        event.stopPropagation();  // Add this line
        const li = event.currentTarget;
        const item = this.actor.items.get(li.dataset.itemId);
        if (!item) return;
    
        // Set the drag data
        const dragData = {
            type: "Item",
            actorId: this.actor.id,
            itemId: item.id
        };
    
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    
        // Optionally set effectAllowed to move or copy
        event.dataTransfer.effectAllowed = "copy";
    }

    activateListeners(html) {
        super.activateListeners(html);
    
        if (this.isEditable) {
            console.log("Setting up listeners"); // Add this line
            
            // Add drag events for macros
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
            if (li.classList.contains("item-header")) return;
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });
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

            html.find('.power-info-icon').click(ev => this._onPowerInfo(ev));
            html.find('.power-edit').click(ev => this._onPowerEdit(ev));
            html.find('.roll-power').click(ev => this._onPowerRoll(ev));
            html.find('.item-delete[data-type="power"]').click(ev => this._onDeletePower(ev));
            // Add console logs for debugging
            console.log("Power buttons found:", {
                info: html.find('.power-info-icon').length,
                edit: html.find('.power-edit').length,
                roll: html.find('.roll-power').length,
                delete: html.find('.item-delete[data-type="power"]').length
            });

            // clickable karma history
            this._onDeleteKarmaEntry = this._onDeleteKarmaEntry.bind(this);
            this._onEditKarmaEntry = this._onEditKarmaEntry.bind(this);

            html.find('.clickable-karma').click(this._onKarmaHistoryClick.bind(this));
            html.find('.delete-entry').click(async (ev) => {
                const index = $(ev.currentTarget).data('index');
                if (this._onDeleteKarmaEntry) {
                    await this._onDeleteKarmaEntry(ev, index);
                } else {
                    console.error("Delete Karma Entry function is missing!");
                }
            });
            html.find('.edit-entry').click(async (ev) => {
                const index = $(ev.currentTarget).data('index');
                const entry = filteredHistory[index];
                await this._onEditKarmaEntry(ev, entry);
              });

            // Add event listeners for ability, popularity, and resource rolls
            html.find('.ability-label').click(async (ev) => this._onAbilityRoll(ev));
            html.find('.clickable-popularity').click(async (ev) => this._onPopularityRoll(ev));
            html.find('.clickable-resources').click(async (ev) => this._onResourceRoll(ev));

            // Alternative approach using arrow functions
            html.find('.add-talent').on('click', (ev) => this._onAddTalent(ev));
            html.find('.add-contact').on('click', (ev) => this._onAddContact(ev));

            // Add resistance change handlers
            html.find('.resistance-number').change(this._onResistanceNumberChange.bind(this));
            html.find('.rank-select').change(this._onResistanceRankChange.bind(this));
            // Add resistance controls
            html.find('.add-resistance').click(this._onAddResistance.bind(this));
    
            // Navigation tabs
            html.find('.nav-item').off('click').on('click', this._onTabChange.bind(this));
    
            // Add attack button
            html.find('.add-attack').click(async (ev) => this._onAddAttack(ev));

            // Attack roll button
            html.find('.roll-attack').click(async (ev) => {
                ev.preventDefault();
                const attackRow = ev.currentTarget.closest(".attack-row");
                if (!attackRow) return;
                
                const itemId = attackRow.dataset.itemId;
                if (!itemId) return;
                
                const item = this.actor.items.get(itemId);
                if (!item) return;
            
                // Get selected token as target
                const targets = game.user.targets;
                const target = targets.size === 1 ? targets.first().actor : null;
                
                if (!target) {
                    ui.notifications.warn("Please select a target token first");
                    return;
                }
            
                console.log("Attack initiated:", {
                    attacker: this.actor.name,
                    target: target.name,
                    item: item.name,
                    ability: item.system.ability,
                    attackType: item.system.attackType
                });
            
                // Call handleAttack directly instead of item.roll()
                return await this.actor.handleAttack(
                    item.system.ability,
                    item.system.attackType,
                    {
                        weaponDamage: item.system.weaponDamage,
                        range: item.system.range,
                        columnShift: item.system.columnShift
                    },
                    target
                );
            });
            
             // Edit attack button
            html.find('.item-edit').click(ev => {
                ev.preventDefault();
                const attackRow = ev.currentTarget.closest(".attack-row");
                if (!attackRow) return;
                const itemId = attackRow.dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                item.sheet.render(true);
            });

            // make attack row icon button clickable
            html.find('.attack-row img').click(async (ev) => {
                ev.preventDefault();
                const itemId = ev.currentTarget.closest(".attack-row").dataset.itemId;
                if (!itemId) return;
                const item = this.actor.items.get(itemId);
                if (!item) return;
                
                // Create chat message with attack description
                const messageContent = `
                    <div class="marvel-roll">
                        <h3>${item.name} - Attack Details</h3>
                        <div class="roll-details">
                            <div>Ability: ${item.system.ability}</div>
                            <div>Attack Type: ${item.system.attackType}</div>
                            ${item.system.weaponDamage ? `<div>Weapon Damage: ${item.system.weaponDamage}</div>` : ''}
                            ${item.system.range ? `<div>Range: ${item.system.range}</div>` : ''}
                            ${item.system.description ? `<div class="description">${item.system.description}</div>` : ''}
                        </div>
                    </div>`;

                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    content: messageContent
                });
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
                        case 'resistances':
                            path = 'system.resistances.list';
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
        // Modify the attack roll button handler
        html.find('.roll-attack').click(async (ev) => {
            ev.preventDefault();
            const itemId = ev.currentTarget.closest(".attack-row").dataset.itemId;
            if (!itemId) return;
            
            const item = this.actor.items.get(itemId);
            if (!item) return;

            // Get selected token as target
            const targets = game.user.targets;
            const target = targets.size === 1 ? targets.first().actor : null;
            
            if (!target) {
                ui.notifications.warn("Please select a target token first");
                return;
            }

            // Call the new handleAttack method
            return await this.actor.handleAttack(
                item.system.ability,
                item.system.attackType,
                {
                    weaponDamage: item.system.weaponDamage,
                    range: item.system.range,
                    columnShift: item.system.columnShift
                },
                target
            );
        });
    }

    // handler for karma history
    async _onKarmaHistoryClick(event) {
        event.preventDefault();
        
        // Initialize properties
        this._karmaHistory = this.actor.system.karmaTracking.history || [];
        this._filteredHistory = [...this._karmaHistory];
        this._currentSort = { field: 'date', direction: 'desc' };
        
        const content = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/karma-history.html",
            {
                actor: this.actor,
                karmaHistory: this._sortKarmaHistory(this._filteredHistory, this._currentSort)
            }
        );
    
        const dialog = new Dialog({
            title: `Karma History - ${this.actor.name}`,
            content: content,
            buttons: {
                close: {
                    label: "Close"
                }
            },
            // Around line 406, replace the render function with:
        render: (html) => {  // Change to arrow function to preserve 'this' context
            const dialog = this;
            
            // Sorting
            html.find('.sortable').click(ev => {
                const field = ev.currentTarget.dataset.sort;
                if (dialog._currentSort.field === field) {
                    dialog._currentSort.direction = dialog._currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    dialog._currentSort = { field, direction: 'asc' };
                }
                dialog._updateKarmaDisplay(html, dialog._sortKarmaHistory(dialog._filteredHistory, dialog._currentSort));
                dialog._updateSortIndicators(html, dialog._currentSort);
            });

            // Filtering
            html.find('.karma-type-filter').change(ev => {
                const filterType = ev.target.value;
                dialog._filteredHistory = dialog._filterKarmaHistory(dialog._karmaHistory, filterType);
                dialog._updateKarmaDisplay(html, dialog._sortKarmaHistory(dialog._filteredHistory, dialog._currentSort));
            });

            // Search
            html.find('.karma-search').on('input', ev => {
                const searchTerm = ev.target.value.toLowerCase();
                dialog._filteredHistory = dialog._karmaHistory.filter(entry => 
                    entry.description.toLowerCase().includes(searchTerm)
                );
                dialog._updateKarmaDisplay(html, dialog._sortKarmaHistory(dialog._filteredHistory, dialog._currentSort));
            });

            // Add the event listeners for edit and delete buttons
            html.find('.karma-entries').on('click', '.edit-entry', async (ev) => {
                ev.preventDefault();
                const index = $(ev.currentTarget).closest('.karma-entry').data('entry-index');
                const entry = dialog._filteredHistory[index];
                await dialog._onEditKarmaEntry(ev, entry);
            });

            html.find('.karma-entries').on('click', '.delete-entry', async (ev) => {
                ev.preventDefault();
                const entryDiv = $(ev.currentTarget).closest('.karma-entry');
                const index = entryDiv.data('entry-index');
                console.log("Deleting entry at index:", index); // Add logging
                if (typeof index !== 'undefined') {
                    await this._onDeleteKarmaEntry(ev, index);
                } else {
                    console.error("Could not find index for karma entry");
                }
            });

            // Export
            html.find('.export-button').click(() => dialog._exportKarmaHistory(dialog._karmaHistory));

            // Add Entry
            html.find('.add-entry').click(async (ev) => {
                ev.preventDefault();
                await dialog._onAddKarmaEntry(ev);
            });
        }
        }, {
            classes: ["karma-history"],
            width: 600,
            height: 400,
            resizable: true
        });
    
        dialog.render(true);
    }
    
    // Add this method to handle adding new karma entries
    // In MarvelActorSheet.js, in the _onAddKarmaEntry method
async _onAddKarmaEntry(event) {
    event.preventDefault();
    
    const addEntryContent = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/add-karma-entry.html",
        { entry: { amount: '', description: '' } }  // Add default values
    );
    
    new Dialog({
        title: "Add Karma Entry",
        content: addEntryContent,
        buttons: {
            add: {
                label: "Add Entry",
                callback: async (html) => {
                    const form = html.find('form')[0];
                    // Use Number instead of parseInt to handle decimals if needed
                    const amount = Number(form.amount.value);
                    const description = form.description.value;
                    
                    // Better validation
                    if (isNaN(amount) || !description) {
                        ui.notifications.error("Please enter a valid amount and description");
                        return;
                    }
                    
                    // Create new entry
                    const newEntry = {
                        date: new Date().toLocaleString(),
                        amount: amount,
                        description: description
                    };
                    
                    // Get current history
                    const currentHistory = this.actor.system.karmaTracking.history || [];
                    const currentKarma = this.actor.system.secondaryAbilities.karma.value;
                    
                    // Update actor
                    await this.actor.update({
                        "system.karmaTracking.history": [...currentHistory, newEntry],
                        "system.secondaryAbilities.karma.value": currentKarma + amount
                    });
                    
                    // Refresh the karma history window
                    this._onKarmaHistoryClick(event);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "add",
        render: (html) => {
            // Ensure number input is focused and working
            const amountInput = html.find('input[name="amount"]');
            amountInput.focus();
        }
    }).render(true);
}
    
    async _onEditKarmaEntry(event, entry) {
        event.preventDefault();
        
        const addEntryContent = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/add-karma-entry.html",
            { entry }
        );
        
        new Dialog({
            title: "Edit Karma Entry",
            content: addEntryContent,
            buttons: {
                save: {
                    label: "Save Changes",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const newAmount = parseInt(form.amount.value);
                        const newDescription = form.description.value?.trim(); // Add trim
                        
                        if (!newAmount || !newDescription) {
                            ui.notifications.error("Please fill in all fields");
                            return;
                        }
    
                        // Get current history
                        const currentHistory = duplicate(this.actor.system.karmaTracking.history || []); // Add duplicate for safety
                        const currentKarma = this.actor.system.secondaryAbilities.karma.value;
                        
                        // Find and update the entry
                        const index = currentHistory.findIndex(e => 
                            e.date === entry.date && 
                            e.amount === entry.amount && 
                            e.description === entry.description
                        );
    
                        if (index !== -1) {
                            // Calculate karma difference
                            const karmaDiff = newAmount - entry.amount;
                            
                            // Update the entry
                            const updatedHistory = [...currentHistory];
                            updatedHistory[index] = {
                                date: entry.date,
                                amount: newAmount,
                                description: newDescription
                            };
    
                            try {
                                // Update actor
                                await this.actor.update({
                                    "system.karmaTracking.history": updatedHistory,
                                    "system.secondaryAbilities.karma.value": currentKarma + karmaDiff
                                });
                                
                                // Refresh the karma history window
                                this._onKarmaHistoryClick(event);
                            } catch (error) {
                                console.error("Error updating karma entry:", error);
                                ui.notifications.error("Error updating karma entry");
                            }
                        }
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "save",
            render: (html) => {
                // Pre-fill the form with existing values
                const form = html.find('form')[0];
                form.amount.value = entry.amount;
                form.description.value = entry.description;
            }
        }).render(true);
    }
    
    // delete karma entry
    async _onDeleteKarmaEntry(event, index) {
        event.preventDefault();

        // Confirm deletion
        const confirm = await Dialog.confirm({
            title: "Delete Karma Entry",
            content: "Are you sure you want to delete this karma entry? This cannot be undone.",
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (!confirm) return;

        // Get current history
        const currentHistory = duplicate(this.actor.system.karmaTracking.history);
        
        // Get the entry to be deleted - this was the issue
        const deletedEntry = currentHistory[index];
        if (!deletedEntry) {
            console.error("Could not find karma entry at index:", index);
            return;
        }

        // Remove the entry
        currentHistory.splice(index, 1);
        
        // Update actor with both the history and karma pool
        const currentKarma = this.actor.system.secondaryAbilities.karma.value;
        await this.actor.update({
            "system.karmaTracking.history": currentHistory,
            "system.secondaryAbilities.karma.value": currentKarma - deletedEntry.amount
        });
        
        // Refresh the karma history window
        await this._onKarmaHistoryClick(event);
    }
    
    _sortKarmaHistory(history, sort) {
        return [...history].sort((a, b) => {
            let comparison = 0;
            switch (sort.field) {
                case 'date':
                    comparison = new Date(b.date) - new Date(a.date);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'description':
                    comparison = a.description.localeCompare(b.description);
                    break;
            }
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }
    
    _filterKarmaHistory(history, type) {
        switch (type) {
            case 'earned':
                return history.filter(entry => entry.amount > 0);
            case 'spent':
                return history.filter(entry => entry.amount < 0);
            default:
                return history;
        }
    }
    
    _updateKarmaDisplay(html, history) {
        const entriesContainer = html.find('.karma-entries');
        entriesContainer.empty();
        
        history.forEach((entry, index) => {
            const entryHtml = `
                <div class="karma-entry" data-entry-index="${index}">
                    <div class="entry-date">${entry.date}</div>
                    <div class="entry-amount ${entry.amount > 0 ? 'positive' : 'negative'}">
                        ${entry.amount > 0 ? '+' : ''}${entry.amount}
                    </div>
                    <div class="entry-description">${entry.description}</div>
                    <div class="entry-actions">
                        <a class="edit-entry" data-index="${index}"><i class="fas fa-edit"></i></a>
                        <a class="delete-entry" data-index="${index}"><i class="fas fa-trash"></i></a>
                    </div>
                </div>
            `;
            entriesContainer.append(entryHtml);
        });
    }
    
    _updateSortIndicators(html, currentSort) {
        const headers = html.find('.sortable');
        headers.removeClass('sorted-asc sorted-desc');
        headers.find('.fa-sort').removeClass('fa-sort-up fa-sort-down');
        
        const currentHeader = headers.filter(`[data-sort="${currentSort.field}"]`);
        currentHeader.addClass(`sorted-${currentSort.direction}`);
    }
    
    async _exportKarmaHistory(history) {
        const content = history.map(entry => 
            `${entry.date},${entry.amount},"${entry.description}"`
        ).join('\n');
        
        const blob = new Blob([`Date,Amount,Description\n${content}`], {type: 'text/csv'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `karma-history-${this.actor.name}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 0);
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
        
        // Handle talents list according to template.json structure
        if (expandedData.system?.talents?.list) {
            const talents = Object.values(expandedData.system.talents.list);
            expandedData.system.talents.list = talents;
        }
        
        // Handle contacts list according to template.json structure
        if (expandedData.system?.contacts?.list) {
            const contacts = Object.values(expandedData.system.contacts.list);
            expandedData.system.contacts.list = contacts;
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
        
        const powerID = event.currentTarget.dataset.id;
        const power = this.actor.items.get(powerID);
        console.log("Editing power:", power);
        console.log("Power system data:", power.system);
        
        if (!power) {
            ui.notifications.error("Power not found");
            return;
        }
    
        // Structure the data to match the template's expectations
        const templateData = {
            power: {
                name: power.name,
                system: power.system  // Preserve the nested system data structure
            },
            config: {
                ranks: Object.entries(CONFIG.marvel.ranks).reduce((obj, [key, value]) => {
                    obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
                    return obj;
                }, {})
            }
        };
    
        console.log("Template data for power edit:", templateData);
    
        // Proceed to render the edit dialog
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/edit-power.html", 
            templateData
        );
        
        return new Dialog({
            title: "Edit Power",
            content: html,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        // Get form values and prepare updated power data
                        const form = html[0].querySelector("form");
                        if (!form) return;
                        
                        // Log form values for debugging
                        console.log("Form values:", {
                            name: form.querySelector('[name="name"]').value,
                            rank: form.querySelector('[name="rank"]').value,
                            damage: form.querySelector('[name="damage"]').value,
                            range: form.querySelector('[name="range"]').value,
                            description: form.querySelector('[name="description"]').value,
                            limitations: form.querySelector('[name="limitations"]').value,
                            type: form.querySelector('[name="type"]').value
                        });
            
                        // Prepare the updated power data
                        const rankKey = form.querySelector('[name="rank"]').value;
                        const rankNumber = CONFIG.marvel.ranks[rankKey]?.standard || 0;
                        const updatedPower = {
                            name: form.querySelector('[name="name"]').value || "",
                            system: {  // Add this system wrapper
                                rank: rankKey,
                                rankNumber: rankNumber,
                                damage: parseInt(form.querySelector('[name="damage"]').value) || 0,
                                range: parseInt(form.querySelector('[name="range"]').value) || 0,
                                description: form.querySelector('[name="description"]').value || "",
                                limitations: form.querySelector('[name="limitations"]').value || "",
                                type: form.querySelector('[name="type"]').value || ""
                            }
                        };
            
                        console.log("Updated Power Data:", updatedPower);  // Log the updated power data
            
                        // Update the power in the actor's items
                        await this.actor.updateEmbeddedDocuments("Item", [{
                            _id: power.id,
                            ...updatedPower
                        }]);
            
                        console.log("Power updated successfully:", updatedPower);
                        console.log("Updated power in actor:", this.actor.items.contents);
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
        const powerID = event.currentTarget.dataset.id;
        console.log("Rolling power with ID:", powerID);
        
        const power = this.actor.items.get(powerID);
        if (!power) {
            console.error("Power not found:", powerID);
            ui.notifications.error("Power not found");
            return;
        }
    
        const stored = await game.user.getFlag("world", "marvelRollOptions") || {
            columnShift: 0,
            karmaPoints: 0
        };
    
        const template = "systems/marvel-faserip/templates/dialogs/ability-roll.html";
        const templateData = {
            config: CONFIG.marvel,
            columnShift: stored.columnShift || 0,
            karmaPoints: stored.karmaPoints || 0,
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
                        if (!form) {
                            console.error("Form not found in dialog");
                            return;
                        }
    
                        const options = {
                            columnShift: parseInt(form.querySelector('[name="columnShift"]')?.value || "0"),
                            karmaPoints: parseInt(form.querySelector('[name="karmaPoints"]')?.value || "0")
                        };
    
                        console.log("Roll options:", options);
                        await game.user.setFlag("world", "marvelRollOptions", options);
    
                        try {
                            await this.actor.rollPower(powerID, options);
                        } catch (error) {
                            console.error("Error rolling power:", error);
                            ui.notifications.error("Error rolling power");
                        }
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "roll"
        }).render(true);
    }

    /* async rollPower(powerID, options = {}) {
        // Get the power item by ID
        const power = this.items.get(powerID);
        if (!power) {
            console.error(`Power with ID ${powerID} not found`);
            throw new Error(`Power not found`);
        }
        console.log("Rolling power:", power);
    
        const baseRank = power.system.rank;
        const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
        
        // Roll and add karma
        const roll = await new Roll("1d100").evaluate({async: true});
        const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
        const finalRoll = Math.min(100, roll.total + karmaPoints);
        
        // Deduct karma if used
        if (karmaPoints > 0) {
            await this.update({
                "system.secondaryAbilities.karma.value": this.system.secondaryAbilities.karma.value - karmaPoints
            });
        }
        
        // Get the color result
        const color = this.getColorResult(finalRoll, shiftedRank);
        
        // Create chat message content
        const messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - ${power.name} Power FEAT</h3>
                <div class="roll-details">
                    <div>Power Rank: ${baseRank}</div>
                    ${options.columnShift ? 
                        `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? 
                        ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                    ${power.system.damage ? `<div>Damage: ${power.system.damage}</div>` : ''}
                    ${power.system.range ? `<div>Range: ${power.system.range} areas</div>` : ''}
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    ${color.toUpperCase()}
                </div>
            </div>`;
    
        // Create chat message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });
    
        return { roll, color };
    } */
    

async _onDeletePower(event) {
    event.preventDefault();
    const powerID = event.currentTarget.dataset.id;
    console.log("Deleting power with ID:", powerID);
    
    const power = this.actor.items.get(powerID);
    if (!power) {
        console.error("Power not found:", powerID);
        return;
    }

    const confirmDelete = await Dialog.confirm({
        title: "Confirm Deletion",
        content: `<p>Are you sure you want to delete "${power.name}"?</p>`,
        defaultYes: false
    });

    if (confirmDelete) {
        await power.delete();
        console.log("Power deleted");
    }
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
                    const attackData = {
                        name: formData.get("attackName"),
                        type: "attack",
                        img: "icons/svg/sword.svg",  // Default icon
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

                    try {
                        await this.actor.createEmbeddedDocuments("Item", [attackData]);
                        ui.notifications.info(`Created attack: ${attackData.name}`);
                    } catch (error) {
                        console.error("Error creating attack:", error);
                        ui.notifications.error("Error creating attack. Check console for details.");
                    }
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
    const dialogHtml = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/add-power.html",
        {
            config: {
                ranks: Object.entries(CONFIG.marvel.ranks).reduce((obj, [key]) => {
                    obj[key] = game.i18n.localize(`MARVEL.Rank${key.replace(/\s+/g, '')}`);
                    return obj;
                }, {})
            }
        }
    );

    new Dialog({
        title: "Add New Power",
        content: dialogHtml,
        buttons: {
            create: {
                label: "Create",
                callback: async (html) => {
                    // Add error checking for form
                    const form = html[0]?.querySelector("form");
                    if (!form) {
                        console.error("Form not found");
                        return;
                    }

                    // Add null checks for each form field
                    const nameInput = form.querySelector('[name="name"]');
                    const rankInput = form.querySelector('[name="rank"]');
                    const damageInput = form.querySelector('[name="damage"]');
                    const rangeInput = form.querySelector('[name="range"]');
                    const descriptionInput = form.querySelector('[name="description"]');
                    const limitationsInput = form.querySelector('[name="limitations"]');
                    const typeInput = form.querySelector('[name="type"]');

                    // Log form elements to help debug
                    console.log("Form elements:", {
                        nameInput,
                        rankInput,
                        damageInput,
                        rangeInput,
                        descriptionInput,
                        limitationsInput,
                        typeInput
                    });

                    const name = nameInput?.value || "New Power";
                    const rank = rankInput?.value || "Feeble";
                    const rankNumber = CONFIG.marvel.ranks[rank]?.standard || 2;
                    const damage = parseInt(damageInput?.value) || 0;
                    const range = parseInt(rangeInput?.value) || 0;
                    const description = descriptionInput?.value || "";
                    const limitations = limitationsInput?.value || "";
                    const type = typeInput?.value || "utility";

                    const powerData = {
                        name: name,
                        type: "power",
                        img: "systems/marvel-faserip/assets/icons/ability.webp",
                        system: {
                            rank: rank,
                            rankNumber: rankNumber,
                            damage: damage,
                            range: range,
                            description: description,
                            limitations: limitations,
                            type: type
                        }
                    };

                    console.log("Creating new power:", powerData);
                    try {
                        const created = await this.actor.createEmbeddedDocuments("Item", [powerData]);
                        console.log("Power created:", created);
                        ui.notifications.info(`Created power: ${powerData.name}`);
                    } catch (error) {
                        console.error("Error creating power:", error);
                        ui.notifications.error("Error creating power");
                    }
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "create"
    }).render(true);
}
                        

async _onAddTalent(event) {
    console.log("Add talent clicked");
    event.preventDefault();
    //const talents = this.actor.system.talents?.talents?.list || [];
    const talents = foundry.utils.getProperty(this.actor.system, "talents.list") || [];

    // Create new talent matching template.json schema
    const newTalent = {
        name: "",
        description: "",
        rules: ""
    };
    
    const updatedTalents = [...talents, newTalent];
    
    await this.actor.update({
        "system.talents.list": updatedTalents
    });
    this.render(false); // Add this line
}

async _onAddContact(event) {
    console.log("Add contact clicked");
    event.preventDefault();
    //const contacts = this.actor.system.contacts?.contacts?.list || [];
    const contacts = foundry.utils.getProperty(this.actor.system, "contacts.list") || [];

    // Create new contact matching template.json schema
    const newContact = {
        name: "",
        type: "",
        reliability: "",
        description: "",
        rules: ""
    };
    
    const updatedContacts = [...contacts, newContact];
    
    await this.actor.update({
        "system.contacts.list": updatedContacts
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
    const powerID = event.currentTarget.dataset.id;
    console.log("Getting power info for ID:", powerID);
    
    const power = this.actor.items.get(powerID);
    if (!power) {
        console.error("Power not found:", powerID);
        return;
    }

    // Format description text or use name if no description
    const description = power.system.description || power.name;
    const formattedDesc = description.replace(/\n/g, '<br>');
    const limitations = power.system.limitations ? 
        `<div class="power-limitations">Limitations: ${power.system.limitations}</div>` : '';

    // Create chat message with power info
    const messageContent = `
        <div class="marvel-power-info">
            <h2 style="color: #782e22; border-bottom: 2px solid #782e22; margin-bottom: 5px;">
                ${power.name}
            </h2>
            <div class="power-details">
                <div style="margin-bottom: 5px;">
                    <strong>Rank:</strong> ${power.system.rank}
                    ${power.system.damage ? `<br><strong>Damage:</strong> ${power.system.damage}` : ''}
                    ${power.system.range ? `<br><strong>Range:</strong> ${power.system.range}` : ''}
                    ${power.system.type ? `<br><strong>Type:</strong> ${power.system.type}` : ''}
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

async _onAddResistance(event) {
    console.log("Adding new resistance");
    event.preventDefault();
    
    const resistances = foundry.utils.getProperty(this.actor.system, "resistances.list") || [];
    
    // Create new resistance entry
    const newResistance = {
        type: "",
        rank: "",
        number: 0
    };
    
    const updatedResistances = [...resistances, newResistance];
    
    await this.actor.update({
        "system.resistances.list": updatedResistances
    });
    
    console.log("New resistance added", newResistance);
    this.render(false);
}

async _onResistanceNumberChange(event) {
    console.log("Resistance number change triggered");
    event.preventDefault();
    const element = event.currentTarget;
    const resistancePath = element.dataset.resistance;
    const newNumber = parseInt(element.value) || 0;
    const newRank = this.actor.getRankFromValue(newNumber);

    // Create update data
    const updateData = {
        [`system.resistances.${resistancePath}.rank`]: newRank,
        [`system.resistances.${resistancePath}.number`]: newNumber
    };

    console.log("Updating resistance with data:", updateData);
    await this.actor.update(updateData);
    this.render(false);
}

async _onResistanceRankChange(event) {
    console.log("Resistance rank change triggered");
    event.preventDefault();
    const element = event.currentTarget;
    const resistancePath = element.dataset.resistance;
    const newRank = element.value;
    const rankNumber = CONFIG.marvel.ranks[newRank]?.standard || 0;

    // Create update data
    const updateData = {
        [`system.resistances.${resistancePath}.rank`]: newRank,
        [`system.resistances.${resistancePath}.number`]: rankNumber
    };

    console.log("Updating resistance with data:", updateData);
    await this.actor.update(updateData);
    this.render(false);
}
}
async function createFaseripMacro(data, slot) {
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;
  
    // Create the macro command
    const command = `game.faserip.rollItemMacro("${item.name}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: { "faserip.itemMacro": true }
      });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
  }
  
  function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  
    // Trigger the item roll
    return item.roll();
  }