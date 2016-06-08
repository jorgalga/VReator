/**
 * Created by siroko on 5/27/16.
 */

var THREE = require('three');

var vs_panorama = require('../glsl/vs-basic.glsl');
var fs_panorama = require('../glsl/fs-spheric-stereo-panorama.glsl');

var PanoramaStereo = function(){

    this.init();
};

PanoramaStereo.prototype.init = function() {

    this.screenVector = new THREE.Vector3( 0, 0, 0.5 );
    this.raycaster = new THREE.Raycaster();


    this.texture1 = THREE.ImageUtils.loadTexture('assets/destruction.jpg');
    //this.texture2 = THREE.ImageUtils.loadTexture('assets/panoramas_negative.png');

    this.angle = new THREE.Vector2();

    this.geom = new THREE.SphereBufferGeometry( 10000, 10, 10 );
    //this.matL = new THREE.RawShaderMaterial({
    //    side: THREE.BackSide,
    //    transparent: true,
    //    opacity: 0,
    //    uniforms:{
    //        'offsetEye': { value: 0.5 },
    //        'texture1': { value: this.texture1 },
    //        'texture2': { value: this.texture1 },
    //        'angle': {value: this.angle}
    //    },
    //
    //    vertexShader: vs_panorama,
    //    fragmentShader: fs_panorama
    //});
    //
    //this.matR = new THREE.RawShaderMaterial({
    //    side: THREE.BackSide,
    //    transparent: true,
    //    opacity: 0,
    //    uniforms:{
    //        'offsetEye': { value: 0 },
    //        'texture1': { value: this.texture1 },
    //        'texture2': { value: this.texture1 },
    //        'angle': {value: this.angle}
    //    },
    //
    //    vertexShader: vs_panorama,
    //    fragmentShader: fs_panorama
    //});

    this.matL = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        transparent: true,
        opacity: 0,
        map: this.texture1
    });

    this.matR = new THREE.RawShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        opacity: 0,
        map: this.texture1
    });

    this.eyeL = new THREE.Mesh( this.geom, this.matL );
    //this.eyeL.layers.set( 1 );

    //this.eyeR = new THREE.Mesh( this.geom, this.matR );
    //this.eyeR.layers.set( 2 );
};

PanoramaStereo.prototype.getUV = function( camera ){

    //this.raycaster.set( camera.position, this.screenVector.sub( camera.position ).normalize() );
    //
    //var intersects = this.raycaster.intersectObject( this.eyeL, true );
    //
    //if ( intersects.length > 0 ) {
    //    var index = intersects[0].faceIndex;
    //
    //}

//Find the UV Coordinates of the the three vertices of the face at that index

    //var point1,point2,point3;
    //point1.x = objectGlobal.children[0].geometry.faceVertexUvs[0][index][0].x;
    //point1.y = objectGlobal.children[0].geometry.faceVertexUvs[0][index][0].y
    //
    //point2.x = objectGlobal.children[0].geometry.faceVertexUvs[0][index][1].x;
    //point2.y = objectGlobal.children[0].geometry.faceVertexUvs[0][index][1].y;
    //
    //point3.x = objectGlobal.children[0].geometry.faceVertexUvs[0][index][2].x;
    //point3.y = objectGlobal.children[0].geometry.faceVertexUvs[0][index][2].y;
};


module.exports = PanoramaStereo;