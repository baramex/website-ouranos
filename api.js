const momenttz = require("moment-timezone");

const express = require("express");
const { getUser, removeSession } = require("./user");
const router = express.Router();

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

router.post("/disconnect", (req, res) => {
    var token = req.headers.authorization;
    if (!token) return res.status(401).send("TokenNull");

    token = token.replace("token ", "");
    if (!req.session || req.session.token != token) return res.status(403).send("Unauthorized");

    removeSession(req.session.id);

    return res.sendStatus(201);
});

router.get("/user", async (req, res) => {
    if (!req.session || req.session.token != token) return res.status(403).send("Unauthorized");

    var user = await getUser(req.session.discord_id, req.session.token_type, req.session.access_token).catch(console.error);
    if (!user) return res.status(403).send("Unauthorized");

    return res.status(200).json({ user });
});

function formatDate(date) {
    date = momenttz(date.getTime()).tz("Europe/Paris")._d;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
}

module.exports = { router, formatDate };