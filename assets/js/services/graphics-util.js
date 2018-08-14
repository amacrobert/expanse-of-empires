import MapUtil from './map-util';

const THREE = require('three');

class GraphicsUtil {

    constructor() {
        const points = MapUtil.hexPoints;

        // Hex mesh assets
        this.hexShape = new THREE.Shape();
        this.hexShape.moveTo(points.top.x, points.top.z);
        this.hexShape.lineTo(points.topLeft.x, points.topLeft.z);
        this.hexShape.lineTo(points.bottomLeft.x, points.bottomLeft.z);
        this.hexShape.lineTo(points.bottom.x, points.bottom.z);
        this.hexShape.lineTo(points.bottomRight.x, points.bottomRight.z);
        this.hexShape.lineTo(points.topRight.x, points.topRight.z);
        this.hexShape.lineTo(points.top.x, points.top.z);

        this.hexGeometry = new THREE.ShapeGeometry(this.hexShape);
        this.hexMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

        // Sprite assets
        this.sprites = {
            startingPosition: this.loadSprite(require('../../img/starting-position.png')),
        };

        // Hex hover selection
        let hoverLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        let hoverLineGeometry = new THREE.Geometry();
        hoverLineGeometry.vertices.push(
            new THREE.Vector3(points.top.x, 0, points.top.z),
            new THREE.Vector3(points.topLeft.x, 0, points.topLeft.z),
            new THREE.Vector3(points.bottomLeft.x, 0, points.bottomLeft.z),
            new THREE.Vector3(points.bottom.x, 0, points.bottom.z),
            new THREE.Vector3(points.bottomRight.x, 0, points.bottomRight.z),
            new THREE.Vector3(points.topRight.x, 0, points.topRight.z),
            new THREE.Vector3(points.top.x, 0, points.top.z),
        );
        this.hoverOutline = new THREE.Line(hoverLineGeometry, hoverLineMaterial);
        this.hoverOutline.position.y = 0.02;

        // Border section mesh assets
        let borderShape = new THREE.Shape();
        const borderPoints = MapUtil.borderPoints;
        borderShape.moveTo(borderPoints[0].x, borderPoints[0].z);
        borderShape.lineTo(borderPoints[1].x, borderPoints[1].z);
        borderShape.lineTo(borderPoints[2].x, borderPoints[2].z);
        borderShape.lineTo(borderPoints[3].x, borderPoints[3].z);
        borderShape.lineTo(borderPoints[0].x, borderPoints[0].z);
        this.borderGeometry = new THREE.ShapeGeometry(borderShape);
        this.borderMaterial = new THREE.MeshLambertMaterial({ color: 0x3333FF });
    }

    loadSprite = (file) => {
        const textureLoader = new THREE.TextureLoader;
        return new Promise((resolve, reject) => {
            textureLoader.load(file, texture => {
                const material = new THREE.SpriteMaterial({ map: texture, color: 0xffffff });
                const sprite = new THREE.Sprite(material);
                resolve(sprite);
            });
        });
    };

    getSprite = (name, q = 0, r = 0) => {
        return this.sprites[name].then(sprite => {
            let clone = sprite.clone();
            clone.center = new THREE.Vector2(.5, .12);
            let realCoords = MapUtil.axialToReal(q, r);
            clone.position.set(realCoords.x, .055, realCoords.z);
            return clone;
        });
    };

    getHexMesh = (territory) => {
        var hexMesh = new THREE.Mesh(this.hexGeometry, this.hexMaterial);

        // Rotate from x/y coordinates to x/z
        hexMesh.rotation.x = -Math.PI / 2;
        hexMesh.scale.x = hexMesh.scale.y = .98;

        // Move the mesh to its real map position
        const realCoords = MapUtil.axialToReal(territory.q, territory.r);
        hexMesh.position.x = realCoords.x;
        hexMesh.position.z = realCoords.z;

        return hexMesh;
    };

    getHoverOutline = () => {
        return this.hoverOutline;
    };

    setHoverOutline = (coordinates = null) => {
        if (coordinates) {
            this.hoverOutline.visible = true;
            const realCoords = MapUtil.axialToReal(coordinates.q, coordinates.r);
            this.hoverOutline.position.x = realCoords.x;
            this.hoverOutline.position.z = realCoords.z;
        }
        else {
            this.hoverOutline.visible = false;
        }
    };

    mouseToReal = (bounds, element, x, y) => {
        return {
            x: ((x - bounds.left) / element.clientWidth) * 2 - 1,
            y: -((y - bounds.top) / element.clientHeight) * 2 + 1
        };
    };

    getBorderSection = (territory, rotation) => {
        var borderMesh = new THREE.Mesh(this.borderGeometry, this.borderMaterial);
        borderMesh.rotation.z = MapUtil.borderRotation[rotation];
        borderMesh.rotation.x = -Math.PI / 2;
        borderMesh.position.y = 0.01;
        let realCoords = MapUtil.axialToReal(territory.q, territory.r);
        borderMesh.position.x = realCoords.x;
        borderMesh.position.z = realCoords.z;

        return borderMesh;
    }
};

export default new GraphicsUtil();
