//Hämtar express, databasanslutning och bcrypt
const express = require("express");
const client = require("../database/db");
const bcrypt = require("bcrypt");

//Skapar router till endpoints
const router = express.Router();

/**
 * USERS
 */

//Hämta alla registrerade  användare
router.get("/", async (req, res) => {
    try {
        result = await client.query(`SELECT user_id, username, email, role FROM users ORDER BY user_id`);

        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(200).json({ message: "No users stored." });
        }
        //Returnerar hämtad data
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get opening hours." });
    }
});

//Lägg till användare
router.post("/register", async (req, res) => {

    const { username, email, password, role } = req.body;

    //Array till valideringfel
    let validationErrors = [];

    //Validerar input
    if (!username || username.trim().length < 2) {
        validationErrors.push("Username must be at least be 2 characters long. ")
    }

    //Regex för att validera e-postadressen är korrekt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        validationErrors.push("Invalid e-mail!");
    }

    if (!password || password.trim().length < 6) {
        validationErrors.push("Password must be at least be 6 characters long. ")
    }

    if (!role || (role !== "staff" && role !=="admin")) {
        validationErrors.push("Role is required. Must be staff or admin.")
    }

    //Skriver ut felmeddelande
    if (validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }

    try {
        //Kontroll om användaren redan finns databasen
        const checkResult = await client.query(`SELECT * FROM users WHERE username ILIKE $1 AND email ILIKE $2 `, [username, email]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Username or email already registered." })
        }


        //Hashar lösenord innan det sparas
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(`INSERT INTO users(username, email, hashed_password, role) VALUES($1, $2, $3, $4)`
            , [username, email, hashedPassword, role]);


        res.status(201).json({ message: "User created successfully!" })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not create user." });

    }

});

//Radera användare
router.delete("/:id", async (req, res) => {

    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    try {
        //Kontroll av användare som ska tas bort
        const checkResult = await client.query(`SELECT * FROM users WHERE user_id = $1`, [id]);

        //Om id inte finns.
        if (!checkResult.rowCount) {
            return res.status(404).json({ message: "User not found." });
        }

        //Kontoll om användaren som ska raderas är admin
        if (checkResult.rows[0].role === "admin") {
            const adminResult = await client.query(`SELECT * FROM users WHERE role = $1`, ["admin"])

            //Kontroll av antal admins
            if (adminResult.rows.length <= 1) {
                return res.status(400).json({ message: "Invalid delete of role. There must be at least 1 admin." })
            }
        }

        // Parametriserad fråga för att förhindra SQL-injection
        const result = await client.query(
            "DELETE FROM users WHERE user_id = $1", [id]);


        //Meddelande vid lyckad radering
        res.json({ message: "User deleted successfully." });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error. Could not delete user." })

    }
});



module.exports = router;


