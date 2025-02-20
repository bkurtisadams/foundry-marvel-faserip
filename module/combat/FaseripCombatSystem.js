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

    _processAttack(html, attacker, target) {
        const form = html.find('form')[0];
        const formData = new FormData(form);
        
        const options = {
            attackType: formData.get('attackType'),
            columnShift: parseInt(formData.get('columnShift')) || 0,
            karmaPoints: parseInt(formData.get('karmaPoints')) || 0
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
            attacker.rollAttack(ability, options.attackType, options).then(attackResult => {
                if (!attackResult) return;

                console.log("Attack result:", attackResult);

                // Handle damage based on result
                if (attackResult.color !== "white") {
                    // Get resistance
                    const resistance = this._getApplicableResistance(target, options.attackType);
                    
                    // Calculate final damage
                    const finalDamage = Math.max(0, baseDamage - resistance);

                    if (finalDamage > 0) {
                        // Get current health
                        const currentHealth = target.system.secondaryAbilities.health.value;
                        const newHealth = Math.max(0, currentHealth - finalDamage);
                        
                        // Update target's health
                        target.update({
                            "system.secondaryAbilities.health.value": newHealth
                        }).then(() => {
                            // Create damage message
                            ChatMessage.create({
                                content: `
                                    <div class="marvel-damage">
                                        <h3>${target.name} takes damage!</h3>
                                        <div class="damage-details">
                                            <div>Attack Type: ${options.attackType}</div>
                                            <div>Base Damage: ${baseDamage}</div>
                                            ${resistance ? `<div>Resistance: ${resistance}</div>` : ''}
                                            <div>Final Damage: ${finalDamage}</div>
                                            <div>Health: ${currentHealth} → ${newHealth}</div>
                                            <div>Result: ${attackResult.color.toUpperCase()}</div>
                                        </div>
                                    </div>`,
                                speaker: ChatMessage.getSpeaker({actor: attacker})
                            });
                        });
                    } else {
                        // Damage fully absorbed message
                        ChatMessage.create({
                            content: `
                                <div class="marvel-damage">
                                    <h3>${target.name}'s resistance absorbs the damage!</h3>
                                    <div class="damage-details">
                                        <div>Attack Damage: ${baseDamage}</div>
                                        <div>Resistance: ${resistance}</div>
                                        <div>No damage taken!</div>
                                    </div>
                                </div>`,
                            speaker: ChatMessage.getSpeaker({actor: attacker})
                        });
                    }
                }
            });

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

    async _resolveAttack(html, attacker, target) {
        const form = html.find('form')[0];
        const formData = new FormData(form);
        
        const options = {
            attackType: formData.get('attackType'),
            columnShift: parseInt(formData.get('columnShift')) || 0,
            karmaPoints: parseInt(formData.get('karmaPoints')) || 0
        };

        // Get ability for attack type
        let ability;
        switch(options.attackType) {
            case "BA":
            case "EA":
                ability = "fighting";
                break;
            case "Sh":
            case "TE":
            case "TB":
                ability = "agility";
                break;
            case "En":
            case "Fo":
                ability = "reason";
                break;
            default:
                ability = "fighting";
        }

        // Calculate base damage
        let baseDamage;
        switch(options.attackType) {
            case "BA":
            case "TB":
                baseDamage = attacker.system.primaryAbilities.strength.number;
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
                baseDamage = options.weaponDamage || 10; // Default or weapon damage
                break;
            default:
                baseDamage = 0;
        }

        // Perform attack roll
        const attackResult = await attacker.rollAttack(ability, options.attackType, options);

        // If hit, apply damage
        if (attackResult.color !== "white") {
            let damage = baseDamage;
            
            // Modify damage based on color
            if (attackResult.color === "red") damage *= 2;
            if (attackResult.color === "yellow") damage *= 1.5;

            // Get target's applicable resistance
            const resistance = this._getApplicableResistance(target, options.attackType);
            
            // Calculate final damage after resistance
            const finalDamage = Math.max(0, Math.floor(damage - resistance));

            // Update target's health only if damage gets through
            if (finalDamage > 0) {
                const currentHealth = target.system.secondaryAbilities.health.value;
                const newHealth = Math.max(0, currentHealth - finalDamage);
                
                await target.update({
                    "system.secondaryAbilities.health.value": newHealth
                });

                // Show detailed damage message
                ChatMessage.create({
                    content: `
                        <div class="marvel-damage">
                            <h3>${target.name} takes damage!</h3>
                            <div class="damage-details">
                                <div>Base Damage: ${damage}</div>
                                ${resistance ? `<div>Resistance (${this._getAttackResistanceType(options.attackType)}): ${resistance}</div>` : ''}
                                <div>Final Damage: ${finalDamage}</div>
                                <div>Health: ${currentHealth} → ${newHealth}</div>
                            </div>
                        </div>`,
                    speaker: ChatMessage.getSpeaker({actor: attacker})
                });

                // Check for unconsciousness
                if (newHealth <= 0) {
                    ChatMessage.create({
                        content: `${target.name} has been reduced to 0 Health and must make an Endurance FEAT!`,
                        speaker: ChatMessage.getSpeaker({actor: target})
                    });
                }
            } else {
                // Damage fully absorbed message
                ChatMessage.create({
                    content: `
                        <div class="marvel-damage">
                            <h3>${target.name}'s resistance absorbs the damage!</h3>
                            <div class="damage-details">
                                <div>Attack Damage: ${damage}</div>
                                <div>Resistance (${this._getAttackResistanceType(options.attackType)}): ${resistance}</div>
                                <div>No damage taken!</div>
                            </div>
                        </div>`,
                    speaker: ChatMessage.getSpeaker({actor: attacker})
                });
            }
        }
    }
    // Add to FaseripCombatSystem.js

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

    _processAttack(html, attacker, target) {
        const form = html.find('form')[0];
        const formData = new FormData(form);
        
        const options = {
            attackType: formData.get('attackType'),
            columnShift: parseInt(formData.get('columnShift')) || 0,
            karmaPoints: parseInt(formData.get('karmaPoints')) || 0
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
            attacker.rollAttack(ability, options.attackType, options).then(attackResult => {
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
                        // Get current health
                        const currentHealth = target.system.secondaryAbilities.health.value;
                        const newHealth = Math.max(0, currentHealth - finalDamage);
                        
                        // Update target's health
                        target.update({
                            "system.secondaryAbilities.health.value": newHealth
                        }).then(() => {
                            // Create damage message
                            ChatMessage.create({
                                content: `
                                    <div class="marvel-damage">
                                        <h3>${target.name} takes damage!</h3>
                                        <div class="damage-details">
                                            <div>Attack Type: ${options.attackType}</div>
                                            <div>Base Damage: ${baseDamage}</div>
                                            ${resistance ? `<div>Physical Resistance: ${resistance}</div>` : ''}
                                            <div>Final Damage: ${finalDamage}</div>
                                            <div>Health: ${currentHealth} → ${newHealth}</div>
                                            <div>Result: ${attackResult.color.toUpperCase()}</div>
                                        </div>
                                    </div>`,
                                speaker: ChatMessage.getSpeaker({actor: attacker})
                            });
                        });
                    } else {
                        // Damage fully absorbed message
                        ChatMessage.create({
                            content: `
                                <div class="marvel-damage">
                                    <h3>${target.name}'s resistance absorbs the damage!</h3>
                                    <div class="damage-details">
                                        <div>Attack Damage: ${baseDamage}</div>
                                        <div>Physical Resistance: ${resistance}</div>
                                        <div>No damage taken!</div>
                                    </div>
                                </div>`,
                            speaker: ChatMessage.getSpeaker({actor: attacker})
                        });
                    }
                }
            });

        } catch (error) {
            console.error("Error in combat:", error);
            ui.notifications.error("Error processing combat");
        }
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