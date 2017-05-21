var express          = require("express"),
    app              = express(),
    http             = require("http").Server(app);

// Port for server to listen on
var port = 8080;

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// GET ROUTE: landing page
app.get("/", function(req, res) {
    res.render("landing");
});

// GET ROUTE: main page
app.get("/notes", function(req, res) {
    res.render("interface");
});

// Listen on set port
http.listen(port, function() {
    console.log("Server listening on port " + 8080);
});