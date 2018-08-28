import React from 'react';
import TerritoryHud from './TerritoryHud';
import MatchInfo from './MatchInfo';
import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
export default class MatchHud extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return [(
            <TerritoryHud
                socket={this.props.socket}
                startEmpire={this.props.startEmpire}
                key="mh1" />
        ), (
            <MatchInfo
                key="mh2" />
        )];
    }
}
