// karma-history.js
export class KarmaHistorySheet extends FormApplication {
  
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["marvel-faserip", "sheet", "karma-history"],
        template: "systems/marvel-faserip/templates/karma-history.html",
        width: 600,
        height: 500,
        title: "Karma History",
        resizable: true,
        closeOnSubmit: false
      });
    }
    
    constructor(actor, options = {}) {
      super(actor, options);
      this.actor = actor;
    }
    
    getData() {
      const data = super.getData();
      data.karmaHistory = this.actor.system.karmaTracking?.history || [];
      data.karmaTotal = this.actor.system.karmaTracking?.karmaPool || 0;
      return data;
    }
    
    activateListeners(html) {
      super.activateListeners(html);
      
      // Add event listeners
      html.find('.add-karma-entry').click(this._onAddEntry.bind(this));
      html.find('.delete-entry').click(this._onDeleteEntry.bind(this));
      html.find('.clear-all-karma').click(this._onClearAllEntries.bind(this));
      html.find('.edit-entry').click(this._onEditEntry.bind(this));
      html.find('.close-button').click(() => this.close());
    }
    
    // Handle deleting a karma history entry
    async _onDeleteEntry(event) {
      event.preventDefault();
      const entryIndex = Number($(event.currentTarget).closest('.karma-entry').data('index'));
      
      // Get current history
      const history = duplicate(this.actor.system.karmaTracking.history || []);
      
      // Remove the entry
      history.splice(entryIndex, 1);
      
      // Update the actor
      await this.actor.update({
        "system.karmaTracking.history": history
      });
      
      // Recalculate lifetime total
      await this._recalculateKarmaTotal();
      
      // Refresh the display
      this.render(true);
    }
    
    // Recalculate karma total based on history
    async _recalculateKarmaTotal() {
      const history = this.actor.system.karmaTracking.history || [];
      
      // Calculate total from history
      const karmaTotal = history.reduce((total, entry) => {
        return total + (Number(entry.amount) || 0);
      }, 0);
      
      // Update the karma pool and lifetime total
      await this.actor.update({
        "system.karmaTracking.karmaPool": karmaTotal,
        "system.karmaTracking.lifetimeTotal": karmaTotal
      });
      
      return karmaTotal;
    }
    
    // Handle adding a new karma entry
    async _onAddEntry(event) {
      event.preventDefault();
      
      // Display dialog for new entry
      new Dialog({
        title: "Add Karma Entry",
        content: `
          <form>
            <div class="form-group">
              <label>Karma Amount:</label>
              <input type="number" name="amount" value="0">
              <p class="hint">(Use negative numbers for spending)</p>
            </div>
            <div class="form-group">
              <label>Description:</label>
              <input type="text" name="description" value="">
            </div>
          </form>
        `,
        buttons: {
          add: {
            label: "Add Entry",
            callback: html => {
              const amount = Number(html.find('[name="amount"]').val());
              const description = html.find('[name="description"]').val();
              
              if (description && !isNaN(amount)) {
                this._addKarmaEntry(amount, description);
              }
            }
          },
          cancel: {
            label: "Cancel"
          }
        },
        default: "add"
      }).render(true);
    }
    
    // Edit an existing karma entry
    async _onEditEntry(event) {
      event.preventDefault();
      const entryIndex = Number($(event.currentTarget).closest('.karma-entry').data('index'));
      const history = duplicate(this.actor.system.karmaTracking.history || []);
      const entry = history[entryIndex];
      
      if (!entry) return;
      
      new Dialog({
        title: "Edit Karma Entry",
        content: `
          <form>
            <div class="form-group">
              <label>Karma Amount:</label>
              <input type="number" name="amount" value="${entry.amount}">
            </div>
            <div class="form-group">
              <label>Description:</label>
              <input type="text" name="description" value="${entry.description}">
            </div>
          </form>
        `,
        buttons: {
          update: {
            label: "Update",
            callback: html => {
              const amount = Number(html.find('[name="amount"]').val());
              const description = html.find('[name="description"]').val();
              
              if (description && !isNaN(amount)) {
                history[entryIndex].amount = amount;
                history[entryIndex].description = description;
                
                this.actor.update({
                  "system.karmaTracking.history": history
                }).then(() => {
                  this._recalculateKarmaTotal();
                  this.render(true);
                });
              }
            }
          },
          cancel: {
            label: "Cancel"
          }
        },
        default: "update"
      }).render(true);
    }
    
    // Add a karma entry to history and update totals
    async _addKarmaEntry(amount, description) {
      const history = duplicate(this.actor.system.karmaTracking.history || []);
      
      // Create new entry
      const newEntry = {
        date: new Date().toLocaleString(),
        amount: amount,
        description: description
      };
      
      // Add to history
      history.push(newEntry);
      
      // Update actor
      await this.actor.update({
        "system.karmaTracking.history": history
      });
      
      // Recalculate totals
      await this._recalculateKarmaTotal();
      
      // Refresh display
      this.render(true);
    }
    
    // Handle clearing all karma entries
    async _onClearAllEntries(event) {
      event.preventDefault();
      
      // Confirm with dialog
      new Dialog({
        title: "Clear Karma History",
        content: "<p>Are you sure you want to clear all karma history entries? This cannot be undone.</p>",
        buttons: {
          yes: {
            label: "Yes, Clear All",
            callback: () => {
              this.actor.update({
                "system.karmaTracking.history": [],
                "system.karmaTracking.karmaPool": 0,
                "system.karmaTracking.lifetimeTotal": 0
              });
              this.render(true);
            }
          },
          no: {
            label: "Cancel"
          }
        },
        default: "no"
      }).render(true);
    }
    
    // Called when form is submitted
    async _updateObject(event, formData) {
      // Form submission isn't used for this sheet
      return;
    }
  }