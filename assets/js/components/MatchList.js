import React from 'react';
import ReactDOM from 'react-dom';
import MatchListSection from './MatchListSection';
import Api from '../services/api';

class MatchList extends React.Component {

    constructor(props) {
        super(props);

        this.loaded = false;
        this.state = {
            matches: []
        };
    }

    componentDidMount() {
        Api.getMatches().then(result => {
            console.log('Matches:', result);
            this.setState({matches: result});
        });
    }

    render() {
        if (this.state.matches.length) {
            const matches = {
                'joined': [],
                'pre-registration': [],
                'registration': [],
                'non-player-combat': [],
                'expanse-of-empires': [],
                'complete': [],
            };

            this.state.matches.forEach((match) => {
                if (match.user_joined) {
                    matches['joined'].push(match);
                }
                else {
                    matches[match.phase].push(match);
                }
            });

            return (
                <div className="col-md-12">
                    <h4>MATCHES</h4>
                    <MatchListSection
                        title="Your matches"
                        matches={matches['joined']}
                        onMatchSelect={this.props.onMatchSelect} />
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
