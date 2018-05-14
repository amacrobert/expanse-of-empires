import React from 'react';

class ChatLine extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const message = this.props.message;
        const user = message.user;
        let line = '';

        return (
            <div key={this.props.message.id} className={'chat-line ' + message.action}>
                {'chat-join' == message.action && this.renderChatJoin()}
                {('chat-receive' == message.action || !message.action) && this.renderChatReceive()}
            </div>
        );
    }

    renderChatReceive() {
        return (
            <span>
                <strong>{this.props.message.user.username}</strong>: {this.props.message.message}
            </span>
        );
    }

    renderChatJoin() {
        return (
            <span>
                <strong>{this.props.message.user.username}</strong> joined
            </span>
        );
    }
}

export default ChatLine;
