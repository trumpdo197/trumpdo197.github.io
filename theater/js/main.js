/* ==========================================================================
   Utilities
   ========================================================================== */

    function splitText(text) {
        var textLength  = text.length;

        var letters = [];

        for (var i = 0; i < textLength; i++){
            letters.push(text[i]);
        }

        return letters;
    }

    function generateDOMWordAndLetters(text){
        var doms = [];

        var words = text.split(" ");

        for (var i = 0; i < words.length; i++) {

            var word = words[i];

            var domWord         = document.createElement("span");

            domWord.className   = "ani-word";

            for (var j = 0; j < word.length; j++) {
                var letter = word[j];

                var domLetter = document.createElement("span");
                
                if (letter === " ") {
                    domLetter.innerHTML     = "&nbsp;"; 
                }
                else {
                    domLetter.innerHTML     = letter;
                }
                
                domLetter.className         = "ani-letter";
            
                domWord.appendChild( domLetter );
            }

            doms.push(domWord);
        }

        return doms;
    }

    function appendSplittedTextDOM(appendedDOM, wordsAndLettersDOM){
        for (var i = 0; i < wordsAndLettersDOM.length; i++) {
            var item = wordsAndLettersDOM[i];
            appendedDOM.appendChild(item);
        }
    }

    function animateNumber(numberDOM, duration = 2000) {
        var FPS         = 30;
        
        var startTime  = new Date();
        var elapsed, progress;

        var goal_number = parseInt( numberDOM.innerHTML );

        function update(){
            elapsed = new Date() - startTime;
            progress = elapsed / duration;
        }

        var interval = setInterval(function(){
            update();

            if (progress > 1.0) {
                progress = 1.0;
            }

            var current_value   = Math.floor( goal_number * progress );
            numberDOM.innerHTML = current_value;

            if (progress === 1.0) {
                clearInterval(interval);
            }
            else {
                elapsed     = new Date();
                progress    = startTime / elapsed;
            }
        }, 1000 / FPS)
    }

    function initInview(query, callback){
        if (typeof callback != 'function') {
            return;
        }

        var elem = $(query);

        var inview = new Waypoint.Inview({
            element: elem[0],
            enter: enterCb,
        })

        function enterCb(direction){
            elem.removeClass('inview-animate');
            callback(elem, direction);
            inview.destroy();
        }
    }

/* ==========================================================================
   End Utilities
   ========================================================================== */

/* ==========================================================================
   Main functions
   ========================================================================== */

    +function initMobileMenu(){
        var mobileMenu = $('#mobile-menu');
        
        var openMenuButton  = $('#open-menu');
        var closeMenuButton   = $('#close-menu');

        var openMenu = function(event) {
            event.preventDefault();

            var tl = new TimelineMax();

            tl.to(mobileMenu, 0.7, {
                yPercent: 0,
                ease: Power1.easeOut
            });

            tl.staggerFromTo($('.mobile-menu__nav > li'), 0.5, {
                y: -25,
                opacity: 0
            }, {
                y: 0,
                opacity: 1
            }, 0.05, "-=0.3")

            tl.call(function(){
                closeMenuButton.addClass('close-svg--animate');
            }, null, null, "-=0.2")
        }

        var closeMenu = function(event) {
            event.preventDefault();

            var tl = new TimelineMax();

            tl.call(function(){
                closeMenuButton.removeClass('close-svg--animate');
            })

            tl.to(mobileMenu, 0.7, {
                yPercent: -100,
                ease: Power1.easeOut
            }, "+=0.5");
        }

        TweenMax.set(mobileMenu, {
            yPercent: -100,
        });

        mobileMenu.removeClass('mobile-menu--hidden');
        
        openMenuButton.click(openMenu);
        closeMenuButton.click(closeMenu);

    }()

    +function initHomeVideo() {
        var homeIntroVideoDOM = $('#home-intro-video');

        var option = { 
            "techOrder": ["youtube"], 
            "sources": [{ "type": "video/youtube", "src": homeIntroVideoDOM.prop('src')}],
            "youtube": { "iv_load_policy": 1 } 
        };

        var homeVideo = videojs(homeIntroVideoDOM[0], option);

        homeVideo.on('ready', function(){
            $(homeVideo).addClass("ready");
        })
    }()

    +function initOnScrollHomeAbout(){
        initInview('#home-about', function(elem) {  
            // Split text and animate it
            var headingjQueryObj    = $('body').find('.home-about__heading');
            var text                = headingjQueryObj.text();
            var wordsAndLettersDOM  = generateDOMWordAndLetters(text);

            // DOMs
            var milestoneDOMs       = $('.home-about__milestones');
            var headingDOM          = $('.home-about__heading');

            headingjQueryObj.html('');
            appendSplittedTextDOM(headingjQueryObj[0], wordsAndLettersDOM);

            var aniLetters  = headingjQueryObj.find('.ani-letter');

            var tl = new TimelineMax({
                repeat: 0,
            });

            // Hide all components
            tl.set(milestoneDOMs, {opacity: 0});
            // tl.set(headingDOM, {opacity: 0});

            tl.fromTo($('.home-about__image'), 0.75, {
                opacity: 0,
            }, {
                opacity: 1
            });

            tl.addLabel('start');
            
            // tl.set(headingDOM, {opacity: 1});
            tl.staggerFromTo( aniLetters, 0.35, {
                opacity: 0,
                x: -25,
            }, {
                opacity: 1,
                x: 0,
            }, 0.05, 'start' );

            tl.fromTo( $(".home-about__intro"), 0.5, {
                opacity: 0,
                y: -15,
            }, {
                opacity: 1,
                y: 0,
            } );

            tl.addLabel("milestones");

            tl.fromTo( milestoneDOMs, 0.5, {
                opacity: 0,
                y: -15,
            }, {
                opacity: 1,
                y: 0,
            } );

            tl.call(function(){
                var DOMs = $('.home-about__milestones .milestone__number');
                var durationArr = [ 2000, 1500, 1000 ];

                DOMs.each(function(index, el) {
                    animateNumber( el, durationArr[index] );
                });

            }, null, null, "milestones");

        });
    }()

    +function initOnScrollHomeQuote(){

        initInview('#home-quote', function( elem ){
            TweenMax.fromTo(elem, 1.0, {
                y: 15,
                opacity: 0
            }, {
                y: 0,
                opacity: 1
            })
        });
        
    }()

    +function initOnScrollHomeVideo(){
        initInview('#home-video', function( elem ){
            TweenMax.fromTo(elem, 1.0, {
                opacity: 0
            }, {
                opacity: 1
            })
        });
    }()

    +function initOnScrollHomeFeaturedFilms(){
        initInview('#home-featured-films', function(elem){
            TweenMax.fromTo(elem, 1.0, {
                y: 15,
                opacity: 0
            }, {
                y: 0,
                opacity: 1
            })
        })
    }()

    +function initOnScrollHomeCta(){
        initInview('#home-cta', function(elem){
            TweenMax.fromTo(elem, 1.0, {
                opacity: 0
            }, {
                opacity: 1
            })
        })
    }()

    +function initOnScrollHomeSocialFollow(){
        initInview('#home-social-follow', function(elem){
            TweenMax.fromTo(elem, 1.0, {
                opacity: 0
            }, {
                opacity: 1
            })
        })
    }()

    +function initOnScrollHomeContact(){

        initInview('#home-contact', function(elem){
            TweenMax.fromTo(elem, 1.0, {
                opacity: 0
            }, {
                opacity: 1
            })
        })

    }()

    +function initHomeSlider(){

        var slider = new Slider($('#slider'), {
            // texture_urls: [
            //     "img/intro.jpg",
            //     "img/intro2.jpg",
            //     "img/film.jpg"
            // ],
            debug: true
        });

        $('#slider-next').click(function(event) {
            slider.navigateSlide("next");
        });

        $('#slider-prev').click(function(event) {
            slider.navigateSlide("prev");
        });

    }()