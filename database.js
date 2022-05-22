const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
/**
 * @type {mongo.Db}
 */
var db;
MongoClient.connect(process.env.DB, function (err, client) {
    if (err) return console.error(err);

    db = client.db(rocess.env.DB_NAME);

    if (!await db.collection("sessions").indexExists("expire").catch(console.error)) {
        db.collection("sessions").createIndex({ date: 1 }, { expireAfterSeconds: 604800, name: "expire" }).catch(console.error);
    }
});

module.exports.db = db;