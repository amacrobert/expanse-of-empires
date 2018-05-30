import React from 'react';
//require('../map.js');

var THREE = require('three');
require('../three/controls/OrbitControls.js');
require('../three/loaders/MTLLoader.js');
require('../three/loaders/OBJLoader.js');

class MapViewport extends React.Component {

    constructor(props) {
        super(props);

        this.mount = new React.createRef();

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.animate = this.animate.bind(this);
        this.getHexMesh = this.getHexMesh.bind(this);
        this.getCastleObject = this.getCastleObject.bind(this);
        this.updateHexHud = this.updateHexHud.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.mouse = {x: 0, y: 0};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.targetList = [];
    }

    componentDidMount() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true});
        this.element = this.renderer.domElement;
        this.mount.current.appendChild(this.element);
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, this.mount.current.offsetWidth / this.mount.current.offsetHeight, .1, 100);
        this.camera.position.set(0, 20, -10);
        this.scene.add(this.camera);
        this.controls = new THREE.OrbitControls(this.camera, this.element);
        this.controls.target.set(this.camera.position.x, 0, this.camera.position.z + 10);

        // selection glow
        this.selectionGlow = new THREE.Mesh(
            new THREE.SphereGeometry(.98, 6, 10),
            new THREE.MeshPhongMaterial({color: 0x00FFFF, transparent: true, opacity: 0.2})
        );
        this.selectionGlow.rotation.y = Math.PI / 6;
        this.selectionGlow.scale.y = 2;
        this.selectionGlow.visible = false;
        this.scene.add(this.selectionGlow);

        // light
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, .5));

        var sun = new THREE.PointLight(0xFFFF77, 2, 50, 1);
        sun.position.x = 0;
        sun.position.y = 40;
        sun.position.z = 0;
        this.scene.add(sun);

        // fog
        //var skyColor = new THREE.Color(0x7EC0EE);
        var skyColor = new THREE.Color(0x4E5D6C);
        this.scene.fog = new THREE.Fog(skyColor, 20, 100);
        this.scene.background = skyColor;

        // hex grid
        for (var x = 0; x < 20; x++) {
            for (var z = 0; z < 20; z++) {
                var hexMesh = this.getHexMesh();
                var worldX = (x * (1.7320508075688767) + ((z % 2) * (1.7320508075688767 / 2))) - 16.45;
                var worldZ = (z * 1.5) - 15;
                hexMesh.position.x = worldX;
                hexMesh.position.z = worldZ;
                this.targetList.push(hexMesh);
                hexMesh.visible = Math.random() > .5;
                hexMesh.userData.coordinates = {
                    x: x,
                    y: z
                };
                hexMesh.userData.worldCoordinates = {
                    x: worldX,
                    z: worldZ
                };
                this.scene.add(hexMesh);

                var that = this;
                if (hexMesh.visible && Math.random() < .05) {
                    this.getCastleObject(worldX, worldZ).then(function(castle) {
                        that.scene.add(castle);

                        var castleLight = new THREE.PointLight(0xFFFFFF, 2, 2, 2);
                        castleLight.position.x = castle.position.x;
                        castleLight.position.y = 1;
                        castleLight.position.z = castle.position.z;
                        that.scene.add(castleLight);

                    });
                }   
            }
        }

        this.camera.lookAt(0, -1, 0);

        this.projector = new THREE.Projector();
        document.addEventListener('mousedown', this.onMouseDown, false);
        document.addEventListener('mouseup', this.onMouseUp, false);

        this.start();
    }

    getHexMesh() {
        var hexShape = new THREE.Shape();
        var angle = 1.7320508075688767;
        var h = angle * 0.5;
        hexShape.moveTo(h, 0.5);
        hexShape.lineTo(0, 1);
        hexShape.lineTo(-h, 0.5);
        hexShape.lineTo(-h, -0.5);
        hexShape.lineTo(0, -1);
        hexShape.lineTo(h, -0.5);
        hexShape.lineTo(h, 0.5);

        var hexGeometry = new THREE.ShapeGeometry(hexShape);
        var hexMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
        hexMesh.rotation.x = -Math.PI / 2;

        hexMesh.scale.x = hexMesh.scale.y = .98;

        return hexMesh;
    }

    getCastleObject(x, z) {
        return new Promise(function(resolve, reject) {
            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.load('/models/fortress/SM_Fortress.mtl', function(materials) {
                materials.preload();

                var objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.load('/models/fortress/SM_Fortress.obj', function(object) {
                    object.scale.x = object.scale.y = object.scale.z = .006;
                    object.position.x = x;
                    object.position.z = z;
                    object.position.y = .01;
                    resolve(object);
                })
            });
        });
    }

    onMouseDown(event) {
        var bounds = this.mount.current.getBoundingClientRect();
        this.mouse.down = {
            x: ((event.clientX - bounds.left) / this.renderer.domElement.clientWidth) * 2 - 1,
            y: -((event.clientY - bounds.top) / this.renderer.domElement.clientHeight) * 2 + 1
        };
    }

    onMouseUp(event) {
        var bounds = this.mount.current.getBoundingClientRect();
        this.mouse.up = {
            x: ((event.clientX - bounds.left) / this.renderer.domElement.clientWidth) * 2 - 1,
            y: -((event.clientY - bounds.top) / this.renderer.domElement.clientHeight) * 2 + 1
        };

        // Only register hex click if mouse up in in same position as mouse down
        if (JSON.stringify(this.mouse.down) != JSON.stringify(this.mouse.up)) {
            return;
        }

        this.raycaster.setFromCamera(this.mouse.down, this.camera);
        var intersects = this.raycaster.intersectObjects( this.targetList );
        
        // if there is one (or more) intersections
        if (intersects.length > 0) {
            this.selectedHex = intersects[0].object;

            this.selectionGlow.visible = true;
            var hexPosition = this.selectedHex.getWorldPosition();
            this.selectionGlow.position.x = hexPosition.x;
            this.selectionGlow.position.z = hexPosition.z;
            var data = this.selectedHex.userData;
            console.log(data);

            updateHexHud();
        }
        else {
            this.selectionGlow.visible = false;
            this.selectedHex = null;

            updateHexHud();
        }
    }

    updateHexHud() {
        if (this.selectedHex) {
            var data = this.selectedHex.userData;
            $('.coordinates').html('(' + data.coordinates.x + ', ' + data.coordinates.y + ')');
        }
        else {
            $('.coordinates').html('');
        }
    }

    componentWillUnmount() {
        this.stop();
        this.mount.current.removeChild(this.renderer.domElement);
    }

    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    }

    stop() {
        cancelAnimationFrame(this.frameId);
    }

    animate() {
        this.controls.update();
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.animate)
    }

    renderScene() {
        this.renderer.render(this.scene, this.camera);
    }

    render() {
        return(
            <div className="col-md-8 mapviewport">
                <div className="three-canvas" ref={this.mount}></div>
            </div>
        );
    }
};

export default MapViewport;
