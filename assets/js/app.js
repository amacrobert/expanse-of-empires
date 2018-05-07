import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap';

import MatchList from './components/MatchList';
import MatchCard from './components/MatchCard';

class App extends React.Component {

    constructor(props) {
        super(props);

        this.handleMatchSelect = this.handleMatchSelect.bind(this);

        this.state = {
            user: {username: ''},
            activeMatch: null,
        };
    };

    handleMatchSelect(match) {
        this.setState({activeMatch: match});
    }

    componentDidMount() {
        fetch('/api/user')
        .then(result => result.json())
        .then(
            (result) => {
                this.setState({user: result});
            },
            (error) => {
                console.log('ERROR:', error);
            }
        )
    }

    render() {
        const activeMatch = this.state.activeMatch;
        const activeMatchCard = activeMatch ? <MatchCard match={activeMatch} active={true} /> : <p>select a match on the right</p>
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-8">
                        <p>Logged in as {this.state.user.username}</p>
                        {activeMatchCard}
                    </div>
                    <MatchList onMatchSelect={this.handleMatchSelect} />
                </div>
            </div>
        );
    };
}

ReactDOM.render(<App />, document.getElementById('root'));
