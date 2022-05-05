const momenttz = require("moment-timezone");

const express = require("express");
const router = express.Router();

router.use("*", (req, res, next) => {
    if (!(req.headers.origin || req.headers.referer || "").replace("www.", "").startsWith(process.env.URL) || req.headers["sec-fetch-site"] != "same-origin") return res.sendStatus(403);
    next();
});

router.post("/disconnect", (req, res) => {
    var token = req.headers.authorization;
    if (!token) return res.status(401).send("TokenNull");

    token = token.replace("token ", "");
    if (!req.session || req.session.token != token) return res.status(403).send("InvalideToken");

    sessions.splice(sessions.findIndex(a => a.id == req.session.id), 1);

    return res.sendStatus(201);
});

router.get("/user", (req, res) => {
    var token = req.headers.authorization;
    if (!token) return res.status(401).send("TokenNull");

    token = token.replace("token ", "");
    if (!req.session || req.session.token != token) return res.status(403).send("InvalideToken");

    var user = getUser(req.session.token_type, req.session.access_token, req.session.discordID);
    if (!user) return res.status(403).send("InvalideToken");

    return res.status(200).json({ user });
});

function formatDate(date) {
    date = momenttz(date.getTime()).tz("Europe/Paris")._d;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
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

module.exports = router;