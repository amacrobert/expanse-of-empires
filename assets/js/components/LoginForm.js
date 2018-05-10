import React from 'react';
import ReactDOM from 'react-dom';

class LoginForm extends React.Component {

    constructor(props) {
        super(props);

        this.handleLogin = this.handleLogin.bind(this);
    }

    handleLogin(e) {
        e.preventDefault();

        const email = ReactDOM.findDOMNode(this.refs.email).value;
        const password = ReactDOM.findDOMNode(this.refs.password).value;

        fetch('/login', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username: email, password: password})
        })
        .then(
            (result) => {
                if (result.status == 200) {
                    console.log(result.headers);
                    result.json().then((result) => {
                        this.props.onLogin(result);
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
    }

    render() {
        return(
            <form className="form-inline" onSubmit={this.handleLogin}>
                <div className="input-group">
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Email"
                        aria-label="email"
                        ref="email" />
                    <input
                        className="form-control"
                        type="password"
                        placeholder="Password"
                        aria-label="password"
                        ref="password" />
                    <button className="btn bg-dark text-white" type="submit">Log in</button>
                </div>
            </form>
        );
    }
}

export default LoginForm;
