// constants
const PORT = 2022;

require("dotenv").config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DB, { dbName: process.env.DB_NAME }).then(() => {
    console.log("Connected to mongodb !");
}, console.error);

const path = require("path");

// express
const express = require("express");
const server = express();

const rateLimit = require('express-rate-limit');
const baseLimiter = rateLimit({
    windowMs: 1000 * 5,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false
});

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { discordFetch } = require("./utils/fetch");
const { User } = require("./models/user.model");
const { Session } = require("./models/session.model");
const { isAuthenticated } = require("./utils/middleware");

// middleware
server.use(baseLimiter);
server.use(express.static("./resources"));
server.use(bodyParser.json());
server.use(cookieParser());
server.use((req, res, next) => {
    req.publicIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    next();
});

server.use("/api", rateLimit({
    windowMs: 5 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
}), require("./api").router);

server.listen(PORT, () => {
    console.log("Server started in port " + PORT);
});

const { CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URI } = process.env;

// routes
server.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "pages", "index.html"));
});

server.get("/account", isAuthenticated, (req, res) => {
    if (!req.isAuthenticated) return res.redirect("/discord-oauth");
    return res.sendFile(path.join(__dirname, "pages", "account.html"));
});

server.get("/discord/basic", (req, res) => res.redirect("https://discord.gg/6rvTAf5XXy"));
server.get("/discord/certif", (req, res) => res.redirect("https://discord.gg/YZaMVJp7dh"));

server.get("/discord-oauth", rateLimit({
    windowMs: 1000 * 60 * 10,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false
}), isAuthenticated, async (req, res) => {
    try {
        if (req.isAuthenticated) throw new Error("AlreadyAuthenticated");

        var code = req.query.code;
        if (!code) return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20email%20guilds`);

        var result = await discordFetch("/oauth2/token", "post", null, null, `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
        if (!result) throw new Error("UnexpectedError");

        var expiresIn = result.expires_in;
        var tokenType = result.token_type;
        var accessToken = result.access_token;

        var fetchUser = await User.fetchUser(tokenType, accessToken);
        var fetchGuilds = await User.fetchGuilds(tokenType, accessToken);

        var user = await User.insertOrUpdate(fetchUser.id, fetchUser.username, fetchUser.email, fetchUser.discriminator, `https://cdn.discordapp.com/avatars/${fetchUser.id}/${fetchUser.avatar}.webp`, fetchGuilds, new Date());

        var session = await Session.getByUserId(user.id);
        if (!session) session = await Session.create(user.id, { tokenType, accessToken, expiresIn }, req.publicIp);
        else {
            session.tokenType = tokenType;
            session.accessToken = accessToken;
            session.expiresIn = expiresIn;
            session.date = new Date();
            if (!session.ips.includes(req.publicIp)) session.ips.push(req.publicIp);
            await session.save();
        }

        var date = new Date(session.date.getTime() + expiresIn * 1000);
        res.cookie("sessionID", session._id.toString(), { expires: date });
        res.cookie("userID", session.discordId, { expires: date });
        res.cookie("token", session.token, { expires: date });

        return res.cookie("popup", JSON.stringify({ type: "success", content: "message:Logged" })).redirect("/account#account");
    } catch (error) {
        res.cookie("popup", JSON.stringify({ type: "error", content: "message:" + error.message }));
        res.status(400).redirect("/");
    }
});