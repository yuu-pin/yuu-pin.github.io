/*!
 * Clean Blog v1.0.0 (http://startbootstrap.com)
 * Copyright 2015 Start Bootstrap
 * Licensed under Apache 2.0 (https://github.com/IronSummitMedia/startbootstrap/blob/gh-pages/LICENSE)
 */

 /*!
 * Hux Blog v1.6.0 (http://startbootstrap.com)
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0 
 */

$(document).ready(function() {
    $("table").wrap("<div class='table-responsive'></div>");
    $("table").addClass("table");
});

$(document).ready(function() {
    $('iframe[src*="youtube.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
    $('iframe[src*="youtube.com"]').addClass('embed-responsive-item');
    $('iframe[src*="vimeo.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
    $('iframe[src*="vimeo.com"]').addClass('embed-responsive-item');
});

jQuery(document).ready(function($) {
    var MQL = 1170,
        $window = $(window),
        $navbar = $('.navbar-custom'),
        $catalog = $('.side-catalog'),
        isPostPage = $('.post-container').length > 0,
        headerHeight = $navbar.height(),
        bannerHeight = $('.intro-header .container').height();

    function updatePostNavbar() {
        if (!isPostPage) {
            return;
        }

        if ($window.scrollTop() > 0) {
            $navbar.addClass('post-nav-hidden').removeClass('is-visible is-fixed');
        } else {
            $navbar.removeClass('post-nav-hidden');
        }
    }

    updatePostNavbar();

    if ($window.width() > MQL) {
        $window.on('scroll', {
                previousTop: 0
            },
            function() {
                var currentTop = $window.scrollTop();

                if (isPostPage) {
                    updatePostNavbar();
                } else if (currentTop < this.previousTop) {
                    if (currentTop > 0 && $navbar.hasClass('is-fixed')) {
                        $navbar.addClass('is-visible');
                    } else {
                        $navbar.removeClass('is-visible is-fixed');
                    }
                } else {
                    $navbar.removeClass('is-visible');
                    if (currentTop > headerHeight && !$navbar.hasClass('is-fixed')) {
                        $navbar.addClass('is-fixed');
                    }
                }

                this.previousTop = currentTop;

                $catalog.show();
                if (currentTop > (bannerHeight + 41)) {
                    $catalog.addClass('fixed');
                } else {
                    $catalog.removeClass('fixed');
                }
            }
        );
    } else if (isPostPage) {
        $window.on('scroll', updatePostNavbar);
    }
});
