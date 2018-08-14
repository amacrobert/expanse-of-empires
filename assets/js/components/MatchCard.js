import React from 'react';

class MatchCard extends React.Component {

    constructor(props) {
        super(props);

        const match = this.props.match;
        const now = new Date();
        const dateRegistration = new Date(match.date_registration);
        const dateNPC = new Date(match.date_npc);
        const dateP2P = new Date(match.date_p2p);
        const dateCompleted = match.date_completed ? new Date(match.date_completed) : null;
    }

    handleMatchSelect = (e) => {
        this.props.onMatchSelect(this.props.match);
    }

    render() {
        const match = this.props.match;
        const matchCardClasses = ['card', 'match-card'];
        const openButtonClasses = ['btn', 'btn-sm', 'btn-open'];

        if (match.user_joined) {
            matchCardClasses.push('match-active');
            matchCardClasses.push('bg-primary');
        }
        else {
            openButtonClasses.push('btn-light');
        }

        return(
            <div className="col-md-4">
                <div className={matchCardClasses.join(' ')} onClick={this.handleMatchSelect}>
                    <div className="card-header">
                        <span className="align-middle">{match.name}</span>
                        <span className={openButtonClasses.join(' ')}>Open</span>
                    </div>
                    <div className="card-body">
                        <p className="card-text">{match.phase}</p>
                        <p className="card-text">Speed: {match.speed}%</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default MatchCard;
