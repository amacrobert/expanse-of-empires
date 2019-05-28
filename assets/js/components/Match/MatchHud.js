import React from 'react';
import MatchUtil from '../../services/match-util';
import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
class MatchHud extends React.Component {

    render() {

        const phase = MatchUtil.getPhase(this.props.matchStore.match);
        const empireList = this.props.matchStore.empires.map(empire => (
            <p key={empire.id}>{empire.username} ({empire.territory_count})</p>
        ));
        const userEmpire = this.props.matchStore.userEmpire;

        const supply = <p>Supply: {Math.floor(this.props.matchStore.supply)}</p>;
        const tide = <p>Tide: {Math.floor(this.props.matchStore.tide)}</p>;

        return (
            <div className="match-hud match-hud-left">
                <p>Phase: {phase}</p>
                <hr />
                {userEmpire && supply}
                {userEmpire && tide}
                <hr />
                {empireList}
            </div>
        );
    }
}

export default MatchHud;
