import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from '@material-ui/core/LinearProgress';

@inject('uiStore')
@observer
export default class ConnectingOverlay extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        let ui = this.props.uiStore;

        return (
            <Dialog
                open={ui.showConnectingOverlay}
                onClose={null}>
                <DialogTitle>Connecting</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {ui.connectingMessage}
                    </DialogContentText>
                    <LinearProgress />
                </DialogContent>
            </Dialog>
        );
    }
}
