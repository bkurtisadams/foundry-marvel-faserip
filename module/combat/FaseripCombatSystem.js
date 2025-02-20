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

    async _processAttack(html, attacker, target, distance) {
        const form = html[0].querySelector('form');
        const formData = new FormData(form);
        
        // Get selected weapon/power if any
        let weaponDamage = 0;
        const itemId = formData.get('item');
        if (itemId) {
            const item = attacker.items.get(itemId);
            if (item) {
                weaponDamage = item.system.damage || 0;
            }
        }

        const options = {
            attackType: formData.get('attackType'),
            columnShift: parseInt(formData.get('columnShift')) || 0,
            karmaPoints: parseInt(formData.get('karmaPoints')) || 0,
            range: distance,
            weaponDamage
        };

        // Get ability for attack type
        const ability = CONFIG.marvel.actionResults[options.attackType]?.ability.toLowerCase();
        if (!ability) {
            ui.notifications.error("Invalid attack type");
            return;
        }

        try {
            // Perform the attack roll
            const result = await attacker.rollAttack(ability, options.attackType, options);
            
            // Process damage if attack hit
            if (result.color !== "white") {
                await this._processDamage(result, attacker, target, options);
            }

            // Update token effects based on result
            await this._applyEffects(result, target);

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
}