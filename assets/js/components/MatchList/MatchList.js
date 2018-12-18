import React from 'react';
import ReactDOM from 'react-dom';
import MatchListSection from './MatchListSection';
import Api from '../../services/api';
import { observer, inject } from 'mobx-react';
import { computed } from 'mobx';

import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import Typography from '@material-ui/core/Typography';

@inject('matchStore')
@observer
class MatchList extends React.Component {

    @computed get matches() {
        const matches = {
            'joined': [],
            'pre-registration': [],
            'registration': [],
            'non-player-combat': [],
            'expanse-of-empires': [],
            'complete': [],
        };

        this.props.matchStore.matchList.forEach((match) => {
            if (match.user_joined) {
                matches['joined'].push(match);
            }
            else {
                matches[match.phase].push(match);
            }
        });

        return matches;
    };

    render() {

        const otherMatchesText = this.matches['joined'].length ? 'OTHER MATCHES' : 'MATCHES';

        if (this.props.matchStore.matchList.length) {
            return ([
                <MatchListSection
                    {...this.props}
                    key="msl-your-matches"
                    title="Your active matches"
                    matches={this.matches['joined']}
                    display="card" />,
                <Typography variant="h6" gutterBottom={true} key="ml-header-other">
                    {otherMatchesText}
                </Typography>,
                <Paper key="ml-table-container">
                    <Table padding='dense'>
                        <MatchListSection
                            {...this.props}
                            key="msl-registration"
                            title="Registration open"
                            matches={this.matches['registration']} />
                        <MatchListSection
                            {...this.props}
                            key="msl-opening-soon"
                            title="Opening soon"
                            matches={this.matches['pre-registration']} />
                        <MatchListSection
                            {...this.props}
                            key="msl-play-started"
                            title="Play started"
                            matches={this.matches['expanse-of-empires'].concat(this.matches['non-player-combat'])} />
                        <MatchListSection
                            {...this.props}
                            key="msl-completed"
                            title="Previous matches"
                            matches={this.matches['complete']} />
                    </Table>
                </Paper>,
            ]);
        }
        else {
            return (<p>Loading matches...</p>)
        }
    }
}

export default MatchList;
