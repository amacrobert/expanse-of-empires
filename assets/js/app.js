import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap';

import Nav from './components/Nav';
import Home from './components/Home';
import Match from './components/Match';

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
        console.log('handleSelectMatch match: ', match);
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
        return (
            <div>
                <Nav
                    activeMatch={activeMatch}
                    onExit={this.handleMatchSelect}
                    user={this.state.user}
                />
                <div className="container-fluid">

                   {activeMatch ? (
                        <Match match={activeMatch} user={this.state.user} onExit={this.handleMatchSelect} />
                    ) : (
                        <Home user={this.state.user} onMatchSelect={this.handleMatchSelect} /> 
                    )}
                </div>
            </div>
        );
    };
}

ReactDOM.render(<App />, document.getElementById('root'));
