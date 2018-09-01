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

@inject('matchStore', 'userStore')
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
                    break;

                case 'error':
                    this.props.matchStore.error = message.message;
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

    render() {

        if (!this.props.matchStore.loaded) {
            return (
                <div className="row">
                    <div className="col-md-12 text-center mt-5">
                        Loading...
                    </div>
                </div>
            );
        }

        return (
            <div className="match-container">
                <MapViewport
                    inFocus={this.state.focus !== 'chat'}
                    setFocus={this.setFocus}
                    onTerritorySelect={this.onTerritorySelect} />
                <MatchHud />
                <TerritoryHud
                    startEmpire={this.startEmpire} />
                {this.socket && <Chat
                    user={this.props.userStore.user}
                    match={this.props.matchStore.match}
                    onChatSubmit={this.socketSend}
                    socket={this.socket}
                    setFocus={this.setFocus} /> }
                <ErrorModal />
            </div>
        );
    }
}

export default Match;
