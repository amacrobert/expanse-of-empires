import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal/Modal';
import Api from './Api';

class Login extends React.Component {

    constructor(props) {
        super(props);

        this.email = React.createRef();
        this.password = React.createRef();
    }

    handleLogin = (e) => {
        e.preventDefault();

        Api.login(this.email.current.value, this.password.current.value)
        .then(
            (result) => {
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
            },
            (error) => {
                console.log('LOGIN API ERROR:', error);
            }
        );
    };

    componentDidMount() {
        this.email.current.focus();
    }

    render() {
        return([
            <button
                key={2}
                className="btn btn-login"
                data-toggle="modal"
                data-target="#loginModal"
                >
                Login
            </button>,
            <Modal id="loginModal" size="small" key="loginModal">
                <Modal.Header>Login</Modal.Header>
                <form onSubmit={this.handleLogin}>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="loginEmailInput">Email</label>
                            <input
                                className="form-control"
                                type="text"
                                aria-label="email"
                                id="loginEmailInput"
                                ref={this.email} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loginPasswordInput">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                aria-label="password"
                                id="loginPasswordInput"
                                ref={this.password} />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn bg-primary text-white" type="submit">Login</button>
                    </Modal.Footer>
                </form>

            </Modal>
        ]);
    }
}

export default Login;
