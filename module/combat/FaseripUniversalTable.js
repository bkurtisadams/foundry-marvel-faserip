// module/combat/FaseripUniversalTable.js
import { ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripUniversalTable extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "faserip-universal-table",
            template: "systems/marvel-faserip/module/combat/templates/universal-table.html",
            width: 800,
            height: 600,
            minimizable: true,
            resizable: true,
            title: "Universal Table",
            classes: ["marvel-faserip", "universal-table"]
        });
    }

    constructor(options = {}) {
        super(options);
        this.isResultsTableCollapsed = false;
    }

    getData() {
        // Get data from config
        return {
            combatActions: this._getCombatActions(),
            resultsRanges: UNIVERSAL_TABLE_RANGES,
            isCollapsed: this.isResultsTableCollapsed
        };
    }

    _getCombatActions() {
        // Transform ACTION_RESULTS into the format needed for display
        return Object.entries(ACTION_RESULTS).map(([code, data]) => ({
            code,
            name: data.name,
            ability: data.ability,
            results: {
                white: data.results.white,
                green: data.results.green,
                yellow: data.results.yellow,
                red: data.results.red
            }
        }));
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.toggle-results').click(this._onToggleResults.bind(this));
        html.find('.result-cell').click(this._onCellClick.bind(this));
        
        // Add tooltips for result cells
        html.find('.result-cell').hover(this._onCellHover.bind(this));
    }

    _onToggleResults(event) {
        event.preventDefault();
        this.isResultsTableCollapsed = !this.isResultsTableCollapsed;
        this.render(true);
    }

    _onCellClick(event) {
        event.preventDefault();
        const cell = event.currentTarget;
        const rank = cell.dataset.rank;
        const columnType = cell.dataset.column;
        
        // Get result from config
        const ranges = UNIVERSAL_TABLE_RANGES[rank];
        const result = this._getResult(rank, columnType);
        
        // Display result in chat
        this._createChatMessage(rank, columnType, result);
    }

    _onCellHover(event) {
        const cell = event.currentTarget;
        const rank = cell.dataset.rank;
        const columnType = cell.dataset.column;
        
        // Get ranges from config
        const ranges = UNIVERSAL_TABLE_RANGES[rank];
        const range = ranges[columnType.toLowerCase()];
        
        // Show tooltip with range
        $(cell).attr('title', `${range[0]}-${range[1]}`);
    }

    _getResult(rank, columnType) {
        return {
            rank,
            columnType,
            range: UNIVERSAL_TABLE_RANGES[rank][columnType.toLowerCase()],
            effects: this._getEffectsForResult(columnType)
        };
    }

    _getEffectsForResult(columnType) {
        return Object.entries(ACTION_RESULTS).reduce((effects, [code, action]) => {
            effects[code] = action.results[columnType.toLowerCase()];
            return effects;
        }, {});
    }

    async _createChatMessage(rank, columnType, result) {
        const template = "systems/marvel-faserip/templates/chat/universal-table-result.html";
        const content = await renderTemplate(template, {
            rank,
            columnType,
            range: result.range,
            effects: result.effects
        });

        ChatMessage.create({
            content,
            speaker: ChatMessage.getSpeaker()
        });
    }

    /**
     * Get the color result for a specific roll against a rank
     * @param {string} rank - The rank being tested against
     * @param {number} roll - The d100 roll result
     * @returns {string} The color result (white, green, yellow, or red)
     */
    static getColorResult(rank, roll) {
        const ranges = UNIVERSAL_TABLE_RANGES[rank];
        if (!ranges) return "white";

        if (roll <= ranges.white[1]) return "white";
        if (roll <= ranges.green[1]) return "green";
        if (roll <= ranges.yellow[1]) return "yellow";
        return "red";
    }

    /**
     * Get the effect for a specific combat action based on color result
     * @param {string} actionCode - The combat action code (BA, EA, etc.)
     * @param {string} color - The color result
     * @returns {string} The effect text
     */
    static getActionEffect(actionCode, color) {
        const action = ACTION_RESULTS[actionCode];
        if (!action) return "No Effect";
        return action.results[color.toLowerCase()] || "No Effect";
    }
}