export class MarvelActor extends Actor {
    /** @override */
    prepareData() {
        super.prepareData();

        const actorData = this;
        const data = actorData.system;

        // Make separate methods for each of these preparation steps
        this._calculateHealth(data);
        this._calculateKarma(data);
    }

    /**
     * Calculate Health from primary abilities
     * @param {Object} data The actor's data object
     * @private
     */
    _calculateHealth(data) {
        if (data.primaryAbilities) {
            const health = 
                data.primaryAbilities.fighting.number +
                data.primaryAbilities.agility.number +
                data.primaryAbilities.strength.number +
                data.primaryAbilities.endurance.number;
            
            data.secondaryAbilities.health.max = health;
            if (!data.secondaryAbilities.health.value) {
                data.secondaryAbilities.health.value = health;
            }
        }
    }

    /**
     * Calculate Karma from mental abilities
     * @param {Object} data The actor's data object
     * @private
     */
    _calculateKarma(data) {
        if (data.primaryAbilities) {
            const karma = 
                data.primaryAbilities.reason.number +
                data.primaryAbilities.intuition.number +
                data.primaryAbilities.psyche.number;
            
            data.secondaryAbilities.karma.max = karma;
            if (!data.secondaryAbilities.karma.value) {
                data.secondaryAbilities.karma.value = karma;
            }
        }
    }

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

    applyColumnShift(rank, shift) {
        const ranks = [
            "Shift 0", "Feeble", "Poor", "Typical", "Good", "Excellent", 
            "Remarkable", "Incredible", "Amazing", "Monstrous", 
            "Unearthly", "Shift X", "Shift Y", "Shift Z", 
            "Class 1000", "Class 3000", "Class 5000", "Beyond"
        ];
        
        const currentIndex = ranks.indexOf(rank);
        const newIndex = Math.min(Math.max(currentIndex + shift, 0), ranks.length - 1);
        return ranks[newIndex];
    }

    getColorResult(rollTotal, rank) {
        const ranges = CONFIG.marvel.universalTableRanges[rank];
        let color = "white"; // default

        for (const [c, [min, max]] of Object.entries(ranges)) {
            if (rollTotal >= min && rollTotal <= max) {
                color = c;
                break;
            }
        }

        return color;
    }

/**
     * Roll an ability check
     * @param {string} abilityId The ability ID (e.g., "fighting")
     * @param {Object} options Roll options with actionType, columnShift, and karmaPoints
     */
async rollAbility(abilityId, options = {}) {
    const ability = this.system.primaryAbilities[abilityId];
    const baseRank = this.getRankFromValue(ability.number);
    const shiftedRank = this.applyColumnShift(baseRank, options.columnShift || 0);
    
    // Roll the dice and add karma
    const roll = await new Roll("1d100").evaluate();
    const finalRoll = Math.min(100, roll.total + (options.karmaPoints || 0));
    
    // Get the color result and outcome
    const color = this.getColorResult(finalRoll, shiftedRank);
    
    let resultText;
    if (options.featType === "combat" && options.actionType) {
        resultText = CONFIG.marvel.actionResults[options.actionType].results[color];
    } else {
        resultText = color.toUpperCase();
    }

    // Format the ability name properly
    const formattedAbility = abilityId.charAt(0).toUpperCase() + abilityId.slice(1);
    
    // Create chat message content
    const messageContent = `
        <div class="marvel-roll">
            <h3>${this.name} - ${options.featType === "combat" ? CONFIG.marvel.actionResults[options.actionType].name : formattedAbility + " FEAT"}</h3>
            ${formattedAbility}: ${ability.number} (${baseRank})<br>
            Column Shift: ${options.columnShift || 0} → ${shiftedRank}<br>
            Roll: ${roll.total}${options.karmaPoints ? ` + ${options.karmaPoints} = ${finalRoll}` : ''}<br>
            <div style="text-align: center; font-weight: bold; padding: 5px; margin-top: 5px; background-color: ${color};">
                ${resultText}
            </div>
        </div>`;
    
    // Create the chat message
    const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: messageContent,
        rolls: [roll],
        sound: CONFIG.sounds.dice
    };

    await ChatMessage.create(messageData);
    return roll;
}
async rollPopularityFeat(popularityType, options = {}) {
    const popularity = this.system.secondaryAbilities.popularity[popularityType];
    const isNegative = popularity < 0;
    const absolutePopularity = Math.abs(popularity);
    let baseRank = this.getRankFromValue(absolutePopularity);
    
    // Calculate total column shift
    let totalShift = 0;
    
    // If not negative popularity, apply disposition modifiers
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
                // Impossible FEAT
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    content: `<div class="marvel-roll">
                        <h2>Popularity FEAT - IMPOSSIBLE</h2>
                        <p>Hostile targets will not cooperate under normal circumstances.</p>
                    </div>`
                });
                return;
        }
    }
    
    // Add circumstance modifiers
    if (options.modifiers) {
        totalShift += Object.values(options.modifiers).reduce((a, b) => a + b, 0);
    }
    
    // Add any additional shift
    if (options.additionalShift) {
        totalShift += options.additionalShift;
    }
    
    // Apply total shift to get final rank
    const shiftedRank = this.applyColumnShift(baseRank, totalShift);
    
    // Roll the dice and add karma
    const roll = await new Roll("1d100").evaluate();
    const finalRoll = Math.min(100, roll.total + (options.karmaPoints || 0));
    
    // Get the color result
    const color = this.getColorResult(finalRoll, shiftedRank);
    
    // Determine success/failure based on color and requirements
    let success = false;
    if (isNegative) {
        // Negative popularity always needs yellow
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
            <h2 style="color: #782e22; border-bottom: 2px solid #782e22; margin-bottom: 10px; padding-bottom: 3px;">
                ${this.name} - ${popularityType.charAt(0).toUpperCase() + popularityType.slice(1)} Popularity FEAT
            </h2>
            <div class="roll-details" style="line-height: 1.4;">
                <div style="margin-bottom: 5px;">Popularity: ${popularity} (${baseRank})</div>
                <div style="margin-bottom: 5px;">Total Column Shift: ${totalShift} → ${shiftedRank}</div>
                <div style="margin-bottom: 5px;">Disposition: ${options.disposition || "N/A"}</div>
                <div style="margin-bottom: 10px;">Roll: ${roll.total}${options.karmaPoints ? ` + Karma: ${options.karmaPoints} = ${finalRoll}` : ''}</div>
            </div>
            <div style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; background-color: ${color}; color: ${color === 'white' || color === 'yellow' ? 'black' : 'white'};">
                ${success ? "SUCCESS" : "FAILURE"}
            </div>
        </div>`;
    
    // Create the chat message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: messageContent,
        rolls: [roll],
        sound: CONFIG.sounds.dice
    });
    
    return roll;
}
}