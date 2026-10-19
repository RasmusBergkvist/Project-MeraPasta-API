require("dotenv").config();


//Hämtar anslutning från db.js
const client = require('./db');

//Hämtar bcrypt
const bcrypt = require("bcrypt");



//Skapar tabeller
async function initDatabase() {
    try {


        //Skapar tabeller
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories(
            category_id SERIAL PRIMARY KEY NOT NULL,
            category_name VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            CREATE TABLE IF NOT EXISTS reservations(
            reservation_id SERIAL PRIMARY KEY NOT NULL,
            customer_name VARCHAR(100) NOT NULL,
            customer_email VARCHAR(255)NOT NULL,
            customer_phonenumber VARCHAR(20) NOT NULL,
            guests INT NOT NULL,
            reservation_date DATE NOT NULL,
            reservation_time TIME NOT NULL,
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
            const checkAccount = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);

            //Om kontot inte finns
            if(checkAccount.rows.length === 0) {
                await client.query(`INSERT INTO users(username, email, hashed_password, role)
                VALUES($1, $2, $3, $4)`,[username, email, hashedPassword, role]);
                console.log("Account created");
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
