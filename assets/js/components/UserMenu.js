import React from 'react';
import MatchList from './MatchList';
import { observer, inject } from 'mobx-react';

@inject('userStore')
@observer
class UserMenu extends React.Component {

    render() {
        const user = this.props.userStore.user;

        return (
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
                        onClick={this.props.onLogout}>
                        Log out
                    </a>
                </div>
            </div>
        );
    }
}

export default UserMenu;
