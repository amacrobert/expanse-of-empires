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
        return this.props.display == 'card' ? this.renderCard(match) : this.renderTableRow(match);
    }

    matchSelected = () => {
        this.props.history.push(this.matchUrl);
    };

    renderCard = match => (
        <Grid item lg={4} sm={6} xs={12}>
            <Card raised={true}>
                <CardActionArea onClick={() => this.props.history.push(this.matchUrl)}>
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                            {match.name}
                        </Typography>
                        <Typography variant="body2" inline={false}>
                            Speed: {match.speed}
                        </Typography>
                        <Typography variant="body2" inline={false}>
                            Map: {match.map_name}
                        </Typography>
                        <Typography variant="body2" inline={false}>
                            Phase: {this.phaseText}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );

    renderTableRow = match => (
        <TableRow
            style={{cursor: 'pointer'}}
            onClick={this.matchSelected}
            tabIndex={-1}
            padding='dense'>
            <TableCell style={{fontWeight: 'bold'}}>{match.name}</TableCell>
            <TableCell>{this.phaseText}</TableCell>
            <TableCell>Speed: {match.speed}</TableCell>
            <TableCell>Map: {match.map_name}</TableCell>
            <TableCell>{this.actionButton}</TableCell>
        </TableRow>
    );

    get matchUrl() {
        return '/match/' + this.props.match.id;
    }

    get actionButton() {
        const match = this.props.match;
        if (this.matchOpen) {
            return <Button onClick={this.matchSelected} color='primary' variant='contained'>Join match</Button>
        }
        else {
            return <Button onClick={this.matchSelected} variant='outlined'>View match</Button>
        }
    }

    get phaseText() {
        const match = this.props.match;
        let phaseText;
        let color = 'default';

        if (match.phase == 'registration') {
            phaseText = match.empire_count + '/' + match.slots + ' joined';

            if (match.full) {
                color = 'error';
            }
        }
        else {
            phaseText = match.phase;
        }

        return phaseText;
    }

    get matchOpen() {
        const match = this.props.match;
        return match.phase == 'registration' && !match.full;
    }

}

export default MatchCard;
