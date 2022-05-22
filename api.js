const momenttz = require("moment-timezone");

const express = require("express");
const { getUser, removeSession, checkExpired, parseDiscordInfo, getSession } = require("./user");
const router = express.Router();

var authenticated = ["/api/disconnect", "/api/user"];

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

router.use("*", async (req, res, next) => {
    if (!authenticated.includes(req.path)) return next();

    try {
        var sessionID = req.cookies.sessionID;
        var discordID = req.cookies.userID;
        var token = req.cookies.token;
        if (!sessionID || !discordID || !token) return wrongSession();

        var session = getSession(sessionID, discordID);
        if (!session || session.token != token) return wrongSession();

        var user = getUser(session.discord_id);
        if (!user) return wrongSession();

        var up_ = true;
        if (checkExpired(user.lastDiscordUpdate, 1000 * 60 * 30) || (!user.guild && checkExpired(user.lastDiscordUpdate, 1000 * 5))) {
            await parseDiscordInfo(session.token_type, session.access_token).then(user => {
                if (!user.guild) {
                    up_ = false;
                    return res.status(400).send("NotInTheServer");
                }
            });
        }
        if (!up_) return;

        req.session = session;
        req.user = user;
        next();
    } catch (error) {
        res.sendStatus(401);
    }


    function wrongSession() {
        res.clearCookie("sessionID");
        res.clearCookie("discordID");
        res.clearCookie("token");

        res.sendStatus(401);
    }
});

router.post("/disconnect", (req, res) => {
    if (!req.session || !req.user) return res.status(403).send("Unauthorized");

    try {
        removeSession(req.session.id);
    } catch (error) {
        return res.sendStatus(400);
    }

    return res.sendStatus(201);
});

router.get("/user", async (req, res) => {
    if (!req.session || !req.user) return res.status(403).send("Unauthorized");

    return res.status(200).json(req.user);
});

function formatDate(date) {
    date = momenttz(date.getTime()).tz("Europe/Paris")._d;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
}

module.exports = { router, formatDate };