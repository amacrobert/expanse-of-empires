const radius = 1;
const width = Math.sqrt(3) * radius;
const height = 2 * radius;
const borderWidth = .1;
const borderA = borderWidth / Math.tan(Math.PI / 3);
const points = {
    top:            { x: 0,         z: -height/2 },
    topRight:       { x: width/2,   z: -height/4 },
    bottomRight:    { x: width/2,   z: height/4  },
    bottom:         { x: 0,         z: height/2  },
    bottomLeft:     { x: -width/2,  z: height/4  },
    topLeft:        { x: -width/2,  z: -height/4 },
};

const borderPoints = [
    { x: points.topLeft.x,                  z: points.topLeft.z },
    { x: points.topLeft.x + borderWidth,    z: points.topLeft.z - borderA },
    { x: points.bottomLeft.x + borderWidth, z: points.bottomLeft.z + borderA },
    { x: points.bottomLeft.x,               z: points.bottomLeft.z },
];

const borderRotation = {
    left:           0,
    bottomLeft:     Math.PI / 3,
    bottomRight:    Math.PI * 2 / 3,
    right:          Math.PI,
    topRight:       Math.PI * 4 / 3,
    topLeft:        Math.PI * 5 / 3,
};

const axialToReal = (q, r) => {
    return {
        x: (q * width) + (r * width / 2),
        z: r * (height * 3/4),
    };
};

const axialToCube = (q, r) => {
    return { q, r, s: -q-r };
};

export default {
    axialToReal,
    hexPoints: points,
    borderPoints,
    borderRotation,
    axialToCube,
    borderWidth,
    radius,
};
