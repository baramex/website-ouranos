const { default: axios } = require("axios");
const { Db, ObjectId } = require("mongodb");
/**
 * @type {Db}
 */
var db;
require("./database").getDB(db_ => {
    db = db_;
})

const { GUILD_ID, CLIENT_ID, CLIENT_SECRET } = process.env;

function checkExpired(date, duration) {
    return (date + duration) > new Date().getTime();
}

function removeSession(session) {
    return new Promise(async (res, rej) => {
        try {
            await discordFetch("/oauth2/token/revoke", null, null, "post", `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&token=${session.access_token}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
            await db.collection("sessions").deleteOne({ _id: new ObjectId(session._id) });
            res();
        } catch (error) {
            console.error(error);
            rej(error);
        }
    });
}

function getSession(sessionID, discordID) {
    return db.collection("sessions").findOne({ _id: new ObjectId(sessionID), discord_id: discordID });
}

function createSession(token_type, access_token, expires_in, discord_id) {
    return new Promise(async (res, rej) => {
        try {
            await db.collection("sessions").deleteOne({ discord_id });
            var obj = { token: generateID(30), token_type, access_token, discord_id, expires_in, date: new Date().getTime() };
            obj._id = (await db.collection("sessions").insertOne(obj)).insertedId.toString();
        } catch (error) {
            console.error(error);
            return rej(error);
        }
        res(obj);
    });
}

function insertOrUpdateUser(id, data) {
    return new Promise(async (res, rej) => {
        try {
            var newdat = { ...data, date: new Date().getTime() };
            if (!await updateUser(id, { $set: data })) await db.collection("users").insertOne(newdat);
        } catch (error) {
            console.error(error);
            return rej(error);
        }
        res(newdat);
    });
}

function getUser(id) {
    return db.collection("users").findOne({ id });
}

function updateUser(id, data) {
    return new Promise(async (res, rej) => {
        try {
            if (await getUser(id)) await db.collection("users").updateOne({ id }, data);
            else res(false);
            res(true);
        } catch (error) {
            console.error(error);
            rej(error);
        }
    });
}

function parseDiscordInfo(token_type, access_token, partial) {
    return new Promise(async (res, rej) => {
        try {
            var user = await discordFetch("/users/@me", token_type, access_token);
            if (!user) return rej("InvalidToken");
            var guilds = await discordFetch("/users/@me/guilds", token_type, access_token);
            var member = null;
            if (guilds && guilds.find(a => a.id == GUILD_ID) && !partial) {
                member = await axios.get("http://localhost:2023/member/" + user.id);
            }
            var obj = await insertOrUpdateUser(user.id, { id: user.id, guild: guilds.find(a => a.id == GUILD_ID), guild_member: member ? { nickname: member.nick, joined_at: member.joined_at, grades: member.grades } : undefined, username: user.username, discriminator: user.discriminator, email: user.email, avatar_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`, lastDiscordUpdate: new Date().getTime() });
            res(obj);
        } catch (error) {
            console.error(error?.response || error);
            return rej(error?.response || error);
        }
    });
}

var ratesLimit = [];
function discordFetch(endpoint, token_type, access_token, customMethod, customData, customHeader) {
    return new Promise((res, rej) => {
        var curr = ratesLimit.find(a => a.endpoint == endpoint);
        if (curr && curr.remaing <= 1) {
            setTimeout(() => {
                res(discordFetch(endpoint, token_type, access_token, customMethod, customData, customHeader));
            }, (curr.reset_after * 1000) || 1000);
        }
        else {
            var headers = customHeader || { authorization: token_type + " " + access_token };
            axios({
                url: "https://discord.com/api" + endpoint,
                method: customMethod || "get",
                headers,
                data: customData || null
            }).then(response => {
                if (!ratesLimit.find(a => a.endpoint == endpoint)) ratesLimit.push({ endpoint });
                ratesLimit.find(a => a.endpoint == endpoint).remaing = response.headers["X-RateLimit-Remaining"];
                ratesLimit.find(a => a.endpoint == endpoint).reset_after = response.headers["X-RateLimit-Reset-After"];
                res(response.data);
            }, error => {
                rej(error?.response);
            });
        }
    });
}

function generateID(l) {
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = "";
    for (var i = 0; i < l; i++) {
        var j = (Math.random() * (a.length - 1)).toFixed(0);
        b += a[j];
    }
    return b;
}

module.exports = { getUser, createSession, insertOrUpdateUser, generateID, getSession, removeSession, parseDiscordInfo, checkExpired, discordFetch };