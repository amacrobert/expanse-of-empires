import React, { Component } from 'react';
import _ from 'underscore';
import update from 'immutability-helper';
import Api from '../services/api';
import MatchUtil from '../services/match-util';
import MapViewport from './MapViewport';
import TerritoryHud from './TerritoryHud';
import MatchHud from './MatchHud';
import Chat from './Chat';
import ErrorModal from './ErrorModal';
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
            selectedTerritory: null,
        };
    }

    componentDidMount() {
        let matchId = this.props.match.params.matchId;
        this.props.matchStore.setMatch(matchId).then(() => {
            console.log(this.props.matchStore);
            this.startSocket();
        });
    }

    startSocket = (close = false) => {
        if (close) {
            this.socket.close();
        }

        this.socket = new WebSocket('ws://127.0.0.1:8080');

        this.socket.addEventListener('message', (payload) => {
            const message = JSON.parse(payload.data);
            console.log('Received socket message:', message);

            switch (message.action) {
                case 'territory-update':
                    this.updateTerritory(message.territory);
                    break;

                case 'new-empire':
                    this.props.matchStore.newEmpire(message.empire);
                    this.props.matchStore.supply = message.supply;
                    this.props.matchStore.tide = message.tide;
                    this.props.enqueueSnackbar(message.empire.username + ' joined the match');
                    break;

                case 'update-resources':
                    let newSupply = message.supply - this.props.matchStore.supply;
                    let newTide = message.tide - this.props.matchStore.tide;
                    this.props.matchStore.supply = message.supply;
                    this.props.matchStore.tide = message.tide;
                    this.props.enqueueSnackbar(
                        'Resources distributed. +' +
                        Math.floor(newSupply*100)/100 + 'S +' +
                        Math.floor(newTide*100)/100 + 'T'
                    );
                    break;

                case 'army-trained':
                    this.props.matchStore.supply = message.supply;
                    this.props.matchStore.tide = message.tide;
                    this.props.uiStore.enableButton('train-army');
                    break;

                case 'error':
                    this.props.uiStore.error = message.message;
                    break;
            }
        });

        this.socket.onopen = () => {
            this.socketSend({action: 'iam'});
        };

        this.socket.onerror = (error) => {
            this.attemptReconnect();
        };
    };

    updateTerritory = (newTerritory) => {
        let empiresById = this.props.matchStore.empiresById;
        let map = this.props.matchStore.map;
        const index = _.findIndex(map.state, (t) => (t.id == newTerritory.id));
        let oldTerritory = Object.assign(map.state[index]);
        map.state[index] = newTerritory;

        if (empiresById[oldTerritory.empire_id]) {
            empiresById[oldTerritory.empire_id.territory_count]--;
        }
        if (empiresById[newTerritory.empire_id]) {
            empiresById[newTerritory.empire_id.territory_count]++;
        }

        // Update HUD if updated territory is selected
        if (this.state.selectedTerritory && this.state.selectedTerritory.id === newTerritory.id) {
            this.setState({ selectedTerritory: newTerritory });
        }
    };

    socketSend = (message) => {
        let user = this.props.userStore.user;
        if (this.socket.readyState !== WebSocket.OPEN) {
            this.attemptReconnect(message);
        }
        else {
            message.token = this.props.userStore.user.token;
            message.match_id = this.props.matchStore.match.id;

            console.log('sending:', message);
            this.socket.send(JSON.stringify(message));
        }
    };

    attemptReconnect = (message) => {
        console.log('Attempting to reconnect to socket server...');
        window.setTimeout(() => {
            this.startSocket(true);
            if (message) {
                this.socketSend(message)
            }
        }, 1000);
    };

    componentWillUnmount() {
        this.socket.close();
        this.props.matchStore.clearMatch();
    }

    onTerritorySelect = (coordinates) => {
        if (coordinates) {
            const territory = MatchUtil.getTerritory(this.props.matchStore.map.state, coordinates.q, coordinates.r);
            this.props.matchStore.setSelectedTerritory(territory);
            console.log(toJS(territory));
        }
        else {
            this.props.matchStore.setSelectedTerritory(null);
        }
    };

    setFocus = (focus = null) => {
        this.setState({focus: focus});
    };

    startEmpire = () => {
        this.socketSend({
            action: 'empire-start',
            territory_id: this.props.matchStore.selectedTerritory.id,
        });
    };

    trainSoldier = () => {
        this.socketSend({
            action: 'train-army',
            territory_id: this.props.matchStore.selectedTerritory.id,
        });
    };

    render() {

        const loaded = this.props.matchStore.loaded;

        return (
            <Grid container spacing={0}>

                {!loaded &&
                    <Grid item xs={12} style={{textAlign: 'center', marginTop: 120}}>
                        <CircularProgress
                            size={80} />
                    </Grid>
                }

                {loaded &&
                    <Grid item xs={12}>
                        <MapViewport
                            inFocus={this.state.focus !== 'chat'}
                            setFocus={this.setFocus}
                            onTerritorySelect={this.onTerritorySelect} />

                        <MatchHud />

                        <TerritoryHud
                            startEmpire={this.startEmpire}
                            trainSoldier={this.trainSoldier} />

                        {this.socket && <Chat
                            user={this.props.userStore.user}
                            match={this.props.matchStore.match}
                            onChatSubmit={this.socketSend}
                            socket={this.socket}
                            setFocus={this.setFocus} />
                        }
                        <ErrorModal />
                    </Grid>
                }
            </Grid>
        );
    }
}

export default withSnackbar(Match);
