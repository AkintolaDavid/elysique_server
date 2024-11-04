const mongojs = require("mongojs");

const db = mongojs("allureDB", ["products"]);

module.exports = db;
