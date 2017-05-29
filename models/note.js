/*
mongoose = require("mongoose");

var NoteSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
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

module.exports = mongoose.model("Note", NoteSchema);*/
