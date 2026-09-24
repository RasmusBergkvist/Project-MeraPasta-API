//Hämtar JWT-token
const jwt = require("jsonwebtoken");

//Authentisering av användare
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];

    //Om token inte finns
    if(!token) {
        return res.status(401).json({message: "Not authorized for this route. You need to send token."});
    }

    //Verifierar token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, user) => {
        if(error) return res.status(403).json({message: "Invalid token!"});

        //Skapar avkodade användaren och 
        req.user = user;
        next();


    });

}

//Authentisering av admins
function authenticateAdmin(req, res, next) {
    //Kontrollerar om användaren är admin
    if(req.user.role ==="admin") {
        next();
    } else {
        return res.status(403).json({message: "Access denied. User not authorized for this route."})
    }
}

module.exports = {authenticateToken, authenticateAdmin};
