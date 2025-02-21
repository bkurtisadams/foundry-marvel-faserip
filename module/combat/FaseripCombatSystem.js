// File: module/combat/FaseripCombatSystem.js
import { MARVEL_RANKS } from "../config.js";

export class FaseripCombatSystem {
    constructor() {
        this.initializeListeners();
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
                case "BA":
                case "TB":
                    baseDamage = attacker.system.primaryAbilities.strength.number;
                    console.log("Base damage from strength:", baseDamage);
                    break;
                case "EA":
                case "TE":
                    baseDamage = Math.max(
                        attacker.system.primaryAbilities.strength.number,
                        options.weaponDamage || 0
                    );
                    break;
                case "Sh":
                case "En":
                case "Fo":
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
                    const newHealth = Math.max(0, currentHealth - finalDamage);
                    
                    // Create a comprehensive chat card with all relevant attack data
                    const attackTypeFullName = CONFIG.marvel.actionResults[options.attackType]?.name || options.attackType;
                    const attackerAbility = ability.charAt(0).toUpperCase() + ability.slice(1);
                    const abilityValue = attacker.system.primaryAbilities[ability]?.number || 0;
                    
                    // Update target's health
                    try {
                        await target.update({
                            "system.secondaryAbilities.health.value": newHealth
                        });
                        
                        // Create comprehensive damage message
                        await ChatMessage.create({
                            content: `
                                <div class="marvel-damage">
                                    <h3>${attacker.name} hits ${target.name}!</h3>
                                    <div class="attack-details">
                                        <div class="detail-row"><span class="detail-label">Attack Type:</span> ${attackTypeFullName}</div>
                                        <div class="detail-row"><span class="detail-label">Using:</span> ${attackerAbility} (${abilityValue})</div>
                                        ${options.columnShift ? `<div class="detail-row"><span class="detail-label">Column Shift:</span> ${options.columnShift}</div>` : ''}
                                        ${options.karmaPoints ? `<div class="detail-row"><span class="detail-label">Karma Spent:</span> ${options.karmaPoints}</div>` : ''}
                                        ${options.weaponDamage ? `<div class="detail-row"><span class="detail-label">Weapon Damage:</span> ${options.weaponDamage}</div>` : ''}
                                        ${options.range ? `<div class="detail-row"><span class="detail-label">Range:</span> ${options.range}</div>` : ''}
                                        <div class="detail-row"><span class="detail-label">Roll Result:</span> <span class="result-${attackResult.color}">${attackResult.color.toUpperCase()}</span></div>
                                    </div>
                                    <div class="damage-details">
                                        <div class="detail-row"><span class="detail-label">Base Damage:</span> ${baseDamage}</div>
                                        ${resistance ? `<div class="detail-row"><span class="detail-label">Target Resistance:</span> ${resistance} (${this._getAttackResistanceType(options.attackType)})</div>` : ''}
                                        <div class="detail-row"><span class="detail-label">Final Damage:</span> ${finalDamage}</div>
                                        <div class="detail-row"><span class="detail-label">Target Health:</span> ${currentHealth} → ${newHealth}</div>
                                    </div>
                                    ${newHealth <= 0 ? `<div class="unconscious-warning">⚠️ ${target.name} has been reduced to 0 Health and must make an Endurance FEAT!</div>` : ''}
                                </div>
                            `,
                            speaker: ChatMessage.getSpeaker({actor: attacker})
                        });
                        
                        // Check for unconsciousness
                        if (newHealth <= 0) {
                            await target.rollAbility("endurance", { 
                                featType: "endurance", 
                                actionType: "death" 
                            });
                        }
                    } catch (error) {
                        console.error("Error updating health:", error);
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
}