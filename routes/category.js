//Hämtar express och databasanslutning
const express = require("express");
const client = require("../database/db");

//Hämtar middlewares
const {authenticateToken, authenticateAdmin} = require("../middleware/authenticateTokens");


//Skapar router till endpoints
const router = express.Router();


/**
 * CATEGORIES
 */

//Hämta alla kategorier
router.get("/", async (req, res) => {
    try {
        //Hämtar data från databasen
        const result = await client.query(`SELECT * FROM categories ORDER BY category_name`);

        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(200).json({ message: "Categories is empty" });
        }

        //Returnerar hämtad data
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get categories." });
    }
});

//Hämta enskild kategori
router.get("/:id", async (req, res) => {
    //Hämtar id från webbläsarefönstret
    const id = req.params.id;
    
    try {
        //Hämtar kategorin
        const result = await client.query(`SELECT * FROM categories WHERE category_id =$1`, [id]);

        
        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows[0]);

    } catch(error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get category." });
        
    }
});

//Skapa kategorier
router.post("/", authenticateToken, authenticateAdmin, async (req, res) => {

    const { category_name } = req.body;

    //Validerar input 
    if (!category_name || category_name.length < 2) {
        return res.status(400).json({ message: "Category name must be at least 2 characters long." });
    }

    try {
        //Kontroll om kategori redan finns databasen
        const checkResult = await client.query(`SELECT * FROM categories WHERE category_name ILIKE $1`, [category_name]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Category already exists!" })
        }

        //Lägger till kategori i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`INSERT INTO categories(category_name) VALUES($1)`, [category_name]);

        
        //Meddelande vid lyckad post
        res.status(201).json({ message: "Category created succesfully: " + category_name });

    } catch (error) {     
        console.error(error);
         res.status(500).json({ error: "Internal server error. Could not create category"});
    }
});

//Updatera kategori
router.put("/:id",authenticateToken,authenticateAdmin, async (req, res) => {
    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    //Hämtar värde från inputfält
    const { category_name } = req.body;

    //Validerar input 
    if (!category_name || category_name.length < 2) {
        return res.status(400).json({ message: "Category name must be at least 2 characters long." });
    }

    try {
        //Kontroll om redan används av annan kategori 
        const checkResult = await client.query(`SELECT category_name FROM categories WHERE category_name ILIKE $1 AND category_id != $2`, [category_name, id]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Category already exists!" })
        }
        //Uppdateta kategorin.
        const result = await client.query(`UPDATE categories SET category_name =$1 WHERE category_id =$2`, [category_name, id]);

         //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Category not found." });
        }
        
        //Meddelande vid lyckad uppdatering
        res.json({message: "Category updated successfully: " + category_name});

    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not update category."});
    }


});


//Radera kategori
router.delete("/:id", authenticateToken,authenticateAdmin, async (req, res) => {

    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    try {
        // Parametriserad fråga för att förhindra SQL-injection
        const result = await client.query(
            "DELETE FROM categories WHERE category_id = $1", [id]);

        //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Category not found." });
        }

        //Meddelande vid lyckad radering
        res.json({ message: "Category deleted" });


    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not delete category." })

    }
});

module.exports = router;
