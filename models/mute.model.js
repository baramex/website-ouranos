const { Schema, model } = require("mongoose");

const mute = new Schema({
    guildId: { type: String, required: true },
    memberId: { type: String, required: true },
    modoId: { type: String, required: true },
    reason: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    endDate: { type: Date, default: 0 },
    date: { type: Date, default: new Date() }
});

const MuteModel = model('Mute', mute, "mutes");

class Mute {
    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
     static getByModo(guild, modo) {
        return MuteModel.find({ guildId: guild, modoId: modo });
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} modo 
     * @returns 
     */
    static getByUser(guild, member) {
        return MuteModel.find({ guildId: guild, memberId: member });
    }
}

module.exports = { MuteModel, Mute };