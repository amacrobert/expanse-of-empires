import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Api from '../services/api';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';

class Login extends Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            email: '',
            password: '',
        };
    }

    handleLogin = (e) => {
        e.preventDefault();

        Api.login(this.state.email, this.state.password).then(result => {
            if (result.status == 200) {
                result.json().then((data) => {
                    this.props.onLogin(data);
                });
            }
            else {
                result.json().then((message) => {
                    console.log('ERROR:', message.error);
                });
            }
        });
    };

    render() {

        return ([
            <Button
                key="login-button"
                color="inherit"
                onClick={() => this.setState({open: true})}>
                Log in
            </Button>,
            <Dialog
                key="login-dialog"
                open={this.state.open}
                onClose={() => this.setState({open: false})}>
                <DialogTitle>Log In</DialogTitle>
                <form onSubmit={this.handleLogin}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            label="Email address"
                            type="email"
                            margin="normal"
                            onChange={event => this.setState({email: event.target.value})}
                            value={this.state.email}
                            fullWidth />
                        <TextField
                            label="Password"
                            type="password"
                            margin="normal"
                            onChange={event => this.setState({password: event.target.value})}
                            value={this.state.password}
                            fullWidth />
                    </DialogContent>
                    <DialogActions>
                        <Button type="submit">Log in</Button>
                    </DialogActions>
                </form>
            </Dialog>
        ]);
    }
}

export default Login;
