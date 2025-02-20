// At the top of config.js, before any other CONFIG settings
CONFIG.marvel = CONFIG.marvel || {};
// Your existing MARVEL_RANKS and other config settings...
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

export const MARVEL = {
    headquarters: {
      "1br_apartment": { cost: "Fe/Ex", size: "Small", material: "Gd" },
      "2br_apartment": { cost: "Pr/Ex", size: "Small", material: "Gd" },
      "3br_apartment": { cost: "Gd/Rm", size: "Small", material: "Gd" },
      "cottage": { cost: "Pr/Gd", size: "Small", material: "Pr" },
      "small_house": { cost: "Ty/Ex", size: "Small", material: "Ty" },
      "medium_house": { cost: "Ty/Rm", size: "Mid-sized", material: "Ty" },
      "large_house": { cost: "Ex/In", size: "Mid-sized", material: "Gd" },
      "small_manor": { cost: "Rm/Am", size: "Large", material: "Ex" },
      "large_manor": { cost: "In/Mn", size: "Deluxe", material: "Ex" },
      "mansion": { cost: "Am/Mn", size: "Deluxe", material: "Ex" },
      "office": { cost: "Gd/Rm", size: "Mid-sized", material: "Ex" },
      "storefront": { cost: "Ty/Rm", size: "Small", material: "Gd" },
      "office_suite": { cost: "Ex/In", size: "Mid-sized", material: "Ex" },
      "office_floor": { cost: "Rm/Am", size: "Mid-sized", material: "Ex" },
      "two_office_floors": { cost: "In/Mn", size: "Large", material: "Ex" },
      "brownstone": { cost: "Ex/Rm", size: "Mid-sized", material: "Gd" },
      "office_building_4": { cost: "Rm/Am", size: "Large", material: "Ex" },
      "office_building_8": { cost: "In/Mn", size: "Deluxe", material: "Rm" },
      "office_building_12": { cost: "Am/Un", size: "Deluxe", material: "Rm" },
      "office_building_20": { cost: "Mn/ShX", size: "Deluxe", material: "Rm" },
      "office_building_30": { cost: "Un/ShZ", size: "Deluxe", material: "Rm" },
      "small_warehouse": { cost: "Ty/Rm", size: "Mid-sized", material: "Ty" },
      "medium_warehouse": { cost: "Gd/In", size: "Large", material: "Ty" },
      "large_warehouse": { cost: "Ex/Am", size: "Deluxe", material: "Gd" },
      "small_factory": { cost: "Gd/In", size: "Mid-sized", material: "Rm" },
      "medium_factory": { cost: "Ex/Am", size: "Large", material: "Rm" },
      "large_factory": { cost: "Rm/Mn", size: "Deluxe", material: "In" }
    }
  };
  
CONFIG.marvel.ROOM_PACKAGES = {
    "livingRoom": {
        name: "Living Room",
        cost: "Gd",
        size: 1,
        description: "Sofa, two easy chairs, two end tables, coffee tables, two lamps",
        upgrades: {
            entertainment: {
                name: "Entertainment System",
                cost: "Ex",
                description: "Television, stereo setup, piano"
            }
        }
    },
    "diningRoom": {
        name: "Dining Room",
        cost: "Gd",
        size: 1,
        description: "Table, four chairs, ceiling lamp",
        upgrades: {
            expanded: {
                name: "Expanded Setup",
                cost: "Ex",
                description: "Large table, bureau, four more chairs"
            },
            luxury: {
                name: "Luxury Setup",
                cost: "Rm",
                description: "China cabinet, set of good china, sterling tableware"
            }
        }
    },
    "kitchen": {
        name: "Kitchen",
        cost: "Gd", 
        size: 1,
        description: "Sink, stove, four cabinets, dishware, counterspace",
        upgrades: {
            appliances: {
                name: "Modern Appliances",
                cost: "Ex",
                description: "Refrigerator, dishwasher, microwave, fire extinguisher"
            }
        }
    },
    "library": {
        name: "Library",
        cost: "Ex",
        size: 1,
        description: "Two easy chairs, table, desk, straight chair, five bookcases with general texts",
        upgrades: {
            research: {
                name: "Research Equipment",
                cost: "Rm",
                description: "Globe, microfiche reader, computer terminal"
            }
        }
    },
    "computerRoom": {
        name: "Computer Room",
        cost: "Rm",
        size: 1,
        description: "Computer system with Excellent processing ability",
        upgrades: {
            advanced: {
                name: "Advanced System",
                cost: "In",
                description: "Upgraded to Remarkable processing ability"
            }
        }
    },
    "commsRoom": {
        name: "Communications Room",
        cost: "Rm",
        size: 1,
        description: "Short-wave monitor, computer network access, police band",
        upgrades: {
            security: {
                name: "Security Monitoring",
                cost: "In",
                description: "National security alert equipment, visual display screens"
            }
        }
    },
    "crimeFiles": {
        name: "Crime Files Room",
        cost: "Ex",
        size: 1,
        description: "Specialized computer for tracking villains and modi operandi"
    },
    "workshop": {
        name: "Workshop",
        cost: "Rm",
        size: 2,
        description: "Basic equipment for metal and woodworking",
        upgrades: {
            precision: {
                name: "Precision Equipment",
                cost: "In",
                description: "Laser guided instruments"
            },
            automated: {
                name: "Automated Systems",
                cost: "Am",
                description: "Automatic processing materials"
            }
        }
    },
    "laboratory": {
        name: "Laboratory",
        cost: "Rm",
        size: 2,
        description: "Basic lab equipment: scales, sinks, chemicals, microscope",
        upgrades: {
            advanced: {
                name: "Advanced Equipment",
                cost: "In",
                description: "Computer analysis system, clean room"
            },
            specialized: {
                name: "Specialized Systems",
                cost: "Am",
                description: "Poison analysis, serum dispenser"
            }
        }
    },
    "office": {
        name: "Office",
        cost: "Gd",
        size: 1,
        description: "Desk, three chairs, two lamps",
        upgrades: {
            business: {
                name: "Business Setup",
                cost: "Ex",
                description: "Additional desk set, file cabinet, typewriter"
            },
            executive: {
                name: "Executive Suite",
                cost: "Rm",
                description: "Computer terminal, decorative art, plants"
            }
        }
    },
    "recRoom": {
        name: "Recreation Room",
        cost: "Ex",
        size: 2,
        description: "Sofa, chairs, pool/ping-pong table, TV",
        upgrades: {
            gaming: {
                name: "Gaming Setup",
                cost: "Rm",
                description: "Video games, pinball machines, hot tub option"
            },
            holographic: {
                name: "Holographic System",
                cost: "Am",
                description: "Computer-assisted holographic entertainment"
            }
        }
    },
    "gym": {
        name: "Gymnasium",
        cost: "Ex",
        size: 2,
        description: "Weight-lifting equipment, universal gym, lockers",
        upgrades: {
            athletic: {
                name: "Athletic Equipment",
                cost: "Rm",
                description: "Rings, parallel bars, short horse"
            },
            advanced: {
                name: "Advanced Training",
                cost: "In",
                description: "Diagnostic displays, steam room"
            },
            combat: {
                name: "Combat Training",
                cost: "Am",
                description: "Boxing area, robotic opponents, electronic weights"
            }
        }
    },
    "pool": {
        name: "Swimming Pool",
        cost: "Rm",
        size: 3,
        description: "Olympic swimming pool, diving boards",
        upgrades: {
            indoor: {
                name: "Indoor Installation",
                cost: "In",
                description: "Indoor pool with climate control"
            }
        }
    },
    "dangerRoom": {
        name: "Danger Room",
        cost: "In",
        size: 4,
        description: "Advanced training facility with active dangers and security",
        upgrades: {
            enhanced: {
                name: "Enhanced Systems",
                cost: "Am",
                description: "Increased threat level, holographic capabilities"
            }
        }
    },
    "conferenceRoom": {
        name: "Conference Room",
        cost: "Rm",
        size: 1,
        description: "Large table, 10 chairs or platform with 30 chairs",
        upgrades: {
            luxury: {
                name: "Luxury Finish",
                cost: "In",
                description: "Wood paneling, premium furnishings"
            }
        }
    },
    "medical": {
        name: "Medical Bay",
        cost: "Rm",
        size: 2,
        description: "Emergency room care, standard medication",
        upgrades: {
            surgical: {
                name: "Surgical Suite",
                cost: "In",
                description: "X-ray, clean room, operating room"
            },
            advanced: {
                name: "Advanced Care",
                cost: "Am",
                description: "Cryogenics, specialized treatment"
            }
        }
    },
    "powerRoom": {
        name: "Power Room",
        cost: "Rm",
        size: 1,
        description: "12-hour backup power supply",
        upgrades: {
            enhanced: {
                name: "Enhanced Power",
                cost: "In",
                description: "24-hour supply, automatic cutover"
            },
            solar: {
                name: "Solar Power",
                cost: "Am",
                description: "Solar-powered cells, self-sustaining"
            }
        }
    }
};

CONFIG.marvel.SECURITY_SYSTEMS = {
    "none": {
        name: "None",
        cost: 0,
        description: "No security system installed"
    },
    "basic": {
        name: "Basic Security",
        cost: "Gd",
        description: "Hand-set alarms on windows and doors, mechanical locks"
    },
    "advanced": {
        name: "Advanced Security",
        cost: "Ex",
        description: "Computer-code system, automatic alarms"
    },
    "enhanced": {
        name: "Enhanced Security",
        cost: "Rm",
        description: "Palm-print scan, defense system activation"
    },
    "maximum": {
        name: "Maximum Security",
        cost: "In",
        description: "Full body scan, hostile intent detection"
    }
};

CONFIG.marvel.DEFENSE_SYSTEMS = {
    "none": {
        name: "None",
        cost: 0,
        description: "No defense system installed"
    },
    "standard": {
        name: "Standard Defense",
        cost: "Ex",
        description: "Pre-set defenses of Remarkable strength"
    },
    "enhanced": {
        name: "Enhanced Defense",
        cost: "Rm",
        description: "Activated defenses of Incredible strength"
    },
    "maximum": {
        name: "Maximum Defense",
        cost: "In",
        description: "Multiple defense systems of Amazing strength"
    }
};

// Helper function to convert rank to numeric value for calculations
CONFIG.marvel.RANK_VALUES = {
    "Sh0": 0,
    "Fe": 2,
    "Pr": 4,
    "Ty": 6,
    "Gd": 10,
    "Ex": 20,
    "Rm": 30,
    "In": 40,
    "Am": 50,
    "Mn": 75,
    "Un": 100
};

// After MARVEL_RANKS in config.js
CONFIG.marvel.ranks = MARVEL_RANKS;
CONFIG.marvel.selectableRanks = Object.keys(MARVEL_RANKS).reduce((obj, key) => {
    obj[key] = key;
    return obj;
}, {});

// Then you can add karmaReasons
CONFIG.marvel.karmaReasons = {
    stopCrime: { id: "stopCrime", label: "Stop Crime", karma: 30 },
    rescue: { id: "rescue", label: "Rescue", karma: 20 },
    defeatFoe: { id: "defeatFoe", label: "Defeat Villain", karma: 40 },
    charity: { id: "charity", label: "Charitable Act", karma: 10 },
    // Add more reasons...
};

CONFIG.marvel.ranks = {
    'Shift 0': "Shift 0",
    'Feeble': "Feeble",
    'Poor': "Poor",
    'Typical': "Typical",
    'Good': "Good",
    'Excellent': "Excellent",
    'Remarkable': "Remarkable",
    'Incredible': "Incredible",
    'Amazing': "Amazing",
    'Monstrous': "Monstrous",
    'Unearthly': "Unearthly",
    'Shift X': "Shift X",
    'Shift Y': "Shift Y",
    'Shift Z': "Shift Z",
    'Class 1000': "Class 1000",
    'Class 3000': "Class 3000",
    'Class 5000': "Class 5000",
    'Beyond': "Beyond"
};

/* // After MARVEL_RANKS in config.js
CONFIG.marvel.ranks = MARVEL_RANKS;
CONFIG.marvel.selectableRanks = Object.keys(MARVEL_RANKS).reduce((obj, key) => {
    obj[key] = key;
    return obj;
}, {}); */

CONFIG.marvel.selectableRanks = {
    'Shift 0': "Shift 0",
    'Feeble': "Feeble",
    'Poor': "Poor",
    'Typical': "Typical",
    'Good': "Good",
    'Excellent': "Excellent",
    'Remarkable': "Remarkable",
    'Incredible': "Incredible",
    'Amazing': "Amazing",
    'Monstrous': "Monstrous",
    'Unearthly': "Unearthly",
    'Shift X': "Shift X",
    'Shift Y': "Shift Y",
    'Shift Z': "Shift Z",
    'Class 1000': "Class 1000",
    'Class 3000': "Class 3000",
    'Class 5000': "Class 5000",
    'Beyond': "Beyond"
};

CONFIG.marvel.resistanceTypes = {
    physical: "Physical",
    energy: "Energy", 
    force: "Force",
    heat: "Heat",
    cold: "Cold",
    electricity: "Electricity",
    radiation: "Radiation",
    toxins: "Toxins",
    psychic: "Psychic",
    magic: "Magic"
};

CONFIG.marvel.karmaSpendTypes = {
    powerStunt: { id: "powerStunt", label: "Power Stunt" },
    advancement: { id: "advancement", label: "Advancement" },
    dieRoll: { id: "dieRoll", label: "Modify Die Roll" },
    poolContribution: { id: "poolContribution", label: "Team Pool Contribution" },
    // Add more types...
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