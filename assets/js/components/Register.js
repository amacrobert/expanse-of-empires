import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal/Modal';

class Register extends React.Component {

    constructor(props) {
        super(props);

        this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
    }

    handleRegisterSubmit(e) {
        e.preventDefault();

        console.log('Registered');
    }

    render() {
        return([
            <button key={2} className="btn btn-warning" data-toggle="modal" data-target="#registerModal">
                Register
            </button>,
            <Modal id="registerModal" key="registerModal">
                <Modal.Header>Register</Modal.Header>
                <form onSubmit={this.handleRegister}>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="emailInput">Email address</label>
                            <input
                                className="form-control"
                                type="email"
                                aria-label="email"
                                id="emailInput" />
                            <small className="form-text text-muted">We'll never share your email with anyone else.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="usernameInput">Username</label>
                            <input
                                className="form-control"
                                type="text"
                                aria-label="username"
                                id="usernameInput" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password1Input">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                aria-label="password"
                                id="password1Input" />
                        </div>
                        <div className="form-group">
                            <input
                                className="form-control"
                                type="password"
                                placeholder="Repeat password"
                                aria-label="repeat-password"
                                id="password2Input" />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn bg-primary text-white" type="submit">Register</button>
                    </Modal.Footer>

                </form>
            </Modal>
        ]);
    }
}

export default Register;
