var express          = require("express"),
    app              = express(),
    http             = require("http").Server(app);
    io               = require("socket.io")(http);
    fs               = require("fs"),
    mkdirp           = require("mkdirp"),
    mongoose         = require("mongoose"),
    passport         = require("passport"),
    summarize        = require("text-summary"),
    bodyParser       = require("body-parser"),
    flash            = require("connect-flash"),
    expressSession   = require("express-session"),
    Speech           = require('@google-cloud/speech');
    LocalStrategy    = require("passport-local").Strategy,
/*  Note             = require("./models/note"),*/
    User             = require("./models/user"),
    mongoose.Promise = require("bluebird");


// Port for server to listen on
var port = 8080;

// Google Cloud Platform project ID
var projectId = "atomnotes-178218";

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

// Instantiates a Google Cloud Platform speech client
var speechClient = Speech();

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
        User.findById(userId, function(error, user){
            user.notes.push({creator: userId, title: "Untitled note"});
            user.save(function(error, user) {
                if (error) {
                    console.log(error);
                }
                else {
                    activeNote = user.notes[user.notes.length - 1]._id.toString();
                    var noteInfo = {
                        noteId: user.notes[user.notes.length - 1]._id.toString(),
                        noteTitle: user.notes[user.notes.length - 1].title,
                        noteDate: user.notes[user.notes.length - 1].dateOfCreation,
                        type: "text"
                    };
                    socket.emit("new note confirm", noteInfo);
                }
            })
        })
    });
    socket.on("new audio note", function(userId) {
        User.findById(userId, function(error, user){
            user.notes.push({creator: userId, title: "Untitled note", type: "audio"});
            user.save(function(error, user) {
                if (error) {
                    console.log(error);
                }
                else {
                    activeNote = user.notes[user.notes.length - 1]._id.toString();
                    var noteInfo = {
                        noteId: user.notes[user.notes.length - 1]._id.toString(),
                        noteTitle: user.notes[user.notes.length - 1].title,
                        noteDate: user.notes[user.notes.length - 1].dateOfCreation,
                        type: "audio"
                    };
                    socket.emit("new note confirm", noteInfo);
                }
            })
        })
    });
    socket.on("delete note", function(noteDelete){
        User.findById(noteDelete.userId, function(error, user){
            user.notes.pull(noteDelete.noteId);
            user.save(function(error) {
                if (error) {
                    console.log(error);
                }
                else {
                    socket.emit("delete note confirm", noteDelete.noteId);
                }
            })
        })
    });
    socket.on("note reduction", function(noteReductionInfo){
        User.findOneAndUpdate(
            {
                "_id": noteReductionInfo.userId,
                "notes._id": noteReductionInfo.noteId
            },
            {
                "$set": {
                    "notes.$.reduction": noteReductionInfo.reduction
                }
            },
            function(error, doc) {
                if (error) {
                    console.log(error);
                }
                else {
                    User.findOne(
                        {
                            "_id": noteReductionInfo.userId,
                            "notes._id": noteReductionInfo.noteId
                        },
                        {
                            "notes.$": 1
                        },
                        function(error, user) {
                            var text = user.notes[0].bodyText,
                                numberSentences = (user.notes[0].bodyText.trim().split(/[\.\?\!]\s/).length) * (1 - (user.notes[0].reduction / 100)),
                                summary,
                                match = text.match(/[^\n]+/g),
                                results = [];

                            for (var i = 0; i < match.length; i++){
                                results.push(summarize.summary(match[i], numberSentences));
                            }

                            summary = results.join("\n\n");

                            User.findOneAndUpdate(
                                {
                                    "_id": noteReductionInfo.userId,
                                    "notes._id": noteReductionInfo.noteId
                                },
                                {
                                    "$set": {
                                        "notes.$.summarizedBodyText": summary
                                    }
                                },
                                function(error, userNote) {
                                    if (error) {
                                        console.log(error);
                                    }
                                    else {
                                        socket.emit("note reduction text", summary);
                                    }
                                }
                            );
                        }
                    );
                }
            }
        );
    });
    socket.on("open note", function(openNoteInfo){
        User.findOne(
            {
                "_id": openNoteInfo.userId,
                "notes._id": openNoteInfo.noteId
            },
            {
                "notes.$": 1
            },
            function(error, user) {
                if (error) {
                    console.log(error);
                }
                else if (user) {
                    var noteInfo = {
                        noteTitle: user.notes[0].title,
                        noteBody: user.notes[0].bodyText
                    };
                    socket.emit("open note confirm", noteInfo);
                }
            }
        );
    });
    socket.on("get note reduction", function(noteInfo){
        User.findOne(
            {
                "_id": noteInfo.userId,
                "notes._id": noteInfo.noteId
            },
            {
              "notes.$": 1
            },
            function(error, user) {
                if (error) {
                    console.log(error);
                }
                else if (user) {
                    socket.emit("note reduction percent", user.notes[0].reduction);
                }
            }
        );
    });
    socket.on("base64 audio", function(base64AudioInfo){
        var audioPath = "doc_files/" + base64AudioInfo.userId + "/audio_notes/";
        mkdirp(audioPath, function (err) {
            if (err)  {
                console.error(err)
            }
            else{
                fs.writeFile(audioPath + base64AudioInfo.noteId + ".wav", base64AudioInfo.base64URL.replace(/^data:audio\/wav;base64,/, ""), {encoding: 'base64'}, function(err){
                    console.log("Audio note saved");
                });
                User.findOneAndUpdate(
                    {
                        "_id": base64AudioInfo.userId,
                        "notes._id": base64AudioInfo.noteId
                    },
                    {
                        "$set": {
                            "notes.$.noteUrl": audioPath + base64AudioInfo.noteId + ".wav"
                        }
                    },
                    function(error, doc) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            var audio = {
                                content: base64AudioInfo.base64URL.replace(/^data:audio\/wav;base64,/, "")
                            };
                            var config = {
                                encoding: 'LINEAR16',
                                sampleRateHertz: 48000,
                                languageCode: 'en-US'
                            };
                            var request = {
                                audio: audio,
                                config: config
                            };
                            speechClient.recognize(request)
                                .then((data) => {
                                    const response = data[0];
                                    const transcription = response.results.map(result =>
                                        result.alternatives[0].transcript).join('\n');
                                    console.log(`Transcription: `, transcription);
                                })
                                .catch((err) => {
                                    console.error('ERROR:', err);
                                });
                            socket.emit("base64 audio confirm", base64AudioInfo);
                        }
                    }
                );
            }
        });
    });
    socket.on("get base64 audio", function(noteInfo){
        User.findOne(
            {
                "_id": noteInfo.userId,
                "notes._id": noteInfo.noteId
            },
            {
                "notes.$": 1
            },
            function(error, user) {
                if (error) {
                    console.log(error);
                }
                else if (user) {
                    var filePath = fs.readFileSync(user.notes[0].noteUrl);
                    var wavBase64 = new Buffer(filePath).toString("base64");
                    socket.emit("base64 audio url", wavBase64);
                }
            }
        );
    });
});

// POST ROUTE: open a note
app.post("/openNote", function(req, res) {
    activeNote = req.body.noteId;
    res.render("interface");
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

// Listen on set port
http.listen(port, function() {
    console.log("Server listening on port " + port);
});