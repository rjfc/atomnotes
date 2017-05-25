var express          = require("express"),
    app              = express(),
    http             = require("http").Server(app);
    mongoose         = require("mongoose")
    passport         = require("passport"),
    bodyParser       = require("body-parser"),
    flash            = require("connect-flash"),
    expressSession   = require("express-session"),
    LocalStrategy    = require("passport-local").Strategy,
    User             = require("./models/user")

// Port for server to listen on
var port = 8080;

mongoose.connect("mongodb://localhost/gistnotes");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(__dirname + "/public"));

// Seed DB
//seedDB();

// PASSPORT CONFIGURATION
app.use(expressSession({
    secret: "MMM I love me some good garlic bread",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id.toString());
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.loginError = req.flash("loginError");
    res.locals.registerError = req.flash("registerError");
    res.locals.globalUserSearchQuery = req.globalUserSearchQuery;
    next();
});

// Passport login LocalStrategy
passport.use("login", new LocalStrategy({
    passReqToCallback : true
}, function(req, email, password, done) {
    // Check in mongo if a user with email exists or not
    User.findOne({"email" : email },
        function(error, user) {
            // In case of any error, return using the done method
            if (error)
                return done(error);
            // User not found
            if (!user){
                console.log(currentTime + " - USER_LOG_IN_ERROR: USERNAME '" + email + "' DOES NOT EXIST");
                return done(null, false,
                    req.flash("loginError", "A user could not be found with the username provided."));
            }
            if (user && user.comparePassword(password)) {
                // User and password both match, login success
                console.log(currentTime + " - USER_LOG_IN_SUCCESS: '" + email + "' LOGGED IN");
                return done(null, user);
            } else {
                // Wrong password
                console.log(currentTime + " - USER_LOG_IN_ERROR: '" + email + "' ENTERED INVALID PASSWORD");
                return done( null, false,
                    req.flash("loginError", "The password is invalid."));
            }
            // User and password both match, login success
            return done(null, user);
        }
    );
}));

passport.use("register", new LocalStrategy({
        passReqToCallback : true
    },
    function(req, email, password, done) {
        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            User.findOne({"email" : email}, function(error, user) {
                // In case of any error return
                if (error){
                    console.log(currentTime + " - USER_SIGN_UP_ERROR: " + error);
                    return done(error);
                }
                // already exists
                if (user) {
                    console.log(currentTime + " - USER_SIGN_UP_ERROR: USER '" + email + "' ALREADY EXISTS");
                    return done(null, false,
                        req.flash("registerError", "A user with the username provided already exists."));
                } else {
                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    // set the user's local credentials
                    newUser.email = email;
                    newUser.password = password;
                    // save the user
                    newUser.save(function(err) {
                        if (err){
                            console.log(currentTime + " - USER_SIGN_UP_ERROR: COULD NOT SAVE USER - " + err);
                            throw err;
                        }
                        console.log(currentTime + " - USER_SIGN_UP_SUCCESS: NEW USER '" + email + "'");
                        return done(null, newUser);
                    });
                }
            });
        };
    // Delay the execution of findOrCreateUser and execute
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
}));

// GET ROUTE: landing page
app.get("/", function(req, res) {
    res.render("landing");
});

// POST ROUTE: register user
app.post('/register', passport.authenticate('register', {
    successRedirect: '/interface',
    failureRedirect: '/',
    failureFlash : true
}));

// POST ROUTE: login user
app.post('/login', passport.authenticate('login', {
    successRedirect: '/interface',
    failureRedirect: '/',
    failureFlash : true
}));

// GET ROUTE: main page
app.get("/interface", function(req, res) {
    res.render("interface");
});

// Listen on set port
http.listen(port, function() {
    console.log("Server listening on port " + 8080);
});