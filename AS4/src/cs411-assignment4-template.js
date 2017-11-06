"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// CS411 Assignment 4 (Fall 2017) - Surface Rendering
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

var lastAnimationTime = Date.now(); // last time tick() was called
var angleStep = 10;                 // increments of rotation angle (degrees)
var fps = 30;                       // frames per second
var currentAngle = 0.0;             // current rotation angle [degree]

var objName = {
    cow: '../data/cow.obj',
    cube: '../data/mycube.obj'
};

var camZ = 1;
var invertNorm = 0;
var curRot = new Matrix4();
var leftRot = new Matrix4();
var rightRot = new Matrix4();
var upRot = new Matrix4();
var downRot = new Matrix4();
var tmpRot = new Matrix4();

var cMass = {
    x: 0,
    y: 0,
    z: 0
};

var loadObject = false;

// vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
    '  v_Color = vec4(a_Color.rgb * nDotL, a_Color.a);\n' +
    '}\n';

// fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
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

function toggleObject() {
    loadObject = !loadObject;
    initScene();
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
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) {
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.arrays.indices, gl.STATIC_DRAW);
}

function getShaderVariables(program) {
    //get the storage locations of attribute and uniform variables
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

    if (program.a_Position < 0 || program.a_Normal < 0 || program.a_Color < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix) {
        console.log('attribute, uniform');
        return false;
    }
    return true;
}

function printModelInfo(model) {
    console.log("number of vertices=%d", model.arrays.vertices.length / 3);
    console.log("number of normals=%d", model.arrays.normals.length / 3);
    console.log("number of colors=%d", model.arrays.colors.length / 4);
    console.log("nummer of faces=%d", model.arrays.indices.length / 3);

    for (var i = 0; i < 36 && i < model.arrays.vertices.length; i++) {
        console.log("v[%d]=(%f,%f,%f)", i,
            model.arrays.vertices[i * 3 + 0],
            model.arrays.vertices[i * 3 + 1],
            model.arrays.vertices[i * 3 + 2]);
    }

    for (var i = 0; i < 36 && i < model.arrays.vertices.length; i++) {
        console.log("n[%d]=(%f,%f,%f)", i,
            model.arrays.normals[i * 3 + 0],
            model.arrays.normals[i * 3 + 1],
            model.arrays.normals[i * 3 + 2]);
    }

    for (var i = 0; i < 12 && i < model.arrays.indices.length; i++) {
        console.log("f[%d]=(%d,%d,%d)", i,
            model.arrays.indices[i * 3 + 0],
            model.arrays.indices[i * 3 + 1],
            model.arrays.indices[i * 3 + 2]);
    }


    for (var i = 0; i < model.arrays.vertices.length / 3; i++) {
        cMass.x += model.arrays.vertices[i * 3 + 0];
        cMass.y += model.arrays.vertices[i * 3 + 1];
        cMass.z += model.arrays.vertices[i * 3 + 2];
    }

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

    if (loadObject)
        readOBJFile(objName.cube, gl, model, scale, true); // cube.obj
    else
        readOBJFile(objName.cow, gl, model, scale, true); // cube.obj

    // init rotation matrices
    curRot.setIdentity();
    leftRot.setRotate(5, 0, 1, 0);
    rightRot.setRotate(-5, 0, 1, 0);
    upRot.setRotate(-5, 0, 0, 1);
    downRot.setRotate(5, 0, 0, 1);

}

function calcNormalNew(p0, p1, p2) {
    // v0: a vector from p1 to p0, v1; a vector from p1 to p2
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);
    for (var i = 0; i < 3; i++) {
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p0[i];
    }

    // The cross product of v0 and v1
    var c = new Float32Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];

    // Normalize the result
    var v = new Vector3(c);
    v.normalize();
    return v.elements;
}

function drawScene(gl, program, angle, buffers, model) {
    // get model arrays if necessary
    if (!model.arrays) {
        if (isOBJFileLoaded(model)) {
            extractOBJFileArrays(model);

            printModelInfo(model);

            setTimeout(function () {
                console.log("Center of Mass: ",
                    "(" + cMass.x / (model.arrays.vertices.length / 3) + ",",
                    cMass.y / (model.arrays.vertices.length / 3) + ",",
                    cMass.z / (model.arrays.vertices.length / 3) + ")"
                );
            }, 2000);

            var N, X, R = {value: null, set: false};

            // check vertex windings
            for (var i = 0; i < model.arrays.vertices.length / 3; i += 3) {

                var v0 = [
                    model.arrays.vertices[i * 3 + 0],
                    model.arrays.vertices[i * 3 + 1],
                    model.arrays.vertices[i * 3 + 2]
                ];

                var v1 = [
                    model.arrays.vertices[(i + 1) * 3 + 0],
                    model.arrays.vertices[(i + 1) * 3 + 1],
                    model.arrays.vertices[(i + 1) * 3 + 2]
                ];

                var v2 = [
                    model.arrays.vertices[(i + 2) * 3 + 0],
                    model.arrays.vertices[(i + 2) * 3 + 1],
                    model.arrays.vertices[(i + 2) * 3 + 2]
                ];

                N = calcNormalNew(v0, v1, v2);

                // test point v0 with normal N for winding order
                X = v0;

                // calculate X-C
                X[0] -= cMass.x;
                X[1] -= cMass.y;
                X[2] -= cMass.z;

                // calculate winding variable check R = N.(X-C)
                R.value = N[0] * X[0] + N[1] * X[1] + N[2] * X[2];

                // set R flag if R < 0
                if (R.value < 0 && !R.set)
                    R.set = true;

                // print only a few Average Vertex Normals
                if (i < 36)
                    console.log("Average Vertex Normal: Face(v" + i + ",v" + (i + 1) + ",v" + (i + 2) + ") ", N);

                // replace vertex normals with average
                for (var j = 0; j < 3; j++)
                    for (var k = 0; k < 3; k++)
                        model.arrays.normals[(i + j) * 3 + k] = N[k];
            }

            // check if R flag is set to invert normals
            if (R.set) {
                for (var i = 0; i < model.arrays.vertices.length; i++)
                    for (var j = 0; j < 3; j++)
                        model.arrays.normals[i * 3 + j] *= -1;
            }

            assignVertexBuffersData(gl, buffers, model);

        }
        if (!model.arrays) return;   // drawing failed
    }

    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    // perform modeling transformations (rotate)
    mvPushMatrix();

    // We don't want the object ot start rotating
    /* mvMatrix.rotate(angle, 1.0, 0.0, 0.0); // about x
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
        console.log('error locating shader variables');
        return;
    }

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

    var toggleObjectBtn = document.getElementById('toggleObjectBtn');
    toggleObjectBtn.addEventListener('click', toggleObject);

    // initialize the scene and start animation
    initScene();
    tick();

    document.onkeydown = checkKey;

    function checkKey(e) {
        e = e || window.event;
        if (e.keyCode == '38') turnUp();
        else if (e.keyCode == '40') turnDown();
        else if (e.keyCode == '37') turnLeft();
        else if (e.keyCode == '39') turnRight();
        else if (e.keyCode == '73') invertNormals();
        else if (e.keyCode == '79') toggleObject();
        else if (e.keyCode == '187') zoomIn();
        else if (e.keyCode == '189') zoomOut();
    }
}


