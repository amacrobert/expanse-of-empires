import React from 'react';
import ReactDOM from 'react-dom';
import MatchCard from './MatchCard';

class MatchList extends React.Component {

    constructor(props) {
        super(props);

        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);

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

    handleKeyboardShortcuts(e) {
        console.log('KEY PRESSED');
        e.stopPropagation();
        console.log(e);
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
            <div className="col-md-4" tabIndex="0" onKeyPress={this.handleKeyboardShortcuts}>
                <h5>Your Matches</h5>
                {matchList}
            </div>
        );
    }
}

export default MatchList;
