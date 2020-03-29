const THREE = require('three');
import MatchUtil from './match-util';
import { getHex } from './graphics-util';
import Animation from './animation';

const startingPositionSprites = (scene, hex, match, territory) => {
    let graphics = hex.userData.graphics;

    // Delete starting position sprite
    if (!MatchUtil.showStartPosition(match, territory)
        && graphics.startingPositionSprite
    ) {
        console.debug('Removing starting position sprite from territory ' + territory.id);
        scene.remove(graphics.startingPositionSprite);
        delete graphics.startingPositionSprite;

        scene.remove(graphics.simpleShadow);
        delete graphics.simpleShadow;
    }
    // Add starting position sprite
    else if (MatchUtil.showStartPosition(match, territory)
        && !graphics.startingPositionSprite
    ) {
        console.debug('Adding starting position sprite to territory ' + territory.id);
        assets.getSprite('startingPosition', territory.q, territory.r).then(sprite => {
            graphics.startingPositionSprite = sprite;
            scene.add(sprite);

            let simpleShadow = assets.getSimpleShadow(territory);
            graphics.simpleShadow = simpleShadow;
            scene.add(simpleShadow);
        });
    }
}

const borders = (scene, hex, territory, hexes, territoriesByAxial, getBorderSectionMesh, empireColor) => {
    let graphics = hex.userData.graphics;
    let borderMeshUpdated = false;
    let {q, r} = territory;

    let borderingHexes = {
        left: getHex(hexes, q - 1, r),
        topLeft: getHex(hexes, q, r - 1),
        topRight: getHex(hexes, q + 1, r - 1),
        right: getHex(hexes, q + 1, r),
        bottomRight: getHex(hexes, q, r + 1),
        bottomLeft: getHex(hexes, q - 1, r + 1),
    };


    Object.keys(borderingHexes).forEach((rotation) => {
        let borderingHex = borderingHexes[rotation];
        let borderingTerritory;

        if (borderingHex) {
            borderingTerritory = MatchUtil.getTerritory(
                territoriesByAxial,
                borderingHex.userData.coordinates.q,
                borderingHex.userData.coordinates.r
            );
        }

        let bordersMatch = (borderingTerritory && borderingTerritory.empire_id == territory.empire_id);

        // Add missing border sections
        if (territory.empire_id && (!borderingHex || !bordersMatch)) {
            if (!graphics.borders[rotation]) {
                console.debug('Adding ' + rotation + ' border to territory ' + territory.id);
                let newBorderSection = getBorderSectionMesh(territory, rotation);
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
            scene.remove(graphics.borderMerged);
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
        scene.add(borderMerged);
    }

    // update border mesh color if needed
    let borderColor = graphics.borderMerged ? graphics.borderMerged.material.color.getHexString() : null;
    if (borderColor && borderColor != empireColor) {
        console.log('Updating border mesh color from ' + graphics.borderMerged.material.color.getHexString() + ' to ' + empireColor);
        graphics.borderMerged.material.color.setHex(parseInt(empireColor, 16));
    }
};

const buildings = (scene, hex, territory, assets) => {
    let graphics = hex.userData.graphics;
    let {q, r} = territory;
    let buildingName = territory.building ? territory.building.machine_name : null;

    // Add or replace building if it's missing
    if (territory.building
        && (!graphics.building || graphics.building.name !== buildingName)
    ) {
        // Remove building to be replaced
        if (graphics.building) {
            console.debug('Replacing building ' + graphics.building.name.toUpperCase() + ' from territory ' + territody.id);
            scene.remove(graphics.building);
            delete graphics.building;
        }

        // Place a building
        assets.getBuilding(buildingName, q, r).then(building => {
            console.debug('Adding building ' + building.name.toUpperCase() + ' to territory ' + territory.id);
            graphics.building = building;
            scene.add(building);

            // arrange units after building load in case this happens after initial unit placement
            Animation.arrangeUnits(hex);
        })
    }
    // Remove destroyed building
    else if (!territory.building && graphics.building) {
        console.debug('Removing building ' + graphics.building.name.toUpperCase() + ' from territory ' + territory.id);
        scene.remove(graphics.building);
        delete graphics.building;
    }
};

const units = (scene, hex, territory, assets, empireColor) => {
    let graphics = hex.userData.graphics;

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
                        scene.add(model);
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
                        scene.remove(model);
                    }
                }

                Animation.arrangeUnits(hex, 500);
            }
        });
    }
}

const support = (scene, hex, territory, assets) => {
    let graphics = hex.userData.graphics;

    if (!graphics.support || territory.support != graphics.support) {
        hex.material = assets.hexMaterials[+territory.support];
        graphics.support = territory.support;
    }
}


export default {
    startingPositionSprites,
    borders,
    buildings,
    units,
    support,
};
