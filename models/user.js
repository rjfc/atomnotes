var bcrypt   = require("bcryptjs"),
    mongoose = require("mongoose");

function getDate()
{
    var date = new Date();
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
}

var NoteSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    dateOfCreation: {
        type: String,
        default: getDate()
    },
    title: String,
    bodyText: String,
    binder: String,
    type: {
        type: String,
        default: "text"
    },
    reduction: {
        type: Number,
        default: 0
    },
    noteUrl: {
        type: String,
        default: "empty"
    },
    summarizedBodyText: String,
    summarizedAudioNote: String
});


var hash_password = function(password) {
    var salt = bcrypt.genSaltSync();
    var hash = bcrypt.hashSync( password, salt );
    return hash;
},
UserSchema = new mongoose.Schema({
    email:  String,
    password: String,
    notes: [NoteSchema]
});

UserSchema.methods.comparePassword = function(password) {
    if (!this.password) { return false; }
    return bcrypt.compareSync( password, this.password );
};

UserSchema.pre('save', function(next) {
    // check if password is present and is modified.
    if ( this.password && this.isModified('password') ) {
        this.password = hash_password(this.password);
    }
    next();
});

module.exports = mongoose.model("User", UserSchema);