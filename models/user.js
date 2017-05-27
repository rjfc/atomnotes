var bcrypt   = require("bcryptjs"),
    mongoose = require("mongoose");

var hash_password = function(password) {
        var salt = bcrypt.genSaltSync();
        var hash = bcrypt.hashSync( password, salt );
        return hash;
    },
    UserSchema = new mongoose.Schema({
        email:  String,
        password: String,
        notes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Note"
            }
        ]
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