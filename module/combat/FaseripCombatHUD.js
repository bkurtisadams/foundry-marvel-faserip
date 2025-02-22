import { UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripCombatHUD extends Application {
    constructor(token, options = {}) {
        super(options);
        this.token = token;
        this.actor = token.actor;
        
        this.options.id = `faserip-combat-hud-${this.token.id}`;
        
        if (token.combatHud) {
            token.combatHud.close();
        }
        token.combatHud = this;
        
        if (!game.user.combatHuds) game.user.combatHuds = [];
        game.user.combatHuds.push(this);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['faserip', 'faserip-combat-hud'],
            template: 'systems/marvel-faserip/module/combat/templates/combat-hud.html',
            width: 300,
            height: 'auto',
            minimizable: true,
            resizable: true,
            popOut: true,
            id: 'faserip-combat-hud',
            // Update drag handle to match your template
            draggable: true,
            dragHandle: '.hud-header',
            // Add these for better window management
            tabs: [],
            dragDrop: []
        });
    }

    // Add position methods
    setPosition(options={}) {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Set default position if none exists
        if (!this.position) {
            const tokenPos = this.token.worldTransform;
            const scale = canvas.stage.scale.x;
            
            this.position = {
                left: Math.round(tokenPos.tx),
                top: Math.round(tokenPos.ty + (this.token.h * scale) + 35),
                width: this.options.width
            };
            
            // Constrain to viewport
            if (this.position.left + this.position.width > viewportWidth) {
                this.position.left = viewportWidth - this.position.width - 20;
            }
            if (this.position.top + 100 > viewportHeight) {
                this.position.top = Math.max(0, viewportHeight - 400);
            }
        }
        
        return super.setPosition(options);
    }

    async close(options={}) {
        // Remove from game.user.combatHuds
        const index = game.user.combatHuds.indexOf(this);
        if (index !== -1) {
            game.user.combatHuds.splice(index, 1);
        }

        // Clean up token references
        if (this.token) {
            delete this.token.combatHud;
        }

        return super.close(options);
    }

    static async activateCombatHud(token, selected) {
        if (!token?.actor || (!token.actor.isOwner && !game.user.isGM)) return;

        if (selected) {
            if (!token.combatHud) {
                const cHud = new FaseripCombatHUD(token);
                await cHud.render(true);
            } else {
                await token.combatHud.render(true);
            }
        } else if (token.combatHud) {
            await token.combatHud.close();
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.collapse-button').click(this._onToggleCollapse.bind(this));
        html.find('.character-selector').change(this._onCharacterChange.bind(this));
        html.find('.attack-button').click(this._onAttackButton.bind(this));
        html.find('.defensive-action').click(this._onDefensiveAction.bind(this));
        html.find('.combat-action').click(this._onActionClick.bind(this));
        html.find('.close-button').click(this._onClose.bind(this));
    }

    getData() {
        const activeCharacter = this._getActiveCharacter();
        const characters = game.actors.filter(a => 
            a.isOwner && (a.type === "hero" || a.type === "villain")
        ).map(a => ({
            id: a.id,
            name: a.name,
            isActive: a.id === activeCharacter?.id
        }));

        return {
            ranks: CONFIG.marvel.ranks,
            universalTable: UNIVERSAL_TABLE_RANGES,
            attackTypes: CONFIG.marvel.actionResults,
            character: activeCharacter,
            characters: characters,
            actions: this._getAvailableActions()
        };
    }

    _onClose(event) {
        event.preventDefault();
        this.close();
    }

    _onToggleCollapse(event) {
        event.preventDefault();
        const content = this.element.find('.hud-content');
        const icon = this.element.find('.collapse-button i');
        
        if (content.is(':visible')) {
            content.hide();
            icon.removeClass('fa-minus').addClass('fa-plus');
            this.element.addClass('collapsed');
        } else {
            content.show();
            icon.removeClass('fa-plus').addClass('fa-minus');
            this.element.removeClass('collapsed');
        }
    }

    _getAvailableActions() {
        return [
            { name: 'Fighting', type: 'combat' },
            { name: 'Agility', type: 'combat' },
            { name: 'Strength', type: 'combat' },
            { name: 'Endurance', type: 'combat' }
        ];
    }

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

    _onCharacterChange(event) {
        const characterId = $(event.currentTarget).val();
        const character = game.actors.get(characterId);
        
        if (character) {
            this.render();
        }
    }

    _onAttackButton(event) {
        const attackType = $(event.currentTarget).data('type');
        const character = this._getActiveCharacter();
        if (!character) {
            ui.notifications.warn("No active character selected");
            return;
        }

        // Call the attack method from your combat system
        if (game.marvel.combatSystem) {
            game.marvel.combatSystem.initiateAttack(character, attackType);
        }
    }

    _onDefensiveAction(event) {
        const actionType = $(event.currentTarget).data('action');
        const character = this._getActiveCharacter();
        if (!character) {
            ui.notifications.warn("No active character selected");
            return;
        }

        // Call defensive action method
        if (game.marvel.defensiveActions) {
            game.marvel.defensiveActions.perform(actionType);
        }
    }

    _onActionClick(event) {
        event.preventDefault();
        const actionElement = event.currentTarget;
        const actionType = actionElement.dataset.actionType;
        
        // Handle the action click
        this._handleAction(actionType);
    }

    _handleAction(actionType) {
        // Implement your action handling logic
        console.log(`Handling action: ${actionType}`);
    }
}

