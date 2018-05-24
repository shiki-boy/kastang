// ----------------------------- LINK TRANSITION ----------------------------

function delay(url) {
    $("#whole").css("-webkit-animation-duration", "0.5s");
    $("#whole").removeClass('fadeIn');
    $("#whole").addClass('fadeOut');
    setTimeout(() => { window.location = url }, 550);
}

// -----------------------------------------------------------------------


// ---------------------------- GO TO TOP BTN -------------------------

$("#gotoTopBtn").click(function () {
    window.scroll({
        top: 100,
        behavior: "smooth"
    })
});

$(window).scroll(function () {
    if (window.pageYOffset > 300) {
        $("#gotoTopBtn").css("visibility", "visible");
    }
    else {
        $("#gotoTopBtn").css("visibility", "hidden");
    }
});

// -----------------------------------------------------------------------


// ------------------------  NAVBAR UP DOWN ------------------------------

var before = $(window).scrollTop(), after;

$(window).scroll(function () {
    after = $(window).scrollTop();
    if (after > before) {
        $('nav ').removeClass('slideInDown ');
        $('nav ').addClass('slideOutUp ');
    }
    else {
        $('nav ').removeClass('slideOutUp ');
        $('nav ').addClass('slideInDown ');
    }
    before = $(window).scrollTop();
});

// ----------------------------------------------------------------------------


// --------------------------- NAVBAR DROPDOWN BTNS -----------------------------------

$('.dropdown-trigger').dropdown({
    coverTrigger: false,
    onOpenEnd: function () {
        $('.dropdown-content').css({ 'width': 'max-content', 'top': '75px', "transition": "all 200ms" });
    }
});

$('.sidenav').sidenav();

// --------------------------------------------------------------------


