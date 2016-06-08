/**
 * Created by siroko on 7/8/15.
 */
var THREE = require('three');
var _ = require('lodash');
var TweenMax = require('gsap');

var VRControls = require('../utils/VRControls');

var VREffect = require('../utils/VREffect');

var Model = require('../model/ModelData');

var CameraControl = require('./../utils/CameraControl');

//var PanoramaStereo = require('./PanoramaStereo');
var WorldManager = require('./WorldManager');
var Hotspots = require('./Hotspots');
var Navigation = require('./Navigation');

var PanoramaStereo = require('./PanoramaStereo');

var World3D = function( container ) {

    this.model          = new Model();

    this.container      = container;

    this.currentLevel   = 0;
    this.currentStory   = null;

    this.camera         = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100000000 );
    this.camera.layers.enable( 1 );

    this.dummyCamera    = new THREE.Object3D();
    this.dummyCamera.add( this.camera );

    this.dummyCameraControl = new CameraControl( this.dummyCamera, new THREE.Vector3() );

    this.scene          = new THREE.Scene();
    this.renderer       = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );

    this.dataState      = null;

    // Apply VR headset positional data to camera.
    this.controls       = new VRControls(this.camera);

    this.panoramaStereo = new PanoramaStereo();
    this.panorama = false;

    this.scene.add( this.dummyCamera );

    // Apply VR stereo rendering to renderer.
    this.effect = new VREffect( this.renderer );

    // Create a VR manager helper to enter and exit VR mode.
    var params = {
        hideButton: false, // Default: false.
        isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager( this.renderer, this.effect, params );

    this.setup();
};

World3D.prototype.setup = function() {

    this.renderer.setClearColor( 0x000000, 1 );
    this.container.appendChild( this.renderer.domElement );

    this.worldManager = new WorldManager( this.scene, this.dummyCamera, this.camera, this.model, this.renderer );

    this.HSpots = new Hotspots(this.model,this.scene,this.camera,this.renderer,  this.worldManager, this.dummyCamera,  this.manager);
    this.navigation = new Navigation( this.camera, this.dummyCamera, this.scene );
    this.navigation.addEventListener(this.navigation.ON_NAVIGATION,function(e){console.log('Evwent custom',e)});

    this.dummyCamera.add( this.panoramaStereo.eyeL);
    //this.dummyCamera.add( this.panoramaStereo.eyeR);
    this.panoramaStereo.eyeL.visible = false;

    this.addEvents();
    this.render();
};

World3D.prototype.addEvents = function() {

    this.manager.on('modechange', this.onModeChange.bind( this ) );
    this.navigation.addEventListener( this.navigation.ON_NAVIGATION, this.onNavigation.bind( this ) );

};

World3D.prototype.onNavigation = function( e ) {

    console.log( e );

    switch( e.move ) {
        case "UP":
            this.currentLevel--;
            this.navigateTo(this.currentLevel - 1);
            break;
        case "DOWN":
            this.navigateTo( this.currentLevel );
            this.currentLevel++;
            break;
    }
};


World3D.prototype.navigateTo = function( l ){

    var value;

    this.HSpots.createHotspots();

    if( l < 0 ){
        value = 15000;
        this.dataState = null;
        this.worldManager.setState( false );
        TweenMax.to(this.dummyCameraControl.target, 5, {
            x: 0,
            y: 0,
            z: 0

        } );

    } else {
        value = this.dataState[0].children[ l ].cameraRadius;

        if( l == 3 ){
            this.panoramaStereo.eyeL.visible = true;
            TweenMax.to(this.panoramaStereo.eyeL.material, 1, {
                opacity: 1
            } );
            //TweenMax.to(this.panoramaStereo.eyeR.material, 1, {
            //    opacity: 1
            //} );

            this.worldManager.fadeOut();

        } else {

            TweenMax.to(this.panoramaStereo.eyeL.material, 1, {
                opacity: 0,
                onComplete: _.bind(function(){this.panoramaStereo.eyeL.visible = false;}, this)
            } );
            //TweenMax.to(this.panoramaStereo.eyeR.material, 1, {
            //    opacity: 0,
            //
            //} );

            this.worldManager.fadeIn();
        }
    }
    this.navigation.active = false;
    TweenMax.to(this.dummyCameraControl, 5, {
        wheelDelta: value,
        onComplete: _.bind(function(){
          this.HSpots.createHotspots( this.dataState, this.currentLevel );
          this.navigation.active = true;
        },this)

    } );

};

World3D.prototype.onModeChange = function( n, o ) {
    switch(n){
        case 3 :
            console.log('Passing to VR mode');
            break;
    }
};

World3D.prototype.render = function( timestamp ) {

    window.requestAnimationFrame( this.render.bind( this ) );

    //Updates for Raycasting for the Hotspots
    this.HSpots.update();

    // Update VR headset position and apply to camera.
    this.controls.update();
    this.camera.updateMatrix();
    this.navigation.update(this.dataState);
    var intersects = this.worldManager.checkIntersect();
    if( intersects ){

        this.dataState = _.filter(this.model.data, _.bind( function( obj ) {

            if( obj.id === intersects.obj.userData.storyId ) return obj;

        } , this ) );

        this.worldManager.setState( true );

        var objPosition = new THREE.Vector3();
        objPosition.copy( intersects.obj.position );
        objPosition.applyMatrix4( this.worldManager.earthContainer.matrix );

        //var cameraProjection = this.cartesianToSpherical( objPosition );
        //
        //var phi = (cameraProjection[0]) / (Math.PI * 2);
        //var theta = (cameraProjection[1]) / (Math.PI * 2);
        //
        //TweenMax.to(this.dummyCameraControl.currentAngles, 5, {
        //    x: phi,
        //    y: theta
        //});

        TweenMax.to(this.dummyCameraControl.target, 5, {
            x: objPosition.x,
            y: objPosition.y,
            z: objPosition.z

        } );

       this.onNavigation( {
            move: "DOWN"
       } )
    }

    //if( this.panorama ){
    //    this.panoramaStereo.eyeL.position.set( this.dummyCamera.position );
    //    this.panoramaStereo.eyeR.position.set( this.dummyCamera.position );
    //}
    this.worldManager.cloudsGeom.rotation.y += 0.0001;

    this.dummyCameraControl.update();
    // Render the scene through the manager.
    this.manager.render( this.scene, this.camera, timestamp);

};

World3D.prototype.cartesianToSpherical = function( cartesian ) {

    var r = Math.sqrt( cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z );
    var lat = Math.asin( cartesian.z / r );
    var lon = Math.atan2( cartesian.y, cartesian.x );

    return [ lat, lon ];
};

World3D.prototype.onResize = function( w, h ) {

    this.renderer.setPixelRatio( window.devicePixelRatio );

    this.effect.setSize( w, h );

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    //this.renderer.setSize( w, h );

};

module.exports = World3D;
