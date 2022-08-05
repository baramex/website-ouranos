const { Schema, model } = require("mongoose");
const { localFetch } = require("../utils/fetch");
const { average } = require("../utils/methods");

const staffAdviceSchema = new Schema({
    guildId: { type: String, required: true },
    staffId: { type: String, required: true },
    memberId: { type: String, required: true },
    star: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, minlength: 5, maxlength: 200, required: true },
    date: { type: Date, default: new Date() }
});

const StaffAdviceModel = model('StaffAdvice', staffAdviceSchema, "staff-advices");

class StaffAdvice {
    /**
     * 
     * @param {String} guild 
     * @param {String} member 
     * @param {String} staff 
     * @param {Number} star 
     * @param {String} comment 
     * @returns {Promise<Object>}
     */
    static create(guild, member, staff, star, comment) {
        return localFetch(`/guild/${guild}/member/${member}/note`, "post", { staff, star, comment });
    }

    /**
     * 
     * @param {String} staff 
     * @returns 
     */
    static getByStaff(staff) {
        return StaffAdviceModel.find({ staffId: staff });
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} staff 
     * @returns {Promise<{stars:number, count: number}|false>}
     */
    static async getStaffScore(guild, staff) {
        var advices = await this.getByStaff(guild, staff);
        if (!advices || advices.length == 0) return { stars: 0, count: 0 };

        var votes = advices.map(a => a.star);
        var avg = average(votes);
        return { stars: Math.round(avg * 10) / 10, count: votes.length };
    }

    /**
     * 
     * @param {{stars:number, count: number}} score
     */
    static stringifyScore(score) {
        return `${score.stars} ${score.stars >= 4.5 ? ":star2:" : ":star:"} (${score.count})`;
    }

    /**
     * 
     * @param {String} member 
     * @returns 
     */
    static getByMember(member) {
        return StaffAdviceModel.find({ memberId: member });
    }
}

module.exports = { StaffAdviceModel, StaffAdvice, staffAdviceSchema };