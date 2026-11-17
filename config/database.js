require("dotenv").config();

const configurations = require("./config.json");
const production = configurations.production;

module.exports = {
  ...configurations,
  production: {
    ...production,
    host: process.env.POSTGRES_HOST || production.host,
    username: process.env.POSTGRES_USER || production.username,
    password: process.env.POSTGRES_PASSWORD || production.password,
    database: process.env.POSTGRES_DB || production.database,
  },
};
