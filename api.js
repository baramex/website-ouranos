const momenttz = require("moment-timezone");

const express = require("express");
const { getUser, removeSession, checkExpired, parseDiscordInfo, getSession } = require("./user");
const router = express.Router();

var authenticated = ["/api/disconnect", "/api/user/partial", "/api/user/complete"];

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

router.use("*", async (req, res, next) => {
    if (!authenticated.includes(req.baseUrl)) return next();

    try {
        var sessionID = req.cookies.sessionID;
        var discordID = req.cookies.userID;
        var token = req.cookies.token;
        if (!sessionID || !discordID || !token) return wrongSession();

        var session = await getSession(sessionID, discordID);
        if (!session || session.token != token) return wrongSession();

        var user = await getUser(session.discord_id);
        if (!user) return wrongSession();

        req.session = session;
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }

    function wrongSession() {
        res.clearCookie("sessionID");
        res.clearCookie("discordID");
        res.clearCookie("token");

        res.sendStatus(401);
    }
});

router.post("/disconnect", async (req, res) => {
    if (!req.session || !req.user) return res.status(403).send("Unauthorized");

    try {
        await removeSession(req.session);
    } catch (error) {
        console.error(error);
        return res.sendStatus(400);
    }

    return res.sendStatus(201);
});

router.get(/\/user\/(partial|complete)/, async (req, res) => {
    if (!req.session || !req.user) return res.status(403).send("Unauthorized");

    var exclude = ["_id", "guild", "lastDiscordUpdate"];
    if (req.path.includes("partial")) exclude.push("guild_member");

    var projection = req.query.projection?.replace(/ /g, ",")?.split(",")?.splice(0, 10);

    var partial = null;
    if (projection.includes("guild_member") && !exclude.includes("guild_member") && (!checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 30) || (!user.guild_member && !checkExpired(req.user.lastDiscordUpdate, 1000 * 5)))) {
        partial = false;
    }
    else if (!checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 30) || (!req.user.guild && !checkExpired(req.user.lastDiscordUpdate, 1000 * 5))) {
        partial = true;
    }
    if (partial != null) {
        req.user = await parseDiscordInfo(req.session.token_type, req.session.access_token, partial);
        if (!req.user.guild) {
            return res.status(400).send("NotInTheServer");
        }
    }

    var obj = {};
    Object.entries(req.user).forEach(val => {
        if ((projection ? projection.includes(val[0]) : true) && !exclude.includes(val[0])) obj[val[0]] = val[1];
    });

    return res.status(200).json(obj);
});

function formatDate(date) {
    date = momenttz(date.getTime()).tz("Europe/Paris")._d;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
}

module.exports = { router, formatDate };