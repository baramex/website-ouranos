const PORT = 2022;

require("dotenv").config();

const path = require("path");

const express = require("express");
const server = express();

const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { default: axios } = require("axios");
server.use(express.static("./resources"));
server.use(bodyParser.json());
server.use(cookieParser());
server.listen(PORT, () => {
    console.log("Server started in " + PORT);
});

const sessions = [];

server.use("*", async (req, res, next) => {
    var sessionID = req.cookies.sessionID;
    var discordID = req.cookies.userID;
    if (!sessionID || !discordID) return next();
    var session = sessions.find(a => a.id == sessionID && a.discordID == discordID);

    if (!session || checkExpired(session.date + session.expireIn * 1000)) {
        res.clearCookie("sessionID");
        res.clearCookie("discordID");

        return next();
    }

    req.session = session;
    next();
});

server.use("/api", limiter, require("./api"));

server.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "resources", "pages", "index.html"));
});

function checkExpired(expiredTime) {
    return expiredTime < new Date().getTime();
}

function getUser(tokenType, accessToken) {
    /*return new Promise((res, rej) => {
        axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: (tokenType) + " " + (accessToken)
            }
        }).then(r => res(r.data)).catch(err => rej(err?.response?.data));
    });*/
}