const momenttz = require("moment-timezone");

const express = require("express");
const { Session } = require("./models/session.model");
const { User, UserModel } = require("./models/user.model");
const { checkExpired } = require("./utils/methods");
const { requiresAuthentification } = require("./utils/middleware");
const router = express.Router();

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

router.post("/disconnect", requiresAuthentification, async (req, res) => {
    try {
        await Session.disable(req.session._id);
        return res.status(201).send("Logout");
    } catch (error) {
        console.error(error);
        return res.status(400).send(error.message);
    }
});

router.get("/user/:id/infractions/count", requiresAuthentification, async (req, res) => {
    try {
        var id = req.params.id;
        if (id != "@me") return res.status(403).send("Unauthorized");

        var count = await User.getInfractionsCount(req.user._id);

        res.status(200).json(count);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error.message);
    }
});

router.put("/user/@me/presentation", requiresAuthentification, async (req, res) => {
    try {
        if (req.user.grades.basic.length == 0 && req.user.grades.challenge.length == 0) return res.status(403).send("Unauthorized");

        var presentation = req.body.presentation;
        await UserModel.updateOne({ id: req.user.id }, { presentation }, { runValidators: true });

        return res.status(200).send(presentation);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error.message);
    }
});

router.get("/user/:id/:type", requiresAuthentification, async (req, res, next) => {
    try {
        var id = req.params.id;
        var type = req.params.type;
        if (id != "@me") return res.status(403).send("Unauthorized");
        if (!["partial", "complete"].includes(type)) return next();

        var exclude = ["_id", "lastDiscordUpdate"];
        if (req.path.includes("partial")) exclude.push("grades", "guilds");

        var projection = req.query.projection?.replace(/ /g, ",")?.split(",")?.splice(0, 15);

        var partial = null;
        if (((projection.includes("grades") && !exclude.includes("grades")) || (projection.includes("guilds") && !exclude.includes("guilds"))) && checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 5)) {
            partial = false;
        }
        else if (checkExpired(req.user.lastDiscordUpdate, 1000 * 60 * 5)) {
            partial = true;
        }
        if (partial !== null) {
            if (partial) {
                fetchUser = await User.fetchUser(req.session.tokenType, req.session.accessToken);
                req.user = await User.update(fetchUser);
            }
            else {
                var f = await User.fetchAll(req.session.tokenType, req.session.accessToken);
                req.user = await User.update(f.user, f.guilds, f.grades);
            }
        }

        var obj = {};
        Object.entries(req.user._doc).forEach(val => {
            if ((projection ? projection.includes(val[0]) : true) && !exclude.includes(val[0])) obj[val[0]] = val[1];
        });

        return res.status(200).json(obj);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error.message);
    }
});

function formatDate(date) {
    date = momenttz(date.getTime()).tz("Europe/Paris")._d;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
}

module.exports = { router, formatDate };