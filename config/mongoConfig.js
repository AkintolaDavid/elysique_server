const mongojs = require("mongojs");

const db = mongojs("elysiqueDB", ["products"]);

module.exports = db;
