var express          = require("express"),
    app              = express(),
    http             = require("http").Server(app);
    io               = require("socket.io")(http);
    mongoose         = require("mongoose")
    passport         = require("passport"),
    bodyParser       = require("body-parser"),
    flash            = require("connect-flash"),
    expressSession   = require("express-session"),
    LocalStrategy    = require("passport-local").Strategy,
/*  Note             = require("./models/note"),*/
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

// Current time in UTC
var currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
var activeNote;

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
    res.locals.loginError =  req.flash("loginError");
    res.locals.registerError = req.flash("registerError");
    res.locals.activeNote = undefined;
    next();
});

// Passport login LocalStrategy
passport.use("login", new LocalStrategy({
    usernameField: "email",
    passReqToCallback : true
}, function(req, username, password, done) {
  // Check in mongo if a user with email exists or not
    User.findOne({"email" : username },
        function(error, user) {
            // In case of any error, return using the done method
            if (error)
                return done(error);
            // User not found
            if (!user) {
                console.log(currentTime + " - USER '" + username + "' HAD A LOG IN ERROR: USER DOES NOT EXIST");
                return done(null, false,
                    req.flash("loginError", "A user could not be found with the email provided."));
            }
            if (user && user.comparePassword(password)) {
                // User and password both match, login success
                console.log(currentTime + " - USER '" + username + "' SUCCESSFULLY LOGGED IN");
                return done(null, user);
            } else {
                // Wrong password
                console.log(currentTime + " - USER '" + username + "' HAD A LOG IN ERROR: ENTERED INVALID PASSWORD");
                return done(null, false,
                    req.flash("loginError", "The password is invalid."));
            }
            // User and password both match, login success
            return done(null, user);
        }
    );
}));

passport.use("register", new LocalStrategy({
    usernameField: "email",
    passReqToCallback : true
},
function(req, username, password, done) {
    findOrCreateUser = function(){
        // find a user in Mongo with provided username
        User.findOne({"email" : username}, function(error, user) {
            // In case of any error return
            if (error){
                console.log(currentTime + " - USER '" + username + "' HAD A SIGN UP ERROR: " + error);
                return done(error);
            }
            // already exists
            if (user) {
                console.log(currentTime + " - USER '" + username + "' HAD A SIGN UP ERROR: USER ALREADY EXISTS");
                return done(null, false,
                    req.flash("registerError", "A user with the email provided already exists."));
            } else {
                // if there is no user with that email
                // create the user
                var newUser = new User();
                // set the user's local credentials
                newUser.email = username;
                newUser.password = password;
                // save the user
                newUser.save(function(err) {
                    if (err){
                        console.log(currentTime + " - USER '" + username + "' HAD A SIGN UP ERROR: COULD NOT SAVE USER");
                        throw err;
                    }
                    console.log(currentTime + " - USER '" + username + "' SUCCESSFULLY SIGNED UP");
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
    if (!req.user) {
        res.render("landing");
    }
    else {
        res.render("interface", {activeNote: activeNote});
    }
});

// POST ROUTE: register user
app.post("/register", passport.authenticate("register", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash : true
}));

// POST ROUTE: login user
app.post("/login", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash : true
}));

// Socket.IO connection
io.on("connection", function(socket){
    console.log("A USER CONNECTED");
    socket.on("note update", function(updatedNote){
        User.findOneAndUpdate(
            {
                "_id": updatedNote.userId,
                "notes._id": updatedNote.noteId
            },
            {
                "$set": {
                    "notes.$.title": updatedNote.title,
                    "notes.$.bodyText": updatedNote.bodyText
                }
            },
            function(error, user) {
                if (error) {
                    console.log(error);
                }
                else {
                    socket.emit("note update confirm", updatedNote.noteId);
                }
            }
        );
    });
    socket.on("new note", function(userId){
        /*User.findById(userId, function(error, user){
            user.notes.push({creator: userId.toString(), title: "Untitled note"});
            user.save(function(error, user) {
                if (error) {
                    console.log(error);
                }
                else {
                    activeNote = user.notes[user.notes.length - 1]._id;
                    console.log(activeNote);
                }
            })
        })*/
    });
    socket.on("delete note", function(noteDelete){
        User.findById(noteDelete.userId, function(error, user){
            user.notes.pull(noteDelete.noteId);
            user.save(function(error) {
                if (error) {
                    console.log(error);
                }
            })
        })
    });
});

// POST ROUTE: create a note
/*
app.post("/newNote", function(req, res) {
    req.user.notes.push({creator: req.user._id.toString(), title : "Untitled note"});
    req.user.save(function(error) {
        if (error) {
            console.log(error);
        }
        else {
            res.render("interface");
        }
    })
});
*/

// POST ROUTE: open a note
app.post("/openNote", function(req, res) {
    /*User.findOne({"notes._id": req.body.noteId}, {'notes.$': 1}, function(error, note) {
        if (error) {
            console.log(error);
        }
        else {
            activeNote = note.notes;
            res.render("interface");
        }
    });*/
    activeNote = req.body.noteId;
    res.render("interface");
});

app.post("/newNote", function(req, res) {
    User.findById(req.user._id, function(error, user){
        user.notes.push({creator: req.user._id.toString(), title: "Untitled note"});
        user.save(function(error, user) {
            if (error) {
                console.log(error);
            }
            else {
                activeNote = user.notes[user.notes.length - 1]._id.toString();
                consloe.log(activeNote);
                res.render("interface");
            }
        })
    })
});


/*// POST ROUTE: update a note
app.post("/updateNote", function(req, res) {
    User.findOneAndUpdate(
        {
            "_id": req.user._id.toString(),
            "notes._id": req.body.noteId
        },
        {
            "$set": {
                "notes.$.title": req.body.noteTitle,
                "notes.$.bodyText": req.body.noteBody
            }
        },
        function(error, user) {
            if (error) {
                console.log(error);
            }
            else {
                res.render("interface");
            }
        }
    );
});*/

// GET ROUTE: main page
/*app.get("/interface", function(req, res) {
    res.render("interface", {activeNote: activeNote});
});*/

// Listen on set port
http.listen(port, function() {
    console.log("Server listening on port " + 8080);
});