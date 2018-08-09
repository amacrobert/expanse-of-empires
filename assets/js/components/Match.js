import React from 'react';
import Chat from './Chat';
import MapViewport from './MapViewport';
import Api from './Api';

class Match extends React.Component {

    constructor(props) {
        super(props);
        this.socketApi = new WebSocket('ws://127.0.0.1:8080');

        this.state = {
            focus: null,
            map: {name: 'Loading', state: null},
        };
    }

    componentDidMount() {

        Api.getMatchMap(this.props.match.id).then(map => {
            this.setState({map: map});
        });

        this.socketApi.onopen = () => {
            this.socketApiSend({action: 'iam'});
        };

        this.socketApi.onerror = (error) => {
            console.log('error');
        };
    }

    socketApiSend = (message) => {
        if (!this.socketApi.readyState) {
            this.socketApi = new WebSocket('ws://127.0.0.1:8080');
        }

        message.token = this.props.user.token;
        message.match_id = this.props.match.id;

        this.socketApi.send(JSON.stringify(message));
    }

    componentWillUnmount() {
        this.socketApi.close();
    }

    handleExit = () => {
        this.props.onExit();
    };

    setFocus = (focus = null) => {
        this.setState({focus: focus});
    };

    render() {
        const match = this.props.match;

        return this.state.map.state ? (
            <div className="row">
                <MapViewport
                    inFocus={this.state.focus !== 'chat'}
                    setFocus={this.setFocus}
                    map={this.state.map} />
                <Chat
                    user={this.props.user}
                    match={this.props.match}
                    onChatSubmit={this.socketApiSend}
                    socketApi={this.socketApi}
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
