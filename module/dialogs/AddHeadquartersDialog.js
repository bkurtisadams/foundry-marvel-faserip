export class AddHeadquartersDialog extends Dialog {
    static async create(actor) {
        const html = await renderTemplate("systems/marvel-faserip/templates/dialogs/add-headquarters.html", {
            config: CONFIG.marvel
        });

        return new Promise((resolve) => {
            new Dialog({
                title: "Add New Headquarters",
                content: html,
                buttons: {
                    create: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Create",
                        callback: (html) => {
                            // Change to jQuery selector
                            const form = html.find("form");
                            const type = form.find('[name="type"]').val();
                            const name = form.find('[name="name"]').val();
                            
                            const hqData = CONFIG.marvel.HQ_TYPES[type];
                            if (!type || !name || !hqData) return;

                            resolve({
                                name: name,
                                type: "headquarters",
                                img: "icons/svg/house.svg",
                                system: {
                                    type: type,
                                    size: hqData.size,
                                    materialStrength: hqData.material,
                                    cost: {
                                        rent: hqData.cost.split('/')[0],
                                        purchase: hqData.cost.split('/')[1]
                                    },
                                    rooms: []
                                }
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                default: "create",
                render: (html) => {
                    // Change to jQuery selectors
                    const select = html.find('select[name="type"]');
                    const sizeHint = html.find('.size-hint');
                    const costHint = html.find('.cost-hint');
                    const materialHint = html.find('.material-hint');

                    // Use jQuery on for event binding
                    select.on('change', (ev) => {
                        const type = ev.target.value;
                        const hqData = CONFIG.marvel.HQ_TYPES[type];
                        if (hqData) {
                            sizeHint.text(`Size: ${hqData.size}`);
                            costHint.text(`Cost: ${hqData.cost}`);
                            materialHint.text(`Material Strength: ${hqData.material}`);
                        } else {
                            sizeHint.text('');
                            costHint.text('');
                            materialHint.text('');
                        }
                    });
                }
            }, {
                classes: ["marvel-dialog", "add-headquarters-dialog"],
                width: 400
            }).render(true);
        });
    }
}