const TWEEN = require('@tweenjs/tween.js');
const THREE = require('three');
import MapUtil from './map-util';
import { getHexByTerritoryId } from './graphics-util';

const animateVector = (model, fromVector, toVector, duration = 500) => {
    if (!model.userData) {
        model.userData = {};
    }

    if (model.userData.tween) {
        model.userData.tween.stop();
        model.userData.tween = null;
    }

    model.userData.tween = new TWEEN.Tween(fromVector)
        .to(toVector, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
};

const update = (time) => TWEEN.update(time);

const animateUnitMovement = (unitModels, path, hexes, territoriesById) => {
    let territoryId = path.shift();
    let territory = territoriesById[territoryId];
    let lastTerritoryId = path[path.length - 1];
    let lastHex = getHexByTerritoryId(hexes, territoriesById, lastTerritoryId);
    let {q, r} = territory;
    let {x, z} = MapUtil.axialToReal(q, r);

    arrangeUnits(getHexByTerritoryId(hexes, territoriesById, territoryId));

    if (path.length == 1) {
        arrangeUnits(lastHex);
        return;
    }

    let i = 0;

    unitModels.forEach(unitModel => {
        let offsetX = unitModel.position.x - x;
        let offsetZ = unitModel.position.z - z;

        let tween = animateSingleUnitMovement(unitModel, path.slice(), offsetX, offsetZ, territoriesById, i, lastHex);
        unitModel.userData.tween = tween;
        tween.start();
        i++;
    });
};

const animateSingleUnitMovement = (unitModel, path, offsetX, offsetZ, territoriesById, i, lastHex) => {
    let territoryId = path.shift();
    let territory = territoriesById[territoryId];
    let {q, r} = territory;
    let {x, z} = MapUtil.axialToReal(q, r);

    let toVector = new THREE.Vector3(
        x + offsetX,
        unitModel.position.y,
        z + offsetZ,
    );

    let tween = new TWEEN.Tween(unitModel.position).to(toVector, 100);
    if (path.length > 1) {
        tween.chain(animateSingleUnitMovement(unitModel, path, offsetX, offsetZ, territoriesById, i, lastHex));
    }
    else {
        if (i == 0) {
            tween.onComplete(() => {
                arrangeUnits(lastHex);
            });
        }
    }

    return tween;
};

// arrange the unit models in a territory
const arrangeUnits = (hex, duration = 500) => {
    let hexGraphics = hex.userData.graphics;
    let realCoords = MapUtil.axialToReal(hex.userData.coordinates.q, hex.userData.coordinates.r);
    let self = this;

    Object.keys(hexGraphics.armies).forEach(armyKey => {

        let army = hexGraphics.armies[armyKey];
        let armySize = army.unitModels.length;

        if (armySize) {

            // territory has building -- render army in circle surrounding it
            if (hexGraphics.building) {

                let radius = .5;
                let innerCircleLimit = 20;
                let innerCircleUnits = Math.min(innerCircleLimit, armySize);
                let outerCircleUnits = armySize - innerCircleUnits;
                let spacing = 2 * Math.PI / innerCircleUnits;


                for (var i = 0; i < armySize; i++) {
                    let model = army.unitModels[i];

                    if (i >= innerCircleUnits) {
                        radius = .7;
                        spacing = 2 * Math.PI / outerCircleUnits;
                    }

                    let newX = realCoords.x + (radius * Math.cos(i * spacing));
                    let newZ = realCoords.z + (radius * Math.sin(i * spacing));

                    animateUnitRearrangement(model, newX, newZ, realCoords.x, realCoords.z, duration);
                }
            }
            // No building -- render army in grid
            else {
                let armyWidth = Math.ceil(Math.sqrt(armySize));
                let armyDepth = Math.ceil(armySize / armyWidth);
                let spacing = 0.15;

                for (var i = 0; i < armySize; i++) {

                    let model = army.unitModels[i];
                    let row = Math.ceil((i + 1) / armyWidth);
                    let col = i % armyWidth;

                    let newX = realCoords.x + (col * spacing) - (spacing * armyWidth / 2) - (spacing * 0.5 * (row % 2)) + spacing;
                    let newZ = realCoords.z - (row * spacing) + (spacing * armyDepth / 2) + (spacing / 2);

                    animateUnitRearrangement(model, newX, newZ, realCoords.x, realCoords.z, duration);
                }
            }
        }
    });
};

const animateUnitRearrangement = (model, newX, newZ, defaultX, defaultZ, duration = 500) => {

    let currentX = model.position.x;
    let currentZ = model.position.z;

    if (!currentX && !currentZ) {
        model.position.x = defaultX;
        model.position.z = defaultZ;
        currentX = defaultX;
        currentZ = defaultZ;
    }

    // animate rearrangement
    if (newX != currentX || newZ != currentZ) {
        Animation.animateVector(model, model.position, new THREE.Vector3(newX, model.position.y, newZ), duration);
    }
    else {
        model.position.x = newX;
        model.position.z = newZ;
    }
};

const Animation = {
    animateVector,
    arrangeUnits,
    animateUnitMovement,
    update,
};

export default Animation;
