import React from 'react';
import ReactDOM from 'react-dom';
import ChatLine from './ChatLine';
import Api from '../services/api';
import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
class Chat extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lines: [],
            open: false,
            chatInput: '',
        };

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

        this.props.matchStore.socket.addEventListener('message', (payload) => {
            const message = JSON.parse(payload.data);

            switch (message.action) {
                case 'chat-join':
                case 'chat-receive':
                    this.addLine(message);
                    break;
            }
        });
    }

    addLine = (line) => {
        this.setState({lines: this.state.lines.concat(line)});
        this.scrollToBottom();
    };

    scrollToBottom = (snap = false) => {
        if (this.state.open) {
            const options = snap ? {} : { behavior: 'smooth' };
            this.chatEnd.current.scrollIntoView(options);
        }
    };

    handleChatSubmit = (e) => {
        e.preventDefault();

        if (this.state.chatInput.length) {
            this.props.onChatSubmit({
                'action': 'chat-send',
                'message': this.state.chatInput,
            });
        }

        this.state.chatInput = '';
    };

    toggleOpen = () => {
        this.setState({
            open: !this.state.open,
        }, () => this.scrollToBottom(true));
    };

    render() {

        const lines = this.state.lines.map((message, index) => {
            return (
                <ChatLine message={message} key={index}/>
            );
        });

        const inputField = (
            <form onSubmit={this.handleChatSubmit}>
                <input
                    type="text"
                    value={this.state.chatInput}
                    onChange={e => this.setState({chatInput: e.target.value})}
                    className="chat-input"
                    placeholder="Public chat"
                    onFocus={() => this.props.setFocus('chat')}
                    onBlur={() => this.props.setFocus()}
                    />
            </form>
        );

        let chatCollapseClass = ['chat-collapse'];
        if (this.state.open) {
            chatCollapseClass.push('show');
        }

        return (
            <div className="chat">
                <div className="chat-header" onClick={this.toggleOpen}>
                    Public Chat
                </div>
                <div className={chatCollapseClass.join(' ')}>
                    <div className="chat-screen" onClick={(e) => {e.preventDefault(); this.chatInput.current.focus()}}>
                        { lines }
                        <div style={{ float: 'left', clear: "both" }} ref={this.chatEnd}></div>
                    </div>
                    { this.props.user.loggedIn && inputField }
                </div>
            </div>
        );
    }
}

export default Chat;
