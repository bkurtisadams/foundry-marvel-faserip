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
        const action = CONFIG.marvel.actionResults[options.actionType];
        resultText = action.results[color];
    } else {
        resultText = color.toUpperCase();
    }

    // Format the ability name properly
    const formattedAbility = abilityId.charAt(0).toUpperCase() + abilityId.slice(1);
    
    // Create chat message content
    const messageContent = `
        <div class="marvel-roll">
            <h2 style="color: #782e22; border-bottom: 2px solid #782e22; margin-bottom: 10px; padding-bottom: 3px;">
                ${this.name} - ${options.featType === "combat" ? CONFIG.marvel.actionResults[options.actionType].name : formattedAbility + " FEAT"}
            </h2>
            <div class="roll-details" style="line-height: 1.4;">
                <div style="margin-bottom: 5px;">${formattedAbility}: ${ability.number} (${baseRank})</div>
                <div style="margin-bottom: 5px;">Column Shift: ${options.columnShift || 0} → ${shiftedRank}</div>
                <div style="margin-bottom: 10px;">Roll: ${roll.total}${options.karmaPoints ? ` + Karma: ${options.karmaPoints} = ${finalRoll}` : ''}</div>
            </div>
            <div style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; background-color: ${color}; color: ${color === 'white' || color === 'yellow' ? 'black' : 'white'};">
                ${resultText}
            </div>
        </div>`;
    
    // Create the chat message
    const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `${this.name} ${formattedAbility} ${options.featType === "combat" ? CONFIG.marvel.actionResults[options.actionType].name : "FEAT"} Check`,
        content: messageContent,
        rolls: [roll],
        sound: CONFIG.sounds.dice
    };

    await ChatMessage.create(messageData);
    return roll;
}
}