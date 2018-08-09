import React from 'react';
import ReactDOM from 'react-dom';
import ChatLine from './ChatLine';
import Api from './Api';

class Chat extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lines: []
        };

        this.chatInput = React.createRef();
        this.chatEnd = React.createRef();
    }

    componentDidMount() {

        Api.getMatchChat(this.props.match.id)
        .then((data) => {
            data.forEach((line) => {
                this.addLine(line);
            })

            this.scrollToBottom(true);
        })

        this.props.socketApi.addEventListener('message', (payload) => {
            const message = JSON.parse(payload.data);

            switch (message.action) {
                case 'chat-join':
                case 'chat-receive':
                    this.addLine(message);
                    break;
            }
        });
    }

    addLine(line) {
        this.setState({lines: this.state.lines.concat(line)});
        this.scrollToBottom();
    }

    scrollToBottom(snap = false) {
        const options = snap ? {} : { behavior: 'smooth' };
        this.chatEnd.current.scrollIntoView(options);
    }

    handleChatSubmit = (e) => {
        e.preventDefault();

        const chatInput = this.chatInput.current.value;

        if (chatInput.length) {
            this.props.onChatSubmit({
                'action': 'chat-send',
                'message': chatInput
            });
        }

        this.chatInput.current.value = '';
    }

    render() {
        const lines = this.state.lines.map((message, index) => {
            return (
                <ChatLine message={message} key={index}/>
            );
        });

        return(
            <div className="col-md-4">
                <div className="chat-screen" onClick={(e) => {e.preventDefault(); this.chatInput.current.focus()}}>
                    {lines}
                    <div style={{ float: 'left', clear: "both" }} ref={this.chatEnd}></div>
                </div>
                {this.props.user.loggedIn &&
                    <form onSubmit={this.handleChatSubmit}>
                        <input
                            type="text"
                            ref={this.chatInput}
                            className="chat-input"
                            placeholder="Public chat"
                            onFocus={() => this.props.setFocus('chat')}
                            onBlur={() => this.props.setFocus()}
                            />
                    </form>
                }
            </div>
        );
    }
}

export default Chat;
