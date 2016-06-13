/**
 * Created by jorgalga on 7/8/15.
 */
var THREE = require('three');
var VRControls = require('../utils/VRControls');
var VREffect = require('../utils/VREffect');
var boxSize = 5;
var self;
var lastRender = 0;

var Universe = function( container ) {
    self = this;
    
    this.renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create a three.js scene.
    this.scene = new THREE.Scene();
    
    
    // Create a three.js camera.
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    
    // Apply VR headset positional data to camera.
    this.controls = new VRControls(this.camera);
    this.controls.standing = true;
    
    // Apply VR stereo rendering to renderer.
    this.effect = new VREffect(this.renderer);  
    this.effect.setSize(window.innerWidth, window.innerHeight);
    
    this.manager;
    this.cube;
    
    this.setup();
};

Universe.prototype.setup = function() {
    
    // Add a repeating grid as a skybox.
   
    var loader = new THREE.TextureLoader();
    loader.load('assets/box.png', this.onTextureLoaded);
    
    // Create a VR manager helper to enter and exit VR mode.
    var params = {
      isUndistorted: false // Default: false.
    };
    this.manager = new WebVRManager(this.renderer, this.effect, params);
    this.manager.on('modechange', this.onModeChange);
    
    // Create 3D objects.
    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material);

    // Position cube mesh to be right in front of you.
    this.cube.position.set(0, this.controls.userHeight, -1);
    
    // Add cube mesh to your three.js scene
    this.scene.add(this.cube);
    
    // Kick off animation loop
    window.requestAnimationFrame(this.render);
 
};

Universe.prototype.onTextureLoaded = function(texture){
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(boxSize, boxSize);
    
    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    var material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x01BE00,
        side: THREE.BackSide
    });
    
    // Align the skybox to the floor (which is at y=0).
    var skybox = new THREE.Mesh(geometry, material);
    skybox.position.y = boxSize/2;
    self.scene.add(skybox);
    
    // For high end VR devices like Vive and Oculus, take into account the stage
    // parameters provided.
    // setupStage();

};

Universe.prototype.addEvents = function() {

    this.manager.on('modechange', this.onModeChange.bind( this ) );
    
};

Universe.prototype.onModeChange = function( n, o ) {
    switch(n){
        case 3 :
            console.log('Passing to VR mode');
            break;
    }
};


Universe.prototype.render = function( timestamp ) {
    var delta = Math.min(timestamp - lastRender, 500);
    lastRender = timestamp;
    
    // Apply rotation to cube mesh
    //this.cube.rotation.y += delta * 0.0006;

    // Update VR headset position and apply to camera.
    this.controls.update();

    // Render the scene through the manager.
    this.manager.render(this.scene, this.camera, timestamp);
    
    
    window.requestAnimationFrame(this.render);
};


Universe.prototype.onResize = function( w, h ) {

  this.renderer.setPixelRatio(window.devicePixelRatio);
  this.effect.setSize(window.innerWidth, window.innerHeight);
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();

    //this.renderer.setSize( w, h );

};

module.exports = Universe;