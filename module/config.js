// At the top of config.js, before any other CONFIG settings
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

// Action categories for organizing UI display
export const ACTION_CATEGORIES = {
    FIGHTING: "Fighting Actions",
    AGILITY: "Agility Actions", 
    STRENGTH: "Strength Actions",
    ENDURANCE: "Endurance Actions"
};

export const ACTION_RESULTS = {
    "BA": { 
        name: "Blunt Attack",
        ability: "Fighting",
        category: "FIGHTING",
        availableEffects: ["Miss", "Hit", "Slam", "Stun"],
        results: { 
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "strength" },
            yellow: { effect: "Slam", damage: "strength" },
            red: { effect: "Stun", damage: "strength" }
        },
        description: "Basic hand-to-hand combat",
        requirements: null
    },
    "EA": {
        name: "Edged Attack",
        ability: "Fighting", 
        category: "FIGHTING",
        availableEffects: ["Miss", "Hit", "Stun", "Kill"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "weapon" },
            yellow: { effect: "Stun", damage: "weapon" },
            red: { effect: "Kill", damage: "weapon" }
        },
        description: "Attack with a sharp or edged weapon",
        requirements: "Edged weapon equipped"
    },
    "Sh": {
        name: "Shooting",
        ability: "Agility",
        category: "AGILITY", 
        availableEffects: ["Miss", "Hit", "Bullseye", "Kill"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "weapon" },
            yellow: { effect: "Bullseye", damage: "weapon" },
            red: { effect: "Kill", damage: "weapon" }
        },
        description: "Ranged attack with projectile weapon",
        requirements: "Ranged weapon equipped"
    },
    "TE": {
        name: "Throwing Edged",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["Miss", "Hit", "Stun", "Kill"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "weapon" },
            yellow: { effect: "Stun", damage: "weapon" },
            red: { effect: "Kill", damage: "weapon" }
        },
        description: "Throw an edged weapon",
        requirements: "Throwable edged weapon"
    },
    "TB": {
        name: "Throwing Blunt",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["Miss", "Hit", "Hit", "Stun"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "strength" },
            yellow: { effect: "Hit", damage: "strength" },
            red: { effect: "Stun", damage: "strength" }
        },
        description: "Throw a blunt object",
        requirements: null
    },
    "En": {
        name: "Energy",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["Miss", "Hit", "Bullseye", "Kill"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "power" },
            yellow: { effect: "Bullseye", damage: "power" },
            red: { effect: "Kill", damage: "power" }
        },
        description: "Energy-based ranged attack",
        requirements: "Energy attack power"
    },
    "Fo": {
        name: "Force",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["Miss", "Hit", "Bullseye", "Stun"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "power" },
            yellow: { effect: "Bullseye", damage: "power" },
            red: { effect: "Stun", damage: "power" }
        },
        description: "Force-based ranged attack",
        requirements: "Force attack power"
    },
    "Gp": {
        name: "Grappling",
        ability: "Strength",
        category: "STRENGTH",
        availableEffects: ["Miss", "Miss", "Partial", "Hold"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Miss", damage: 0 },
            yellow: { effect: "Partial", damage: 0 },
            red: { effect: "Hold", damage: 0 }
        },
        description: "Attempt to hold or restrain target",
        requirements: null
    },
    "Gb": {
        name: "Grabbing",
        ability: "Strength",
        category: "STRENGTH",
        availableEffects: ["Miss", "Take", "Grab", "Break"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Take", damage: 0 },
            yellow: { effect: "Grab", damage: 0 },
            red: { effect: "Break", damage: 0 }
        },
        description: "Attempt to take an item from target",
        requirements: null
    },
    "Es": {
        name: "Escaping",
        ability: "Strength",
        category: "STRENGTH",
        availableEffects: ["Miss", "Miss", "Escape", "Reverse"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Miss", damage: 0 },
            yellow: { effect: "Escape", damage: 0 },
            red: { effect: "Reverse", damage: 0 }
        },
        description: "Attempt to break free from hold",
        requirements: "Currently held"
    },
    "Ch": {
        name: "Charging",
        ability: "Endurance",
        category: "ENDURANCE",
        availableEffects: ["Miss", "Hit", "Slam", "Stun"],
        results: {
            white: { effect: "Miss", damage: 0 },
            green: { effect: "Hit", damage: "strength" },
            yellow: { effect: "Slam", damage: "strength" },
            red: { effect: "Stun", damage: "strength" }
        },
        description: "Rush attack using momentum",
        requirements: "Must move at least 1 area"
    },
    "Do": {
        name: "Dodging",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["None", "-2 CS", "-4 CS", "-6 CS"],
        results: {
            white: { effect: "None", damage: 0 },
            green: { effect: "-2 CS", damage: 0 },
            yellow: { effect: "-4 CS", damage: 0 },
            red: { effect: "-6 CS", damage: 0 }
        },
        description: "Defensive maneuver to avoid attacks",
        requirements: null
    },
    "Ev": {
        name: "Evading",
        ability: "Fighting",
        category: "FIGHTING",
        availableEffects: ["Autohit", "Evasion", "+1 CS", "+2 CS"],
        results: {
            white: { effect: "Autohit", damage: 0 },
            green: { effect: "Evasion", damage: 0 },
            yellow: { effect: "+1 CS", damage: 0 },
            red: { effect: "+2 CS", damage: 0 }
        },
        description: "Defensive fighting maneuver",
        requirements: null
    },
    "Bl": {
        name: "Blocking",
        ability: "Strength",
        category: "STRENGTH",
        availableEffects: ["-6 CS", "-4 CS", "-2 CS", "+1 CS"],
        results: {
            white: { effect: "-6 CS", damage: 0 },
            green: { effect: "-4 CS", damage: 0 },
            yellow: { effect: "-2 CS", damage: 0 },
            red: { effect: "+1 CS", damage: 0 }
        },
        description: "Block incoming physical attacks",
        requirements: null
    },
    "Ca": {
        name: "Catching",
        ability: "Agility",
        category: "AGILITY",
        availableEffects: ["Autohit", "Miss", "Damage", "Catch"],
        results: {
            white: { effect: "Autohit", damage: 0 },
            green: { effect: "Miss", damage: 0 },
            yellow: { effect: "Damage", damage: 0 },
            red: { effect: "Catch", damage: 0 }
        },
        description: "Attempt to catch thrown object or falling person",
        requirements: null
    },
    "St": {
        name: "Stun?",
        ability: "Endurance",
        category: "ENDURANCE",
        availableEffects: ["1-10", "1", "No", "No"],
        results: {
            white: { effect: "1-10", damage: 0 },
            green: { effect: "1", damage: 0 },
            yellow: { effect: "No", damage: 0 },
            red: { effect: "No", damage: 0 }
        },
        description: "Resist being stunned",
        requirements: null
    },
    "Sl": {
        name: "Slam?",
        ability: "Endurance",
        category: "ENDURANCE",
        availableEffects: ["Gr. Slam", "1 area", "Stagger", "No"],
        results: {
            white: { effect: "Gr. Slam", damage: 0 },
            green: { effect: "1 area", damage: 0 },
            yellow: { effect: "Stagger", damage: 0 },
            red: { effect: "No", damage: 0 }
        },
        description: "Resist being slammed",
        requirements: null
    },
    "Ki": {
        name: "Kill?",
        ability: "Endurance",
        category: "ENDURANCE",
        availableEffects: ["En. Loss", "E/S", "No", "No"],
        results: {
            white: { effect: "En. Loss", damage: 0 },
            green: { effect: "E/S", damage: 0 },
            yellow: { effect: "No", damage: 0 },
            red: { effect: "No", damage: 0 }
        },
        description: "Resist lethal damage",
        requirements: null
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
  
  export const ROOM_PACKAGES = {
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

export const SECURITY_SYSTEMS = {
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

export const DEFENSE_SYSTEMS = {
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
export const RANK_VALUES = {
    "Shift 0": 0,
    "Feeble": 2,
    "Poor": 4,
    "Typical": 6,
    "Good": 10,
    "Excellent": 20,
    "Remarkable": 30,
    "Incredible": 40,
    "Amazing": 50,
    "Monstrous": 75,
    "Unearthly": 100,
    "Shift X": 150,
    "Shift Y": 200,
    "Shift Z": 500,
    "Class 1000": 1000,
    "Class 3000": 3000,
    "Class 5000": 5000,
    "Beyond": Infinity
};

// Define ranks and selectable ranks as constants
export const RANKS = {
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

export const SELECTABLE_RANKS = Object.keys(MARVEL_RANKS).reduce((obj, key) => {
    obj[key] = key;
    return obj;
}, {});

export const KARMA_REASONS = {
    stopCrime: { id: "stopCrime", label: "Stop Crime", karma: 30 },
    rescue: { id: "rescue", label: "Rescue", karma: 20 },
    defeatFoe: { id: "defeatFoe", label: "Defeat Villain", karma: 40 },
    charity: { id: "charity", label: "Charitable Act", karma: 10 }
};

export const RESISTANCE_TYPES = {
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

export const KARMA_SPEND_TYPES = {
    powerStunt: { id: "powerStunt", label: "Power Stunt" },
    advancement: { id: "advancement", label: "Advancement" },
    dieRoll: { id: "dieRoll", label: "Modify Die Roll" },
    poolContribution: { id: "poolContribution", label: "Team Pool Contribution" }
};

export const FEAT_TYPES = {
    "ability": {
        name: "Ability FEAT"
    },
    "combat": {
        name: "Combat FEAT"
    }
};

// Helper function to get available actions for an actor
export function getAvailableActions(actor) {
    const availableActions = {};
    
    for (const [id, action] of Object.entries(ACTION_RESULTS)) {
        if (!meetsRequirements(actor, action.requirements)) continue;
        
        if (!availableActions[action.category]) {
            availableActions[action.category] = [];
        }
        availableActions[action.category].push({
            id,
            ...action
        });
    }
    
    return availableActions;
}

function meetsRequirements(actor, requirements) {
    // Implement requirement checking logic
    return true; // Placeholder
}

// Status effects should be handled in the init hook in marvel-faserip.js
export const STATUS_EFFECTS = [{
    id: "dying",
    label: "Dying",
    icon: "icons/svg/skull.svg"
}];
