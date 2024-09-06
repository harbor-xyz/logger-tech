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

/* Book route */
router.get("/book/*", function (req, res, next) {
  res.status(200).send("Book route");
});

router.all("*", function (req, res, next) {
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
  res.status(404).send("404 - Page Not Found");
});

module.exports = router;
