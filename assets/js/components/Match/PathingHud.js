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
        let {path, selectedUnits} = this.props.matchStore;
        let start = path.nodes[0];
        let end = path.nodes.slice(-1)[0];
        let units = selectedUnits;
        let tideCost = path.cost * units;
        let distance = path.nodes.length - 1;

        let hudWidth = 160;

        let location = {
            left: x - (hudWidth / 2),
            top: y + 50,
            textAlign: 'center',
            width: hudWidth,
            fontSize: 12,
            opacity: 0.8,
            padding: 0,
        };

        let defenderUsername = end.empire ? end.empire.username : 'NPC';
        let s = units == 1 ? '' : 's';

        return (
            <Card className="pathing-hud-card" style={location}>
                <CardContent style={{padding: 0, paddingTop: 3, paddingBottom: 3}}>
                    {path.type == 'move' &&
                        <span>
                            Move {units} unit{s} {distance} tiles<br />
                            -{tideCost} Tide
                        </span>
                    }
                    {path.type == 'attack' &&
                        <span>
                            Attack {defenderUsername} with {units} unit{s}<br />
                            -{tideCost} Tide<br />
                            +{tideCost / 2} Tide on fail
                        </span>
                    }
                </CardContent>
            </Card>
        );
    }
}
