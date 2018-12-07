import React from 'react';
import ReactDOM from 'react-dom';
import Api from '../services/api';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

class Register extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            errors: [],
            registrationComplete: false,
            email: '',
            username: '',
            password: '',
            password2: '',
            submitting: false,
            open: false,
        };
    }

    handleRegisterSubmit = event => {
        event.preventDefault();

        console.log('submitting');

        const { email, username, password, password2 } = this.state;

        this.setState({
            errors: [],
            submitting: true,
        });

        var frontendErrors = [];

        // Frontend validation
        if (!email || !username || !password || !password2) {
            frontendErrors.push('All fields are required');
        }
        if (password !== password2) {
            frontendErrors.push('Passwords do not match');
        }

        if (frontendErrors.length) {
            this.setState({
                errors: frontendErrors,
                submitting: false,
            });
            return;
        }

        Api.register(email, username, password).then((result) => {
            if (result.status == 200) {
                result.json().then((data) => {
                    console.log(data);
                    this.setState({
                        registrationComplete: true,
                        email: email,
                    });
                });
            }
            else {
                result.json().then((errors) => {
                    this.setState({
                        errors: errors,
                        submitting: false,
                    });
                })
            }
        });
    }

    render() {

        return ([
            <Button
                key="register-button"
                variant="contained"
                color="secondary"
                onClick={() => this.setState({open: true})}>
                Register
            </Button>,
            <Dialog
                key="register-dialog"
                open={this.state.open}
                onClose={() => this.setState({open: false})}>
                <DialogTitle>Register</DialogTitle>
                {!this.state.registrationComplete && this.renderForm() }
                {this.state.registrationComplete && this.renderCompleteMessage() }
            </Dialog>
        ]);
    }

    renderCompleteMessage = () => {
        return (
            <DialogContent>
                <p>We sent an email to <strong>{this.state.email}</strong> with a link to complete your registration.</p>
                <p>Check your email and open the link to activate your account.</p>
            </DialogContent>
        );
    }

    renderForm = () => {
        var errorAlerts = this.state.errors.map((error, index) => {
            return (
                <Alert
                    key={index}
                    message={error}
                />
            );
        });

        return( 
            <form onSubmit={this.handleRegisterSubmit}>
                <DialogContent>
                    {errorAlerts}
                    <TextField
                        autoFocus
                        label="Email address"
                        type="email"
                        margin="dense"
                        onChange={event => this.setState({email: event.target.value})}
                        value={this.state.email}
                        helperText="We will keep your email private"
                        fullWidth />
                    <TextField
                        label="Username"
                        type="text"
                        margin="dense"
                        onChange={event => this.setState({username: event.target.value})}
                        value={this.state.username}
                        fullWidth />
                    <TextField
                        label="Password"
                        type="password"
                        margin="dense"
                        onChange={event => this.setState({password: event.target.value})}
                        value={this.state.password}
                        fullWidth />
                    <TextField
                        label="Repeat password"
                        type="password"
                        margin="dense"
                        onChange={event => this.setState({password2: event.target.value})}
                        value={this.state.password2}
                        fullWidth />
                </DialogContent>
                <DialogActions>
                    <Button type="submit" disabled={this.submitting}>Register</Button>
                </DialogActions>
            </form>
        );
    }
}

export default Register;
