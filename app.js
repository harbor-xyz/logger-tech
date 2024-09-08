const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const newrelic = require('newrelic');

const indexRouter = require("./routes/index");

const app = express();

// Winston logger configuration
const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'logSetup/logs/application.log' }),
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
        const requestId = uuidv4();
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const logEntry = {
          contextpath: req.baseUrl,
          endpoint: `${req.path}${queryString}`,
          fullendpoint: `${req.baseUrl}${req.path}${queryString}`,
          hostname: req.hostname,
          level: "info",
          message: `contextpath: ${req.baseUrl} with request for ${req.path} with method ${req.method.toLowerCase()} is served with status code ${res.statusCode}`,
          method: req.method.toLowerCase(),
          path_params: "unnormalised",
          status: res.statusCode.toString(),
          timestamp: timestamp,
          request_id: requestId,
          job: "local-logs"
        };
    
        winstonLogger.info(logEntry);
        originalSend.call(this, body);
      };
    next();
});
app.use("/", indexRouter);
module.exports = app;