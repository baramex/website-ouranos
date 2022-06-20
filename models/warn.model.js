const { Schema, model } = require("mongoose");

const warn = new Schema({
    guildId: { type: String, required: true },
    memberId: { type: String, required: true },
    modoId: { type: String, required: true },
    content: { type: String, default: "" },
    date: { type: Date, default: new Date() }
});

const WarnModel = model('Warn', warn, "warns");

class Warn {
    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
    static getByModo(guild, modo) {
        return WarnModel.find({ guildId: guild, modoId: modo });
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
    static getByUser(guild, member) {
        return WarnModel.find({ guildId: guild, memberId: member });
    }
}

module.exports = { WarnModel, Warn };