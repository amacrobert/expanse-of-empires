import React from 'react';
import MatchList from './MatchList';
import { observer, inject } from 'mobx-react';

import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';

@inject('userStore')
@observer
class UserMenu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

    handleMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    render() {
        const user = this.props.userStore.user;
        const open = Boolean(this.state.anchorEl);

        return (
            <div>
                <IconButton
                    aria-owns={open ? 'menu-appbar' : undefined}
                    aria-haspopup="true"
                    onClick={this.handleMenu}
                    color="inherit"
                >
                <AccountCircle />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={open}
                    onClose={this.handleClose}
                >
                    <MenuItem onClick={this.handleClose}>Profile</MenuItem>
                    <MenuItem onClick={this.handleClose}>Settings</MenuItem>
                    <Divider />
                    <MenuItem onClick={this.props.onLogout}>Logout</MenuItem>
                </Menu>
            </div>
        );
    }
}

export default UserMenu;
