import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';

import {
    BrowserRouter as Router,
    Route,
    Link
} from 'react-router-dom'

import Nav from './components/Nav';
import Home from './components/Home';
import Match from './components/Match';

import { Provider, observer } from 'mobx-react';
import UserStore from './store/UserStore';
import MatchStore from './store/MatchStore';

import { SnackbarProvider } from 'notistack';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

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
        window.location.reload(true);
    };

    logout = () => {
        let cookies = new Cookies();
        cookies.remove('AUTH-TOKEN');

        // Cookies.remove doesn't return a promise, so wait a bit before redirecting user.
        // This prevents a bug where it takes multiple logouts to actually log out.
        // @TODO: Contribute a fix to universal-cookies
        // @see https://github.com/reactivestack/cookies/issues/189
        window.setTimeout(function() {
            window.location.href = '/logout';
        }, 100);
    };

    componentDidMount() {
        this.userStore.fetchUser();
    }

    render() {
        return (
            <Provider userStore={this.userStore} matchStore={this.matchStore}>
                <Router>
                    <SnackbarProvider maxSnack={12}>
                        <MuiThemeProvider theme={theme}>
                            <Nav
                                onLogin={this.login}
                                onLogout={this.logout} />
                            {this.userStore.user.loaded && [
                                <Route exact path="/" component={Home} key="route-home" />,
                                <Route path="/match/:matchId" component={Match} key="route-match" />,
                            ]}
                        </MuiThemeProvider>
                    </SnackbarProvider>
                </Router>
            </Provider>
        );
    };
}

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: { main: '#DF691A' },
        secondary: { main: '#4E5D6C' },
    },
});

ReactDOM.render(<App />, document.getElementById('root'));
