import React from 'react';
import UserMenu from './UserMenu';
import RegisterLoginButtons from './RegisterLoginButtons';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
// import MenuIcon from '@material-ui/icons/Menu';


@inject('userStore', 'matchStore')
@observer
class Nav extends React.Component {

    render() {
        const user = this.props.userStore.user;
        const match = this.props.matchStore.match;

        return (
            <AppBar position="static" className={styles.navBar}>
                <Toolbar>
                    <Typography variant="h6" color="inherit" style={{flexGrow: 1}}>
                        <Link to="/" style={styles.navBarBrand}>
                            EXPANSE of EMPIRES
                            {match && <span className="nav-match-name">{match.name}</span>}
                        </Link>
                    </Typography>

                    {user.loaded && user.loggedIn &&
                        <UserMenu
                            store={this.props.store}
                            onLogout={this.props.onLogout}
                        />
                    }

                    {user.loaded && !user.loggedIn &&
                        <RegisterLoginButtons
                            onLogin={this.props.onLogin}
                        />
                    }

                </Toolbar>
            </AppBar>
        );
    }
}

export default Nav;

const styles = {
    navBarBrand: {
        fontFamily: ["Cinzel Decorative", "Cursive"],
        color: 'white',
        textDecoration: 'none',
    },
};
