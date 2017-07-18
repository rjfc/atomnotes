// sessionStorage variables for sign up and log in popup boxes
var popupLogin = sessionStorage.getItem("loginPopup");
var popupSignUp = sessionStorage.getItem("signUpPopup");
var lastNote;

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

/*
 $("body").on("click", ".btn-new-note", function(event){
 socket.emit("new note", $(".active-user-id").val());
 });
 */

$("body").on("click", ".active-note-delete", function(event){
    var noteDelete = {
        userId: $(".active-user-id").val(),
        noteId: $("#active-note-id").val()
    }
    socket.emit("delete note", noteDelete);
    setTimeout(function () {
        $('.notes-panel').load("/ .notes-panel > *");
         $('.note-interface').load('/ .note-interface > *');
        loadReductionSlider();
    }, 15);
});

$("body").keydown(function(e){
    if(e.keyCode == 46) {
        var noteDelete = {
            userId: $(".active-user-id").val(),
            noteId: $("#active-note-id").val()
        }
        socket.emit("delete note", noteDelete);
        setTimeout(function () {
            $('.notes-panel').load("/ .notes-panel > *");
            $('.note-interface').load('/ .note-interface > *');
            loadReductionSlider();
        }, 15);
    }
});

$(document).ready(function() {
    $("body").on("keyup", ".active-note-input", function(event){
        if ($("#reduction-percentage").text() == 0) {
            $(".active-note-input").attr("onkeydown", "");
            delay(function(){
                /*$("#update-note-form").submit();
                 setTimeout(function () {
                 $('.notes-panel').load('/interface .notes-panel > *');
                 }, 15);*/
                var noteChange = {
                    userId: $(".active-user-id").val(),
                    noteId: $("#active-note-id").val(),
                    title: $(".active-note-title").val(),
                    bodyText: $(".active-note-body").val()
                };
                socket.emit("note update", noteChange);
                setTimeout(function () {
                    $('.notes-panel').load("/ .notes-panel > *");
                    loadReductionSlider();
                }, 15);
                socket.on("note update confirm", function(noteId) {
                    if (noteId == noteChange.noteId) {
                        $(".text-save-status").html("changes saved");
                        $(".text-save-status").css("color", "#0780ff");
                    }
                });
            }, 400);
            $(".text-save-status").html("saving changes");
            $(".text-save-status").css("color", "orange");
        }
        else {

            $("#dark-overlay-interface").show();
        }
    });
});

loadReductionSlider();

function loadReductionSlider() {
    setTimeout(function(){
        var noteInfo = {
            userId: $(".active-user-id").val(),
            noteId: $("#active-note-id").val()
        };/*
        socket.emit("get note reduction", noteInfo);
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
                    if (ui.value != 0) {
                        $(".active-note-input").attr("onkeydown", "return false;");
                    }
                    else {}
                    var noteReductionChange = {
                        userId: $(".active-user-id").val(),
                        noteId: $("#active-note-id").val(),
                        reduction: ui.value
                    };
                    socket.emit("note reduction", noteReductionChange);
                }
            });
            $("#reduction-percentage").text(initialValue);
        });*/
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
                userId: $(".active-user-id").val(),
                noteId: $("#active-note-id").val(),
                reduction: ui.value
            };
            socket.emit("note reduction", noteReductionChange);
        }
    });
    $("#reduction-percentage").text(initialValue);
});

socket.on("note reduction text", function(summarizedText) {
    $(".active-note-body").text(summarizedText);
});

socket.on("new note confirm", function(newNote) {
    $(".notes .note-label").removeClass("active-note-label");
    $(".notes").append("<div class='note-label active-note-label'onclick='document.getElementById(&quot;open-note-" + newNote.noteId + "-form&quot;).submit();'><img class='note-label-icon' src='/images/document-icon.png'>Untitled note<span class='note-label-date'>" + newNote.noteDate + "</span></div>");
});

/*
$("body").on("click", ".note-label", function(event){
   if (firstNoteOpened !== null && firstNoteOpened !== undefined) {
        setTimeout(function(){
            $('.side-panel').load('/ .side-panel > *');
            $('.notes-panel').load('/ .notes-panel > *');
            $('.note-interface').load('/ .note-interface > *');
            loadReductionSlider();
        }, 10);
    }
    else {
        location.reload();
        sessionStorage.setItem("firstNoteOpened", "no");
    }
});*/

$(".note-label").click(function(){
   /* var openNoteInfo = {
        userId: $(".active-user-id").val(),
        noteId: $(this).find(".note-label-id").val()
    };
    console.log($(this).find(".note-label-id").val());
    socket.emit("open note", openNoteInfo);*/
    var activeNoteId = $(this).find(".note-label-id").val();
/*   $(".active-note-interface").addClass("note-interface");
    $(".active-note-interface").removeClass("active-note-interface");
    $(".note-interface").addClass("note-interface");
    $("#note-interface-" + activeNoteId).addClass("active-note-interface");
    $("#note-interface-" + activeNoteId).removeClass("note-interface");*/
    $("#note-interface-" + lastNote).hide();
    $("#note-interface-" + activeNoteId).show();
    lastNote = activeNoteId;

});

/*socket.on("open note confirm", function(openedNote) {
    console.log(openedNote.title);
    $(".active-note-title").val(openedNote.noteTitle);
    $(".active-note-body").val(openedNote.noteBody);
});*/

$("body").on("click", ".btn-new-note", function(event){
/*    document.getElementById('new-note-form').submit();
    setTimeout(function(){
        $('.side-panel').load('/ .side-panel > *');
        $('.note-interface').load('/ .note-interface > *');
        loadReductionSlider();
    }, 10);*/
    socket.emit("new note", $(".active-user-id").val());
});