import React from 'react';
import ReactDOM from 'react-dom';

class MatchCard extends React.Component {

    constructor(props) {
        super(props);

        console.log(props);

        this.handleMatchSelect = this.handleMatchSelect.bind(this);
    }

    handleMatchSelect(e) {
        this.props.onMatchSelect(this.props.match);
    }

    render() {
        var match = this.props.match;
        var headerClass = this.props.active ? '' : 'text-white bg-success ';
        var cardClass = this.props.active ? '' : 'border-success ';
        var cardStyle = this.props.onMatchSelect ? {cursor: 'pointer'} : {};
        return(
            <div className={cardClass + 'card match-card'} style={cardStyle} onClick={this.handleMatchSelect}>
                <h5 className={headerClass + 'card-header'}>{match.name}</h5>
                <div className="card-body">
                    {match.speed != 100 ? <p className="card-text">Speed: {match.speed}% </p> : null}
                    <p className="card-text">Players: 8</p>
                </div>
            </div>
        );
    }
}

export default MatchCard;
