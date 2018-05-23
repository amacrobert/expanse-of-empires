import React from 'react';

class ModalHeader extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle">{this.props.children}</h5>
                {this.props.close !== false && 
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                }
            </div>
        );
    }
}

export default ModalHeader;
