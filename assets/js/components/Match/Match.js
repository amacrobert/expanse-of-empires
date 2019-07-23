import React, { Component } from 'react';
import _ from 'underscore';
import update from 'immutability-helper';
import MatchUtil from '../../services/match-util';
import MapViewport from './MapViewport';
import TerritoryHud from './TerritoryHud';
import PathingHud from './PathingHud';
import MatchHud from './MatchHud';
import Chat from '../Chat';
import ErrorModal from './ErrorModal';
import ConnectingOverlay from './ConnectingOverlay';
import Pathing from '../../services/pathing';
import { toJS } from 'mobx';
import { observer, inject } from 'mobx-react';

import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withSnackbar } from 'notistack';

@inject('userStore', 'matchStore', 'uiStore')
@observer
class Match extends Component {

    constructor(props) {
        super(props);

        this.state = {
            focus: null,
        };
    }

    componentDidMount() {
        let ui = this.props.uiStore;
        let matchId = this.props.match.params.matchId;
        ui.connectingMessage = 'Connecting to server';
        ui.showConnectingOverlay = true;

        this.props.matchStore.setMatch(matchId).then(() => {
            console.log(this.props.matchStore);
            this.startSocket();
        });
    }

    startSocket = () => {

        this.props.matchStore.socket = new WebSocket('ws://127.0.0.1:8080');
        let socket = this.props.matchStore.socket;

        socket.addEventListener('message', (payload) => {
            const matchStore = this.props.matchStore;
            const uiStore = this.props.uiStore;
            const message = JSON.parse(payload.data);

            console.log('Received socket message:', message);

            let updates = message.updates;
            let newSupply = 0;
            let newTide = 0;
            if (updates) {
                if (updates.empires) {
                    updates.empires.forEach(empire => matchStore.updateEmpire(empire));
                }

                if (updates.territories) {
                    updates.territories.forEach(territory => matchStore.updateTerritory(territory));
                }

                if (updates.resources) {
                    let resources = updates.resources;
                    newSupply = message.updates.resources.supply - this.props.matchStore.supply;
                    newTide = message.updates.resources.tide - this.props.matchStore.tide;

                    if (resources.supply) {
                        matchStore.updateSupply(resources.supply);
                    }

                    if (resources.tide) {
                        matchStore.updateTide(resources.tide);
                    }
                }
            }

            switch (message.action) {
                case 'new-empire':
                    let newEmpire = message.updates.empires[0];
                    this.props.enqueueSnackbar(newEmpire.username + ' joined the match');
                    break;

                case 'resources-distributed':
                    this.props.enqueueSnackbar(
                        'Resources distributed. +' +
                        Math.floor(newSupply*100)/100 + 'S +' +
                        Math.floor(newTide*100)/100 + 'T'
                    );
                    break;

                case 'army-trained':
                    uiStore.enableButton('train-army');
                    break;

                case 'units-moved':
                    this.props.enqueueSnackbar(
                        'Units moved'
                    );
                    uiStore.movingUnits = false;
                    break;

                case 'territory-attacked':
                    this.props.enqueueSnackbar(
                        'Attack!'
                    );
                    uiStore.attackOutput = message.output;
                    uiStore.attacking = false;
                    // if won, select the newly gained territory
                    if (message.output.territory_taken) {
                        matchStore.setSelectedTerritory(matchStore.territoriesById[message.output.defending_territory_id]);
                    }
                    break;

                case 'error':
                    uiStore.clearUI();
                    uiStore.errorMessage = message.message;
                    uiStore.showError = true;
                    break;
            }
        });

        socket.onopen = () => {
            let ui = this.props.uiStore;

            ui.connectingMessage = 'Loading game state';
            this.props.matchStore.refreshMatch().then(() => {
                ui.showConnectingOverlay = false;
                ui.connectingMessage = null;
            });
            this.socketSend({action: 'iam'});
        };

        socket.onclose = () => {
            let ui = this.props.uiStore;
            ui.connectingMessage = 'Re-establishing connection to the server';
            ui.showConnectingOverlay = true;
            this.attemptReconnect();
        }

        socket.onerror = () => {
        }
    };

    socketSend = (message) => {
        let user = this.props.userStore.user;
        let socket = this.props.matchStore.socket;
        if (socket.readyState !== WebSocket.OPEN) {
            this.attemptReconnect(message);
        }
        else {
            message.token = this.props.userStore.user.token;
            message.match_id = this.props.matchStore.match.id;

            console.log('sending:', message);
            socket.send(JSON.stringify(message));
        }
    };

    attemptReconnect = (message) => {
        console.log('Attempting to reconnect to socket server...');

        window.setTimeout(() => {
            this.startSocket();
            if (message) {
                this.socketSend(message)
            }
        }, 1000);
    };

    componentWillUnmount() {
        this.props.matchStore.socket.close();
        this.props.matchStore.clearMatch();
    }

    onTerritorySelect = (coordinates) => {

        let matchStore = this.props.matchStore;
        let selectedTerritory = matchStore.selectedTerritory;
        let path = matchStore.path;

        if (coordinates) {

            let territory = MatchUtil.getTerritory(matchStore.map.state, coordinates.q, coordinates.r);

            // De-select if user clicks the existing selection
            if (territory == selectedTerritory) {
                matchStore.setSelectedTerritory(null);
            }
            // Move units
            else if (path && path.type == 'move') {

                this.props.uiStore.movingUnits = true;
                let units = matchStore.selectedUnits;
                let path = matchStore.path.nodes.map(territory => territory.id);

                matchStore.setSelectedTerritory(territory);
                matchStore.setSelectedUnits(0);

                this.socketSend({
                    action: 'move-units',
                    units,
                    path,
                });
            }
            else if (path && path.type == 'attack') {
                this.props.uiStore.attacking = true;
                let units = matchStore.selectedUnits;
                let path = matchStore.path.nodes.map(territory => territory.id);

                matchStore.setSelectedUnits(0);

                this.socketSend({
                    action: 'attack',
                    units,
                    path,
                });
            }
            // Normal selection
            else {
                matchStore.setSelectedTerritory(territory);
                console.log(toJS(territory));
            }
        }
        else {
            matchStore.setSelectedTerritory(null);
        }
    };

    onTerritoryHover = (coordinates) => {
        let matchStore = this.props.matchStore;

        if (coordinates) {
            const territory = MatchUtil.getTerritory(matchStore.map.state, coordinates.q, coordinates.r);
            matchStore.setHoverTerritory(territory);
        }
        else {
            matchStore.setHoverTerritory(null);
        }

        // If units are selected and the hovering territory is different from the selected territory, calculate a route
        if (matchStore.selectedUnits > 0 && matchStore.hoverTerritory != matchStore.selectedTerritory) {
            Pathing.calculate(matchStore);
        }
        else if (matchStore.path && matchStore.path.type) {
            matchStore.clearPath();
        }

    }

    setFocus = (focus = null) => {
        this.setState({focus: focus});
    };

    startEmpire = () => {
        let territory = this.props.matchStore.selectedTerritory;

        this.socketSend({
            action: 'empire-start',
            territory_id: territory.id,
        });
    };

    trainSoldier = () => {
        let territory = this.props.matchStore.selectedTerritory;

        this.socketSend({
            action: 'train-army',
            territory_id: territory.id,
        });
    };

    render() {

        const loaded = this.props.matchStore.loaded;
        const socket = this.props.matchStore.socket;
        const path = this.props.matchStore.path;

        let cursor = 'auto';
        if (path) {
            if (path.type == 'move') {
                cursor = 's-resize';
            }
            else if (path.type == 'attack') {
                cursor = 'crosshair';
            }
        }

        return (
            <Grid container spacing={0} style={{cursor}}>

                <ConnectingOverlay />

                {loaded &&
                    <Grid item xs={12}>
                        <MapViewport
                            inFocus={this.state.focus !== 'chat'}
                            setFocus={this.setFocus}
                            onTerritorySelect={this.onTerritorySelect}
                            onTerritoryHover={this.onTerritoryHover} />

                        <MatchHud />

                        <TerritoryHud
                            startEmpire={this.startEmpire}
                            trainSoldier={this.trainSoldier} />

                        {path && path.type &&
                            <PathingHud />
                        }

                        {/*socket && <Chat
                            user={this.props.userStore.user}
                            match={this.props.matchStore.match}
                            onChatSubmit={this.socketSend}
                            setFocus={this.setFocus} />
                        */}

                        <ErrorModal />
                    </Grid>
                }
            </Grid>
        );
    }
}

export default withSnackbar(Match);
