"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// CS411 Assignment 1 (Fall 2017) - raster graphics
//
// Mayank Bansal
// A20392482
// mbansal5@hawk.iit.edu
//
// Tested on Chrome Version 61.0.3163.79 (Official Build) (64-bit)
//
/////////////////////////////////////////////////////////////////////////////////////////

var ctx;
var imageData;

var pauseFlag = true;
var lineFlag = true;
var triangleFlag = true;
var fillFlag = true;
var fillModeFlag = true;

function togglePause() {
    pauseFlag = !pauseFlag;
    console.log('pauseFlag = ' + pauseFlag);
}

function toggleLine() {
    lineFlag = !lineFlag;
    console.log('lineFlag = ' + lineFlag);
}

function toggleTriangle() {
    triangleFlag = !triangleFlag;
    console.log('triangleFlag = ' + triangleFlag);
}

function toggleFill() {
    fillFlag = !fillFlag;
    console.log('fillFlag = ' + fillFlag);
}

function toggleFillMode() {
    fillModeFlag = !fillModeFlag;
    console.log('fillModeFlag = ' + fillModeFlag);
}

function animate() {
    if (!pauseFlag) {
        if (lineFlag) drawRandomLineSegment();
        if (triangleFlag) drawRandomTriangle();
    }
    setTimeout(animate, 100); // call animate() in 1000 msec
}

function initImage(img) {
    var canvas = document.getElementById('mycanvas');
    ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // get reference to image data
}

function main() {
    // load and display image
    var img = new Image();
    img.src = '../data/frac2.png';
    img.crossOrigin = "Anonymous";
    img.onload = function () {
        initImage(this);
    };

    // set button listeners
    var grayscalebtn = document.getElementById('grayscaleButton');
    grayscalebtn.addEventListener('click', grayscale);

    var pausebtn = document.getElementById('pauseButton');
    pausebtn.addEventListener('click', togglePause);

    var linebtn = document.getElementById('lineButton');
    linebtn.addEventListener('click', toggleLine);

    var trianglebtn = document.getElementById('triangleButton');
    trianglebtn.addEventListener('click', toggleTriangle);

    var fillbtn = document.getElementById('fillButton');
    fillbtn.addEventListener('click', toggleFill);

    var fillModebtn = document.getElementById('fillModeButton');
    fillModebtn.addEventListener('click', toggleFillMode);

    // start animation
    animate();
}

/////////////////////////////////////////////////////////////////////////////////////////
//
// conversion to grayscale
//
/////////////////////////////////////////////////////////////////////////////////////////

function grayscale() {
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var m = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = m; // red
        data[i + 1] = m; // green
        data[i + 2] = m; // blue
    }
    ctx.putImageData(imageData, 0, 0);
}

/////////////////////////////////////////////////////////////////////////////////////////
//
// draw lines
//
/////////////////////////////////////////////////////////////////////////////////////////

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// REPLACE THIS WITH YOUR FUNCTION FOLLOWING THE ASSIGNMENT SPECIFICATIONS
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// Helper Functions
function sign(a, b) {
    if (a - b === 0) return 0;
    else if (a - b > 0) return +1;
    else return -1;
}

function putPixel(x, y, color) {
    var data = imageData.data;
    var h = imageData.height;
    var w = imageData.width;

    var yi = h - y; // invert y coordinate
    data[(yi * w + x) * 4 + 0] = color[0]; // red
    data[(yi * w + x) * 4 + 1] = color[1]; // green
    data[(yi * w + x) * 4 + 2] = color[2]; // blue
}

// Bressenhams Line Drawing Algorithm
function drawLineSegment(vs, ve, color) {

    var h = imageData.height;
    var w = imageData.width;

    // ignore illegal lines
    if ((vs[0] < 0) || (vs[1] < 0) || (ve[0] >= w) || (ve[1] >= h)) return;
    if ((vs[0] === ve[0]) && (vs[1] === ve[1])) return;

    var x2 = ve[0];
    var x1 = vs[0];
    var y2 = ve[1];
    var y1 = vs[1];

    console.log("Start: (" + x1 + "," + y1 + "), End: (" + x2 + "," + y2 + ")");

    var dy = Math.abs(y2 - y1);
    var dx = Math.abs(x2 - x1);

    var sign2 = sign(y2, y1);
    var sign1 = sign(x2, x1);

    var Pk = 2 * dy - dx;

    var x = x1;
    var y = y1;

    var swapped = false;

    if (dy > dx) {
        var temp = dy;
        dy = dx;
        dx = temp;
        swapped = true;
    }

    for (var i = 1; i <= dx; i++) {
        putPixel(x, y, color);
        if (Pk < 0) {
            if (swapped) y += sign2;
            else x += sign1;
            Pk += 2 * dy;
        } else {
            y += sign2;
            x += sign1;
            Pk += 2 * (dy - dx);
        }
    }

    // update image
    ctx.putImageData(imageData, 0, 0);
}

function drawRandomLineSegment() {
    var h = imageData.height;
    var w = imageData.width;

    var xs = Math.floor(Math.random() * w);
    var ys = Math.floor(Math.random() * h);
    var xe = Math.floor(Math.random() * w);
    var ye = Math.floor(Math.random() * h);
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);

    drawLineSegment([xs, ys], [xe, ye], [r, g, b]);
}

/////////////////////////////////////////////////////////////////////////////////////////
//
// draw triangles
//
/////////////////////////////////////////////////////////////////////////////////////////

function triangleArea(a, b, c) {
    var area = ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]));
    area = Math.abs(0.5 * area);
    return area;
}

function vertexInside(v, v0, v1, v2) {
    var T = triangleArea(v0, v1, v2);

    var alpha = triangleArea(v, v0, v1) / T;
    var beta = triangleArea(v, v1, v2) / T;
    var gamma = triangleArea(v, v2, v0) / T;

    if ((alpha >= 0) && (beta >= 0) && (gamma >= 0) && (Math.abs(alpha + beta + gamma - 1) < 0.00001)) return true;
    else return false;
}

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// REPLACE THIS WITH YOUR FUNCTION FOLLOWING THE ASSIGNMENT SPECIFICATIONS
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

function drawTriangleLine(y, m0, m2, b0, b2, color) {
    var pStart = [Math.round((y - b0) / m0), y];
    var pEnd = [Math.round((y - b2) / m2), y];

    if (fillModeFlag) {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        color = [r, g, b];
    }

    drawLineSegment(pStart, pEnd, color);
}

function fillTopFlatTriangle(v1, v2, v3, color) {
    var m0 = (v2[1] - v1[1]) / (v2[0] - v1[0]);
    var b0 = (v1[1] - m0 * v1[0]);

    var m2 = (v3[1] - v1[1]) / (v3[0] - v1[0]);
    var b2 = (v3[1] - m2 * v3[0]);

    for (var y = v2[1]; y < v1[1]; y++)
        drawTriangleLine(y, m0, m2, b0, b2, color);
}

function fillBottomFlatTriangle(v1, v2, v3, color) {
    var m0 = (v2[1] - v1[1]) / (v2[0] - v1[0]);
    var b0 = (v1[1] - m0 * v1[0]);

    var m2 = (v3[1] - v1[1]) / (v3[0] - v1[0]);
    var b2 = (v3[1] - m2 * v3[0]);

    for (var y = v2[1]; y > v1[1]; y--)
        drawTriangleLine(y, m0, m2, b0, b2, color);
}

function drawTriangle(v1, v2, v3, color) {

    var arr = [v1, v2, v3];

    for (var i = 0; i < 2; i++)
        for (var j = 0; j < 2 - i; j++)
            if (arr[j][1] < arr[j + 1][1]) {
                var temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }

    v1 = arr[0];
    v2 = arr[1];
    v3 = arr[2];

    drawLineSegment(v1, v2, color);
    drawLineSegment(v2, v3, color);
    drawLineSegment(v3, v1, color);

    if (fillFlag) {
        if (v2[1] === v3[1])
            fillBottomFlatTriangle(v1, v2, v3);
        else if (v1[1] === v2[1])
            fillTopFlatTriangle(v1, v2, v3);
        else {
            var v4x = parseInt(Math.ceil(v1[0] + ((v2[1] - v1[1]) / (v3[1] - v1[1])) * (v3[0] - v1[0])));
            var v4 = [v4x, v2[1]];

            drawLineSegment(v2, v4, color);

            fillBottomFlatTriangle(v3, v2, v4, color);
            fillTopFlatTriangle(v1, v2, v4, color);
        }
    }
}

function drawRandomTriangle() {
    var h = imageData.height;
    var w = imageData.width;

    var v0x = Math.floor(Math.random() * w);
    var v0y = Math.floor(Math.random() * h);
    var v1x = Math.floor(Math.random() * w);
    var v1y = Math.floor(Math.random() * h);
    var v2x = Math.floor(Math.random() * w);
    var v2y = Math.floor(Math.random() * h);
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);

    drawTriangle([v0x, v0y], [v1x, v1y], [v2x, v2y], [r, g, b]);
}
