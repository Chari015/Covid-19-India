const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject_2 = (dbObject_2) => {
  return {
    districtId: dbObject_2.district_id,
    districtName: dbObject_2.district_name,
    stateId: dbObject_2.state_id,
    cases: dbObject_2.cases,
    cured: dbObject_2.cured,
    active: dbObject_2.active,
    deaths: dbObject_2.deaths,
  };
};

//API-1
app.get("/states/", async (request, response) => {
  const getAllMovies = `
    SELECT * FROM state`;
  const allStates = await database.all(getAllMovies);
  response.send(
    allStates.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const specificState = `
    SELECT * FROM state
    WHERE state_id=${stateId}`;
  const getSpecificMovie = await database.get(specificState);
  response.send(convertDbObjectToResponseObject(getSpecificMovie));
});

// API-3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrict = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  const newDistrict = await database.run(createDistrict);
  response.send("District Successfully Added");
});

// API-4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSpecificDistrict = `
    SELECT * FROM district
    WHERE district_id = ${districtId}`;
  const getUniqueDistrict = await database.get(getSpecificDistrict);
  response.send(convertDbObjectToResponseObject_2(getUniqueDistrict));
});

// API-5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district
    WHERE district_id = ${districtId}`;
  const deleteResponse = await database.run(deleteDistrict);
  response.send("District Removed");
});

// API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
    UPDATE district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}`;
  const deleteResponse = await database.run(updateDistrict);
  response.send("District Details Updated");
});

//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getAllStatistics = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id =${stateId}`;
  const stats = await database.get(getAllStatistics);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNames = `
    SELECT state_name FROM district NATURAL JOIN state
    WHERE district_id = ${districtId}`;
  const state = await database.get(getStateNames);
  response.send({
    stateName: state.state_name,
  });
});
module.exports = app;
