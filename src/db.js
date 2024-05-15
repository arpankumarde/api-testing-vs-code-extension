// const fs = require("fs");

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_PORT,
  DB_AUTH_CERT,
} = require("./data.js");

const config = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
  ssl: {
    // ca: fs.readFileSync("certificate.crt.pem"),
    ca: DB_AUTH_CERT,
  },
};

module.exports = { config };
