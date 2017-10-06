"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// CS411 Assignment 2 (Fall 2017) - 2d modelling and viewing
//
// Mayank Bansal
// A20392482
// mbansal5@hawk.iit.edu
//
// Tested on Chrome Version 61.0.3163.100 (Official Build) (64-bit)
//
/////////////////////////////////////////////////////////////////////////////////////////

// global variables
var canvas;
var gl;
var lastAnimationTime = Date.now();
var fps = 30;
var u_ModelMatrix;
var u_FragColor;
var a_Position;
var vertices;
var n;
var scale = 1;

var speed = 0.1;
var angSpeed = 1;
var renderMode = 0;
var pauseFlag = 0;
var rotateMode = 0;
var boardW = 2.0;          // board width
var boardH = 2.0;          // board height
var curPosX = 0, curPosY = 0;  // current position of object
var curRotAngle = 0;      // current rotation of object
var dX, dY;                // correct direction of motion (unit vector)
var past = [];

var vertexBuffer, lineBuffer; // buffers

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '  gl_PointSize = 3.0;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';

// button event handlers
function speedUp() {
    speed *= 2;
    angSpeed += 1;
    console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function speedDown() {
    speed /= 2;
    angSpeed -= 1;
    if (speed < 0.0001) speed = 0.0001;
    if (angSpeed < 1) angSpeed = 1;
    console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function zoomIn() {
    scale *= 1.25;
    console.log(scale);
    // select the view window (projection camera)
    var left = -boardW / 2.0, right = boardW / 2.0, bottom = -boardH / 2.0, top = boardH / 2.0, near = 0, far = 10;
    pMatrix.setIdentity();
    pMatrix.ortho(left / scale, right / scale, bottom / scale, top / scale, near, far);
    mvMatrix.multiply(pMatrix);
    if(scale>=1) {
        var v1 = (gl.viewportWidth * (scale - 1)) / 2;
        console.log("V1 " + v1);
        gl.viewport(-v1, -v1, gl.viewportWidth * scale, gl.viewportHeight * scale);

        console.log(gl.viewportWidth*scale);
    }
    else{
        //mvMatrix.scale(scale,scale,1);
        var v1 = (gl.viewportWidth * (scale - 1)) / 2;
    }

}

function zoomOut() {
    scale /= 1.25;
    console.log(scale);
    var left = -boardW / 2.0, right = boardW / 2.0, bottom = -boardH / 2.0, top = boardH / 2.0, near = 0, far = 10;
    pMatrix.setIdentity();
    pMatrix.ortho(left * scale, right * scale, bottom * scale, top * scale, near, far);
    if(scale>1) {
        mvMatrix.multiply(pMatrix);
        var v1 = (gl.viewportWidth * (scale - 1)) / 2;
        console.log("V1 " + v1);
        gl.viewport(-v1, -v1, gl.viewportWidth * scale, gl.viewportHeight * scale);

        console.log(gl.viewportWidth * scale);
    }
    else{
        //mvMatrix.scale(scale,scale,1);
        var v1 = (gl.viewportWidth * (scale - 1)) / 2;
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    }
    console.log(gl.viewportWidth);
}

function toggleRenderMode() {
    renderMode++;
    if (renderMode > 1) renderMode = 0;
    console.log('renderMode = %d', renderMode);
}

function toggleRotateMode() {
    rotateMode++;
    if (rotateMode > 1) rotateMode = 0;
    console.log('rotateMode = %d', rotateMode);
}

function togglePause() {
    pauseFlag = 1 - pauseFlag;
    console.log('pauseFlag = %d', pauseFlag);
}

function initVertexBuffers(gl) {

    // CREATE TRIANGLE
    vertices = new Float32Array([
        0, 0.3,
        -0.3, -0.3,
        0.3, -0.3,
        0.0, -0.1
    ]); // CM

    // CREATE LINE & VERTEX BUFFER
    vertexBuffer = gl.createBuffer();
    lineBuffer = gl.createBuffer();

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
}

function initScene(gl) {
    // select the viewport
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // reset the modelview matrix
    mvMatrix.setIdentity(); // erase all prior transformations

    // select the view window (projection camera)
    var left = -boardW / 2.0, right = boardW / 2.0, bottom = -boardH / 2.0, top = boardH / 2.0, near = 0, far = 10;
    pMatrix.setIdentity();
    pMatrix.ortho(left, right, bottom, top, near, far);
    mvMatrix.multiply(pMatrix);

    // set the camera position and orientation (viewing transformation)
    var eyeX = 0, eyeY = 0, eyeZ = 10;
    var centerX = 0, centerY = 0, centerZ = 0;
    var upX = 0, upY = 1, upZ = 0;
    mvMatrix.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);
}

function drawScene(gl, u_ModelMatrix, u_FragColor, n) {

    // CLEAR CANVAS
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    mvMatrix.setIdentity();

    // BIND lineBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(past), gl.DYNAMIC_DRAW);

    // BIND vertexBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    mvMatrix.scale(scale, scale, 1);
    // CHECK RENDER MODE TO DRAW LINES
    if (renderMode > 0) {
        // BIND lineBuffer
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
        var len = past.length / 2;
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

        // DRAW LINES
        gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);
        gl.uniform4f(u_FragColor, 1, 1, 0, 1); // set color
        gl.drawArrays(gl.LINE_STRIP, 0, len); // draw line
    }

    mvPushMatrix();
    mvMatrix.translate(curPosX, curPosY, 0);
    if (rotateMode > 0) {

        ///////////////////////////////////////////
        /// DEFINE ROTATION MATRIX FOR DIRECTION
        ///////////////////////////////////////////

        var xDiff = past[past.length - 2] - past[past.length - 4];
        var yDiff = past[past.length - 1] - past[past.length - 3];

        var xDiffNorm = xDiff / (Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)));
        var yDiffNorm = yDiff / (Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)));

        var V = new Vector4([xDiffNorm, yDiffNorm, 0]);
        var V3DH = threeDto3DH(V);
        var M = new Matrix4();
        M.setRotate(90, 0, 0, 1);
        V3DH = M.multiplyVector4(V3DH);

        var xFormMatrix = new Float32Array([
            V.elements[0], V.elements[1], 0, 0,
            V3DH.elements[0], V3DH.elements[1], 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        M = new Matrix4();
        M.elements = xFormMatrix;

        mvMatrix.multiply(M);
        mvMatrix.rotate(-90, 0, 0, 1);
    } else
        mvMatrix.rotate(curRotAngle, 0, 0, 1);

    //mvMatrix.scale(scale, scale, 1);

    // BIND vertexBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);

    // DRAW TRIANGLE
    gl.uniform4f(u_FragColor, 1, 0, 0, 1); // set color
    gl.drawArrays(gl.TRIANGLES, 0, 3); // draw triangle

    // DRAW CENTER OF MASS
    gl.uniform4f(u_FragColor, 1, 1, 1, 1); // set color
    gl.drawArrays(gl.POINTS, 3, 1); // draw point

    mvPopMatrix();

}

function threeDto3DH(V) {
    return new Vector4([V.elements[0], V.elements[1], 0, 1]);
}

function animate() {
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - lastAnimationTime;
    if (elapsed < 1000 / fps) return;

    // record the current time
    lastAnimationTime = now;

    // compute new angle
    curRotAngle += angSpeed;
    if (curRotAngle > 360) curRotAngle -= 360;

    // compute new position
    curPosX += speed * dX;
    curPosY += speed * dY;

    if (curPosX < -(boardW / scale) / 2.0) { // left intersection
        curPosX = -(boardW / scale) / 2.0;
        dX *= -1;
    }

    if (curPosX > (boardW / scale) / 2.0) { // right intersection
        curPosX = (boardW / scale) / 2.0;
        dX *= -1;
    }

    if (curPosY < -(boardH / scale) / 2.0) { // bottom intersection
        curPosY = -(boardH / scale) / 2.0;
        dY *= -1;
    }

    if (curPosY > (boardH / scale) / 2.0) { // top intersection
        curPosY = (boardH / scale) / 2.0;
        dY *= -1;
    }
    console.log((boardW/scale)/2);
    past.push(curPosX);
    past.push(curPosY);

}

function tick() {
    if (!pauseFlag) animate(); // update position and rotation angle
    drawScene(gl, u_ModelMatrix, u_FragColor, n); // draw the object
    requestAnimationFrame(tick, canvas); // request a new animation frame
}


function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);

    // get canvas height/width
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    // INIT SHADERS
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // INIT BUFFERS
    initVertexBuffers(gl);

    // get pointers to shader uniform variables
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

    // SET BUTTON LISTENERS
    var speedUpBtn = document.getElementById('speedUpButton');
    speedUpBtn.addEventListener('click', speedUp);

    var speedDownBtn = document.getElementById('speedDownButton');
    speedDownBtn.addEventListener('click', speedDown);

    var zoomInBtn = document.getElementById('zoomInButton');
    zoomInBtn.addEventListener('click', zoomIn);

    var zoomOutBtn = document.getElementById('zoomOutButton');
    zoomOutBtn.addEventListener('click', zoomOut);

    var renderModeBtn = document.getElementById('renderModeButton');
    renderModeBtn.addEventListener('click', toggleRenderMode);

    var pauseBtn = document.getElementById('pauseButton');
    pauseBtn.addEventListener('click', togglePause);

    var rotateModeBtn = document.getElementById('rotateModeButton');
    rotateModeBtn.addEventListener('click', toggleRotateMode);

    // SET PATH ANGLE
    var pathBaseAngle = 30;
    dX = Math.cos(Math.PI * pathBaseAngle / 180.0);
    dY = Math.sin(Math.PI * pathBaseAngle / 180.0);

    // DRAW
    initScene(gl);
    tick();
}





