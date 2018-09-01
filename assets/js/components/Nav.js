import React from 'react';
import UserMenu from './UserMenu';
import RegisterLoginButtons from './RegisterLoginButtons';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';

@inject('userStore', 'matchStore')
@observer
class Nav extends React.Component {

    render() {
        const user = this.props.userStore.user;
        const match = this.props.matchStore.match;

        return(

            <nav className="navbar navbar-expand-sm navbar-dark bg-primary main-nav">
                <Link to="/" className="navbar-brand mb-0 h1">
                    <span className="text-uppercase">Expanse</span> of <span className="text-uppercase">Empires</span>
                    {match && <span className="nav-match-name">{match.name}</span>}
                </Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav">
                    </div>
                </div>

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

            </nav>
        );
    }
}

export default Nav;
