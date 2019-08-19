import React from 'react';
import MapUtil from '../../services/map-util';
import GraphicsUtil from '../../services/graphics-util';
import MatchUtil from '../../services/match-util';
import Animation from '../../services/animation';
import { reaction } from 'mobx';
const THREE = require('three');
const assets = new GraphicsUtil();

require('../../three/controls/OrbitControls.js');
const Stats = require('../../extra/stats.min.js');

import { observer, inject } from 'mobx-react';

@inject('matchStore', 'uiStore')
@observer
class MapViewport extends React.Component {

    constructor(props) {
        super(props);
        this.animationsObjects = [];

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

    lookAtTerritory = (q, r, duration = null) => {
        let {x, z} = MapUtil.axialToReal(q, r);

        if (duration) {
            Animation.animateVector(this.camera, this.camera.position, new THREE.Vector3(x, 20, z + 20), duration);
            Animation.animateVector(this.controls, this.controls.target, new THREE.Vector3(x, 0, z), duration);
        }
        else {
            this.camera.position.set(x, 20, z + 20);
            this.controls.target.set(x, 0, z);
        }
    }

    componentDidMount() {
        console.log('AAA:', Animation.animateVector);
        const phase = MatchUtil.getPhase(this.props.matchStore.match);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.shadowMapEnabled = true;
        this.renderer.showMapType = THREE.PCFSoftShadowMap;

        this.mount.current.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.mount.current.offsetWidth, this.mount.current.offsetHeight);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(20, this.mount.current.offsetWidth / this.mount.current.offsetHeight, 1, 200);
        this.camera.position.set(0, 90, 90);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.scene.add(this.camera);

        // @TODO: move actions to prop function handled in Match.js
        window.addEventListener('keydown', this.onKeyDown, false);

        // selection glow
        this.selectionGlow = new THREE.Mesh(
            new THREE.SphereGeometry(1, 6, 10),
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.25,
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
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, 1));
        // var sun = new THREE.PointLight(0xFFFFFF, 1, 150, 1);
        // sun.castShadow = true;
        // sun.position.x = 0;
        // sun.position.y = 50;
        // sun.position.z = 0;
        // this.scene.add(sun);
        var sun = new THREE.DirectionalLight(0xFFFFFF, .5);
        sun.position.set(20, 10, -10);
        sun.shadow.mapSize.width = 2048;  // default
        sun.shadow.mapSize.height = 2048; // default
        sun.shadow.camera.near = 0.0;    // default
        sun.shadow.camera.far = 500;     // default
        sun.shadow.camera.left = -30;
        sun.shadow.camera.bottom = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.castShadow = true;

        // sun.target.position.set(100, 0, 100);
        this.scene.add(sun);

        // fog
        var skyColor = new THREE.Color(0x4E5D6C);
        this.scene.fog = new THREE.Fog(skyColor, 50, 200);
        this.scene.background = skyColor;

        // create hex tiles
        Object.keys(this.props.matchStore.territoriesById).forEach(territoryId => {

            let territory = this.props.matchStore.territoriesById[territoryId];

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

        // put camera on user's capital
        let { userEmpire } = this.props.matchStore;
        if (userEmpire && userEmpire.capital) {
            this.lookAtTerritory(userEmpire.capital.q, userEmpire.capital.r);
        }

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
    };

    getHexByTerritoryId = (id) => {
        let territory = this.props.matchStore.territoriesById[id];
        if (territory) {
            return this.getHex(territory.q, territory.r);
        }
    }

    componentWillUnmount() {
        this.stop();
        if (this.renderer) {
            this.mount.current.removeChild(this.renderer.domElement);
        }
        document.body.removeChild(this.stats.dom);

        window.removeEventListener('keydown', this.onKeyDown, false);
        window.removeEventListener('resize', this.onWindowResize, false);
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
            console.log('hex:', intersects[0].object);
            // Send selected territory coordinates up
            this.props.onTerritorySelect(this.selectedHex.userData.coordinates);
        }
        else {
            // unset selected territory
            this.props.onTerritorySelect(null);
        }
    };

    onMouseMove = (event) => {
        this.props.uiStore.mouse.x = event.clientX;
        this.props.uiStore.mouse.y = event.clientY;

        let bounds = this.mount.current.getBoundingClientRect();
        let element = this.renderer.domElement;
        this.mouse.hover = assets.mouseToReal(bounds, element, event.clientX, event.clientY);

        this.raycaster.setFromCamera(this.mouse.hover, this.camera);
        let intersects = this.raycaster.intersectObjects(this.targetList);

        if (intersects.length) {
            // only update if hovering over a new hex
            if (intersects[0].object != this.hoveredHex) {
                this.hoveredHex = intersects[0].object;
                assets.setHoverOutline(this.hoveredHex.userData.coordinates);

                // Send up the hovering territory coordinates
                this.props.onTerritoryHover(this.hoveredHex.userData.coordinates);
            }
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

    onKeyDown = (e) => {

        // Deselect territory
        if (e.keyCode == 27) {
            if (this.props.matchStore.selectedUnits > 0) {
                this.props.matchStore.setSelectedUnits(0);
            }
            else {
                this.props.matchStore.setSelectedTerritory(null);
            }
        }

        // Select units with 1-5 keys
        if (49 <= e.keyCode && e.keyCode <= 53) {
            let selection = e.keyCode - 48;
            this.props.matchStore.setSelectedUnits(selection);
        }

        // ` selects all units
        if (e.keyCode === 192) {
            this.props.matchStore.selectAllUnits();
        }
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

    animate = (time) => {

        this.stats.begin();

        this.controls.enabled = this.props.inFocus;
        this.controls.update();
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.animate);
        Animation.update(time);

        this.stats.end();
    };

    renderScene = () => {
        this.renderer.render(this.scene, this.camera);
    };

    updateScene = () => {

        let {actionQueue} = this.props.uiStore;

        while (actionQueue.length) {
            console.log('Reading action queue');
            let action = actionQueue.pop();

            switch (action.action) {
                case 'units-moved':
                    let armyKey = action.empire_id;
                    let unitsMoved = action.units_moved;
                    let fromHex = this.getHexByTerritoryId(action.from_id);
                    let toHex = this.getHexByTerritoryId(action.to_id);
                    let fromArmyModels = fromHex.userData.graphics.armies[armyKey].unitModels;
                    if (!toHex.userData.graphics.armies[armyKey]) {
                        toHex.userData.graphics.armies[armyKey] = {unitModels: []}
                    }
                    let toArmyModels = toHex.userData.graphics.armies[armyKey].unitModels;

                    for (var i = 0; i < action.units_moved; i++) {
                        toArmyModels.unshift(fromArmyModels.pop());
                    }

                    Animation.arrangeUnits(fromHex, 500);
                    Animation.arrangeUnits(toHex, 1500);

                    break;

                default:
                    break;
            }
        }

        // iterate territories and determine if any graphics elements need to be updated
        Object.keys(this.props.matchStore.territoriesById).forEach(territoryId => {

            let territory = this.props.matchStore.territoriesById[territoryId];
            const q = territory.q;
            const r = territory.r;
            let hex = this.getHex(q, r);

            if (hex) {
                // Add graphics object to userData if none exists
                if (!hex.userData.graphics) {
                    hex.userData.graphics = {
                        borders: {},
                        building: null,
                        armies: {},
                    };
                }
                let borderMeshUpdated = false;
                let graphics = hex.userData.graphics;

                let empireColor = territory.empire ? territory.empire.color : '777777';

                // Delete starting position sprite
                if (!MatchUtil.showStartPosition(this.props.matchStore.match, territory)
                    && graphics.startingPositionSprite
                ) {
                    console.debug('Removing starting position sprite from territory ' + territory.id);
                    this.scene.remove(graphics.startingPositionSprite);
                    delete graphics.startingPositionSprite;

                    this.scene.remove(graphics.simpleShadow);
                    delete graphics.simpleShadow;
                }
                // Add starting position sprite
                else if (MatchUtil.showStartPosition(this.props.matchStore.match, territory)
                    && !graphics.startingPositionSprite
                ) {
                    console.debug('Adding starting position sprite to territory ' + territory.id);
                    assets.getSprite('startingPosition', territory.q, territory.r).then(sprite => {
                        graphics.startingPositionSprite = sprite;
                        this.scene.add(sprite);

                        let simpleShadow = assets.getSimpleShadow(territory);
                        graphics.simpleShadow = simpleShadow;
                        this.scene.add(simpleShadow);
                    });
                }

                // BORDERS
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
                            this.props.matchStore.territoriesByAxial,
                            borderingHex.userData.coordinates.q,
                            borderingHex.userData.coordinates.r
                        );
                    }

                    let bordersMatch = (borderingTerritory && borderingTerritory.empire_id == territory.empire_id);

                    // Add missing border sections
                    if (territory.empire_id && (!borderingHex || !bordersMatch)) {
                        if (!graphics.borders[rotation]) {
                            console.debug('Adding ' + rotation + ' border to territory ' + territory.id);
                            let newBorderSection = assets.getBorderSectionMesh(territory, rotation);
                            graphics.borders[rotation] = newBorderSection;
                            borderMeshUpdated = true;
                        }
                    }

                    // Remove border sections that shouldn't exist anymore
                    if (!territory.empire_id || (territory.empire_id && bordersMatch)) {
                        if (graphics.borders[rotation]) {
                            console.debug('Removing ' + rotation + ' border from territory ' + territory.id)
                            delete graphics.borders[rotation];
                            borderMeshUpdated = true;
                        }
                    }
                });

                // Remove old border mesh if it was updated
                if (borderMeshUpdated) {
                    if (graphics.borderMerged) {
                        console.debug('Removing border mesh from territory ' + territory.id);
                        this.scene.remove(graphics.borderMerged);
                        delete graphics.borderMerged;
                    }
                }

                // merge border meshes and add to scene
                if (Object.keys(graphics.borders).length && !graphics.borderMerged) {
                    var borderMergedGeo = new THREE.Geometry();

                    Object.keys(graphics.borders).forEach(key => {
                        let borderMesh = graphics.borders[key];
                        borderMergedGeo.merge(borderMesh.geometry, borderMesh.matrix);
                    });

                    var borderMerged = new THREE.Mesh(
                        borderMergedGeo,
                        new THREE.MeshPhongMaterial({ color: parseInt(empireColor, 16) })
                    );

                    console.debug('Adding border mesh to territory ' + territory.id);
                    graphics.borderMerged = borderMerged;
                    this.scene.add(borderMerged);
                }

                // update border mesh color if needed
                let borderColor = graphics.borderMerged ? graphics.borderMerged.material.color.getHexString() : null;
                if (borderColor && borderColor != empireColor) {
                    console.log('Updating border mesh color from ' + graphics.borderMerged.material.color.getHexString() + ' to ' + empireColor);
                    graphics.borderMerged.material.color.setHex(parseInt(empireColor, 16));
                }

                // BUILDINGS
                // Add or replace building if it's missing
                let buildingName = territory.building ? territory.building.machine_name : null;

                if (territory.building
                    && (!graphics.building || graphics.building.name !== buildingName)
                ) {
                    // Remove building to be replaced
                    if (graphics.building) {
                        console.debug('Replacing building ' + graphics.building.name.toUpperCase() + ' from territory ' + territody.id);
                        this.scene.remove(graphics.building);
                        delete graphics.building;
                    }

                    // Place a building
                    assets.getBuilding(buildingName, q, r).then(building => {
                        console.debug('Adding building ' + building.name.toUpperCase() + ' to territory ' + territory.id);
                        graphics.building = building;
                        this.scene.add(building);

                        // arrange units after building load in case this happens after initial unit placement
                        Animation.arrangeUnits(hex);
                    })
                }
                // Remove destroyed building
                else if (!territory.building && graphics.building) {
                    console.debug('Removing building ' + graphics.building.name.toUpperCase() + ' from territory ' + territory.id);
                    this.scene.remove(graphics.building);
                    delete graphics.building;
                }

                // UNITS
                if (territory.armies) {
                    territory.armies.forEach(army => {

                        let armyKey = army.empire_id ? army.empire_id : 'npc';

                        if (!graphics.armies[armyKey]) {
                            graphics.armies[armyKey] = {
                                unitModels: [],
                            };
                        }

                        let renderedUnitCount = graphics.armies[armyKey].unitModels.length;

                        // Add missing units
                        if (army.size > renderedUnitCount) {

                            for (var i = 0; i < army.size; i++) {

                                if ((i + 1) > renderedUnitCount) {
                                    console.log('ADDING UNIT');
                                    let model = assets.getUnitModel(empireColor);
                                    this.scene.add(model);
                                    graphics.armies[armyKey].unitModels[i] = model;
                                }
                            }

                            Animation.arrangeUnits(hex, 500);
                        }

                        // Remove units
                        if (army.size < renderedUnitCount) {

                            for (var i = 0; i < renderedUnitCount; i++) {

                                if ((i + 1) > army.size) {
                                    console.log('REMOVING UNIT');
                                    let model = graphics.armies[armyKey].unitModels.pop();
                                    this.scene.remove(model);
                                }
                            }

                            Animation.arrangeUnits(hex, 500);
                        }
                    });
                }
            }
        });
    };

    // Update the scene when the map state changes
    reactToSceneUpdate = reaction(
        () => this.props.matchStore.territories,
        this.updateScene
    );

    reactToEmpireUpdate = reaction(
        () => (this.props.matchStore.empires && this.props.matchStore.empires),
        () => {
            if (this.props.matchStore.territories) {
                this.updateScene();
            }
        }
    );

    // Update selection glow when selection changes
    reactToSelectionChange = reaction(
        () => {
            let matchStore = this.props.matchStore;
            return matchStore.selectedTerritory;
        },
        () => {
            let territory = this.props.matchStore.selectedTerritory;

            if (territory) {
                let realCoordinates = MapUtil.axialToReal(territory.coordinates.q, territory.coordinates.r);
                this.selectionGlow.position.x = realCoordinates.x;
                this.selectionGlow.position.z = realCoordinates.z;
                this.selectionGlow.visible = true;
            }
            else {
                this.selectionGlow.visible = false;
            }
        }
    );

    // Update the movement path when it changes
    reactToPathChange = reaction(
        () => {
            let matchStore = this.props.matchStore;
            return matchStore.path && matchStore.path.nodes.slice();
        },
        () => {
            let path = this.props.matchStore.path;

            // remove old path
            if (this.scenePath) {
                this.scene.remove(this.scenePath);
                delete this.scenePath;
            }

            if (path.nodes.length) {
                let color;
                if (path.type == 'move') {
                    color = 0x5555FF;
                }
                else if (path.type == 'attack') {
                    color = 0xFF5555;
                }

                let pathMaterial = new THREE.LineBasicMaterial({color});
                let pathGeometry = new THREE.Geometry();
                path.nodes.forEach(node => {
                    let real = MapUtil.axialToReal(node.q, node.r);
                    pathGeometry.vertices.push(new THREE.Vector3(real.x, 0.03, real.z));
                });

                this.scenePath = new THREE.Line(pathGeometry, pathMaterial);
                this.scene.add(this.scenePath);
            }
        }
    );

    // Move the camera when cameraTargetTerritory changes
    reactToCameraTargetChange = reaction(
        () => this.props.uiStore.cameraTargetTerritory,
        () => {
            let territory = this.props.uiStore.cameraTargetTerritory;

            if (territory) {
                let {q, r} = this.props.uiStore.cameraTargetTerritory;
                this.lookAtTerritory(q, r, 500);
                this.props.uiStore.clearCameraTarget();
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
