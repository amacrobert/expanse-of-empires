import React from 'react';
import MatchUtil from '../../services/match-util';
import { observer, inject } from 'mobx-react';
import ArmyList from './ArmyList';
import Button from '@material-ui/core/Button';
import AttackOutput from './Attack/AttackOutput';
import Modifier from './Attack/Modifier';

@inject('matchStore', 'userStore', 'uiStore')
@observer
export default class TerritoryHud extends React.Component {

    startEmpire = () => {
        this.props.uiStore.disableButton('start-empire');
        this.props.startEmpire();
    };

    trainSoldier = () => {
        this.props.uiStore.disableButton('train-army');
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
                        disabled={this.props.uiStore.buttons['start-empire'].disabled}
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

        if (t.empire_id) {
            let empire = this.props.matchStore.empiresById[t.empire_id];
            let userControls = empire == this.props.matchStore.userEmpire;
            ownerInfo = userControls ? 'You control this territory' : empire.username + ' controls this territory';

            if (phase == 'non-player-combat' || phase == 'expanse-of-empires') {
                if (userControls) {
                    if (t.building && t.building.machine_name == 'castle') {
                        trainSoldier = (
                            <Button
                                variant="contained"
                                size="large"
                                color="primary"
                                disabled={this.props.uiStore.buttons['train-army'].disabled}
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
                <p>{t.terrain.type} | Movement cost: {t.terrain.tide}T</p>
                <p>Support: <Modifier number={t.support || 0} /></p>
                <p>{ownerInfo}</p>
                {startPrompt &&
                    <div className="start-prompt">
                        <p>This territory is an unclaimed starting position.</p>
                        {startPrompt}
                    </div>
                }
                {trainSoldier}
                <ArmyList armies={t.armies} />
                <AttackOutput />
            </div>
        );
    }
}
