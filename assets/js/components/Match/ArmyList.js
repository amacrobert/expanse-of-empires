import React from 'react';

import ArmyListItem from './ArmyListItem';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import { observer, inject } from 'mobx-react';

@observer
@inject('matchStore', 'uiStore')
export default class ArmyList extends React.Component {

    render() {

        const armyList = this.props.armies.map((army, index) => {

            const empire = this.props.matchStore.empiresById[army.empire_id];
            const isUserEmpire = this.props.matchStore.userEmpire == empire;
            const userIsMovingUnits = this.props.uiStore.movingUnits && isUserEmpire;

            if (!army.size && !userIsMovingUnits) {
                return null;
            }

            return (
                <ListItem key={index}>
                    <ArmyListItem
                        army={army}
                        empire={empire} />
                </ListItem>
            );

        });

        return (
            <List>{armyList}</List>
        );
    }
}
