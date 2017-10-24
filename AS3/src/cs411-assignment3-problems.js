var Mc, Mb;
var tension = 0.5;

function updateM() {
    Mc = [
        -tension, 2 - tension, tension - 2, tension,
        2 * tension, tension - 3, 3 - 2 * tension, -tension,
        -tension, 0, tension, 0,
        0, 1, 0, 0
    ];

    Mb = [
        -1, 3, -3 ,1,

        3, -6, 3, 0,
        -3, 3, 0, 0,
        1, 0, 0, 0,

    ]
}


function findPoint(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2] + v1[3] * v2[3];
}


function McMultiplyPoints(v) {
    return [
        Mc[0] * v[0] + Mc[1] * v[1] + Mc[2] * v[2] + Mc[3] * v[3],
        Mc[4] * v[0] + Mc[5] * v[1] + Mc[6] * v[2] + Mc[7] * v[3],
        Mc[8] * v[0] + Mc[9] * v[1] + Mc[10] * v[2] + Mc[11] * v[3],
        Mc[12] * v[0] + Mc[13] * v[1] + Mc[14] * v[2] + Mc[15] * v[3]
    ];
}


function MbMultiplyPoints(v) {
    return [
        Mb[0] * v[0] + Mb[1] * v[1] + Mb[2] * v[2] + Mb[3] * v[3],
        Mb[4] * v[0] + Mb[5] * v[1] + Mb[6] * v[2] + Mb[7] * v[3],
        Mb[8] * v[0] + Mb[9] * v[1] + Mb[10] * v[2] + Mb[11] * v[3],
        Mb[12] * v[0] + Mb[13] * v[1] + Mb[14] * v[2] + Mb[15] * v[3]
    ];
}

function main(){

    updateM();

    //console.log(findPoint([0.125,.25,0.5,1],McMultiplyPoints([1, 2,4,5])));
    console.log(MbMultiplyPoints([1, 2,4,5]));
    console.log(findPoint([0.125,.25,0.5,1],MbMultiplyPoints([1, 2,4,5])));


}

