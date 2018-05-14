import React from 'react';
import ReactDOM from 'react-dom';
import MatchCard from './MatchCard';

class MatchList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.matches.length) {
            return [];
        }

        var matchList = this.props.matches.map((match, index) => {
            return (
                <MatchCard
                    key={index}
                    match={match}
                    onMatchSelect={this.props.onMatchSelect}
                />
            );
        });

        return([
            <h5 key={this.props.title + '-title'}>{this.props.title}</h5>,
            matchList
        ]);
    }
}

export default MatchList;
