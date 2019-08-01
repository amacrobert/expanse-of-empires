import React from 'react';
import MatchUtil from '../../services/match-util';
import { observer, inject } from 'mobx-react';

@inject('matchStore', 'uiStore')
@observer
class MatchHud extends React.Component {

    render() {

        const phase = MatchUtil.getPhase(this.props.matchStore.match);
        const empireList = this.props.matchStore.empires.map(empire => (
            <p key={empire.id}>{empire.username} ({empire.territory_count})</p>
        ));
        const { userEmpire, supply, tide } = this.props.matchStore;

        const supplyOutput = (
            <div>
                Supply: {Math.floor(supply)}
            </div>
        );

        const tideOutput = (
            <div>
                Tide: {Math.floor(tide)}
            </div>
        );

        return (
            <div className="match-hud match-hud-left">
                <p>Phase: {phase}</p>
                <hr />
                {userEmpire && supplyOutput}
                {userEmpire && tideOutput}
                <hr />
                {empireList}
            </div>
        );
    }
}

export default MatchHud;
