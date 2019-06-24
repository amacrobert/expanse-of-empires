import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import FolderIcon from '@material-ui/icons/Folder';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import Typography from '@material-ui/core/Typography';
import { observer, inject } from 'mobx-react';

const maxDrawnIcons = 5;
const buttonStyles = {
    default: 'rgba(127, 127, 127, .2)',
    hover: 'rgba(173, 216, 230, .25)',
    selected: 'rgba(173, 216, 230, .7)',
};

@inject('matchStore', 'uiStore')
@observer
export default class ArmyListItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {unitHover: 0};
    }

    select = size => {
        let matchStore = this.props.matchStore;
        let previousSelectedUnits = matchStore.selectedUnits;

        if (Number.isInteger(size)) {
            matchStore.selectedUnits = size;
        }
        else {
            matchStore.selectedUnits = this.props.army.size;
        }

        // If the user clicked on their existing selected, toggle it off
        if (matchStore.selectedUnits == previousSelectedUnits) {
            matchStore.selectedUnits = 0;
        }
    };

    render() {
        let matchStore = this.props.matchStore;
        let army = this.props.army;
        let empire =  this.props.empire;
        // NPC-owned
        if (!empire) {
            empire = {
                id: 0,
                username: 'NPC',
            };
        }
        let isUserEmpire = this.props.matchStore.userEmpire == empire;
        let armyIcons = [];
        let userIsMovingUnits = this.props.uiStore.movingUnits && isUserEmpire;

        for (let i = 0; i < army.size && i < maxDrawnIcons; i++) {

            let buttonStyle = buttonStyles.default;
            if (isUserEmpire) {
                if (i < matchStore.selectedUnits) {
                    buttonStyle = buttonStyles.selected;
                }
                else if (i < this.state.unitHover) {
                    buttonStyle = buttonStyles.hover;
                }
                if (this.state.unitHover > 0 && i < matchStore.selectedUnits && i >= this.state.unitHover) {
                    buttonStyle = buttonStyles.hover;
                }
            }

            armyIcons.push(
               <IconButton
                    key={i}
                    disabled={!isUserEmpire}
                    onClick={() => this.select(i + 1)}
                    onMouseEnter={() => this.setState({unitHover: i + 1})}
                    onMouseLeave={() => this.setState({unitHover: 0})}
                    style={{background: buttonStyle}}>
                    <SvgIcon>
                        <svg x="0px" y="0px" viewBox="0 0 56 70"><path d="M8,56.003c-0.553,0-1-0.447-1-1c0-4.964,4.038-9.002,9.002-9.002c0.553,0,1,0.447,1,1s-0.447,1-1,1      C12.141,48.001,9,51.142,9,55.003C9,55.556,8.553,56.003,8,56.003z"/><path d="M56,56.002c-0.553,0-1-0.447-1-1c0-3.859-3.141-7-7-7c-0.553,0-1-0.447-1-1s0.447-1,1-1c4.963,0,9,4.037,9,9      C57,55.555,56.553,56.002,56,56.002z"/><path d="M24,48.002L24,48.002l-7.998-0.001c-0.553,0-1-0.448-1-1c0-0.553,0.448-1,1-1l0,0L24,46.002c0.553,0,1,0.448,1,1      C25,47.555,24.552,48.002,24,48.002z"/><path d="M48,48.002L48,48.002l-8-0.001c-0.553,0-1-0.448-1-1c0-0.553,0.448-1,1-1l0,0l8,0.001c0.553,0,1,0.448,1,1      C49,47.555,48.552,48.002,48,48.002z"/><path d="M8.001,63c-0.552,0-1-0.447-1-1L7,55.003c0-0.552,0.447-1,1-1c0.552,0,1,0.447,1,1L9.001,62      C9.001,62.552,8.554,63,8.001,63z"/><path d="M9.001,64c-1.103,0-2-0.897-2-2c0-0.553,0.447-1,1-1s1,0.447,1,1v0.002c0.553,0,1,0.446,1,0.999      C10.001,63.553,9.554,64,9.001,64z"/><path d="M55,64c-0.553,0-1-0.447-1-1s0.447-1,1-1h0.002c0-0.553,0.446-1,0.999-1C56.553,61,57,61.447,57,62      C57,63.103,56.103,64,55,64z"/><path d="M56,63c-0.553,0-1-0.447-1-1v-6.998c0-0.553,0.447-1,1-1s1,0.447,1,1V62C57,62.553,56.553,63,56,63z"/><path d="M55,64H9.001c-0.553,0-1-0.447-1-1s0.447-1,1-1H55c0.553,0,1,0.447,1,1S55.553,64,55,64z"/><path d="M24,48.002c-0.553,0-1-0.447-1-1V41.5c0-0.553,0.447-1,1-1s1,0.447,1,1v5.502C25,47.555,24.553,48.002,24,48.002z"/><path d="M40,48.001c-0.553,0-1-0.447-1-1V41.5c0-0.553,0.447-1,1-1s1,0.447,1,1v5.501C41,47.554,40.553,48.001,40,48.001z"/><path d="M31.999,52.002c-0.15,0-0.303-0.034-0.446-0.105l-8-4c-0.494-0.247-0.694-0.848-0.447-1.342     c0.248-0.495,0.849-0.692,1.342-0.447l8,4c0.494,0.247,0.694,0.848,0.447,1.342C32.719,51.8,32.366,52.002,31.999,52.002z"/><path d="M32.001,52.002c-0.367,0-0.72-0.202-0.896-0.553c-0.247-0.494-0.047-1.095,0.447-1.342l8-4.001     c0.493-0.244,1.094-0.047,1.342,0.447c0.247,0.494,0.047,1.095-0.447,1.342l-8,4.001C32.304,51.968,32.151,52.002,32.001,52.002z     "/><path d="M15.999,29c-0.472,0-0.892-0.335-0.981-0.815c-0.103-0.543,0.255-1.065,0.798-1.167l16-3     c0.551-0.103,1.065,0.256,1.167,0.798c0.103,0.543-0.255,1.065-0.798,1.167l-16,3C16.122,28.994,16.06,29,15.999,29z"/><path d="M48.001,29c-0.061,0-0.123-0.006-0.186-0.018l-16-3c-0.543-0.102-0.9-0.624-0.798-1.167     c0.102-0.542,0.619-0.899,1.167-0.798l16,3c0.543,0.102,0.9,0.624,0.798,1.167C48.893,28.665,48.473,29,48.001,29z"/><path d="M47,20c-0.553,0-1-0.447-1-1c0-7.72-6.28-14-14-14s-14,6.28-14,14c0,0.553-0.447,1-1,1s-1-0.447-1-1     c0-8.822,7.178-16,16-16s16,7.178,16,16C48,19.553,47.553,20,47,20z"/><path d="M17,28.813c-0.553,0-1-0.447-1-1V19c0-0.553,0.447-1,1-1s1,0.447,1,1v8.813C18,28.365,17.553,28.813,17,28.813z"/><path d="M47,28.813c-0.553,0-1-0.447-1-1V19c0-0.553,0.447-1,1-1s1,0.447,1,1v8.813C48,28.365,47.553,28.813,47,28.813z"/><path d="M32,22c-0.553,0-1-0.447-1-1V8c0-0.553,0.447-1,1-1s1,0.447,1,1v13C33,21.553,32.553,22,32,22z"/><path d="M32,42c-0.553,0-1-0.447-1-1V30c0-0.553,0.447-1,1-1s1,0.447,1,1v11C33,41.553,32.553,42,32,42z"/><path d="M37,39.188c-0.553,0-1-0.447-1-1V31c0-0.553,0.447-1,1-1s1,0.447,1,1v7.188C38,38.74,37.553,39.188,37,39.188z"/><path d="M42,36.375c-0.553,0-1-0.447-1-1v-3.5c0-0.553,0.447-1,1-1s1,0.447,1,1v3.5C43,35.928,42.553,36.375,42,36.375z"/><path d="M27,39.188c-0.553,0-1-0.447-1-1V31c0-0.553,0.447-1,1-1s1,0.447,1,1v7.188C28,38.74,27.553,39.188,27,39.188z"/><path d="M22,36.375c-0.553,0-1-0.447-1-1v-3.5c0-0.553,0.447-1,1-1s1,0.447,1,1v3.5C23,35.928,22.553,36.375,22,36.375z"/><path d="M16,38c-0.553,0-1-0.447-1-1v-9c0-0.553,0.447-1,1-1s1,0.447,1,1v9C17,37.553,16.553,38,16,38z"/><path d="M31.999,47c-0.166,0-0.334-0.041-0.489-0.129l-16-9c-0.481-0.271-0.652-0.88-0.381-1.361     c0.27-0.481,0.879-0.654,1.361-0.381l16,9c0.481,0.271,0.652,0.88,0.381,1.361C32.688,46.816,32.349,47,31.999,47z"/><path d="M48,38c-0.553,0-1-0.447-1-1v-9c0-0.553,0.447-1,1-1s1,0.447,1,1v9C49,37.553,48.553,38,48,38z"/><path d="M32.001,47c-0.35,0-0.688-0.184-0.872-0.51c-0.271-0.481-0.101-1.091,0.381-1.361l16-9     c0.482-0.272,1.09-0.101,1.361,0.381s0.101,1.091-0.381,1.361l-16,9C32.335,46.959,32.167,47,32.001,47z"/><path d="M28,22h-7c-0.553,0-1-0.447-1-1v-3c0-0.553,0.447-1,1-1h7c0.553,0,1,0.447,1,1v3C29,21.553,28.553,22,28,22z M22,20h5v-1     h-5V20z"/><path d="M43,22h-7c-0.553,0-1-0.447-1-1v-3c0-0.553,0.447-1,1-1h7c0.553,0,1,0.447,1,1v3C44,21.553,43.553,22,43,22z M37,20h5v-1     h-5V20z"/><path d="M51,64c-0.23,0-0.462-0.079-0.65-0.241C43.084,57.531,43,47.429,43,47.002c0-0.552,0.447-0.999,0.999-0.999H44     c0.552,0,0.999,0.446,1,0.998c0,0.096,0.096,9.621,6.65,15.24c0.42,0.359,0.469,0.99,0.108,1.409C51.562,63.882,51.281,64,51,64z     "/><path d="M13,64c-0.281,0-0.562-0.118-0.759-0.35c-0.36-0.419-0.312-1.05,0.108-1.409C18.924,56.605,19,47.098,19,47.002     c0-0.553,0.447-1,1-1s1,0.447,1,1c0,0.427-0.084,10.529-7.35,16.757C13.462,63.921,13.23,64,13,64z"/><path d="M32,55c-0.553,0-1-0.447-1-1v-2.998c0-0.553,0.447-1,1-1s1,0.447,1,1V54C33,54.553,32.553,55,32,55z"/><path d="M37,64c-0.553,0-1-0.447-1-1c0-2.206-1.794-4-4-4s-4,1.794-4,4c0,0.553-0.447,1-1,1s-1-0.447-1-1c0-3.309,2.691-6,6-6     s6,2.691,6,6C38,63.553,37.553,64,37,64z"/></svg>
                    </SvgIcon>
                </IconButton>
            );
        }

        // +X units
        if (army.size > maxDrawnIcons) {

            let buttonStyle = buttonStyles.default;

            if (isUserEmpire) {
                if (matchStore.selectedUnits == army.size) {
                    buttonStyle = buttonStyles.selected;
                }
                else if (army.size == this.state.unitHover) {
                    buttonStyle = buttonStyles.hover;
                }
                if (this.state.unitHover > 0 && matchStore.selectedUnits == army.size && this.state.unitHover < army.size) {
                    buttonStyle = buttonStyles.hover;
                }
            }

            armyIcons.push(
                <IconButton
                    key='extra-units'
                    disabled={!isUserEmpire}
                    onClick={() => this.select(army.size)}
                    onMouseEnter={() => this.setState({unitHover: army.size})}
                    onMouseLeave={() => this.setState({unitHover: 0})}
                    style={{background: buttonStyle}}>
                    {'+' + (army.size - maxDrawnIcons)}
                </IconButton>
            );
        }

        // "X units selected" text
        if (isUserEmpire && matchStore.selectedUnits) {
            armyIcons.push(
                <Typography variant='caption' key='units-selected-text'>
                    {matchStore.selectedUnits} unit{matchStore.selectedUnits != 1 ? 's' : ''} selected
                </Typography>
            );
        }

        // "moving units" text
        if (userIsMovingUnits) {
            armyIcons.push(
                <Typography variant='caption' key='moving-units-text'>
                    Moving units into territory...
                </Typography>
            );
        }

        if (armyIcons.length) {
            return (
                <ListItemText
                    primary={isUserEmpire ? 'Your army' : empire.username + "'s army"}
                    secondary={armyIcons}
                />
            );
        }

        return null;
    }
}
