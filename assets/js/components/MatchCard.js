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

        this.handleMatchSelect = this.handleMatchSelect.bind(this);
    }

    handleMatchSelect(e) {
        this.props.onMatchSelect(this.props.match);
    }

    render() {
        const match = this.props.match;

        return(
            <div tabIndex="0" className='card match-card' onClick={this.handleMatchSelect}>
                <div className="card-header">
                    <span className="align-middle">{match.name}</span>
                    <span className="btn btn-sm btn-light btn-open">Open</span>
                </div>
                <div className="card-body">
                    <p className="card-text">{match.phase}</p>
                    {match.speed != 100 ? <p className="card-text">Speed: {match.speed}% </p> : null}
                </div>
            </div>
        );
    }
}

export default MatchCard;
