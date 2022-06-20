const momenttz = require("moment-timezone");

const express = require("express");
const { getUser, removeSession, checkExpired, parseDiscordInfo, getSession, getInfractionsCount, getStaffAdvicesGiven } = require("./user");
const router = express.Router();

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

async function auth(req, res) {
    try {
        var sessionID = req.cookies.sessionID;
        var discordID = req.cookies.userID;
        var token = req.cookies.token;
        if (!sessionID || !discordID || !token) return wrongSession();

        var session = await getSession(sessionID, discordID, req.ipInfo.ip);
        if (!session || session.token != token) return wrongSession();

        var user = await getUser(session.discord_id);
        if (!user) return wrongSession();

        req.session = session;
        req.user = user;
        return true;
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }

    function wrongSession() {
        res.clearCookie("sessionID");
        res.clearCookie("discordID");
        res.clearCookie("token");

        res.status(401).send("InvalidSession");
    }
}

router.post("/disconnect", async (req, res) => {
    if (!await auth(req, res).catch(console.error)) return;

    try {
        await removeSession(req.session);
    } catch (error) {
        console.error(error);
        return res.sendStatus(400);
    }

    return res.status(201).send("Logout");
});

router.get("/user/:id/staff-advices/all", async (req, res) => {
    var id = req.params.id;
    if (id != "@me") return res.status(403).send("Unauthorized");

    if (!await auth(req, res).catch(console.error)) return;

    var advices = await getStaffAdvicesGiven(req.user).catch(console.error);

    res.status(200).json(advices);
});

router.get("/user/:id/infractions/count", async (req, res) => {
    var id = req.params.id;
    if (id != "@me") return res.status(403).send("Unauthorized");

    if (!await auth(req, res).catch(console.error)) return;

    var count = await getInfractionsCount(req.user).catch(console.error);

    res.status(200).json(count);
});

router.get("/user/:id/:type", async (req, res, next) => {
    var id = req.params.id;
    var type = req.params.type;
    if (id != "@me") return res.status(403).send("Unauthorized");
    if (!["partial", "complete"].includes(type)) return next();

    if (!await auth(req, res).catch(console.error)) return;

    var exclude = ["_id", "guild", "lastDiscordUpdate"];
    if (req.path.includes("partial")) exclude.push("grades");

    var projection = req.query.projection?.replace(/ /g, ",")?.split(",")?.splice(0, 10);

    var partial = null;
    if (projection.includes("grades") && !exclude.includes("grades") && (!checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 6) || (!req.user.grades && !checkExpired(req.user.lastDiscordUpdate, 1000 * 5)))) {
        partial = false;
    }
    else if (!checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 6) || (!req.user.guild && !checkExpired(req.user.lastDiscordUpdate, 1000 * 5))) {
        partial = true;
    }
    if (partial !== null) {
        await parseDiscordInfo(req.session.token_type, req.session.access_token, partial).catch(err => { console.error(err) });
        req.user = await getUser(req.user.id).catch(console.error);
        if (!req.user) return res.sendStatus(403);
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