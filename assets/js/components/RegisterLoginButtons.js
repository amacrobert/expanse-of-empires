import React from 'react';
import Login from './Login';
import Register from './Register';

class RegisterLoginButtons extends React.Component {

    render() {
        return(
            <div className="button-group">
                <Register />
                <Login onLogin={this.props.onLogin} />
            </div>
        );
    }
}

export default RegisterLoginButtons;
