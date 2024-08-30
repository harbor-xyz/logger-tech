var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* Book route */
router.get("/book/*", function (req, res, next) {
  res.status(200).send("Book route");
});

router.get("*", function (req, res, next) {
  res.status(404).send("404 - Page Not Found");
});

module.exports = router;
