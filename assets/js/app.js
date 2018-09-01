import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import 'bootstrap';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

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

    componentDidMount() {
        this.userStore.fetchUser();
    }

    render() {
        return (
        <Provider
            userStore={this.userStore}
            matchStore={this.matchStore}>
                <Router>
                    <div>
                        <Nav
                            onLogin={this.login}
                            onLogout={this.logout}
                            key='nav' />
                        <Route exact path="/" component={Home} />
                        <Route path="/match/:matchId" component={Match}/>
                    </div>
                </Router>
            </Provider>
        );
    };
}

ReactDOM.render(<App />, document.getElementById('root'));
