import React from 'react';
import MapUtil from '../services/map-util';

var THREE = require('three');
require('../three/controls/OrbitControls.js');
require('../three/loaders/MTLLoader.js');
require('../three/loaders/OBJLoader.js');

class MapViewport extends React.Component {

    constructor(props) {
        super(props);

        this.mount = new React.createRef();

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.targetList = [];
        this.inFocus = true;
    }

    componentDidMount() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true});
        var element = this.renderer.domElement;
        this.mount.current.appendChild(element);
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, this.mount.current.offsetWidth / this.mount.current.offsetHeight, .1, 200);
        this.camera.position.set(0, 40, 20);
        this.controls = new THREE.OrbitControls(this.camera, element);
        this.controls.target.set(0, 0, 0);
        this.scene.add(this.camera);

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
        this.scene.fog = new THREE.Fog(skyColor, 50, 200);
        this.scene.background = skyColor;

        // hex grid
        console.log(this.props);
        this.props.map.state.forEach(territory => {
            console.log(territory);
            let hexMesh = this.getHexMesh();
            let realCoords = MapUtil.axialToReal(territory.coordinates.q, territory.coordinates.r);
            hexMesh.position.x = realCoords.x;
            hexMesh.position.z = realCoords.z;
            this.targetList.push(hexMesh);
            hexMesh.userData = territory;
            this.scene.add(hexMesh);
        });

        this.camera.lookAt(0, -1, 0);

        this.projector = new THREE.Projector();
        document.addEventListener('mousedown', this.onMouseDown, false);
        document.addEventListener('mouseup', this.onMouseUp, false);

        this.start();
    }

    getHexMesh = () => {
        var hexShape = new THREE.Shape();
        let points = MapUtil.hexPoints;

        // counter-clockwise
        hexShape.moveTo(points.top.x, points.top.z, 0);
        hexShape.lineTo(points.topLeft.x, points.topLeft.z, 0);
        hexShape.lineTo(points.bottomLeft.x, points.bottomLeft.z, 0);
        hexShape.lineTo(points.bottom.x, points.bottom.z, 0);
        hexShape.lineTo(points.bottomRight.x, points.bottomRight.z, 0);
        hexShape.lineTo(points.topRight.x, points.topRight.z, 0);
        hexShape.lineTo(points.top.x, points.top.z, 0);

        var hexGeometry = new THREE.ShapeGeometry(hexShape);
        var hexMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);

        hexMesh.rotation.x = -Math.PI / 2;
        hexMesh.scale.x = hexMesh.scale.y = .98;

        return hexMesh;
    }

    onMouseDown = (event) => {
        var bounds = this.mount.current.getBoundingClientRect();
        this.mouse.down = {
            x: ((event.clientX - bounds.left) / this.renderer.domElement.clientWidth) * 2 - 1,
            y: -((event.clientY - bounds.top) / this.renderer.domElement.clientHeight) * 2 + 1
        };
    }

    onMouseUp = (event) => {
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
            console.log(data.coordinates);
        }
        else {
            this.selectionGlow.visible = false;
            this.selectedHex = null;
        }
    }

    componentWillUnmount() {
        this.stop();
        this.mount.current.removeChild(this.renderer.domElement);
    }

    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    }

    stop = () => {
        cancelAnimationFrame(this.frameId);
    }

    animate = () => {
        this.controls.enabled = this.props.inFocus;
        this.controls.update();
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.animate)
    }

    renderScene = () => {
        this.renderer.render(this.scene, this.camera);
    }

    render() {
        return(
            <div
                className="col-md-8 mapviewport"
                tabIndex={1}
                onClick={() => this.props.setFocus('map')}
                onBlur={() => console.log('blur')}
                onFocus={() => console.log('focus')}
                >
                <div className="three-canvas" ref={this.mount}></div>
            </div>
        );
    }
};

export default MapViewport;
