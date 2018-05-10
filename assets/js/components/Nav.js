import React from 'react';
import LoginForm from './LoginForm';
import UserMenu from './UserMenu';

class Nav extends React.Component {

    constructor(props) {
        super(props);

        this.handleExit = this.handleExit.bind(this);
    }

    handleExit() {
        this.props.onExit();
    }

    render() {
        const match = this.props.activeMatch;
        const user = this.props.user;

        return(

            <nav className="navbar navbar-expand-sm navbar-dark bg-primary main-nav">
                <span className="navbar-brand mb-0 h1">
                    <span className="text-uppercase">Expanse</span> of <span className="text-uppercase">Empires</span>
                    {match && <span className="nav-match-name">{match.name}</span>}
                </span>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav">
                        {match && <a className="nav-item nav-link clickable" onClick={this.handleExit}>Exit</a>}
                    </div>
                </div>

                {user.loaded && user.id && 
                    <UserMenu
                        user={user}
                        onLogout={this.props.onLogout}
                    />
                }

                {user.loaded && !user.id &&
                    <LoginForm onLogin={this.props.onLogin} />
                }

            </nav>
        );
    }
}

export default Nav;
