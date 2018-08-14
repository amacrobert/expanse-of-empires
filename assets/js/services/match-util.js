import _ from 'underscore';

const getPhase = (match) => {
    const now = new Date();

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
        return 'non-play-combat';
    }

    if (match.date_p2p <= now) {
        return 'expanse-of-empires';
    }

    throw 'Timeline is out of order';
};

const showStartPosition = (match, territory) => {
    return getPhase(match) === 'registration'
        && territory.starting_position
        && !territory.empire_id;
};

const getTerritory = (mapState, q, r) => {
    return _.findWhere(mapState, {q: q, r: r});
};

export default {
    getPhase,
    showStartPosition,
    getTerritory,
};
