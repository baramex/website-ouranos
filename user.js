const { default: axios } = require("axios");
const { db } = require("./database");

const { GUILD_ID } = process.env;

var sessions = [];
function checkExpired(date, duration) {
    return (date + duration) > new Date().getTime();
}

function removeSession(sessionID) {
    sessions.splice(sessions.findIndex(a => a.id == sessionID), 1);
}

// TODO: get user & update discord & check guild (other function return session + user) & session on mongo
function getSession(sessionID, discordID) {
    return sessions.find(a => a.id == sessionID && a.discord_id == discordID);
}

function createSession(token_type, access_token, expires_in, discord_id) {
    sessions = sessions.filter(a => a.discord_id != discord_id);
    var obj = { id: generateID(15), token: generateID(30), token_type, access_token, discord_id, expires_in, date: new Date().getTime() };
    sessions.push(obj);
    return obj;
}

async function insertOrUpdateUser(id, data) {
    if (await getUser(id).catch(console.error)) updateUser(id, { $set: data });
    else db.collection("users").insertOne({ ...data, lastDiscordUpdate: new Date().getTime(), date: new Date().getTime() }).catch(console.error);
    return data;
}

function getUser(id) {
    return new Promise((res, rej) => {
        db.collection("users").findOne({ id }).then(doc => {
            if (doc) return res(doc);
            else rej();
        }).catch(console.error);
        if (u) return res(u);
    });
}

async function updateUser(id, data) {
    if (await getUser(id).catch(console.error)) db.collection("users").updateOne({ id }, data).catch(console.error);
    else return false;
    return true;
}

function parseDiscordInfo(token_type, access_token) {
    return new Promise((res, rej) => {
        axios.get("https://discord.com/api/users/@me", { headers: { authorization: token_type + " " + access_token } }).then(user => {
            if (!user?.data) return rej("InvalidToken");
            axios.get("https://discord.com/api/users/@me/guilds", { headers: { authorization: token_type + " " + access_token } }).then(guilds => {
                if (guilds?.data) {
                    var obj = await insertOrUpdateUser(user.data.id, { id: user.data.id, color: user.data.banner_color, username: user.data.username, discriminator: user.data.discriminator, guild: guilds.data.find(a => a.id == GUILD_ID), avatar_url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.png`, lastDiscordUpdate: new Date().getTime() }).catch(console.error);
                    res(obj);
                }
                else rej("InvalidGuilds");
            }).catch(err => { console.error(err?.response?.data); rej(); });
        }).catch(err => { console.error(err?.response?.data); rej(); });
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

setInterval(() => {
    sessions = sessions.filter(a => !checkExpired(a.date, a.expires_in * 1000));
}, 1000 * 60 * 30);

module.exports = { getUser, createSession, insertOrUpdateUser, generateID, getSession, removeSession, parseDiscordInfo };