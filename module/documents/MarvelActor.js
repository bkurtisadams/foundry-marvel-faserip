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

        // Calculate derived values
        this._calculateHealth();
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

        if (!this.system.resistances) {
            this.system.resistances = {
                list: []
            };
        }

        if (!this.system.karmaTracking) {
            this.system.karmaTracking = {
                karmaPool: 0,
                advancementFund: 0,
                history: [],
                lifetimeTotal: 0,
                adventurePool: {
                    active: false,
                    contributed: 0,
                    poolId: null
                },
                permanentPool: {
                    active: false,
                    contributed: 0,
                    poolId: null
                }
            };
        }
    }

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
     * Calculate Health from primary abilities
     * @private
     */
    _calculateHealth() {
        if (!this.system.primaryAbilities) return;

        const health = Number(this.system.primaryAbilities.fighting.number || 0) +
                      Number(this.system.primaryAbilities.agility.number || 0) +
                      Number(this.system.primaryAbilities.strength.number || 0) +
                      Number(this.system.primaryAbilities.endurance.number || 0);
        
        // Update maximum health
        this.system.secondaryAbilities.health.max = health;
        
        // Initialize current health if not set
        if (!this.system.secondaryAbilities.health.value) {
            this.system.secondaryAbilities.health.value = health;
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
        
        // Update maximum karma
        this.system.secondaryAbilities.karma.max = karma;
        
        // Initialize current karma if not set
        if (!this.system.secondaryAbilities.karma.value) {
            this.system.secondaryAbilities.karma.value = karma;
        }
    }

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
            const roll = await new Roll("1d100").evaluate({async: true});
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
                <div class="marvel-roll">
                    <h3>${this.name} - ${options.featType === "combat" ? 
                        CONFIG.marvel.actionResults[options.actionType]?.name || "Combat" : 
                        formattedAbility + " FEAT"}</h3>
                    <div class="roll-details">
                        <div>${formattedAbility}: ${ability.number} (${baseRank})</div>
                        ${options.columnShift ? 
                            `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                        <div>Roll: ${roll.total}${karmaPoints ? 
                            ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                    </div>
                    <div class="roll-result ${this._getColorClass(color)}">
                        ${resultText}
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
        const roll = new Roll("1d100").evaluateSync();
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
    
    // roll attack method 
    /* async rollAttack(ability, attackType, options = {}) {
        console.log("Rolling attack with:", { ability, attackType, options });
        
        // Get the ability data
        const abilityData = this.system.primaryAbilities[ability.toLowerCase()];
        if (!abilityData) {
            console.error(`Ability ${ability} not found`);
            throw new Error(`Ability ${ability} not found`);
        }
    
        // Get base rank and apply column shift
        const baseRank = abilityData.rank || this.getRankFromValue(abilityData.number);
        const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
    
        // Roll the dice
        const roll = await new Roll("1d100").evaluate();
        const total = roll.total;
    
        console.log("Attack roll result:", { 
            total, 
            baseRank, 
            shiftedRank,
            abilityData 
        });
    
        // Get the color result
        const color = this.getColorResult(total, shiftedRank);
    
        // Create chat message
        const messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - ${attackType} Attack</h3>
                <div class="roll-details">
                    <div>${ability}: ${abilityData.number} (${baseRank})</div>
                    ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${total}</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    ${color.toUpperCase()}
                </div>
            </div>`;
    
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        });
    
        return { roll, color };
    } */

        async rollAttack(ability, attackType, options = {}) {
            try {
                const abilityData = this.system.primaryAbilities[ability.toLowerCase()];
                if (!abilityData) {
                    console.error(`Ability ${ability} not found`);
                    throw new Error(`Ability ${ability} not found`);
                }
            
                // Get base rank and apply column shift
                const baseRank = abilityData.rank || this.getRankFromValue(abilityData.number);
                const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
            
                // Roll the dice
                const roll = await new Roll("1d100").evaluate({async: true});
                const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
                const total = Math.min(100, roll.total + karmaPoints);

                console.log("Attack roll result:", { 
                    total, 
                    baseRank, 
                    shiftedRank,
                    abilityData 
                });
        
                // Handle karma deduction if karma was spent
                if (karmaPoints > 0) {
                    // Update karma pool
                    const currentKarma = this.system.karmaTracking.karmaPool;
                    const currentHistory = this.system.karmaTracking.history || [];
                    
                    // Create new karma history entry
                    const newEntry = {
                        date: new Date().toLocaleString(),
                        amount: -karmaPoints,
                        description: `Spent on ${ability.toUpperCase()} Attack roll`
                    };
        
                    // Update actor with new karma values and history
                    await this.update({
                        "system.karmaTracking.karmaPool": currentKarma - karmaPoints,
                        "system.karmaTracking.history": [...currentHistory, newEntry]
                    });
                }
            
                // Get the color result
                const color = this.getColorResult(total, shiftedRank);
            
                // Create chat message
                const messageContent = `
                    <div class="marvel-roll">
                        <h3>${this.name} - ${attackType} Attack</h3>
                        <div class="roll-details">
                            <div>${ability}: ${abilityData.number} (${baseRank})</div>
                            ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                            <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${total}` : ''}</div>
                            ${options.weaponDamage ? `<div>Weapon Damage: ${options.weaponDamage}</div>` : ''}
                            ${options.range ? `<div>Range: ${options.range} areas</div>` : ''}
                        </div>
                        <div class="roll-result ${this._getColorClass(color)}">
                            ${color.toUpperCase()}
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
    async handleAttack(ability, attackType, options = {}, target) {
        if (!target) {
            ui.notifications.error("No target selected");
            return null;
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
    }

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
        const enduranceRoll = new Roll("1d100").evaluateSync();
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
        const resourceRank = this.system.secondaryAbilities.resources.rank;
        
        // Create base message content
        let messageContent = `
            <div class="marvel-roll">
                <h3>${this.name} - Resource FEAT</h3>
                <div class="roll-details">
                    <div>Resource Rank: ${resourceRank}</div>
                    <div>Item Rank: ${itemRank}</div>
        `;

        // Check if attempt is allowed
        const canAttempt = await this._canAttemptResourceFeat(itemRank);
        if (!canAttempt.allowed) {
            messageContent += `
                <div class="resource-failure">${canAttempt.message}</div>
            </div>`;
            
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });
            return null;
        }

        // Get difficulty assessment
        const difficulty = this._getResourceFeatDifficulty(resourceRank, itemRank);
        
        if (!difficulty.allowed) {
            messageContent += `
                <div class="resource-failure">${difficulty.message}</div>
            </div>`;
            
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });
            return null;
        }

        // Handle automatic success
        if (difficulty.automatic) {
            messageContent += `
                <div class="success">${difficulty.message}</div>
            </div>`;
            
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageContent
            });

            // Record successful attempt
            await this.setFlag("marvel-faserip", "lastResourceAttempt", {
                timestamp: Date.now(),
                rank: itemRank,
                date: new Date().toISOString()
            });

            return null;
        }
     
        // Previous method content remains the same until the automatic success check...

        // Apply column shifts and roll
        const shiftedRank = this.applyColumnShift(resourceRank, options.columnShift || 0);
        const roll = await new Roll("1d100").evaluate({async: true});
        const karmaPoints = Math.min(options.karmaPoints || 0, this.system.secondaryAbilities.karma.value);
        const finalRoll = Math.min(100, roll.total + karmaPoints);
        
        // Deduct karma if used
        if (karmaPoints > 0) {
            await this.update({
                "system.secondaryAbilities.karma.value": this.system.secondaryAbilities.karma.value - karmaPoints
            });
        }

        // Get color result and determine success
        const color = this.getColorResult(finalRoll, shiftedRank);
        const colors = ["white", "green", "yellow", "red"];
        const requiredColorIndex = colors.indexOf(difficulty.color);
        const resultColorIndex = colors.indexOf(color);
        const success = resultColorIndex >= requiredColorIndex;

        // Record attempt
        await this.setFlag("marvel-faserip", "lastResourceAttempt", {
            timestamp: Date.now(),
            rank: itemRank,
            date: new Date().toISOString()
        });

        // Handle failure
        if (!success) {
            const failureData = {
                timestamp: Date.now(),
                rank: itemRank,
                date: new Date().toISOString()
            };

            await this.setFlag("marvel-faserip", "lastResourceFailure", failureData);

            const nextAttemptDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
            messageContent += `
                <div class="roll-details">
                    ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    FAILURE
                </div>
                <div class="resource-failure">
                    <div>Resource FEAT failed. Cannot attempt same or higher rank for 7 days.</div>
                    <div>Next attempt available: ${nextAttemptDate.toLocaleString()}</div>
                </div>
            </div>`;
        } else {
            messageContent += `
                <div class="roll-details">
                    ${options.columnShift ? `<div>Column Shift: ${options.columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${finalRoll}` : ''}</div>
                </div>
                <div class="roll-result ${this._getColorClass(color)}">
                    SUCCESS
                </div>
            </div>`;
        }

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
        const roll = await new Roll("1d100").evaluate({async: true});
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
        
        const currentHealth = this.system.secondaryAbilities.health.value;
        console.log(`Current health: ${currentHealth}`);
        
        const newHealth = Math.max(0, currentHealth - damage);
        console.log(`New health will be: ${newHealth}`);

        // Update health value using the correct data path
        await this.update({
            "system.secondaryAbilities.health.value": newHealth
        });

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

        // Check for endurance FEAT if health drops to 0
        if (newHealth === 0) {
            await this.rollEnduranceFeat({ type: "death" });
        }

        return newHealth;
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
        const roll = new Roll("1d100").evaluateSync();
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
                    flags: { core: { statusId: deadId } }
                }]);
            } else {
                // Add unconscious effect if not already present
                const unconscious = effects.find(e => e.flags?.core?.statusId === unconsciousId);
                if (!unconscious) {
                    await this.createEmbeddedDocuments("ActiveEffect", [{
                        label: "Unconscious",
                        icon: "icons/svg/unconscious.svg",
                        flags: { core: { statusId: unconsciousId } }
                    }]);
                }
            }
        } else {
            // Handle consciousness check
            if (!success) {
                await this.createEmbeddedDocuments("ActiveEffect", [{
                    label: "Unconscious",
                    icon: "icons/svg/unconscious.svg",
                    flags: { core: { statusId: unconsciousId } }
                }]);
            }
        }
    }

    /**
     * Handle healing
     * @param {number} amount - Amount of healing to apply
     * @returns {Promise} Promise that resolves when healing is applied
     */
    async applyHealing(amount) {
        const currentHealth = this.system.secondaryAbilities.health.value;
        const maxHealth = this.system.secondaryAbilities.health.max;
        const newHealth = Math.min(maxHealth, currentHealth + amount);

        // Update health value
        await this.update({
            "system.secondaryAbilities.health.value": newHealth
        });

        // Create chat message for healing
        const messageContent = `
            <div class="marvel-healing">
                <h3>${this.name} heals ${amount} health</h3>
                <div class="health-track">
                    Health: ${currentHealth} → ${newHealth}
                </div>
            </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });

        return newHealth;
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
        const roll = await new Roll("1d100").evaluate({async: true});
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
     * Add karma points to the actor
     * @param {number} amount - Amount of karma to add
     * @param {string} reason - Reason for karma award
     * @returns {Promise} Promise that resolves when karma is added
     */
    async addKarma(amount, reason) {
        if (!amount || isNaN(amount)) {
            throw new Error("Invalid karma amount");
        }

        const currentPool = this.system.karmaTracking.karmaPool || 0;
        const newEntry = {
            date: new Date().toISOString(),
            amount: amount,
            reason: reason || "Unspecified",
            type: amount >= 0 ? "award" : "deduction"
        };

        // Get current history and add new entry
        const history = this.system.karmaTracking.history || [];
        history.push(newEntry);

        // Keep only the last 50 entries
        while (history.length > 50) {
            history.shift();
        }

        // Update karma pool and history
        await this.update({
            "system.karmaTracking.karmaPool": currentPool + amount,
            "system.karmaTracking.history": history
        });

        // Create chat message
        const messageContent = `
            <div class="marvel-karma-update">
                <h3>${this.name} - Karma ${amount >= 0 ? 'Award' : 'Deduction'}</h3>
                <div class="karma-details">
                    <div>Amount: ${amount >= 0 ? '+' : ''}${amount}</div>
                    <div>Reason: ${reason || "Unspecified"}</div>
                    <div>New Karma Pool: ${currentPool + amount}</div>
                </div>
            </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });

        return currentPool + amount;
    }

    /**
     * Transfer karma between pool and advancement fund
     * @param {number} amount - Amount to transfer (positive: pool to fund, negative: fund to pool)
     * @returns {Promise} Promise that resolves when transfer is complete
     */
    async transferKarma(amount) {
        if (!amount || isNaN(amount)) {
            throw new Error("Invalid karma transfer amount");
        }

        const currentPool = this.system.karmaTracking.karmaPool || 0;
        const currentFund = this.system.karmaTracking.advancementFund || 0;

        // Check if transfer is possible
        if (amount > 0 && amount > currentPool) {
            ui.notifications.error("Not enough karma in pool for transfer");
            return false;
        }
        if (amount < 0 && Math.abs(amount) > currentFund) {
            ui.notifications.error("Not enough karma in advancement fund for transfer");
            return false;
        }

        // Perform transfer
        await this.update({
            "system.karmaTracking.karmaPool": currentPool - amount,
            "system.karmaTracking.advancementFund": currentFund + amount
        });

        // Create chat message
        const messageContent = `
            <div class="marvel-karma-transfer">
                <h3>${this.name} - Karma Transfer</h3>
                <div class="transfer-details">
                    <div>Amount: ${amount}</div>
                    <div>Direction: ${amount > 0 ? 'Pool → Fund' : 'Fund → Pool'}</div>
                    <div>New Pool Total: ${currentPool - amount}</div>
                    <div>New Fund Total: ${currentFund + amount}</div>
                </div>
            </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });

        return true;
    }

    /**
     * Get karma history with optional filtering
     * @param {Object} options - Filter options
     * @returns {Array} Filtered karma history
     */
    getKarmaHistory(options = {}) {
        const history = this.system.karmaTracking.history || [];
        let filtered = [...history];

        // Apply filters
        if (options.type) {
            filtered = filtered.filter(entry => entry.type === options.type);
        }
        if (options.startDate) {
            const start = new Date(options.startDate);
            filtered = filtered.filter(entry => new Date(entry.date) >= start);
        }
        if (options.endDate) {
            const end = new Date(options.endDate);
            filtered = filtered.filter(entry => new Date(entry.date) <= end);
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filtered;
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

    /**
     * Calculate karma cost for advancing an ability
     * @param {number} currentValue - Current ability value
     * @returns {number} Karma cost
     * @private
     */
    _getAbilityAdvancementCost(currentValue) {
        // Based on FASERIP advancement rules
        if (currentValue < 10) return 50;
        if (currentValue < 20) return 75;
        if (currentValue < 30) return 100;
        if (currentValue < 40) return 150;
        if (currentValue < 50) return 200;
        return 300;
    }

    /**
     * Advance a power's rank using karma
     * @param {number} powerIndex - Index of the power to advance
     * @returns {Promise<boolean>} Success of the advancement
     */
    async advancePower(powerIndex) {
        const power = this.system.powers.list[powerIndex];
        if (!power) {
            throw new Error(`Power at index ${powerIndex} not found`);
        }

        // Calculate karma cost for power advancement
        const currentRank = power.rank;
        const karmaCost = this._getPowerAdvancementCost(currentRank);
        
        // Check if we have enough karma
        if (this.system.karmaTracking.advancementFund < karmaCost) {
            ui.notifications.error(`Not enough karma (${karmaCost} required) to advance power`);
            return false;
        }

        // Get next rank
        const nextRank = this._getNextRank(currentRank);
        if (!nextRank) {
            ui.notifications.error("Power cannot be advanced further");
            return false;
        }

        // Update power list with new rank
        const powers = duplicate(this.system.powers.list);
        powers[powerIndex].rank = nextRank;
        powers[powerIndex].rankNumber = CONFIG.marvel.ranks[nextRank].standard;

        // Update power and deduct karma
        await this.update({
            "system.powers.list": powers,
            "system.karmaTracking.advancementFund": this.system.karmaTracking.advancementFund - karmaCost
        });

        // Create chat message
        const messageContent = `
            <div class="marvel-advancement">
                <h3>${this.name} - Power Advancement</h3>
                <div class="advancement-details">
                    <div>Power: ${power.name}</div>
                    <div>Old Rank: ${currentRank}</div>
                    <div>New Rank: ${nextRank}</div>
                    <div>Karma Cost: ${karmaCost}</div>
                </div>
            </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        });

        return true;
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
     * Calculate karma cost for advancing a power
     * @param {string} currentRank - Current power rank
     * @returns {number} Karma cost
     * @private
     */
    _getPowerAdvancementCost(currentRank) {
        const costs = {
            "Feeble": 100,
            "Poor": 150,
            "Typical": 200,
            "Good": 300,
            "Excellent": 400,
            "Remarkable": 600,
            "Incredible": 800,
            "Amazing": 1000,
            "Monstrous": 1500,
            "Unearthly": 2000
        };
        return costs[currentRank] || 3000;
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
