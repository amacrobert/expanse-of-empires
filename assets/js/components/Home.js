import React, { Component } from 'react';
import MatchList from './MatchList';
import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
class Home extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.matchStore.fetchMatchList();
    }

    render() {
        return(
            <div className="container-fluid" key='container'>
                <div className="row mt-2">
                    <MatchList />
                </div>
            </div>
        );
    }
}

export default Home;
