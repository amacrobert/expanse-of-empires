import React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import 'bootstrap';

import Nav from './components/Nav';
import Home from './components/Home';
import Match from './components/Match';
import Api from './components/Api';

class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            user: {loaded: false},
            activeMatch: null,
        };
    };

    handleMatchSelect = (match) => {
        this.setState({activeMatch: match});
    }

    handleLogin = (result) => {
        console.log('appjs login:', result);
        const cookies = new Cookies();
        cookies.set('AUTH-TOKEN', result.api_key, {path: '/'});
        cookies.set('PHPSESSID', result.session, {path: '/'});
        window.location.href = '/';
    }

    handleLogout = () => {
        let cookies = new Cookies();
        cookies.remove('AUTH-TOKEN');
        window.location.href = '/logout';
    }

    componentDidMount() {
        let user = this.state.user;

        Api.getUser().then(user => {
            user.loaded = true;
            user.loggedIn = user.id ? true : false;
            this.setState({user: user});
        });
    }

    render() {
        const activeMatch = this.state.activeMatch;
        return ([
            <Nav
                activeMatch={activeMatch}
                user={this.state.user}
                onExit={this.handleMatchSelect}
                onLogin={this.handleLogin}
                onLogout={this.handleLogout}
                key='nav'
            />,
            <div className="container-fluid" key='container'>
               {activeMatch ? (
                    <Match match={activeMatch} user={this.state.user} onExit={this.handleMatchSelect} />
                ) : (
                    <Home user={this.state.user} onMatchSelect={this.handleMatchSelect} />
                )}
            </div>
        ]);
    };
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
