import React from 'react';
import { observer, inject } from 'mobx-react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Grow from '@material-ui/core/Grow';

@inject('matchStore', 'uiStore')
@observer
export default class AttackOutput extends React.Component {

    getFontSize = score => {
        let minSize = 0.8;
        let maxSize =  1.4;
        let size = (score / 100 * (maxSize - minSize)) + minSize;
        return size + 'rem';
    }

    render() {
        if (!this.props.uiStore.attackOutput) {
            return null;
        }


        let output = this.props.uiStore.attackOutput;
        let outcomes = output.outcomes;

        let outcomeTableRows = outcomes.map((outcome, index) => {

            let attackerStyle, defenderStyle, symbol;

            if (outcome.winner == 'attacker') {
                attackerStyle = 'victorious';
                defenderStyle = 'defeated';
                symbol = '>';
            }
            else if (outcome.winner == 'defender') {
                attackerStyle = 'defeated';
                defenderStyle = 'victorious';
                symbol = '<';
            }
            else if (outcome.winner == 'draw') {
                attackerStyle = 'defeated';
                defenderStyle = 'defeated';
                symbol = '-';
            }

            return (
                <TableRow key={index}>
                    <TableCell  component="th" scope="row" align="right">
                        <span className={attackerStyle} style={{fontSize: this.getFontSize(outcome.attack_score)}}>
                            {outcome.attack_score}
                        </span>
                    </TableCell>
                    <TableCell align="center">
                        {symbol}
                    </TableCell>
                    <TableCell align="left">
                        <span className={defenderStyle} style={{fontSize: this.getFontSize(outcome.defense_score)}}>
                            {outcome.defense_score}
                        </span>
                    </TableCell>
                </TableRow>
            );
        });

        return (
            <Grow in={!this.props.uiStore.attacking} collapsedHeight="0px"><Paper>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={4} align="center" size="small">
                                {output.territory_taken &&
                                    <span style={{color: 'lightblue', fontSize: '1rem'}}>ATTACKER TAKES TERRITORY!</span>
                                }
                                {!output.territory_taken &&
                                    <span style={{color: 'pink', fontSize: '1rem'}}>DEFENDER HOLDS TERRITORY</span>
                                }
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">Attacker</TableCell>
                            <TableCell style={{}}></TableCell>
                            <TableCell align="left">Defender</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell align="right">
                                <span>-{output.defeated_attack_units} units</span>
                            </TableCell>
                            <TableCell style={{}}></TableCell>
                            <TableCell align="left">
                                <span>-{output.defeated_defense_units} units</span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={4} align="center">
                                Battle
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {outcomeTableRows}
                    </TableBody>
                </Table>
            </Paper></Grow>
        );
    }
}
