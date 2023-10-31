const express = require('express');
const cors = require('cors');
const format = require('pg-format');

const { Pool, Client } = require('pg');

const app = express();
app.use(cors());

// create a new pool to handle database connections
const pool = new Pool({
  host: 'localhost',
  database: 'hercules',
  user: 'docker',
  password: 'docker',
  port: 5432,
});

// ---------- Hack to fix the issue with the data type of the column "decimal" in the "p1_input" tables ----------
var types = require('pg').types
types.setTypeParser(1700, function(val) {
    return parseFloat(val);
});

// ---------- API End Points ----------

app.get('/api/data/:expID/:pat_id', async (req, res) => {
  try {
    // query the database for all data in the table
    var patID = req.params.pat_id;
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_input"];

    // Sanitise user input string before using it in a query
    patID = patID.replace(/[^a-zA-Z0-9]/g, '');
    var expID_input = "p"+expID+"_input";
    var expID_group = "p"+expID+"_grouped_data";

    var sql = format("SELECT * FROM %I where patient_id = '%s' order by start_time_ts;", expID_input ,patID);
    console.log(sql);
    const result = await pool.query(sql);

    var sql = format("SELECT * FROM %I where patient_id = '%s'", expID_group ,patID);
    console.log(sql);
    const result_details = await pool.query(sql);

    const finalJSON = {"patient": result_details.rows, "point_data": result.rows };

    // return the data as a JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(finalJSON);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/data/all/exp/:expID', async (req, res) => {
  try {

    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_input"];

    var sql = format('SELECT * FROM %I order by start_time_ts;', values[0]);
    console.log(sql);

    // query the database for all data in the table
    const result = await pool.query(sql);

    // return the data as a JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json({"point_data": result.rows});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/api/data/hex/all/exp/:expID', async (req, res) => {
  try {

    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_input"];

    var sql = format('SELECT x_location/10000 as lat , y_location/10000 as lng, start_time_ts, end_time_ts, ST_MakePoint(x_location/10000, y_location/10000) AS geom FROM %I ORDER BY start_time_ts LIMIT 10;', values[0]);
    console.log(sql);

    // query the database for all data in the table
    const result = await pool.query(sql);

    var jsonPoints = [];
    for(var i = 0; i < result.rows.length; i++){
      var point = {"lat": result.rows[i]["lat"], "lng": result.rows[i]["lng"]};
      jsonPoints.push(point);
    }

    // return the data as a JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json({"point_data": jsonPoints});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/api/data/test/points', async (req, res) => {
  try {
    // query the database for all data in the table
    const result = await pool.query("SELECT * FROM p1_input where patient_id = 'G0132' order by start_time_ts;");

    var array = [];
    for(var i = 0; i < result.rows.length; i++){
      array.push();
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/getExperiments', async (req, res) => {
    try {
        // query the database for all tables in the db that start with p and end with _input or _grouped_data
        const result = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'p%_input' OR table_name LIKE 'p%_grouped_data';");
    
        // Divide by 2 because there are 2 tables for each experiment
        result.rows[0].count = result.rows[0].count / 2;

        res.setHeader('Content-Type', 'application/json');
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
});

app.get('/api/getExperimentsNames', async (req, res) => {
    try {
        // query the database for all data in the table
        const result = await pool.query("SELECT table_name as experiment FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'p%_input' OR table_name LIKE 'p%_grouped_data';");
   
        var obj = {"experiments": []};
        for(var i = 0; i < result.rows.length; i++){
            var experiment = result.rows[i].experiment;
            experiment = experiment.replace("_input", "").replace("_grouped_data", "");
            obj.experiments.push(experiment);
        }
        
        // remove duplicates from array
        obj.experiments = obj.experiments.filter((v, i, a) => a.indexOf(v) === i);

        res.json(obj);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
});

// start the server on port 3000
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

// ---------- JS HELPER FUNCTIONS ----------

function removeDuplicatesFromObject(obj) {
    const newObj = {}; // create a new object to hold the unique values
    const values = Object.values(obj); // get an array of all the object values
  
    // loop through each value and add it to the new object if it's not already present
    for (let i = 0; i < values.length; i++) {
      if (!Object.values(newObj).includes(values[i])) {
        newObj[i] = values[i];
      }
    }
  
    return newObj; // return the new object with unique values
}