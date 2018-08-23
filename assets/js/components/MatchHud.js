import React from 'react';
import TerritoryHud from './TerritoryHud';
import MatchInfo from './MatchInfo';

export default class MatchHud extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return [(
            <TerritoryHud
                territory={this.props.selectedTerritory}
                empiresById={this.props.empiresById}
                user={this.props.user}
                socket={this.props.socket}
                match={this.props.match}
                startEmpire={this.props.startEmpire}
                key="mh1" />
        ), (
            <MatchInfo
                user={this.props.user}
                match={this.props.match}
                empires={this.props.empires}
                key="mh2" />
        )];
    }
}
