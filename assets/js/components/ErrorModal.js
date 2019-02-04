import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

@inject('uiStore')
@observer
export default class ErrorModal extends Component {

    constructor(props) {
        super(props);
    }

    onClose = () => {
        this.props.uiStore.clearUI();
    };

    render() {
        return (
            <div>
                <Dialog
                    open={this.props.uiStore.error ? true : false}
                    onClose={this.onClose}>
                    <DialogTitle>Error</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.props.uiStore.error}
                        </DialogContentText>
                        <DialogActions>
                            <Button onClick={this.onClose} color="primary">
                                OK
                            </Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
}
