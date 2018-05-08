import React from 'react';

class Match extends React.Component {

    constructor(props) {
        super(props);
        this.handleExit = this.handleExit.bind(this);
    }

    handleExit() {
        this.props.onExit();
    }

    render() {
        const match = this.props.match;

        return(
            <div className="row">
                <div className="col-md-12">
                    <h2>{match.name}</h2>
                    <button className="clickable" onClick={this.handleExit}>Exit</button>
                </div>
            </div>
        );
    }
}

export default Match;
