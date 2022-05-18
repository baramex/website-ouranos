const { default: axios } = require("axios");


const { GUILD_ID } = process.env;

var sessions = [];
var users = [];

function checkExpired(date, duration) {
    return (date + duration) > new Date().getTime();
}

function removeSession(sessionID) {
    sessions.splice(sessions.findIndex(a => a.id == sessionID), 1);
}

function getSession(sessionID, discordID) {
    return sessions.find(a => a.id == sessionID && a.discord_id == discordID);
}

function createSession(token_type, access_token, expires_in, user) {
    sessions = sessions.filter(a => a.discord_id != user.id);
    var obj = { id: generateID(15), token: generateID(30), token_type, access_token, discord_id: user.id, expires_in, date: new Date().getTime() };
    sessions.push(obj);
    return obj;
}

function addUser(id, color, username, discriminator, avatar_url) {
    users = users.filter(a => a.id != id);
    var obj = { id, color, username, discriminator, avatar_url, expires_in: 60 * 60 * 24, date: new Date().getTime() };
    users.push(obj);
    return obj;
}

function getUser(id, token_type, access_token) {
    return new Promise((res, rej) => {
        var u = users.find(a => a.id == id);
        if (u) return res(u);

        axios.get("https://discord.com/api/users/@me", { headers: { authorization: token_type + " " + access_token } }).then(user => {
            if (!user?.data) return rej();
            axios.get("https://discord.com/api/users/@me/guilds", { headers: { authorization: token_type + " " + access_token } }).then(async r => {
                if (r?.data && r.data.find(a => a.id == GUILD_ID)) {
                    u = addUser(user.data.id, user.data.banner_color, user.data.username, user.data.discriminator, `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.png`);
                    res(u);
                }
                else rej("NotOnTheServer");
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
    users = users.filter(a => !checkExpired(a.date, a.expires_in * 1000));
}, 1000 * 60 * 30);

module.exports = { getUser, createSession, addUser, generateID, getSession, removeSession };