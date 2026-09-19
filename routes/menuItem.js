//Hämtar express och databasanslutning
const express = require("express");
const client = require("../database/db");

//Skapar router till endpoints
const router = express.Router();


/**
 * MENU ITEMS
 */

//Hämtar enskild menyartikel
router.get("/:id", async (req, res) => {
    //Hämtar id från webbläsarefönstret
    const id = req.params.id;

    try {
        //Hämtar kategorin
        const result = await client.query(`
            SELECT m.item_name, m.item_price, m.item_description, m.category_id, c.category_name, m.created_at
            FROM menu_items m 
            JOIN categories c ON m.category_id = c.category_id 
            WHERE m.item_id =$1`, [id]);


        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Menu item not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get menu item." });

    }
});




//Hämtar alla menyartiklar som tillhör en viss kategori
router.get("/category/:id", async (req, res) => {
    //Hämtar id från webbläsarefönstret
    const id = req.params.id;

    try {
        //Hämtar kategorin
        const result = await client.query(`
            SELECT m.item_name, m.item_price, m.item_description, m.category_id, c.category_name, m.created_at
            FROM menu_items m 
            JOIN categories c ON m.category_id = c.category_id 
            WHERE m.category_id =$1`, [id]);


        //Om inget result finns.
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Menu not found." });
        }

        //Returnerar hämtad data
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal server error. Could not get menu." });

    }
});


//Skapar menyartikel
router.post("/", async (req, res) => {

    const { item_name, item_price, item_description, category_id } = req.body;

    //Array till valideringsfel
   let validationErrors =[];

    //Validerar input 
    if (!item_name || item_name.length < 2) {
        validationErrors.push("Item name must be at least 2 characters long.")
    }

    if (!item_price || typeof item_price !== "number" || item_price <= 0) {
        validationErrors.push("Price is required as a valid number over 0.")
    }

    if (!category_id || typeof category_id != "number") {
        validationErrors.push("Category ID is required as a valid number.")
    }

    //Skriver ut valideringsfel
    if(validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors });
    }

    try {
        //Kontroll om artikel  redan finns databasen
        const checkResult = await client.query(`SELECT * FROM menu_items WHERE item_name ILIKE $1`, [item_name]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Item already exist!" })
        }

        //Lägger till kategori i databasen med parametriserad fråga för att förhindra SQL-injection.
        const result = await client.query(`INSERT INTO menu_items(item_name, item_price, item_description, category_id) VALUES($1, $2, $3, $4)`,
            [item_name, item_price, item_description, category_id]);


        //Meddelande vid lyckad post
        res.status(201).json({ message: "Menu item created succesfully: " + item_name });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error. Could not create menu item" });
    }
});


//Updatera menyartikel
router.put("/:id", async (req, res) => {
    //Läser av id från webbläsarfönstret 
    const id = req.params.id;

    //Hämtar värde från inputfält
    const { item_name, item_price, item_description, category_id } = req.body;

    //Array till valideringsfel
    let validationErrors =[];

    //Validerar input 
    if (!item_name || item_name.length < 2) {
        validationErrors.push("Item name must be at least 2 characters long.")
    }

    if (!item_price || typeof item_price !== "number" || item_price <= 0) {
        validationErrors.push("Price is required as a valid number over 0.")
    }

    if (!category_id || typeof category_id != "number") {
        validationErrors.push("Category ID is required as a valid number.")
    }

    //Skriver ut valideringsfel
    if(validationErrors.length > 0) {
        return res.status(400).json({ messages: validationErrors });
    }


    try {
        //Kontroll om redan används av annan kategori 
        const checkResult = await client.query(`SELECT * FROM menu_items WHERE item_name ILIKE $1 AND item_id != $2`, [item_name, id]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Item  already exist!" })
        }
        //Uppdateta kategorin.
        const result = await client.query(`UPDATE menu_items SET item_name = $1, item_price = $2, item_description = $3, category_id= $4 
             WHERE item_id =$5`, [item_name, item_price, item_description, category_id, id]);

         //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Menu item not found." });
        }
        
        //Meddelande vid lyckad uppdatering
        res.json({message: "Category updated successfully: " + item_name});

    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not update menu item."});
    }


});


//Radera menyartikel
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        //Raderar menyartikel
        const result = await client.query(`DELETE FROM menu_items WHERE item_id = $1`, [id]);

        
        //Om id inte finns.
        if (!result.rowCount) {
            return res.status(404).json({ message: "Menu item not found." });
        }

        //Meddelande vid lyckad radering
        res.json({ message: "Menu item deleted" });


    } catch (error) {
        console.error(error);
         res.status(500).json({ message: "Internal server error. Could not delete menu it,." })

    }
});


//Exporterar router
module.exports = router;