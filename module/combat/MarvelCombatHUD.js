// module/combat/MarvelCombatHUD.js
import { FaseripCombatEngine } from "./FaseripCombatEngine.js";

export class MarvelCombatHUD extends Application {
    constructor(options = {}) {
        super(options);
        this.engine = new FaseripCombatEngine();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'marvel-combat-hud',
            template: "systems/marvel-faserip/module/combat/templates/combat-hud.html",
            width: 300,
            height: 'auto',
            minimizable: true,
            title: 'Combat HUD'
        });
    }

    getData() {
        return {
            actionCategories: CONFIG.marvel.actionCategories,
            actionResults: CONFIG.marvel.actionResults,
            combatEffects: CONFIG.marvel.combatEffects,
            combatTypes: CONFIG.marvel.combatTypes
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        const hudElement = html.find('.marvel-combat-hud');
        if (hudElement.length) {
            this._makeDraggable(hudElement[0]);
        }
    
        html.find('.action-btn').click(this._onActionClick.bind(this));
        html.find('.table-toggle').click(this._onTableToggleClick.bind(this));
    }
    
    async _onTableToggleClick(event) {
        event.preventDefault();
        
        const imagePath = "systems/marvel-faserip/assets/universal table.webp";
        
        const content = `
            <style>
                .universal-table-container {
                    min-width: 1000px;
                    min-height: 600px;
                    width: 100%;
                    height: 100%;
                    padding: 0;
                    margin: 0;
                }
                .universal-table-container img {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .app.marvel-universal-table {
                    min-width: 1000px !important;
                    min-height: 600px !important;
                }
            </style>
            <div class="universal-table-container">
                <img src="${imagePath}">
            </div>
        `;
        
        new Dialog({
            title: "Universal Table",
            content: content,
            buttons: { close: { label: "Close" } },
            default: "close",
            width: 1000,
            height: 600,
            minimizable: true,
            resizable: true,
            position: { width: 1000, height: 600 }
        }, {
            classes: ["marvel-universal-table"]
        }).render(true);
    }

    _makeDraggable(element) {
        if (!element) return;

        let pos = { top: 100, left: 200 };
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        element.style.transition = 'transform 0.1s ease-out';

        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('action-btn') || 
                e.target.classList.contains('table-toggle')) return;
                
            isDragging = true;
            element.classList.add('dragging');
            dragOffset.x = e.clientX - pos.left;
            dragOffset.y = e.clientY - pos.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newLeft = e.clientX - dragOffset.x;
            const newTop = e.clientY - dragOffset.y;
            
            pos.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
            pos.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
            
            element.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('dragging');
            
            element.style.left = pos.left + 'px';
            element.style.top = pos.top + 'px';
            element.style.transform = '';
        });
    }

    _updateButtonStates() {
        const buttons = this.element.find('.action-btn');
        buttons.removeClass('active');
        
        const currentAction = this.getCurrentAction();
        if (currentAction) {
            buttons.filter(`[data-action="${currentAction}"]`).addClass('active');
        }
    }

    async _onActionClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const actionType = button.dataset.action;
    
        const token = canvas.tokens.controlled[0];
        if (!token) {
            ui.notifications.warn("Please select a token first");
            return;
        }
    
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn("Please target a token first");
            return;
        }
    
        try {
            const dialogOptions = await this._showActionDialog(actionType, token.actor);
            if (!dialogOptions) return;
    
            const result = await this.engine.resolveAction(
                token.actor,
                Array.from(targets)[0].actor,
                actionType,
                dialogOptions
            );
    
            if (result && !result.error) {
                await this._createChatMessage(result, token.actor, actionType);
            } else {
                ui.notifications.error(`Failed to resolve ${actionType} action`);
            }
        } catch (error) {
            console.error("Error in action resolution:", error);
            ui.notifications.error("Failed to resolve action");
        }
    }

    async _showActionDialog(actionType, actor) {
        const template = "systems/marvel-faserip/module/combat/templates/combat-action.html";
        const dialogData = {
            actor,
            actionType,
            config: CONFIG.marvel
        };

        const content = await renderTemplate(template, dialogData);

        return new Promise((resolve) => {
            new Dialog({
                title: `${actionType} Action`,
                content,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: (html) => {
                            const form = html.find("form")[0];
                            resolve({
                                columnShift: parseInt(form.columnShift?.value) || 0,
                                karmaPoints: parseInt(form.karmaPoints?.value) || 0,
                                weaponDamage: parseInt(form.weaponDamage?.value) || 0
                            });
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
    }

    async _createChatMessage(result, actor, actionType) {
        if (!result || result.error) {
            ui.notifications.error(`Failed to resolve ${actionType} action`);
            return;
        }
        
        try {
            // Use the combat-result template
            const templatePath = "systems/marvel-faserip/templates/chat/combat-result.html";
            
            const templateData = {
                actor: actor,
                actionType: actionType.toUpperCase(),
                result: result
            };
            
            const content = await renderTemplate(templatePath, templateData);
            
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor}),
                content: content,
                rolls: result.roll ? [result.roll] : []
            });
        } catch (error) {
            console.error("Error creating chat message:", error);
            ui.notifications.error("Failed to create result message");
            
            // Fallback to inline HTML if template fails
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor}),
                content: result.formattedText || "Attack resolved",
                rolls: result.roll ? [result.roll] : []
            });
        }
    }
}