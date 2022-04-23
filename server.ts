import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import filePath from "./filePath";
import { movieQuery } from "./queries";
import { actorQuery } from "./queries";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

app.get("/quotes", async (req, res) => {
  try {
    const quotes = await client.query(`SELECT 
    quotes.id as"quoteID", 
    quotes.quote as "quote",
    quotes.character as "character",
    actor.name as "actorNAME", 
    movie.name as "movieNAME",
    quotes.comment as "comment"
    FROM quotes
    JOIN movie ON quotes.movieid = movie.id
    JOIN actor ON quotes.actorid = actor.id`);
    res.status(200).json(quotes.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/quotes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quote = await client.query(`SELECT * FROM quotes WHERE id = $1 `, [
      id,
    ]);
    if (quote) {
      res.status(200).json({
        status: "success",
        data: quote.rows,
      });
    } else {
      res.status(404).json({
        status: "fail",
        data: {
          id: "Could not find a quote entry with that id identifier",
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/quotes", async (req, res) => {
  const { quote, movie, character, actor, comment } = req.body;
  if (quote && movie && character && actor) {
    const movieID: number = await movieQuery(client, movie);
    const actorID: number = await actorQuery(client, actor);
    const createdQuote = await client.query(
      `INSERT INTO quotes (quote, character, movieid, actorid, comment ) 
      VALUES ($1, $2, $3, $4, $5)`,
      [quote, character, movieID, actorID, comment]
    );
    res.status(201).json({
      status: "success",
      data: {
        info: createdQuote,
      },
    });
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A value is missing from the post request for quote, movie, character, or actor",
      },
    });
  }
});

//update a signature.
app.put("/quotes/:id", async (req, res) => {
  const { quote, character, comment } = req.body;
  const id = parseInt(req.params.id);
  const result = await client.query(
    `UPDATE quotes SET quote = $1, character = $2, comment = $3 WHERE id = $4`,
    [quote, character, comment, id]
  );
  if (result.rowCount === 1) {
    const updatedSignature = result.rows[0];
    res.status(200).json({
      status: "success",
      data: {
        signature: updatedSignature,
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

app.put("/actor/:id", async (req, res) => {
  const { name, dob, nationality, img } = req.body;
  const id = parseInt(req.params.id);
  const result = await client.query(
    `UPDATE actor SET name = $1, dob = $2, nationality = $3, img = $4 
      WHERE id = $5`,
    [name, dob, nationality, img, id]
  );
  if (result.rowCount === 1) {
    const updatedActor = result.rows[0];
    res.status(200).json({
      status: "success",
      data: {
        signature: updatedActor,
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find an actor with that id identifier",
      },
    });
  }
});

app.put("/movie/:id", async (req, res) => {
  const { name, year, genre, runtime, rtrating } = req.body;
  const id = parseInt(req.params.id);
  const result = await client.query(
    `UPDATE movie SET name = $1, year = $2, genre = $3, runtime = $4, rtrating = $5
     WHERE id = $6`,
    [name, year, genre, runtime, rtrating, id]
  );

  if (result.rowCount === 1) {
    const updatedMovie = result.rows[0];
    res.status(200).json({
      status: "success",
      data: {
        signature: updatedMovie,
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a movie with that id identifier",
      },
    });
  }
});

app.delete("/quotes/:id", async (req, res) => {
  const id = parseInt(req.params.id); // params are string type

  const queryResult = await client.query(`DELETE FROM quotes WHERE id = $1`, [
    id,
  ]);
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});




//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
