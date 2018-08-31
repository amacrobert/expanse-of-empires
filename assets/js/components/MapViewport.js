import React from 'react';
import MapUtil from '../services/map-util';
import GraphicsUtil from '../services/graphics-util';
import MatchUtil from '../services/match-util';
import { reaction } from 'mobx';
const THREE = require('three');
const assets = new GraphicsUtil();

require('../three/controls/OrbitControls.js');
const Stats = require('../extra/stats.min.js');

import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
class MapViewport extends React.Component {

    constructor(props) {
        super(props);

        this.mount = new React.createRef();

        this.hexes = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.targetList = [];
        this.inFocus = true;

        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
    }

    componentDidMount() {
        const phase = MatchUtil.getPhase(this.props.matchStore.match);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.shadowMapEnabled = true;
        this.renderer.showMapType = THREE.PCFSoftShadowMap;

        this.mount.current.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, this.mount.current.offsetWidth / this.mount.current.offsetHeight, .1, 200);
        this.camera.position.set(0, 40, 20);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.scene.add(this.camera);

        // Deselect territory
        // @TODO: move to controls
        // @TODO: Make changes to selectionGlow as a mobx reaction to matchStore.selectedTerritory
        window.addEventListener('keydown', e => {
            if (e.keyCode == 27) {
                this.props.matchStore.setSelectedTerritory(null);
                this.selectionGlow.visible = false;
            }
        });

        // selection glow
        this.selectionGlow = new THREE.Mesh(
            new THREE.SphereGeometry(.98, 6, 10),
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.3,
                depthWrite: false,
            })
        );
        this.selectionGlow.castShadow = false;
        this.selectionGlow.rotation.y = Math.PI / 6;
        this.selectionGlow.scale.y = 1;
        this.selectionGlow.visible = false;
        this.scene.add(this.selectionGlow);

        // Load the hover outline
        this.scene.add(assets.getHoverOutline());

        // light
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, .5));
        var sun = new THREE.PointLight(0xFFFFFF, 1, 150, 1);
        sun.castShadow = true;
        sun.position.x = 0;
        sun.position.y = 50;
        sun.position.z = 0;
        this.scene.add(sun);

        // fog
        var skyColor = new THREE.Color(0x4E5D6C);
        this.scene.fog = new THREE.Fog(skyColor, 50, 200);
        this.scene.background = skyColor;

        // hex grid
        this.props.matchStore.map.state.forEach(territory => {
            let q = territory.q;
            let r = territory.r;
            let hexMesh = assets.getHexMesh(territory);
            this.targetList.push(hexMesh);
            this.scene.add(hexMesh);

            hexMesh.userData.coordinates = {q: q, r: r};

            this.addHex(hexMesh, q, r);
        });

        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('resize', this.onWindowResize, false);

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
        this.mouse.down = assets.mouseToReal(bounds, element, event.clientX, event.clientY);
    };

    onMouseUp = (event) => {
        let bounds = this.mount.current.getBoundingClientRect();
        let element = this.renderer.domElement;
        this.mouse.up = assets.mouseToReal(bounds, element, event.clientX, event.clientY);

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
        this.mouse.hover = assets.mouseToReal(bounds, element, event.clientX, event.clientY);

        this.raycaster.setFromCamera(this.mouse.hover, this.camera);
        let intersects = this.raycaster.intersectObjects(this.targetList);

        if (intersects.length) {
            this.hoveredHex = intersects[0].object;
            assets.setHoverOutline(this.hoveredHex.userData.coordinates);
        }
        else {
            assets.setHoverOutline(null);
        }
    };

    onWindowResize = () => {
        this.camera.aspect = this.mount.current.offsetWidth / this.mount.current.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
    };

    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
            this.updateScene();
        }
    };

    stop = () => {
        cancelAnimationFrame(this.frameId);
    };

    animate = () => {

        this.stats.begin();

        //this.updateScene();
        this.controls.enabled = this.props.inFocus;
        this.controls.update();
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.animate);

        this.stats.end();
    };

    renderScene = () => {
        this.renderer.render(this.scene, this.camera);
    };

    updateScene = () => {
        // iterate territories and determine if any graphics elements need to be updated
        this.props.matchStore.map.state.forEach(territory => {
            const q = territory.q;
            const r = territory.r;
            const hex = this.getHex(q, r);

            if (hex) {

                // Add graphics object to userData if none exists
                if (!hex.userData.graphics) {
                    hex.userData.graphics = {
                        borders: {},
                        building: null,
                    };
                }

                // Delete starting position sprite
                if (!MatchUtil.showStartPosition(this.props.matchStore.match, territory)
                    && hex.userData.graphics.startingPositionSprite
                ) {
                    console.log('REMOVING STARTING POSITION SPRITE');
                    this.scene.remove(hex.userData.graphics.startingPositionSprite);
                    hex.userData.graphics.startingPositionSprite = null;

                    this.scene.remove(hex.userData.graphics.simpleShadow);
                    hex.userData.graphics.simpleShadow = null;
                }
                // Add starting position sprite
                else if (MatchUtil.showStartPosition(this.props.matchStore.match, territory)
                    && !hex.userData.graphics.startingPositionSprite
                ) {
                    console.log('ADDING STARTING POSITION SPRITE');
                    assets.getSprite('startingPosition', territory.q, territory.r).then(sprite => {
                        hex.userData.graphics.startingPositionSprite = sprite;
                        this.scene.add(sprite);

                        let simpleShadow = assets.getSimpleShadow(territory);
                        hex.userData.graphics.simpleShadow = simpleShadow;
                        this.scene.add(simpleShadow);
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
                                this.props.matchStore.map.state,
                                borderingHex.userData.coordinates.q,
                                borderingHex.userData.coordinates.r
                            );
                        }

                        // Add missing border sections
                        if (!borderingHex || borderingTerritory.empire_id !== territory.empire_id) {
                            if (!hex.userData.graphics.borders[rotation]) {
                                let newBorderSection = assets.getBorderSectionMesh(territory, rotation);
                                console.log('ADDING BORDER SECTION');
                                hex.userData.graphics.borders[rotation] = newBorderSection;
                                //this.scene.add(newBorderSection);
                            }
                        }

                        // @TODO: Remove border sections that sould no longer exist
                        // Note: need to check for territories that don't have empire id
                    });

                    // merge border meshes and add to scene
                    if (hex.userData.graphics.borders && !hex.userData.graphics.borderMerged) {
                        var borderMergedGeo = new THREE.Geometry();

                        Object.keys(hex.userData.graphics.borders).forEach(key => {
                            let borderMesh = hex.userData.graphics.borders[key];
                            borderMergedGeo.merge(borderMesh.geometry, borderMesh.matrix);
                        });

                        var borderMerged = new THREE.Mesh(borderMergedGeo, assets.borderMaterial);
                        borderMerged.castShadow = true;
                        console.log('ADDING MERGED BORDER MESH');
                        hex.userData.graphics.borderMerged = borderMerged;
                        this.scene.add(borderMerged);

                    }
                }

                // BUILDINGS
                // Add or replace building if it's missing
                let buildingName = territory.building ? territory.building.machine_name : null;

                if (territory.building
                    && (!hex.userData.graphics.building || hex.userData.graphics.building.name !== buildingName)
                ) {

                    // Remove building to be replaced
                    if (hex.userData.graphics.building) {
                        console.log('REPLACING BUILDING: ' + building.name.toUpperCase());
                        this.scene.remove(hex.userData.graphics.building);
                        hex.userData.graphics.building = null;
                    }

                    assets.getBuilding(buildingName, q, r).then(building => {
                        console.log('ADDING BUILDING: ' + building.name.toUpperCase());
                        hex.userData.graphics.building = building;
                        this.scene.add(building);

                        // simple shadow
                        let buildingShadow = assets.getSimpleShadow(territory);
                        buildingShadow.scale.setScalar(2);
                        buildingShadow.opacity = 1;
                        hex.userData.graphics.simpleShadow = buildingShadow;
                        this.scene.add(buildingShadow);
                    })
                }
                // Remove destroyed building
                else if (!territory.building && hex.userData.graphics.building) {
                    console.log('REMOVING BUILDING: ' + building.name.toUpperCase());
                    this.scene.remove(hex.userData.graphics.building);
                    hex.userData.graphics.building = null;
                    this.scene.remove(hex.userData.graphics.simpleShadow);
                    hex.userData.graphics.simpleShadow = null;
                }
            }
        });
    };

    // Update the scene when the map state changes
    reactToSceneUpdate = reaction(
        () => {
            return this.props.matchStore.map.state && this.props.matchStore.map.state.slice()
        },
        () => {
            if (this.props.matchStore.map.state) {
                this.updateScene();
            }
        }
    );

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
