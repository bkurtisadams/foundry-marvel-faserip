// File: module/combat/FaseripCombatSystem.js
import { FaseripCombatEngine } from "./FaseripCombatEngine.js";

export class FaseripCombatSystem {
    constructor() {
        this.engine = new FaseripCombatEngine();
        this.initializeListeners();
    }

    /**
     * Initialize system listeners
     */
    initializeListeners() {
        // Add button to Token HUD
        Hooks.on('renderTokenHUD', (app, html, data) => {
            const button = $(`
                <div class="control-icon faserip-attack" title="FASERIP Attack">
                    <i class="fas fa-fist-raised"></i>
                </div>
            `);
            
            button.click(this._onAttackButton.bind(this, app.object));
            html.find('.col.left').append(button);
        });
    }

    /**
     * Handle attack button click on token HUD
     */
    async _onAttackButton(token) {
        // Check if any targets are selected
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn("Please target a token first (use targeting button or hold T)");
            return;
        }

        if (targets.size > 1) {
            ui.notifications.warn("Please target only one token");
            return;
        }

        const target = targets.first();
        
        // Don't allow targeting self
        if (target.id === token.id) {
            ui.notifications.warn("Cannot target self!");
            return;
        }

        await this.initiateAttack(token, target);
    }

    /**
     * Initiate attack between two tokens
     */
    async initiateAttack(attackerToken, targetToken) {
        const attacker = attackerToken.actor;
        const target = targetToken.actor;

        if (!attacker || !target) {
            ui.notifications.error("Invalid attacker or target");
            return;
        }

        // Calculate range in grid squares
        const distance = Math.ceil(canvas.grid.measureDistance(attackerToken, targetToken));

        // Create dialog for attack options
        const dialogContent = await this._createAttackDialog(attacker, distance);
        
        new Dialog({
            title: `${attacker.name} attacks ${target.name}`,
            content: dialogContent,
            buttons: {
                attack: {
                    label: "Attack",
                    callback: (html) => this._processAttack(html, attacker, target, distance)
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "attack",
            width: 400
        }).render(true);
    }

    /**
     * Create attack dialog content
     */
    async _createAttackDialog(attacker, distance) {
        // Get abilities for selects
        const attackTypes = {};
        Object.entries(CONFIG.marvel.actionResults).forEach(([code, action]) => {
            attackTypes[code] = action;
        });

        // Get available weapons/powers
        const weapons = attacker.items.filter(i => 
            i.type === "equipment" && 
            i.system.subtype === "weapon"
        );

        const powers = attacker.items.filter(i => 
            i.type === "power" && 
            ["damage", "attack"].includes(i.system.type)
        );

        // Render the template
        const templateData = {
            attackTypes,
            weapons,
            powers,
            maxKarma: attacker.system.secondaryAbilities.karma.value,
            distance
        };

        return await renderTemplate(
            "systems/marvel-faserip/module/combat/templates/combat-attack.html", 
            templateData
        );
    }

    /**
     * Process attack from dialog
     */
    async _processAttack(html, attacker, target, distance) {
        try {
            const form = html.find('form')[0];
            const formData = new FormData(form);
            
            const options = {
                attackType: formData.get('attackType'),
                columnShift: parseInt(formData.get('columnShift')) || 0,
                karmaPoints: parseInt(formData.get('karmaPoints')) || 0,
                weaponDamage: parseInt(formData.get('weaponDamage')) || 0,
                range: parseInt(formData.get('range')) || distance || 0
            };
            
            // Get ability for attack type
            const ability = CONFIG.marvel.actionResults[options.attackType]?.ability.toLowerCase();
            if (!ability) {
                ui.notifications.error("Invalid attack type");
                return;
            }
            
            // Delegate to combat engine for resolution
            const result = await this.engine.resolveAction(attacker, target, options.attackType, options);
            
            // If result does not have formattedText, create chat message
            if (result && !result.formattedText) {
                await this._createChatMessage(result, attacker, target, options);
            }
            
        } catch (error) {
            console.error("Error in combat:", error);
            ui.notifications.error("Error processing combat");
        }
    }
    
    /**
     * Create chat message for combat result
     */
    async _createChatMessage(result, attacker, target, options) {
        if (!result) return;
        
        try {
            const attackTypeFullName = CONFIG.marvel.actionResults[options.attackType]?.name || options.attackType;
            
            let content = '';
            if (result.result === "white") {
                content = `
                    <div class="marvel-damage">
                        <h3>${attacker.name} misses ${target.name}!</h3>
                        <div class="attack-details">
                            <div class="detail-row"><span class="detail-label">Attack Type:</span> ${attackTypeFullName}</div>
                            <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-white">MISS</span></div>
                        </div>
                    </div>
                `;
            } else {
                content = `
                    <div class="marvel-damage">
                        <h3>${attacker.name} attacks ${target.name}</h3>
                        <div class="attack-details">
                            <div class="detail-row"><span class="detail-label">Attack Type:</span> ${attackTypeFullName}</div>
                            <div class="detail-row"><span class="detail-label">Result:</span> <span class="result-${result.result}">${result.result.toUpperCase()}</span></div>
                            ${result.effect ? `<div class="detail-row"><span class="detail-label">Effect:</span> ${result.effect.type || 'None'}</div>` : ''}
                        </div>
                        <div class="damage-details">
                            <div class="detail-row"><span class="detail-label">Base Damage:</span> ${result.damage?.base || 0}</div>
                            <div class="detail-row"><span class="detail-label">Resistance:</span> ${result.damage?.resistance || 0} (${result.damage?.resistanceType || 'None'})</div>
                            <div class="detail-row"><span class="detail-label">Final Damage:</span> ${result.damage?.final || 0}</div>
                        </div>
                    </div>
                `;
            }
            
            await ChatMessage.create({
                content,
                speaker: ChatMessage.getSpeaker({actor: attacker}),
                rolls: result.roll ? [result.roll] : []
            });
            
        } catch (error) {
            console.error("Error creating chat message:", error);
            ui.notifications.error("Failed to create result message");
        }
    }
}