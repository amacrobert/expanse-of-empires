import MapUtil from './map-util';
require('../three/loaders/MTLLoader.js');
require('../three/loaders/OBJLoader.js');

const THREE = require('three');

class GraphicsUtil {

    constructor() {
        const points = MapUtil.hexPoints;

        // Initialize loaders
        this.textureLoader = new THREE.TextureLoader();
        this.mtlLoader = new THREE.MTLLoader();

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
        this.hexMaterial = new THREE.MeshPhongMaterial({ color: 0x78AB46 });

        // Simple shadow object
        let shadowTexture = this.textureLoader.load(require('../../img/shadow.png'));
        shadowTexture.offset = new THREE.Vector2(0.5, 0.5);
        let shadowShape = new THREE.Shape();
        shadowShape.moveTo(-1, -1);
        shadowShape.lineTo(1, -1);
        shadowShape.lineTo(1, 1);
        shadowShape.lineTo(-1, 1);
        shadowShape.lineTo(-1, -1);
        let shadowGeometry = new THREE.ShapeGeometry(shadowShape);
        this.shadowMesh = new THREE.Mesh(shadowGeometry, new THREE.MeshPhongMaterial({
            map: shadowTexture,
            transparent: true,
            opacity: 0.5,
        }));
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.y = .04;

        // Sprite assets
        this.sprites = {
            //startingPosition: this.loadSprite(require('../../img/starting-position.png')),
            startingPosition: this.loadSprite(require('../../img/down-arrow.svg')),
        };

        // OBJ assets
        this.buildings = {
            castle: this.loadObj(
                '/models/castle/SM_Fort.obj',
                '/models/castle/SM_Fort.mtl',
                {x: .008, y: .020, z: .008}
            ),
            bastion: this.loadObj(
                '/models/bastion/model.obj',
                '/models/bastion/materials.mtl',
                {x: .25, y: .25, z: .25},
                {x: 0, y: .67, z: 0}
            ),
            mill: this.loadObj(
                '/models/mill/PUSHILIN_windmill.obj',
                '/models/mill/PUSHILIN_windmill.mtl',
                {x: 0.25, y: 0.25, z: 0.25},
                {x: 0, y: 0.25, z: 0}
            ),
        };

        // Hex hover selection
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
        this.hoverOutline = new THREE.Line(
            hoverLineGeometry,
            new THREE.LineDashedMaterial({
                color: 0xffffff,
                scale: 1.0,
                dashSize: 0.15,
                gapSize: 0.05,
            })
        );
        this.hoverOutline.computeLineDistances();
        this.hoverOutline.position.y = 0;//0.02;

        // Border section mesh assets
        let borderShape = new THREE.Shape();
        const borderPoints = MapUtil.borderPoints;
        borderShape.moveTo(borderPoints[0].x, borderPoints[0].z);
        borderShape.lineTo(borderPoints[1].x, borderPoints[1].z);
        borderShape.lineTo(borderPoints[2].x, borderPoints[2].z);
        borderShape.lineTo(borderPoints[3].x, borderPoints[3].z);
        borderShape.lineTo(borderPoints[0].x, borderPoints[0].z);
        this.borderGeometry = new THREE.ShapeGeometry(borderShape);
        this.borderMaterial = new THREE.MeshLambertMaterial({ color: 0x3333FF, transparent: true, opacity: 1 });
    }

    loadSprite = (file) => {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(file, texture => {
                const material = new THREE.SpriteMaterial({ map: texture, color: 0xffffff, transparent: true });
                const sprite = new THREE.Sprite(material);
                resolve(sprite);
            });
        });
    };

    getSprite = (name, q = 0, r = 0) => {
        return this.sprites[name].then(sprite => {
            let clone = sprite.clone();
            clone.center = new THREE.Vector2(.5, 0);
            clone.scale.set(1,2,1);
            let realCoords = MapUtil.axialToReal(q, r);
            clone.position.set(realCoords.x, .002, realCoords.z);
            return clone;
        });
    };

    loadObj = (objFile, materialFile, scale = {x: 1, y: 1, z: 1}, position = {x: 0, y: 0, z: 0}) => {
        return new Promise((resolve, reject) => {
            this.mtlLoader.load(materialFile, materials => {
                materials.preload();

                if (materials.materials.SM_FortSG1) {
                    materials.materials.SM_FortSG1.color.r = .1;
                    materials.materials.SM_FortSG1.color.g = .1;
                    materials.materials.SM_FortSG1.color.b = 1;
                }

                if (materials.materials.SM_FortSG2) {
                    materials.materials.SM_FortSG2.visible = false;
                }

                let objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.load(objFile, (object) => {
                    object.scale.set(scale.x, scale.y, scale.z);
                    object.position.set(position.x, position.y, position.z);
                    object.castShadow = true;
                    resolve(object);
                });
            });
        })
    };

    getBuilding = (name, q = 0, r = 0) => {
        return this.buildings[name].then(object => {
            let clone = object.clone();
            clone.name = name;
            let realCoords = MapUtil.axialToReal(q, r);
            clone.position.x = realCoords.x;
            clone.position.z = realCoords.z;
            return clone;
        });
    };

    getHexMesh = (territory) => {
        var hexMesh = new THREE.Mesh(this.hexGeometry, this.hexMaterial);

        // Rotate from x/y coordinates to x/z
        hexMesh.rotation.x = -Math.PI / 2;
        hexMesh.scale.x = hexMesh.scale.y = .985;

        // Move the mesh to its real map position
        const realCoords = MapUtil.axialToReal(territory.q, territory.r);
        hexMesh.position.x = realCoords.x;
        hexMesh.position.z = realCoords.z;

        hexMesh.receiveShadow = true;

        return hexMesh;
    };

    getSimpleShadow = (territory) => {
        let shadowMesh = this.shadowMesh.clone();
        let real = MapUtil.axialToReal(territory.q, territory.r);
        shadowMesh.position.x = real.x;
        shadowMesh.position.z = real.z;

        return shadowMesh;
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

    getBorderSectionMesh = (territory, rotation) => {
        var borderMesh = new THREE.Mesh(this.borderGeometry);
        borderMesh.rotation.z = MapUtil.borderRotation[rotation];
        borderMesh.rotation.x = -Math.PI / 2;
        borderMesh.position.y = 0.05;
        let realCoords = MapUtil.axialToReal(territory.q, territory.r);
        borderMesh.position.x = realCoords.x;
        borderMesh.position.z = realCoords.z;

        borderMesh.scale.x = borderMesh.scale.y = .94;
        borderMesh.updateMatrix();

        return borderMesh;
    };
};

export default GraphicsUtil;
