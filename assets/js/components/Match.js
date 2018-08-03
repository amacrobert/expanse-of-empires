import React from 'react';
import Chat from './Chat';
import MapViewport from './MapViewport';

class Match extends React.Component {

    constructor(props) {
        super(props);
        this.socketApi = new WebSocket('ws://127.0.0.1:8080');

        this.state = {
            focus: null,
        };
    }

    componentDidMount() {
        this.socketApi.onopen = () => {
            this.socketApiSend({action: 'iam'});
        };

        this.socketApi.onerror = (error) => {
            console.log('error');
        };
    }

    socketApiSend = (message) => {
        if (!this.socketApi.readyState) {
            return;
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

        return(
            <div className="row">
                <MapViewport
                    inFocus={this.state.focus !== 'chat'}
                    setFocus={this.setFocus}
                />
                <Chat
                    user={this.props.user}
                    match={this.props.match}
                    onChatSubmit={this.socketApiSend}
                    socketApi={this.socketApi}
                    setFocus={this.setFocus} />
            </div>
        );
    }
}

export default Match;
