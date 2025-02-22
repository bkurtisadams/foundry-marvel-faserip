// File: module/combat/FaseripCombatHUD.js
import { UNIVERSAL_TABLE_RANGES } from "../config.js";

/**
 * FaseripCombatHUD class
 * Implements a collapsible HUD for the FASERIP combat system
 * showing the universal table and defensive actions.
 */
export class FaseripCombatHUD {
    /**
     * Initialize the Combat HUD
     */
    constructor() {
        this.visible = false;
        this.collapsed = false;
        this.element = null;
        this.position = { 
            right: 310, 
            top: 80 
        };
        this.attackTypes = this._getAttackTypes();
    }

    /**
     * Initialize the HUD when the game is ready
     * @static
     */
    static init() {
        Hooks.once('ready', () => {
            game.marvel = game.marvel || {};
            game.marvel.combatHUD = new FaseripCombatHUD();
            
            // Create HUD when combat starts
            Hooks.on('combatStart', () => game.marvel.combatHUD.createHUD());
            Hooks.on('combatEnd', () => game.marvel.combatHUD.hideHUD());
            
            // Add toggle button to scene controls
            Hooks.on('getSceneControlButtons', (controls) => {
                const tokenControls = controls.find(c => c.name === "token");
                if (tokenControls) {
                    tokenControls.tools.push({
                        name: "toggleCombatHUD",
                        title: "Toggle Combat HUD",
                        icon: "fas fa-dice-d20",
                        visible: true,
                        onClick: () => game.marvel.combatHUD.toggleHUD(),
                        button: true
                    });
                }
            });
        });
    }

    /**
     * Get all attack types from config
     * @returns {Object} Attack types
     * @private
     */
    _getAttackTypes() {
        return CONFIG.marvel.actionResults || {};
    }

    /**
     * Create the HUD element
     */
    async createHUD() {
        if (this.element) return;
    
        // Get active character and all available characters
        const activeCharacter = this._getActiveCharacter();
        const characters = game.actors.filter(a => 
            a.isOwner && (a.type === "hero" || a.type === "villain")
        ).map(a => ({
            id: a.id,
            name: a.name,
            isActive: a.id === activeCharacter?.id
        }));
        
        // Prepare template data
        const templateData = {
            ranks: CONFIG.marvel.ranks,
            universalTable: UNIVERSAL_TABLE_RANGES,
            attackTypes: this.attackTypes,
            character: activeCharacter,
            characters: characters
        };
    
        // Render template
        const content = await renderTemplate(
            "systems/marvel-faserip/module/combat/templates/combat-hud.html" , 
            templateData
        );
        
        // Create and position HUD
        this.element = $(`<div id="faserip-combat-hud" class="faserip-combat-hud"></div>`);
        this.element.html(content);
        this.element.css({
            top: this.position.top + "px",
            right: this.position.right + "px"
        });
        
        // Add to UI
        $('#ui-top').append(this.element);
        
        // Setup dragging and events
        this._makeDraggable();
        this._addEventListeners();
        
        // Show HUD
        this.showHUD();
    }

    /**
     * Get the active character for the current user
     * @returns {Actor|null} The active character or null
     * @private
     */
    _getActiveCharacter() {
        // First check for selected token
        const controlled = canvas.tokens?.controlled;
        if (controlled && controlled.length === 1 && controlled[0].actor) {
            return controlled[0].actor;
        }
        
        // Next try the assigned character
        const assigned = game.user.character;
        if (assigned) return assigned;
        
        // Fallback to the first owned character
        const owned = game.actors.filter(a => a.isOwner && (a.type === "hero" || a.type === "villain"));
        return owned.length > 0 ? owned[0] : null;
    }

    /**
     * Make the HUD draggable
     * @private
     */
    _makeDraggable() {
        this.element.draggable({
            handle: ".hud-header",
            stop: (event, ui) => {
                // Save position for next time
                this.position = {
                    right: window.innerWidth - (ui.position.left + this.element.width()),
                    top: ui.position.top
                };
            }
        });
    }

    /**
     * Add event listeners to the HUD
     * @private
     */
    _addEventListeners() {
        // Toggle collapse on header click
        this.element.find('.collapse-button').click(() => this.toggleCollapse());
        
        // Close button
        this.element.find('.close-button').click(() => this.hideHUD());
        
        // Character selector
        this.element.find('.character-selector').change(this._onCharacterChange.bind(this));
        
        // Attack buttons
        this.element.find('.attack-button').click(this._onAttackButton.bind(this));
    }

    /**
     * Handle character selection change
     * @param {Event} event The change event
     * @private
     */
    _onCharacterChange(event) {
        const characterId = $(event.currentTarget).val();
        const character = game.actors.get(characterId);
        
        if (character) {
            // Update available weapons and powers
            this._updateCharacterActions(character);
        }
    }

    /**
     * Update the available actions for a character
     * @param {Actor} character The character actor
     * @private
     */
    async _updateCharacterActions(character) {
        // Get weapons and powers
        const weapons = character.items.filter(i => 
            i.type === "equipment" && 
            i.system.subtype === "weapon"
        );

        const powers = character.items.filter(i => 
            i.type === "power" && 
            ["damage", "attack"].includes(i.system.type)
        );
        
        // Update the weapons dropdown
        const weaponsDropdown = this.element.find('.weapons-dropdown');
        weaponsDropdown.empty();
        weaponsDropdown.append(`<option value="">-- Select Weapon --</option>`);
        
        weapons.forEach(weapon => {
            const attackType = weapon.system.attackType || "BA";
            weaponsDropdown.append(`
                <option value="${weapon.id}" data-type="${attackType}" data-damage="${weapon.system.damage || 0}">
                    ${weapon.name} (${attackType})
                </option>
            `);
        });
        
        // Update the powers dropdown
        const powersDropdown = this.element.find('.powers-dropdown');
        powersDropdown.empty();
        powersDropdown.append(`<option value="">-- Select Power --</option>`);
        
        powers.forEach(power => {
            const attackType = power.system.attackType || "En";
            powersDropdown.append(`
                <option value="${power.id}" data-type="${attackType}" data-damage="${power.system.damage || 0}">
                    ${power.name} (${attackType})
                </option>
            `);
        });
    }

    /**
     * Handle attack button clicks
     * @param {Event} event The click event
     * @private
     */
    _onAttackButton(event) {
        const attackType = $(event.currentTarget).data('type');
        this.performAttack(attackType);
    }

    /**
     * Perform an attack of the specified type
     * @param {string} attackType The attack type code
     */
    async performAttack(attackType) {
        const character = this._getActiveCharacter();
        if (!character) {
            ui.notifications.warn("No active character selected");
            return;
        }
        
        // Check for targets
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn("Please target a token first");
            return;
        }
        
        if (targets.size > 1) {
            ui.notifications.warn("Please target only one token");
            return;
        }
        
        const target = targets.first();
        if (!target.actor) {
            ui.notifications.warn("Invalid target");
            return;
        }
        
        // Don't allow targeting self
        if (target.actor.id === character.id) {
            ui.notifications.warn("Cannot target self");
            return;
        }
        
        // Get proper ability for attack type
        const attackConfig = CONFIG.marvel.actionResults[attackType];
        if (!attackConfig) {
            ui.notifications.error("Invalid attack type");
            return;
        }
        
        const ability = attackConfig.ability.toLowerCase();
        
        // Calculate range in grid squares
        const distance = Math.ceil(canvas.grid.measureDistance(
            character.getActiveTokens()[0], target
        ));
        
        // Get selected weapon/power
        let itemId = null;
        let weaponDamage = 0;
        
        const weaponSelect = this.element.find('.weapons-dropdown');
        const powerSelect = this.element.find('.powers-dropdown');
        
        if (weaponSelect.val()) {
            itemId = weaponSelect.val();
            const option = weaponSelect.find(`option[value="${itemId}"]`);
            weaponDamage = parseInt(option.data('damage')) || 0;
        } else if (powerSelect.val()) {
            itemId = powerSelect.val();
            const option = powerSelect.find(`option[value="${itemId}"]`);
            weaponDamage = parseInt(option.data('damage')) || 0;
        }
        
        // Get karma points if any
        const karmaPoints = parseInt(this.element.find('.karma-input').val()) || 0;
        
        // Get column shift if any
        const columnShift = parseInt(this.element.find('.column-shift').val()) || 0;
        
        // Prepare attack options
        const options = {
            attackType: attackType,
            columnShift: columnShift,
            karmaPoints: karmaPoints,
            weaponDamage: weaponDamage,
            range: distance,
            itemId: itemId
        };
        
        // Initiate the attack
        await character.rollAttack(ability, attackType, options);
    }

    /**
     * Toggle the HUD visibility
     */
    toggleHUD() {
        if (this.visible) {
            this.hideHUD();
        } else {
            this.createHUD();
        }
    }

    /**
     * Show the HUD
     */
    showHUD() {
        if (!this.element) {
            this.createHUD();
            return;
        }
        
        this.element.show();
        this.visible = true;
    }

    /**
     * Hide the HUD
     */
    hideHUD() {
        if (this.element) {
            this.element.hide();
        }
        this.visible = false;
    }

    /**
     * Toggle the collapsed state
     */
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        
        if (this.collapsed) {
            this.element.addClass('collapsed');
            this.element.find('.hud-content').hide();
            this.element.find('.collapse-button i').removeClass('fa-minus').addClass('fa-plus');
        } else {
            this.element.removeClass('collapsed');
            this.element.find('.hud-content').show();
            this.element.find('.collapse-button i').removeClass('fa-plus').addClass('fa-minus');
        }
    }
}