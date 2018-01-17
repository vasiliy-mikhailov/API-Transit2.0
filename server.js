var express = require("express");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.json());

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

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

app.get("/api/in_files.json", function(req, res) {
  const data =
    [ {
      "file_date" : "2017-13-29 19:19:33",
      "file_name" : "1.xml"
    }, {
      "file_date" : "2017-12-28 18:18:39",
      "file_name" : "2.xml"
    }, {
      "file_date" : "2017-12-28 18:18:40",
      "file_name" : "3.xml"
    } ];


  res.status(200).json(data);

  //   if (err) {
  //     handleError(res, err.message, "Failed to get contacts.");
  //   } else {
  //
  //   }
  // });
});

app.get("/api/out_files.json", function(req, res) {
  const data =
    [ {
      "file_date" : "2017-12-28 18:28:32",
      "file_name" : "a.xml"
    }, {
      "file_date" : "2017-12-28 18:28:38",
      "file_name" : "b.xml"
    }, {
      "file_date" : "2017-12-28 18:28:40",
      "file_name" : "c.xml"
    } ];


  res.status(200).json(data);

  //   if (err) {
  //     handleError(res, err.message, "Failed to get contacts.");
  //   } else {
  //
  //   }
  // });
});

app.post("/api/contacts", function(req, res) {
});

/*  "/api/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/api/contacts/:id", function(req, res) {
});

app.put("/api/contacts/:id", function(req, res) {
});

app.delete("/api/contacts/:id", function(req, res) {
});
