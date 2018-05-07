import React from 'react';
import ReactDOM from 'react-dom';

import MatchCard from './MatchCard';

//var Col = require('react-bootstrap').Col;

class MatchList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            matches: []
        };
    }

    componentDidMount() {
        fetch('/api/matches')
        .then(result => result.json())
        .then(
            (result) => {
                console.log('MATCHES:', result);
                this.setState({matches: result});
            },
            (error) => {
                console.log('ERROR:', error);
            }
        )
    }

    render() {
        var matchList = this.state.matches.map((match) => {
            return (
                <MatchCard
                    match={match}
                    key={match.id}
                    onMatchSelect={this.props.onMatchSelect}
                />
            );
        });

        return(
            <div className="col-md-4">
                <h3>Your Matches</h3>
                {matchList}
            </div>
        );
    }
}

export default MatchList;
