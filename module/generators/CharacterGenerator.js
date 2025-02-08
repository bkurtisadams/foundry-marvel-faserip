// module/generators/CharacterGenerator.js

export class MarvelCharacterGenerator {
    static RANDOM_RANKS_TABLE = {
        1: { // Mutants, Altered Humans
            ranges: [
                { max: 5, rank: "Feeble", number: 1 },
                { max: 10, rank: "Poor", number: 3 },
                { max: 20, rank: "Typical", number: 5 },
                { max: 40, rank: "Good", number: 8 },
                { max: 60, rank: "Excellent", number: 16 },
                { max: 80, rank: "Remarkable", number: 26 },
                { max: 96, rank: "Incredible", number: 36 },
                { max: 100, rank: "Amazing", number: 46 }
            ]
        },
        3: { // High Technology
            ranges: [
                { max: 5, rank: "Feeble", number: 1 },
                { max: 10, rank: "Poor", number: 3 },
                { max: 40, rank: "Typical", number: 5 },
                { max: 80, rank: "Good", number: 8 },
                { max: 95, rank: "Excellent", number: 16 },
                { max: 100, rank: "Remarkable", number: 26 }
            ]
        },
        4: { // Robots
            ranges: [
                { max: 5, rank: "Feeble", number: 1 },
                { max: 10, rank: "Poor", number: 3 },
                { max: 15, rank: "Typical", number: 5 },
                { max: 40, rank: "Good", number: 8 },
                { max: 50, rank: "Excellent", number: 16 },
                { max: 70, rank: "Remarkable", number: 26 },
                { max: 90, rank: "Incredible", number: 36 },
                { max: 98, rank: "Amazing", number: 46 },
                { max: 100, rank: "Monstrous", number: 63 }
            ]
        },
        5: { // Aliens
            ranges: [
                { max: 10, rank: "Feeble", number: 1 },
                { max: 20, rank: "Poor", number: 3 },
                { max: 30, rank: "Typical", number: 5 },
                { max: 40, rank: "Good", number: 8 },
                { max: 60, rank: "Excellent", number: 16 },
                { max: 70, rank: "Remarkable", number: 26 },
                { max: 80, rank: "Incredible", number: 36 },
                { max: 95, rank: "Amazing", number: 46 },
                { max: 100, rank: "Monstrous", number: 63 }
            ]
        }
    };
    static rollOrigin() {
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= 30) return "Altered Human";
        if (roll <= 60) return "Mutant";
        if (roll <= 90) return "High Technology";
        if (roll <= 95) return "Robot";
        return "Alien";
    }

    static rollRank(column) {
        const roll = Math.floor(Math.random() * 100) + 1;
        const ranges = this.RANDOM_RANKS_TABLE[column].ranges;
        return ranges.find(range => roll <= range.max)?.rank || ranges[ranges.length - 1].rank;
    }

    static generatePrimaryAbilities(origin) {
        const columnMap = {
            "Altered Human": 1,
            "Mutant": 1,
            "High Technology": 3,
            "Robot": 4,
            "Alien": 5
        };

        const column = columnMap[origin];
        const abilities = {};

        ["fighting", "agility", "strength", "endurance", "reason", "intuition", "psyche"].forEach(ability => {
            const roll = Math.floor(Math.random() * 100) + 1;
            const initialRank = this.rollRank(column);
            abilities[ability] = {
                initialRoll: roll,
                initialRank: initialRank,
                rank: initialRank,  // Set current rank same as initial
                number: CONFIG.marvel.ranks[initialRank]?.standard || 0
            };
        });

        // Apply origin-specific modifications
        switch(origin) {
            case "Altered Human":
                // Allow raising one ability by one rank (implementation would need UI)
                break;
            case "Mutant":
                const enduranceRank = abilities.endurance.initialRank;
                const ranks = Object.keys(CONFIG.marvel.ranks);
                const currentIndex = ranks.indexOf(enduranceRank);
                if (currentIndex < ranks.length - 1) {
                    abilities.endurance.initialRank = ranks[currentIndex + 1];
                    abilities.endurance.number = CONFIG.marvel.ranks[ranks[currentIndex + 1]]?.standard || 0;
                }
                break;
            case "High Technology":
                const reasonRank = abilities.reason.initialRank;
                const reasonRanks = Object.keys(CONFIG.marvel.ranks);
                const reasonIndex = reasonRanks.indexOf(reasonRank);
                if (reasonIndex < reasonRanks.length - 2) {
                    abilities.reason.initialRank = reasonRanks[reasonIndex + 2];
                    abilities.reason.number = CONFIG.marvel.ranks[reasonRanks[reasonIndex + 2]]?.standard || 0;
                }
                break;
        }

        return abilities;
    }

    static calculateSecondaryAbilities(primaryAbilities, origin) {
        const health = primaryAbilities.fighting.number + 
                      primaryAbilities.agility.number + 
                      primaryAbilities.strength.number + 
                      primaryAbilities.endurance.number;

        const karma = primaryAbilities.reason.number + 
                     primaryAbilities.intuition.number + 
                     primaryAbilities.psyche.number;

        let resources = { rank: "Typical", number: CONFIG.marvel.ranks["Typical"].standard };
        if (origin === "High Technology") {
            resources = { rank: "Good", number: CONFIG.marvel.ranks["Good"].standard };
        } else if (origin === "Alien") {
            resources = { rank: "Poor", number: CONFIG.marvel.ranks["Poor"].standard };
        }

        let popularity = {
            hero: 10,
            secret: 10
        };

        if (origin === "Mutant" || origin === "Robot") {
            popularity.hero = 0;
            popularity.secret = 0;
        }

        return {
            health: { value: health, max: health },
            karma: { value: karma, max: karma },
            resources: resources,
            popularity: popularity
        };
    }

    static async generateCharacter(data = {}) {
        const origin = data.origin || this.rollOrigin();
        const primaryAbilities = this.generatePrimaryAbilities(origin);
        const secondaryAbilities = this.calculateSecondaryAbilities(primaryAbilities, origin);

        return {
            name: "New Generated Character",
            type: "hero",
            system: {
                biography: {
                    playerName: "",
                    heroName: "",
                    realName: "",
                    identity: "secret",
                    groupAffiliation: "",
                    baseOfOperations: "",
                    age: "",
                    origin: origin
                },
                primaryAbilities: primaryAbilities,
                secondaryAbilities: secondaryAbilities,
                powers: { list: [] },
                stunts: { list: [] },
                talents: { list: [] },
                contacts: { list: [] },
                karmaTracking: {
                    karmaPool: secondaryAbilities.karma.value,
                    advancementFund: 0,
                    history: []
                }
            }
        };
    }
}
