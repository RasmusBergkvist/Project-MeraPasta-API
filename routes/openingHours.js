//Hämtar express och databasanslutning
const express = require("express");
const client = require("../database/db");

//Hämtar middleware
const {authenticateToken} = require("../middleware/authenticateTokens");

//Skapar router till endpoints
const router = express.Router();

/**
 * OPENING HOURS
 */

//Hämta alla öppettider
router.get("/", async (req, res) => {
    try {
        //Hämtar öppettider från databasen
        const result = await client.query(`SELECT * FROM opening_hours ORDER BY open_id`);


        //Returnerar hämtad data
        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get opening hours." });
    }
});


//Hämta enskild öppettid
router.get("/:id", async (req, res) => {

    //Hämtar id från webbläsarfönstret
    const id = req.params.id;

    try {
        //Hämtar öppettid från databasen
        const result = await client.query(`SELECT * FROM opening_hours WHERE open_id = $1`, [id]);


        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Opening hours not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get opening hours." });

    }
});


//Lägg till bokningar
router.post("/",authenticateToken, async (req, res) => {

    let { day_of_week, open_time, close_time } = req.body;

    //Stängda dagar
    if(open_time === "" && close_time === "") {
        open_time = null;
        close_time = null;

    }

      //Array till valideringsfel
    let validationErrors = [];

    //Validerar input
    if (!day_of_week || day_of_week.length < 6) {
        validationErrors.push("Day of week must have at least 6 characters.");
    }

    //Om öppet måste båda fält fyllas i
    if((!open_time && close_time) || (open_time && !close_time )) {
        validationErrors.push("Both opening and closing time must be filled out.");
    }
    

    //Skriver ut valideringsfel
    if(validationErrors.length > 0) {
        return res.status(400).json({messages: validationErrors});
    }

    try {
           //Kontroll om veckodagen redan finns databasen
        const checkResult = await client.query(`SELECT * FROM opening_hours WHERE day_of_week ILIKE $1`,[day_of_week]);

        //Om veckodagen redan finns
        if(checkResult.rows.length > 0) {
            res.status(409).json({message: "Opening hours for that day already exist"});
        }

        //Lägger till öppettider i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`INSERT INTO opening_hours(day_of_week, open_time, close_time) VALUES($1, $2, $3)`
            , [day_of_week, open_time, close_time]);

            //Meddelande vid lyckad post
            res.status(201).json({message: "Opening hours created: " + day_of_week});

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not create opening hours." });
    }

});

//Lägg till bokningar
router.put("/:id",authenticateToken, async (req, res) => {
    //Hämtar id från webbläsarfönstret
    const id = req.params.id;

    let { day_of_week, open_time, close_time } = req.body;

    //Stängda dagar
    if(open_time === "" && close_time === "") {
        open_time = null;
        close_time = null;

    }

      //Array till valideringsfel
    let validationErrors = [];

    //Validerar input
    if (!day_of_week || day_of_week.length < 6) {
        validationErrors.push("Day of week must have at least 6 characters.");
    }

    //Om öppet måste båda fält fyllas i
    if((!open_time && close_time) || (open_time && !close_time )) {
        validationErrors.push("Both opening time and closing time must be filled out.");
    }
    

    //Skriver ut valideringsfel
    if(validationErrors.length > 0) {
        return res.status(400).json({messages: validationErrors});
    }

    try {
           //Kontroll om veckodagen redan finns databasen
        const checkResult = await client.query(`SELECT * FROM opening_hours WHERE day_of_week ILIKE $1 AND open_id != $2`,[day_of_week, id]);

        //Om veckodagen redan finns
        if(checkResult.rows.length > 0) {
            res.status(409).json({message: "Opening hours for that day already exist"});
        }

        //Uppdatera öppettider i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`UPDATE opening_hours SET day_of_week = $1, open_time = $2, close_time = $3 WHERE open_id = $4`
            ,[day_of_week, open_time, close_time, id]);

            //Meddelande vid lyckad post
            res.status(201).json({message: "Opening hours updated: " + day_of_week});

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not create opening hours." });
    }
});

//Radera öppettider
router.delete("/:id", authenticateToken, async (req, res) => {

    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    try {
        // Parametriserad fråga för att förhindra SQL-injection
        const result = await client.query(
            "DELETE FROM opening_hours WHERE open_id = $1", [id]);

        //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Opening hours not found." });
        }

        //Meddelande vid lyckad radering
        res.json({ message: "Opening hours deleted succesfully" });


    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not delete opening hours." })

    }
});


module.exports = router;