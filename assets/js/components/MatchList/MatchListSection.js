import React from 'react';
import ReactDOM from 'react-dom';
import MatchCard from './MatchCard';
import { observer } from 'mobx-react';

import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import Grid from '@material-ui/core/Grid';

@observer
class MatchList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.matches.length) {
            return [];
        }

        var matchCards = this.props.matches.map(match => {
            return (
                <MatchCard
                    {...this.props}
                    key={match.id}
                    match={match} />
            );
        });

        return this.props.display == 'card' ? this.renderCards(matchCards) : this.renderTable(matchCards);

    }

    renderCards = matchCards => {
        if (!matchCards) {
            return null;
        }

        return (
            <Grid container spacing={24} style={{marginBottom: 16}}>
                <Grid item xs={12}>
                    <h4>{this.props.title.toUpperCase()}</h4>
                </Grid>
                {matchCards}
            </Grid>
        )
    };

    renderTable = matchCards => {
        return ([
            <TableHead key={'th'}>
                <TableRow>
                    <TableCell colSpan={5} style={styles.sectionHeader}>
                        {this.props.title}
                    </TableCell>
                </TableRow>
            </TableHead>,
            <TableBody key={'tb'}>
                {matchCards}
            </TableBody>,
        ]);
    };
}

export default MatchList;

const styles = {
    sectionHeader: {
        textAlign: 'center',
        textTransform: 'uppercase',
    }
};