const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const promClient = require('prom-client');
const newrelic = require('newrelic');  // Assuming you're using New Relic

const indexRouter = require("./routes/index");

const app = express();

// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

// Create a counter for HTTP requests
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

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

// Custom middleware for logging and metrics
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      const requestId = uuidv4();
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const fullUrl = req.originalUrl || req.url;
      if (fullUrl.includes('metrics')) {
          return originalSend.call(this, body);
      }
      const queryString = fullUrl.includes('?') ? fullUrl.substring(fullUrl.indexOf('?')) : '';
      
      // Use CSV match info if available
      const csvMatchInfo = res.locals.csvMatchInfo || {};
      const contextPath = csvMatchInfo.contextPath || '';
      const path = csvMatchInfo.path || fullUrl.replace(queryString, '').replace(contextPath, '');
  
      const logEntry = {
        contextpath: contextPath,
        endpoint: `${path}${queryString}`,
        fullendpoint: fullUrl,
        hostname: req.hostname,
        level: "info",
        message: `contextpath: ${contextPath} with request for ${path} with method ${req.method.toLowerCase()} is served with status code ${res.statusCode}`,
        method: req.method.toLowerCase(),
        path_params: "unnormalised",
        status: res.statusCode.toString(),
        timestamp: timestamp,
        request_id: requestId,
        job: "local-logs"
      };
  
      winstonLogger.info(logEntry);
  
      // Increment Prometheus counter
      httpRequestsTotal.labels(req.method, path, res.statusCode).inc();
  
      // New Relic custom attributes
      newrelic.addCustomAttribute('Name', 'WebTransaction/SpringController/GET/'+logEntry['endpoint']);
      newrelic.addCustomAttribute('request_id', requestId);
      newrelic.addCustomAttribute('contextpath', contextPath);
  
      originalSend.call(this, body);
    };
    next();
  });
app.use('/metrics', async function (req, res, next) {
    console.log("metrics")
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

app.use("/", indexRouter);

module.exports = app;
