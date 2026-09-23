require("dotenv").config();


//Hämtar anslutning från db.js
const client = require('./db');

//Hämtar bcrypt
const bcrypt = require("bcrypt");



//Skapar tabeller
async function initDatabase() {
    try {
        //Tar bort tabeller
        await client.query(`
            DROP TABLE IF EXISTS menu_items;
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS opening_hours;
            DROP TABLE IF EXISTS bookings;
            DROP TABLE IF EXISTS users;

            `);

        //Skapar tabeller
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories(
            category_id SERIAL PRIMARY KEY NOT NULL,
            category_name VARCHAR(50) UNIQUE NOT NULL
            );
            `)



        await client.query(`
            CREATE TABLE IF NOT EXISTS menu_items(
            item_id SERIAL PRIMARY KEY NOT NULL,
            item_name VARCHAR(60) UNIQUE NOT NULL,
            item_price INT NOT NULL,
            item_description TEXT,
            category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS opening_hours(
            open_id SERIAL PRIMARY KEY NOT NULL,
            day_of_week VARCHAR(25) NOT NULL UNIQUE,
            open_time TIME,
            close_time TIME
            )
            `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings(
            booking_id SERIAL PRIMARY KEY NOT NULL,
            costumer_name VARCHAR(100) NOT NULL,
            costumer_email VARCHAR(255)NOT NULL,
            costumer_phonenumber VARCHAR(20) NOT NULL,
            guests INT NOT NULL,
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS users(
            user_id SERIAL PRIMARY KEY NOT NULL,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(255)NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            `)

            //Hämtar admin-uppgifter
            const username = process.env.ADMIN_USERNAME;
            const email = process.env.ADMIN_EMAIL;
            const password = process.env.ADMIN_PASSWORD;
            const role = process.env.ADMIN_ROLE;

            //Hashar lösenord innan det sparas
            const hashedPassword = await bcrypt.hash(password, 10);

            //Kontroll att inte kontot finns innan det skapas
            const checkAccount = await client.query(`SELECT * FROM users WHERE username = $1`, [username]);

            //Om kontot inte finns
            if(checkAccount.rows.length === 0) {
                await client.query(`INSERT INTO users(username, email, hashed_password, role)
                VALUES($1, $2, $3, $4)`,[username, email, hashedPassword, role]);
                console.log(`Account created: ${username}`);
            } else {
                console.log("Account already created.")
            }
            

            console.log("Database created successfully!")
    } catch (error) {
        //Ev. felmeddelanden
        console.error("Could not create tables ", error);
    } finally {
        //Stänger databasanslutningen
        client.end();
    }

}

//Anropar funktionen
initDatabase();
