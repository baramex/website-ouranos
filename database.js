const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
/**
 * @type {mongo.Db}
 */
var db;
MongoClient.connect(process.env.DB, function (err, client) {
    if (err) return console.error(err);

    db = client.db(rocess.env.DB_NAME);
});

module.exports.db = db;