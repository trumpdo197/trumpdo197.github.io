/* ==========================================================================
   Utilities
   ========================================================================== */

    class AppUtils {
        static splitText(text) {
            let textLength  = text.length;

            let letters = [];

            for (let i = 0; i < textLength; i++){
                letters.push(text[i]);
            }

            return letters;
        }
        static generateDOMWordAndLetters(text){
            let doms = [];

            let words = text.split(" ");

            for (let i = 0; i < words.length; i++) {

                let word = words[i];

                let domWord         = document.createElement("span");

                domWord.className   = "ani-word";

                for (let j = 0; j < word.length; j++) {
                    let letter = word[j];

                    let domLetter = document.createElement("span");
                    
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
        static appendSplittedTextDOM(appendedDOM, wordsAndLettersDOM){
            appendedDOM.innerHTML = '';

            for (let i = 0; i < wordsAndLettersDOM.length; i++) {
                let item = wordsAndLettersDOM[i];
                appendedDOM.appendChild(item);
            }
            
            return appendedDOM.querySelectorAll('.ani-letter');
        }
        static animateNumber(numberDOM, duration = 2000) {
            let FPS         = 30;
            
            let startTime  = new Date();
            let elapsed, progress;

            let goal_number = parseInt( numberDOM.innerHTML );

            function update(){
                elapsed = new Date() - startTime;
                progress = elapsed / duration;
            }

            let interval = setInterval(function(){
                update();

                if (progress > 1.0) {
                    progress = 1.0;
                }

                let current_value   = Math.floor( goal_number * progress );
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
    }

/* ==========================================================================
   End Utilities
   ========================================================================== */

/* ==========================================================================
   Main functions
   ========================================================================== */

    class MainApp {
        constructor(){
            this.initMobileMenu();

            // Chỉ chạy khi ở trang chủ.
            if ($('#home').length < 1) return;
            this.initHomeVideo();
            this.initOnScrollHomeAbout();
            this.initOnScrollHomeQuote();
            this.initOnScrollHomeVideo();
            this.initOnScrollHomeFeaturedFilms();
            this.initOnScrollHomeCta();
            this.initOnScrollHomeSocialFollow();
            this.initOnScrollHomeContact();
            this.initHomeSlider();
        }
        initInview(query, callback, cbType = 'enter'){
            if (typeof callback != 'function') {
                return;
            }

            let elem = $(query);
            let settings = {
                element: elem[0]
            };

            settings[cbType] = enterCb;

            let inview = new Waypoint.Inview(settings);

            function enterCb(direction){
                elem.removeClass('inview-animate');
                let childElems = elem.find('.inview-animate');
                childElems.removeClass('inview-animate');

                callback(elem, direction);
                inview.destroy();
            }
        }
        initMobileMenu(){
            let mobileMenu = $('#mobile-menu');
            let openMenuButton  = $('#open-menu');
            let closeMenuButton   = $('#close-menu');

            let openMenu = function() {

                let tl = new TimelineMax();

                tl.to(mobileMenu, 0.7, {
                    yPercent: 0,
                    ease: Power1.easeOut
                });

                tl.staggerFromTo($('.app-mobile-menu__nav > li'), 0.5, {
                    y: -25,
                    opacity: 0
                }, {
                    y: 0,
                    opacity: 1
                }, 0.05, "-=0.3")

                tl.call(function(){
                    closeMenuButton.addClass('app-close-svg--animate');
                }, null, null, "-=0.2")
            }

            let closeMenu = function(callback) {
                let tl = new TimelineMax({
                    onComplete: function(){
                        if (typeof callback != 'function') return;

                        callback();
                    }
                });

                tl.call(function(){
                    closeMenuButton.removeClass('app-close-svg--animate');
                })

                tl.to(mobileMenu, 0.7, {
                    yPercent: -100,
                    ease: Power1.easeOut
                }, "+=0.5");
            }

            TweenMax.set(mobileMenu, {
                yPercent: -100,
            });

            mobileMenu.removeClass('app-mobile-menu--hidden');
            
            openMenuButton.click(function(){
                if (window.slider) {
                    window.slider.pause();
                }

                openMenu();
            });
            closeMenuButton.click(function(){
                if (window.slider) {
                    window.slider.resume();
                }
                
                closeMenu( function(){
                    if (window.slider) {
                        window.slider.resume();
                    }
                } );
            });
        }
        initHomeSlider(){
            if ($('#slider').length < 1) {
                return;
            }

            window.slider = new Slider($('#slider')[0], {
                debug: false,
                duration: 1.5,
                autoplay: true,
            });

            $('#slider-next').click(function(event) {
                slider.navigateSlide("next");
            });

            $('#slider-prev').click(function(event) {
                slider.navigateSlide("prev");
            });
        }
        initHomeVideo() {
            let homeIntroVideoDOM = $('#home-intro-video');

            let option = { 
                "techOrder": ["youtube"], 
                "sources": [{ "type": "video/youtube", "src": homeIntroVideoDOM.prop('src')}],
                "youtube": { "iv_load_policy": 1 } 
            };

            let homeVideo = videojs(homeIntroVideoDOM[0], option);

            homeVideo.on('ready', function(){
                $(homeVideo).addClass("ready");
            })
        }
        initOnScrollHomeAbout() {
            let shit = new SimpleTransition('home-about-image-wrapper');
            // Split text and animate it
            let headingjQueryObj    = $('body').find('.app-home-about__heading');
            let text                = headingjQueryObj.text();

            // DOMs
            let milestoneDOMs       = $('.app-home-about__milestones');
            let headingDOM          = $('.app-home-about__heading');

            let numberDOMs = $('.app-home-about__milestones .app-milestone__number');
            let durationArr = [ 2000, 1500, 1000 ];

            let wordsAndLettersDOM  = AppUtils.generateDOMWordAndLetters(text);
            let aniLetters  = AppUtils.appendSplittedTextDOM(headingjQueryObj[0], wordsAndLettersDOM);

            // let aniLetters  = headingjQueryObj.find('.ani-letter');

             // Hide all components
            TweenMax.set(milestoneDOMs, {opacity: 0});

            shit.onLoadedImages(() => {
                this.initInview('#home-about', elem => {

                    let tl = new TimelineMax({
                        repeat: 0,
                    });

                    tl.fromTo(shit.data, 1.2, {
                        progress: 0
                    }, {
                        progress: 1,
                        ease: Power4.easeOut
                    });

                    tl.addLabel('start');

                    tl.call(() => {
                        shit.destroy();
                    }, null, 'start');

                
                    tl.staggerFromTo( aniLetters, 0.35, {
                        opacity: 0,
                        x: -25,
                    }, {
                        opacity: 1,
                        x: 0,
                    }, 0.035, 'start' );

                    tl.fromTo( $(".app-home-about__intro"), 0.5, {
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

                    tl.call(() => {
                        numberDOMs.each((index, el) => {
                            AppUtils.animateNumber( el, durationArr[index] );
                        });

                    }, null, null, "milestones");
                }, 'entered');
            });
        }
        initOnScrollHomeQuote(){
            this.initInview('#home-quote', function( elem ){
                TweenMax.fromTo(elem, 1.0, {
                    y: 15,
                    opacity: 0
                }, {
                    y: 0,
                    opacity: 1
                })
            });
        }
        initOnScrollHomeVideo(){
            this.initInview('#home-video', function( elem ){
                TweenMax.fromTo(elem, 1.0, {
                    opacity: 0
                }, {
                    opacity: 1
                })
            });
        }
        initOnScrollHomeFeaturedFilms(){
            this.initInview('#home-featured-films', function(elem){
                TweenMax.fromTo(elem, 1.0, {
                    y: 15,
                    opacity: 0
                }, {
                    y: 0,
                    opacity: 1
                })
            })
        }
        initOnScrollHomeCta(){
            this.initInview('#home-cta', function(elem){
                let tl = new TimelineMax();
                let jqueryCtaObj = $('.app-home-cta__text');
                let wordsAndLettersDOM  = AppUtils.generateDOMWordAndLetters(jqueryCtaObj.text());
                let aniLetters  = AppUtils.appendSplittedTextDOM(jqueryCtaObj[0], wordsAndLettersDOM); 

                tl.staggerFromTo( aniLetters, 0.35, {
                    opacity: 0,
                    x: -25,
                }, {
                    opacity: 1,
                    x: 0,
                }, 0.035);

                tl.fromTo($('.app-home-cta__buttons'), 1.0, {
                    opacity: 0
                }, {
                    opacity: 1
                })
            }, 'entered')
        }
        initOnScrollHomeSocialFollow(){
            this.initInview('#home-social-follow', function(elem){
                TweenMax.fromTo(elem, 1.0, {
                    opacity: 0
                }, {
                    opacity: 1
                })
            })
        }
        initOnScrollHomeContact(){
            this.initInview('#home-contact', function(elem){
                TweenMax.fromTo(elem, 1.0, {
                    opacity: 0
                }, {
                    opacity: 1
                })
            }, 'entered')
        }
    }

    const appConfigs = {
        preloaderDuration: 2000, // Chỉnh khớp với thời gian trong css!
    }

    let appState = {
        isAnimationFinished: false,
        isWindowLoaded: false
    }

    setTimeout(function(){
        appState.isAnimationFinished = true;
        if (appState.isWindowLoaded === true) {
            runApp();
        }
    }, appConfigs.preloaderDuration + 500);

    window.addEventListener('load', function(){
        appState.isWindowLoaded = true;
        if (appState.isAnimationFinished === true) {
            runApp();
        }
    })

    function runApp(){
        let preloader = $('.preloader');
        let body = $('body');

        TweenMax.fromTo(preloader, 0.5 , {
            opacity: 1
        }, {
            opacity: 0,
            onComplete: function(){
                preloader.remove();
                body.removeClass('overflow-hidden');
                new MainApp();
            }
        })
    }