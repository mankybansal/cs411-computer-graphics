"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// CS411 Assignment 3 (Fall 2017) - Curve and Surface Interpolation
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
var lastAnimationTime = Date.now();
var fps = 30;
var u_ModelMatrix;
var u_FragColor;
var a_Position;
var vertices;
var n;

var speed = 1;
var reverseFlag = 0;
var tension = 0.5;
var angSpeed = 1;
var renderMode = 0;
var pauseFlag = 0;
var refreshFlag = 1;
var boardW = 10.0;
var boardH = 10.0;
var curPosX = 0, curPosY = 0;
var curPosIndx = 0;
var curRotAngle = 0;

var uStep = 0.01; // interpolation step
var ctrlPts = [];
var intrPts = [];
var Mc;


// vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '  gl_PointSize = 3.0;\n' +
    '}\n';

// fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';

// update Mc Matrix function
function updateMc() {
    Mc = [
        -tension, 2 - tension, tension - 2, tension,
        2 * tension, tension - 3, 3 - 2 * tension, -tension,
        -tension, 0, tension, 0,
        0, 1, 0, 0
    ];
}

// button event handlers
function speedUp() {
    speed += 1;
    angSpeed += 1;
    console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function speedDown() {
    speed -= 1;
    angSpeed -= 1;
    if (speed < 1) speed = 1;
    if (angSpeed < 1) angSpeed = 1;
    console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function tensionUp() {
    tension += 0.1;
    console.log('tension = %f', tension);
    updateMc();
    processPoints();
}

function tensionDown() {
    tension -= 0.1;
    console.log('tension = %f', tension);
    updateMc();
    processPoints();
}

function toggleRenderMode() {
    renderMode++;
    if (renderMode > 1) renderMode = 0;
    console.log('renderMode = %d', renderMode);
}

function togglePause() {
    pauseFlag = 1 - pauseFlag;
    console.log('pauseFlag = %d', pauseFlag);
}

function initVertexBuffers(gl) {
    vertices = new Float32Array([
        0, 0.30,
        -0.3, -0.15,
        0.3, -0.15,
        0.0, 0.0
    ]); // CM
    var n = 3; // The number of vertices

    // create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    // bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    return n;
}

function drawScene(gl, u_ModelMatrix, u_FragColor, n) {
    // clear canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // select the viewport
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // reset the modelview matrix
    mvMatrix.setIdentity(); // erase all prior transformations

    // select the view window (projection matrix)
    var left = -boardW / 2.0, right = boardW / 2.0, bottom = -boardH / 2.0, top = boardH / 2.0, near = 0, far = 10;
    pMatrix.setIdentity();
    pMatrix.ortho(left, right, bottom, top, near, far);
    mvMatrix.multiply(pMatrix);

    // set the camera position and orientation (viewing transformation)
    var eyeX = 0, eyeY = 0, eyeZ = 10;
    var centerX = 0, centerY = 0, centerZ = 0;
    var upX = 0, upY = 1, upZ = 0;
    mvMatrix.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);

    // apply the transformation
    gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);

    // draw the object
    if (renderMode === 1) {

        // save the current transformation matrix
        mvPushMatrix();

        // move the object
        mvMatrix.translate(curPosX, curPosY, 0.0);
        mvMatrix.rotate(curRotAngle, 0, 0, 1);

        // apply the transformation
        gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);

        // draw the object
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // copy the vertices
        gl.uniform4f(u_FragColor, 1, 0, 0, 1); // set color
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.uniform4f(u_FragColor, 1, 1, 1, 1); // set color
        gl.drawArrays(gl.POINTS, 3, 1); // plot CM

        // restore the original transformation matrix from before drawing
        mvPopMatrix();
        gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements); // apply the transformation
    }

    // draw the interpolated curve
    gl.uniform4f(u_FragColor, 1, 1, 0, 1); // set color
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intrPts), gl.DYNAMIC_DRAW); // copy the vertices
    gl.drawArrays(gl.LINE_STRIP, 0, intrPts.length / 2);

    // draw the control points
    gl.uniform4f(u_FragColor, 1, 0, 1, 1); // set color
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ctrlPts), gl.DYNAMIC_DRAW); // copy the vertices
    gl.drawArrays(gl.POINTS, 0, ctrlPts.length / 2);
}

function animate() {
    // calculate the elapsed time
    var now = Date.now();
    var elapsed = now - lastAnimationTime;
    if (elapsed < 1000 / fps) return;

    // record the current time
    lastAnimationTime = now;

    // check if reached the beginning/end of the path
    if (curPosIndx >= intrPts.length) {
        curPosIndx = intrPts.length - 1;
        reverseFlag = 1;
    }
    if (curPosIndx < 0) {
        curPosIndx = 0;
        reverseFlag = 0;
    }

    // obtain the next point on the path
    if (!reverseFlag) {
        curPosX = intrPts[curPosIndx];
        curPosY = intrPts[curPosIndx + 1];
        curPosIndx += speed * 2;
    }
    else {
        curPosX = intrPts[curPosIndx - 1];
        curPosY = intrPts[curPosIndx];
        curPosIndx -= speed * 2;
    }

    // compute new angle
    curRotAngle += angSpeed;
    if (curRotAngle > 360) curRotAngle -= 360;

    // indicate that a new frame needs to be rendered
    refreshFlag = 1;
}

function tick() {
    // update position and rotation angle
    if (!pauseFlag) {
        animate();
    }

    // draw the object
    if (refreshFlag) {
        drawScene(gl, u_ModelMatrix, u_FragColor, n);
        refreshFlag = 0;
    }

    // request a new animation frame
    requestAnimationFrame(tick, canvas);
}

function McMultiplyPoints(v) {
    return [
        Mc[0] * v[0] + Mc[1] * v[1] + Mc[2] * v[2] + Mc[3] * v[3],
        Mc[4] * v[0] + Mc[5] * v[1] + Mc[6] * v[2] + Mc[7] * v[3],
        Mc[8] * v[0] + Mc[9] * v[1] + Mc[10] * v[2] + Mc[11] * v[3],
        Mc[12] * v[0] + Mc[13] * v[1] + Mc[14] * v[2] + Mc[15] * v[3]
    ];
}

function findPoint(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2] + v1[3] * v2[3];
}

function interpolate(pk_n1, pk_p0, pk_p1, pk_p2) {

    var xCoords = [pk_n1.x, pk_p0.x, pk_p1.x, pk_p2.x];
    var yCoords = [pk_n1.y, pk_p0.y, pk_p1.y, pk_p2.y];

    var xCoordsMc = McMultiplyPoints(xCoords);
    var yCoordsMc = McMultiplyPoints(yCoords);

    for (var u = 0; u <= 1; u += uStep) {

        var Ux = [Math.pow(u, 3), u * u, u, 1];
        var Uy = [Math.pow(u, 3), u * u, u, 1];

        var xNewCoords = findPoint(xCoordsMc, Ux);
        var yNewCoords = findPoint(yCoordsMc, Uy);

        intrPts.push(xNewCoords);
        intrPts.push(yNewCoords);
    }
}

function click(ev, gl, canvas, a_Position) {
    // get display coordinates
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer

    // convert viewport to world coordinates (viewport-to-window transformation)
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2) * boardW / 2;
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2) * boardH / 2;

    // store the point
    console.log('Storing point (%f,%f)', x, y);
    ctrlPts.push(x);
    ctrlPts.push(y);

    // process new points
    processPoints();
}

function processPoints() {

    intrPts = [];
    console.log("Redrawing...");

    // generate interpolation points
    var nCtrlPts = ctrlPts.length / 2;
    if (nCtrlPts > 3) {
        for (var i = 0; i < nCtrlPts - 3; i++) {
            // there are 4 points - interpolate between pk and pk+1
            console.log('adding interpolation points');
            var pk_n1 = {x: ctrlPts[0 + i * 2], y: ctrlPts[1 + i * 2]}; // p_{k-1}
            var pk_p0 = {x: ctrlPts[2 + i * 2], y: ctrlPts[3 + i * 2]}; // p_{k+0}
            var pk_p1 = {x: ctrlPts[4 + i * 2], y: ctrlPts[5 + i * 2]}; // p_{k+1}
            var pk_p2 = {x: ctrlPts[6 + i * 2], y: ctrlPts[7 + i * 2]}; // p_{k+2}
            interpolate(pk_n1, pk_p0, pk_p1, pk_p2);
        }
    }

    // indicate plot update
    refreshFlag = 1;
}


function main() {

    // update Mc Matrix
    updateMc();
    console.log("Mc Matrix: ", Mc);

    // retrieve the <canvas> element
    canvas = document.getElementById('webgl');

    // get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // get the canvas height/width
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    console.log(gl.viewportWidth);
    console.log(gl.viewportHeight);

    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // initialize the vertex buffer
    n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    // get pointers to shader uniform variables
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // set button listeners
    var speedUpBtn = document.getElementById('speedUpButton');
    speedUpBtn.addEventListener('click', speedUp);

    var speedDownBtn = document.getElementById('speedDownButton');
    speedDownBtn.addEventListener('click', speedDown);

    var tensionUpBtn = document.getElementById('tensionUpButton');
    tensionUpBtn.addEventListener('click', tensionUp);

    var tensionDownBtn = document.getElementById('tensionDownButton');
    tensionDownBtn.addEventListener('click', tensionDown);

    var renderModeBtn = document.getElementById('renderModeButton');
    renderModeBtn.addEventListener('click', toggleRenderMode);

    var pauseBtn = document.getElementById('pauseButton');
    pauseBtn.addEventListener('click', togglePause);

    // register an event handler to be called on a mouse click
    canvas.onmousedown = function (ev) {
        click(ev, gl, canvas, a_Position);
    };

    // enter animation loop
    tick();
}




