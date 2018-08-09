const size = 1;
const width = Math.sqrt(3) * size;
const height = 2 * size;
const points = {
    top:            { x: 0,         z: -height/2 },
    topRight:       { x: width/2,   z: -height/4 },
    bottomRight:    { x: width/2,   z: height/4  },
    bottom:         { x: 0,         z: height/2  },
    bottomLeft:     { x: -width/2,  z: height/4  },
    topLeft:        { x: -width/2,  z: -height/4 },
};

export default {
    axialToReal: (q, r) => {
        return {
            x: (q * width) + (r * width / 2),
            z: r * (height * 3/4),
        };
    },

    hexPoints: points,

    axialToCube: (q, r) => {
        return { q, r, s: -q-r };
    }
};
