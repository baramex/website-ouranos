const { default: axios } = require("axios");
const { db } = require("./database");

const { GUILD_ID } = process.env;

function checkExpired(date, duration) {
    return (date + duration) > new Date().getTime();
}

function removeSession(sessionID) {
    return db.collection("sessions").deleteOne({ _id: sessionID });
}

function getSession(sessionID, discordID) {
    return db.collection("sessions").findOne({ _id: sessionID, discord_id: discordID });
}

function createSession(token_type, access_token, expires_in, discord_id) {
    return new Promise(async (res, rej) => {
        try {
            await db.collection("sessions").deleteOne({ discord_id });
            var obj = { token: generateID(30), token_type, access_token, discord_id, expires_in, date: new Date().getTime() };
            await db.collection("sessions").insertOne(obj);
        } catch (error) {
            return rej(error);
        }
        res(obj);
    });
}

function insertOrUpdateUser(id, data) {
    return new Promise(async (res, rej) => {
        try {
            var newdat = { ...data, lastDiscordUpdate: new Date().getTime(), date: new Date().getTime() };
            if (!await updateUser(id, { $set: data })) db.collection("users").insertOne(newdat);
        } catch (error) {
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
            if (await getUser(id)) db.collection("users").updateOne({ id }, { $set: data });
            else res(false);
            res(true);
        } catch (error) {
            rej(error);
        }
    });
}

function parseDiscordInfo(token_type, access_token) {
    return new Promise((res, rej) => {
        try {
            axios.get("https://discord.com/api/users/@me", { headers: { authorization: token_type + " " + access_token } }).then(user => {
                if (!user.data) return rej("InvalidToken");
                axios.get("https://discord.com/api/users/@me/guilds", { headers: { authorization: token_type + " " + access_token } }).then(async guilds => {
                    if (guilds.data) {
                        var obj = await insertOrUpdateUser(user.data.id, { id: user.data.id, color: user.data.banner_color, username: user.data.username, discriminator: user.data.discriminator, guild: guilds.data.find(a => a.id == GUILD_ID), avatar_url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.png`, lastDiscordUpdate: new Date().getTime() });
                        res(obj);
                    }
                    else rej("InvalidGuilds");
                });
            });
        } catch (error) {
            return rej(error?.response || error);
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

module.exports = { getUser, createSession, insertOrUpdateUser, generateID, getSession, removeSession, parseDiscordInfo, checkExpired };