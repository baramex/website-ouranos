const { Schema, model } = require("mongoose");
const { default: isEmail } = require("validator/lib/isEmail");
const { localFetch, discordFetch } = require("../utils/fetch");
const { Ban } = require("./ban.model");
const { Kick } = require("./kick.model");
const { Mute } = require("./mute.model");
const { Warn } = require("./warn.model");

const { BASIC_GUILD_ID, CHALLENGE_GUILD_ID } = process.env;

const userSchema = new Schema({
    id: { type: String, unique: true, required: true },
    username: { type: String, required: true },
    discriminator: { type: String, required: true },
    email: { type: String, validate: isEmail },
    avatarURL: { type: String, default: "https://cdn.discordapp.com/embed/avatars/0.png" },

    guilds: { type: [String], required: true },
    lvl: { type: { basic: Number, challenge: Number, _id: false }, default: { basic: 1, challenge: 1 } },
    exp: { type: { basic: Number, challenge: Number, _id: false }, default: { basic: 0, challenge: 0 } },
    grades: {
        type: {
            basic: [{ id: String, name: String, prefix: String, position: Number, _id: false }],
            challenge: [{ id: String, name: String, prefix: String, position: Number, _id: false }],
            _id: false
        }, default: { basic: [], challenge: [] }
    },
    challenges: { type: [Object], default: [] },
    presentation: { type: String, maxLength: 256 },

    lastDiscordUpdate: { type: Date, default: 0 },
    date: { type: Date, default: new Date() }
});

const UserModel = model('User', userSchema, "users");

class User {
    /**
     * 
     * @param {String} member 
     * @param {String} username 
     * @param {String} discriminator 
     * @param {String} avatarURL 
     * @param {String[]} guilds 
     * @param {Date} joinedAt 
     * @returns 
     */
    static create(member, username, email, discriminator, avatarURL, guilds, joinedAt, grades) {
        return new Promise((res, rej) => {
            var user = new UserModel({ id: member, username, email, discriminator, avatarURL, guilds, date: joinedAt, grades });
            user.save(err => {
                if (err) rej(err);
                else res(user);
            });
        });
    }

    /**
     * 
     * @param {String} discordId 
     * @param {String} username 
     * @param {String} discriminator 
     * @param {String} avatarURL 
     * @param {[]} guilds 
     * @param {Date} joinedAt 
     * @returns 
     */
    static async insertOrUpdate(discordId, username, email, discriminator, avatarURL, guilds, joinedAt, grades) {
        var user = await User.getByDiscordId(discordId);
        if (guilds) {
            guilds = User.parseGuilds(guilds);
            if (guilds.length == 0) throw new Error("NotInTheServer");
        }

        if (!user) user = await User.create(member, username, email, discriminator, avatarURL, guilds, joinedAt, grades);
        else {
            user.username = username;
            user.discriminator = discriminator;
            user.avatarURL = avatarURL;
            if (email) user.email = email;
            if (guilds) user.guilds = guilds;
            if (grades) user.grades = grades;
            await user.save();
        }

        return user;
    }

    /**
     * 
     * @param {[]} id 
     * @returns 
     */
    static parseGuilds(guilds) {
        var arr = [];
        if (guilds.some(a => a.id == BASIC_GUILD_ID)) arr.push("basic");
        if (guilds.some(a => a.id == CHALLENGE_GUILD_ID)) arr.push("challenge");
        return arr;
    }

    /**
     * @param {String} user
     */
    static getById(user) {
        return UserModel.findById(user);
    }

    /**
     * @param {String} discordId
     */
    static getByDiscordId(discordId) {
        return UserModel.findOne({ discordId });
    }


    /**
     * @param {String} user
     */
    static getChallenges(user) {
        return UserModel.findOne({ id: user }, { challenges: 1 }).get("challenges");
    }

    static update({ id, username, email, discriminator, avatar }, guilds, grades) {
        return User.insertOrUpdate(id, username, email, discriminator, `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`, guilds, undefined, grades);
    }

    /**
     * 
     * @param {String} tokenType
     * @param {String} accessToken
     */
    static fetchUser(tokenType, accessToken) {
        return discordFetch("/users/@me", "get", tokenType, accessToken);
    }

    /**
     * 
     * @param {String} tokenType
     * @param {String} accessToken
     */
    static fetchGuilds(tokenType, accessToken) {
        return discordFetch("/users/@me/guilds", "get", tokenType, accessToken);
    }

    /**
     * 
     * @param {String} member 
     */
    static fetchGrades(member) {
        return localFetch(`/member/${member}/grades`, "get");
    }

    /**
     * @param {String} tokenType
     * @param {String} accessToken
     * @param {String} guild 
     */
    static async fetchAll(tokenType, accessToken) {
        var user = await User.fetchUser(tokenType, accessToken);
        var guilds = await User.fetchGuilds(tokenType, accessToken);
        var grades = await User.fetchGrades(user.id);
        return { user, guilds, grades };
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} member 
     * @returns {Promise<{ lvl:Number, exp:Number, maxExp:Number, rank:Number|undefined }>}
     */
    static async getLevel(guild, member, withRank = true) {
        var res = await localFetch(`/guild/${guild}/member/${member}/level?withRank=${withRank}`, "get");

        return { lvl, exp, maxExp, rank } = res;
    }

    /**
     * 
     * @param {number} level
     */
    static getMaxExp(level) {
        return ((level * 100 + level * 30) * (Math.round(level / 5) + 1));
    }

    /**
     * 
     * @param {Number} exp 
     * @param {Number} level 
     * @returns 
     */
    static getExp(exp, level) {
        while (exp >= User.getMaxExp(level)) {
            exp -= User.getMaxExp(level);
            level += 1;
        }
        return Math.round(exp);
    }

    /**
     * 
     * @param {Number} exp 
     * @param {Number} level 
     * @returns 
     */
    static getLevelFromExp(exp, level) {
        while (exp >= User.getMaxExp(level)) {
            exp -= User.getMaxExp(level);
            level += 1;
        }
        return level;
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} member 
     * @param {Number} exp
     * @returns {Promise<Number>}
     */
    static async addExp(guild, member, exp) {
        var res = await localFetch(`/guild/${guild}/member/${member}/level`, "put", { exp });

        return res;
    }

    /**
     * 
     * @param {String} guild 
     * @param {String} user 
     * @returns 
     */
    static async getInfractionsCount(user) {
        var b, w, k, m;
        b = await Ban.getByUser(user);
        k = await Kick.getByUser(user);
        m = await Mute.getByUser(user);
        w = await Warn.getByUser(user);
        return {
            basic: { bans: b.filter(a => a.guildId == BASIC_GUILD_ID).length, kicks: k.filter(a => a.guildId == BASIC_GUILD_ID).length, mutes: m.filter(a => a.guildId == BASIC_GUILD_ID).length, warns: w.filter(a => a.guildId == BASIC_GUILD_ID).length },
            challenge: { bans: b.filter(a => a.guildId == CHALLENGE_GUILD_ID).length, kicks: k.filter(a => a.guildId == CHALLENGE_GUILD_ID).length, mutes: m.filter(a => a.guildId == CHALLENGE_GUILD_ID).length, warns: w.filter(a => a.guildId == CHALLENGE_GUILD_ID).length }
        };
    }
}

module.exports = { UserModel, User, userSchema };