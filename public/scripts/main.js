// sessionStorage variables for sign up and log in popup boxes
var popupLogin = sessionStorage.getItem("loginPopup");
var popupSignUp = sessionStorage.getItem("signUpPopup");
var lastNote;
var deletedNote;
var userId = $(".active-user-id").val();

/*var firstNoteOpened = sessionStorage.getItem("firstNoteOpened");*/

// Close log in and sign up popup boxes on dark overlay click
$(".dark-overlay").click(function() {
    $(this).fadeOut(20);
    $("#popup-sign-up").fadeOut(20);
    $("#popup-log-in").fadeOut(20);
    if (popupLogin == "opened") {
        sessionStorage.getItem("popupLogin");
    }
    else if (popupSignUp == "opened") {
        sessionStorage.setItem("popupSignUp", "closed");
    }
});

// Close log in and sign up popup boxes on popup close button click
$(".popup-close").click(function() {
    $(this).parent().parent().fadeOut(20);
    $("#dark-overlay-landing").fadeOut(20);
    if (popupLogin == "opened") {
        sessionStorage.setItem("popupLogin", "closed");
    }
    else if (popupSignUp == "opened") {
        sessionStorage.setItem("popupSignUp", "closed");
    }
});

// Open sign up popup on button click
$(".btn-sign-up").click(function() {
    sessionStorage.setItem("popupSignUp", "opened");
    sessionStorage.setItem("popupLogin", "closed");
    $("#dark-overlay-landing").fadeIn(20);
    $("#popup-sign-up").fadeIn(20);
    $("#popup-sign-up-form-email").focus();
});


// Open log in popup on button click
$(".btn-log-in").click(function() {
    sessionStorage.setItem("popupLogin", "opened");
    sessionStorage.setItem("popupSignUp", "closed");
    $("#dark-overlay-landing").fadeIn(20);
    $("#popup-log-in").fadeIn(20);
    $("#popup-log-in-form-email").focus();
});

// Keep sign up and log in popups open on refresh (for sign up errors)
if (sessionStorage.getItem("popupSignUp") == "opened") {
    sessionStorage.setItem("popupLogin", "closed");
}

if (sessionStorage.getItem("popupLogin") == "opened") {
    sessionStorage.setItem("popupSignUp", "closed");
}

if (sessionStorage.getItem("popupLogin") == "opened") {
    $("#popup-log-in").show();
    $("#dark-overlay-landing").show();
}
else {
    $("#popup-log-in").hide();
}

if (sessionStorage.getItem("popupSignUp") == "opened") {
    $("#popup-sign-up").show();
    $("#dark-overlay-landing").show();
}
else {
    $("#popup-sign-up").hide();
}

// Function to check for a valid email
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    return pattern.test(emailAddress);
}

// Show error when log in form fields have error
$("#popup-log-in-form-submit").click(function() {
    if ($("#popup-log-in-form-email").val().trim() == "") {
        $("#popup-log-in-form-error").html("The email field is empty.");
    }
    else if ($("#popup-log-in-form-password").val() == "") {
        $("#popup-log-in-form-error").html("The password field is empty.");
    }
    else {
        $("#popup-log-in-form").submit();
    }
});

// Show error when sign up form fields have error
$("#popup-sign-up-form-submit").click(function() {
    if ($("#popup-sign-up-form-email").val().trim() == "") {
        $("#popup-sign-up-form-error").html("The email field is empty.");
    }
    else if ($("#popup-sign-up-form-password").val().trim() == "") {
        $("#popup-sign-up-form-error").html("The password field is empty.");
    }
    else if (!isValidEmailAddress($("#popup-sign-up-form-email").val())) {
        $("#popup-sign-up-form-error").html("The email provided is invalid.");
    }
    else {
        $("#popup-sign-up-form").submit();
    }
});

var delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

$(".active-note-delete").click(function() {
    var noteDelete = {
        userId: userId,
        noteId: $(".note-interface:visible > .active-note-id").val()
    };
    deletedNote = noteDelete.noteId;
    socket.emit("delete note", noteDelete);
});

$("body").keydown(function(e){
    if(e.keyCode == 46) {
        var noteDelete = {
            userId: userId,
            noteId: $(".note-interface:visible > .active-note-id").val()
        };
        deletedNote = noteDelete.noteId;
        socket.emit("delete note", noteDelete);
    }
});

socket.on("delete note confirm", function(noteId) {
    var activeNoteId;
    if (deletedNote == noteId) {
        $("#note-label-" + noteId).next().addClass("active-note-label");
        activeNoteId = $("#note-label-" + noteId).next().find(".note-label-id").val();

        $("#note-label-" + noteId).remove();
        $("#note-interface-" + noteId).remove();
    }
    $("#note-interface-" + activeNoteId).show();
    lastNote = activeNoteId;
});

$(document).ready(function() {
    $("body").on("keydown", ".active-note-input", function(event){
        if (!event.ctrlKey) {
            if ($("#reduction-percentage").text() == 0) {
                $(".active-note-input").attr("onkeydown", "");
                delay(function(){
                    var noteChange = {
                        userId: userId,
                        noteId: $(".note-interface:visible").find(".active-note-id").val(),
                        title: $(".note-interface:visible").find(".active-note-title").val(),
                        bodyText: $(".note-interface:visible").find(".active-note-body").val()
                    };
                    socket.emit("note update", noteChange);
                    socket.on("note update confirm", function(noteId) {
                        if (noteId == noteChange.noteId) {
                            if (noteChange.title.length > 22) {
                                $("#note-label-" + noteId).find(".note-label-title").html(noteChange.title.substring(0, 19) + "...");
                            } else {
                                $("#note-label-" + noteId).find(".note-label-title").html(noteChange.title);
                            }
                            $(".text-save-status").html("changes saved");
                            $(".text-save-status").css("color", "#0780ff");
                            setTimeout(function () {
                                $(".text-save-status").html("");
                            }, 400);
                        }
                    });
                }, 100);
                $(".text-save-status").html("saving changes");
                $(".text-save-status").css("color", "orange");
            }
            else {
                $("#dark-overlay-interface").show();
                $(".warn-reset-reduction").show();
            }
        }
    });
});

loadReductionSlider();
function loadReductionSlider() {
    setTimeout(function(){
        var noteInfo = {
            userId: userId,
            noteId: $("#active-note-id").val()
        };
    }, 10);
}

socket.on("note reduction percent", function(initialValue) {
    var min = 0,
        max = 100;
    $("#slider").slider({
        range: "min",
        value: initialValue,
        min: min,
        max: max,
        slide: function(event, ui) {
            $("#reduction-percentage").text(ui.value);
            $(".ui-slider-handle").css("background-color", "White");
            $(".ui-slider-handle").css("border", "none");
            var noteReductionChange = {
                userId: userId,
                noteId: $(".note-interface:visible").find(".active-note-id").val(),
                reduction: ui.value
            };
            socket.emit("set note reduction", noteReductionChange);
            if (ui.value != 0) {
                $(".active-note-body").prop("readonly", true);
            }
            else {
                $(".active-note-body").prop("readonly", false);
            }
        }
    });
    $("#reduction-percentage").text(initialValue);
});

socket.on("note reduction text", function(summarizedText) {
    console.log(summarizedText);
    $(".note-interface:visible").find(".active-note-body").val(summarizedText);
});

socket.on("new note confirm", function(newNote) {
    if (newNote.type == "text") {
        $(".notes .note-label").removeClass("active-note-label");
        $(".notes").append("<div class='note-label active-note-label text-note-label' id='note-label-" + newNote.noteId + "'><textarea class=\"note-label-id\" name=\"noteId\" type=\"text\" style=\"display: none;\">" + newNote.noteId + "</textarea><img class='note-label-icon' src='/images/document-icon.png'><span class='note-label-title'>Untitled note</span><span class='note-label-date'>" + newNote.noteDate + "</span></div>");
        $(".note-interface-container").append("<div class=\"note-interface\" id=\"note-interface-" + newNote.noteId + "\"><input class=\"active-note-input active-note-title\" name=\"noteTitle\" type=\"text\" placeholder=\"Title here\" value=\"" + newNote.noteTitle + "\"><hr style=\"margin: 0; background-color: Black; height: 1px;\"><textarea class=\"active-note-input active-note-body\" name=\"noteBody\" type=\"text\" placeholder=\"Body here\"></textarea><textarea class=\"active-note-id\" name=\"noteId\" type=\"text\" style=\"display: none;\">" + newNote.noteId + "</textarea><span></span><a class=\"active-note-delete\"><img class=\"active-note-delete-icon\" src=\"/images/trash-icon.png\"></a><span class=\"text-save-status\"></span></div>");
        $("#note-interface-" + lastNote).hide();
        $("#note-interface-" + newNote.noteId).show();
        $("#control-panel-reduction").show();
    }
    else {
        $(".notes .note-label").removeClass("active-note-label");
        $(".notes").append("<div class='note-label active-note-label audio-note-label' id='note-label-" + newNote.noteId + "'><textarea class=\"note-label-id\" name=\"noteId\" type=\"text\" style=\"display: none;\">" + newNote.noteId + "</textarea><img class='note-label-icon' src='/images/microphone-icon.png'><span class='note-label-title'>Untitled note</span><span class='note-label-date'>" + newNote.noteDate + "</span></div>");
        $(".note-interface-container").append("<div class=\"note-interface\" id=\"note-interface-" + newNote.noteId + "\"><input class=\"active-note-input active-note-title\" name=\"noteTitle\" type=\"text\" placeholder=\"Title here\" value=\"" + newNote.noteTitle + "\"><hr style=\"margin: 0; background-color: Black; height: 1px;\"><textarea readonly='true' class=\"active-note-transcript\" name=\"noteBody\" type=\"text\" placeholder=\"Transcript will appear here\"></textarea><textarea class=\"active-note-id\" name=\"noteId\" type=\"text\" style=\"display: none;\">" + newNote.noteId + "</textarea><span></span><a class=\"active-note-delete\"><img class=\"active-note-delete-icon\" src=\"/images/trash-icon.png\"></a></div>");
        $("#note-interface-" + lastNote).hide();
        $("#note-interface-" + newNote.noteId).show();
        $("#control-panel-reduction").show();
        if ($(".control-panel").children(".btn-audio").length == 0) {
            $(".control-panel").prepend("<div class='btn-audio' id='record'></div><div class='btn-audio' id='base64'></div>");
            $(".control-panel-hint").css("color", "Green");
            $(".control-panel-hint").text("Click the above button to start recording");
        }
/*      $(".control-panel").append("<a class='btn-stop-audio' id='stop' style='color: White;'>STOP</a>");
        $(".control-panel").append("<a class=\"button\" id=\"download\" style='color: White;'>Download</a>");
        $(".control-panel").append("<a class=\"button\" id=\"play\" style='color: White;'>Play</a>");
        $(".control-panel").append("<a class=\"button\" id=\"mp3\" style='color: White;'>mp3</a>");*!/*/
        $("#record").click(function() {
            $(this).hide();
            $("#base64").show();
            $(".control-panel-hint").css("color", "Red");
            $(".control-panel-hint").text("Click the above button to stop recording");
        });
        $("#base64").click(function() {
            $(this).hide();
            $("#record").show();
            $("#audio-controls").attr("src", "");
            $(".control-panel-hint").css("color", "Green");
            $(".control-panel-hint").text("Click the above button to start recording");
            $(".active-note-transcript").text("Processing...refresh or check back later!");
        });
        if ($(".control-panel").find("#audio-controls").length > 0){
            $("#audio-controls").attr("src", "");
        }
        else {
            $(".control-panel").append("<audio controls id=\"audio-controls\" src=''></audio>");
        }
    }
    lastNote = newNote.noteId;
});

// on("click") is important for making sure this works on appended elements
$("body").on("click", ".note-label", function (){
    var activeNoteId = $(this).find(".note-label-id").val();
    $(".notes > .active-note-label").removeClass("active-note-label");
    $(this).addClass("active-note-label");
    $("#note-interface-" + lastNote).hide();
    $("#note-interface-" + activeNoteId).show();
    lastNote = activeNoteId;
    var noteInfo = {
        userId: userId,
        noteId: activeNoteId
    };
    socket.emit("get note reduction", noteInfo);
    $("#control-panel-reduction").show();
    if ($(this).hasClass("audio-note-label")) {
        var noteInfo = {
            userId: $(".active-user-id").val(),
            noteId: $(".note-interface:visible > .active-note-id").val(),
        };
        socket.emit("get audio note", noteInfo);
    }
    else {
        if ($("#control-panel").find("#audio-controls")) {
            $("#audio-controls").remove();
        }
    }
});

$(".btn-new-note").click(function() {
    if ($(".new-note-text").is(":visible")) {
        $(".new-note-text").hide();
        $(".new-note-type").show();
    }
    else {
        $(".new-note-text").show();
        $(".new-note-type").hide();
    }
});

$(".btn-new-text-note").click(function() {
    socket.emit("new note", userId);
    if ($("#control-panel").find("#audio-controls")) {
        $("#audio-controls").remove();
    }
});

$(".btn-new-audio-note").click(function() {
    socket.emit("new audio note", userId);
});

$(".warn-reset-reduction-proceed").click(function() {
    $(this).parent().hide();
    $("#dark-overlay-interface").hide();
    var noteReductionChange = {
        userId: userId,
        noteId: $(".note-interface:visible").find(".active-note-id").val(),
        reduction: 0
    };
    socket.emit("set note reduction", noteReductionChange);
    $("#slider").slider("value", 0);
    $("#reduction-percentage").text(0);
    $(".active-note-body").prop("readonly", false);
});

$(".warn-reset-reduction-cancel").click(function() {
    $(this).parent().hide();
    $("#dark-overlay-interface").hide();
});

$("#dark-overlay-interface").click(function() {
    $(".warn-reset-reduction").hide();
});

socket.on("hi", function() {
   console.log("hi");
});

socket.on("base64 audio confirm", function(audioInfo) {
    console.log("b64 client recieved");
    if ($(".control-panel").find("#audio-controls").length > 0){
        $("#audio-controls").attr("src", audioInfo.base64URL);
    }
    else {
        $(".control-panel").append("<audio controls id=\"audio-controls\" src='" + audioInfo.base64URL + "'></audio>");
    }
    $(".active-note-transcript").val(audioInfo.transcript);
});

socket.on("audio note info", function(audioNoteInfo) {
    if ($(".control-panel").find("#audio-controls").length > 0){
        $("#audio-controls").attr("src", audioNoteInfo.base64URL);
    }
    else {
        $(".control-panel").append("<audio controls id=\"audio-controls\" src='" + audioNoteInfo.base64URL + "'></audio>");
    }
    $(".active-note-transcript").val(audioNoteInfo.transcript);
    /*if (audioNoteInfo.transcript == "Processing...refresh or check back later!") {
        console.log("hello");
        (function loop() {
        setTimeout(function () {
            console.log("hello");
            $("#note-interface-" + audioNoteInfo.id).load(location.href + " .note-interface" + audioNoteInfo.id);
            loop()
        }, 2000);
        }());
    }*/
});

