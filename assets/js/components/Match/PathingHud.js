import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

@inject('matchStore', 'uiStore')
@observer
export default class PathingHud extends Component {

    render() {


        let {x, y} = this.props.uiStore.mouse;
        let match = this.props.matchStore;
        let path = match.path;
        let start = match.path.nodes[0];
        let end = match.path.nodes.slice(-1)[0];
        let verb = path.type == 'move' ? 'Move to' : 'Attack';
        let units = match.selectedUnits;
        let tideCost = match.path.cost * units;

        let location = {
            left: x + 30,
            top: y,
            textShadow: '1px 1px 6px #000000',
        };

        return (
            <div className="pathing-hud-card" style={location}>
                <Typography variant="body2">
                    {verb} {end.name} from {start.name}
                </Typography>
                <Typography variant="body2">
                    {units} units / -{tideCost} Tide
                </Typography>
            </div>
        );
    }
}
