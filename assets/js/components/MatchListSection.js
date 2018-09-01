import React from 'react';
import ReactDOM from 'react-dom';
import MatchCard from './MatchCard';
import { observer } from 'mobx-react';

@observer
class MatchList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.matches.length) {
            return [];
        }

        var matchCards = this.props.matches.map(match => {
            return (
                <MatchCard
                    key={match.id}
                    match={match} />
            );
        });

        return ([
            <h5 key={this.props.title + '-title'}>{this.props.title}</h5>,
            <div key={this.props.title + '-row'} className="row">
                {matchCards}
            </div>
        ]);
    }
}

export default MatchList;
