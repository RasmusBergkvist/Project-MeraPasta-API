//Hämtar express och databasanslutning
const express = require("express");
const client = require("../database/db");

//Hämtar middleware
const {authenticateToken} = require("../middleware/authenticateTokens");

//Skapar router till endpoints
const router = express.Router();


/**
 * BOOKINGS
 */


//Hämta alla bokningar
router.get("/", authenticateToken, async (req, res) => {
    try {
        //Hämtar bokingar från databasen
        const result = await client.query(`SELECT * FROM reservations ORDER BY reservation_date`);

        //Returnerar hämtad data
        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get reservation." });
    }
});

//Hämta booking kategori
router.get("/:id", authenticateToken, async (req, res) => {
    //Hämtar id från webbläsarefönstret
    const id = req.params.id;

    try {
        //Hämtar bokning
        const result = await client.query(`SELECT * FROM reservations WHERE reservation_id =$1`, [id]);


        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get reservation." });

    }
});


//Skapa bokningar
router.post("/", async (req, res) => {

    const { customer_name, customer_email, customer_phonenumber, guests, reservation_date, reservation_time, message } = req.body;

    //Array till valideringsfel
    let validationErrors = [];

    //Validerar input 
    if (!customer_name || customer_name.trim().length < 2) {
        validationErrors.push("Name must be at least 2 characters long.");
    }

    //Regex för att validera e-postadressen är korrekt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!customer_email || !emailRegex.test(customer_email)) {
        validationErrors.push("Invalid e-mail!");
    }

    //Validera telefonnummer som måste vara mellan 7 - 15 tecken
    if (!customer_phonenumber || customer_phonenumber.length < 7 || customer_phonenumber.length > 15) {
        validationErrors.push("Invalid phonenumber! Must be between between 7 and 15 characters.");
    }
    //Validera antal gäster mellan 1 - 10 samt att det är ett nummer. 
    if (!guests || typeof guests !== "number" || guests < 1 || guests > 10) {
        validationErrors.push("Invalid number of guests. Must be between 1 - 10");
    }

    //Validerar datum
    if (!reservation_date) {
        validationErrors.push("Reservation date is required");
    }

    //Validerar bokningstiden
    if (!reservation_time) {
        validationErrors.push("Reservation time is required.");
    }

    //Skriver ut valideringsfel
    if (validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }


    try {
        //Kontroll om bokingsförfrågan redan finns databasen
        const checkResult = await client.query(`SELECT * FROM reservations
              WHERE customer_name ILIKE $1
              AND customer_email ILIKE $2
              AND guests = $3
              AND reservation_date = $4
              AND reservation_time = $5 `
              , [customer_name, customer_email, guests, reservation_date, reservation_time]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Reservation request already exists!" })
        }

        //Lägger till bokningsförfrågan i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`INSERT INTO reservations
            (customer_name, customer_email, customer_phonenumber, guests, reservation_date, reservation_time, message ) VALUES($1, $2, $3, $4, $5, $6, $7)`
            , [customer_name, customer_email, customer_phonenumber, guests, reservation_date, reservation_time, message]);


        //Meddelande vid lyckad post
        res.status(201).json({ message: "Reservation created succesfully."});

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not create reservation." });
    }
});


//Ändra bokningar
router.put("/:id",authenticateToken, async (req, res) => {

    //Hämtar id från webbläsarfönstret.
    const id = req.params.id;

    const { customer_name, customer_email, customer_phonenumber, guests, reservation_date, reservation_time, message } = req.body;

    //Array till valideringsfel
    let validationErrors = [];

    //Validerar input 
    if (!customer_name || customer_name.trim().length < 2) {
        validationErrors.push("Name must be at least 2 characters long.");
    }

    //Regex för att validera e-postadressen är korrekt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!customer_email || !emailRegex.test(customer_email)) {
        validationErrors.push("Invalid e-mail.!");
    }

    //Validera telefonnummer som måste vara mellan 7 - 15 tecken
    if (!customer_phonenumber || customer_phonenumber.length < 7 || customer_phonenumber.length > 15) {
        validationErrors.push({ message: "Invalid phonenumber! Must be between between 7 and 15 characters." });
    }
    //Validera antal gäster mellan 1 - 10 samt att det är ett nummer. 
    if (!guests || typeof guests !== "number" || guests < 1 || guests > 10) {
        validationErrors.push("Invalid number of guests. Must be between 1 - 10");
    }

    //Validerar datum
    if (!reservation_date) {
        validationErrors.push("Booking date is required.");
    }

    //Validerar bokningstiden
    if (!reservation_time) {
        validationErrors.push("Booking time is required.");
    }

    //Skriver ut valideringsfel
    if (validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }


    try {
        //Kontroll om bokingsförfrågan redan finns databasen
        const checkResult = await client.query(`SELECT * FROM reservations
              WHERE customer_name ILIKE $1
              AND customer_email ILIKE $2
              AND guests = $3
              AND reservation_date = $4
              AND reservation_time = $5 
              AND reservation_id != $6`
              , [customer_name, customer_email, guests, reservation_date, reservation_time, id]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Reservation already exists!" })
        }

        //Lägger till bokningsförfrågan i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`UPDATE reservations SET customer_name = $1, customer_email = $2, customer_phonenumber = $3, 
            guests = $4, reservation_date = $5, reservation_time = $6, message = $7 WHERE reservation_id = $8`
            ,[customer_name, customer_email, customer_phonenumber, guests, reservation_date, reservation_time, message,id]);


        //Meddelande vid lyckad post
        res.status(201).json({ message: "Reservation updated successfully."});

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not update reservation." });
    }
});

//Radera bokning
router.delete("/:id", authenticateToken, async (req, res) => {

    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    try {
        // Parametriserad fråga för att förhindra SQL-injection
        const result = await client.query(
            "DELETE FROM reservations WHERE reservation_id = $1", [id]);

        //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Reserveration not found." });
        }

        //Meddelande vid lyckad radering
        res.json({ message: "Reservation deleted successfully." });


    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not delete reservation." })

    }
});



module.exports = router;