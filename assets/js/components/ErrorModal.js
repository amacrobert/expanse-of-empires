import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

@inject('matchStore')
@observer
export default class ErrorModal extends Component {

    render() {
        if (!this.props.matchStore.error) {
            return null;
        }

        return (
            <div className='match-error-modal'>
                <p>Error</p>
                <p>{this.props.matchStore.error}</p>
                <button onClick={() => this.props.matchStore.error = null}>Close</button>
            </div>
        );
    }
}
