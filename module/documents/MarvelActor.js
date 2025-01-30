export class MarvelActor extends Actor {
    /** @override */
    prepareData() {
        super.prepareData();

        const actorData = this;
        const data = actorData.system;  // For v10 compatibility

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

    /** 
     * Get the numeric value for a rank
     * @param {string} rank The rank name
     * @returns {number} The standard rank number
     */
    getRankNumber(rank) {
        const rankDefinitions = {
            'Shift 0': { range: [0, 0], standard: 0 },
            'Feeble': { range: [1, 2], standard: 2 },
            'Poor': { range: [3, 4], standard: 4 },
            'Typical': { range: [5, 7], standard: 6 },
            'Good': { range: [8, 15], standard: 10 },
            'Excellent': { range: [16, 25], standard: 20 },
            'Remarkable': { range: [26, 35], standard: 30 },
            'Incredible': { range: [36, 45], standard: 40 },
            'Amazing': { range: [46, 62], standard: 50 },
            'Monstrous': { range: [63, 87], standard: 75 },
            'Unearthly': { range: [88, 125], standard: 100 },
            'Shift X': { range: [126, 175], standard: 150 },
            'Shift Y': { range: [176, 350], standard: 200 },
            'Shift Z': { range: [351, 999], standard: 500 },
            'Class 1000': { range: [1000, 1000], standard: 1000 },
            'Class 3000': { range: [3000, 3000], standard: 3000 },
            'Class 5000': { range: [5000, 5000], standard: 5000 },
            'Beyond': { range: [5001, Infinity], standard: Infinity }
        };
        return rankDefinitions[rank]?.standard || 0;
    }

    /**
     * Get the valid range for a rank
     * @param {string} rank The rank name
     * @returns {Array} The valid range [min, max]
     */
    getRankRange(rank) {
        const rankDefinitions = this.constructor.RANK_DEFINITIONS;
        return rankDefinitions[rank]?.range || [0, 0];
    }

    /**
     * Check if a number is within the valid range for a rank
     * @param {string} rank The rank name
     * @param {number} number The number to check
     * @returns {boolean} Whether the number is valid for the rank
     */
    isValidRankNumber(rank, number) {
        const range = this.getRankRange(rank);
        return number >= range[0] && number <= range[1];
    }

    /**
     * Roll an ability check
     * @param {string} abilityId The ability ID (e.g., "fighting")
     * @param {Object} options Roll options
     */
    async rollAbility(abilityId, options={}) {
        const ability = this.system.primaryAbilities[abilityId];
        const label = game.i18n.localize(`MARVEL.Ability${abilityId.charAt(0).toUpperCase() + abilityId.slice(1)}`);
        
        const rollData = {
            actor: this,
            ability: ability
        };

        const formula = "1d100";
        const roll = new Roll(formula, rollData);
        await roll.evaluate();

        // Create the chat message
        const messageData = {
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${label} Check (${ability.rank})`,
            roll: roll,
            content: `<h2>${label} Check</h2>
                     <p>Rank: ${ability.rank} (${ability.number})</p>
                     <p>Result: ${roll.total}</p>`
        };

        // Send to chat
        await ChatMessage.create(messageData);
        return roll;
    }
}