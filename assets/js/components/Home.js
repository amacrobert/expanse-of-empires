import React, { Component } from 'react';
import MatchList from './MatchList/MatchList';
import { observer, inject } from 'mobx-react';
import Grid from '@material-ui/core/Grid';

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

        return (
            <Grid container spacing={0} style={{padding: '12px'}}>
                <Grid item xs={12}>
                    <MatchList {...this.props} />
                </Grid>
            </Grid>
        );
    }
}

export default Home;
