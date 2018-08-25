import React from 'react';
import MatchUtil from '../services/match-util';

export default class MatchInfo extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const phase = MatchUtil.getPhase(this.props.match);

        const empireList = Object.values(this.props.empires).map(empire => (
            <p>{empire.username} ({empire.territory_count})</p>
        ));

        return (
            <div className="match-hud match-hud-left">
                <p>Phase: {phase}</p>
                <p>{MatchUtil.getPhaseDescriptor(phase)}</p>
                <hr />
                {empireList}
            </div>
        );
    }
}
