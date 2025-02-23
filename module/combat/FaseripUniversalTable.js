// module/combat/FaseripUniversalTable.js
import { ACTION_RESULTS, UNIVERSAL_TABLE_RANGES } from "../config.js";

export class FaseripUniversalTable extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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

    activateListeners(html) {
        super.activateListeners(html);

        // Add click handler for action headers
        html.find('.action-header').click(this._onActionClick.bind(this));
        
        // Keep existing listeners
        html.find('.toggle-results').click(this._onToggleResults.bind(this));
    }

    async _onActionClick(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const actionCode = header.querySelector('.action-code').textContent;

        // Get selected token
        const token = canvas.tokens.controlled[0];
        if (!token) {
            ui.notifications.warn("Please select a token first");
            return;
        }

        // Get target
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn("Please target a token first (use targeting button or hold T)");
            return;
        }

        if (targets.size > 1) {
            ui.notifications.warn("Please target only one token");
            return;
        }

        const target = targets.first();

        // Don't allow targeting self
        if (target.id === token.id) {
            ui.notifications.warn("Cannot target self!");
            return;
        }

        // Use the existing combat system
        const combatSystem = game.marvel.combatSystem;
        await combatSystem.initiateAttack(token, target);
    }

    _onToggleResults(event) {
        event.preventDefault();
        this.isResultsTableCollapsed = !this.isResultsTableCollapsed;
        this.render(true);
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

    _getResultsTable() {
        const rows = [];
        const ranges = [
            "01", "02-03", "04-06", "07-10", "11-15", 
            "16-20", "21-25", "26-30", "31-35", "36-40",
            "41-45", "46-50", "51-55", "56-60", "61-65",
            "66-70", "71-75", "76-80", "81-85", "86-90",
            "91-94", "95-97", "98-99", "100"
        ];

        return rows;
    }
}