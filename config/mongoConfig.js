const mongojs = require("mongojs");

const db = mongojs("elysique", ["products"]);

module.exports = db;
