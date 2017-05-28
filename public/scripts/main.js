// localStorage variables for sign up and log in popup boxes
var popupLogin = localStorage.getItem("loginPopup");
var popupSignUp = localStorage.getItem("signUpPopup");

// Close log in and sign up popup boxes on dark overlay click
$(".dark-overlay").click(function() {
    $(this).fadeOut(20);
    $("#popup-sign-up").fadeOut(20);
    $("#popup-log-in").fadeOut(20);
    if (popupLogin == "opened") {
        localStorage.setItem("popupLogin", "closed");
    }
    else if (popupSignUp == "opened") {
        localStorage.setItem("popupSignUp", "closed");
    }
});

// Close log in and sign up popup boxes on popup close button click
$(".popup-close").click(function() {
    $(this).parent().parent().fadeOut(20);
    $(".dark-overlay").fadeOut(20);
    if (popupLogin == "opened") {
        localStorage.setItem("popupLogin", "closed");
    }
    else if (popupSignUp == "opened") {
        localStorage.setItem("popupSignUp", "closed");
    }
});

// Open sign up popup on button click
$(".btn-sign-up").click(function() {
    localStorage.setItem("popupSignUp", "opened");
    $(".dark-overlay").fadeIn(20);
    $("#popup-sign-up").fadeIn(20);
    $("#popup-sign-up-form-email").focus();
});


// Open log in popup on button click
$(".btn-log-in").click(function() {
    localStorage.setItem("popupLogin", "opened");
    $(".dark-overlay").fadeIn(20);
    $("#popup-log-in").fadeIn(20);
    $("#popup-log-in-form-email").focus();
});

// Keep sign up and log in popups open on refresh (for sign up errors)
if (localStorage.getItem("popupSignUp") == "opened") {
    localStorage.setItem("popupLogin", "closed");
}

if (localStorage.getItem("popupLogin") == "opened") {
    localStorage.setItem("popupSignUp", "closed");
}

if (localStorage.getItem("popupLogin") == "opened") {
    $("#popup-log-in").show();
    $(".dark-overlay").show();
}
else {
    $("#popup-log-in").hide();
}

if (localStorage.getItem("popupSignUp") == "opened") {
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

