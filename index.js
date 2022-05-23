const PORT = 2022;

require("dotenv").config();

const path = require("path");

const express = require("express");
const server = express();

const rateLimit = require('express-rate-limit')
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    standardHeaders: true,
    legacyHeaders: false,
});
const loginLimiterHour = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { default: axios } = require("axios");
const { createSession, parseDiscordInfo, discordFetch } = require("./user");
server.use(express.static("./resources"));
server.use(bodyParser.json());
server.use(cookieParser());
server.listen(PORT, () => {
    console.log("Server started in port " + PORT);
});

const { CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URI } = process.env;

server.use("/api", apiLimiter, require("./api").router);
server.use("/discord-auth", loginLimiter, loginLimiterHour);

server.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "resources", "pages", "index.html"));
});

server.get("/account", (req, res) => {
    return res.sendFile(path.join(__dirname, "resources", "pages", "account.html"));
});

server.get("/discord-auth", async (req, res) => {
    var code = req.query.code;

    var _res = { status: 400, message: "Unexpected" };
    if (!code) return resolve(_res);

    try {
        var result = await discordFetch("/oauth2/token", null, null, "post", `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
        if (!result) return resolve(_res);

        var expires_in = result.expires_in;
        var token_type = result.token_type;
        var access_token = result.access_token;

        var user = await parseDiscordInfo(token_type, access_token, true);
        if (!user.guild) return resolve({ status: 400, message: "NotInTheServer" });

        var s = await createSession(token_type, access_token, expires_in, user.id);

        res.cookie("sessionID", s._id, { expires: new Date(s.date + s.expires_in * 1000) });
        res.cookie("userID", s.discord_id, { expires: new Date(s.date + s.expires_in * 1000) });
        res.cookie("token", s.token);

        return resolve({ status: 200, message: "Logged" });
    } catch (error) {
        console.error(error?.response || error);
        return resolve(_res);
    }

    function resolve(response) {
        res.cookie("popup", JSON.stringify({ type: response.status == 200 ? "success" : "error", content: "message:" + response.message }));
        res.status(response.status).redirect(URL);
    }
});