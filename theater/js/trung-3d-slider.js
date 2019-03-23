"use strict";
/**
 * CONVENTIONS:
 * Variable names: snake_case // Because we'll pass variables to glsl, and its variable convention is this type.
 * Method/Function names: camelCase
 * Constant: PascalCase
 *
 * @author [Handsum Trung (hou.dobaotrung@gmail.com)]
 * @license MIT
 * @version v0.0.1
 */

/**
 * Slider Class
 * @param {[DOM]} container [The DOM which you want it to be a slider]
 * @param {[object]} configs
 */
function Slider(container, configs){
    // Three.js Variables
    this._container = container;
    this._image_container;
    this._camera;
    this._scene;
    this._renderer;
    this._uniforms;
    this._material;
    this._configs       = {};
    this._textures      = [];
    this._blank_texture;

    // Slider states
    this._is_initted        = false;
    this._need_rendering    = false;
    this._is_animating      = false;
    this._current_texture_index = -1;
    this._next_texture_index    = 0;
    this._autoplay_interval;

    // Default uniform data, do not override!
    this._data              = {
        slide_progress: 0.0,
        direction_sign: 1.0,
    };
    
    // Slider Props
    this._slides;
    this._pagination;

    this._default_configs       = {
        debug: false,
        autoplay: false,
        autoplayTimeout: 7000
    }

    this._init(configs);
}

Slider.prototype._mergeOptions = function( obj1, obj2 ){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

Slider.prototype._init = async function(configs){
    var default_configs = this._default_configs;
    var merged_configs  = this._mergeOptions(default_configs, configs);

    this._configs = merged_configs;
    this._slides = this._container.find('[data-slide="slide"]');
    
    await this._initTextures();
    this._initThreeScene();
    this._initPaginations();
    this._initAutoplay();
    
    this._onWindowResize();
    this._onWindowScrollWithInit();
    window.addEventListener( 'resize', this._onWindowResize.bind(this), false );
    window.addEventListener( 'scroll', this._onWindowScrollWithInit.bind(this), false );
}

/**
 * A stupid algorithm
 * @return {[array]} [x y float]
 */
Slider.prototype._getRatioFixingFactor = function( texture ) {

    var renderer    = this._renderer;
    var w           = window.innerWidth; // Current dom element/image width
    var h           = window.innerHeight;

    var screen_ratio = w / h;

    var original_img_w = texture.image.width;
    var original_img_h = texture.image.height;

    var scaled_ratio    = h / original_img_h;

    var expected_img_w  = original_img_w * scaled_ratio;
    var expected_img_h  = original_img_h * scaled_ratio;

    if ( expected_img_w < w ) {
        return [1.0, expected_img_w / w];
    }
    else {
        return [expected_img_w / w, 1.0];
    }
};

Slider.prototype._initTextures = function() {
    var that = this;
    var promise_arr     = [];
    var texture_urls    = [];

    var image_DOMs = this._container.find( '[data-slide="image_container"] img' );
    
    image_DOMs.each(function(index, item){
        texture_urls.push(item.currentSrc);
    });

    var texture_map     = {}; // Ensure textures are loaded in a right order
    var loader          = new THREE.TextureLoader();

    for (var i = 0; i < texture_urls.length; i++) {
        (function(i){

            promise_arr[i] = new Promise(function(resolve){
                var texture_url = texture_urls[i];

                loader.load( texture_url, function(loadedTexture){
                    texture_map[i]  = loadedTexture;
                    resolve();
                });
            });

        })(i)
    }

    // Load blank image layer
    promise_arr.push( 
        new Promise(function(resolve){
            var texture_url = "img/blank-image-layer.png";

            loader.load( texture_url, function(loadedTexture){
                that._blank_texture = loadedTexture;
                resolve();
            });
        }) 
    );

    return Promise.all(promise_arr).then(function(){
        var textures = [];

        for (var key in texture_map) {
            textures.push(texture_map[key]);
        }

        that._textures = textures;

        that._calcAllTexturesRatioFixingFactor();
    })
};

Slider.prototype._initPaginations = function () {
    var pagination    = this._container.find('[data-slide="pagination"]');
    var texture_urls            = this._textures;
    var that                    = this;

    for (let i = 0, texture_count = texture_urls.length; i < texture_count; i++) {
        var texture = texture_urls[i];

        var pagination_bullet = document.createElement('a');
        pagination_bullet.className = 'slider__pagination';
        pagination_bullet.href      = '#slide' + i;
        pagination_bullet.setAttribute('slide-id', i);

        pagination_bullet.addEventListener('click', function(){
            that._jumpSlide(i);
        });

        pagination.append(pagination_bullet);
    }

    this._pagination = pagination;
}

Slider.prototype._initAutoplay = function() {
    var configs = this._configs;

    if ( configs.autoplay == true ) {
        var interval = setInterval(function(){
            if (this._need_rendering == false) {
                return;
            }
            
            this._navigateSlide('next');
        }.bind(this), configs.autoplayTimeout);

        this._autoplay_interval = interval;
    }  
};

Slider.prototype._initThreeScene = function() {
    var image_container = this._container.find( '[data-slide="image_container"]' )[0];
    var textures        = this._textures;
    var data            = this._data;

    // Camera
    var camera = new THREE.Camera()
    camera.position.z = 1;
    
    // Scene
    var scene = new THREE.Scene();

    // Geometry
    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    // Uniforms
    var uniforms = {
        ratio_fixing_factor: {
            type: "v2",
            value: new THREE.Vector2()
        },
        next_ratio_fixing_factor: {
            type: "v2",
            value: new THREE.Vector2()
        },
        slide_progress: { type: "f", value: data.slide_progress },
        direction_sign: { type: "f", value: data.direction_sign },
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        texture1: { 
            type: "t", 
            value: null
        },
        texture2: {
            type: "t",
            value: null
        }
    };

    // Material
    var material = new THREE.ShaderMaterial({
        // wireframe: true,
        uniforms: uniforms,
        resolution: { value: new THREE.Vector2() },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });

    // Mesh
    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    // Renderer
    var renderer = new THREE.WebGLRenderer({
        precision: 'highp',
        antialias: false
    });

    image_container.appendChild( renderer.domElement );

    this._camera = camera;
    this._scene = scene;
    this._geometry = geometry;
    this._uniforms = uniforms;
    this._material = material;
    this._mesh = mesh;
    this._renderer = renderer;
}

Slider.prototype._getCurrentTextureIndex = function(){
    return this._current_texture_index;
}

Slider.prototype._getCurrentTexture = function(){
    if ( this._current_texture_index === -1 ) {
        return this._blank_texture;
    }
    return this._textures[this._current_texture_index];
}

Slider.prototype._getNextTexture = function(){
    return this._textures[this._next_texture_index];
}

Slider.prototype._getNextTextureIndex = function(direction = "next"){
    var current_texture_index   = this._getCurrentTextureIndex();
    var textures                = this._textures;

    if (direction == "next") {
        if (current_texture_index == textures.length - 1) {
            return 0;
        }
        return current_texture_index + 1;
    }
    else if (direction == "prev") {
        if (current_texture_index == 0) {
            return textures.length - 1;
        }
        return current_texture_index - 1;
    }
    else if (direction == "init") {
        return 0;
    }       
}

Slider.prototype._updateTextures = function() {
    var uniforms = this._uniforms;
    var material = this._material;
    var textures = this._textures;
    var current_texture_index   = this._current_texture_index;
    var next_texture_index      = this._next_texture_index;

    if (current_texture_index === -1) {
        uniforms.texture1.value = this._blank_texture;
    }
    else {
        uniforms.texture1.value = textures[current_texture_index];
    }

    uniforms.texture2.value = textures[next_texture_index];

    material.needsUpdate    = true;
};

Slider.prototype._updatePagination = function(next_texture_index) {
    var pagination = $(this._pagination);

    pagination.find('a').removeClass('slider__pagination--active');
    pagination.find('[slide-id=' + next_texture_index + ']').addClass('slider__pagination--active');
}

Slider.prototype._resetAutoplayInterval = function(){
    if (this._configs.autoplay !== true) {
        return;
    }

    var interval = this._autoplay_interval;
    clearInterval(interval);
    this._initAutoplay();
};

Slider.prototype._navigateSlide = function(direction = "next"){

    var next_texture_index  = this._getNextTextureIndex( direction );
    this._jumpSlide( next_texture_index );

}

Slider.prototype._jumpSlide = function(next_texture_index) {
    var current_texture_index = this._current_texture_index;

    if (current_texture_index == next_texture_index) return;

    var that            = this;
    var data            = this._data;
    var container       = this._container;
    var is_animating    = this._is_animating;
    var slides          = this._slides;
    var textures        = this._textures;
    var is_animating    = this._is_animating;
    
    var direction       = this._getDirection(next_texture_index);

    if (is_animating === true) return;

    this._is_animating = true;
    this._next_texture_index = next_texture_index;

    this._updateTextures();
    this._updatePagination( next_texture_index );
    this._resetAutoplayInterval();

    var tl = new TimelineMax({
        onComplete: function() {
            
            that._is_animating = false;

            if (direction == "init") {
                container.addClass('slider--initted');
            }
            
            that._current_texture_index = next_texture_index;
            
            // Reset the progress when finishing animating, otherwise it'll cause wrong slide image bug.
            data.slide_progress = 0;
            that._updateTextures();        
        }
    });

    tl.call(function(){
        $(slides).removeClass('slider__item--active');

        if (direction == "prev") {
            data.direction_sign = -1;
        }
        else {
            data.direction_sign = 1;
        }
    })

    tl.fromTo(data, 1.2, {
        slide_progress: 0,
    }, {
        slide_progress: 1,
        ease: Power2.easeOut,
    });

    tl.call(function(){
       $(slides[next_texture_index]).addClass('slider__item--active');
    }, null, null, "-=0.2");
}

Slider.prototype._getDirection = function(next_texture_index) {
    var current_texture_index = this._current_texture_index;

    if (current_texture_index === -1) {
        return "init";
    }

    if (next_texture_index > current_texture_index) {
        return "next";
    }
    else {
        return "prev";
    }

};

Slider.prototype._render = function() {

    if (this._configs.debug === true) {
        console.log("Is rendering: " + this._need_rendering);
    } 

    if (this._need_rendering === false) return;

    var current_texture = this._getCurrentTexture();
    var next_texture    = this._getNextTexture();

    this._uniforms.u_time.value                   += 0.03;
    this._uniforms.slide_progress.value           = this._data.slide_progress;
    this._uniforms.direction_sign.value           = this._data.direction_sign;

    // console.log(current_texture);

    this._uniforms.ratio_fixing_factor.value.x    = current_texture.ratio_fixing_factor[0];
    this._uniforms.ratio_fixing_factor.value.y    = current_texture.ratio_fixing_factor[1];

    this._uniforms.next_ratio_fixing_factor.value.x    = next_texture.ratio_fixing_factor[0];
    this._uniforms.next_ratio_fixing_factor.value.y    = next_texture.ratio_fixing_factor[1];

    this._renderer.render( this._scene, this._camera );
}

Slider.prototype._animate = function() {
    var that = this;
    var need_rendering  = that._need_rendering;
    var debug           = that._configs.debug;

    if (debug === true) {
        console.log(need_rendering);
    }

    requestAnimationFrame(function(){
        if (debug === true) {
            console.log("Animation Frame requested.");
        }
        that._animate();
    });

    that._render();
}

Slider.prototype._onWindowResize = function( event ) {
    var renderer = this._renderer;
    var uniforms = this._uniforms;
    var data     = this._data;

    renderer.setSize( window.innerWidth, window.innerHeight );

    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;

    if (window.innerWidth < 768) {
        renderer.setPixelRatio( 0.8 );
    }
    else {
        renderer.setPixelRatio( window.devicePixelRatio );
    }

    this._calcAllTexturesRatioFixingFactor();
};

Slider.prototype._inview = function() {
    var window_height = window.innerHeight;
    var scroll_top = document.documentElement.scrollTop || document.body.scrollTop;

    if (scroll_top < window_height / 1.5) {
        return true;
    }
    return false;
}

Slider.prototype._onWindowScrollWithInit = function() {
    if (this._inview()) {
        if (!this.is_initted()) {
            this.init();
        }
        this.resume();
    }
    else {
        this.pause();
    }
}

Slider.prototype._calcAllTexturesRatioFixingFactor = function(){
    var textures        = this._textures;
    var blank_texture   = this._blank_texture;

    for (var i = 0; i < textures.length; i++) {
        var texture = textures[i];
        texture.ratio_fixing_factor = this._getRatioFixingFactor( texture );
    }

    blank_texture.ratio_fixing_factor = textures[0].ratio_fixing_factor;
}

/* ==========================================================================
   User's helpful functions
   ========================================================================== */

    Slider.prototype.pause = function(){
        this._need_rendering = false;
    }

    Slider.prototype.resume = function(){
        this._need_rendering = true;
    }

    Slider.prototype.init = function(){
        this._is_initted = true;
        this._animate();
        this._navigateSlide("init");
        
    }

    Slider.prototype.is_initted = function(){
        return this._is_initted;
    }

    // Slider.prototype.navigateSlide = Slider.prototype._navigateSlide;
    Slider.prototype.navigateSlide = function(direction){
        this._navigateSlide(direction);
    }