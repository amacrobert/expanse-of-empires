import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import 'bootstrap';

import Nav from './components/Nav';
import Home from './components/Home';
import Match from './components/Match';
import Api from './services/api';

import { Provider, observer } from 'mobx-react';
import UserStore from './store/UserStore';
import MatchStore from './store/MatchStore';

@observer
class App extends Component {

    constructor(props) {
        super(props);

        this.userStore = new UserStore;
        this.matchStore = new MatchStore(this.userStore);
    };

    login = (result) => {
        const cookies = new Cookies();
        cookies.set('AUTH-TOKEN', result.api_key, {path: '/'});
        cookies.set('PHPSESSID', result.session, {path: '/'});
        window.location.href = '/';
    };

    logout = () => {
        let cookies = new Cookies();
        cookies.remove('AUTH-TOKEN');
        window.location.href = '/logout';
    };

    componentWillMount() {
        this.userStore.fetchUser();
    }

    render() {
        return (
        <Provider
            userStore={this.userStore}
            matchStore={this.matchStore}>
                <div>
                    <Nav
                        onLogin={this.login}
                        onLogout={this.logout}
                        onExit={this.matchStore.clearMatch}
                        key='nav' />
                   {this.matchStore.match ? (
                        <Match />
                    ) : (
                        <Home onMatchSelect={(match) => this.matchStore.setMatch(match)} />
                    )}
                </div>
            </Provider>
        );
    };
}

ReactDOM.render(<App />, document.getElementById('root'));
