// module/combat/FaseripUniversalTable.js
import { ACTION_RESULTS } from "../config.js";

/**
 * FaseripUniversalTable class for handling the Universal Table display
 * @extends {Application}
 */
export class FaseripUniversalTable extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "faserip-universal-table",
            template: "systems/marvel-faserip/module/combat/templates/universal-table.html",
            width: 800,
            height: 'auto',
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
            isCollapsed: this.isResultsTableCollapsed
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.toggle-results').click(this._onToggleResults.bind(this));
    }

    _onToggleResults(event) {
        event.preventDefault();
        this.isResultsTableCollapsed = !this.isResultsTableCollapsed;
        this.render(true);
    }
}