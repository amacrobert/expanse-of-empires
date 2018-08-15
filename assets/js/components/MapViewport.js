import React from 'react';
import MapUtil from '../services/map-util';
import GraphicsUtil from '../services/graphics-util';
import MatchUtil from '../services/match-util';

const THREE = require('three');
require('../three/controls/OrbitControls.js');
require('../three/loaders/MTLLoader.js');
require('../three/loaders/OBJLoader.js');

class MapViewport extends React.Component {

    constructor(props) {
        super(props);

        this.mount = new React.createRef();

        this.hexes = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.targetList = [];
        this.inFocus = true;
    }

    componentDidMount() {
        const phase = MatchUtil.getPhase(this.props.match);

        this.renderer = new THREE.WebGLRenderer({ antialias: true});
        this.mount.current.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, this.mount.current.offsetWidth / this.mount.current.offsetHeight, .1, 200);
        this.camera.position.set(0, 40, 20);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.scene.add(this.camera);

        // selection glow
        this.selectionGlow = new THREE.Mesh(
            new THREE.SphereGeometry(.98, 6, 10),
            new THREE.MeshPhongMaterial({color: 0xFFFFFF, transparent: true, opacity: 0.5, depthWrite: false})
        );
        this.selectionGlow.rotation.y = Math.PI / 6;
        this.selectionGlow.scale.y = 2;
        this.selectionGlow.visible = false;
        this.scene.add(this.selectionGlow);

        // Load the hover outline
        this.scene.add(GraphicsUtil.getHoverOutline());

        // light
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, .5));

        var sun = new THREE.PointLight(0xFFFF77, 2, 50, 1);
        sun.position.x = 0;
        sun.position.y = 40;
        sun.position.z = 0;
        this.scene.add(sun);

        // fog
        var skyColor = new THREE.Color(0x4E5D6C);
        this.scene.fog = new THREE.Fog(skyColor, 50, 200);
        this.scene.background = skyColor;

        // hex grid
        this.props.map.state.forEach(territory => {
            let q = territory.q;
            let r = territory.r;
            let hexMesh = GraphicsUtil.getHexMesh(territory);
            this.targetList.push(hexMesh);
            this.scene.add(hexMesh);

            hexMesh.userData.coordinates = {q: q, r: r};

            this.addHex(hexMesh, q, r);
        });

        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);

        this.start();
    }

    addHex = (hexMesh, q, r) => {
        if (this.hexes[q] == null) {
            this.hexes[q] = {};
        }

        this.hexes[q][r] = hexMesh;
    };

    getHex = (q, r) => {
        if (this.hexes[q] == null || this.hexes[q][r] == null) {
            return null;
        }

        return this.hexes[q][r];
    }

    componentWillUnmount() {
        this.stop();
        this.mount.current.removeChild(this.renderer.domElement);
    }

    onMouseDown = (event) => {
        let bounds = this.mount.current.getBoundingClientRect();
        let element = this.renderer.domElement;
        this.mouse.down = GraphicsUtil.mouseToReal(bounds, element, event.clientX, event.clientY);
    };

    onMouseUp = (event) => {
        let bounds = this.mount.current.getBoundingClientRect();
        let element = this.renderer.domElement;
        this.mouse.up = GraphicsUtil.mouseToReal(bounds, element, event.clientX, event.clientY);

        // Only register hex click if mouse up in in same position as mouse down
        if (JSON.stringify(this.mouse.down) != JSON.stringify(this.mouse.up)) {
            return;
        }

        this.raycaster.setFromCamera(this.mouse.down, this.camera);
        let intersects = this.raycaster.intersectObjects(this.targetList);

        // if there is one (or more) intersections
        if (intersects.length) {
            this.selectedHex = intersects[0].object;

            // Move selection glow
            this.selectionGlow.visible = true;
            var hexPosition = new THREE.Vector3();
            this.selectedHex.getWorldPosition(hexPosition);
            this.selectionGlow.position.x = hexPosition.x;
            this.selectionGlow.position.z = hexPosition.z;
            var data = this.selectedHex.userData;

            // Send selected territory coordinates up
            this.props.onTerritorySelect(data.coordinates);
        }
        else {
            this.selectionGlow.visible = false;
            this.selectedHex = null;

            // unset selected territory
            this.props.onTerritorySelect(null);
        }
    };

    onMouseMove = (event) => {
        let bounds = this.mount.current.getBoundingClientRect();
        let element = this.renderer.domElement;
        this.mouse.hover = GraphicsUtil.mouseToReal(bounds, element, event.clientX, event.clientY);

        this.raycaster.setFromCamera(this.mouse.hover, this.camera);
        let intersects = this.raycaster.intersectObjects(this.targetList);

        if (intersects.length) {
            this.hoveredHex = intersects[0].object;
            GraphicsUtil.setHoverOutline(this.hoveredHex.userData.coordinates);
        }
        else {
            GraphicsUtil.setHoverOutline(null);
        }
    };

    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    };

    stop = () => {
        cancelAnimationFrame(this.frameId);
    };

    animate = () => {

        this.updateScene();

        this.controls.enabled = this.props.inFocus;
        this.controls.update();
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.animate);
    };

    renderScene = () => {
        this.renderer.render(this.scene, this.camera);
    };

    updateScene = () => {
        // iterate territories and determine if any graphics elements need to be updated
        this.props.map.state.forEach(territory => {
            const q = territory.q;
            const r = territory.r;
            const hex = this.getHex(q, r);

            if (hex) {

                // Add graphics object to userData if none exists
                if (!hex.userData.graphics) {
                    hex.userData.graphics = {
                        borders: {},
                    };
                }

                // Delete starting position sprite
                if (!MatchUtil.showStartPosition(this.props.match, territory)
                    && hex.userData.graphics.startingPositionSprite
                ) {
                    console.log('REMOVING STARTING POSITION SPRITE');
                    this.scene.remove(hex.userData.graphics.startingPositionSprite);
                    hex.userData.graphics.startingPositionSprite = null;
                }
                // Add starting position sprite
                else if (MatchUtil.showStartPosition(this.props.match, territory)
                    && !hex.userData.graphics.startingPositionSprite
                ) {
                    console.log('ADDING STARTING POSITION SPRITE');
                    GraphicsUtil.getSprite('startingPosition', territory.q, territory.r).then(sprite => {
                        hex.userData.graphics.startingPositionSprite = sprite;
                        this.scene.add(sprite);
                    });
                }

                // BORDERS
                if (territory.empire_id) {
                    let borderingHexes = {
                        left: this.getHex(q - 1, r),
                        topLeft: this.getHex(q, r - 1),
                        topRight: this.getHex(q + 1, r - 1),
                        right: this.getHex(q + 1, r),
                        bottomRight: this.getHex(q, r + 1),
                        bottomLeft: this.getHex(q - 1, r + 1),
                    };

                    Object.keys(borderingHexes).forEach((rotation) => {
                        let borderingHex = borderingHexes[rotation];
                        let borderingTerritory;

                        if (borderingHex) {
                            borderingTerritory = MatchUtil.getTerritory(
                                this.props.map.state,
                                borderingHex.userData.coordinates.q,
                                borderingHex.userData.coordinates.r
                            );
                        }

                        // Add missing border sections
                        if (!borderingHex || borderingTerritory.empire_id !== territory.empire_id) {
                            if (!hex.userData.graphics.borders[rotation]) {
                                let newBorderSection = GraphicsUtil.getBorderSection(territory, rotation);
                                console.log('ADDING BORDER SECTION');
                                hex.userData.graphics.borders[rotation] = newBorderSection;
                                this.scene.add(newBorderSection);
                            }
                        }

                        // @TODO: Remove border sections that sould no longer exist
                        // Note: need to check for territories that don't have empire id
                    });
                }
            }
        });
    };

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
