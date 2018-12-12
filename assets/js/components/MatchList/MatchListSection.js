import React from 'react';
import ReactDOM from 'react-dom';
import MatchCard from './MatchCard';
import { observer } from 'mobx-react';

import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableRow';

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


        return ([
            <TableHead key={this.props.key + '-th1'}>
                <TableRow>
                    <TableCell colSpan={4} style={styles.sectionHeader}>
                        {this.props.title}
                    </TableCell>
                </TableRow>
            </TableHead>,
            <TableHead key={this.props.key + '-th2'}>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phase</TableCell>
                    <TableCell numeric>Speed</TableCell>
                    <TableCell>Map</TableCell>
                </TableRow>
            </TableHead>,
            matchCards
        ]);
    }
}

export default MatchList;

const styles = {
    sectionHeader: {
        textAlign: 'center',
        textTransform: 'uppercase',
    }
};