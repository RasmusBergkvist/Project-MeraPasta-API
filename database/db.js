//Hämtar PG
const { Client } = require("pg");

//Läser in inställningar från env-fil
require('dotenv').config();

//Anslutningsinställningar till databasen
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    ssl: {
        rejectUnauthorized: false,
    },
  
});

//Ansluter till databasen. Tabeller skapas vid lyckad anslutning.
client.connect((error) => {
    if (error) {
        console.log("Connetion error", error);
    } else {
        console.log("Connected to database!");
    }
});

//Exporterar client
module.exports = client;