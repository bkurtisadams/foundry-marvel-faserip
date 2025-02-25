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
    // Fighting-based actions
    "BA": {
        ability: "Fighting",
        name: "Blunt Attack",
        description: "Basic melee attack using blunt force",
        results: {
            white: { result: "Miss", effect: "miss", description: "Attack fails to connect" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Slam", effect: "slam", description: "Target is knocked back" },
            red: { result: "Stun", effect: "stun", description: "Target is stunned" }
        }
    },
    "EA": {
        ability: "Fighting",
        name: "Edged Attack",
        description: "Melee attack with edged/piercing weapon",
        results: {
            white: { result: "Miss", effect: "miss", description: "Attack fails to connect" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Stun", effect: "stun", description: "Target is stunned" },
            red: { result: "Kill", effect: "kill", description: "Deadly strike" }
        }
    },

    // Agility-based actions
    "Sh": {
        ability: "Agility",
        name: "Shooting",
        description: "Ranged attack with projectile weapon",
        results: {
            white: { result: "Miss", effect: "miss", description: "Shot misses target" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Bullseye", effect: "bullseye", description: "Critical hit for double damage" },
            red: { result: "Kill", effect: "kill", description: "Deadly shot" }
        }
    },
    "TE": {
        ability: "Agility",
        name: "Throwing Edged",
        description: "Throwing an edged weapon",
        results: {
            white: { result: "Miss", effect: "miss", description: "Throw misses" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Stun", effect: "stun", description: "Target is stunned" },
            red: { result: "Kill", effect: "kill", description: "Deadly throw" }
        }
    },
    "TB": {
        ability: "Agility",
        name: "Throwing Blunt",
        description: "Throwing a blunt object",
        results: {
            white: { result: "Miss", effect: "miss", description: "Throw misses" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Hit", effect: "damage", description: "Solid hit" },
            red: { result: "Slam", effect: "slam", description: "Target is knocked back" }
        }
    },
    "En": {
        ability: "Agility",
        name: "Energy",
        description: "Energy-based ranged attack",
        results: {
            white: { result: "Miss", effect: "miss", description: "Energy blast misses" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Hit", effect: "damage", description: "Solid hit" },
            red: { result: "Stun", effect: "stun", description: "Target is stunned" }
        }
    },
    "Fo": {
        ability: "Agility",
        name: "Force",
        description: "Force/kinetic ranged attack",
        results: {
            white: { result: "Miss", effect: "miss", description: "Force attack misses" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Bullseye", effect: "bullseye", description: "Critical hit" },
            red: { result: "Stun", effect: "stun", description: "Target is stunned" }
        }
    },
    "Do": {
        ability: "Agility",
        name: "Dodging",
        description: "Defensive maneuver to avoid attacks",
        results: {
            white: { result: "None", effect: "none", description: "No defensive bonus" },
            green: { result: "-2 CS", effect: "columnShift", value: -2, description: "Small defensive bonus" },
            yellow: { result: "-4 CS", effect: "columnShift", value: -4, description: "Good defensive bonus" },
            red: { result: "-6 CS", effect: "columnShift", value: -6, description: "Excellent defensive bonus" }
        }
    },

    // Strength-based actions
    "Gp": {
        ability: "Strength",
        name: "Grappling",
        description: "Wrestling and grappling moves",
        results: {
            white: { result: "Miss", effect: "miss", description: "Failed to grapple" },
            green: { result: "Miss", effect: "miss", description: "Failed to secure hold" },
            yellow: { result: "Partial", effect: "partial", description: "Partial hold" },
            red: { result: "Hold", effect: "hold", description: "Full grappling hold" }
        }
    },
    "Gb": {
        ability: "Strength",
        name: "Grabbing",
        description: "Attempt to grab opponent or object",
        results: {
            white: { result: "Miss", effect: "miss", description: "Failed to grab" },
            green: { result: "Take", effect: "take", description: "Successfully grab item" },
            yellow: { result: "Grab", effect: "grab", description: "Grab and control" },
            red: { result: "Break", effect: "break", description: "Break free or item" }
        }
    },

    // Endurance-based actions
    "Ch": {
        ability: "Endurance",
        name: "Charging",
        description: "Rush attack",
        results: {
            white: { result: "Miss", effect: "miss", description: "Charge misses" },
            green: { result: "Hit", effect: "damage", description: "Normal damage" },
            yellow: { result: "Slam", effect: "slam", description: "Target knocked back" },
            red: { result: "Stun", effect: "stun", description: "Target stunned" }
        }
    },
    "Es": {
        ability: "Strength",
        name: "Escaping",
        description: "Break free from holds or bonds",
        results: {
            white: { result: "Miss", effect: "miss", description: "Cannot escape" },
            green: { result: "Miss", effect: "miss", description: "Still held" },
            yellow: { result: "Escape", effect: "escape", description: "Break free" },
            red: { result: "Reverse", effect: "reverse", description: "Escape and reverse" }
        }
    },
    "St": {
        ability: "Endurance",
        name: "Stun Resistance",
        description: "Resist stun effects",
        results: {
            white: { result: "1-10", effect: "stun", value: "1d10", description: "Long stun" },
            green: { result: "1", effect: "stun", value: 1, description: "Brief stun" },
            yellow: { result: "No", effect: "none", description: "Resist stun" },
            red: { result: "No", effect: "none", description: "Immune to stun" }
        }
    },
    "Sl": {
        ability: "Endurance",
        name: "Slam Resistance",
        description: "Resist being knocked back",
        results: {
            white: { result: "Gr. Slam", effect: "grandSlam", description: "Major knockback" },
            green: { result: "1 area", effect: "slam", value: 1, description: "Minor knockback" },
            yellow: { result: "Stagger", effect: "stagger", description: "Stagger but hold ground" },
            red: { result: "No", effect: "none", description: "Resist knockback" }
        }
    },
    "Ki": {
        ability: "Endurance",
        name: "Kill Resistance",
        description: "Resist lethal effects",
        results: {
            white: { result: "En. Loss", effect: "enduranceLoss", description: "Permanent Endurance loss" },
            green: { result: "E/S", effect: "enduranceStrengthLoss", description: "End/Str loss" },
            yellow: { result: "No", effect: "none", description: "Resist effect" },
            red: { result: "No", effect: "none", description: "Immune to effect" }
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
