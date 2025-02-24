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
        
        // Table toggle handler
        html.find('.table-toggle').click(this._onTableToggleClick.bind(this));
    }
    
    // Combined table toggle handler
    async _onTableToggleClick(event) {
        event.preventDefault();
        
        const imagePath = "systems/marvel-faserip/assets/universal table.webp";
        
        // Create dialog content with embedded image
        const content = `
            <style>
                .universal-table-container {
                    min-width: 1000px;
                    min-height: 600px;
                    width: 100%;
                    height: 100%;
                    padding: 0;
                    margin: 0;
                }
                .universal-table-container img {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .app.marvel-universal-table {
                    min-width: 1000px !important;
                    min-height: 600px !important;
                }
            </style>
            <div class="universal-table-container">
                <img src="${imagePath}">
            </div>
        `;
        
        // Create and show dialog
        new Dialog({
            title: "Universal Table",
            content: content,
            buttons: {
                close: {
                    label: "Close"
                }
            },
            default: "close",
            width: 1000,
            height: 600,
            minimizable: true,
            resizable: true,
            position: { width: 1000, height: 600 }
        }, {
            classes: ["marvel-universal-table"]
        }).render(true);
    }

    // Rest of the dragging behavior remains the same
    _makeDraggable(element) {
        if (!element) return;

        let pos = { top: 100, left: 200 };
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        element.style.transition = 'transform 0.1s ease-out';

        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('action-btn') || 
                e.target.classList.contains('table-toggle')) return;
                
            isDragging = true;
            element.classList.add('dragging');
            dragOffset.x = e.clientX - pos.left;
            dragOffset.y = e.clientY - pos.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newLeft = e.clientX - dragOffset.x;
            const newTop = e.clientY - dragOffset.y;
            
            pos.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
            pos.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
            
            element.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('dragging');
            
            element.style.left = pos.left + 'px';
            element.style.top = pos.top + 'px';
            element.style.transform = '';
        });
    }

    _updateButtonStates() {
        const buttons = this.element.find('.action-btn');
        buttons.removeClass('active');
        
        const currentAction = this.getCurrentAction();
        if (currentAction) {
            buttons.filter(`[data-action="${currentAction}"]`).addClass('active');
        }
    }

    _onActionClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;

        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 150);

        const token = canvas.tokens.controlled[0];
        if (!token) {
            ui.notifications.warn("Please select a token first");
            return;
        }

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

        this._handleCombatAction(action, token, target);
    }

    _handleCombatAction(actionType, attacker, defender) {
        console.log(`Executing ${actionType} from ${attacker.name} against ${defender.name}`);
    }
}

// Modified ImagePopup class to use Foundry's built-in functionality
class ImagePopup extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "templates/image.html",  // Updated to use Foundry's default image template
            classes: ["marvel-universal-table", "image-popup"],
            resizable: true,
            popOut: true
        });
    }

    getData() {
        return this.options;
    }
}