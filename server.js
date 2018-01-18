var express = require("express");
var bodyParser = require("body-parser");
var md5 = require('md5');
var loki = require('lokijs');

var app = express();
app.use(bodyParser.json());

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

const AUTH_KEY='1234';

var db = new loki();

var in_files = db.addCollection("in_files");
for (var i = 0; i < 50; i++) {
  in_files.insert({file_date: new Date("2017-12-29 01:56:00"), file_name : i + ".xml"});
}

var out_files = db.addCollection("out_files");
for (var i = 0; i < 50; i++) {
  out_files.insert({file_date: new Date("2018-01-12 10:28:32"), file_name : i + ".xml"});
}

function isValidAuthKey(auth) {
  return auth !== null;//AUTH_KEY;
}

// API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/api/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/api/login.json", function(req, res) {
  var email = req.query.email;
  var password_md5 = req.query.password_md5;

  if (md5(password_md5) === md5('123pass')) {
    data = {
      "auth" : AUTH_KEY,
      "email" : email
    }

    res.status(200).json(data);
  }
  else {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }
});

app.get("/api/in_files.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  res.status(200).json(in_files.find());
});

app.get("/api/out_files.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  res.status(200).json(out_files.find());
});
