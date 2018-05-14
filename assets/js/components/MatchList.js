import React from 'react';
import ReactDOM from 'react-dom';
import MatchListSection from './MatchListSection';

class MatchList extends React.Component {

    constructor(props) {
        super(props);

        this.loaded = false;
        this.state = {
            matches: []
        };
    }

    componentDidMount() {
        fetch('/api/matches', {headers: {'X-AUTH-TOKEN': 'abc'}})
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
        if (this.state.matches.length) {
            const matches = {
                'pre-registration': [],
                'registration': [],
                'non-player-combat': [],
                'expanse-of-empires': [],
                'complete': [],
            };

            this.state.matches.forEach((match) => {
                matches[match.phase].push(match);
            });

            return(
                <div className="col-md-4">
                    <h4>MATCHES</h4>
                    <MatchListSection
                        title="Registration open"
                        matches={matches['registration']}
                        onMatchSelect={this.props.onMatchSelect} />
                    <MatchListSection
                        title="Opening soon"
                        matches={matches['pre-registration']}
                        onMatchSelect={this.props.onMatchSelect} />
                    <MatchListSection
                        title="Play started"
                        matches={matches['expanse-of-empires'].concat(matches['non-player-combat'])}
                        onMatchSelect={this.props.onMatchSelect} />
                    <MatchListSection
                        title="Previous matches"
                        matches={matches['complete']}
                        onMatchSelect={this.props.onMatchSelect} />
                </div>
            );
        }
        else {
            return (<p>Loading matches...</p>)
        }
    }
}

export default MatchList;
