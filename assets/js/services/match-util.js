import _ from 'underscore';

const getPhase = (match) => {
    const now = new Date();

    if (!match) return null;

    if (match.completed || match.date_completed) {
        return 'completed';
    }

    if (now < match.date_registration) {
        return 'pre-registration';
    }

    if (match.date_registration <= now && now < match.date_npc) {
        return 'registration';
    }

    if (match.date_npc <= now && now < match.date_p2p) {
        return 'non-player-combat';
    }

    if (match.date_p2p <= now) {
        return 'expanse-of-empires';
    }

    throw 'Timeline is out of order';
};

const getPhaseDescriptor = (phase) => {
    switch (phase) {
        case 'completed':
            return 'This match is completed. You may view it in its final state, but play is closed.';
        case 'pre-registration':
            return 'This match is not open for registration yet.';
        case 'registration':
            return 'Select one of the marked starting positions to start your empire!';
        case 'non-player-combat':
            return 'You may attack neighboring territories that do not belong to other players. You may not yet attack other players.';
        case 'expanse-of-empires':
            return 'Gameplay is in full effect. You may attack and be attacked by other players.';
        default:
            throw 'Unrecognized phase';
    }
}

const showStartPosition = (match, territory) => {
    return getPhase(match) === 'registration'
        && territory.starting_position
        && !territory.empire_id;
};

const getTerritory = (territoriesByAxial, q, r) => {

    if (!territoriesByAxial[q] || !territoriesByAxial[q][r]) {
        return null;
    }

    return territoriesByAxial[q][r];
};

const getBorderingTerritories = (territoriesByAxial, territory) => {
    let q = territory.coordinates.q;
    let r = territory.coordinates.r;

    return [
        getTerritory(territoriesByAxial, q - 1, r),
        getTerritory(territoriesByAxial, q, r - 1),
        getTerritory(territoriesByAxial, q + 1, r - 1),
        getTerritory(territoriesByAxial, q + 1, r),
        getTerritory(territoriesByAxial, q, r + 1),
        getTerritory(territoriesByAxial, q - 1, r + 1),
    ];
};

export default {
    getPhase,
    showStartPosition,
    getTerritory,
    getPhaseDescriptor,
    getBorderingTerritories,
};
