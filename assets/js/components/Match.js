import React from 'react';
import _ from 'underscore';
import update from 'immutability-helper';
import Api from '../services/api';
import MatchUtil from '../services/match-util';
import MapViewport from './MapViewport';
import MatchHud from './MatchHud';
import Chat from './Chat';
import MatchStore from '../store/MatchStore';
import { observer } from 'mobx-react';


@observer
class Match extends React.Component {

    constructor(props) {
        super(props);
        this.startSocket();

        this.state = {
            focus: null,
            map: {name: 'Loading', state: null},
            empiresById: {},
            selectedTerritory: null,
        };
    }

    componentWillMount() {
        MatchStore.fetchMatch(this.props.match);
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
                    console.log('territory update:', message.territory);
                    this.updateTerritory(message.territory);
                    break;
            }
        });

        this.socket.onopen = () => {
            this.socketSend({action: 'iam'});
        };

        this.socket.onerror = (error) => {
            this.startSocket(true);
        };
    };

    updateTerritory = (newTerritory) => {
        let empiresById = this.state.empiresById;
        let map = this.state.map;
        const index = _.findIndex(map.state, (t) => (t.id == newTerritory.id));
        let oldTerritory = Object.assign(map.state[index]);
        map.state[index] = newTerritory;

        if (empiresById[oldTerritory.empire_id]) {
            empiresById[oldTerritory.empire_id.territory_count]--;
        }
        if (empiresById[newTerritory.empire_id]) {
            empiresById[newTerritory.empire_id.territory_count]++;
        }

        this.setState({map: map});
        this.setState({empiresById: empiresById});

        // Update HUD if updated territory is selected
        if (this.state.selectedTerritory && this.state.selectedTerritory.id === newTerritory.id) {
            this.setState({ selectedTerritory: newTerritory });
        }
    };

    socketSend = (message) => {
        if (this.socket.readyState !== WebSocket.OPEN) {
            console.log('Attempting to reconnect to socket server...');
            this.startSocket(true);

            window.setTimeout(() => {
                this.socketSend(message)
            }, 1000);
        }
        else {
            message.token = this.props.user.token;
            message.match_id = this.props.match.id;

            this.socket.send(JSON.stringify(message));
        }

    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleExit = () => {
        this.props.onExit();
    };

    onTerritorySelect = (coordinates) => {
        if (coordinates) {
            const territory = MatchUtil.getTerritory(MatchStore.map.state, coordinates.q, coordinates.r);
            this.setState({ selectedTerritory: territory });
            console.log(territory);
        }
        else {
            this.setState({ selectedTerritory: null });
        }
    };

    setFocus = (focus = null) => {
        this.setState({focus: focus});
    };

    startEmpire = () => {
        this.socketSend({
            action: 'empire-start',
            territory_id: this.state.selectedTerritory.id,
        });
    };

    render() {

        const match = MatchStore.match;

        return MatchStore.map.state ? (
            <div className="match-container">
                <MapViewport
                    user={this.props.user}
                    inFocus={this.state.focus !== 'chat'}
                    setFocus={this.setFocus}
                    map={MatchStore.map}
                    match={MatchStore.match}
                    selectedTerritory={this.state.selectedTerritory}
                    onTerritorySelect={this.onTerritorySelect} />
                <MatchHud
                    user={this.props.user}
                    match={MatchStore.match}
                    socket={this.socket}
                    selectedTerritory={this.state.selectedTerritory}
                    empires={MatchStore.empires}
                    empiresById={MatchStore.empiresById}
                    startEmpire={this.startEmpire} />
                <Chat
                    user={this.props.user}
                    match={this.props.match}
                    onChatSubmit={this.socketSend}
                    socket={this.socket}
                    setFocus={this.setFocus} />
            </div>
         ) : (
            <div className="row">
                <div className="col-md-12">
                    Loading...
                </div>
            </div>
        );
    }
}

export default Match;
