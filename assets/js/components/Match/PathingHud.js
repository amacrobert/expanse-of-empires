import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

@inject('matchStore')
@observer
export default class PathingHud extends Component {

    render() {

        let path = this.props.matchStore.path;
        let start = this.props.matchStore.path.nodes[0];
        let end = this.props.matchStore.path.nodes.slice(-1)[0];
        let verb = path.type == 'move' ? 'Move to' : 'Attack';

        return (
            <Card className="pathing-hud-card">
                <CardContent>
                    <Typography gutterBottom variant="body2">
                        {verb} {end.name} from {start.name}
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}
