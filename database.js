const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
/**
 * @type {mongo.Db}
 */
var dbCache;

var listeners = [];

function getDB(callback) {
    if (dbCache) callback(dbCache);
    else listeners.push(callback);
}

module.exports.getDB = getDB;
MongoClient.connect(process.env.DB, async (err, client) => {
    if (err) return console.error(err);

    dbCache = client.db(process.env.DB_NAME);

    listeners.forEach(l => l(dbCache));
    listeners = [];

    if (!await dbCache.collection("sessions").indexExists("expire").catch(console.error)) {
        dbCache.collection("sessions").createIndex({ date: 1 }, { expireAfterSeconds: 604800, name: "expire" }).catch(console.error);
    }
});