const { Schema, model } = require("mongoose");

const kick = new Schema({
    guildId: { type: String, required: true },
    memberId: { type: String, required: true },
    modoId: { type: String, required: true },
    reason: { type: String, default: "" },
    date: { type: Date, default: new Date() }
});

const KickModel = model('Kick', kick, "kicks");

class Kick {
    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
    static getByModo(guild, modo) {
        return KickModel.find({ guildId: guild, modoId: modo });
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
    static getByUser(guild, member) {
        return KickModel.find({ guildId: guild, memberId: member });
    }
}

module.exports = { KickModel, Kick };