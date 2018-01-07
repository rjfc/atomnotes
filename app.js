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
    LZString         = require("lz-string"),
    Speech           = require('@google-cloud/speech'),
    Storage          = require("@google-cloud/storage"),
    LocalStrategy    = require("passport-local").Strategy,
/*  Note             = require("./models/note"),*/
    User             = require("./models/user"),
    mongoose.Promise = require("bluebird");


// Port for server to listen on
var port = 8080;

// Google Cloud Platform
var projectId = "atomnotes-178218";
var gcs = Storage({
    projectId: projectId
});
var bucket = gcs.bucket("audio-notes");

mongoose.connect("mongodb://localhost/atomnotes", {useMongoClient: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(__dirname + "/public"));

// Seed DB
//seedDB();

// Current time in UTC
var currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
var activeNote, userEmail;

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

function getCurrentTime() {
    currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

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
                getCurrentTime();
                console.log(currentTime + " - USER '" + username + "' HAD A LOG IN ERROR: USER DOES NOT EXIST");
                return done(null, false,
                    req.flash("loginError", "A user could not be found with the email provided."));
            }
            if (user && user.comparePassword(password)) {
                // User and password both match, login success
                getCurrentTime();
                console.log(currentTime + " - USER '" + username + "' SUCCESSFULLY LOGGED IN");
                userEmail = username;
                return done(null, user);
            } else {
                // Wrong password
                getCurrentTime();
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
                getCurrentTime();
                console.log(currentTime + " - USER '" + username + "' HAD A SIGN UP ERROR: " + error);
                return done(error);
            }
            // already exists
            if (user) {
                getCurrentTime();
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
                        getCurrentTime();
                        console.log(currentTime + " - USER '" + username + "' HAD A SIGN UP ERROR: COULD NOT SAVE USER");
                        throw err;
                    }
                    userEmail = username;
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
    getCurrentTime();
    console.log(currentTime + " - A USER CONNECTED");
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A NOTE UPDATE ERROR: " + error);
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A NEW NOTE ERROR: " + error);
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A NEW AUDIO NOTE ERROR: " + error);
                }
                else {
                    activeNote = user.notes[user.notes.length - 1]._id.toString();
                    var noteInfo = {
                        noteId: user.notes[user.notes.length - 1]._id.toString(),
                        noteTitle: user.notes[user.notes.length - 1].title,
                        noteDate: user.notes[user.notes.length - 1].dateOfCreation,
                        type: "audio"
                    };
                    console.log(currentTime + " - " + userEmail + " CREATED A NEW AUDIO NOTE: " + noteInfo.noteId);
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A DELETE NOTE ERROR: " + error);
                }
                else {
                    var notePath = "doc_files/" + noteDelete.userId + "/audio_notes/" + noteDelete.noteId + ".wav";
                    fs.stat(notePath, function (err, note) {
                        fs.unlink(notePath, function(err){
                            if(err) return console.log(currentTime + " - " + userEmail + " DELETED A TEXT NOTE '" + noteDelete.noteId + "'");
                            console.log(currentTime + " - " + userEmail + " DELETED AUDIO NOTE '" + noteDelete.noteId + "' FILE");
                        });
                    });
                    socket.emit("delete note confirm", noteDelete.noteId);
                }
            })
        })
    });
    socket.on("set note reduction", function(noteReductionInfo){
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A NOTE SETTING REDUCTION ERROR: " + error);
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
                            if (user.notes[0].bodyText.length > 0) {
                                var text = user.notes[0].bodyText,
                                    numberSentences = (user.notes[0].bodyText.trim().split(/[\.\?\!]\s/).length) * (1 - (user.notes[0].reduction / 100)),
                                    summary,
                                    match = text.match(/[^\n]+/g),
                                    results = [];

                                for (var i = 0; i < match.length; i++) {
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
                                    function (error, userNote) {
                                        if (error) {
                                            getCurrentTime();
                                            console.log(currentTime + " - " + userEmail + " HAD A SUMMARIZED BODY TEXT UPDATE ERROR: " + error);
                                        }
                                        else {
                                            socket.emit("note reduction text", summary);
                                        }
                                    }
                                );
                            }
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A NOTE OPENING ERROR: " + error);
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A GETTING NOTE REDUCTION ERROR: " +  error);
                }
                else if (user) {
                    var isEmpty = false;
                    if (user.notes[0].type == "audio") {
                        if (user.notes[0].noteUrl == null) {
                            isEmpty = true;
                        }
                    }
                    else {
                        if (user.notes[0].bodyText == null) {
                            isEmpty = true;
                        }
                    }
                    var noteInfo = {
                        isEmpty: isEmpty,
                        reduction: user.notes[0].reduction
                    };
                    socket.emit("note reduction percent", noteInfo);
                }
            }
        );
    });
    socket.on("set base64 audio", function(base64AudioInfo){
        User.findOneAndUpdate(
            {
                "_id": base64AudioInfo.userId,
                "notes._id": base64AudioInfo.noteId
            },
            {
                "$set": {
                    "notes.$.bodyText": "Processing...refresh or check back later!"
                }
            },
            function(error, doc) {
                if (error) {
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD A PLACEHOLDER BODY TEXT SETTING ERROR: " + error);
                }
                else {
                    var audioPath = "doc_files/" + base64AudioInfo.userId + "/audio_notes/";
                    var gcsUri;
                    mkdirp(audioPath, function (err) {
                        if (err)  {
                            console.error(err)
                        }
                        else{
                            var decompressedAudio = LZString.decompressFromEncodedURIComponent(base64AudioInfo.base64URL);
                            getCurrentTime();
                            console.log(currentTime + " - " + userEmail + " SAVED AN AUDIO NOTE '" + base64AudioInfo.noteId + "' OF LENGTH: " + decompressedAudio.length);
                            fs.writeFile(audioPath + base64AudioInfo.noteId + ".wav", decompressedAudio.replace(/^data:audio\/wav;base64,/, ""), {encoding: "base64"}, function(err){
                                getCurrentTime();
                                console.log(currentTime + " - " + userEmail + " SAVED AN AUDIO NOTE'" + base64AudioInfo.noteId + "' AS A FILE: " + audioPath + base64AudioInfo.noteId + ".wav");
                                bucket.upload(audioPath + base64AudioInfo.noteId + ".wav", function(err, file) {
                                    if (err) throw new Error(currentTime + " - " + userEmail + " HAD A AUDIO NOTE '" + base64AudioInfo.noteId + "' GOOGLE CLOUD UPLOAD ERROR: " + err);
                                    gcsUri = "gs://audio-notes/" + base64AudioInfo.noteId + ".wav";
                                    getCurrentTime();
                                    console.log(currentTime + " - " + userEmail + " UPLOADED AN AUDIO NOTE '" + base64AudioInfo.noteId + "' TO GOOGLE CLOUD: " + gcsUri);
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
                                                getCurrentTime();
                                                console.log(currentTime + " - " + userEmail + " HAD A AUDIO NOTE PATH SAVING ERROR: " + error);
                                            }
                                            else {
                                                var audio = {
                                                    //content: base64AudioInfo.base64URL.replace(/^data:audio\/wav;base64,/, "")
                                                    uri: gcsUri
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
                                                function sentenceCase(input, lowercaseBefore) {
                                                    input = ( input === undefined || input === null ) ? '' : input;
                                                    if (lowercaseBefore) { input = input.toLowerCase(); }
                                                    return input.toString().replace( /(^|\. *)([a-z])/g, function(match, separator, char) {
                                                        return separator + char.toUpperCase();
                                                    });
                                                }
                                                speechClient.longRunningRecognize(request)
                                                .then((data) => {
                                                    var operation = data[0];
                                                    return operation.promise();
                                                })
                                                .then((data) => {
                                                var response = data[0];
                                                    var transcript = response.results.map(result => result.alternatives[0].transcript).join('\n').replace(/\n/g, ". ") + ". ";
                                                    if (transcript == ". ") transcript = "";
                                                    transcript = sentenceCase(transcript);
                                                    getCurrentTime();
                                                    console.log(currentTime + " - " + userEmail + " TRANSCRIPTED AN AUDIO NOTE '" + base64AudioInfo.noteId + "': " + transcript);
                                                    // https://www.npmjs.com/package/pitchfinder for question mark implementation
                                                    base64AudioInfo.transcript = transcript;
                                                    User.findOneAndUpdate(
                                                        {
                                                            "_id": base64AudioInfo.userId,
                                                            "notes._id": base64AudioInfo.noteId
                                                        },
                                                        {
                                                            "$set": {
                                                                "notes.$.bodyText": transcript
                                                            }
                                                        },
                                                        function(error, doc) {
                                                            if (error) {
                                                                getCurrentTime();
                                                                console.log(currentTime + " - " + userEmail + " HAD AUDIO NOTE '" + base64AudioInfo.noteId +"' TRANSCRIPT SAVING ERROR: " + error);
                                                            }
                                                            else {
                                                                getCurrentTime();
                                                                console.log(currentTime + " - " + userEmail + " EMITTED BASE64 AUDIO OF AUDIO NOTE '" + base64AudioInfo.noteId +"' TO CLIENT");
                                                                socket.emit("base64 audio confirm", base64AudioInfo);
                                                            }
                                                        }
                                                    );
                                                })
                                                .catch((err) => {
                                                    console.error(currentTime + " - " + userEmail + " HAD AUDIO NOTE '" + base64AudioInfo.noteId +"' TRANSCRIPT BUILDING ERROR: " + err);
                                                });
                                            }
                                        }
                                    );
                                });
                            });
                        }
                    });
                }
            }
        );
    });
    socket.on("get audio note", function(noteInfo){
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
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " HAD AUDIO NOTE '" + noteInfo.noteId +"' URL GETTING ERROR: " + error);
                }
                else {
                    getCurrentTime();
                    console.log(currentTime + " - " + userEmail + " GOT AUDIO NOTE '" + noteInfo.noteId +"' URL: " + user.notes[0].noteUrl);
                    var audioNoteInfo = {
                        id: user.notes[0]._id,
                        base64Url: "",
                        transcript: user.notes[0].bodyText
                    };
                    if (user.notes[0].noteUrl !== null) {
                        var filePath = fs.readFileSync(user.notes[0].noteUrl);
                        var wavBase64 = new Buffer(filePath).toString("base64");
                        audioNoteInfo.base64Url = LZString.compressToEncodedURIComponent("data:audio/wav;base64," + wavBase64);
                    }
                    socket.emit("audio note info", audioNoteInfo)
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


// Listen on set port
http.listen(port, function() {
    getCurrentTime();
    console.log(currentTime + " - SERVER LISTENING ON PORT " + port);
});