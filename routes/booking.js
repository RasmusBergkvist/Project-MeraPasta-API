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
        const result = await client.query(`SELECT * FROM bookings ORDER BY booking_id`);

        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(200).json({ message: "No bookings made" });
        }

        //Returnerar hämtad data
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get booking." });
    }
});

//Hämta booking kategori
router.get("/:id", authenticateToken, async (req, res) => {
    //Hämtar id från webbläsarefönstret
    const id = req.params.id;

    try {
        //Hämtar bokning
        const result = await client.query(`SELECT * FROM bookings WHERE booking_id =$1`, [id]);


        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get booking." });

    }
});


//Skapa bokningar
router.post("/", async (req, res) => {

    const { costumer_name, costumer_email, costumer_phonenumber, guests, booking_date, booking_time, message } = req.body;

    //Array till valideringsfel
    let validationErrors = [];

    //Validerar input 
    if (!costumer_name || costumer_name.trim().length < 2) {
        validationErrors.push("Name must be at least 2 characters long.");
    }

    //Regex för att validera e-postadressen är korrekt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!costumer_email || !emailRegex.test(costumer_email)) {
        validationErrors.push("Invalid e-mail!");
    }

    //Validera telefonnummer som måste vara mellan 7 - 15 tecken
    if (!costumer_phonenumber || costumer_phonenumber.length < 7 || costumer_phonenumber.length > 15) {
        validationErrors.push("Invalid phonenumber! Must be between between 7 and 15 characters.");
    }
    //Validera antal gäster mellan 1 - 10 samt att det är ett nummer. 
    if (!guests || typeof guests !== "number" || guests < 1 || guests > 10) {
        validationErrors.push("Invalid number of guests. Must be between 1 - 10");
    }

    //Validerar datum
    if (!booking_date) {
        validationErrors.push("Booking date is required");
    }

    //Validerar bokningstiden
    if (!booking_time) {
        validationErrors.push("Booking time is required.");
    }

    //Skriver ut valideringsfel
    if (validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }


    try {
        //Kontroll om bokingsförfrågan redan finns databasen
        const checkResult = await client.query(`SELECT * FROM bookings
              WHERE costumer_name ILIKE $1
              AND costumer_email ILIKE $2
              AND guests = $3
              AND booking_date = $4
              AND booking_time = $5 `
              , [costumer_name, costumer_email, guests, booking_date, booking_time]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Booking request already exists!" })
        }

        //Lägger till bokningsförfrågan i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`INSERT INTO bookings
            (costumer_name, costumer_email, costumer_phonenumber, guests, booking_date, booking_time, message ) VALUES($1, $2, $3, $4, $5, $6, $7)`
            , [costumer_name, costumer_email, costumer_phonenumber, guests, booking_date, booking_time, message]);


        //Meddelande vid lyckad post
        res.status(201).json({ message: "Booking request created succesfully"});

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not create booking request" });
    }
});


//Ändra bokningar
router.put("/:id",authenticateToken, async (req, res) => {

    //Hämtar id från webbläsarfönstret.
    const id = req.params.id;

    const { costumer_name, costumer_email, costumer_phonenumber, guests, booking_date, booking_time, message } = req.body;

    //Array till valideringsfel
    let validationErrors = [];

    //Validerar input 
    if (!costumer_name || costumer_name.trim().length < 2) {
        validationErrors.push("Name must be at least 2 characters long.");
    }

    //Regex för att validera e-postadressen är korrekt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!costumer_email || !emailRegex.test(costumer_email)) {
        validationErrors.push("Invalid e-mail.!");
    }

    //Validera telefonnummer som måste vara mellan 7 - 15 tecken
    if (!costumer_phonenumber || costumer_phonenumber.length < 7 || costumer_phonenumber.length > 15) {
        validationErrors.push({ message: "Invalid phonenumber! Must be between between 7 and 15 characters." });
    }
    //Validera antal gäster mellan 1 - 10 samt att det är ett nummer. 
    if (!guests || typeof guests !== "number" || guests < 1 || guests > 10) {
        validationErrors.push("Invalid number of guests. Must be between 1 - 10");
    }

    //Validerar datum
    if (!booking_date) {
        validationErrors.push("Booking date is required.");
    }

    //Validerar bokningstiden
    if (!booking_time) {
        validationErrors.push("Booking time is required.");
    }

    //Skriver ut valideringsfel
    if (validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }


    try {
        //Kontroll om bokingsförfrågan redan finns databasen
        const checkResult = await client.query(`SELECT * FROM bookings
              WHERE costumer_name ILIKE $1
              AND costumer_email ILIKE $2
              AND guests = $3
              AND booking_date = $4
              AND booking_time = $5 
              AND booking_id != $6`
              , [costumer_name, costumer_email, guests, booking_date, booking_time, id]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Booking request already exists!" })
        }

        //Lägger till bokningsförfrågan i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`UPDATE bookings SET costumer_name = $1, costumer_email = $2, costumer_phonenumber = $3, 
            guests = $4, booking_date = $5, booking_time = $6, message = $7 WHERE booking_id = $8`
            ,[costumer_name, costumer_email, costumer_phonenumber, guests, booking_date, booking_time, message,id]);


        //Meddelande vid lyckad post
        res.status(201).json({ message: "Booking request updated successfully"});

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not update booking request" });
    }
});

//Radera bokning
router.delete("/:id", authenticateToken, async (req, res) => {

    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    try {
        // Parametriserad fråga för att förhindra SQL-injection
        const result = await client.query(
            "DELETE FROM bookings WHERE booking_id = $1", [id]);

        //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Booking request not found." });
        }

        //Meddelande vid lyckad radering
        res.json({ message: "Booking request deleted successfully." });


    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not delete booking request." })

    }
});



module.exports = router;