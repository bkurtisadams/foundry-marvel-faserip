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
    
    /**
     * Show the universal table dialog
     */
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

    /**
     * Make HUD element draggable
     */
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

    /**
     * Handle action button click
     */
    async _onActionClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const actionType = button.dataset.action;
    
        console.log(`Action clicked: ${actionType}`);
        
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
            console.log(`Actor: ${token.actor.name}, Target: ${Array.from(targets)[0].actor.name}`);
            const dialogOptions = await this._showActionDialog(actionType, token.actor);
            if (!dialogOptions) return;
            
            console.log(`Dialog options:`, dialogOptions);
    
            // Delegate to combat engine for resolution
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

    /**
 * Show action dialog with weapon selection
 */
    async _showActionDialog(actionType, actor) {
        // Get available weapons for this action type from the combat engine
        const availableWeapons = this.engine.getAvailableWeapons(actor, actionType);
        
        const template = "systems/marvel-faserip/module/combat/templates/combat-action.html";
        const dialogData = {
            actor,
            actionType,
            config: CONFIG.marvel,
            weapons: availableWeapons // Pass weapons to the template
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
                            const selectedWeaponId = form.weaponSelect?.value;
                            
                            // Find the selected weapon data
                            let weaponData = {};
                            if (selectedWeaponId && selectedWeaponId !== "none") {
                                const selectedWeapon = availableWeapons.find(w => w.id === selectedWeaponId);
                                if (selectedWeapon) {
                                    weaponData = {
                                        id: selectedWeapon.id,
                                        name: selectedWeapon.name,
                                        weaponDamage: selectedWeapon.damage,
                                        range: selectedWeapon.range,
                                        special: selectedWeapon.special
                                    };
                                }
                            }
                            
                            // Get manual weapon damage if entered (overrides selected weapon)
                            const manualDamage = parseInt(form.weaponDamage?.value) || 0;
                            
                            resolve({
                                columnShift: parseInt(form.columnShift?.value) || 0,
                                karmaPoints: parseInt(form.karmaPoints?.value) || 0,
                                weaponDamage: manualDamage > 0 ? manualDamage : (weaponData.weaponDamage || 0),
                                range: weaponData.range || 0,
                                weaponName: weaponData.name || '',
                                weaponId: weaponData.id || '',
                                special: weaponData.special || ''
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

    /**
     * Create chat message for action result
     */
    async _createChatMessage(result, actor, actionType) {
        if (!result || result.error) {
            ui.notifications.error(`Failed to resolve ${actionType} action`);
            return;
        }
        
        try {
            // If result already has formatted text, use it
            if (result.formattedText) {
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor}),
                    content: result.formattedText,
                    rolls: result.roll ? [result.roll] : []
                });
                return;
            }
            
            // Otherwise, format the data for the template
            const templateData = {
                actor: actor,
                actionType: CONFIG.marvel.actionResults[actionType.toUpperCase()]?.name || actionType.toUpperCase(),
                result: {
                    ability: result.ability,
                    abilityScore: result.abilityScore,
                    roll: result.roll,
                    result: result.result,
                    damage: result.damage,
                    effect: result.effect,
                    columnShift: result.columnShift || 0,
                    karmaPoints: result.karmaPoints || 0
                }
            };
            
            const content = await renderTemplate("systems/marvel-faserip/templates/chat/combat-result.html", templateData);
            
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor}),
                content: content,
                rolls: result.roll ? [result.roll] : []
            });
        } catch (error) {
            console.error("Error creating chat message:", error);
            ui.notifications.error("Failed to create result message");
            
            // Fallback to simple text
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor}),
                content: `${actor.name} performs a ${actionType} action`,
                rolls: result.roll ? [result.roll] : []
            });
        }
    }
}