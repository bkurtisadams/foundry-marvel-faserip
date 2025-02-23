// module/combat/FaseripUniversalTable.js
import { ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripUniversalTable extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {  // Changed from mergeObject to foundry.utils.mergeObject
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
        return {
            combatActions: this._getCombatActions(),
            resultsTable: this._getResultsTable(),
            isCollapsed: this.isResultsTableCollapsed
        };
    }

    _getCombatActions() {
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

    // Add missing _getColorForRange method
    _getColorForRange(range, ranges) {
        // Convert range string to number or range bounds
        let value;
        if (range.includes("-")) {
            const [min, max] = range.split("-").map(n => parseInt(n));
            value = max; // Use the upper bound for comparison
        } else {
            value = parseInt(range);
        }

        // Check which color range this value falls into
        if (value <= ranges.white[1]) return "white";
        if (value <= ranges.green[1]) return "green";
        if (value <= ranges.yellow[1]) return "yellow";
        return "red";
    }

    // Add missing _getRangeText method
    _getRangeText(range) {
        return `${range[0]}-${range[1]}`;
    }

    // Add missing _getEffectText method
    _getEffectText(color) {
        const effects = {
            white: "Miss",
            green: "Hit",
            yellow: "Special",
            red: "Kill"
        };
        return effects[color.toLowerCase()] || "";
    }

    _getResultsTable() {
        const rows = [];
        const ranges = [
            "01", "02-03", "04-06", "07-10", "11-15", 
            "16-20", "21-25", "26-30", "31-35", "36-40",
            "41-45", "46-50", "51-55", "56-60", "61-65",
            "66-70", "71-75", "76-80", "81-85", "86-90",
            "91-94", "95-97", "98-99", "100"
        ];

        ranges.forEach(range => {
            const row = {
                range,
                columns: []
            };

            Object.entries(UNIVERSAL_TABLE_RANGES).forEach(([rank, ranges]) => {
                const color = this._getColorForRange(range, ranges);
                row.columns.push({
                    color,
                    range: this._getRangeText(ranges[color.toLowerCase()]),
                    effect: this._getEffectText(color)
                });
            });

            rows.push(row);
        });

        return rows;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.toggle-results').click(this._onToggleResults.bind(this));
        html.find('.result-cell').click(this._onCellClick.bind(this));
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
        
        const result = this._getResult(rank, columnType);
        this._createChatMessage(rank, columnType, result);
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
}