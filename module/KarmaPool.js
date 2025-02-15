export class KarmaPool {
    constructor(data={}) {
        this.id = data.id || randomID(16);
        this.name = data.name || "New Karma Pool";
        this.type = data.type || "temporary"; // temporary or permanent
        this.total = data.total || 0;
        this.members = data.members || []; // Array of actor IDs
        this.contributions = data.contributions || {}; // { actorId: amount }
        this.locked = data.locked || false;
        this.startDate = data.startDate || new Date().toISOString();
        this.endDate = data.endDate || null;
    }

    static async create(data) {
        // Create pool in world storage
        const pool = new KarmaPool(data);
        await game.settings.set("marvel-faserip", `karmaPools.${pool.id}`, pool);
        return pool;
    }

    async addMember(actorId, contribution=0) {
        if (!this.members.includes(actorId)) {
            this.members.push(actorId);
            if (contribution > 0) {
                this.contributions[actorId] = contribution;
                this.total += contribution;
            }
            await this.save();
        }
    }

    async removeMember(actorId) {
        const index = this.members.indexOf(actorId);
        if (index !== -1) {
            // Calculate share
            const share = Math.floor(this.total / this.members.length);
            
            // Remove member
            this.members.splice(index, 1);
            delete this.contributions[actorId];
            this.total -= share;

            await this.save();
            return share;
        }
        return 0;
    }

    async addKarma(amount, source) {
        this.total += amount;
        await this.save();
    }

    async spendKarma(amount, reason) {
        if (this.locked && reason === "advancement") {
            return false;
        }
        if (amount <= this.total) {
            this.total -= amount;
            await this.save();
            return true;
        }
        return false;
    }

    async save() {
        await game.settings.set("marvel-faserip", `karmaPools.${this.id}`, this);
    }
}