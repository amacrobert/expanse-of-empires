import React from 'react';
import MatchUtil from '../services/match-util';

export default class MatchHud extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const t = this.props.territory;

        if (!t) {
            return null;
        }

        let hexInfo;
        let startPrompt;
        let ownerInfo;

        hexInfo = (
            <div className="coordinates">({t.q}, {t.r})</div>
        );

        if (t.starting_position && MatchUtil.showStartPosition(this.props.match, t)) {

            if (this.props.user.loggedIn) {
                startPrompt = this.props.match.user_joined ? (
                    <p>You have already claimed another starting position in this match.</p>
                ) : (
                    <button
                        type="button"
                        className="btn btn-primary btn-lg btn-block"
                        onClick={this.props.startEmpire} >
                            Start Empire Here
                    </button>
                );
            }
            else {
                startPrompt = <p>Register or log in to start an empire here and
                    participate in this match of Expanse of Empires.</p>;
            }

        }

        if (t.empire_id) {
            let empire = this.props.empiresById[t.empire_id];
            ownerInfo = empire.username + ' controls this territory';
        }
        else {
            ownerInfo = 'This territory has not been captured by any empire yet.';
        }

        return (
            <div className="match-hud match-hud-right">
                {hexInfo}
                {startPrompt &&
                    <div className="start-prompt">
                        <p>This territory is an unclaimed starting position.</p>
                        {startPrompt}
                    </div>
                }
                <p>{ownerInfo}</p>
            </div>
        );
    }
}
