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

        // Add click handler for action headers
        html.find('.action-header').click(this._onActionClick.bind(this));
        
        // Keep existing listeners
        html.find('.toggle-results').click(this._onToggleResults.bind(this));
        html.find('.result-cell').click(this._onCellClick.bind(this));
    }

    async _onActionClick(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const actionCode = header.querySelector('.action-code').textContent;
        const actionData = CONFIG.marvel.actionResults[actionCode];

        if (!actionData) {
            ui.notifications.error(`No data found for action ${actionCode}`);
            return;
        }

        // Get selected token's actor
        const token = canvas.tokens.controlled[0];
        if (!token?.actor) {
            ui.notifications.warn("Please select a token first");
            return;
        }

        const actor = token.actor;
        
        // Create dialog content
        const ability = actionData.ability.toLowerCase();
        const abilityScore = actor.system.primaryAbilities[ability];
        
        const dialogContent = `
            <form>
                <div class="form-group">
                    <label>Action: ${actionData.name}</label>
                </div>
                <div class="form-group">
                    <label>Ability: ${ability} (${abilityScore.rank})</label>
                </div>
                <div class="form-group">
                    <label>Column Shift:</label>
                    <select name="columnShift">
                        <option value="-3">-3 CS</option>
                        <option value="-2">-2 CS</option>
                        <option value="-1">-1 CS</option>
                        <option value="0" selected>+0 CS</option>
                        <option value="1">+1 CS</option>
                        <option value="2">+2 CS</option>
                        <option value="3">+3 CS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Karma Points (Max: ${actor.system.secondaryAbilities.karma.value}):</label>
                    <input type="number" name="karma" value="0" min="0" max="${actor.system.secondaryAbilities.karma.value}">
                </div>
            </form>`;

        // Show dialog
        new Dialog({
            title: `${actionData.name} Action Roll`,
            content: dialogContent,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: (html) => this._processActionRoll(html, actor, actionCode, actionData)
                },
                cancel: {
                    label: "Cancel"
                }
            }
        }).render(true);
    }

    async _processActionRoll(html, actor, actionCode, actionData) {
        const form = html.find('form')[0];
        const columnShift = parseInt(form.columnShift.value) || 0;
        const karmaPoints = parseInt(form.karma.value) || 0;

        // Get base ability and rank
        const ability = actionData.ability.toLowerCase();
        const abilityData = actor.system.primaryAbilities[ability];
        if (!abilityData) {
            ui.notifications.error(`Missing ability data for ${ability}`);
            return;
        }

        // Roll d100
        const roll = await new Roll("1d100").evaluate({async: true});
        const total = roll.total + karmaPoints;

        // Get base rank and apply column shift
        const baseRank = abilityData.rank;
        const shiftedRank = this._applyColumnShift(baseRank, columnShift);

        // Get color result
        const color = this._getColorResult(total, shiftedRank);
        
        // Get effect based on action type and color
        const effect = actionData.results[color.toLowerCase()];

        // Create chat message
        const messageContent = `
            <div class="marvel-roll">
                <h3>${actor.name} - ${actionData.name} Roll</h3>
                <div class="roll-details">
                    <div>${ability.charAt(0).toUpperCase() + ability.slice(1)}: ${baseRank}</div>
                    ${columnShift !== 0 ? `<div>Column Shift: ${columnShift > 0 ? '+' : ''}${columnShift} → ${shiftedRank}</div>` : ''}
                    <div>Roll: ${roll.total}${karmaPoints ? ` + ${karmaPoints} Karma = ${total}` : ''}</div>
                    <div class="result ${color.toLowerCase()}-result">${effect} (${color})</div>
                </div>
            </div>`;

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: messageContent,
            rolls: [roll]
        });

        // Deduct karma if used
        if (karmaPoints > 0) {
            const newKarma = actor.system.secondaryAbilities.karma.value - karmaPoints;
            await actor.update({
                "system.secondaryAbilities.karma.value": newKarma
            });
        }
    }

    _applyColumnShift(rank, shift) {
        const ranks = [
            "Shift 0", "Feeble", "Poor", "Typical", "Good", 
            "Excellent", "Remarkable", "Incredible", "Amazing",
            "Monstrous", "Unearthly", "Shift X", "Shift Y", "Shift Z",
            "Class 1000", "Class 3000", "Class 5000", "Beyond"
        ];
        
        const currentIndex = ranks.indexOf(rank);
        if (currentIndex === -1) return rank;
        
        const newIndex = Math.min(Math.max(currentIndex + shift, 0), ranks.length - 1);
        return ranks[newIndex];
    }

    _getColorResult(roll, rank) {
        const ranges = CONFIG.marvel.UNIVERSAL_TABLE_RANGES[rank];
        if (!ranges) return "white";

        if (roll <= ranges.white[1]) return "WHITE";
        if (roll <= ranges.green[1]) return "GREEN";
        if (roll <= ranges.yellow[1]) return "YELLOW";
        return "RED";
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