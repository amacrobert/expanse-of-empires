import React from 'react';

class Nav extends React.Component {

    constructor(props) {
        super(props);

        this.handleExit = this.handleExit.bind(this);
    }

    handleExit() {
        this.props.onExit();
    }

    render() {
        const match = this.props.activeMatch;
        const user = this.props.user;

        return(


            <nav className="navbar navbar-expand-sm navbar-dark bg-primary main-nav">
                <span className="navbar-brand mb-0 h1">
                    <span className="text-uppercase">Expanse</span> of <span className="text-uppercase">Empires</span>
                    {match && <span className="nav-match-name">{match.name}</span>}
                </span>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav">
                        {match && <a className="nav-item nav-link clickable" onClick={this.handleExit}>Exit</a>}
                    </div>
                </div>
                    {user ?
                        (
                            <div className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle clickable" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    {user.username}
                                </a>
                                <div className="dropdown-menu bg-light dropdown-menu-right" aria-labelledby="navbarDropdown">
                                    <a className="dropdown-item" href="#">Profile</a>
                                    <a className="dropdown-item" href="#">Settings</a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#">Log out</a>
                                </div>
                            </div>
                        ) : (
                            <form className="form-inline">
                                <div className="input-group">
                                    <input className="form-control" type="text" placeholder="Email" aria-label="email" />
                                    <input className="form-control" type="password" placeholder="Password" aria-label="password" />
                                    <button className="btn bg-dark text-white" type="submit">Log in</button>
                                </div>
                            </form>
                        )
                    }
            </nav>
        );
    }
}

export default Nav;
