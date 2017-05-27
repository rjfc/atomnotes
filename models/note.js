var mongoose = require("mongoose");

var NoteSchema = mongoose.Schema({
    title: String,
    bodyText: String,
    binder: String,
    type: String,
    audioPath: String,
    summarizedBodyText: String,
    summarizedAudioNote: String
});

module.exports = mongoose.model("Note", NoteSchema);