import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal/Modal';
import Alert from './Alert';
import Api from './Api';

class Register extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            errors: [],
            registrationComplete: false,
            email: '',
            submitting: false,
        };

        this.email = React.createRef();
        this.username = React.createRef();
        this.password1 = React.createRef();
        this.password2 = React.createRef();
    }

    handleRegisterSubmit = (e) => {
        e.preventDefault();

        this.setState({
            errors: [],
            submitting: true,
        });

        const email = this.email.current.value,
            username = this.username.current.value,
            password = this.password1.current.value,
            password2 = this.password2.current.value
        ;

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

        Api.register(email, username, password)
        .then((result) => {
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
        return([
            <button key={2} className="btn btn-warning" data-toggle="modal" data-target="#registerModal">
                Register
            </button>,
            <Modal id="registerModal" key="registerModal">
                <Modal.Header>Register</Modal.Header>
                {!this.state.registrationComplete &&
                    this.renderForm()
                }
                {this.state.registrationComplete &&
                    this.renderCompleteMessage()
                }
            </Modal>
        ]);
    }

    renderCompleteMessage = () => {
        return(
            <Modal.Body>
                <p>We sent an email to <strong>{this.state.email}</strong> with a link to complete your registration.</p>
                <p>Check your email and click the link to activate your account.</p>
            </Modal.Body>
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
                <Modal.Body>
                    {errorAlerts}
                    <div className="form-group">
                        <label htmlFor="emailInput">Email address</label>
                        <input
                            className="form-control"
                            type="email"
                            aria-label="email"
                            id="emailInput"
                            ref={this.email} />
                        <small className="form-text text-muted">We'll never share your email with anyone else.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="usernameInput">Username</label>
                        <input
                            className="form-control"
                            type="text"
                            aria-label="username"
                            id="usernameInput"
                            ref={this.username} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password1Input">Password</label>
                        <input
                            className="form-control"
                            type="password"
                            aria-label="password"
                            id="password1Input"
                            ref={this.password1} />
                    </div>
                    <div className="form-group">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Repeat password"
                            aria-label="repeat-password"
                            id="password2Input"
                            ref={this.password2} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button disabled={this.state.submitting} className="btn bg-primary text-white" type="submit">Register</button>
                </Modal.Footer>

            </form>
        );
    }
}

export default Register;
