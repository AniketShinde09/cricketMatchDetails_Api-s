const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDBObjectToResponseObjectPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayerQuery = `
    SELECT 
    * FROM 
    player_details;`;
  const allPlayerArray = await database.all(getAllPlayerQuery);
  response.send(
    allPlayerArray.map((eachPlayer) =>
      convertDBObjectToResponseObjectPlayer(eachPlayer)
    )
  );
});

// Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    * 
    FROM 
    player_details 
    WHERE 
    player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDBObjectToResponseObjectPlayer(player));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerDetailsQuery = `
    UPDATE 
     player_details
     SET 
     player_name = '${playerName}'
     WHERE 
     player_id = ${playerId};`;
  await database.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

const convertDBObjectToResponseObjectMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * 
    FROM 
    match_details
    WHERE 
    match_id = ${matchId};`;
  const matchDetails = await database.get(getMatchDetailsQuery);
  response.send(convertDBObjectToResponseObjectMatch(matchDetails));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM player_match_score 
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertDBObjectToResponseObjectMatch(eachMatch)
    )
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayersMatchQuery = `
     SELECT * FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playersArray = await database.all(getListOfPlayersMatchQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDBObjectToResponseObjectPlayer(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getReportOfPlayer = `
    SELECT 
    player_id AS  playerId,
    player_name As playerName,
    SUM(score) As totalScore,
    SUM(fours) As totalFours,
    SUM(sixes) As totalSixes
    FROM player_match_score
     NATURAL JOIN player_details
    WHERE
     player_id = ${playerId};`;
  const playerMatchDetails = await database.get(getReportOfPlayer);
  response.send(playerMatchDetails);
});
module.exports = app;
