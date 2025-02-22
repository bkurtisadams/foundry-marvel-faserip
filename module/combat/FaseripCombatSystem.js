// File: module/combat/FaseripCombatSystem.js
import { MARVEL_RANKS } from "../config.js";

export class FaseripCombatSystem {
    constructor() {
        this.initializeListeners();
        this.initializeCombatHUD();
    }

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

    initializeCombatHUD() {
        // Create HUD container
        const hudContainer = $(`
            <div id="faserip-combat-hud" class="faserip-combat-hud">
                <div class="hud-header">
                    <h3>Combat Actions</h3>
                    <a class="collapse-button"><i class="fas fa-minus"></i></a>
                </div>
                <div class="hud-content">
                    <!-- Universal table content here -->
                </div>
            </div>
        `);
        
        // Add to UI
        $('body').append(hudContainer);
        
        // Toggle functionality
        hudContainer.find('.collapse-button').click(() => {
            hudContainer.find('.hud-content').toggle();
        });
        
        // Show only during combat
        Hooks.on('combatStart', () => {
            hudContainer.show();
        });
        
        Hooks.on('combatEnd', () => {
            hudContainer.hide();
        });
    }

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
    * Enhanced _processAttack method for FaseripCombatSystem.js
    */
    async _processAttack(html, attacker, target) {
        // Add thorough error checking early in the method
        if (!target || !target.system || !target.system.secondaryAbilities || !target.system.secondaryAbilities.health) {
            console.error("Invalid target structure:", target);
            ui.notifications.error("Target has invalid data structure");
            return;
        }
        
        const form = html.find('form')[0];
        const formData = new FormData(form);
        
        const options = {
            attackType: formData.get('attackType'),
            columnShift: parseInt(formData.get('columnShift')) || 0,
            karmaPoints: parseInt(formData.get('karmaPoints')) || 0,
            weaponDamage: parseInt(formData.get('weaponDamage')) || 0,
            range: parseInt(formData.get('range')) || 0
        };
        
        // Get ability for attack type
        const ability = CONFIG.marvel.actionResults[options.attackType]?.ability.toLowerCase();
        if (!ability) {
            ui.notifications.error("Invalid attack type");
            return;
        }
        
        try {
            // Calculate base damage
            let baseDamage;
            switch(options.attackType) {
                case "BA": // Blunt Attack
                case "TB": // Throwing Blunt
                    baseDamage = attacker.system.primaryAbilities.strength.number;
                    console.log("Base damage from strength:", baseDamage);
                    break;
                case "EA": // Edged Attack
                case "TE": // Throwing Edged
                    baseDamage = Math.max(
                        attacker.system.primaryAbilities.strength.number,
                        options.weaponDamage || 0
                    );
                    break;
                case "Sh": // Shooting
                case "En": // Energy
                case "Fo": // Force
                    baseDamage = options.weaponDamage || 10;
                    break;
                default:
                    baseDamage = 0;
            }
            
            // Perform attack roll
            const attackResult = await attacker.rollAttack(ability, options.attackType, options);
            if (!attackResult) return;
            
            console.log("Attack result:", attackResult);
            
            // Handle damage based on result
            if (attackResult.color !== "white") {
                // Get resistance
                const resistance = this._getApplicableResistance(target, options.attackType);
                console.log("Applied resistance:", resistance, "to base damage:", baseDamage);
                
                // Calculate final damage
                const finalDamage = Math.max(0, baseDamage - resistance);
                console.log("Final damage after resistance:", finalDamage);
                
                if (finalDamage > 0) {
                    // Get current health values for the chat card
                    const currentHealth = target.system.secondaryAbilities.health.value;
                    
                    // Create a comprehensive chat card for the attack
                    const attackTypeFullName = CONFIG.marvel.actionResults[options.attackType]?.name || options.attackType;
                    const attackerAbility = ability.charAt(0).toUpperCase() + ability.slice(1);
                    const abilityValue = attacker.system.primaryAbilities[ability]?.number || 0;
                    
                    // Update target's health
                    try {
                        // Use applyDamage instead of direct update
                        await target.applyDamage(finalDamage);
                        
                        // Apply special effects like Stun, Slam, Kill based on result
                        if (attackResult.color === "yellow" || attackResult.color === "red") {
                            const effectResult = this._getAttackEffect(options.attackType, attackResult.color);
                            if (effectResult) {
                                await this._applySpecialEffect(effectResult, target, attacker, finalDamage);
                            }
                        }
                        
                    } catch (error) {
                        console.error("Error applying damage:", error);
                        ui.notifications.error("Error applying damage to target");
                    }
                } else {
                    // Damage fully absorbed message
                    await ChatMessage.create({
                        content: `
                            <div class="marvel-damage">
                                <h3>${target.name}'s resistance absorbs the damage!</h3>
                                <div class="attack-details">
                                    <div class="detail-row"><span class="detail-label">Attack Type:</span> ${CONFIG.marvel.actionResults[options.attackType]?.name || options.attackType}</div>
                                    <div class="detail-row"><span class="detail-label">Using:</span> ${ability.charAt(0).toUpperCase() + ability.slice(1)} (${attacker.system.primaryAbilities[ability]?.number || 0})</div>
                                    <div class="detail-row"><span class="detail-label">Roll Result:</span> <span class="result-${attackResult.color}">${attackResult.color.toUpperCase()}</span></div>
                                </div>
                                <div class="damage-details">
                                    <div class="detail-row"><span class="detail-label">Base Damage:</span> ${baseDamage}</div>
                                    <div class="detail-row"><span class="detail-label">Target Resistance:</span> ${resistance} (${this._getAttackResistanceType(options.attackType)})</div>
                                    <div class="detail-row"><span class="detail-label">Final Damage:</span> 0 - No damage taken!</div>
                                </div>
                            </div>
                        `,
                        speaker: ChatMessage.getSpeaker({actor: attacker})
                    });
                }
            } else {
                // Miss message
                await ChatMessage.create({
                    content: `
                        <div class="marvel-damage">
                            <h3>${attacker.name} misses ${target.name}!</h3>
                            <div class="attack-details">
                                <div class="detail-row"><span class="detail-label">Attack Type:</span> ${CONFIG.marvel.actionResults[options.attackType]?.name || options.attackType}</div>
                                <div class="detail-row"><span class="detail-label">Using:</span> ${ability.charAt(0).toUpperCase() + ability.slice(1)} (${attacker.system.primaryAbilities[ability]?.number || 0})</div>
                                <div class="detail-row"><span class="detail-label">Roll Result:</span> <span class="result-white">WHITE (MISS)</span></div>
                            </div>
                        </div>
                    `,
                    speaker: ChatMessage.getSpeaker({actor: attacker})
                });
            }
        } catch (error) {
            console.error("Error in combat:", error);
            ui.notifications.error("Error processing combat");
        }
    }
    
    async _processDamage(result, attacker, target, options) {
        let damage = 0;
        
        // Calculate base damage based on attack type
        switch(options.attackType) {
            case "BA": // Blunt Attack
                damage = attacker.system.primaryAbilities.strength.number;
                break;
            case "EA": // Edged Attack
                damage = options.weaponDamage || attacker.system.primaryAbilities.strength.number;
                break;
            case "Sh": // Shooting
            case "En": // Energy
            case "Fo": // Force
                damage = options.weaponDamage || 0;
                break;
        }

        // Apply result modifiers
        if (result.color === "red") damage *= 2;
        if (result.color === "yellow") damage *= 1.5;

        // Apply damage to target
        await target.applyDamage(damage);
    }

    async _applyEffects(result, target) {
        // Handle stun, slam, and kill effects
        if (["stun", "slam", "kill"].includes(result.effect)) {
            await target.handleCombatEffect(result.effect);
        }
    }

    /**
    * Get attack effect based on attack type and color result
    * @param {string} attackType - Type of attack (BA, EA, etc)
    * @param {string} color - Color result (white, green, yellow, red)
    * @returns {string|null} Effect name or null if no special effect
    */
    _getAttackEffect(attackType, color) {
        if (color === "white") return null; // Misses have no effect
        
        // Map attack types to their effects based on color result
        const effectMap = {
            "BA": { // Blunt Attack
                green: null,
                yellow: "Slam",
                red: "Stun"
            },
            "EA": { // Edged Attack
                green: null,
                yellow: "Stun",
                red: "Kill"
            },
            "Sh": { // Shooting
                green: null,
                yellow: "Bullseye",
                red: "Kill"
            },
            "TE": { // Throwing Edged
                green: null,
                yellow: "Stun",
                red: "Kill"
            },
            "TB": { // Throwing Blunt
                green: null,
                yellow: null,
                red: "Stun"
            },
            "En": { // Energy
                green: null,
                yellow: "Bullseye",
                red: "Kill"
            },
            "Fo": { // Force
                green: null,
                yellow: "Bullseye",
                red: "Stun"
            }
        };
        
        return effectMap[attackType]?.[color] || null;
    }

    /**
     * Apply special effects (Stun, Slam, Kill) based on attack result
     * @param {string} effect - Type of effect (Stun, Slam, Kill)
     * @param {Actor} target - Target actor
     * @param {Actor} attacker - Attacker actor
     * @param {number} damage - Damage inflicted
     */

    async _applySpecialEffect(effect, target, attacker, damage) {
        // Special effects only apply if damage was dealt
        if (damage <= 0) return;
        
        // Create message about special effect
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: attacker}),
            content: `
                <div class="marvel-effect">
                    <h3>${attacker.name} scores a ${effect} on ${target.name}!</h3>
                    <div class="effect-details">
                        <div>${this._getEffectDescription(effect)}</div>
                        <div>${target.name} must make an Endurance FEAT to resist.</div>
                    </div>
                </div>`
        });
        
        // Have target roll to resist the effect
        await target.handleCombatEffect(effect);
    }

    /**
     * Get description of special effect
     * @param {string} effect - Type of effect
     * @returns {string} Description of the effect
     */
    _getEffectDescription(effect) {
        switch(effect) {
            case "Stun":
                return "Target may be stunned for 1-10 rounds.";
            case "Slam":
                return "Target may be knocked back.";
            case "Kill":
                return "Target may be mortally wounded.";
            case "Bullseye":
                return "A precise hit at a vulnerable spot.";
            default:
                return "";
        }
    }

    // Add this method to FaseripCombatSystem.js

    _getAttackResistanceType(attackType) {
        // Map attack types to resistance types
        const resistanceMap = {
            "BA": "physical",    // Blunt Attack
            "EA": "physical",    // Edged Attack
            "Sh": "physical",    // Shooting
            "TE": "physical",    // Throwing Edged
            "TB": "physical",    // Throwing Blunt
            "En": "energy",      // Energy Attack
            "Fo": "force",       // Force Attack
            "Gr": "physical",    // Grappling
            "Ch": "physical"     // Charging
        };
        return resistanceMap[attackType] || "physical";
    }

    _getApplicableResistance(target, attackType) {
        console.log("Checking resistance for:", target.name);
        console.log("Attack type:", attackType);

        // Safety check
        if (!target?.system?.resistances?.list) {
            console.log("No resistance list found");
            return 0;
        }

        // Get resistance type needed
        const resistanceType = this._getAttackResistanceType(attackType);
        console.log("Looking for resistance type:", resistanceType);

        // Convert object to array if needed
        let resistances = [];
        if (typeof target.system.resistances.list === 'object') {
            // Handle object with numeric keys
            resistances = Object.values(target.system.resistances.list);
        } else if (Array.isArray(target.system.resistances.list)) {
            resistances = target.system.resistances.list;
        }
        
        console.log("Processed resistances:", resistances);

        // Find matching resistance
        const resistance = resistances.find(r => 
            r && r.type && r.type.toLowerCase() === resistanceType.toLowerCase()
        );
        console.log("Found resistance:", resistance);

        // Return resistance number or 0 if none found
        const resistanceValue = resistance?.number || 0;
        console.log("Final resistance value:", resistanceValue);

        return resistanceValue;
    }

    async _handleCombatEffect(attackType, color, attacker, target, baseDamage) {
        // First calculate base damage before any special effects
        let damage = baseDamage;
        let effectResult = null;

        switch(attackType) {
            case "Gp": // Grappling
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage: 0, effect: "Miss" };
                    case "yellow": return { damage: 0, effect: "Partial" };
                    case "red": 
                        const holdOptions = await this._handleHoldOptions(attacker, target);
                        return { 
                            damage: holdOptions.holdDamage,
                            effect: "Hold",
                            holdAction: holdOptions.holdAction,
                            maintained: true
                        };
                }
                break;

        case "Gb": // Grabbing
            switch(color) {
                case "white": return { damage: 0, effect: "Miss" };
                case "green": return { damage: 0, effect: "Take" };
                case "yellow": return { damage: 0, effect: "Grab" };
                case "red": return { damage: 0, effect: "Break" };
            }
            break;

        case "Es": // Escaping
            switch(color) {
                case "white": return { damage: 0, effect: "Miss" };
                case "green": return { damage: 0, effect: "Miss" };
                case "yellow": return { damage: 0, effect: "Escape" };
                case "red": return { damage: 0, effect: "Reverse" };
            }
            break;

            case "BA": // Blunt Attack
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Slam" };
                    case "red": return { damage, effect: "Stun" };
                }
                break;

            case "EA": // Edged Attack
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Stun" };
                    case "red": return { damage, effect: "Kill" };
                }
                break;

            case "Sh": // Shooting
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Bullseye" };
                    case "red": return { damage, effect: "Kill" };
                }
                break;

            case "TE": // Throwing Edged
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Stun" };
                    case "red": return { damage, effect: "Kill" };
                }
                break;

            case "TB": // Throwing Blunt
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Hit" };
                    case "red": return { damage, effect: "Stun" };
                }
                break;

            case "En": // Energy
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Bullseye" };
                    case "red": return { damage, effect: "Kill" };
                }
                break;

            case "Fo": // Force
                switch(color) {
                    case "white": return { damage: 0, effect: "Miss" };
                    case "green": return { damage, effect: "Hit" };
                    case "yellow": return { damage, effect: "Bullseye" };
                    case "red": return { damage, effect: "Stun" };
                }
                break;
        }

        return { damage: 0, effect: "Miss" }; // Default fallback
    }

    async _handleSpecialEffect(effect, target, attacker, damage) {
        switch(effect) {
            case "Stun":
                await target.rollAbility("endurance", { featType: "endurance", actionType: "St" });
                break;
            case "Slam":
                await target.rollAbility("endurance", { featType: "endurance", actionType: "Sl" });
                break;
            case "Kill":
                if (damage > 0) {
                    await target.rollAbility("endurance", { featType: "endurance", actionType: "Ki" });
                }
                break;
            case "Bullseye":
                // Special handling for targeted shots
                ChatMessage.create({
                    content: `${attacker.name} scores a precise hit on ${target.name}!`,
                    speaker: ChatMessage.getSpeaker({actor: attacker})
                });
                break;
        }
    }

    // In FaseripCombatSystem.js
async _handleHoldOptions(attacker, target) {
    const maxDamage = attacker.system.primaryAbilities.strength.number;
    
    const content = `
        <form>
            <div class="form-group">
                <label>Hold Options:</label>
                <div class="form-fields">
                    <input type="number" name="holdDamage" min="0" max="${maxDamage}" value="0">
                    <p class="notes">Enter damage (0-${maxDamage})</p>
                </div>
            </div>
            <div class="form-group">
                <label>Additional Action:</label>
                <select name="holdAction">
                    <option value="none">None - Just maintain hold</option>
                    <option value="damage">Apply selected damage</option>
                    <option value="other">Perform another action at -2CS</option>
                </select>
            </div>
        </form>
    `;

    return new Promise((resolve) => {
        new Dialog({
            title: "Hold Actions",
            content: content,
            buttons: {
                apply: {
                    label: "Apply",
                    callback: (html) => {
                        const holdDamage = Number(html.find('[name="holdDamage"]').val());
                        const holdAction = html.find('[name="holdAction"]').val();
                        resolve({ holdDamage, holdAction });
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve({ holdDamage: 0, holdAction: "none" })
                }
            },
            default: "apply"
        }).render(true);
    });
}
async _handleWrestlingResult(attacker, target, attackType, color) {
    let result;
    switch(attackType) {
        case "Gp":
            result = await this._handleGrapplingResult(attacker, target, color);
            break;
        case "Gb":
            result = await this._handleGrabbingResult(attacker, target, color);
            break;
        case "Es":
            result = await this._handleEscapeResult(attacker, target, color);
            break;
    }

    // Create chat message
    await ChatMessage.create({
        content: `
            <div class="marvel-combat">
                <h3>${attacker.name}'s Wrestling Attack</h3>
                <div class="wrestling-details">
                    <div class="detail-row">
                        <span class="detail-label">Effect:</span> ${result.effect}
                    </div>
                    ${result.description ? `
                        <div class="detail-row">
                            <span class="detail-label">Result:</span> ${result.description}
                        </div>
                    ` : ''}
                    ${result.damage ? `
                        <div class="detail-row">
                            <span class="detail-label">Damage:</span> ${result.damage}
                        </div>
                    ` : ''}
                </div>
            </div>
        `,
        speaker: ChatMessage.getSpeaker({actor: attacker})
    });

    // Apply effects if needed
    if (result.effect === "Hold" || result.effect === "Partial") {
        await this._applyWrestlingEffect(target, result);
    }
}

async _handleGrapplingResult(attacker, target, color) {
    switch(color) {
        case "green":
            return {
                effect: "Miss",
                description: "The grappling attempt fails"
            };
        case "yellow":
            return {
                effect: "Partial",
                description: "Target is partially held and suffers -2CS to actions"
            };
        case "red":
            const holdOptions = await this._handleHoldOptions(attacker, target);
            return {
                effect: "Hold",
                damage: holdOptions.holdDamage,
                description: "Target is fully held",
                holdAction: holdOptions.holdAction
            };
    }
}

async _handleGrabbingResult(attacker, target, color) {
    switch(color) {
        case "green":
            return {
                effect: "Take",
                description: "Attempt to take item if Strength sufficient"
            };
        case "yellow":
            return {
                effect: "Grab",
                description: "Successfully grab item regardless of Strength"
            };
        case "red":
            return {
                effect: "Break",
                description: "Can break/activate item or move away"
            };
    }
}

async _handleEscapeResult(attacker, target, color) {
    switch(color) {
        case "green":
            return {
                effect: "Miss",
                description: "Failed to escape"
            };
        case "yellow":
            return {
                effect: "Escape",
                description: "Break free and can move half speed"
            };
        case "red":
            return {
                effect: "Reverse",
                description: "Break free and can counter-attack or move"
            };
    }
}

async _applyWrestlingEffect(target, result) {
    // Remove any existing wrestling effects
    await target.effects.forEach(e => {
        if (e.flags?.marvel?.wrestlingEffect) {
            e.delete();
        }
    });

    // Apply new effect
    const effectData = {
        label: result.effect === "Hold" ? "Held" : "Partially Held",
        icon: "icons/svg/net.svg",
        duration: { rounds: 1 },
        flags: { marvel: { wrestlingEffect: true }}
    };

    if (result.effect === "Partial") {
        effectData.changes = [{
            key: "system.columnShift",
            mode: 2,
            value: -2
        }];
    } else if (result.effect === "Hold") {
        effectData.changes = [{
            key: "system.held",
            mode: 5,
            value: true
        }];
    }

    await target.createEmbeddedDocuments("ActiveEffect", [effectData]);
}
}