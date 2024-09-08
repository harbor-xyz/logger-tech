"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var csv_parser_1 = require("csv-parser");
var winston = require("winston");
var uuid_1 = require("uuid");
var newrelic_1 = require("newrelic");
var dotenv_1 = require("dotenv");
// Load environment variables
dotenv_1.default.config();
// Check if New Relic license key is set
if (!process.env.NEW_RELIC_LICENSE_KEY) {
    console.error('NEW_RELIC_LICENSE_KEY environment variable is not set');
    process.exit(1);
}
// Configure Winston logger
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(function (_a) {
        var message = _a.message;
        return JSON.stringify(message);
    }),
    transports: [
        new winston.transports.File({ filename: 'logSetup/logs/stress.log' })
    ]
});
// Function to generate a random number
var randomNumber = function (min, max) { return Math.floor(Math.random() * (max - min + 1) + min); };
// Function to generate a random query parameter
var randomQueryParam = function () { return "param".concat(randomNumber(1, 10), "=").concat(randomNumber(1, 1000)); };
// Function to replace placeholders with random numbers
var replacePlaceholders = function (str) { return str.replace(/{[^}]+}/g, function () { return randomNumber(1, 1000).toString(); }); };
// Function to generate a log entry
var generateLogEntry = function (row) {
    var timestamp = new Date().toISOString().replace('T', ' ').slice(0, 23);
    var endpoint = replacePlaceholders(row.path);
    var queryParams = "".concat(randomQueryParam(), "&").concat(randomQueryParam(), "&HTWCP=").concat(randomNumber(1000, 9999));
    return {
        endpoint: "".concat(endpoint, "?").concat(queryParams),
        fullendpoint: "".concat(row.contextPath).concat(endpoint, "?").concat(queryParams),
        contextPath: row.contextPath,
        hostname: "server".concat(randomNumber(1, 5)),
        level: ['info', 'warn', 'error'][randomNumber(0, 2)],
        method: row.method.toLowerCase(),
        status: row.statusCode,
        timestamp: timestamp,
        request_id: (0, uuid_1.v4)(),
        job: 'local-logs'
    };
};
// Function to read CSV file and return rows
var readCsvFile = function (filename) {
    return new Promise(function (resolve, reject) {
        var rows = [];
        fs.createReadStream(filename)
            .pipe((0, csv_parser_1.default)())
            .on('data', function (row) { return rows.push(row); })
            .on('end', function () { return resolve(rows); })
            .on('error', function (error) { return reject(error); });
    });
};
// Function to send log entry to New Relic as a transaction
var sendToNewRelic = function (logEntry) {
    newrelic_1.default.startWebTransaction(logEntry.fullendpoint, function transactionHandler() {
        var transaction = newrelic_1.default.getTransaction();
        transaction.http.statusCode = parseInt(logEntry.status);
        transaction.http.method = logEntry.method;
        newrelic_1.default.addCustomAttribute('request_id', logEntry.request_id);
        newrelic_1.default.addCustomAttribute('level', logEntry.level);
        newrelic_1.default.addCustomAttribute('hostname', logEntry.hostname);
        newrelic_1.default.addCustomAttribute('job', logEntry.job);
        transaction.end();
    });
};
// Function to generate logs at a specified rate
var generateLogsAtRate = function (rows, targetLogsPerMinute) {
    var totalLogsWritten = 0;
    var lastCheckpoint = Date.now();
    var index = 0;
    var batchSize = Math.ceil(targetLogsPerMinute / 60); // Logs per second
    var generateLogBatch = function () {
        var startTime = Date.now();
        for (var i = 0; i < batchSize; i++) {
            var logEntry = generateLogEntry(rows[index % rows.length]);
            logger.info(logEntry);
            sendToNewRelic(logEntry);
            totalLogsWritten++;
            index++;
        }
        var endTime = Date.now();
        var elapsedMs = endTime - startTime;
        // Check if a minute has passed
        if (endTime - lastCheckpoint >= 60000) {
            var currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
            var actualLogsPerMinute = totalLogsWritten - (lastCheckpoint === 0 ? 0 : totalLogsWritten);
            console.log("".concat(currentTime, " - Logs written in last minute: ").concat(actualLogsPerMinute, ", Total logs: ").concat(totalLogsWritten));
            lastCheckpoint = endTime;
        }
        // Adjust timing to maintain target rate
        var targetInterval = 1000; // 1 second
        var nextInterval = Math.max(0, targetInterval - elapsedMs);
        setTimeout(generateLogBatch, nextInterval);
    };
    generateLogBatch();
};
// Main function to run the log generator
var runLogGenerator = function () { return __awaiter(void 0, void 0, void 0, function () {
    var rows, targetLogsPerMinute, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, readCsvFile('logSetup/logs_base.csv')];
            case 1:
                rows = _a.sent();
                targetLogsPerMinute = 100000;
                console.log("Starting log generation with target of ".concat(targetLogsPerMinute, " logs per minute..."));
                generateLogsAtRate(rows, targetLogsPerMinute);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error reading CSV file:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Run the log generator
runLogGenerator();
