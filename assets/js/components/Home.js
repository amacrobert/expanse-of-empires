import React from 'react';
import MatchList from './MatchList';

class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className="row mt-2">
                <MatchList onMatchSelect={this.props.onMatchSelect} />

                <div className="col-md-12">
                    <h2>Welcome</h2>
                    <p>Select a match on the right to begin</p>
                </div>
            </div>
        );
    }
}

export default Home;
