import { Client } from "pg";

export async function actorQuery(client: Client, actorName: string) {
  const actorID = await client.query(`SELECT id FROM actor WHERE name = $1`, [
    actorName,
  ]);
  if (actorID.rowCount === 1) {
    return actorID.rows[0].id;
  } else if (actorID.rowCount === 0) {
    await client.query(`INSERT INTO actor (name) VALUES ($1)`, [actorName]);
    const newActorID = await client.query(
      `SELECT id FROM actor WHERE name = $1`,
      [actorName]
    );
    return newActorID.rows[0].id;
  } else {
    console.log("multiple actors detected");
  }
}

export async function movieQuery(client: Client, movieName: string) {
  const movieID = await client.query(`SELECT id FROM movie WHERE name = $1`, [
    movieName,
  ]);
  if (movieID.rowCount === 1) {
    return movieID.rows[0].id;
  } else if (movieID.rowCount === 0) {
    await client.query(`INSERT INTO movie (name) VALUES ($1)`, [movieName]);
    const newMovieID = await client.query(
      `SELECT id FROM movie WHERE name = $1`,
      [movieName]
    );
    return newMovieID.rows[0].id;
  } else {
    console.log("multiple movies detected");
  }
}
