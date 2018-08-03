import React from 'react';
import MatchList from './MatchList';

class UserMenu extends React.Component {

    constructor(props) {
        super(props);
    }

    handleLogout = () => {
        this.props.onLogout();
    }

    render() {
        const user = this.props.user;

        return(
            <div className="nav-item dropdown">
                <a className="nav-link dropdown-toggle clickable" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {user.username}
                </a>
                <div className="dropdown-menu bg-light dropdown-menu-right" aria-labelledby="navbarDropdown">
                    <a className="dropdown-item" href="#">Profile</a>
                    <a className="dropdown-item" href="#">Settings</a>
                    <div className="dropdown-divider"></div>
                    <a
                        className="dropdown-item clickable"
                        onClick={this.handleLogout}>
                        Log out
                    </a>
                </div>
            </div>
        );
    }
}

export default UserMenu;
