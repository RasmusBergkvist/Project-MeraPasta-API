require("dotenv").config();

//Hämtar express
const express = require("express");
const cors = require("cors");

//Startar applikation
const app = express();

 //Tillåter anrop från andra domäner
app.use(cors());

//Omvandlar JSON-data till JS-objekt
app.use(express.json());

app.get("/", (req, res) => {
    res.json({message: "API is running"});
});

const port = process.env.PORT || 3000;


//Lyssnar och startar applikationen på porten
app.listen(port, () => {
    console.log("Server started on port:", port)
} )

