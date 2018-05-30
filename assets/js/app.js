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

        this.handleMatchSelect = this.handleMatchSelect.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
    };

    handleMatchSelect(match) {
        this.setState({activeMatch: match});
    }

    handleLogin(result) {
        console.log('appjs login:', result);
        const cookies = new Cookies();
        cookies.set('AUTH-TOKEN', result.api_key, {path: '/'});
        cookies.set('PHPSESSID', result.session, {path: '/'});
        window.location.href = '/';
    } 

    handleLogout() {
        const cookies = new Cookies();
        cookies.remove('AUTH-TOKEN');
        window.location.href = '/logout';        
    }

    componentDidMount() {
        const user = this.state.user;

        Api.getUser()
        .then(result => result.json())
        .then(
            (user) => {
                user.loaded = true;
                user.loggedIn = user.id ? true : false;
                this.setState({user: user});
            },
            (error) => {
                console.log('ERROR:', error);
            }
        )
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
            />,
            <div className="container-fluid">
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
