import React from 'react';

class MatchCard extends React.Component {

    constructor(props) {
        super(props);
        this.handleMatchSelect = this.handleMatchSelect.bind(this);
    }

    handleMatchSelect(e) {
        this.props.onMatchSelect(this.props.match);
    }

    render() {
        var match = this.props.match;
        return(
            <div tabIndex="0" className='card match-card' onClick={this.handleMatchSelect}>
                <div className="card-header">
                    <span className="align-middle">{match.name}</span>
                    <span className="btn btn-sm btn-light btn-open">Open</span>
                </div>
                <div className="card-body">
                    {match.speed != 100 ? <p className="card-text">Speed: {match.speed}% </p> : null}
                    <p className="card-text">Players: 8</p>
                </div>
            </div>
        );
    }
}

export default MatchCard;
