var express = require("express");
var bodyParser = require("body-parser");
var md5 = require('md5');
var loki = require('lokijs');

var app = express();
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

// Add headers
app.use(function (req, res, next) {

  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

const AUTH_KEY='1234';

var db = new loki(); // ! заполнение тестовыми данными внизу

function isValidAuthKey(auth) {
  return auth === AUTH_KEY;
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

app.get("/api/server_state.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  res.status(200).json(server_state.find({ id : 1})[0]);
});

app.get("/api/exchange_active.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  res.status(200).json(server_state.find({ id : 1})[0]);
});

app.put("/api/exchange_active.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  var exchange_active = req.body.exchange_active;
  server_state_object = server_state.find({ id : 1})[0];
  server_state_object.exchange_active = exchange_active;

  res.status(200).json(server_state.find({ id : 1})[0]);
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

app.get("/api/iso_20022_messages.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  var filter = req.query.filter ? JSON.parse(req.query.filter) : "";

  res.status(200).json(iso_20022_messages.find(filter));
});

app.get("/api/free_format_messages.json", function(req, res) {
  var auth = req.query.auth;

  if (!isValidAuthKey(auth)) {
    handleError(res, "Invalid auth token", "Failed to get data.");
    return;
  }

  var filter = req.query.filter ? JSON.parse(req.query.filter) : "";

  res.status(200).json(free_format_messages.find(filter));
});

// заполнение БД тестовыми данными

var server_state = db.addCollection("server_state");
server_state.insert({
  id : 1,
  exchange_active : true,
  errors_last : 0,
  hdd_free_space : "20 gb",
  in_files_delay : 0,
  out_files_delay: 0
})

var in_files = db.addCollection("in_files");
for (var i = 0; i < 50; i++) {
  in_files.insert({file_date: new Date("2017-12-29 01:56:00"), file_name : i + ".xml"});
}

var out_files = db.addCollection("out_files");
for (var i = 0; i < 50; i++) {
  out_files.insert({file_date: new Date("2018-01-12 10:28:32"), file_name : i + ".xml"});
}

var iso_20022_messages = db.addCollection("iso_20022_messages");
iso_20022_messages.insert(
  [ {
    "description" : "Описание 1",
    "direction" : "Исходящий",
    "document" : "<?xml version=1.0?><xml></xml>",
    "id" : "1404",
    "linked_documents" : "",
    "recipient" : "Юникредит",
    "recipient_destination" : "CCDC",
    "registered" : "2017-12-28 18:20:40",
    "sender" : "ЕВРАЗ",
    "state" : "Отправляется",
    "theme" : "Тема 1",
    "type" : "auth.026"
  }, {
    "description" : "Описание 2",
    "direction" : "Исходящий",
    "document" : "<?xml version=1.0?><xml></xml>",
    "id" : "5984",
    "linked_documents" : [ {
      "direction" : "Исходящий",
      "id" : "1404",
      "registered" : "2017-12-05 18:58:24",
      "sender" : "ЕВРАЗ",
      "state" : "",
      "type" : "CFATack"
    }, {
      "direction" : "Входящий",
      "id" : "5984",
      "registered" : "2017-12-05 18:59:24",
      "sender" : "ЮНИКРЕДИТ",
      "state" : "Status Code: ACDC, Error Code: 0",
      "type" : "CFTStatusReport"
    }, {
      "direction" : "Входящий",
      "id" : "0893",
      "registered" : "2017-12-05 19:02:24",
      "sender" : "Юникредит",
      "state" : "",
      "type" : "CFATack"
    } ],
    "recipient" : "Юникредит",
    "recipient_destination" : "FRLS",
    "registered" : "2017-12-28 18:20:44",
    "sender" : "ЕВРАЗ",
    "state" : "Доставлено",
    "theme" : "Тема 2",
    "type" : "pain.001"
  }, {
    "description" : "Описание 3",
    "direction" : "Исходящий",
    "document" : "<?xml version=1.0?><xml></xml>",
    "id" : "0893",
    "linked_documents" : [ {
      "direction" : "Исходящий",
      "id" : "1404",
      "registered" : "2017-12-05 18:58:24",
      "sender" : "ЕВРАЗ",
      "state" : "",
      "type" : "CFATack"
    }, {
      "direction" : "Входящий",
      "id" : "5984",
      "registered" : "2017-12-05 18:59:24",
      "sender" : "ЮНИКРЕДИТ",
      "state" : "Status Code: ACDC, Error Code: 0",
      "type" : "CFTStatusReport"
    }, {
      "direction" : "Входящий",
      "id" : "0893",
      "registered" : "2017-12-05 19:02:24",
      "sender" : "Юникредит",
      "status" : "",
      "type" : "CFATack"
    } ],
    "recipient" : "Юникредит",
    "recipient_destination" : "SECU",
    "registered" : "2017-12-28 18:20:52",
    "sender" : "ЕВРАЗ",
    "state" : "Отправляется",
    "theme" : "Тема 3",
    "type" : "auth.026"
  } ]
);

var free_format_messages = db.addCollection("free_format_messages");
free_format_messages.insert(
  [ {
    "attachment" : "Письмо.rar",
    "binary" : "Файл 1",
    "description" : "Описание 1",
    "direction" : "Исходящий",
    "header" : "Заголовок 1",
    "id" : "1404",
    "recipient" : "Юникредит",
    "registered" : "2017-12-28 18:20:40",
    "sender" : "ЕВРАЗ",
    "state" : "Отправляется",
    "theme" : "Тема 1",
    "type" : "auth.026"
  }, {
    "attachment" : "file-1.xml",
    "binary" : "Файл 2",
    "description" : "Описание 2",
    "direction" : "Исходящий",
    "header" : "Заголовок 2",
    "id" : "5984",
    "recipient" : "Юникредит",
    "registered" : "2017-12-28 18:20:44",
    "sender" : "ЕВРАЗ",
    "state" : "Доставлено",
    "theme" : "Тема 2",
    "type" : "pain.001"
  }, {
    "attachment" : "test.out",
    "binary" : "Файл 3",
    "description" : "Описание 3",
    "direction" : "Исходящий",
    "header" : "Заголовок 3",
    "id" : "0893",
    "recipient" : "Юникредит",
    "registered" : "2017-12-28 18:20:52",
    "sender" : "ЕВРАЗ",
    "state" : "Отправляется",
    "theme" : "Тема 3",
    "type" : "auth.026"
  } ]
);
