const express = require("express");
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const newrelic = require('newrelic');  // Assuming you're using New Relic

// Store CSV data
let csvRoutes = [];

// Function to convert route pattern to regex
const routeToRegex = (route) => {
  return new RegExp('^' + route.replace(/{[^/]+}/g, '([^/]+)') + '$');
};

// Read CSV file at start
const readCsvFile = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../logSetup/logs_base.csv'))
      .pipe(csv())
      .on('data', (row) => {
        // Convert path to regex when reading
        row.pathRegex = routeToRegex(row.path);
        csvRoutes.push(row);
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
};

// Call this function when the application starts
readCsvFile().catch(error => console.error('Failed to read CSV file:', error));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* Book route */
router.get("/book/*", function (req, res, next) {
  res.status(200).send("Book route");
});

router.all("*", function (req, res, next) {
  // Existing specific routes
	// newrelic.addCustomAttribute
  if (req.method.toLowerCase() === "delete" && req.path.endsWith("/aks/priyeshtest/authenticated/zombie/external/piiDeleteParams")) {
    return res.status(200).send({message:"success"});
  }
  if(req.path.includes("bejoy-rescan")) return res.status(200).json({message: "success."});
  if (req.path.includes("aks200")) {
    return res.status(200).send({message:"AKS 200 success"});
  }
  if (req.method.toLowerCase() === "patch" && req.path.endsWith("aks/priyeshtest/authenticated/zombie/external/piiRequestParams")) {
    return res.status(200).send({message:"success"});
  }
  if (req.method.toLowerCase() === "post" && req.path.endsWith("aks/priyeshtest/unauthenticated/active/external/complexrequest")) {
    return res.status(200).send({message:"success"});
  }

  // New logic to check against CSV routes
  const matchingRoute = csvRoutes.find(route => {
    const fullPath = path.join(route.contextPath || '', route.path);
    const fullPathRegex = routeToRegex(fullPath);
    return (
      (route.pathRegex.test(req.path) || fullPathRegex.test(req.path)) &&
      req.method.toLowerCase() === route.method.toLowerCase()
    );
  });

  if (matchingRoute) {
    // Attach the matched CSV row to the response locals
    res.locals.csvMatchInfo = matchingRoute;
    return res.status(parseInt(matchingRoute.statusCode)).send(`Matched route: ${req.method} ${req.path}`);
  }

  // If no match found, return 404
  res.status(404).send("404 - Page Not Found");
});

module.exports = router;
