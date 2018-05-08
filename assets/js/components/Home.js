import React from 'react';
import MatchList from './MatchList';

class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className="row">
                <div className="col-md-8">
                    <h2>Welcome</h2>
                    <p>Select a match on the right to begin</p>
                </div>
                <MatchList onMatchSelect={this.props.onMatchSelect} />
            </div>
        );
    }
}

export default Home;
