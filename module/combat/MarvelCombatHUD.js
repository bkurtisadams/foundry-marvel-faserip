export class MarvelCombatHUD extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'marvel-combat-hud',
            template: 'systems/marvel-faserip/module/combat/templates/combat-hud.html',
            popOut: true,
            minimizable: false,
            resizable: false,
            dragDrop: [],
            width: 'auto',
            height: 'auto',
            classes: ['marvel-combat-hud-window'],
            top: 100,
            left: 200
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        // Find the HUD element using jQuery
        const hudElement = html.find('.marvel-combat-hud');
        if (hudElement.length) {
            this._makeDraggable(hudElement[0]);
        }
    
        // Action button handlers
        html.find('.action-btn').click(this._onActionClick.bind(this));
        
        // Toggle universal table
        html.find('.table-toggle').click(this._onToggleTable.bind(this));
    }
    
    _makeDraggable(element) {
        if (!element) return;  // Guard clause
    
        let pos = { top: 100, left: 200 };
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
    
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('action-btn')) return;
            isDragging = true;
            element.classList.add('dragging');
            dragOffset.x = e.clientX - pos.left;
            dragOffset.y = e.clientY - pos.top;
        });
    
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            pos.left = e.clientX - dragOffset.x;
            pos.top = e.clientY - dragOffset.y;
            
            // Keep within window bounds
            pos.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, pos.left));
            pos.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, pos.top));
            
            element.style.left = pos.left + 'px';
            element.style.top = pos.top + 'px';
        });
    
        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.classList.remove('dragging');
        });
    }

    _onActionClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;

        // Get selected token
        const token = canvas.tokens.controlled[0];
        if (!token) {
            ui.notifications.warn("Please select a token first");
            return;
        }

        // Get target
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn("Please target a token first");
            return;
        }

        if (targets.size > 1) {
            ui.notifications.warn("Please target only one token");
            return;
        }

        const target = targets.first();
        if (target.id === token.id) {
            ui.notifications.warn("Cannot target self!");
            return;
        }

        // Handle the action
        this._handleCombatAction(action, token, target);
    }

    _onToggleTable(event) {
        event.preventDefault();
        // Show the universal table
        if (!game.marvel.universalTable) {
            game.marvel.universalTable = new FaseripUniversalTable();
        }
        game.marvel.universalTable.render(true);
    }

    _handleCombatAction(actionType, attacker, defender) {
        // Implement combat resolution logic here
        console.log(`Executing ${actionType} from ${attacker.name} against ${defender.name}`);
    }
}