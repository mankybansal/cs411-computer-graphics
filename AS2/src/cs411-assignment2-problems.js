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

function threeDto3DH(V) {
    return new Vector4([V.elements[0], V.elements[1], 0, 1]);
}

function threeDHto3D(V) {
    var w;
    if ((w = V.elements[3]) !== 0) {
        return [
            V.elements[0] / w,
            V.elements[1] / w,
            0
        ];
    } else return false;
}

function partA() {
    var V = new Vector4([1, 1, 0]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.setIdentity();
    M.setTranslate(2, 3, 0);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART A)\n   Translated Point: " + V);
}

function partB() {
    var V = new Vector4([1, 1, 0]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.setScale(2, 2, 1);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART B)\n   Scaled Point: " + V);
}

function partC() {
    var V = new Vector4([1, 1, 0, 1]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.setRotate(45, 0, 0, 1);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART C)\n   Rotated Point: " + V);
}

function partD() {
    var V = new Vector4([1, 1, 0, 1]);
    var V3DH = threeDto3DH(V);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART D)\n   Homogeneous Point: [" + V3DH.elements[0] + ", " + V3DH.elements[1] + ", " + V3DH.elements[3] + "]");
}

function partE() {
    var V3DH = new Vector4([1, 1, 0, 2]);

    var V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART E)\n   2D Point: [" + V[0] + ", " + V[1] + "]");
}

function partF() {
    var V3DH = new Vector4([1, 2, 0, 3]);
    var V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART F)\n   2D Point: [" + V[0] + ", " + V[1] + ", " + V3DH.elements[3] / V3DH.elements[3] + "]");
}

function partG() {
    var V3DH = new Vector4([1, 2, 0, 3]);
    var V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART G)\n   2D Point: [" + V[0] + ", " + V[1] + "]");
}

function partI() {
    var V = new Vector4([2, 5, 0, 1]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.setRotate(30, 0, 0, 1);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART I)\n   Rotated Point: " + V);
}

function partJ() {
    var V = new Vector4([2, 5, 0, 1]);
    var M = new Matrix4();
    M.setIdentity();
    var V3DH = threeDto3DH(V);

    M.setTranslate(1, 2, 0);
    M.rotate(30, 0, 0, 1);
    M.translate(-1, -2, 0);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART J)\n   Rotated Point: " + V);
}

function partK() {
    var V = new Vector4([2, 5, 0, 1]);
    var M = new Matrix4();
    M.setIdentity();
    var V3DH = threeDto3DH(V);

    M.rotate(45, 0, 0, 1);
    M.translate(3, 4, 0);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART K)\n   Rotated Point: " + V);
}

function partL() {
    var V = new Vector4([2, 5, 0, 1]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.translate(3, 4, 0);
    M.rotate(45, 0, 0, 1);

    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART L)\n   Rotated Point: " + V);
}

function partM() {
    var V = new Vector4([5, 6, 0, 1]);
    var M = new Matrix4();
    var V3DH = threeDto3DH(V);

    M.rotate(45, 0, 0, 1);
    M.translate(1, 2, 0);


    V3DH = M.multiplyVector4(V3DH);
    V = threeDHto3D(V3DH);

    if (!V)
        console.log("\nUndefined 3DH Point (Cannot divide by 0)");
    else
        console.log("\nPART M)\n   Converted Point: " + V);
}

function main() {

    console.log(
        "CS411 Assignment 2 (Fall 2017) - 2d modelling and viewing\n\n" +
        "Mayank Bansal\n" +
        "A20392482\n" +
        "mbansal5@hawk.iit.edu\n\n" +
        "Tested on Chrome Version 61.0.3163.100 (Official Build) (64-bit)"
    );

    partA();
    partB();
    partC();
    partD();
    partE();
    partF();
    partG();
    partI();
    partJ();
    partK();
    partL();
    partM();
}