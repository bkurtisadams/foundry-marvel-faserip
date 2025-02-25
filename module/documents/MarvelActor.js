export class MarvelActor extends Actor {
    /** @override */
    prepareData() {
        // Always call super first to ensure core data is initialized
        super.prepareData();
    
        console.log("Preparing actor data:", this.system.primaryAbilities);
    
        // Initialize base template data structure if needed
        this._initializeBaseTemplate();
        
        // Initialize type-specific templates
        switch(this.type) {
            case "hero":
                this._initializeHeroTemplate();
                break;
            case "villain":
                this._initializeVillainTemplate();
                break;
            case "npc":
                this._initializeNPCTemplate();
                break;
        }
    
        // Store current health value
        const currentHealth = this.system.secondaryAbilities?.health?.value || 0;
        
        // Calculate max health
        this._calculateMaxHealth();
        
        // Preserve current health value (don't reset to max)
        if (currentHealth > 0) {
            // Make sure health doesn't exceed max 
            const maxHealth = this.system.secondaryAbilities.health.max;
            this.system.secondaryAbilities.health.value = Math.min(currentHealth, maxHealth);
        }
        
        // Calculate other derived values
        this._calculateKarma();
        this._updateResourceRank();
    }

    /** Initialize the base template structure */
    _initializeBaseTemplate() {
        if (!this.system.biography) {
            this.system.biography = {
                playerName: "",
                heroName: "",
                realName: "",
                identity: "secret",
                groupAffiliation: "",
                baseOfOperations: "",
                age: "",
                origin: ""
            };
        }

        if (!this.system.primaryAbilities) {
            this.system.primaryAbilities = {
                fighting: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                agility: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                strength: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                endurance: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                reason: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                intuition: { initialRoll: "", initialRank: "", rank: "", number: 0 },
                psyche: { initialRoll: "", initialRank: "", rank: "", number: 0 }
            };
        }

        if (!this.system.secondaryAbilities) {
            this.system.secondaryAbilities = {
                health: { value: 0, max: 0 },
                karma: { value: 0, max: 0 },
                resources: { rank: "", number: 0 },
                popularity: { hero: 0, secret: 0 }
            };
        }
        // Calculate derived values
        this._calculateMaxHealth();
        this._calculateKarma();
        this._updateResourceRank();

        if (!this.system.resistances) {
            this.system.resistances = {
                list: []
            };
        }

        /* if (!this.system.karmaTracking) {
            this.system.karmaTracking = {
                karmaPool: 0,
                advancementFund: 0,
                history: [],
                lifetimeTotal: 0,
                groupPool: {  // Changed to groupPool to match usage
                    active: false,
                    contributed: 0,
                    poolId: null
                }
            };
        } */
            if (!this.system.karmaTracking) {
                this.system.karmaTracking = {
                    advancementFund: 0,
                    karmaPool: 0,
                    lifetimeTotal: 0
                };
            } else {
                // Ensure values are numbers
                this.system.karmaTracking.advancementFund = parseInt(this.system.karmaTracking.advancementFund) || 0;
                this.system.karmaTracking.karmaPool = parseInt(this.system.karmaTracking.karmaPool) || 0;
                this.system.karmaTracking.lifetimeTotal = this.system.karmaTracking.advancementFund + this.system.karmaTracking.karmaPool;
            }    }

    /** Initialize hero-specific template data */
    _initializeHeroTemplate() {
        // Initialize powers
        if (!this.system.powers) {
            this.system.powers = { 
                list: [],
                templates: ["base"]
            };
        }
        
        // Ensure each power has the correct schema
        if (Array.isArray(this.system.powers.list)) {
            this.system.powers.list = this.system.powers.list.map(power => {
                return {
                    name: power.name || "",
                    rank: power.rank || "",
                    rankNumber: power.rankNumber || 0,
                    damage: power.damage || 0,
                    range: power.range || 0,
                    description: power.description || "",
                    limitations: power.limitations || "",
                    type: power.type || ""
                };
            });
        }

        // Initialize stunts
        if (!this.system.stunts) {
            this.system.stunts = {
                list: [],
                templates: ["base"],
                description: ""
            };
        }

        // Initialize contacts
        if (!this.system.contacts) {
            this.system.contacts = {
                list: []
            };
        }

        // Initialize talents
        if (!this.system.talents) {
            this.system.talents = {
                list: []
            };
        }
    }

    /** Initialize villain-specific template data */
    _initializeVillainTemplate() {
        // Villains share powers and stunts with heroes but not contacts/talents
        this._initializePowersAndStunts();
    }

    /** Initialize NPC template data */
    _initializeNPCTemplate() {
        // NPCs only use the base template, no additional initialization needed
    }

    /** Helper method to initialize powers and stunts for both heroes and villains */
    _initializePowersAndStunts() {
        if (!this.system.powers) {
            this.system.powers = { 
                list: [],
                templates: ["base"]
            };
        }

        if (!this.system.stunts) {
            this.system.stunts = {
                list: [],
                templates: ["base"],
                description: ""
            };
        }
    }

    /**
 * Calculate Max Health from primary abilities
 * @private
 */
    _calculateMaxHealth() {
        if (!this.system.primaryAbilities) return;
        
        // Save the current value before recalculating
        const currentValue = this.system.secondaryAbilities?.health?.value || 0;
        
        // Calculate max health
        const health = Number(this.system.primaryAbilities.fighting.number || 0) +
                      Number(this.system.primaryAbilities.agility.number || 0) +
                      Number(this.system.primaryAbilities.strength.number || 0) +
                      Number(this.system.primaryAbilities.endurance.number || 0);
       
        // Only update max health, not current health
        this.system.secondaryAbilities.health.max = health;
        
        // IMPORTANT: Only initialize current health for new characters
        // Otherwise, preserve the current value
        if (currentValue === 0 && !this._isInitialized) {
            this.system.secondaryAbilities.health.value = health;
            this._isInitialized = true;
        }
    }
    
    /**
     * Calculate Karma from mental abilities
     * @private
     */
    _calculateKarma() {
        if (!this.system.primaryAbilities) return;
        const karma = Number(this.system.primaryAbilities.reason.number || 0) +
                     Number(this.system.primaryAbilities.intuition.number || 0) +
                     Number(this.system.primaryAbilities.psyche.number || 0);
       
        // Always update both max and current karma
        this.system.secondaryAbilities.karma.max = karma;
        this.system.secondaryAbilities.karma.value = karma;
    }
    /* async updateKarma(advancementFund, karmaPool) {
        const lifetimeTotal = karmaPool + advancementFund;
        await this.update({
            "system.karmaTracking.advancementFund": advancementFund,
            "system.karmaTracking.karmaPool": karmaPool,
            "system.karmaTracking.lifetimeTotal": lifetimeTotal
        });
    } */

    /**
     * Update resource rank based on the current number value
     * @private
     */
    _updateResourceRank() {
        if (!this.system.secondaryAbilities?.resources) return;

        const resourceNumber = this.system.secondaryAbilities.resources.number || 0;
        this.system.secondaryAbilities.resources.rank = this.getRankFromValue(resourceNumber);
    }

    /**
     * Convert a numerical value to its corresponding rank name
     * @param {number} value - The numerical value to convert
     * @returns {string} The rank name
     */
    getRankFromValue(value) {
        if (value <= 0) return "Shift 0";
        if (value <= 2) return "Feeble";
        if (value <= 4) return "Poor";
        if (value <= 7) return "Typical";
        if (value <= 15) return "Good";
        if (value <= 25) return "Excellent";
        if (value <= 36) return "Remarkable";
        if (value <= 45) return "Incredible";
        if (value <= 62) return "Amazing";
        if (value <= 87) return "Monstrous";
        if (value <= 125) return "Unearthly";
        if (value <= 175) return "Shift X";
        if (value <= 350) return "Shift Y";
        if (value <= 999) return "Shift Z";
        if (value <= 1000) return "Class 1000";
        if (value <= 3000) return "Class 3000";
        if (value <= 5000) return "Class 5000";
        return "Beyond";
    }

    /**
     * Apply a column shift to a rank
     * @param {string} rank - The starting rank
     * @param {number} shift - The number of columns to shift
     * @returns {string} The resulting rank after the shift
     */
    applyColumnShift(rank, shift) {
        const ranks = [
            "Shift 0", "Feeble", "Poor", "Typical", "Good", "Excellent", 
            "Remarkable", "Incredible", "Amazing", "Monstrous", 
            "Unearthly", "Shift X", "Shift Y", "Shift Z", 
            "Class 1000", "Class 3000", "Class 5000", "Beyond"
        ];
        
        const currentIndex = ranks.indexOf(rank);
        if (currentIndex === -1) return rank; // Return original if not found
        
        const newIndex = Math.min(Math.max(currentIndex + shift, 0), ranks.length - 1);
        return ranks[newIndex];
    }

    /**
     * Get the color result for a roll against a rank
     * @param {number} rollTotal - The total of the roll
     * @param {string} rank - The rank being tested against
     * @returns {string} The color result (white, green, yellow, or red)
     */
    getColorResult(rollTotal, rank) {
        const ranges = CONFIG.marvel.universalTableRanges[rank];
        if (!ranges) return "white"; // Default to white if rank not found

        for (const [color, [min, max]] of Object.entries(ranges)) {
            if (rollTotal >= min && rollTotal <= max) {
                return color;
            }
        }

        return "white"; // Default to white if no range matched
    }

    /**
     * Validate and normalize an ability value
     * @param {string} ability - The ability name
     * @param {number} value - The value to validate
     * @returns {number} The normalized value
     * @private
     */
    _validateAbilityValue(ability, value) {
        const numValue = Number(value);
        if (isNaN(numValue)) return 0;
        
        // Cap at 5000 (Beyond rank)
        return Math.min(Math.max(numValue, 0), 5000);
    }

    /**
     * Roll an ability check
     * @param {string} abilityId - The ID of the ability to roll
     * @param {Object} options - Roll options
     * @returns {Promise<Roll>} The roll result
     */
    async rollAbility(abilityId, options = {}) {
        try {
            const ability = this.system.primaryAbilities[abilityId];
            if (!ability) {
                throw new Error(`Ability ${abilityId} not found`);
            }
    
            // Get base rank and apply column shift
            const baseRank = ability.rank || this.getRankFromValue(ability.number);
            const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
            
            // Create and evaluate the roll asynchronously
            const roll = new Roll("1d100");
            await roll.evaluate(); // Evaluate properly in Foundry V12
            
            const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
            const finalRoll = Math.min(100, roll.total + karmaPoints);
            
            // Deduct karma if used
            if (karmaPoints > 0) {
                await this.update({
                    "system.secondaryAbilities.karma.value": this.system.secondaryAbilities.karma.value - karmaPoints
                });
            }
            
            // Get the color result and outcome
            const color = this.getColorResult(finalRoll, shiftedRank);
            let resultText = color.toUpperCase();
            
            // Handle combat specific results
            if (options.featType === "combat" && options.actionType) {
                resultText = CONFIG.marvel.actionResults[options.actionType]?.results[color] || resultText;
            }
    
            // Create formatted ability name
            const formattedAbility = abilityId.charAt(0).toUpperCase() + abilityId.slice(1);
            
            // Create chat message content
            const messageContent = `
            <div class="faserip-roll">
                <h3>${this.name} - ${formattedAbility} Roll ${options.featType === "combat" ? 
                    `(${CONFIG.marvel.actionResults[options.actionType]?.name || "Combat"})` : 
                    "(Ability FEAT)"}</h3>
                <div>Base Rank: ${baseRank} (${ability.number})</div>
                ${options.columnShift ? 
                    `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                <div>Roll: ${roll.total}${karmaPoints ? 
                    ` + Karma: ${karmaPoints} = ${finalRoll}` : ''}</div>
                <div class="roll-result" style="background-color: ${color}; color: ${color === 'white' || color === 'yellow' ? 'black' : 'white'}; padding: 5px; text-align: center; font-weight: bold; border: 1px solid black;">
                    ${resultText} (${color.toUpperCase()})
                </div>
            </div>`;
            // Create the chat message
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent,
                rolls: [roll],
                sound: CONFIG.sounds.dice
            });
    
            return { roll, color, result: resultText };
        } catch (error) {
            console.error("Error in rollAbility:", error);
            ui.notifications.error("Error rolling ability check");
            throw error;
        }
    }

    /**
     * Roll a power
     * @param {string} powerIndex - Index of the power in the powers list
     * @param {Object} options - Roll options
     * @returns {Promise<Roll>} The roll result
     */
    async rollPower(powerID, options = {}) {
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
        const roll = new Roll("1d100");
        await roll.evaluate({ async: true });
        
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
    }
    
async rollAttack(ability, attackType, options = {}) {
    try {
        const abilityData = this.system.primaryAbilities[ability.toLowerCase()];
        if (!abilityData) {
            console.error(`Ability ${ability} not found`);
            throw new Error(`Ability ${ability} not found`);
        }

        // Map equipment types to combat types
        const typeMapping = {
            "S": "Sh",    // Shooting should map to "Sh"
            "F": "Fo",    // Force maps to "Fo"
            "E": "En",    // Energy maps to "En"
            "EA": "EA",   // Edged Attack maps to "EA"
            "ET": "TE",   // Edged Thrown maps to "TE"
            "BA": "BA",   // Blunt Attack maps to "BA"
            "BT": "TB",    // Blunt Thrown maps to "TB"
            "W": "Gr",     // Wrestling maps to "Gr" (Grappling)
            "Gr": "Gp",   // Explicit Grappling maps to "Gp"
            "Gp": "Gp"    // Direct Grappling code maps to "Gp"
        };

        // Get the mapped combat type
        const combatType = typeMapping[attackType] || attackType;  // This allows it to pass through unmapped types
        
        // Get base rank and apply column shift
        const baseRank = abilityData.rank || this.getRankFromValue(abilityData.number);
        const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
    
        // Roll the dice
        const roll = new Roll("1d100");
        await roll.evaluate(); // Evaluate properly in Foundry V12

        const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
        const total = Math.min(100, roll.total + karmaPoints);

        console.log("Attack roll result:", { 
            total, 
            baseRank, 
            shiftedRank,
            abilityData,
            combatType
        });

        // Handle karma deduction if karma was spent
        if (karmaPoints > 0) {
            const currentKarma = this.system.karmaTracking.karmaPool;
            const currentHistory = this.system.karmaTracking.history || [];
            
            const newEntry = {
                date: new Date().toLocaleString(),
                amount: -karmaPoints,
                description: `Spent on ${ability.toUpperCase()} Attack roll`
            };

            await this.update({
                "system.karmaTracking.karmaPool": currentKarma - karmaPoints,
                "system.karmaTracking.history": [...currentHistory, newEntry]
            });
        }
    
        // Get the color result
        const color = this.getColorResult(total, shiftedRank);

        // Get combat results based on combat type
        let resultText;
        const attackCode = typeMapping[attackType] || "BA";  // Default to Blunt Attack if type not found
        resultText = CONFIG.marvel.actionResults[attackCode]?.results[color] || color.toUpperCase();
    
        // Create chat message content
        const messageContent = `
        <div class="faserip-roll">
            <h3>${this.name} - ${ability.toUpperCase()} Roll (${combatType})</h3>
            <div>Base Rank: ${baseRank} (${abilityData.number})</div>
            ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
            <div>Roll: ${roll.total}${karmaPoints ? ` + Karma: ${karmaPoints} = ${total}` : ''}</div>
            ${options.weaponDamage ? `<div>Weapon Damage: ${options.weaponDamage}</div>` : ''}
            ${options.range ? `<div>Range: ${options.range}</div>` : ''}
            <div class="roll-result" style="background-color: ${color}; color: ${color === 'white' || color === 'yellow' ? 'black' : 'white'}; padding: 5px; text-align: center; font-weight: bold; border: 1px solid black;">
                ${resultText} (${color.toUpperCase()})
            </div>
        </div>`;
    
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });
    
        return { roll, color, total };
    } catch (err) {
        console.error("Error in rollAttack:", err);
        ui.notifications.error("Error processing attack roll");
        return null;
    }
}

    /**
     * Calculate damage from a combat hit
     * @param {string} color - The color result (white, green, yellow, red)
     * @param {string} attackType - The type of attack (BA, EA, etc)
     * @param {Object} options - Additional options including weaponDamage
     * @returns {number} The calculated damage amount
     */

    _calculateCombatDamage(color, attackType, options = {}) {    
        // Get base damage from attacker's strength or weapon
        let baseDamage = 0;
        if (attackType === "BA" || attackType === "TB") {
            // For blunt attacks, use strength
            baseDamage = this.system.primaryAbilities.strength.number;
        } else {
            // For other attacks, use weapon damage
            baseDamage = options.weaponDamage || 0;
        }

        // Get combat effects based on attack type and color
        const combatEffect = CONFIG.marvel.actionResults[attackType]?.results[color];
        if (!combatEffect) return 0;

        // Different effects based on hit type
        let finalDamage = 0;
        switch (combatEffect.toLowerCase()) {
            case 'miss':
                finalDamage = 0;
                break;
            case 'hit':
                finalDamage = baseDamage;
                break;
            case 'slam':
                finalDamage = baseDamage;
                // TODO: Add slam effects (knockback) later
                break;
            case 'stun':
                finalDamage = baseDamage;
                // TODO: Add stun effects later
                break;
            case 'kill':
                finalDamage = baseDamage * 2; // Double damage for kill results
                break;
            case 'bullseye':
                finalDamage = baseDamage * 1.5; // 1.5x damage for bullseye
                break;
            default:
                finalDamage = baseDamage;
        }

        return finalDamage;
    }

    /**
     * Handle an attack attempt against a target
     * @param {string} ability - The ability used (fighting, agility)
     * @param {string} attackType - The type of attack (BA, EA, etc)
     * @param {Object} options - Additional options
     * @param {Actor} target - The target actor
     * @returns {Promise<Object>} The attack results
     */
    async handleAttack(ability, attackType, options = {}, target) {
        try {
            // Prevent double processing
            if (this._processingAttack) {
                console.log("Attack already being processed");
                return null;
            }
            this._processingAttack = true;
    
            if (!target?.actor) {
                ui.notifications.error("Valid target required");
                this._processingAttack = false;
                return null;
            }
    
            // Roll attack with proper error handling
            const attackRoll = await this.rollAttack(ability, attackType, options);
            if (!attackRoll?.success) {
                this._processingAttack = false;
                return attackRoll;
            }
    
            // Calculate and apply damage
            const damageResult = await this._calculateAndApplyDamage(
                attackRoll, 
                attackType, 
                options, 
                target
            );
    
            this._processingAttack = false;
            return {
                ...attackRoll,
                ...damageResult
            };
    
        } catch (err) {
            console.error("Error in handleAttack:", err);
            ui.notifications.error("Error processing attack");
            this._processingAttack = false;
            return null;
        }
    }


    /**
     * Handle an attack attempt against a target
     * @param {string} ability - The ability used (fighting, agility)
     * @param {string} attackType - The type of attack (BA, EA, etc)
     * @param {Object} options - Additional options
     * @param {Actor} target - The target actor
     * @returns {Promise<Object>} The attack results
     */
    /* async handleAttack(ability, attackType, options = {}, target) {
        if (!target) {
            ui.notifications.error("No target selected");
            return null;
        }

        // Check if we're in the right phase for defensive actions
        const combat = game.combat;
        if (!combat) return;

        const currentPhase = combat.getFlag("marvel-faserip", "currentPhase");
        const targetToken = target.token;
        
        // Check if target has declared a defensive action
        const defense = combat.hasDefensiveAction(targetToken.id);
        if (defense && !defense.used) {
            // Force the defensive action to resolve first
            const defenseResult = await target.rollAbility(defense.action === "Bl" ? "strength" : "agility", {
                featType: "combat",
                actionType: defense.action
            });
            
            // If defense succeeds (not white result), attack automatically misses
            if (defenseResult.color !== "white") {
                await combat.useDefensiveAction(targetToken.id);
                return { success: false, defended: true, defenseType: defense.action };
            }
        }
    
        // Roll the attack
        const attackRoll = await this.rollAttack(ability, attackType, options);
        if (!attackRoll) return null;
    
        // If hit (anything but white), calculate and apply damage
        if (attackRoll.color !== "white") {
            let calculatedDamage = 0;
    
            // Calculate base damage based on attack type
            switch(attackType) {
                case "BA": // Blunt Attack
                    calculatedDamage = this.system.primaryAbilities.strength.number;
                    break;
                case "EA": // Edged Attack
                    calculatedDamage = options.weaponDamage || this.system.primaryAbilities.strength.number;
                    break;
                case "TB": // Throwing Blunt
                case "TE": // Throwing Edged
                    calculatedDamage = Math.min(this.system.primaryAbilities.strength.number, options.weaponDamage || 0);
                    break;
                case "Sh": // Shooting
                    calculatedDamage = options.weaponDamage || 0;
                    break;
                case "En": // Energy
                case "Fo": // Force
                    calculatedDamage = options.weaponDamage || 0;
                    break;
            }
    
            // Get target's armor/protection if any
            const targetArmor = target.system.resistances?.list?.find(r => 
                r.type.toLowerCase() === "physical")?.number || 0;
    
            // Reduce damage by armor
            const finalDamage = Math.max(0, calculatedDamage - targetArmor);
    
            // Handle special effects based on result color and attack type
            let effectResult = null;
            if (attackRoll.color === "yellow" || attackRoll.color === "red") {
                switch(attackType) {
                    case "BA":
                        if (attackRoll.color === "yellow") effectResult = "slam";
                        else effectResult = "stun";
                        break;
                    case "EA":
                        if (attackRoll.color === "yellow") effectResult = "stun";
                        else effectResult = "kill";
                        break;
                    case "Sh":
                        if (attackRoll.color === "yellow") effectResult = "bullseye";
                        else effectResult = "kill";
                        break;
                }
            }
    
            // Apply damage to target
            if (finalDamage > 0) {
                try {
                    const currentHealth = target.system.secondaryAbilities.health.value;
                    const newHealth = Math.max(0, currentHealth - finalDamage);
                    
                    await target.update({
                        "system.secondaryAbilities.health.value": newHealth
                    });
    
                    // Create damage message
                    const messageContent = `
                        <div class="marvel-damage">
                            <h3>${this.name} hits ${target.name}!</h3>
                            <div class="damage-details">
                                <div>Base Damage: ${calculatedDamage}</div>
                                ${targetArmor ? `<div>Target Armor: ${targetArmor}</div>` : ''}
                                <div>Final Damage: ${finalDamage}</div>
                                ${effectResult ? `<div>Effect: ${effectResult.toUpperCase()}</div>` : ''}
                                <div>Health: ${currentHealth} → ${newHealth}</div>
                            </div>
                        </div>`;
    
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this }),
                        content: messageContent
                    });
    
                    // Handle special effects like Stun, Slam, or Kill
                    if (effectResult && finalDamage > 0) {
                        await target.handleCombatEffect(effectResult);
                    }
    
                } catch (error) {
                    console.error('Error applying damage:', error);
                    ui.notifications.error("Error applying damage to target");
                }
            }
    
            return { ...attackRoll, damage: finalDamage, effect: effectResult };
        }
    
        return attackRoll;
    } */

    /**
     * Get CSS class for color formatting
     * @param {string} color - The color result
     * @returns {string} The CSS class name
     * @private
     */
    _getColorClass(color) {
        const colorMap = {
            white: 'white-result',
            green: 'green-result',
            yellow: 'yellow-result',
            red: 'red-result'
        };
        return colorMap[color.toLowerCase()] || '';
    }

    async handleCombatEffect(effectType) {
        // Roll endurance FEAT for effect
        /* const enduranceRoll = new Roll("1d100").evaluateSync(); */
        const enduranceRoll = new Roll("1d100");
        await enduranceRoll.evaluate({async: true});

        const enduranceRank = this.system.primaryAbilities.endurance.rank;
        
        // Get color result from universal table
        const color = this.getColorResult(enduranceRoll.total, enduranceRank);
        
        let effectResult = "";
        let effectMessage = "";
    
        switch(effectType) {
            case "slam":
                // Handle Slam per rules
                if (color === "white") {
                    effectResult = "No Slam";
                    effectMessage = "Resists the slam attempt";
                } else if (color === "green") {
                    effectResult = "Stagger";
                    effectMessage = "Staggers back but maintains footing";
                } else if (color === "yellow") {
                    effectResult = "1 Area";
                    effectMessage = "Knocked back one area";
                } else if (color === "red") {
                    effectResult = "Grand Slam";
                    effectMessage = "Knocked back with force";
                }
                break;
    
            case "stun":
                // Handle Stun per rules
                if (color === "white") {
                    effectResult = "No Effect";
                    effectMessage = "Resists the stun attempt";
                } else if (color === "green") {
                    effectResult = "1 Round";
                    effectMessage = "Stunned for 1 round";
                } else if (color === "yellow" || color === "red") {
                    const rounds = Math.floor(Math.random() * 10) + 1;
                    effectResult = `${rounds} Rounds`;
                    effectMessage = `Stunned for ${rounds} rounds`;
                }
                break;
    
            case "kill":
                // Handle Kill per rules
                if (color === "white") {
                    effectResult = "No Effect";
                    effectMessage = "Resists the killing blow";
                } else if (color === "green") {
                    if (["EA", "Sh"].includes(attackType)) { // Only for Edged and Shooting
                        effectResult = "Endurance Loss";
                        effectMessage = "Takes severe damage, losing Endurance rank";
                        // Reduce Endurance rank
                        const currentRank = this.system.primaryAbilities.endurance.rank;
                        const ranks = Object.keys(CONFIG.marvel.ranks);
                        const currentIndex = ranks.indexOf(currentRank);
                        if (currentIndex > 0) {
                            await this.update({
                                "system.primaryAbilities.endurance.rank": ranks[currentIndex - 1]
                            });
                        }
                    }
                } else if (color === "yellow" || color === "red") {
                    effectResult = "Endurance Loss";
                    effectMessage = "Takes severe damage, losing Endurance rank";
                    // Same endurance reduction as above
                    const currentRank = this.system.primaryAbilities.endurance.rank;
                    const ranks = Object.keys(CONFIG.marvel.ranks);
                    const currentIndex = ranks.indexOf(currentRank);
                    if (currentIndex > 0) {
                        await this.update({
                            "system.primaryAbilities.endurance.rank": ranks[currentIndex - 1]
                        });
                    }
                }
                break;
        }
    
        // Create chat message for effect
        if (effectMessage) {
            const messageContent = `
                <div class="marvel-effect">
                    <h3>${this.name} - ${effectType.toUpperCase()} Effect</h3>
                    <div class="effect-details">
                        <div>Endurance Roll: ${enduranceRoll.total}</div>
                        <div>Result: ${effectResult}</div>
                        <div>${effectMessage}</div>
                    </div>
                </div>`;
    
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });
        }
    
        return { result: effectResult, message: effectMessage };
    }

    /**
     * Check if a Resource FEAT attempt is allowed
     * @param {string} itemRank - The rank of the item being attempted
     * @returns {Object} Object containing whether FEAT is allowed and message
     * @private
     */
    async _canAttemptResourceFeat(itemRank) {
        const lastAttempt = this.getFlag("marvel-faserip", "lastResourceAttempt");
        const lastFailure = this.getFlag("marvel-faserip", "lastResourceFailure");
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Check weekly attempt limit
        if (lastAttempt && (now - lastAttempt.timestamp) < oneWeek) {
            const daysRemaining = Math.ceil((oneWeek - (now - lastAttempt.timestamp)) / (24 * 60 * 60 * 1000));
            return {
                allowed: false,
                message: `Must wait ${daysRemaining} more days between Resource FEAT attempts.`
            };
        }

        // Check failure restrictions
        if (lastFailure && (now - lastFailure.timestamp) < oneWeek) {
            const ranks = Object.keys(CONFIG.marvel.ranks);
            const failedRankIndex = ranks.indexOf(lastFailure.rank);
            const attemptedRankIndex = ranks.indexOf(itemRank);
            
            if (attemptedRankIndex >= failedRankIndex) {
                const daysRemaining = Math.ceil((oneWeek - (now - lastFailure.timestamp)) / (24 * 60 * 60 * 1000));
                return {
                    allowed: false,
                    message: `Cannot attempt items of rank ${lastFailure.rank} or higher for ${daysRemaining} more days.`
                };
            }
        }

        return { allowed: true, message: null };
    }

    /**
     * Get difficulty for a Resource FEAT
     * @param {string} resourceRank - Actor's resource rank
     * @param {string} itemRank - Item's rank
     * @returns {Object} Difficulty assessment
     * @private
     */
    _getResourceFeatDifficulty(resourceRank, itemRank) {
        const ranks = Object.keys(CONFIG.marvel.ranks);
        const resourceIndex = ranks.indexOf(resourceRank);
        const itemIndex = ranks.indexOf(itemRank);

        if (itemIndex > resourceIndex) {
            return {
                allowed: false,
                message: "Cannot purchase items above your Resource rank"
            };
        }

        const rankDiff = resourceIndex - itemIndex;

        if (rankDiff >= 3) {
            return {
                allowed: true,
                automatic: true,
                message: "Automatic Success (3+ ranks below Resources)"
            };
        }

        if (rankDiff > 0) {
            return {
                allowed: true,
                color: "green",
                difficulty: "Green",
                message: "Green FEAT required (1-2 ranks below)"
            };
        }

        return {
            allowed: true,
            color: "yellow",
            difficulty: "Yellow",
            message: "Yellow FEAT required (equal rank)"
        };
    }

    /**
     * Roll a Resource FEAT
     * @param {string} itemRank - The rank of the item being purchased
     * @param {Object} options - Roll options
     * @returns {Promise<Roll|null>} The roll result or null if automatic/failed
     */
    
    async rollResourceFeat(itemRank, options = {}) {
        // Get rank calculations
        const resourceRank = this.system.secondaryAbilities.resources.rank;
        const ranks = Object.keys(CONFIG.marvel.ranks);
        const resourceIndex = ranks.indexOf(resourceRank);
        const itemIndex = ranks.indexOf(itemRank);
        const rankDiff = resourceIndex - itemIndex;
    
        // Check if automatic purchase
        const isAutomaticPurchase = rankDiff >= 3 && !options.useBank;
    
        // Check timing only if not automatic and not GM
        if (!isAutomaticPurchase && !game.user.isGM) {
            const lastAttempt = this.getFlag("marvel-faserip", "lastResourceAttempt");
            if (lastAttempt) {
                const daysSinceAttempt = Math.floor((Date.now() - lastAttempt.timestamp) / (24 * 60 * 60 * 1000));
                if (daysSinceAttempt < 7) {
                    ui.notifications.error(`Must wait ${7 - daysSinceAttempt} more days before making another resource roll.`);
                    return null;
                }
            }
        }

        let messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - Resource FEAT</h3>
                <div class="roll-details">
                    <div>Resource Rank: ${resourceRank}</div>
                    <div>Item Rank: ${itemRank}</div>`;

        // Handle bank loan attempts
        if (options.useBank) {
            if (rankDiff < -1) {
                messageContent += `
                    <div class="resource-failure">Bank loans only available for items one rank above Resources</div>
                </div>`;
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    content: messageContent
                });
                return null;
            }
        }
        // Handle non-bank attempts above resource rank
        else if (rankDiff < 0) {
            messageContent += `
                <div class="resource-failure">Cannot purchase items above Resource rank without bank loan</div>
            </div>`;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });
            return null;
        }

        // Handle automatic success (3+ ranks below)
        if (rankDiff >= 3 && !options.useBank) {
            messageContent += `
                <div class="success">Automatic Success (item rank is 3+ ranks below Resources)</div>
            </div>`;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });

            await this.setFlag("marvel-faserip", "lastResourceAttempt", {
                timestamp: Date.now(),
                rank: itemRank,
                date: new Date().toISOString()
            });

            return { success: true, automatic: true };
        }

        // Determine required color
        let requiredColor;
        if (options.useBank) {
            requiredColor = "yellow"; // Bank loans require yellow FEAT
        } else if (rankDiff === 0) {
            requiredColor = "yellow"; // Equal rank requires yellow
        } else if (rankDiff > 0) {
            requiredColor = "green"; // 1-2 ranks below requires green
        }

        // Roll with karma points
        const roll = new Roll("1d100");
        await roll.evaluate({async: true});
        const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
        const finalRoll = Math.min(100, roll.total + karmaPoints);

        // Deduct karma if used
        if (karmaPoints > 0) {
            await this.update({
                "system.secondaryAbilities.karma.value": this.system.secondaryAbilities.karma.value - karmaPoints
            });
        }

        // Get result color
        let shiftedRank = resourceRank;
        if (options.columnShift) {
            shiftedRank = this.applyColumnShift(resourceRank, options.columnShift);
        }
        const result = this.getColorResult(finalRoll, shiftedRank);
        const success = this.isSuccessfulColor(result, requiredColor);

        // Record attempt
        const attemptData = {
            timestamp: Date.now(),
            rank: itemRank,
            date: new Date().toISOString()
        };
        await this.setFlag("marvel-faserip", "lastResourceAttempt", attemptData);

        // If failed, record failure and lockout
        if (!success) {
            await this.setFlag("marvel-faserip", "lastResourceFailure", attemptData);
        }

        // Complete message content
        messageContent += `
            ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
            <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
            ${options.useBank ? '<div>Using Bank Loan</div>' : ''}
            <div class="roll-result ${this._getColorClass(result)}">
                ${result.toUpperCase()}
            </div>
            <div class="roll-success">
                ${success ? 'Success!' : 'Failure - Cannot attempt purchases of this rank or higher for one week'}
            </div>
        </div>`;

        // Create chat message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll]
        });

        // Handle bank loan approval
        if (success && options.useBank) {
            // Calculate loan duration based on item rank value
            const duration = CONFIG.marvel.ranks[itemRank]?.standard || 12;
            // Calculate payment rank (2 ranks below item rank)
            const paymentRankIndex = Math.max(0, itemIndex - 2);
            const paymentRank = ranks[paymentRankIndex];

            await this.setFlag("marvel-faserip", "activeLoan", {
                itemRank: itemRank,
                paymentRank: paymentRank,
                remainingMonths: duration,
                startDate: new Date().toISOString()
            });

            ui.notifications.info(`Loan approved! Monthly payments at ${paymentRank} rank for ${duration} months required.`);
        }

        return { roll, result, success };

    } catch (error) {
        console.error("Error in rollResourceFeat:", error);
        ui.notifications.error("Error processing resource roll");
        return null;
    }

// Add helper method to MarvelActor.js if not already present
isSuccessfulColor(resultColor, requiredColor) {
    const colorValues = {
        "white": 0,
        "green": 1,
        "yellow": 2,
        "red": 3
    };
    return colorValues[resultColor.toLowerCase()] >= colorValues[requiredColor.toLowerCase()];
}

async _getResourceWarningMessage(lastAttempt) {
    if (lastAttempt && !game.user.isGM) {
        const daysSinceAttempt = Math.floor((Date.now() - lastAttempt.timestamp) / (24 * 60 * 60 * 1000));
        if (daysSinceAttempt < 7) {
            return `Warning: Last roll attempt was ${daysSinceAttempt} days ago. Must wait ${7 - daysSinceAttempt} more days before making another roll.`;
        }
    }
    return "";
}

async clearResourceLockout() {
    await this.unsetFlag("marvel-faserip", "lastResourceAttempt");
    await this.unsetFlag("marvel-faserip", "lastResourceFailure");
    await this.unsetFlag("marvel-faserip", "activeLoan");
    await game.user.unsetFlag("world", "marvelResourceOptions");
    
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `
            <div class="marvel-roll">
                <h3>${this.name} - Resource FEAT Lockout Cleared</h3>
                <div class="roll-details">
                    <div>GM has cleared the resource FEAT lockout.</div>
                </div>
            </div>`
    });
    
    ui.notifications.info("Resource FEAT roll lockout cleared");
}   
    /**
     * Roll a Popularity FEAT
     * @param {string} popularityType - Either "hero" or "secret"
     * @param {Object} options - Roll options
     * @returns {Promise<Roll>} The roll result
     */
    async rollPopularityFeat(popularityType, options = {}) {
        if (!["hero", "secret"].includes(popularityType)) {
            throw new Error("Invalid popularity type. Must be 'hero' or 'secret'");
        }

        const popularity = this.system.secondaryAbilities.popularity[popularityType];
        const isNegative = popularity < 0;
        const absolutePopularity = Math.abs(popularity);
        let baseRank = this.getRankFromValue(absolutePopularity);

        // Calculate total column shift
        let totalShift = 0;

        // Apply disposition modifiers for positive popularity
        if (!isNegative) {
            switch(options.disposition) {
                case "friendly":
                    // Green FEAT - no shift needed
                    break;
                case "neutral":
                    totalShift -= 1; // Yellow FEAT
                    break;
                case "unfriendly":
                    totalShift -= 2; // Red FEAT
                    break;
                case "hostile":
                    // Return early - impossible FEAT
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this }),
                        content: `
                            <div class="marvel-roll">
                                <h3>Popularity FEAT - IMPOSSIBLE</h3>
                                <p>Hostile targets cannot be influenced through Popularity.</p>
                            </div>`
                    });
                    return null;
            }
        }

        // Add circumstance modifiers
        if (options.modifiers) {
            totalShift += Object.values(options.modifiers).reduce((a, b) => a + b, 0);
        }

        // Add any additional shift
        totalShift += options.additionalShift || 0;

        // Apply total shift to get final rank
        const shiftedRank = this.applyColumnShift(baseRank, totalShift);

        // Roll and add karma
        const roll = new Roll("1d100");
        await roll.evaluate(); // Evaluate properly in Foundry V12
        
        const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
        const finalRoll = Math.min(100, roll.total + karmaPoints);

        // Deduct karma if used
        if (karmaPoints > 0) {
            await this.update({
                "system.secondaryAbilities.karma.value": this.system.secondaryAbilities.karma.value - karmaPoints
            });
        }

        // Get color result
        const color = this.getColorResult(finalRoll, shiftedRank);

        // Determine success based on circumstances
        let success = false;
        if (isNegative) {
            // Negative popularity always needs yellow or better
            success = ["yellow", "red"].includes(color);
        } else {
            switch(options.disposition) {
                case "friendly":
                    success = ["green", "yellow", "red"].includes(color);
                    break;
                case "neutral":
                    success = ["yellow", "red"].includes(color);
                    break;
                case "unfriendly":
                    success = ["red"].includes(color);
                    break;
            }
        }

        // Create chat message content
        const messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - ${popularityType.charAt(0).toUpperCase() + popularityType.slice(1)} Popularity FEAT</h3>
                <div class="roll-details">
                    <div>Popularity: ${popularity} (${baseRank})</div>
                    <div>Disposition: ${options.disposition || "N/A"}</div>
                    ${totalShift ? `<div>Total Column Shift: ${totalShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    ${success ? "SUCCESS" : "FAILURE"}
                </div>
            </div>`;

        // Create chat message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });

        return { roll, success, color };
    }

    /**
     * Apply damage to the actor
     * @param {number} damage - Amount of damage to apply
     * @param {Object} options - Additional options for damage application
     * @returns {Promise} Promise that resolves when damage is applied
     */
    async applyDamage(damage, options = {}) {
        console.log(`Applying ${damage} damage to ${this.name}`);

        await this.setFlag("marvel-faserip", "lastDamage", { timestamp: game.time.worldTime });
        
        // Get current health values
        const currentHealth = this.system.secondaryAbilities.health.value;
        console.log(`Current health: ${currentHealth}`);
        
        // Calculate new health (ensure it can go to 0 but not negative)
        const newHealth = Math.max(0, currentHealth - damage);
        console.log(`New health will be: ${newHealth}`);
    
        // Create chat message for damage
        const messageContent = `
            <div class="marvel-damage">
                <h3>${this.name} takes ${damage} damage</h3>
                <div class="health-track">
                    Health: ${currentHealth} → ${newHealth}
                </div>
            </div>`;
    
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });
        
        try {
            // Update health with the correct document API
            await this.update({
                "system.secondaryAbilities.health.value": newHealth
            });
            
            console.log("Health update successful, new health:", this.system.secondaryAbilities.health.value);
            
            // Check if character has reached 0 Health
            if (newHealth === 0) {
                console.log(`${this.name} has fallen unconscious at 0 Health!`);
                await this._handleUnconscious();
            }
        } catch (error) {
            console.error("Error updating health:", error);
            throw error;
        }
        
        return newHealth;
    }

    async canRecoverHealth() {
        const lastDamage = this.getFlag("marvel-faserip", "lastDamage")?.timestamp;
        const lastRecovery = this.getFlag("marvel-faserip", "lastRecoveryTime");
        const currentTime = game.time.worldTime;
        
        // No recovery if unconscious
        if (this.effects.find(e => e.statuses.has("unconscious"))) {
            return { allowed: false, reason: "Character is unconscious" };
        }
        
        // Must wait 10 turns (60 seconds) after damage
        if (lastDamage && (currentTime - lastDamage) < 60) {
            const turnsRemaining = Math.ceil((60 - (currentTime - lastDamage.timestamp)) / 6);
            return { allowed: false, reason: `Must wait ${turnsRemaining} more turns after damage` };
        }
        
        // Only one recovery per day (86400 seconds)
        if (lastRecovery && (currentTime - lastRecovery) < 86400) {
            return { allowed: false, reason: "Only one recovery allowed per day" };
        }
        
        return { allowed: true };
    }

    /**
     * Roll an Endurance FEAT for staying conscious/alive
     * @param {Object} options - Roll options
     * @returns {Promise<Roll>} The roll result
     */
    async rollEnduranceFeat(options = {}) {
        const endurance = this.system.primaryAbilities.endurance;
        const baseRank = endurance.rank || this.getRankFromValue(endurance.number);
        
        // Death checks are always red FEATs
        const difficulty = options.type === "death" ? "red" : "yellow";
        const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);

        // Roll with karma option
        //const roll = new Roll("1d100").evaluateSync();
        const roll = new Roll("1d100");
        await roll.evaluate({async: true});
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
        
        // Determine success - need yellow or better for consciousness, red for death
        const success = options.type === "death" ? 
            color === "red" : 
            ["yellow", "red"].includes(color);

        // Create appropriate message content
        const messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - Endurance FEAT (${options.type === "death" ? "Death" : "Consciousness"})</h3>
                <div class="roll-details">
                    <div>Endurance: ${this.system.primaryAbilities.endurance.number} (${baseRank})</div>
                    ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    ${success ? "SUCCESS" : "FAILURE"}
                </div>
                <div class="feat-consequences">
                    ${this._getEnduranceConsequence(success, options.type)}
                </div>
            </div>`;

        // Create chat message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });

        // Update actor status based on result
        await this._handleEnduranceResult(success, options.type);

        return { roll, success, color };
    }

    /**
     * Get consequence text for endurance FEAT
     * @param {boolean} success - Whether the FEAT was successful
     * @param {string} type - Type of endurance FEAT
     * @returns {string} Consequence description
     * @private
     */
    _getEnduranceConsequence(success, type) {
        if (type === "death") {
            return success ? 
                "The character remains alive but unconscious" : 
                "The character has died";
        } else {
            return success ? 
                "The character remains conscious" : 
                "The character falls unconscious";
        }
    }

    /**
     * Handle the results of an endurance FEAT
     * @param {boolean} success - Whether the FEAT was successful
     * @param {string} type - Type of endurance FEAT
     * @private
     */
    async _handleEnduranceResult(success, type) {
        // Update actor status effects based on result
        const effects = this.effects;
        const unconsciousId = "marvel-faserip.unconscious";
        const deadId = "marvel-faserip.dead";

        if (type === "death") {
            if (!success) {
                // Remove unconscious effect if it exists
                const unconscious = effects.find(e => e.flags?.core?.statusId === unconsciousId);
                if (unconscious) await unconscious.delete();

                // Add dead effect
                await this.createEmbeddedDocuments("ActiveEffect", [{
                    label: "Dead",
                    icon: "icons/svg/skull.svg",
                    /* flags: { core: { statusId: deadId } } */
                    statuses: new Set(["deadId"])
                }]);
            } else {
                // Add unconscious effect if not already present
                const unconscious = effects.find(e => e.flags?.core?.statusId === unconsciousId);
                if (!unconscious) {
                    await this.createEmbeddedDocuments("ActiveEffect", [{
                        label: "Unconscious",
                        icon: "icons/svg/unconscious.svg",
                        /* flags: { core: { statusId: unconsciousId } } */
                        statuses: new Set(["unconscious"])
                    }]);
                }
            }
        } else {
            // Handle consciousness check
            if (!success) {
                await this.createEmbeddedDocuments("ActiveEffect", [{
                    label: "Unconscious",
                    icon: "icons/svg/unconscious.svg",
                    /* flags: { core: { statusId: unconsciousId } } */
                    statuses: new Set(["unconscious"])
                }]);
            }
        }
    }

 /**
 * Handle unconsciousness and potential death when Health reaches 0
 * @private
 */
 async _handleUnconscious() {
    // First apply unconscious status effect 
    // Remove any existing unconscious effect to avoid duplicates
    const existingEffect = this.effects.find(e => e.statuses.has("unconscious"));
    if (existingEffect) await existingEffect.delete();
    
    // Add unconscious effect
    await this.createEmbeddedDocuments("ActiveEffect", [{
        label: "Unconscious",
        icon: "icons/svg/unconscious.svg",
        statuses: new Set(["unconscious"])
    }]);

    // Roll Endurance FEAT to check for Endurance Loss
    const enduranceRoll = new Roll("1d100");
    await enduranceRoll.evaluate({async: true});
    
    // Get character's endurance rank
    const enduranceRank = this.system.primaryAbilities.endurance.rank;
    
    // Get result based on Kill column of Effects Table
    const color = this.getColorResult(enduranceRoll.total, enduranceRank);
    
    // Determine outcome based on result
    let effect = "";
    let message = "";
    
    // Check Endurance FEAT result
    if (color === "white" || color === "green") {
        // Endurance Loss - character begins dying
        effect = "Endurance Loss";
        message = `${this.name} begins losing Endurance ranks and requires immediate aid!`;
        
        // Start endurance loss process
        await this._startEnduranceLoss();
    } else {
        // No effect - character is stunned but stable
        effect = "Stunned";
        message = `${this.name} is unconscious but stable for 1-10 rounds.`;
        
        // Set a timer to check for consciousness
        const stunRounds = Math.floor(Math.random() * 10) + 1;
        await this.setFlag("marvel-faserip", "unconsciousRounds", stunRounds);
    }
    
    // Create chat message about the unconsciousness
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `
            <div class="marvel-health-check">
                <h3>${this.name} - Health Check</h3>
                <div class="roll-details">
                    <div>Endurance FEAT: ${enduranceRoll.total} (${color.toUpperCase()})</div>
                    <div>Result: ${effect}</div>
                    <div>${message}</div>
                </div>
            </div>`,
        rolls: [enduranceRoll],
        sound: CONFIG.sounds.dice
    });
}

/**
 * Start the process of endurance loss for a dying character
 * @private
 */
async _startEnduranceLoss() {
    // Flag the character as dying
    await this.setFlag("marvel-faserip", "dying", true);
    
    // Store the original endurance rank for recovery
    await this.setFlag("marvel-faserip", "originalEnduranceRank", this.system.primaryAbilities.endurance.rank);
    
    // Create a dying effect with a duration of 1 round (6 seconds)
    await this.createEmbeddedDocuments("ActiveEffect", [{
        label: "Dying",
        icon: "icons/svg/skull.svg",
        duration: {
            rounds: 1,
            seconds: 6,
            startTime: game.time.worldTime
        },
        flags: {
            "marvel-faserip": {
                isDying: true,
                lastUpdate: game.time.worldTime
            }
        },
        statuses: new Set(["dying"])
    }]);

    // Register for time updates
    this._registerDyingEffect();
}

_registerDyingEffect() {
    // Remove any existing hooks first
    const hookId = this.getFlag("marvel-faserip", "dyingHookId");
    if (hookId) {
        Hooks.off("updateWorldTime", hookId);
    }

    // Create new hook for time updates
    const newHookId = Hooks.on("updateWorldTime", (worldTime) => {
        if (!game.paused) {
            this._checkDyingStatus(worldTime);
        }
    });

    // Store the hook ID for later cleanup
    this.setFlag("marvel-faserip", "dyingHookId", newHookId);
}

async _checkDyingStatus(worldTime) {
    const dyingEffect = this.effects.find(e => e.getFlag("marvel-faserip", "isDying"));
    if (!dyingEffect) return;

    const lastUpdate = dyingEffect.getFlag("marvel-faserip", "lastUpdate");
    const timePassed = worldTime - lastUpdate;

    // Check if 6 seconds (1 round) has passed
    if (timePassed >= 6) {
        await this._loseEnduranceRank();
        
        // Update the last check time
        await dyingEffect.update({
            "flags.marvel-faserip.lastUpdate": worldTime
        });
    }
}

async _loseEnduranceRank() {
    // Check if still dying
    if (!this.getFlag("marvel-faserip", "dying")) return;
    
    const currentRank = this.system.primaryAbilities.endurance.rank;
    
    // Get available ranks
    const ranks = Object.keys(CONFIG.marvel.ranks);
    const currentIndex = ranks.indexOf(currentRank);
    
    // If already at Shift 0 or can't find current rank, character dies
    if (currentIndex <= 0 || currentRank === "Shift 0") {
        return this._characterDeath();
    }
    
    // Otherwise reduce one rank
    const newRank = ranks[currentIndex - 1];
    
    // Update endurance rank
    await this.update({
        "system.primaryAbilities.endurance.rank": newRank,
        "system.primaryAbilities.endurance.number": CONFIG.marvel.ranks[newRank]?.standard || 0
    });
    
    // Notify about rank loss
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `
            <div class="marvel-health-check">
                <h3>${this.name} - Endurance Loss</h3>
                <div class="roll-details">
                    <div>Endurance reduced from ${currentRank} to ${newRank}</div>
                    <div>Character will die if not stabilized!</div>
                </div>
            </div>`
    });
}


/**
 * Handle character death
 * @private
 */
async _characterDeath() {
    // Remove dying flag
    await this.unsetFlag("marvel-faserip", "dying");
    
    // Remove dying effect
    const dyingEffect = this.effects.find(e => e.statuses.has("dying"));
    if (dyingEffect) await dyingEffect.delete();
    
    // Remove unconscious effect if present
    const unconsciousEffect = this.effects.find(e => e.statuses.has("unconscious"));
    if (unconsciousEffect) await unconsciousEffect.delete();
    
    // Add dead effect - THIS IS THE ONLY PLACE DEAD STATUS SHOULD BE APPLIED
    await this.createEmbeddedDocuments("ActiveEffect", [{
        label: "Dead",
        icon: "icons/svg/skull.svg",
        statuses: new Set(["dead"])
    }]);
    
    // Create death message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `
            <div class="marvel-death">
                <h3>${this.name} has died</h3>
                <div class="roll-details">
                    <div>Endurance reached Shift 0</div>
                    <div>Character is now deceased.</div>
                </div>
            </div>`,
        sound: CONFIG.sounds.death
    });
}

/**
 * Provide aid to a dying character
 * @param {string} aidType - Type of aid being provided
 * @param {Object} options - Options for the aid
 * @returns {Promise<boolean>} Success of the aid attempt
 */
async provideAid(aidType = "firstAid", options = {}) {
    try {
        // Check if character is dying or at 0 health
        const isDying = this.effects.find(e => e.getFlag("marvel-faserip", "isDying"));
        const isAtZeroHealth = this.system.secondaryAbilities.health.value <= 0;
        
        if (!isDying && !isAtZeroHealth) {
            ui.notifications.warn(`${this.name} is not in need of life-saving aid.`);
            return false;
        }
        
        // Stop the dying process if applicable
        if (isDying) {
            await this.unsetFlag("marvel-faserip", "dying");
            await isDying.delete();
            
            // Remove the time update hook
            const hookId = this.getFlag("marvel-faserip", "dyingHookId");
            if (hookId) {
                Hooks.off("updateWorldTime", hookId);
                await this.unsetFlag("marvel-faserip", "dyingHookId");
            }
        }
        
        // Character remains unconscious for 1-10 hours
        const hoursUnconscious = Math.floor(Math.random() * 10) + 1;
        
        // Create message based on aid type and additional details
        let aidMessage = "";
        switch (aidType) {
            case "firstAid":
                aidMessage = `${options.aider || 'Someone'} has provided first aid to ${this.name}.`;
                break;
            case "medical":
                aidMessage = `${options.aider || 'A medical professional'} has provided medical treatment to ${this.name}.`;
                break;
            case "power":
                aidMessage = `${options.aider || 'Someone'} has used healing powers on ${this.name}.`;
                break;
            default:
                aidMessage = `${options.aider || 'Someone'} has stabilized ${this.name}.`;
        }
        
        // Add any additional details
        if (options.details) {
            aidMessage += ` (${options.details})`;
        }
        
        // Create unconscious effect if not already present
        const unconsciousEffect = this.effects.find(e => e.statuses.has("unconscious"));
        if (!unconsciousEffect) {
            await this.createEmbeddedDocuments("ActiveEffect", [{
                label: "Unconscious",
                icon: "icons/svg/unconscious.svg",
                duration: {
                    hours: hoursUnconscious
                },
                statuses: new Set(["unconscious"])
            }]);
        }
        
        // Create aid message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `
                <div class="marvel-aid">
                    <h3>${this.name} Stabilized</h3>
                    <div class="roll-details">
                        <div>${aidMessage}</div>
                        <div>Character is unconscious but stable for ${hoursUnconscious} hours.</div>
                    </div>
                </div>`
        });
        
        // Set minimum health if at 0
        if (this.system.secondaryAbilities.health.value <= 0) {
            await this.update({
                "system.secondaryAbilities.health.value": 1
            });
        }
        
        return true;
    } catch (error) {
        console.error("Error in provideAid:", error);
        ui.notifications.error("Error while providing aid");
        return false;
    }
}

/**
 * Attempt to regain consciousness
 * @returns {Promise<boolean>} Success of consciousness recovery
 */
async attemptRegainConsciousness() {
    // Check if character is unconscious
    const unconsciousEffect = this.effects.find(e => e.flags?.core?.statusId === "marvel-faserip.unconscious");
    if (!unconsciousEffect) return false;
    
    // Roll Endurance FEAT
    const enduranceRoll = new Roll("1d100");
    await enduranceRoll.evaluate({async: true});
    
    const enduranceRank = this.system.primaryAbilities.endurance.rank;
    const color = this.getColorResult(enduranceRoll.total, enduranceRank);
    
    // Green or better result means success
    const success = ["green", "yellow", "red"].includes(color);
    
    if (success) {
        // Remove unconscious effect
        await unconsciousEffect.delete();
        
        // Restore health to endurance rank
        const enduranceValue = this.system.primaryAbilities.endurance.number;
        await this.update({
            "system.secondaryAbilities.health.value": enduranceValue
        });
        
        // Create success message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `
                <div class="marvel-consciousness">
                    <h3>${this.name} Regains Consciousness</h3>
                    <div class="roll-details">
                        <div>Endurance FEAT: ${enduranceRoll.total} (${color.toUpperCase()})</div>
                        <div>Character has regained consciousness with ${enduranceValue} Health.</div>
                    </div>
                </div>`,
            rolls: [enduranceRoll]
        });
    } else {
        // Create failure message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `
                <div class="marvel-consciousness">
                    <h3>${this.name} Remains Unconscious</h3>
                    <div class="roll-details">
                        <div>Endurance FEAT: ${enduranceRoll.total} (${color.toUpperCase()})</div>
                        <div>Character remains unconscious. Check again in 1-10 rounds.</div>
                    </div>
                </div>`,
            rolls: [enduranceRoll]
        });
    }
    
    return success;
}

/**
 * Apply natural healing to character
 * @param {string} healType - Type of healing (normal, recovery, medical)
 * @returns {Promise<number>} Amount of health recovered
 */
async applyHealing(healType = "normal") {
    // Determine healing amount based on type
    let healAmount = 0;
    let description = "";

    const recoveryCheck = await this.canRecoverHealth();
    if (!recoveryCheck.allowed) {
        ui.notifications.warn(recoveryCheck.reason);
        return 0;
    }
    await this.setFlag("marvel-faserip", "lastRecoveryTime", game.time.worldTime);
    
    switch (healType) {
        case "recovery":
            // Recovery occurs 10 turns after damage if not further damaged
            healAmount = this.system.primaryAbilities.endurance.number;
            description = "Recovery phase (10 turns after damage)";
            break;
            
        case "medical":
            // Double healing rate under medical care
            healAmount = this.system.primaryAbilities.endurance.number * 2;
            description = "Medical treatment (doctor or hospital)";
            break;
            
        default:
            // Normal healing - endurance rank per hour
            healAmount = this.system.primaryAbilities.endurance.number;
            description = "Natural healing (per hour)";
    }
    
    // Cap healing at max health
    const currentHealth = this.system.secondaryAbilities.health.value;
    const maxHealth = this.system.secondaryAbilities.health.max;
    const newHealth = Math.min(maxHealth, currentHealth + healAmount);
    const actualHeal = newHealth - currentHealth;
    
    // Update health
    await this.update({
        "system.secondaryAbilities.health.value": newHealth
    });
    
    // Create healing message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `
            <div class="marvel-healing">
                <h3>${this.name} Heals</h3>
                <div class="roll-details">
                    <div>Healing Type: ${description}</div>
                    <div>Health recovered: ${actualHeal}</div>
                    <div>Health: ${currentHealth} → ${newHealth}</div>
                </div>
            </div>`
    });
    
    return actualHeal;
}

    /**
     * Roll for a power stunt attempt
     * @param {number} stuntIndex - Index of the stunt in the stunts list
     * @param {Object} options - Roll options
     * @returns {Promise<Roll>} The roll result
     */
    async rollPowerStunt(stuntIndex, options = {}) {
        const stunt = this.system.stunts.list[stuntIndex];
        if (!stunt) {
            throw new Error(`Stunt at index ${stuntIndex} not found`);
        }

        // Verify associated power exists
        const power = this.system.powers.list.find(p => p.name === stunt.associatedPower);
        if (!power) {
            throw new Error(`Associated power ${stunt.associatedPower} not found`);
        }

        // Check karma cost (100)
        if (this.system.karmaTracking.karmaPool < 100) {
            ui.notifications.error("Not enough Karma (100 required) for Power Stunt attempt");
            return null;
        }

        // Determine difficulty based on attempts
        let difficulty;
        if (stunt.attempts === 0) {
            difficulty = { color: "red", label: "Red" };
        } else if (stunt.attempts < 4) {
            difficulty = { color: "yellow", label: "Yellow" };
        } else if (stunt.attempts < 11) {
            difficulty = { color: "green", label: "Green" };
        } else {
            // Automatic success after 10 successful attempts
            await this._handleStuntSuccess(stuntIndex);
            return null;
        }

        // Apply column shifts and roll
        const baseRank = power.rank;
        const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
        //const roll = new Roll("1d100").evaluateSync();
        const roll = new Roll("1d100");
        await roll.evaluate({async: true});

        const finalRoll = roll.total;  // No karma allowed on power stunt attempts

        // Deduct karma cost
        await this.update({
            "system.karmaTracking.karmaPool": this.system.karmaTracking.karmaPool - 100
        });

        // Get color result
        const color = this.getColorResult(finalRoll, shiftedRank);
        
        // Determine success based on difficulty
        const colors = ["white", "green", "yellow", "red"];
        const requiredColorIndex = colors.indexOf(difficulty.color);
        const resultColorIndex = colors.indexOf(color);
        const success = resultColorIndex >= requiredColorIndex;

        // Create chat message content
        const messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - Power Stunt Attempt</h3>
                <div class="stunt-details">
                    <div>Power: ${power.name} (${baseRank})</div>
                    <div>Stunt: ${stunt.name}</div>
                    <div>Previous Attempts: ${stunt.attempts}</div>
                    <div>Required Result: ${difficulty.label}</div>
                </div>
                <div class="roll-details">
                    ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${finalRoll}</div>
                    <div>Karma Cost: 100</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    ${success ? "SUCCESS" : "FAILURE"}
                </div>
            </div>`;

        // Create chat message
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });

        // Handle success or failure
        if (success) {
            await this._handleStuntSuccess(stuntIndex);
        } else {
            await this._handleStuntFailure(stuntIndex);
        }

        return { roll, success, color };
    }

    /**
     * Handle successful power stunt attempt
     * @param {number} stuntIndex - Index of the stunt
     * @private
     */
    async _handleStuntSuccess(stuntIndex) {
        const stunts = duplicate(this.system.stunts.list);
        const stunt = stunts[stuntIndex];
        
        // Increment attempts
        stunt.attempts += 1;
        stunt.status = stunt.attempts >= 11 ? "mastered" : "learning";
        
        // Update stunts list
        await this.update({
            "system.stunts.list": stunts
        });

        // If mastered, create chat message
        if (stunt.attempts >= 11) {
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: `
                    <div class="marvel-stunt-mastery">
                        <h3>${this.name} has mastered a Power Stunt!</h3>
                        <div>${stunt.name} can now be used automatically.</div>
                    </div>`
            });
        }
    }

    /**
     * Handle failed power stunt attempt
     * @param {number} stuntIndex - Index of the stunt
     * @private
     */
    async _handleStuntFailure(stuntIndex) {
        // No increment of attempts on failure
        const stunts = duplicate(this.system.stunts.list);
        const stunt = stunts[stuntIndex];
        stunt.status = "failed";
        
        await this.update({
            "system.stunts.list": stunts
        });
    }

    /**
     * Advance an ability using karma
     * @param {string} abilityId - ID of the ability to advance
     * @returns {Promise<boolean>} Success of the advancement
     */
    async advanceAbility(abilityId) {
        const ability = this.system.primaryAbilities[abilityId];
        if (!ability) {
            throw new Error(`Ability ${abilityId} not found`);
        }

        // Calculate karma cost for advancement
        const currentValue = ability.number || 0;
        const karmaCost = this._getAbilityAdvancementCost(currentValue);
        
        // Check if we have enough karma
        if (this.system.karmaTracking.advancementFund < karmaCost) {
            ui.notifications.error(`Not enough karma (${karmaCost} required) to advance ${abilityId}`);
            return false;
        }

        // Update ability and deduct karma
        await this.update({
            [`system.primaryAbilities.${abilityId}.number`]: currentValue + 1,
            [`system.primaryAbilities.${abilityId}.rank`]: this.getRankFromValue(currentValue + 1),
            "system.karmaTracking.advancementFund": this.system.karmaTracking.advancementFund - karmaCost
        });

        // Create chat message
        const messageContent = `
            <div class="marvel-advancement">
                <h3>${this.name} - Ability Advancement</h3>
                <div class="advancement-details">
                    <div>Ability: ${abilityId.charAt(0).toUpperCase() + abilityId.slice(1)}</div>
                    <div>Old Value: ${currentValue}</div>
                    <div>New Value: ${currentValue + 1}</div>
                    <div>Karma Cost: ${karmaCost}</div>
                </div>
            </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });

        return true;
    }

    // _getAbilityAdvancementCost method
    /**
     * Calculate karma cost for advancing an ability
     * @param {number} currentValue - Current ability value
     * @returns {number} Karma cost for next rank
     * @private
     */
    _getAbilityAdvancementCost(currentValue) {
        // Base cost is 10 times current rank number
        const baseCost = currentValue * 10;
        
        // Check if we're cresting to next rank level
        const nextValue = currentValue + 1;
        const currentRank = this.getRankFromValue(currentValue);
        const nextRank = this.getRankFromValue(nextValue);
        
        // If ranks are different, we're cresting and need to add 400
        if (currentRank !== nextRank) {
            return baseCost + 400; // Cresting costs additional 400
        }
        
        return baseCost;
    }

    /**
     * Calculate karma cost for advancing a power
     * @param {string} currentRank - Current power rank
     * @param {number} currentValue - Current rank number
     * @returns {number} Karma cost
     * @private
     */
    _getPowerAdvancementCost(currentRank, currentValue) {
        // Base cost is 20 times rank number
        const baseCost = currentValue * 20;
        
        // If cresting to next rank, add 500
        const nextValue = currentValue + 1;
        const nextRank = this.getRankFromValue(nextValue);
        
        if (currentRank !== nextRank) {
            return baseCost + 500; // Cresting costs additional 500
        }
        
        return baseCost;
    }

    /**
     * Calculate karma cost for new power
     * @param {number} startingRankNumber - Starting rank number for new power
     * @param {boolean} isRobot - Whether character is robotic
     * @returns {number} Karma cost
     * @private
     */
    _getNewPowerCost(startingRankNumber, isRobot = false) {
        const multiplier = isRobot ? 10 : 40;
        return 3000 + (startingRankNumber * multiplier);
    }

    /**
     * Calculate karma cost for new talent
     * @param {boolean} isNPC - Whether learning from NPC
     * @returns {number} Karma cost
     * @private
     */
    _getNewTalentCost(isNPC = true) {
        return isNPC ? 1000 : 2000;
    }

    /**
     * Calculate karma cost for new contact
     * @param {number} contactResourceRank - Resource rank of contact
     * @returns {number} Karma cost
     * @private
     */
    _getNewContactCost(contactResourceRank) {
        return 500 + (contactResourceRank * 10);
    }
    /**
     * Get the next rank in the progression
     * @param {string} currentRank - Current rank
     * @returns {string|null} Next rank or null if at maximum
     * @private
     */
    _getNextRank(currentRank) {
        const ranks = Object.keys(CONFIG.marvel.ranks);
        const currentIndex = ranks.indexOf(currentRank);
        return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
    }

    /**
     * Join a karma group pool
     * @param {Object} options - Pool options
     * @returns {Promise<boolean>} Success/failure of joining
     */
    async joinKarmaPool(options = {}) {
        console.log("Joining karma pool with options:", options);
        
        const contribution = Math.min(options.contribution || 0, this.system.karmaTracking.karmaPool);
        
        // Get or create pool
        let pool = await game.settings.get("marvel-faserip", `karmaPools.${options.poolId}`);
        if (!pool) {
            pool = {
                id: options.poolId || randomID(16),
                total: 0,
                members: [],
                isPermanent: options.isPermanent || false,
                isLocked: options.isLocked || false,
                contributions: {}
            };
        }

        // Add member to pool
        if (!pool.members.includes(this.id)) {
            pool.members.push(this.id);
            pool.total += contribution;
            pool.contributions[this.id] = contribution;

            // Update actor's karma tracking
            await this.update({
                "system.karmaTracking.karmaPool": this.system.karmaTracking.karmaPool - contribution,
                "system.karmaTracking.groupPool": {
                    active: true,
                    contributed: contribution,
                    poolId: pool.id,
                    isPermanent: pool.isPermanent,
                    isLocked: pool.isLocked
                }
            });

            // Save pool
            await game.settings.set("marvel-faserip", `karmaPools.${pool.id}`, pool);
            return true;
        }
        return false;
    }

/**
 * Leave current karma pool
 * @returns {Promise<boolean>} Success/failure of leaving
 */
async leaveKarmaPool() {
    console.log("Attempting to leave karma pool");
    
    const poolId = this.system.karmaTracking.groupPool.poolId;
    if (!poolId) return false;

    const pool = await game.settings.get("marvel-faserip", `karmaPools.${poolId}`);
    if (!pool) return false;

    // Calculate share
    const share = Math.floor(pool.total / pool.members.length);
    
    // Remove from pool
    pool.members = pool.members.filter(id => id !== this.id);
    pool.total -= share;
    delete pool.contributions[this.id];

    // Update actor
    await this.update({
        "system.karmaTracking.karmaPool": this.system.karmaTracking.karmaPool + share,
        "system.karmaTracking.groupPool": {
            active: false,
            contributed: 0,
            poolId: null,
            isPermanent: false,
            isLocked: false
        }
    });

    // Save or delete pool if empty
    if (pool.members.length === 0) {
        await game.settings.delete("marvel-faserip", `karmaPools.${poolId}`);
    } else {
        await game.settings.set("marvel-faserip", `karmaPools.${poolId}`, pool);
    }

    return true;
}

/**
 * Use karma from group pool
 * @param {number} amount - Amount of karma to use
 * @param {string} reason - Reason for using karma
 * @returns {Promise<boolean>} Success/failure of using karma
 */
async useGroupKarma(amount, reason) {
    console.log(`Attempting to use ${amount} karma from group pool for: ${reason}`);
    
    const poolId = this.system.karmaTracking.groupPool.poolId;
    if (!poolId) return false;

    const pool = await game.settings.get("marvel-faserip", `karmaPools.${poolId}`);
    if (!pool) return false;

    // Check if pool is locked and this is for advancement
    if (pool.isLocked && reason === "advancement") {
        ui.notifications.error("Cannot use locked pool karma for advancement");
        return false;
    }

    // Check if enough karma
    if (pool.total < amount) {
        ui.notifications.error("Not enough karma in group pool");
        return false;
    }

    // Use karma
    pool.total -= amount;
    await game.settings.set("marvel-faserip", `karmaPools.${poolId}`, pool);

    return true;
}
}
