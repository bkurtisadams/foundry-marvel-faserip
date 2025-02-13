export const MARVEL_RANKS = {
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

export const UNIVERSAL_TABLE_RANGES = {
    "Shift 0":  { white: [1, 65], green: [66, 94], yellow: [95, 99], red: [100, 100]},
    "Feeble":   { white: [1, 60], green: [61, 90], yellow: [91, 99], red: [100, 100] },
    "Poor":     { white: [1, 55], green: [56, 80], yellow: [81, 97], red: [98, 100] },
    "Typical":  { white: [1, 50], green: [51, 80], yellow: [81, 97], red: [98, 100] },
    "Good":     { white: [1, 45], green: [46, 75], yellow: [76, 97], red: [98, 100] },
    "Excellent":{ white: [1, 40], green: [41, 70], yellow: [71, 94], red: [95, 100] },
    "Remarkable":{ white: [1, 35], green: [36, 65], yellow: [66, 94], red: [95, 100] },
    "Incredible":{ white: [1, 30], green: [31, 60], yellow: [61, 90], red: [91, 100] },
    "Amazing":   { white: [1, 25], green: [26, 55], yellow: [56, 90], red: [91, 100] },
    "Monstrous": { white: [1, 20], green: [21, 50], yellow: [51, 85], red: [86, 100] },
    "Unearthly": { white: [1, 15], green: [16, 45], yellow: [46, 85], red: [86, 100] },
    "Shift X":   { white: [1, 10], green: [11, 40], yellow: [41, 80], red: [81, 100] },
    "Shift Y":   { white: [1, 6], green: [7, 35], yellow: [36, 80], red: [81, 100] },
    "Shift Z":   { white: [1, 3], green: [4, 35], yellow: [36, 75], red: [76, 100] },
    "Class 1000":{ white: [1, 1], green: [2, 35], yellow: [36, 75], red: [76, 100] },
    "Class 3000":{ white: [1, 1], green: [2, 30], yellow: [31, 70], red: [71, 100] },
    "Class 5000":{ white: [1, 1], green: [2, 25], yellow: [26, 65], red: [66, 100] },
    "Beyond":    { white: [1, 1], green: [2, 20], yellow: [21, 60], red: [61, 100] }
};

export const ACTION_RESULTS = {
    "BA": { 
        name: "Blunt Attack",
        ability: "Fighting",
        results: { white: "Miss", green: "Hit", yellow: "Slam", red: "Stun" }
    },
    "EA": {
        name: "Edged Attack",
        ability: "Fighting",
        results: { white: "Miss", green: "Hit", yellow: "Stun", red: "Kill" }
    },
    "Sh": {
        name: "Shooting",
        ability: "Agility",
        results: { white: "Miss", green: "Hit", yellow: "Bullseye", red: "Kill" }
    },
    "TE": {
        name: "Throwing Edged",
        ability: "Agility",
        results: { white: "Miss", green: "Hit", yellow: "Stun", red: "Kill" }
    },
    "TB": {
        name: "Throwing Blunt",
        ability: "Agility",
        results: { white: "Miss", green: "Hit", yellow: "Hit", red: "Stun" }
    },
    "En": {
        name: "Energy",
        ability: "Agility",
        results: { white: "Miss", green: "Hit", yellow: "Bullseye", red: "Kill" }
    },
    "Fo": {
        name: "Force",
        ability: "Agility",
        results: { white: "Miss", green: "Hit", yellow: "Bullseye", red: "Stun" }
    },
    "Gp": {
        name: "Grappling",
        ability: "Strength",
        results: { white: "Miss", green: "Miss", yellow: "Partial", red: "Hold" }
    },
    "Gb": {
        name: "Grabbing",
        ability: "Strength",
        results: { white: "Miss", green: "Take", yellow: "Grab", red: "Break" }
    },
    "Es": {
        name: "Escaping",
        ability: "Strength",
        results: { white: "Miss", green: "Miss", yellow: "Escape", red: "Reverse" }
    },
    "Ch": {
        name: "Charging",
        ability: "Endurance",
        results: { white: "Miss", green: "Hit", yellow: "Slam", red: "Stun" }
    },
    "Do": {
        name: "Dodging",
        ability: "Agility",
        results: { white: "None", green: "-2 CS", yellow: "-4 CS", red: "-6 CS" }
    },
    "Ev": {
        name: "Evading",
        ability: "Fighting",
        results: { white: "Autohit", green: "Evasion", yellow: "+1 CS", red: "+2 CS" }
    },
    "Bl": {
        name: "Blocking",
        ability: "Strength",
        results: { white: "-6 CS", green: "-4 CS", yellow: "-2 CS", red: "+1 CS" }
    },
    "Ca": {
        name: "Catching",
        ability: "Agility",
        results: { white: "Autohit", green: "Miss", yellow: "Damage", red: "Catch" }
    },
    "St": {
        name: "Stun?",
        ability: "Endurance",
        results: { white: "1-10", green: "1", yellow: "No", red: "No" }
    },
    "Sl": {
        name: "Slam?",
        ability: "Endurance",
        results: { white: "Gr. Slam", green: "1 area", yellow: "Stagger", red: "No" }
    },
    "Ki": {
        name: "Kill?",
        ability: "Endurance",
        results: { white: "En. Loss", green: "E/S", yellow: "No", red: "No" }
    }
};

export const FEAT_TYPES = {
    "ability": {
        name: "Ability FEAT"
    },
    "combat": {
        name: "Combat FEAT"
    }
};

export const COMBAT_TYPES = {
    FIGHTING: {
        ability: "fighting",
        name: "Hand-to-Hand Combat",
        types: {
            BA: {
                name: "Blunt Attack",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "strength" },
                    yellow: { effect: "Slam", damage: "strength" },
                    red: { effect: "Stun", damage: "strength" }
                }
            },
            EA: {
                name: "Edged Attack",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "weapon" },
                    yellow: { effect: "Stun", damage: "weapon" },
                    red: { effect: "Kill", damage: "weapon" }
                }
            }
        }
    },
    AGILITY: {
        ability: "agility",
        name: "Ranged Combat",
        types: {
            Sh: {
                name: "Shooting",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "weapon" },
                    yellow: { effect: "Bullseye", damage: "weapon" },
                    red: { effect: "Kill", damage: "weapon" }
                }
            },
            TE: {
                name: "Throwing Edged",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "weapon" },
                    yellow: { effect: "Stun", damage: "weapon" },
                    red: { effect: "Kill", damage: "weapon" }
                }
            },
            TB: {
                name: "Throwing Blunt",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "strength" },
                    yellow: { effect: "Hit", damage: "strength" },
                    red: { effect: "Stun", damage: "strength" }
                }
            },
            En: {
                name: "Energy",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "weapon" },
                    yellow: { effect: "Bullseye", damage: "weapon" },
                    red: { effect: "Kill", damage: "weapon" }
                }
            },
            Fo: {
                name: "Force",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "weapon" },
                    yellow: { effect: "Bullseye", damage: "weapon" },
                    red: { effect: "Stun", damage: "weapon" }
                }
            }
        }
    },
    STRENGTH: {
        ability: "strength",
        name: "Strength Combat",
        types: {
            Gp: {
                name: "Grappling",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Miss", damage: 0 },
                    yellow: { effect: "Partial", damage: 0 },
                    red: { effect: "Hold", damage: 0 }
                }
            },
            Gb: {
                name: "Grabbing",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Take", damage: 0 },
                    yellow: { effect: "Grab", damage: 0 },
                    red: { effect: "Break", damage: 0 }
                }
            },
            Es: {
                name: "Escaping",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Miss", damage: 0 },
                    yellow: { effect: "Escape", damage: 0 },
                    red: { effect: "Reverse", damage: 0 }
                }
            },
            Bl: {
                name: "Blocking",
                results: {
                    white: { effect: "-6 CS", damage: 0 },
                    green: { effect: "-4 CS", damage: 0 },
                    yellow: { effect: "-2 CS", damage: 0 },
                    red: { effect: "+1 CS", damage: 0 }
                }
            }
        }
    },
    ENDURANCE: {
        ability: "endurance",
        name: "Endurance Combat",
        types: {
            Ch: {
                name: "Charging",
                results: {
                    white: { effect: "Miss", damage: 0 },
                    green: { effect: "Hit", damage: "strength" },
                    yellow: { effect: "Slam", damage: "strength" },
                    red: { effect: "Stun", damage: "strength" }
                }
            },
            St: {
                name: "Stun?",
                results: {
                    white: { effect: "1-10", damage: 0 },
                    green: { effect: "1", damage: 0 },
                    yellow: { effect: "No", damage: 0 },
                    red: { effect: "No", damage: 0 }
                }
            },
            Sl: {
                name: "Slam?",
                results: {
                    white: { effect: "Gr. Slam", damage: 0 },
                    green: { effect: "1 area", damage: 0 },
                    yellow: { effect: "Stagger", damage: 0 },
                    red: { effect: "No", damage: 0 }
                }
            },
            Ki: {
                name: "Kill?",
                results: {
                    white: { effect: "En. Loss", damage: 0 },
                    green: { effect: "E/S", damage: 0 },
                    yellow: { effect: "No", damage: 0 },
                    red: { effect: "No", damage: 0 }
                }
            }
        }
    }
};

export const COMBAT_EFFECTS = {
    SLAM: {
        white: "No Effect",
        green: "Stagger",
        yellow: "1 Area",
        red: "Grand Slam"
    },
    STUN: {
        white: "1-10 Rounds",
        green: "1 Round",
        yellow: "No Effect",
        red: "No Effect"
    }
};