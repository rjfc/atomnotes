var mongoose = require("mongoose");

var NoteSchema = mongoose.Schema({
    dateOfCreation: {
        type: Date,
        default: Date.now
    },
    title: String,
    bodyText: String,
    binder: String,
    type: {
        type: String,
        default: "Text"
    },
    audioPath: String,
    summarizedBodyText: String,
    summarizedAudioNote: String
});

module.exports = mongoose.model("Note", NoteSchema);