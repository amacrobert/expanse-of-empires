import React from 'react';

class Alert extends React.Component {

    constructor(props) {
        super(props);

        this.alertClasses = [
            'alert',
            'alert-danger',
            'fade',
            'show',
        ];

        if (this.props.dismissable) {
            this.alertClasses.push('alert-dismissible');
        }
    }

    render() {
        return(
            <div className={this.alertClasses.join(' ')} role="alert">
                {this.props.message}
                {this.props.dismissable &&
                    <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                }
            </div>
        );
    }
}

export default Alert;
