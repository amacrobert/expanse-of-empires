import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';

import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

@observer
class MatchCard extends React.Component {

    render() {
        const match = this.props.match;
        console.log('Match: ', this.props.match);
        const matchUrl = '/match/' + this.props.match.id;
        const matchCardClasses = ['card', 'match-card'];
        const openButtonClasses = ['btn', 'btn-sm', 'btn-open'];

        if (match.user_joined) {
            matchCardClasses.push('match-active');
            matchCardClasses.push('bg-primary');
        }
        else {
            openButtonClasses.push('btn-light');
        }

        return (
            <TableRow
                hover
                style={{cursor: 'pointer'}}
                onClick={() => this.props.history.push(matchUrl)}
                tabIndex={-1}
                padding='dense'>
                <TableCell>{match.name}</TableCell>
                <TableCell>{match.phase}</TableCell>
                <TableCell numeric>{match.speed}</TableCell>
                <TableCell>{match.map_name}</TableCell>
            </TableRow>
        );
    }
}

export default MatchCard;
