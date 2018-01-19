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

// --- НАЧАЛО МЕТОДОВ API ---

// Параметры методов API для сортировки и фильтрации
//   filter            // фильтр, примененный к коллекции, например {"id" : 10} - поиск ID 10; {'Age': {'$gte':30}} - возраст больше 30; {'Height': {'$lte': 180}} - рост меньше 180
//   compoundsort      // поля, по которым отсортирована коллекция, пример: ["name", ["date" : true]] - по возрастанию по имени, по убыванию по дате
//   limit             // количество записей на странице
//   offset            // смещение относительно начала коллекции в записях
//   items             // объекты коллекции - всегда массив даже если одна запись
//   total             // количество объектов в коллекции после применения фильтра, но до применения лимита

// ValueObject - тип данных, возвращаемый всеми без исключения методами API, позволяет передать как сами объекты,
// так и метаинформацию о них в основном для отрисовки в списках
function newValueObject() {
  var valueObject = {
    code : 200,               // http-код (null - OK, остальное - ошибки)
    error_message : null,     // текст сообщения об ошибке
    filter : null,            // фильтр, примененный к коллекции, например {"id" : 10} - поиск ID 10; {'Age': {'$gte':30}} - возраст больше 30; {'Height': {'$lte': 180}} - рост меньше 180
    compoundsort : null,      // поля, по которым отсортирована коллекция, пример: ["name", ["date" : true]] - по возрастанию по имени, по убыванию по дате
    limit : 100,              // количество записей на странице
    offset : 0,               // смещение относительно начала коллекции в записях
    items : null,             // объекты коллекции - всегда массив даже если одна запись
    total : null              // количество объектов в коллекции после применения фильтра, но до применения лимита
  };

  return valueObject;
}

// login.json - вход в систему
// Параметры
//   email: почта
//   password_md5: md5-пароль
// Результат
//   valueObject - см описание valueObject
//      .items[0].token - токен для передачи в последующие вызовы в качестве параметра auth
//      .items[0].email - e-mail залогиненного пользователя
app.get("/api/login.json", function(req, res) {
  var email = req.query.email;
  var password_md5 = req.query.password_md5;

  if (password_md5 === md5('123456')) {
    data = {
      "token" : AUTH_KEY,
      "email" : email
    }

    var valueObject = newValueObject();
    valueObject.items = [data];
    valueObject.total = 1;

    res.status(200).json(valueObject);
  }
  else {
    handleError(res, 401, "Invalid credentials");
  }
});

// logout.json - выход из системы
// Параметры
//   auth: токен
// Результат
//   valueObject - см описание valueObject
app.get("/api/logout.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = newValueObject();
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// server_state.json - статус сервера
// Параметры
//   auth: токен
// Результат
//   valueObject - см описание valueObject
//      .items[0].exchange_active - включен ли процесс транзита
//      .items[0].errors_last - количество ошибок за последние 5 минут
//      .items[0].hdd_free_space - свободное место на диске в гигабайтах
//      .items[0].in_files_delay - зависшие входящие сообщения (по которым не было обновлений больше 5 минут)
//      .items[0].out_files_delay - зависшие исходящие сообщения (по которым не было обновлений больше 5 минут)
app.get("/api/server_state.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = newValueObject();
    valueObject.items = server_state.find({ id : 1});
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid credentials");
  }
});


// PUT-метод (!)
// exchange_active.json - задать статус сервера
// Параметры
//   auth: токен, передается в URL
//   { exchange_active : true / false} - конструкция передается в теле запроса
// Результат
//   valueObject - см описание valueObject
//      .items[0].exchange_active - включен ли процесс транзита
app.put("/api/exchange_active.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var exchange_active = req.body.exchange_active;
    server_state_object = server_state.find()[0];
    server_state_object.exchange_active = exchange_active;

    var valueObject = newValueObject();
    valueObject.items = server_state_object;
    valueObject.total = 1;
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// in_files.json - входящие файлы
// Параметры
//   auth: токен
//   стандартный набор параметров для фильтрации, сортировки и пейджинга
// Результат
//   valueObject - см описание valueObject
//      .items.file_name - название файла
//      .items.file_date - дата файла
app.get("/api/in_files.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = collection_search(in_files, req)
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// out_files.json - исходящие файлы
// Параметры
//   auth: токен
//   стандартный набор параметров для фильтрации, сортировки и пейджинга
// Результат
//   valueObject - см описание valueObject
//      .items.file_name - название файла
//      .items.file_date - дата файла
app.get("/api/out_files.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = collection_search(out_files, req)
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// iso_20022_messages.json - сообщения ISO 20022
// Параметры
//   auth: токен
//   стандартный набор параметров для фильтрации, сортировки и пейджинга
// Результат
//   valueObject - см описание valueObject
//       .items.id - идентификатор сообщения
//       .items.description - описание
//       .items.direction - входящий/исходящий
//       .items.document - тело документа
//       .items.recipient - получатель
//       .items.recipient_destination - код подразделения в получателе
//       .items.registered - дата и время регистрации
//       .items.sender - отправитель
//       .items.state - состояние документа
//       .items.subject - тема документа
//       .items.type - тип документа
//       .items.linked_documents - связанные документы
//           .linked_documents.id - идентификатор документа
//           .linked_documents.direction - входящий / исходящий
//           .linked_documents.registered - дата и время регистрации
//           .linked_documents.sender - отправитель
//           .linked_documents.state - состояние
//           .linked_documents.type - тип документа
app.get("/api/iso_20022_messages.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = collection_search(iso_20022_messages, req)
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// free_format_messages.json - сообщения свободного формата
// Параметры
//   auth: токен
//   стандартный набор параметров для фильтрации, сортировки и пейджинга
// Результат
//   valueObject - см описание valueObject
//       .items.id - идентификатор сообщения
//       .items.description - описание
//       .items.direction - входящий/исходящий
//       .items.recipient - получатель
//       .items.registered - дата и время регистрации
//       .items.sender - отправитель
//       .items.state - состояние документа
//       .items.subject - тема документа
//       .items.type - тип документа
//       .items.binary - тело документа
//       .attachment - название файла документа
//       .items.header - файл-заголовок документа
app.get("/api/free_format_messages.json", function(req, res) {
  var auth = req.query.auth;

  if (isValidAuthKey(auth)) {
    var valueObject = collection_search(free_format_messages, req)
    res.status(200).json(valueObject);
  } else {
    handleError(res, 401, "Invalid auth token");
  }
});

// ОКОНЧАНИЕ МЕТОДОВ API

// вспомогательные методы

const AUTH_KEY='1234';

var db = new loki(); // ! заполнение тестовыми данными внизу

function isValidAuthKey(auth) {
  return auth === AUTH_KEY;
}

function collection_search(collection, req) {
  var valueObject = newValueObject();
  valueObject.filter = req.query.filter ? req.query.filter : null;
  valueObject.compoundsort = req.query.compoundsort ? req.query.compoundsort : null;
  valueObject.limit = req.query.limit ? req.query.limit : 100;
  valueObject.offset = req.query.offset ? req.query.offset : 0;

  query_chain = collection.chain();

  if (valueObject.filter) {
    filterJson = JSON.parse(valueObject.filter);
    query_chain = query_chain.find(filterJson);
  };

  valueObject.total = query_chain.data().length;

  if (valueObject.compoundsort) {
    compoundsortJson = JSON.parse(valueObject.compoundsort)
    query_chain = query_chain.compoundsort(valueObject.compoundsort);
  };

  if (valueObject.offset) {
    query_chain = query_chain.offset(valueObject.offset);
  };

  if (valueObject.limit) {
    query_chain = query_chain.limit(valueObject.limit);
  };

  var items = query_chain.data();

  valueObject.items = items;

  return valueObject;
}

// API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, code, message) {
  var valueObject = newValueObject();

  valueObject.code = code;
  valueObject.error_message = "Invalid auth token";

  res.status(valueObject.code).json(valueObject);
}

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
    "subject" : "Тема 1",
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
    "subject" : "Тема 2",
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
    "subject" : "Тема 3",
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
    "subject" : "Тема 1",
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
    "subject" : "Тема 2",
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
    "subject" : "Тема 3",
    "type" : "auth.026"
  } ]
);
