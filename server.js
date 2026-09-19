require("dotenv").config();

//Hämtar express
const express = require("express");
const cors = require("cors");

//Startar applikation
const app = express();

//Läser in routes
const categoryRoutes = require("./routes/category");
const menuItemRoutes = require("./routes/menuItem");

 //Tillåter anrop från andra domäner
app.use(cors());

//Omvandlar JSON-data till JS-objekt
app.use(express.json());

//Kopplar till routes
app.use("/api/categories", categoryRoutes);
app.use("/api/menuitems", menuItemRoutes);

app.get("/", (req, res) => {
    res.json({message: "API is running"});
});

const port = process.env.PORT || 3000;


//Lyssnar och startar applikationen på porten
app.listen(port, () => {
    console.log("Server started on port:", port)
} )

