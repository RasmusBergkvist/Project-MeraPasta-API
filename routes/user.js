require('dotenv').config();

//Hämtar express, databasanslutning, bcrypt och jwt
const express = require("express");
const client = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Hämtar middlewares
const {authenticateToken, authenticateAdmin} = require("../middleware/authenticateTokens");

//Skapar router till endpoints
const router = express.Router();

/**
 * USERS
 */

//Hämta alla registrerade  användare
router.get("/", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        result = await client.query(`SELECT user_id, username, email, role FROM users ORDER BY role`);

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
router.post("/register", authenticateToken, authenticateAdmin, async (req, res) => {

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
        const checkResult = await client.query(`SELECT * FROM users WHERE username ILIKE $1 OR email ILIKE $2 `, [username, email]);

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
router.delete("/:id", authenticateToken, authenticateAdmin, async (req, res) => {

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


/**
 * USER LOGIN
 */

//Logga in användare
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

         if(!email || !password) {
            return res.status(400).json({message: "Incorrect email or password"});
        }

    try {
        //Hämtar användarens e-post
        let userResult = await client.query(`SELECT * FROM users WHERE email = $1`,[email]);

        //Om inte användare finns
        if(userResult.rows.length === 0) {
         return res.status(401).json({message: "Incorrect email or password"});
        }

        //Sparar användaren i user
        const user = userResult.rows[0];

        //Kontrollera lösenord
        const passwordMatch = await bcrypt.compare(password, user.hashed_password);

        //Om lösenord är felaktigt
        if(!passwordMatch) {
           return res.status(401).json({message: "Incorrect email or password"});
        }

        //Skapar JWT-token
        const payload = {id: user.user_id, email: user.email, role: user.role};
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "1h"});

        const response = {
            username: user.username,
            role: user.role,
            token: token
        }

        return res.status(200).json(response);


    }catch(error) {
        console.error(error);
        res.status(500).json({message: "Internal server error. Could not log in user"})
    }
});



module.exports = router;


