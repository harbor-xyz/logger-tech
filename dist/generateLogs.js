"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const winston = __importStar(require("winston"));
const uuid_1 = require("uuid");
// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({ message }) => JSON.stringify(message)),
    transports: [
        new winston.transports.File({ filename: 'logSetup/logs/stress.log' })
    ]
});
// Function to generate a random number
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
// Function to generate a random query parameter
const randomQueryParam = () => `param${randomNumber(1, 10)}=${randomNumber(1, 1000)}`;
// Function to replace placeholders with random numbers
const replacePlaceholders = (str) => str.replace(/{[^}]+}/g, () => randomNumber(1, 1000).toString());
// Function to generate a log entry
const generateLogEntry = (row) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 23);
    const endpoint = replacePlaceholders(row.path);
    const queryParams = `${randomQueryParam()}&${randomQueryParam()}&HTWCP=${randomNumber(1000, 9999)}`;
    return {
        endpoint: `${endpoint}?${queryParams}`,
        fullendpoint: `${row.contextPath}${endpoint}?${queryParams}`,
        hostname: `server${randomNumber(1, 5)}`,
        level: ['info', 'warn', 'error'][randomNumber(0, 2)],
        method: row.method.toLowerCase(),
        status: row.statusCode,
        timestamp,
        request_id: (0, uuid_1.v4)(),
        job: 'local-logs'
    };
};
// Function to read CSV file and return rows
const readCsvFile = (filename) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filename)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', (error) => reject(error));
    });
};
// Function to generate logs at a specified rate
const generateLogsAtRate = (rows, logsPerMinute) => {
    const intervalMs = 60000 / logsPerMinute;
    let index = 0;
    const generateLog = () => {
        const logEntry = generateLogEntry(rows[index % rows.length]);
        logger.info(logEntry);
        index++;
    };
    setInterval(generateLog, intervalMs);
};
// Main function to run the log generator
const runLogGenerator = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield readCsvFile('logSetup/logs_base.csv');
        const logsPerMinute = 100000; // You can adjust this value up to 100000
        console.log(`Starting log generation at ${logsPerMinute} logs per minute...`);
        generateLogsAtRate(rows, logsPerMinute);
    }
    catch (error) {
        console.error('Error reading CSV file:', error);
    }
});
// Run the log generator
runLogGenerator();
