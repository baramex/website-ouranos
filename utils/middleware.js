const { ObjectId } = require("mongodb");
const { Session } = require("../models/session.model");
const { User } = require("../models/user.model");

async function requiresAuthentification(req, res, next) {
    try {
        var sessionID = new ObjectId(req.cookies.sessionID);
        var discordID = req.cookies.userID;
        var token = req.cookies.token;
        if (!sessionID || !discordID || !token) throw new Error();

        var session = await Session.getSession(sessionID, discordID, token, req.publicIp);
        if (!session) throw new Error();

        var user = await User.getByDiscordId(session.discordId);
        if (!user) throw new Error();

        req.session = session;
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).send("InvalidSession");
    }
}

async function isAuthenticated(req, res, next) {
    try {
        var sessionID = new ObjectId(req.cookies.sessionID);
        var discordID = req.cookies.userID;
        var token = req.cookies.token;
        if (!sessionID || !discordID || !token) throw new Error();

        var session = await Session.getSession(sessionID, discordID, token, req.publicIp);
        if (!session) throw new Error();

        var user = await User.getByDiscordId(session.discordId);
        if (!user) throw new Error();

        req.isAuthenticated = true;
        next();
    } catch (error) {
        req.isAuthenticated = false;
        next();
    }
}

module.exports = { requiresAuthentification, isAuthenticated };