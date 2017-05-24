$(".dark-overlay").click(function() {
    $(this).fadeOut(20);
    $("#popup-sign-up").fadeOut(20);
});

$(".popup-close").click(function() {
    $(this).parent().parent().fadeOut(20);
    $(".dark-overlay").fadeOut(20);
});


$(".btn-sign-up").click(function() {
    $(".dark-overlay").fadeIn(20);
    $("#popup-sign-up").fadeIn(20);
});

$(".btn-log-in").click(function() {
    $(".dark-overlay").fadeIn(20);
    $("#popup-log-in").fadeIn(20);
});
