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

    static equipmentTypes = {
        "weapon": "Weapons",
        "armor": "Armor", 
        "gear": "Gear"
    };

    async getData(options = {}) {
        const context = await super.getData(options);
        console.log("Sheet data context:", context.actor.system.primaryAbilities);
        
        // Ensure context.actor.system exists and initialize if needed
        const system = context.actor.system || {};

        console.log("Current actor items:", this.actor.items);

        // equipment organization here
        context.equipmentTypes = MarvelActorSheet.equipmentTypes;
        context.equipmentByType = {};
        for (let type in MarvelActorSheet.equipmentTypes) {
            context.equipmentByType[type] = context.items.filter(i => i.type === type);
        }
        
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
        if (!context.actor.system.karmaTracking) {
            context.actor.system.karmaTracking = {
                karmaPool: 0,
                advancementFund: 0,
                lifetimeTotal: 0
            };
        }

        // Get equipment items
        context.equipment = context.items.filter(item => 
            ["weapon", "armor", "gear"].includes(item.type)
        );
        
        // Get weapons specifically for weapon-related features
        context.weapons = context.items.filter(item => item.type === "weapon");
        
        // Add equipment configuration
        context.equipmentConfig = {
            types: {
                weapon: "Weapon",
                armor: "Armor",
                gear: "Gear"
            },
            weaponTypes: CONFIG.marvel.weaponTypes,
            armorTypes: CONFIG.marvel.armorTypes,
            materialTypes: CONFIG.marvel.materialTypes
        };
    
        // Calculate Lifetime Total
        /* if (context.actor.system.karmaTracking) {
            context.actor.system.karmaTracking.lifetimeTotal = 
                (context.actor.system.karmaTracking.advancementFund || 0) + 
                (context.actor.system.karmaTracking.karmaPool || 0);
        } */

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
        
        // Get equipment
        context.equipment = this.actor.items.filter(item => item.type === "equipment");
        // Add logging to verify equipment is being found
        console.log("Equipment items:", context.equipment);

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

    // Equipment methods
    async _onAddEquipment(event) {
        event.preventDefault();
        console.log("Starting _onAddEquipment method");
    
        // Get the weapon system
        if (!game.marvel?.WeaponSystem) {
            console.error("Weapon system not initialized");
            ui.notifications.error("Weapon system not available");
            return;
        }
    
        const weaponSystem = game.marvel.WeaponSystem;
    
        // Prepare dialog data
        const dialogData = {
            types: {
                "S": "Shooting",
                "F": "Force",
                "E": "Energy",
                "EA": "Edged Attack",
                "ET": "Edged Thrown",
                "BA": "Blunt Attack",
                "BT": "Blunt Thrown"
            },
            ranks: CONFIG.marvel.ranks,
            materials: {
                "Poor": "Poor",
                "Typical": "Typical",
                "Good": "Good",
                "Excellent": "Excellent",
                "Remarkable": "Remarkable"
            },
            ammoTypes: {
                "standard": "Standard",
                "mercy": "Mercy Shot",
                "ap": "Armor Piercing",
                "rubber": "Rubber Shot",
                "explosive": "Explosive Shot"
            },
            weightClasses: {
                "light": "Light",
                "medium": "Medium", 
                "heavy": "Heavy",
                "superheavy": "Super Heavy"
            },
            magazinePresets: {
                "S": 6,  // Standard firearms
                "F": 10, // Force weapons
                "E": 10, // Energy weapons
                "ET": 1, // Thrown edged
                "BT": 1  // Thrown blunt
            },
            weapons: weaponSystem.weapons
        };
        
        console.log("Dialog data prepared:", dialogData);
    
        try {
            const template = "systems/marvel-faserip/templates/dialogs/add-equipment.html";
            const html = await renderTemplate(template, dialogData);
    
            return new Dialog({
                title: "Add Equipment",
                content: html,
                buttons: {
                    create: {
                        label: "Create",
                        callback: async (html) => {
                            try {
                                const form = html.find('form');
                                const equipmentSource = form.find('[name="equipmentSource"]').val();
                                let equipmentData;
    
                                if (equipmentSource === "predefined") {
                                    // Get predefined weapon data
                                    const weaponKey = form.find('[name="predefinedWeapon"]').val();
                                    const weapon = weaponSystem.weapons[weaponKey];
                                    
                                    equipmentData = {
                                        name: weapon.name,
                                        type: "equipment",
                                        img: "systems/marvel-faserip/assets/icons/weapons/generic-weapon.svg", // Updated image path
                                        system: {
                                            subtype: "weapon",
                                            type: weapon.type,
                                            range: weapon.range,
                                            damage: weapon.damage,
                                            rate: weapon.rate,
                                            shots: weapon.shots,
                                            maxShots: weapon.shots,
                                            material: weapon.material,
                                            price: weapon.price,
                                            special: weapon.notes?.join(", ") || "",
                                            description: "",
                                            powerPack: weapon.notes?.includes("Power pack") || false
                                        }
                                    };
    
                                    if (equipmentData.system.powerPack) {
                                        equipmentData.system.powerPackCharge = 10;
                                        equipmentData.system.powerPackMaxCharge = 10;
                                    }
                                } else {
                                    // Original custom equipment creation
                                    equipmentData = {
                                        name: form.find('[name="equipmentName"]').val(),
                                        type: "equipment",
                                        img: "systems/marvel-faserip/assets/icons/weapons/generic-weapon.svg", // Updated image path
                                        system: {
                                            subtype: "weapon",
                                            type: form.find('[name="type"]').val(),
                                            range: form.find('[name="range"]').val(),
                                            damage: parseInt(form.find('[name="damage"]').val()) || 0,
                                            rate: parseInt(form.find('[name="rate"]').val()) || 1,
                                            shots: parseInt(form.find('[name="shots"]').val()) || 0,
                                            maxShots: parseInt(form.find('[name="magazineSize"]').val()) || 0,
                                            material: form.find('[name="material"]').val(),
                                            price: form.find('[name="price"]').val(),
                                            weight: form.find('[name="weight"]').val(),
                                            legality: form.find('[name="legality"]').val(),
                                            ammoType: form.find('[name="ammoType"]').val(),
                                            special: form.find('[name="special"]').val(),
                                            description: form.find('[name="description"]').val(),
                                            powerPack: form.find('[name="powerPack"]').prop("checked") || false
                                        }
                                    };
    
                                    if (equipmentData.system.powerPack) {
                                        equipmentData.system.powerPackCharge = 10;
                                        equipmentData.system.powerPackMaxCharge = 10;
                                    }
                                }
    
                                console.log("Equipment data prepared:", equipmentData);
                                const created = await this.actor.createEmbeddedDocuments("Item", [equipmentData]);
                                console.log("Equipment created:", created);
                                
                                ui.notifications.info(`Created equipment: ${equipmentData.name}`);
    
                            } catch (error) {
                                console.error("Error in create callback:", error);
                                console.error("Error stack:", error.stack);
                                ui.notifications.error("Error creating equipment. Check console for details.");
                            }
                        }
                    },
                    cancel: {
                        label: "Cancel"
                    }
                },
                default: "create",
                width: 400,
                render: (html) => {
                    console.log("Dialog rendered with HTML:", html);
                    
                    // Handle equipment source changes
                    html.find('[name="equipmentSource"]').on('change', (event) => {
                        const source = event.currentTarget.value;
                        html.find('.predefined-section').toggle(source === "predefined");
                        html.find('.custom-section').toggle(source === "custom");
                    });
                
                    // Add magazine preset handler
                    html.find('.magazine-presets').on('click', (event) => {
                        const weaponType = html.find('[name="type"]').val();
                        const presetSize = dialogData.magazinePresets[weaponType] || 6;
                        html.find('[name="magazineSize"]').val(presetSize);
                        
                        // Also update shots field
                        html.find('[name="shots"]').val(presetSize);
                    });
                
                    // Enhanced weapon type change handler
                    html.find('[name="type"]').on('change', (event) => {
                        const weaponType = event.currentTarget.value;
                        const isRanged = ["S", "F", "E", "ET", "BT"].includes(weaponType);
                        const isPowered = ["E", "F"].includes(weaponType);
                        const usesAmmo = weaponType === "S";
                        
                        html.find('.range-group').toggle(isRanged);
                        html.find('.power-pack-group').toggle(isPowered);
                        html.find('.ammo-group').toggle(usesAmmo);
                        html.find('.ammo-capacity-group').toggle(isRanged);
                        html.find('.legality-group').toggle(true); // Always show legality
                        
                        // Update magazine size based on weapon type
                        const magazineSize = dialogData.magazinePresets[weaponType] || 6;
                        html.find('[name="magazineSize"]').val(magazineSize);
                        html.find('[name="shots"]').val(magazineSize);
                
                        // Original shots field logic
                        const shotsField = html.find('[name="shots"]');
                        if (weaponType === "S") shotsField.val(6);
                        else if (weaponType === "E" || weaponType === "F") shotsField.val(10);
                    });
                }
            }).render(true);
            
        } catch (error) {
            console.error("Error rendering dialog:", error);
            console.error("Error stack:", error.stack);
            ui.notifications.error("Error rendering equipment dialog. Check console for details.");
        }
    }

    async _onRollEquipment(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".equipment-row").dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Equipment not found");
            return;
        }

        // Map equipment types to attack types from ACTION_RESULTS
        const typeMap = {
            "S": "Sh",    // Shooting
            "F": "Fo",    // Force
            "E": "En",    // Energy
            "EA": "EA",   // Edged Attack
            "ET": "TE",   // Throwing Edged
            "BA": "BA",   // Blunt Attack
            "BT": "TB"    // Throwing Blunt
        };

        const attackType = typeMap[item.system.type];
        if (!attackType || !CONFIG.marvel.actionResults[attackType]) {
            ui.notifications.error("Invalid attack type");
            return;
        }

        // Get the ability associated with this attack type from ACTION_RESULTS
        const ability = CONFIG.marvel.actionResults[attackType].ability.toLowerCase();
    
        // Get the stored roll options or use defaults
        const stored = await game.user.getFlag("world", "marvelEquipmentOptions") || {
            columnShift: 0,
            karmaPoints: 0
        };
    
        // Prepare the template data
        const templateData = {
            config: CONFIG.marvel,
            columnShift: stored.columnShift,
            karmaPoints: stored.karmaPoints,
            equipment: item
        };
    
        // Render the roll dialog
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/ability-roll.html",
            templateData
        );
    
        return new Dialog({
            title: `${item.name} Equipment Roll`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        const options = {
                            columnShift: parseInt(form.querySelector('[name="columnShift"]')?.value || "0"),
                            karmaPoints: parseInt(form.querySelector('[name="karmaPoints"]')?.value || "0"),
                            weaponDamage: item.system.damage,
                            range: item.system.range,
                            featType: "combat",
                            actionType: attackType
                        };
    
                        // Store options for next time
                        await game.user.setFlag("world", "marvelEquipmentOptions", {
                            columnShift: options.columnShift,
                            karmaPoints: options.karmaPoints
                        });
    
                        // Determine which ability to use based on equipment type
                        /* let ability;
                        switch(item.system.type) {
                            case "S": ability = "agility"; break;  // Shooting
                            case "F": ability = "strength"; break; // Force
                            case "E": ability = "reason"; break;   // Energy
                            case "EA":
                            case "BA": ability = "fighting"; break; // Edged/Blunt Attack
                            case "ET":
                            case "BT": ability = "agility"; break;  // Thrown weapons
                            default: ability = "fighting";
                        } */
    
                        // Roll using the appropriate ability
                        await this.actor.rollAttack(ability, item.system.type, options);
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "roll"
        }).render(true);
    }
    
    async _onEditEquipment(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".equipment-row").dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Equipment not found");
            return;
        }
    
        // Prepare dialog data
        const dialogData = {
            types: {
                "S": "Shooting",
                "F": "Force",
                "E": "Energy",
                "EA": "Edged Attack",
                "ET": "Edged Thrown",
                "BA": "Blunt Attack",
                "BT": "Blunt Thrown"
            },
            item: item
        };
    
        // Get the template
        const template = "systems/marvel-faserip/templates/dialogs/edit-equipment.html";
        const html = await renderTemplate(template, dialogData);
    
        return new Dialog({
            title: `Edit Equipment: ${item.name}`,
            content: html,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const formData = new FormData(form);
                        
                        const equipmentData = {
                            name: formData.get("equipmentName"),
                            system: {
                                type: formData.get("type"),
                                range: formData.get("range"),
                                damage: parseInt(formData.get("damage")) || 0,
                                rate: parseInt(formData.get("rate")) || 1,
                                shots: parseInt(formData.get("shots")) || 0,
                                material: formData.get("material"),
                                price: formData.get("price"),
                                special: formData.get("special"),
                                description: formData.get("description")
                            }
                        };
    
                        try {
                            await item.update(equipmentData);
                            ui.notifications.info(`Updated equipment: ${equipmentData.name}`);
                        } catch (error) {
                            console.error("Error updating equipment:", error);
                            ui.notifications.error("Error updating equipment");
                        }
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "save",
        }).render(true);
    }

    async _onDeleteEquipment(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".equipment-row").dataset.itemId;
        
        const confirmDelete = await Dialog.confirm({
            title: "Delete Equipment",
            content: "<p>Are you sure you want to delete this equipment?</p>",
            yes: () => true,
            no: () => false,
            defaultYes: false
        });
    
        if (confirmDelete) {
            await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        }
    }
    
    async _onReloadWeapon(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".equipment-row").dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Weapon not found");
            return;
        }
        
        await item.reload();
    }

    activateListeners(html) {
        super.activateListeners(html);
    
        if (this.isEditable) {
            console.log("Setting up listeners");
            html.find('.initial-roll-input').change(this._onInitialRollChange.bind(this));
            
            // Add drag events for macros
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("item-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
    
            // Testing bindings remain the same
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
                { selector: '.add-power-stunt', method: this._onCreatePowerStunt },
                { selector: '.roll-power-stunt', method: this._onRollPowerStunt }
            ];
    
            // Power related listeners - keep only one set
            html.find('.add-power').click(ev => this._onAddPower(ev));
            html.find('.power-info-icon').click(ev => this._onPowerInfo(ev));
            html.find('.power-edit').click(ev => this._onPowerEdit(ev));
            html.find('.roll-power').click(ev => this._onPowerRoll(ev));
            html.find('.item-delete[data-type="power"]').click(ev => this._onDeletePower(ev));
    
            // Equipment related listeners - consolidated
            html.find('.add-equipment').click(ev => this._onAddEquipment(ev));
            html.find('.equipment-row img').click(ev => this._onEquipmentInfo(ev));
            html.find('.roll-equipment').click(ev => this._onRollEquipment(ev));
            html.find('.item-edit[data-type="equipment"]').click(ev => this._onEditEquipment(ev));
            html.find('.item-delete[data-type="equipment"]').click(ev => this._onDeleteEquipment(ev));
            html.find('.reload-weapon').click(ev => this._onReloadWeapon(ev));

            // Equipment related listeners - corrected selectors
            html.find('.item-controls .item-edit').click(ev => this._onEditEquipment(ev));
            html.find('.item-controls .item-delete').click(ev => this._onDeleteEquipment(ev));
            html.find('.item-controls .reload-weapon').click(ev => this._onReloadWeapon(ev));
            
            // Equipment filters
            html.find('.filter-btn').click(ev => {
                const filter = ev.currentTarget.dataset.filter;
                html.find('.filter-btn').removeClass('active');
                ev.currentTarget.classList.add('active');
                
                if (filter === 'all') {
                    html.find('.equipment-row').show();
                } else {
                    html.find('.equipment-row').hide();
                    html.find(`.equipment-row[data-type="${filter}"]`).show();
                }
            });
    
            // Karma history
            html.find('.karma-history-button').click(ev => this._onKarmaHistoryClick(ev));
    
            // Ability, popularity, and resource rolls
            html.find('.ability-label').click(ev => this._onAbilityRoll(ev));
            html.find('.clickable-popularity').click(ev => this._onPopularityRoll(ev));
            html.find('.clickable-resources').click(ev => this._onResourceRoll(ev));
            
            // Talents and contacts
            html.find('.add-talent').click(ev => this._onAddTalent(ev));
            html.find('.add-contact').click(ev => this._onAddContact(ev));
    
            // Resistance handlers
            html.find('.resistance-number').change(this._onResistanceNumberChange.bind(this));
            html.find('.rank-select').change(this._onResistanceRankChange.bind(this));
            html.find('.add-resistance').click(ev => this._onAddResistance(ev));
    
            // Navigation tabs
            html.find('.nav-item').off('click').on('click', ev => this._onTabChange(ev));
    
            // Attack handlers
            html.find('.add-attack').click(ev => this._onAddAttack(ev));
            html.find('.roll-attack').click(ev => this._onAttackRoll(ev));
            html.find('.attack-row img').click(ev => this._onAttackInfo(ev));
    
            // Karma input listeners
            html.find('input[name="system.karmaTracking.advancementFund"], input[name="system.karmaTracking.karmaPool"], input[name="system.karmaTracking.lifetimeTotal"]')
                .on('change', async (event) => {
                    const target = event.currentTarget;
                    const value = parseInt(target.value) || 0;
                    const field = target.name;
                    await this.actor.update({
                        [field]: value
                    });
                });
        }
    }

    async _onInitialRollChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityPath = element.dataset.ability;
        const newRoll = element.value;
        const cleanPath = abilityPath.replace('primaryAbilities.', '');
        
        console.log(`Updating initial roll for ${cleanPath} to ${newRoll}`);
        
        await this.actor.update({
            [`system.primaryAbilities.${cleanPath}.initialRoll`]: newRoll
        });
    }

    async _onAttackRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".attack-row").dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            ui.notifications.error("Attack item not found");
            return;
        }
    
        return await item.roll();
    }
    
    async _onAttackInfo(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".attack-row").dataset.itemId;
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
    }

    // handler for karma history
    /* async _onKarmaHistoryClick(event) {
        event.preventDefault();
        
        // Initialize properties
        const history = this.actor.system.karmaTracking.history || [];
        
        const content = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/karma-history.html",
            {
                actor: this.actor,
                karmaHistory: history
            }
        );
    
        new Dialog({
            title: `Karma History - ${this.actor.name}`,
            content: content,
            buttons: {
                add: {
                    label: "Add Entry",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const date = form.date.value;
                        const amount = parseInt(form.amount.value);
                        const description = form.description.value;
                        
                        if (!date || !amount || !description) {
                            ui.notifications.warn("Please fill in all fields");
                            return;
                        }
    
                        const currentHistory = this.actor.system.karmaTracking.history || [];
                        await this.actor.update({
                            "system.karmaTracking.history": [...currentHistory, {
                                date,
                                amount,
                                description
                            }]
                        });
    
                        this._onKarmaHistoryClick(event);
                    }
                },
                close: {
                    label: "Close"
                }
            },
            classes: ["karma-history"],
            width: 600,
            height: 400,
            resizable: true
        }).render(true);
    } */

    // In MarvelActorSheet.js, in the _onAddKarmaEntry method
/* async _onAddKarmaEntry(event) {
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
} */
    
    /* async _onEditKarmaEntry(event, entry) {
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
    } */
    
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

    async _onJoinPool(event) {
        event.preventDefault();
        
        const content = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/join-pool.html",
            {
                actor: this.actor,
                maxContribution: this.actor.system.karmaTracking.karmaPool
            }
        );
    
        new Dialog({
            title: "Join Karma Pool",
            content: content,
            buttons: {
                join: {
                    label: "Join",
                    callback: async (html) => {
                        const contribution = parseInt(html.find('[name="contribution"]').val()) || 0;
                        const isPermanent = html.find('[name="permanent"]').prop("checked");
                        const isLocked = html.find('[name="locked"]').prop("checked");
                        
                        await this.actor.joinKarmaPool({
                            contribution,
                            isPermanent,
                            isLocked
                        });
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        }).render(true);
    }
    
    async _onLeavePool(event) {
        event.preventDefault();
        
        const confirmLeave = await Dialog.confirm({
            title: "Leave Karma Pool",
            content: "Are you sure you want to leave the karma pool? You'll receive your share of the remaining karma.",
            yes: () => true,
            no: () => false,
            defaultYes: false
        });
    
        if (confirmLeave) {
            await this.actor.leaveKarmaPool();
        }
    }

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
            
            render: (html) => {
                const dialog = this;
                
                // Add event listeners
                html.find('.karma-entries').on('click', '.edit-entry', async (ev) => {
                    ev.preventDefault();
                    const index = $(ev.currentTarget).closest('.karma-entry').data('entry-index');
                    const entry = dialog._filteredHistory[index];
                    await dialog._onEditKarmaEntry(ev, entry);
                });
    
                html.find('.karma-entries').on('click', '.delete-entry', async (ev) => {
                    ev.preventDefault();
                    const index = $(ev.currentTarget).closest('.karma-entry').data('entry-index');
                    await this._onDeleteKarmaEntry(ev, index);
                });
    
                // Add Entry
                html.find('.add-karma-entry').click(async (ev) => {
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
    
    async _onAddKarmaEntry(event) {
        event.preventDefault();
        
        // First close existing karma history dialog
        $('.karma-history').remove();
        
        const addEntryContent = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/add-karma-entry.html",
            { entry: { amount: '', description: '' } }
        );
        
        new Dialog({
            title: "Add Karma Entry",
            content: addEntryContent,
            buttons: {
                add: {
                    label: "Add Entry",
                    callback: async (html) => {
                        // Get form data
                        const form = html.find('form')[0];
                        const amount = Number(form.amount.value);
                        const description = form.description.value;
                        
                        if (isNaN(amount) || !description) {
                            ui.notifications.error("Please enter a valid amount and description");
                            return;
                        }
                        
                        // Create and save new entry
                        const newEntry = {
                            date: new Date().toLocaleString(),
                            amount: amount,
                            description: description
                        };
                        
                        const currentHistory = this.actor.system.karmaTracking.history || [];
                        await this.actor.update({
                            "system.karmaTracking.history": [...currentHistory, newEntry]
                        });
                        
                        // Reopen karma history with new data
                        this._onKarmaHistoryClick(new Event('click'));
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => this._onKarmaHistoryClick(new Event('click'))
                }
            },
            default: "add"
        }).render(true);
    }
    
    async _onDeleteKarmaEntry(event, index) {
        // Currently keeps karma history open during confirmation
        // Should:
        // 1. Close karma history
        // 2. Show confirmation
        // 3. After delete, reopen karma history
        
        // Suggested fix:
        $('.karma-history').remove();
        
        const confirmDelete = await Dialog.confirm({
            title: "Delete Karma Entry",
            content: "Are you sure you want to delete this karma entry?",
            yes: () => true,
            no: () => false,
            defaultYes: false
        });
    
        if (confirmDelete) {
            const history = duplicate(this.actor.system.karmaTracking.history);
            history.splice(index, 1);
            await this.actor.update({"system.karmaTracking.history": history});
        }
        
        // Always reopen karma history
        this._onKarmaHistoryClick(new Event('click'));
    }
    
    async _onEditKarmaEntry(event, entry) {
        // Currently keeps karma history open while editing
        // Should follow same pattern as add:
        // 1. Close karma history
        // 2. Show edit dialog
        // 3. After edit, reopen karma history
        
        // Suggested fix:
        event.preventDefault();
        $('.karma-history').remove();
        
        const editContent = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/add-karma-entry.html",
            { entry }
        );
    
        new Dialog({
            title: "Edit Karma Entry",
            content: editContent,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        // Update entry logic here
                        // ...
                        
                        // Reopen karma history
                        this._onKarmaHistoryClick(new Event('click'));
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => this._onKarmaHistoryClick(new Event('click'))
                }
            }
        }).render(true);
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

/* async _onRankChange(event) {
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
} */
    async _onRankChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const abilityPath = element.dataset.ability;
        const newRank = element.value;
        const cleanPath = abilityPath.replace('primaryAbilities.', '');
        
        console.log(`Updating rank for ${cleanPath} to ${newRank}`);
        
        if (element.classList.contains('initial-rank-input')) {
            await this.actor.update({
                [`system.primaryAbilities.${cleanPath}.initialRank`]: newRank
            });
        } else {
            const rankNumber = CONFIG.marvel.ranks[newRank]?.standard || 0;
            await this.actor.update({
                [`system.primaryAbilities.${cleanPath}.rank`]: newRank,
                [`system.primaryAbilities.${cleanPath}.number`]: rankNumber
            });
        }
    }

    async _onPopularityRoll(event) {
        event.preventDefault();
        const popularityType = event.currentTarget.dataset.popularityType;
        
        // Verify we have a valid popularity type
        if (!popularityType || !['hero', 'secret'].includes(popularityType)) {
            ui.notifications.error("Invalid popularity type");
            return;
        }
    
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
            popularity: this.actor.system.secondaryAbilities.popularity[popularityType],
            popularityType: popularityType
        };
    
        const html = await renderTemplate(
            "systems/marvel-faserip/templates/dialogs/popularity-roll.html",
            templateData
        );
    
        return new Promise(resolve => {
            new Dialog({
                title: `${popularityType === 'hero' ? 'Hero' : 'Secret ID'} Popularity FEAT Roll`,
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

// original version of onResourceRoll
/* async _onResourceRoll(event) {
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
            //warningMessage = Warning: Last Resource FEAT attempt was ${daysSinceAttempt} days ago. Must wait 7 days between attempts.;
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
} */

    // Modified _onResourceRoll for MarvelActorSheet.js
    async _onResourceRoll(event) {
        event.preventDefault();
        
        // Get resources and stored values
        const resourceRank = this.actor.system.secondaryAbilities.resources.rank || "Shift 0";
        const stored = await game.user.getFlag("world", "marvelResourceOptions") || {
            itemRank: "Typical",
            columnShift: 0,
            karmaPoints: 0,
            useBank: false
        };
        
        // Get last attempt data
        const lastAttempt = this.actor.getFlag("marvel-faserip", "lastResourceAttempt");
        const lastFailure = this.actor.getFlag("marvel-faserip", "lastResourceFailure");
        
        // Let actor method determine if warning is needed
        const warningMessage = await this.actor._getResourceWarningMessage(lastAttempt);
    
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
                lastFailure: lastFailure,
                isGM: game.user.isGM,
                useBank: stored.useBank
            }
        );
    
        return new Promise(resolve => {
            const buttons = {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml) => {
                        const form = dialogHtml[0].querySelector("form");
                        const options = {
                            itemRank: form.itemRank.value,
                            columnShift: parseInt(form.columnShift.value) || 0,
                            karmaPoints: parseInt(form.karmaPoints.value) || 0,
                            useBank: form.useBank?.checked || false
                        };
    
                        // Store options for future use
                        await game.user.setFlag("world", "marvelResourceOptions", options);
    
                        // Let actor handle all game logic
                        await this.actor.rollResourceFeat(options.itemRank, options);
                        resolve(true);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(false)
                }
            };
    
            // Add GM clear button
            if (game.user.isGM) {
                buttons.clearLockout = {
                    label: "Clear Lockout (GM)",
                    callback: async () => {
                        // Let actor handle flag clearing
                        await this.actor.clearResourceLockout();
                        resolve(false);
                        
                        // Show new dialog
                        setTimeout(() => {
                            this._onResourceRoll(new Event('click'));
                        }, 100);
                    }
                };
            }
    
            new Dialog({
                title: "Resource FEAT Roll",
                content: html,
                buttons: buttons,
                default: "roll"
            }).render(true);
        });
    }

async _onAbilityRoll(event) {
    try {
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
                            try {
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
                                
                                // Perform the roll with await
                                await this.actor.rollAbility(abilityId, options);
                                resolve(true);
                            } catch (err) {
                                console.error("Error in ability roll dialog:", err);
                                ui.notifications.error("Error processing ability roll");
                                resolve(false);
                            }
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
            });
            dialog.render(true);
        });
    } catch (err) {
        console.error("Error initiating ability roll:", err);
        ui.notifications.error("Error initiating ability roll");
    }
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

async _onEquipmentInfo(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".equipment-row").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    // Create chat message with equipment info
    const messageContent = `
        <div class="marvel-roll">
            <h3>${item.name} - Equipment Details</h3>
            <div class="roll-details">
                ${item.system.type ? `<div>Type: ${item.system.type}</div>` : ''}
                ${item.system.damage ? `<div>Damage: ${item.system.damage}</div>` : ''}
                ${item.system.range ? `<div>Range: ${item.system.range}</div>` : ''}
                ${item.system.rate ? `<div>Rate: ${item.system.rate}</div>` : ''}
                ${item.system.shots ? `<div>Shots: ${item.system.shots}</div>` : ''}
                ${item.system.material ? `<div>Material: ${item.system.material}</div>` : ''}
                ${item.system.price ? `<div>Price: ${item.system.price}</div>` : ''}
                ${item.system.special ? `<div>Special: ${item.system.special}</div>` : ''}
                ${item.system.description ? `<div class="description">${item.system.description}</div>` : ''}
            </div>
        </div>`;

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

// In MarvelActorSheet.js, around line 1055
async _onResistanceNumberChange(event) {
    console.log("Resistance number change triggered");
    event.preventDefault();
    const element = event.currentTarget;
    const newNumber = parseInt(element.value) || 0;
    const newRank = this.actor.getRankFromValue(newNumber);

    // Get the full path from the name attribute instead of dataset
    const fullPath = element.name;
    
    // Extract the index from the path
    const pathMatch = fullPath.match(/system\.resistances\.list\.(\d+)\.number/);
    if (!pathMatch) {
        console.error("Could not parse resistance path:", fullPath);
        return;
    }
    
    const idx = pathMatch[1];

    // Create update data with correct path
    const updateData = {
        [`system.resistances.list.${idx}.rank`]: newRank,
        [`system.resistances.list.${idx}.number`]: newNumber
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

/* async _onKarmaSheet(event) {
    event.preventDefault();
    
    // Prepare data for the sheet
    const data = {
        actor: this.actor,
        karmaHistory: this._prepareKarmaHistory(),
        advancementFunds: this._prepareAdvancementFunds(),
        teamPools: await this._prepareTeamPools()
    };

    // Render the sheet
    const content = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/karma-sheet.html",
        data
    );

    new Dialog({
        title: `${this.actor.name} - Karma Sheet`,
        content: content,
        buttons: {
            close: {
                label: "Close"
            }
        },
        render: (html) => {
            // Add listeners for the gain/spend buttons
            html.find('.gain-karma').click(this._onGainKarma.bind(this));
            html.find('.spend-karma').click(this._onSpendKarma.bind(this));
        },
        width: 800,
        height: 600
    }).render(true);
} */

/* _prepareKarmaHistory() {
    const history = this.actor.system.karmaTracking.history || [];
    let balance = 0;
    
    return history.map(entry => {
        balance += entry.amount;
        return {
            date: new Date(entry.date).toLocaleDateString(),
            description: entry.description,
            change: entry.amount,
            balance: balance
        };
    });
} */

/* _prepareAdvancementFunds() {
    const funds = [];
    const advancementFund = this.actor.system.karmaTracking.advancementFund || 0;
    
    // Calculate costs based on current abilities
    Object.entries(this.actor.system.primaryAbilities).forEach(([key, ability]) => {
        const currentValue = ability.number || 0;
        const cost = this._getAbilityAdvancementCost(currentValue);
        
        if (ability.advancementKarma) {
            funds.push({
                trait: key.charAt(0).toUpperCase() + key.slice(1),
                saved: ability.advancementKarma,
                needed: cost,
                progressPercent: (ability.advancementKarma / cost) * 100
            });
        }
    });

    // Add any power advancement funds
    Object.values(this.actor.items.filter(i => i.type === "power")).forEach(power => {
        if (power.system.advancementKarma) {
            const cost = this._getPowerAdvancementCost(power.system.rank);
            funds.push({
                trait: `Power: ${power.name}`,
                saved: power.system.advancementKarma,
                needed: cost,
                progressPercent: (power.system.advancementKarma / cost) * 100
            });
        }
    });

    return funds;
} */

/* async _prepareTeamPools() {
    const pools = [];
    const groupPool = this.actor.system.karmaTracking.groupPool;
    
    if (groupPool.active) {
        const pool = await game.settings.get("marvel-faserip", `karmaPools.${groupPool.poolId}`);
        if (pool) {
            pools.push({
                name: pool.name || "Team Pool",
                contribution: groupPool.contributed,
                total: pool.total,
                share: Math.floor(pool.total / pool.members.length)
            });
        }
    }
    
    return pools;
} */

/* async _onGainKarma(event) {
    event.preventDefault();
    
    const content = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/gain-karma.html",
        {
            reasons: CONFIG.marvel.karmaReasons
        }
    );

    new Dialog({
        title: "Gain Karma",
        content: content,
        buttons: {
            gain: {
                label: "Gain",
                callback: async (html) => {
                    const amount = parseInt(html.find('[name="amount"]').val()) || 0;
                    const reason = html.find('[name="reason"]').val();
                    
                    if (amount <= 0) {
                        ui.notifications.error("Amount must be positive");
                        return;
                    }

                    await this.actor.addKarma(amount, reason);
                    this._onKarmaSheet(event); // Refresh the sheet
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true);
} */

async _onSpendKarma(event) {
    event.preventDefault();
    
    const content = await renderTemplate(
        "systems/marvel-faserip/templates/dialogs/spend-karma.html",
        {
            reasons: CONFIG.marvel.karmaSpendTypes,
            maxKarma: this.actor.system.karmaTracking.karmaPool
        }
    );

    new Dialog({
        title: "Spend Karma",
        content: content,
        buttons: {
            spend: {
                label: "Spend",
                callback: async (html) => {
                    const amount = parseInt(html.find('[name="amount"]').val()) || 0;
                    const reason = html.find('[name="reason"]').val();
                    
                    if (amount <= 0) {
                        ui.notifications.error("Amount must be positive");
                        return;
                    }

                    if (amount > this.actor.system.karmaTracking.karmaPool) {
                        ui.notifications.error("Not enough karma");
                        return;
                    }

                    await this.actor.spendKarma(amount, reason);
                    this._onKarmaSheet(event); // Refresh the sheet
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true);
}

async _onDeleteEquipment(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.closest(".equipment-row").dataset.itemId;
    
    const confirmDelete = await Dialog.confirm({
        title: "Delete Equipment",
        content: "<p>Are you sure you want to delete this equipment?</p>",
        yes: () => true,
        no: () => false,
        defaultYes: false
    });

    if (confirmDelete) {
        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }
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

  