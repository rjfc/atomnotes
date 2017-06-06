// sessionStorage variables for sign up and log in popup boxes
var popupLogin = sessionStorage.getItem("loginPopup");
var popupSignUp = sessionStorage.getItem("signUpPopup");

// Close log in and sign up popup boxes on dark overlay click
$(".dark-overlay").click(function() {
    $(this).fadeOut(20);
    $("#popup-sign-up").fadeOut(20);
    $("#popup-log-in").fadeOut(20);
    if (popupLogin == "opened") {
        sessionStorage.setItem("popupLogin", "closed");
    }
    else if (popupSignUp == "opened") {
        sessionStorage.setItem("popupSignUp", "closed");
    }
});

// Close log in and sign up popup boxes on popup close button click
$(".popup-close").click(function() {
    $(this).parent().parent().fadeOut(20);
    $(".dark-overlay").fadeOut(20);
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
    $(".dark-overlay").fadeIn(20);
    $("#popup-sign-up").fadeIn(20);
    $("#popup-sign-up-form-email").focus();
});


// Open log in popup on button click
$(".btn-log-in").click(function() {
    sessionStorage.setItem("popupLogin", "opened");
    sessionStorage.setItem("popupSignUp", "closed");
    $(".dark-overlay").fadeIn(20);
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
    $(".dark-overlay").show();
}
else {
    $("#popup-log-in").hide();
}

if (sessionStorage.getItem("popupSignUp") == "opened") {
    $("#popup-sign-up").show();
    $(".dark-overlay").show();
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

$("body").on("click", ".btn-new-note", function(event){
    socket.emit("new note", $(".active-user-id").val());
});

$("body").on("click", ".active-note-delete", function(event){
    var noteDelete = {
        userId: $(".active-user-id").val(),
        noteId: $("#active-note-id").val()
    }
    socket.emit("delete note", noteDelete);
    setTimeout(function () {
        $('.side-panel').load("/ .side-panel > *");
    }, 15);
});

$(document).ready(function() {
    $("body").on("keyup", ".active-note-input", function(event){
        delay(function(){
            /*$("#update-note-form").submit();
            setTimeout(function () {
                $('.side-panel').load('/interface .side-panel > *');
            }, 15);*/
            console.log("Active note input keyup detected");
            var noteChange = {
                userId: $(".active-user-id").val(),
                noteId: $("#active-note-id").val(),
                title: $(".active-note-title").val(),
                bodyText: $(".active-note-body").val()
            };
            socket.emit("note update", noteChange);
            setTimeout(function () {
                $('.side-panel').load("/ .side-panel > *");
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
    });
});
