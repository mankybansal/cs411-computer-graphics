"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// CS411 Assignment 4 (Fall 2017) - Texture Mapping
//
// Mayank Bansal
// A20392482
// mbansal5@hawk.iit.edu
//
// Tested on Chrome Version 61.0.3163.100 (Official Build) (64-bit)
//
/////////////////////////////////////////////////////////////////////////////////////////

var canvas;
var gl;
var buffers;                        // vertex buffers
var model;                          // object model
var texture, texture2;		    // texture map

var lastAnimationTime = Date.now(); // last time tick() was called
var angleStep = 10;                 // increments of rotation angle (degrees)
var fps = 30;                       // frames per second
var currentAngle = 0.0;             // current rotation angle [degree]

var objName = {
    cube: '../data/my-textured-cube.obj'
};

var camZ = 1;
var invertNorm = 0;

var curRot = new Matrix4();
var leftRot = new Matrix4();
var rightRot = new Matrix4();
var upRot = new Matrix4();
var downRot = new Matrix4();
var tmpRot = new Matrix4();

// vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec2 a_Texture;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
    '  v_Color = vec4(a_Color.rgb * nDotL, a_Color.a);\n' +
    '  v_TexCoord = a_Texture;\n' +
    '}\n';

// fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'uniform sampler2D u_NormalSampler;\n' +
    'varying vec4 v_Color;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  vec4 DiffuseColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '  vec3 normal = normalize(2.0 * texture2D(u_NormalSampler, v_TexCoord).rgb - 1.0);\n' +
    '  vec3 LightDir = vec3(-0.35, 0.35, 0.87);\n' +
    '  vec3 L = normalize(LightDir);\n' +
    '  vec3 FinalColor = DiffuseColor.rgb * max(dot(normal, L), 0.0);\n' +
    '  gl_FragColor = v_Color * vec4(FinalColor, DiffuseColor.a);\n' +
    '}\n';


// event handlers


function turnLeft() {
    tmpRot.set(leftRot);
    tmpRot.multiply(curRot);
    curRot.set(tmpRot);
    mvMatrix.multiply(leftRot);
}

function turnRight() {
    tmpRot.set(rightRot);
    tmpRot.multiply(curRot);
    curRot.set(tmpRot);
    mvMatrix.multiply(rightRot);
}

function turnUp() {
    tmpRot.set(upRot);
    tmpRot.multiply(curRot);
    curRot.set(tmpRot);
    mvMatrix.multiply(upRot);
}

function turnDown() {
    tmpRot.set(downRot);
    tmpRot.multiply(curRot);
    curRot.set(tmpRot);
    mvMatrix.multiply(downRot);
}

function zoomIn() {
    if (camZ < 1) camZ = 1;
    camZ += 0.3;
    console.log("CamZ: ", camZ);
    mvMatrix.scale(camZ, camZ, camZ);
    camZ = 1;
}

function zoomOut() {
    if (camZ > 1) camZ = 1;
    camZ = (camZ <= 0.1) ? camZ : camZ - 0.3;
    console.log("CamZ: ", camZ);
    mvMatrix.scale(camZ, camZ, camZ);
    camZ = 1;
}

function invertNormals() {
    invertNorm = !invertNorm;

    for (var i = 0; i < model.arrays.vertices.length; i++)
        for (var j = 0; j < 3; j++)
            model.arrays.normals[i * 3 + j] *= -1;

    assignVertexBuffersData(gl, buffers, model);
}

// create a buffer object, assign it to attribute variable, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

    return buffer;
}

function initVertexBuffers(gl, program) {
    var o = new Object(); // create new object. Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.textureBuffer = createEmptyArrayBuffer(gl, program.a_Texture, 2, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.textureBuffer || !o.indexBuffer) {
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function assignVertexBuffersData(gl, buffers, model) {
    // write date into the buffer objects
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.arrays.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.arrays.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.arrays.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.arrays.textures, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.arrays.indices, gl.STATIC_DRAW);
}

function getShaderVariables(program) {
    //get the storage locations of attribute and uniform variables
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.a_Texture = gl.getAttribLocation(program, 'a_Texture');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
    program.u_NormalSampler = gl.getUniformLocation(program, 'u_NormalSampler');

    if (program.a_Position < 0 || program.a_Normal < 0 || program.a_Color < 0 || program.a_Texture < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_Sampler || !program.u_NormalSampler) {
        console.log('Error getting attribute/uniform location');
        return false;
    }

    return true;
}

function printModelInfo(model) {
    console.log("number of vertices=%d", model.arrays.vertices.length / 3);
    console.log("number of normals=%d", model.arrays.normals.length / 3);
    console.log("number of colors=%d", model.arrays.colors.length / 4);
    console.log("number of textures=%d", model.arrays.textures.length / 2);
    console.log("nummer of faces=%d", model.arrays.indices.length / 3);

    for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
        console.log("v[%d]=(%f,%f,%f)", i,
            model.arrays.vertices[i * 3 + 0],
            model.arrays.vertices[i * 3 + 1],
            model.arrays.vertices[i * 3 + 2]);
    }
    for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
        console.log("vn[%d]=(%f,%f,%f)", i,
            model.arrays.normals[i * 3 + 0],
            model.arrays.normals[i * 3 + 1],
            model.arrays.normals[i * 3 + 2]);
    }
    for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
        console.log("ccc[%d]=(%d,%d,%d,%d)", i,
            model.arrays.colors[i * 3 + 0],
            model.arrays.colors[i * 3 + 1],
            model.arrays.colors[i * 3 + 2],
            model.arrays.colors[i * 3 + 3]);
    }
    for (var i = 0; i < 36 && i < model.arrays.vertices.length / 3; i++) {
        console.log("vt[%d]=(%d,%d)", i,
            model.arrays.textures[i * 3 + 0],
            model.arrays.textures[i * 3 + 1]);
    }
    for (var i = 0; i < 10 && i < model.arrays.indices.length / 3; i++) {
        console.log("f[%d]=(%d,%d,%d)", i,
            model.arrays.indices[i * 3 + 0],
            model.arrays.indices[i * 3 + 1],
            model.arrays.indices[i * 3 + 2]);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

// Initialize a texture and load an image.
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    // set default texture (red)
    const pixel = new Uint8Array([255, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

    // load texture (asynchronous)
    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

function initScene() {
    // set the clear color and enable the depth test
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // select the viewport
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // set the projection matrix
    pMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 5000.0);

    // set the modelview matrix
    mvMatrix.setIdentity(); // erase all prior transformations
    mvMatrix.lookAt(0.0, 500.0, 200.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // start reading the OBJ file
    model = new Object();
    var scale = 60; // 1

    readOBJFile(objName.cube, gl, model, scale, true); // cube.obj

    // init rotation matrices
    curRot.setIdentity();
    leftRot.setRotate(5, 0, 1, 0);
    rightRot.setRotate(-5, 0, 1, 0);
    upRot.setRotate(-5, 0, 0, 1);
    downRot.setRotate(5, 0, 0, 1);
}

function drawScene(gl, program, angle, buffers, model) {

    // Specify the texture map
    gl.activeTexture(gl.TEXTURE0); // use texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.u_Sampler, 0);

    // Specify the texture map
    gl.activeTexture(gl.TEXTURE1); // use texture unit 1
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(program.u_NormalSampler, 1);

    // get model arrays if necessary
    if (!model.arrays) {
        if (isOBJFileLoaded(model)) {
            extractOBJFileArrays(model);
            assignVertexBuffersData(gl, buffers, model);
            printModelInfo(model);
        }
        if (!model.arrays) return;   // drawing failed
    }

    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    // perform modeling transformations (rotate)
    mvPushMatrix();

    // We don't want the object ot start rotating
    /*
        mvMatrix.rotate(angle, 1.0, 0.0, 0.0); // about x
        mvMatrix.rotate(angle, 0.0, 1.0, 0.0); // about y
        mvMatrix.rotate(angle, 0.0, 0.0, 1.0); // about z
    */

    // set the normal matrix
    nMatrix.setInverseOf(mvMatrix);
    nMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, nMatrix.elements);

    // compute the combined transformation matrix
    mvpMatrix.set(pMatrix);
    mvpMatrix.multiply(mvMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    mvPopMatrix();

    // draw
    gl.drawElements(gl.TRIANGLES, model.arrays.indices.length, gl.UNSIGNED_SHORT, 0);

}

function animate(angle) {
    var now = Date.now();
    var elapsed = now - lastAnimationTime;
    if (elapsed < 1000 / fps) return angle;
    lastAnimationTime = now;
    // update the current rotation angle (adjusted by elapsed time)
    var newAngle = angle + (angleStep * elapsed) / 1000.0;
    return newAngle % 360;
}

function tick() {
    currentAngle = animate(currentAngle); // update current rotation angles
    drawScene(gl, gl.program, currentAngle, buffers, model);
    requestAnimationFrame(tick, canvas);
}

function main() {
    // retrieve the <canvas> element
    canvas = document.getElementById('webgl');

    // get rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // get storage locations of attribute and uniform variables
    var program = gl.program;
    if (!getShaderVariables(program)) {
        console.log('Error locating shader variables');
        return;
    }

    // load texture
    texture2 = loadTexture(gl, '../data/normal-map.png');
    texture = loadTexture(gl, '../data/frac2.png');

    // prepare empty buffer objects
    buffers = initVertexBuffers(gl, program);
    if (!buffers) {
        console.log('Failed to set the vertex information');
        return;
    }

    // set button event listeners
    var turnLeftBtn = document.getElementById('turnLeftBtn');
    turnLeftBtn.addEventListener('click', turnLeft);

    var turnRightBtn = document.getElementById('turnRightBtn');
    turnRightBtn.addEventListener('click', turnRight);

    var turnUpBtn = document.getElementById('turnUpBtn');
    turnUpBtn.addEventListener('click', turnUp);

    var turnDownBtn = document.getElementById('turnDownBtn');
    turnDownBtn.addEventListener('click', turnDown);

    var zoomInBtn = document.getElementById('zoomInBtn');
    zoomInBtn.addEventListener('click', zoomIn);

    var zoomOutBtn = document.getElementById('zoomOutBtn');
    zoomOutBtn.addEventListener('click', zoomOut);

    var invertNormalsBtn = document.getElementById('invertNormalsBtn');
    invertNormalsBtn.addEventListener('click', invertNormals);

    document.onkeydown = checkKey;

    function checkKey(e) {
        if (e.keyCode == '38') turnUp();
        else if (e.keyCode == '40') turnDown();
        else if (e.keyCode == '37') turnLeft();
        else if (e.keyCode == '39') turnRight();
        else if (e.keyCode == '73') invertNormals();
        else if (e.keyCode == '187') zoomIn();
        else if (e.keyCode == '189') zoomOut();
    }

    // initialize the scene and start animation
    initScene();
    tick();
}



