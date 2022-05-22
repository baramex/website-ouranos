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
const { createSession, parseDiscordInfo } = require("./user");
server.use(express.static("./resources"));
server.use(bodyParser.json());
server.use(cookieParser());
server.listen(PORT, () => {
    console.log("Server started in " + PORT);
});

const { CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URI } = process.env;

server.use("/api", limiter, require("./api").router);

server.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "resources", "pages", "index.html"));
});

server.get("/discord-auth", async (req, res) => {
    var code = req.query.code;

    var response = await new Promise((resolve, reject) => {
        var _res = { status: 400, message: "Unexpected" };
        if (!code) resolve(_res);

        try {
            axios.post("https://discord.com/api/oauth2/token", `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`, { 'Content-Type': 'application/x-www-form-urlencoded' }).then(result => {
                if (!result) resolve(_res);

                var expires_in = result.data.expires_in;
                var token_type = result.data.token_type;
                var access_token = result.data.access_token;

                parseDiscordInfo(token_type, access_token).then(async user => {
                    if (!user.guild) return resolve({ status: 400, message: "NotInTheServer" });

                    var s = await createSession(token_type, access_token, expires_in, user.id);
                    res.cookie("sessionID", s.id, { expires: new Date(s.date + s.expires_in * 1000) });
                    res.cookie("userID", s.discord_id, { expires: new Date(s.date + s.expires_in * 1000) });
                    res.cookie("token", s.token);

                    resolve({ status: 200, message: "Logged" });
                });
            });
        } catch (error) {
            resolve(_res);
        }

    });

    res.cookie("popup", JSON.stringify({ type: response.status == 200 ? "success" : "error", content: "message:" + response.message }));
    res.status(response.status).redirect(URL);
});