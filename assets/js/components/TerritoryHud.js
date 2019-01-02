import React from 'react';
import MatchUtil from '../services/match-util';
import { observer, inject } from 'mobx-react';

import Button from '@material-ui/core/Button';

@inject('matchStore', 'userStore')
@observer
export default class TerritoryHud extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pendingStartEmpireRequest: false,
            pendingTrainSoldierRequest: false,
        };
    }

    startEmpire = () => {
        this.setState({pendingStartEmpireRequest: true});
        this.props.startEmpire();
    };

    trainSoldier = () => {
        this.setState({pendingTrainSoldierRequest: true});
        this.props.trainSoldier();
    }

    render() {
        const t = this.props.matchStore.selectedTerritory;

        if (!t) {
            return null;
        }

        let hexInfo;
        let startPrompt;
        let ownerInfo;
        let trainSoldier = null;
        const phase = MatchUtil.getPhase(this.props.matchStore.match);

        hexInfo = (
            <div className="coordinates">({t.q}, {t.r})</div>
        );

        if (t.starting_position && MatchUtil.showStartPosition(this.props.matchStore.match, t)) {

            if (this.props.userStore.user.loggedIn) {
                startPrompt = this.props.matchStore.userEmpire ? (
                    <p>You have already claimed another starting position in this match.</p>
                ) : (
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        disabled={this.state.pendingStartEmpireRequest}
                        onClick={this.startEmpire} >
                            Start Empire Here
                    </Button>
                );
            }
            else {
                startPrompt = <p>Register or log in to start an empire here and
                    participate in this match of Expanse of Empires.</p>;
            }

        }

        if (t.empire) {
            let userControls = t.empire == this.props.matchStore.userEmpire;
            ownerInfo = userControls ? 'You control this territory' : t.empire.username + ' controls this territory';

            if (phase == 'non-player-combat' || phase == 'expanse-of-empires') {
                if (userControls) {
                    if (t.building && t.building.machine_name == 'castle') {
                        trainSoldier = (
                            <Button
                                variant="contained"
                                size="large"
                                color="primary"
                                disabled={this.state.pendingTrainSoldierRequest}
                                onClick={this.trainSoldier}>
                                    Train Soldier (-10S -10T)
                            </Button>
                        );
                    }
                }
            }
        }
        else {
            ownerInfo = 'Neutral territory';
        }

        return (
            <div className="match-hud match-hud-right">
                {hexInfo}
                <p>{ownerInfo}</p>
                {startPrompt &&
                    <div className="start-prompt">
                        <p>This territory is an unclaimed starting position.</p>
                        {startPrompt}
                    </div>
                }
                {trainSoldier}
            </div>
        );
    }
}
