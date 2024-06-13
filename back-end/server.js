const express = require('express');
const cors = require('cors');
const format = require('pg-format');
const moment = require('moment');
var bodyParser = require('body-parser');

const { Pool, Client } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//////////////////////////////////////////////////
//     CONSTANTS
//////////////////////////////////////////////////
const TICKS_PER_MINUTE = 32 ;
const TICKS_PER_SEC = TICKS_PER_MINUTE / 60;
const LAT_LONG_MULTIPLIER = 100;
//////////////////////////////////////////////////

// create a new pool to handle database connections§
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


app.get('/api/getExperimentInfo/:expID', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_input"];
    var sql = format("SELECT MIN(start_time_ts) as exp_start, MAX(end_time_ts) as exp_end, COUNT(DISTINCT(patient_id)) as numPatients FROM %I;", values[0]);  
    const result = await pool.query(sql);
  
    var obj = {"experiment": expID, "start": result.rows[0].exp_start, "end": result.rows[0].exp_end, "total_patient_number": result.rows[0].numpatients};

    var breakdown = {};
    var total_c = await getTotalConditionCount(expID, "c");
    var total_g = await getTotalConditionCount(expID, "g");
    var total_r = await getTotalConditionCount(expID, "r");
    var total_s = await getTotalConditionCount(expID, "s");

    breakdown.conditions = {"total_G": total_g, "total_R": total_r, "total_C": total_c, "total_S": total_s};
    obj.breakdown = breakdown;

    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

async function getTotalConditionCount(expID, type){
  var values = ["p"+expID+"_grouped_data"];
  type = type.toUpperCase();
  var type_output = "total_"+ type;
  var sql = format("SELECT COUNT(condition) as total_c FROM %I where condition = '%s';", values[0], type);  
  const result = await pool.query(sql);
  return result.rows[0].total_c;
}

////////////////////////////////////////////////////////////////////////////////////
//   EXPERIMENT META DATA REQUESTS                                                //       
//    - These requests will return a list of patient IDs for a given experiments  //
//      to use in other requests                                                  //
////////////////////////////////////////////////////////////////////////////////////

// All patients for a given experiment passing day of the week
app.get('/api/data/:expID/dow/:dow', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    var dow = req.params.dow.toProperCase();
    var sql = format("SELECT * FROM %I where day_of_week = '%s' order by start_time_ts;", values[0], dow);  
    console.log(sql);
    const result = await pool.query(sql);
    var obj = [];
    var patient_meta = [];

    for(var i = 0; i < result.rows.length; i++){
      obj.push(result.rows[i].patient_id);
      patient_meta.push(result.rows[i]);
    }

    var patientList = {"query": "dow", "results": obj.length, "patient_list": obj, "patient_data": patient_meta};

    res.json(patientList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All patients for a given experiment passing tod
app.get('/api/data/:expID/tod/:tod', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    var tow = req.params.tod.toLowerCase();
    var sql = format("SELECT * FROM %I where tod = '%s' order by start_time_ts;", values[0], tow);  
    console.log(sql);
    const result = await pool.query(sql);
    var obj = [];
    var patient_meta = [];

    for(var i = 0; i < result.rows.length; i++){
      obj.push(result.rows[i].patient_id);
      patient_meta.push(result.rows[i]);
    }

    var patientList = {"query": "tow", "results": obj.length,"patient_list": obj, "patient_data": patient_meta};

    res.json(patientList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All patients for a given experiment passing day and time
app.get('/api/data/:expID/dayAndTime/:dow/:tod', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    var tow = req.params.tod.toLowerCase();
    var dow = req.params.dow.toProperCase();

    var sql = format("SELECT * FROM %I where tod = '%s' and day_of_week = '%s' order by start_time_ts;", values[0], tow, dow);  
    console.log(sql);
    const result = await pool.query(sql);
    var obj = [];
    var patient_meta = [];

    for(var i = 0; i < result.rows.length; i++){
      obj.push(result.rows[i].patient_id);
      patient_meta.push(result.rows[i]);
    }

    var patientList = {"query": "dayAndTime", "results": obj.length, "patient_list": obj, "patient_data": patient_meta};

    res.json(patientList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All patients for a given experiment passing condition
app.get('/api/data/:expID/condition_type/:condition', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    var condition = req.params.condition.toUpperCase();

    var sql = format("SELECT * FROM %I where condition = '%s' order by start_time_ts;", values[0], condition);  
    console.log(sql);
    const result = await pool.query(sql);
    var obj = [];
    var patient_meta = [];

    for(var i = 0; i < result.rows.length; i++){
      obj.push(result.rows[i].patient_id);
      patient_meta.push(result.rows[i]);
    }

    var patientList = {"query": "condition_type","results": obj.length, "patient_list": obj, "patient_data": patient_meta};

    res.json(patientList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All patients for a given experiment passing visit length
//    - startLength and endLength are in minutes between == 10 to 15 minutes
app.get('/api/data/:expID/visitLength/:startLength/:endLength', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    var startFloat = parseFloat(req.params.startLength);
    var endFloat = parseFloat(req.params.endLength);

    var sql = format("SELECT * FROM %I where cast(visit_length_minutes as double precision) BETWEEN %s AND %s order by start_time_ts;", values[0], startFloat, endFloat);  
    console.log(sql);
    const result = await pool.query(sql);
    var obj = [];
    var patient_meta = [];

    for(var i = 0; i < result.rows.length; i++){
      obj.push(result.rows[i].patient_id);
      patient_meta.push(result.rows[i]);
    }

    var patientList = {"query": "visitLength","results": obj.length, "patient_list": obj, "patient_data": patient_meta};

    res.json(patientList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All patients for a given experiment passing start and end date
// POST REQUEST  { "start": "2021-10-26 00:00", "end": "2021-10-26 23:59" }
app.post('/api/data/:expID/period', async (req, res) => {
  try {
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_grouped_data"];
    
    var json_date = req.body;

    var start = json_date.start;
    var end = json_date.end;

    if(start == undefined || end == undefined){
        res.status(500).json({ error: 'Internal server error' });
    }else{

      var sql = format("SELECT * FROM %I where start_time_ts BETWEEN '%s' AND '%s' AND end_time_ts BETWEEN '%s' AND '%s' order by start_time_ts;", values[0], start, end, start, end);  
      console.log(sql);
      const result = await pool.query(sql);
      var obj = [];
      var patient_meta = [];

      for(var i = 0; i < result.rows.length; i++){
        obj.push(result.rows[i].patient_id);
        patient_meta.push(result.rows[i]);
      }

      var patientList = {"query": "period","results": obj.length, "patient_list": obj, "patient_data": patient_meta};

      res.json(patientList);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

////////////////////////////////////////////////////////////////////////////////////
//   FLOW REQUESTS
////////////////////////////////////////////////////////////////////////////////////

// Pass a list of patients and return the flow data for alls patients in the list
/* Payload example:
{
  "group": [
      "R0520",
      "R0501",
      "R0521",
      "R0521"
  ]
} */

// zerostart parameter could be 1 in case all ticks are wanted  to start from zero,
// and could be 0 when all ticks are wanted to be relative to the earliest start time
//For example, this means flows/group/ID/zerostart/0 when user selects a day of week, 
//and flows/group/ID/zerostart/1 when user selects condition type.
app.post('/api/data/flows/group/:expID/zerostart/:zerostart/colourconfig/:colourConfig', async (req, res) => {
  try {
  var expID = parseInt(req.params.expID);
  var zerostart = parseInt(req.params.zerostart);
  var colourConfig = parseInt(req.params.colourConfig);
  var json_body = req.body;
  var group_array = json_body.group;
  var expID_group = "p"+expID+"_input";
  var expID_grouped = "p"+expID+"_grouped_data"; 

  console.log(JSON.stringify(group_array).replace(/"/g, "'"));
  var groupList = JSON.stringify(group_array).replace(/"/g, "'");

  var sql = format("SELECT MIN(start_time) AS startTime, MAX(end_time) AS endTime FROM %I WHERE patient_id = ANY(array%s);", expID_group, groupList);  
  console.log(sql); 
  const result = await pool.query(sql);

  var ticksSql = format("SELECT MAX(CAST(visit_length_minutes AS DECIMAL(7,2))) * 32 AS ticks FROM %I WHERE patient_id = ANY(array%s);", expID_grouped, groupList);  
  console.log(ticksSql); 
  const ticksResult = await pool.query(ticksSql);

  var flowObject = {};  
  var flowPathObject = {};
  flowObject.startTime = result.rows[0].starttime;
  flowObject.endTime = result.rows[0].endtime;

  flowObject.ticks = Math.ceil(ticksResult.rows[0].ticks);

  flowObject.paths = [];
  
  // Check if group_array is an array
  if(!Array.isArray(group_array)){
    res.status(500).json({ error: 'Internal server error' });
  }else{
    for(var i = 0; i < group_array.length; i++){
      console.log(group_array[i]);
      var patID = group_array[i];
      var expID_group = "p"+expID+"_input";
      var sql = format("SELECT * FROM %I where patient_id = '%s' order by start_time_ts", expID_group ,patID);
      console.log(sql)
      var pat_result = await pool.query(sql);
      var patientPath;
      if(zerostart == 1){
        patientPath = getPatientPath(pat_result.rows, moment(pat_result.rows[0].start_time), colourConfig);
      } else {
        patientPath = getPatientPath(pat_result.rows, moment(flowObject.startTime), colourConfig);
      }
      flowObject.paths.push(patientPath);

    }
    flowObject.group = group_array;
    res.json(flowObject); 
  }
   } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}) ;


// Pass a single patient and return the flow data for that patient
app.get('/api/data/flows/single/:expID/:pat_id', async (req, res) => {
  try {
    var patID = req.params.pat_id;
    var expID = parseInt(req.params.expID);
    var values = ["p"+expID+"_input"];
    
    var sql = format("SELECT * FROM %I where patient_id = '%s' order by start_time_ts;", values[0], patID);  
    console.log(sql); 
    const result = await pool.query(sql);

    var expID_group = "p"+expID+"_grouped_data";
    var sql = format("SELECT * FROM %I where patient_id = '%s'", expID_group ,patID);
    const result_details = await pool.query(sql);

    var flowObject = {};
    var flowPathObject = {};
    flowObject.startTime = result.rows[0].start_time;
    flowObject.endTime = result.rows[result.rows.length-1].end_time;

    // Calculate the time difference between the start and end time
    var timeDiff = moment(flowObject.endTime).diff(moment(flowObject.startTime), 'seconds');
    flowObject.ticks = Math.round(timeDiff * TICKS_PER_SEC);
    flowObject.patient_info = result_details.rows[0];

    flowObject.paths = [];
    var patientPath = getPatientPath(result.rows, moment(flowObject.startTime));

    // Push the flow path array
    flowObject.paths.push(patientPath);

    res.json(flowObject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// start the server on port 3000
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

// ------

async function getPatientInfo(expID, patientID){
  var values = ["p"+expID+"_grouped_data"];
  var sql = format("SELECT * FROM %I where patient_id = '%s';", values[0], patientID);  
  const result = await pool.query(sql);
  return result.rows[0];
};

// Function to take patient array and return the path object for the flow
function getPatientPath(patient_db_array, overall_startTime, colourConfig){
  var patient_flowPath_obj = {};
  if(colourConfig == null || colourConfig == 0){ // Random colours for all pathes, this is the default option
    patient_flowPath_obj.vendor = getRandomRgb(); 
  } else if (colourConfig == 1){ //Colouring according to patient type
    if(patient_db_array[0].patient_id.startsWith("G"))
      patient_flowPath_obj.vendor = [0,200,0,100];
    else if (patient_db_array[0].patient_id.startsWith("R"))
      patient_flowPath_obj.vendor = [200,0,0,100];
    else if (patient_db_array[0].patient_id.startsWith("C"))
      patient_flowPath_obj.vendor = [0,120,250,100];
    else if (patient_db_array[0].patient_id.startsWith("S"))
      patient_flowPath_obj.vendor = [255,255,255,100];
  }

  patient_flowPath_obj.patID = patient_db_array[0].patient_id;   // Source
  patient_flowPath_obj.path = [];
  patient_flowPath_obj.timestamps = [];  

  for(var i = 0; i < patient_db_array.length; i++){
    var lat_y_coord, lat_x_coord;
    if(patient_db_array[i].y_location > 0){
      lat_y_coord = parseFloat((patient_db_array[i].y_location / LAT_LONG_MULTIPLIER).toFixed(9));
    }else{
      lat_y_coord = parseFloat((patient_db_array[i].y_location / LAT_LONG_MULTIPLIER).toFixed(9));
    }
    lng_x_coord = parseFloat((patient_db_array[i].x_location / LAT_LONG_MULTIPLIER).toFixed(9));

    patient_flowPath_obj.path.push([lng_x_coord, lat_y_coord]);

    var row_timeSecs = moment(patient_db_array[i].start_time).diff(moment(overall_startTime), 'seconds');
    var row_timeTick = Math.round(row_timeSecs * TICKS_PER_SEC);
    patient_flowPath_obj.timestamps.push(row_timeTick);
  }

  return(patient_flowPath_obj);
  
}

function getRandomRgb() {
  var num = Math.round(0xffffff * Math.random());
  var r = num >> 16;
  var g = num >> 8 & 255;
  var b = num & 255;
  return [r,g,b,1];
}

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

String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};