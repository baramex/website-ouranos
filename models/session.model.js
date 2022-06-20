const { Schema, model, ObjectId } = require("mongoose");
const token = require("random-web-token");

const { CLIENT_ID, CLIENT_SECRET } = process.env;

const session = new Schema({
    token: { type: String, required: true, unique: true },
    discordId: { type: String, required: true, unique: true },
    tokenType: { type: String, required: true },
    accessToken: { type: Number, required: true, unique: true },
    expireIn: { type: Number, required: true },
    ips: { type: [String], required: true },
    date: { type: Date, default: new Date() }
});

session.pre("save", function (next) {
    this.token = token.generate("extra", 30);
    next();
});

const SessionModel = model('Session', session);

class Session {
    /**
     * 
     * @param {String} discordId 
     * @param {Object} auth
     * @param {String} auth.tokenType
     * @param {String} auth.accessToken
     * @param {Number} auth.expireIn
     * @param {String} ip 
     * @returns 
     */
    static create(discordId, auth, ip) {
        return new Promise((res, rej) => {
            var doc = new SessionModel({ discordId, tokenType: auth.tokenType, accessToken: auth.accessToken, expireIn: auth.expireIn, active: true, ips: [ip] });
            doc.save(err => {
                if (err) rej(err);
                else res(doc);
            });
        });
    }

    /**
     * 
     * @param {ObjectId} id 
     */
    static disable(id) {
        var session = await SessionModel.findById(id, { accessToken: 1 });
        await discordFetch("/oauth2/token/revoke", null, null, "post", `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&token=${session.accessToken}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
        return SessionModel.updateOne({ _id: id }, { $unset: { tokenType: "", accessToken: "", token: "" }, $set: { active: false } });
    }

    /**
     * 
     * @param {ObjectId} id 
     * @param {String} ip 
     */
    static addIp(id, ip) {
        return SessionModel.updateOne({ _id: id }, { $push: { ips: ip } });
    }

    /**
     * 
     * @param {ObjectId} id 
     * @param {String} token 
     * @param {String} ip 
     */
    static getSession(id, token, ip) {
        return SessionModel.findOne({ _id: id, token, ip: { $all: [ip] } });
    }

    /**
     * 
     * @param {Date} date 
     * @param {Number} expireIn 
     */
    static checkExpired(date, expireIn) {
        return new Date().getTime() - date.getTime() > expireIn * 1000;
    }
}

module.exports = { SessionModel, Session };