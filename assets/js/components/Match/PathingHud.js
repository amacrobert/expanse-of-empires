import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

@inject('matchStore')
@observer
export default class PathingHud extends Component {

    render() {

        let match = this.props.matchStore;
        let path = match.path;
        let start = match.path.nodes[0];
        let end = match.path.nodes.slice(-1)[0];
        let verb = path.type == 'move' ? 'Move to' : 'Attack';
        let units = match.selectedUnits;
        let tideCost = match.path.cost * units;

        return (
            <Card className="pathing-hud-card">
                <CardContent>
                    <Typography variant="body2">
                        {verb} {end.name} from {start.name}
                    </Typography>
                    <Typography variant="body2">
                        {units} units / -{tideCost} Tide
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}
