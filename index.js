const PORT = 2022;

require("dotenv").config();

const path = require("path");

const express = require("express");
const server = express();

const rateLimit = require('express-rate-limit');
const baseLimiter = rateLimit({
    windowMs: 1000 * 5,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false
});

const { createSession, parseDiscordInfo, discordFetch } = require("./user");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

server.use(baseLimiter);
server.use(express.static("./resources"));
server.use(bodyParser.json());
server.use(cookieParser());
server.use((req, res, next) => {
    req.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    next();
});

server.use("/api", rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
}), require("./api").router);

server.listen(PORT, () => {
    console.log("Server started in port " + PORT);
});

const { CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URI } = process.env;

server.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "pages", "index.html"));
});

server.get("/account", (req, res) => {
    return res.sendFile(path.join(__dirname, "pages", "account.html"));
});

server.get(rateLimit({
    windowMs: 1000 * 60 * 10,
    max: 4,
    standardHeaders: true,
    legacyHeaders: false
}), "/discord-auth", async (req, res) => {
    try {
        var code = req.query.code;
        if (!code) throw new Error("InvalidRequest");

        try {
            var result = await discordFetch("/oauth2/token", null, null, "post", `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
            if (!result) throw new Error("UnexpectedError");

            var expires_in = result.expires_in;
            var token_type = result.token_type;
            var access_token = result.access_token;

            var user = await parseDiscordInfo(token_type, access_token, true);
            if (!user.guild) throw new Error("NotInTheGuild");

            var s = await createSession(token_type, access_token, expires_in, user.id, req.ipInfo.ip);

            var date = new Date(s.date + s.expires_in * 1000);
            res.cookie("sessionID", s._id, { expires: date });
            res.cookie("userID", s.discord_id, { expires: date });
            res.cookie("token", s.token, { expires: date });

            return res.status(200).cookie("popup", JSON.stringify({ type: "success", content: "message:Logged" })).redirect(URL + "/account#account");
        } catch (error) {
            console.error(error?.response || error);
            return resolve(_res);
        }
    } catch (error) {
        res.cookie("popup", JSON.stringify({ type: "error", content: "message:" + error.message }));
        res.status(400).redirect(URL + "/account#account");
    }
});