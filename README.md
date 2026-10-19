# Mera Pasta - API 
Detta är ett REST-API som är byggt med Express och PostgreSQL till ett projektarbete i kursen DT20G Backend-baserad webbutveckling. I projektet ska en webbplats skapas åt en fiktiv restaurang där personalen ska kunna logga in, lägga till, uppdatera och ta bort innehåll på deras webbplats. API:et kommer att integreras med restaurangens webbplats i projektets andra del.

## Om API:et
 Via API:et kan användare registreras, logga in och valideras med JWT-tokens. Lösenord hashas innan lagring till databasen. Det går även att hämta, skapa, uppdatera och radera kategorier, menyartiklar, bokningar och öppettider. Vilka routes som är skyddade och kräver en giltig token från användare står beskrivit längre ner. Användarna har även olika behörigheter för att utföra åtgärderna. Databasfrågorna är försedda med parametiserade frågor för att skydda mot SQL-injection.

## URL till API


## Teknik
* Databas: PostgreSQL
* Databasserver: Render 
* NPM-paket: pg, express, nodemon, dotenv, cors, jwtwebtokens, bcrypt

### Kom igång
* Klona ner repot.
* Kör npm install för att installera beroenden.
* Skapa en .env-fil.
* Starta med npm run start.


## Användare
*Giltigt JWT-token och admin-behörighet krävs för:*
* `GET api/users/` - Hämta alla användare.
* `POST api/users/register` - Skapa användare.
* `DELETE api/users/:id` - Radera användare.

*Skapa användare*
```
{
    "username":"Ditt namn",
    "email": "din@epost.se",
    "password": "Ditt hemliga lösenord"
}
```

Statuskod vid svar:
* 200 OK: Om data hämtas, skapas eller raderas. 
* 201 Created: Om användare skapas.
* 400 Bad request: Om obligatorisk data saknas. Delete: om admin ska raderas och det bara finns en admin registrerad.
* 401 Unauthorized: Om JWT-token saknas.
* 403 Forbidden: Om avändaren inte är admin.
* 409 Conflict: Om användaren redan finns registerad.
* 500 Internal Server Error.




## Logga in
* `POST api/users/login`

```
{
    "email": "Din e-post"
    "password": "Ditt hemliga lösenord"
}
```
Statuskod vid svar:
* 200 OK: Vid lyckad inloggning.
* 400 Bad request: Om obligatorisk data saknas
* 401 Unauthorized: Misslyckad inloggning.
* 500 Internal Server Error

## Kategorier
* `GET /api/categories` - Hämtar kategori.
* `GET /api/categories/:id` - Hämtar enskild kategori.

*Giltigt JWT-token och admin-behörighet krävs för att:*
* `POST /api/categories` - Skapar ny kategori.
* `PUT /api/categories/:id` - Uppdatera kategori.
* `DELETE /api/categories/:id` - Raderar kategori.
```
{
    "category_name": "Pasta"
}
```

Statuskod vid svar:
* 200 OK: Om data hämtas, uppdateras eller raderas.
* 201 Created: Om kategori skapas.
* 400 Bad request: Om obligatorisk data saknas.
* 401 Unauthorized: Om JWT-token saknas.
* 403 Forbidden: Om avändaren inte är admin.
* 409 Conflict: Om kategorin redan finns. 
* 500 Internal Server Error.

## Menyartiklar
* `GET /api/menuitem/:id` - Hämta enskild menyartikel.
* `GET /api/menuitem/category/:id` - Hämtar enskild meny med artiklar.

*Giltigt JWT-token krävs för att:*
* `POST /api/menuitems` - Skapar ny kategori.
* `PUT /api/menuitems/:id` - Uppdatera kategori.
* `DELETE /api/menutitems/:id` - Raderar kategori.

*Skapa menyartikel:*
```
{
    "item_name": "Spaghetti Bolognese",
    "item_price":  89,
    "item_description": "Spaghetti med kassisk köttfärssås, parmesanost och färsk basilika",
    "category_id": 1 (Måste matcha kategorins id)
}
```

Statuskod vid svar:
* 200 OK: Om data hämtas, uppdateras eller raderas.
* 201 Created: Om menyartikel läggs till.
* 400 Bad request: Om obligatorisk data saknas.
* 401 Unauthorized: Om JWT-token saknas.
* 404 Not found: Om meny eller menyartikel inte finns. 
* 409 Conflict: Om menyartikel redan finns. 
* 500 Internal Server Error.



## Bokningsförfrågningar
* `POST /api/reservations` - Skapa bokningsförfrågan.

*Giltigt JWT-token krävs för att:*
* `GET /api/reservations` - Hämta alla bokningsförfrågningar.
* `GET /api/reservations/:id` - Hämta enskild bokningsförfrågan.
* `PUT /api/reservations/:id` - Uppdatera kategori.
* `DELETE /api/reservations/:id` - Radera bokningsförfrågan.

*Skapa bokningsförfrågan:*

```
{
    "costumer_name":"Kalle Svensson,
    "costumer_email": "kalle@svensson.se",
    "customer_phonenumber": 070-1122334,
    "guests": 4,
    "booking_date": "2026-10-19",
    "booking_time": "18:00",
    "message": "Gärna en barnstol vid bordet."
}
```
Statuskod vid svar:
* 200 OK: Om bokningsförfrågan hämtas, uppdateras eller raderas.
* 201 Created: Om bokningsförfrågan läggs till.
* 400 Bad Request: Om obligatorisk data saknas.
* 401 Unauthorized: Om JWT-token saknas.
* 409 Conflict: Om bokningsförfårgan redan finns.
* 500 Internal Server Error

## Öppettider
* `GET /api/openinhours` - Hämta alla öppettider.
* `GET /api/openinghours/:id` - Hämta öppettid.

*Giltigt JWT-token krävs för att:*
* `POST /api/openinghours` - Lägg till öppetid.
* `PUT /api/openinghours/:id` - Uppdatera öppettid.
* `DELETE /api/booopeninghours/:id` - Radera öppettid.

*Lägg till öppettid:*

```
{
    "day_of_week": "Måndag",
    "open_time": "10:00",
    "close_time": "20:00"
}
```

Statuskod vid svar:
* 200 OK: Om öppetid hämtas, uppdateras eller raderas.
* 201 Created: Om bokning läggs till.
* 400 Bad Request: Om obligatorisk data saknas.
* 401 Unauthorized: Om JWT-token saknas.
* 409 Conflict: Om öppettid redan finns.
* 500 Internal Server Error