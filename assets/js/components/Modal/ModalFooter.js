import React from 'react';

class ModalFooter extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className="modal-footer">
                {this.props.children}
            </div>
        );
    }
}

export default ModalFooter;
