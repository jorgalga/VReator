/**
 * Created by siroko on 7/8/15.
 */
var THREE = require('three');
var _ = require('lodash');
var TweenMax = require('gsap');

var VRControls = require('../utils/VRControls');

var VREffect = require('../utils/VREffect');

var Projector = require('../utils/Projector');

var Model = require('../model/ModelData');

var CameraControl = require('./../utils/CameraControl');

//var PanoramaStereo = require('./PanoramaStereo');
var WorldManager = require('./WorldManager');
var Hotspots = require('./Hotspots');
var Navigation = require('./Navigation');



var mesh;
var lastTimeMsec= null;

//var PanoramaStereo = require('./PanoramaStereo');

var World3D = function( container ) {
    
    this.trackedCenter = false;

    this.model          = new Model();

    this.container      = container;

    this.currentLevel   = 0;
    this.currentStory   = null;

    this.camera         = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    this.camera.layers.enable( 1 );

    this.dummyCamera    = new THREE.Object3D();
    this.dummyCamera.add( this.camera );

    this.dummyCameraControl = new CameraControl( this.dummyCamera, new THREE.Vector3() );

    this.scene          = new THREE.Scene();
    this.renderer       = new THREE.WebGLRenderer( { 
        antialias: true,
        logarithmicDepthBuffer: true,
        preserveDrawingBuffer   : true   // required to support .toDataURL()    
    } );

    this.dataState      = null;

    // Apply VR headset positional data to camera.
    this.controls       = new VRControls(this.camera);

    //this.panoramaStereo = new PanoramaStereo();
    //this.panorama = false;

    this.scene.add( this.dummyCamera );

    // Apply VR stereo rendering to renderer.
    this.effect = new VREffect( this.renderer );

    // Create a VR manager helper to enter and exit VR mode.
    var params = {
        hideButton: false, // Default: false.
        isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager( this.renderer, this.effect, params );
    
    this.obj_vector = new THREE.Vector3( 0,0,-5 );
    this.camera_vector = new THREE.Vector3( 0,0,-1 );

    this.fixedElementRotationy = this.camera.rotation.y;
    
    this.mouseVector = new THREE.Vector3();	
    this.raycaster = new THREE.Raycaster();
    this.intersects;
    this.lockHP = false;
    


    this.setup();
};

World3D.prototype.setup = function() {

    this.renderer.setClearColor( 0x333333, 1 );
    this.container.appendChild( this.renderer.domElement );

    // Create 3D objects.
    var geometry = new THREE.BoxGeometry(1,1,1);
    var material = new THREE.MeshNormalMaterial({wireframe:true});
    var cube = new THREE.Mesh(geometry, material);
  
    
   
    
    //sphere as pointer
    mesh = new THREE.Mesh( new THREE.SphereBufferGeometry( 0.03, 10, 10 ), new THREE.MeshBasicMaterial( {
            color: 0xff00ff,
            })
    );
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = -3;
    this.camera.add(mesh);
    //this.scene.add(mesh);
    console.log(this.toScreenPosition(mesh,this.camera));
    
   
 
    
    

   

    cube.position.set(0, 1, -4);
    
    this.scene.add(cube);
    

    //Display resolution
    console.log(screen.width+ " , " + screen.height);
    window.screen.availHeight;
    

    this.addEvents();
    this.render();
    

};

World3D.prototype.addEvents = function() {

    this.manager.on('modechange', this.onModeChange.bind( this ) );
    //this.navigation.addEventListener( this.navigation.ON_NAVIGATION, this.onNavigation.bind( this ) );
    
    window.addEventListener('vrdisplaydeviceparamschange', this.distorterOffset.bind(this));

};
World3D.prototype.distorterOffset = function(e){
    console.log("distorter");
    console.log(e);
    
}


World3D.prototype.toScreen = function ( position, camera, jqdiv ) {

    var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiply( camera.projectionMatrix, camera.matrixWorldInverse );
    projScreenMat.multiplyVector3( pos );

    return { x: ( pos.x + 1 ) * jqdiv.width() / 2 + jqdiv.offset().left,
         y: ( - pos.y + 1) * jqdiv.height() / 2 + jqdiv.offset().top };

};


World3D.prototype.toScreenPosition = function(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5* this.renderer.context.canvas.width;
    var heightHalf = 0.5* this.renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y,
        w:this.renderer.context.canvas.width,
        h:this.renderer.context.canvas.height,
    };

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
    $( "#stereo-text-layers" ).appendTo( $( ".webvr-polyfill-fullscreen-wrapper" ) );
    switch(n){
        case 3 :
            console.log('Passing to VR mode');
            $( "#stereo-text-layers" ).appendTo( $( ".webvr-polyfill-fullscreen-wrapper" ) );
            
            if(this.trackedCenter == false){
                this.trackedCenter = true;  
                
            }
            
            
            
            break;
    }
};

World3D.prototype.render = function( timestamp ) {
    this.camera_vector.applyQuaternion( this.camera.quaternion ); 
    this.camera_vector.normalize();
    
    //console.log(this.effect.cameraR);
    
    
    this.mouseVector.x = 0;
    this.mouseVector.y = 0;
    this.raycaster.setFromCamera( this.mouseVector, this.camera );
        
    this.intersects = this.raycaster.intersectObjects(this.scene.children);
    
    if(this.intersects.length > 0){
        
        if(this.lockHP == false){
            console.log("algo");
            this.lockHP=true;
                        
            $(".t1").clearQueue();
            $(".t1").finish();
           
            $(".t1").show("fast");
         
            
            /*var posL = this.toScreenPosition(mesh,this.effect.getCameraL());
            var offset = posL.x/posL.w * 100; 
            var offsety = posL.y/posL.h * 100; 
            console.log(offset);
            
            $("#left .cross").css("left",offset+"%");
            $("#left .t1").css("left",offset+"%");
            $("#left .cross").css("top",offsety+"%");
            
            
            var posR = this.toScreenPosition(mesh,this.effect.getCameraR());
            offset = posR.x/posR.w *100; 
            offsety = posR.y/posR.h *100; 
            console.log(offset);
            $("#right .cross").css("left",offset+"%");
            $("#right .t1").css("left",offset+"%");
            $("#right .cross").css("top",offsety+"%");
            */
           /*
            if(this.trackedCenter==false){
                
                this.trackedCenter = true;
                
                var dataUrl = this.renderer.domElement.toDataURL("image/png");
                //console.log(dataUrl);
                var img = new Image;
                img.src = dataUrl;
                img.id = "trackimage"
                $("#mycapture").append(img);
                $("#mycapture").hide();
                
                

            }
            */

           
           
            
         
        }
    }
    else{
        if(this.lockHP == true){
            console.log("nada");
            //tracking.track("#trackimage", colors);
            this.lockHP = false;
            
            $(".t1").clearQueue();
            $(".t1").finish();
            
            $(".t1").hide("slow");
        }
        
    }
   
   
    //console.log(this.fixedElementRotationy);
    //console.log(this.camera.rotation.y );
    //console.log(this.camera );
    
    
    //changing the left position acording with the angle
    var offset = 25 + this.camera.rotation.y * (180/Math.PI)/0.5;
    
    //console.log(offset);
    
    $(".t1").css("left", offset+"%" );
    
     var offset = 52 + this.camera.rotation.x * 180/Math.PI;
     $(".t1").css("top", offset+"%" );
    
    
     //transform: rotate(45deg);
     //$(".t1").css("transform", "rotate("+this.camera.rotation.z *180/Math.PI+"deg)" );
     //$(".t1").css(" -webkit-transform", "rotate("+this.camera.rotation.z *180/Math.PI+"deg) translate3d( 0, 0, 0)" );
     $(".t1").css("transform", "translateZ(1px) rotate("+this.camera.rotation.z *180/Math.PI+"deg) translate3d( 0, 0, 0)" );

  

    
    this.controls.update();
    this.camera.updateMatrix();
    
    this.manager.render( this.scene, this.camera, timestamp);
    
    
    window.requestAnimationFrame( this.render.bind( this ) );
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
