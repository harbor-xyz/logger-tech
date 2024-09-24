import * as fs from 'fs';
import csv from 'csv-parser';
import * as winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

interface CsvRow {
  method: string;
  path: string;
  statusCode: string;
  contextPath: string;
}

interface LogEntry {
  endpoint: string;
  fullendpoint: string;
  contextPath: string;  // Added contextPath
  hostname: string;
  level: string;
  method: string;
  status: string;
  timestamp: string;
  request_id: string;
  job: string;
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.printf(({ message }: { message: any }) => JSON.stringify(message)),
  transports: [
    new winston.transports.File({ filename: 'logSetup/logs/stress.log' })
  ]
});

// Function to generate a random number
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min);

// Function to generate a random query parameter
const randomQueryParam = (): string => `param${randomNumber(1, 10)}=${randomNumber(1, 1000)}`;

// Function to replace placeholders with random numbers
const replacePlaceholders = (str: string): string => str.replace(/{[^}]+}/g, () => randomNumber(1, 1000).toString());

// Function to generate a log entry
const generateLogEntry = (row: CsvRow): LogEntry => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 23);
  const endpoint = replacePlaceholders(row.path);
  const queryParams = `${randomQueryParam()}&${randomQueryParam()}&HTWCP=${randomNumber(1000, 9999)}`;
  
  return {
    endpoint: `${endpoint}?${queryParams}`,
    fullendpoint: `${row.contextPath}${endpoint}?${queryParams}`,
    contextPath: row.contextPath,  // Added contextPath
    hostname: `server${randomNumber(1, 5)}`,
    level: ['info', 'warn', 'error'][randomNumber(0, 2)],
    method: row.method.toLowerCase(),
    status: row.statusCode,
    timestamp,
    request_id: uuidv4(),
    job: 'stress-logs'
  };
};

// Function to read CSV file and return rows
const readCsvFile = (filename: string): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (row: CsvRow) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (error: Error) => reject(error));
  });
};

// Function to generate logs at a specified rate
const generateLogsAtRate = (rows: CsvRow[], targetLogsPerMinute: number): void => {
  let totalLogsWritten = 0;
  let lastCheckpoint = Date.now();
  let index = 0;

  const batchSize = Math.ceil(targetLogsPerMinute / 60); // Logs per second

  const generateLogBatch = () => {
    const startTime = Date.now();
    for (let i = 0; i < batchSize; i++) {
      const logEntry = generateLogEntry(rows[index % rows.length]);
      logger.info(logEntry);
      totalLogsWritten++;
      index++;
    }
    const endTime = Date.now();
    const elapsedMs = endTime - startTime;

    // Check if a minute has passed
    if (endTime - lastCheckpoint >= 60000) {
      const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const actualLogsPerMinute = totalLogsWritten - (lastCheckpoint === 0 ? 0 : totalLogsWritten);
      console.log(`${currentTime} - Logs written in last minute: ${actualLogsPerMinute}, Total logs: ${totalLogsWritten}`);
      lastCheckpoint = endTime;
    }

    // Adjust timing to maintain target rate
    const targetInterval = 1000; // 1 second
    const nextInterval = Math.max(0, targetInterval - elapsedMs);
    setTimeout(generateLogBatch, nextInterval);
  };

  generateLogBatch();
};

// Main function to run the log generator
const runLogGenerator = async (): Promise<void> => {
  try {
    const rows = await readCsvFile('logSetup/logs_base.csv');
    const targetLogsPerMinute = 50000; // You can adjust this value
    console.log(`Starting log generation with target of ${targetLogsPerMinute} logs per minute...`);
    generateLogsAtRate(rows, targetLogsPerMinute);
  } catch (error) {
    console.error('Error reading CSV file:', error);
  }
};

// Run the log generator
runLogGenerator();
