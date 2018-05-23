import React from 'react';
import ModalHeader from './ModalHeader';
import ModalBody from './ModalBody';
import ModalFooter from './ModalFooter';

class Modal extends React.Component {

    constructor(props) {
        super(props);

        this.modalDialogClasses = [
            'modal-dialog',
            'modal-dialog-centered',
        ];

        if (this.props.size == 'small') {
            this.modalDialogClasses.push('modal-sm');
        }
    }

    render() {
        return(
            <div className="modal fade" id={this.props.id} tabIndex="-1" role="dialog" aria-hidden="true">
                <div className={this.modalDialogClasses.join(' ')} role="document">
                    <div className="modal-content">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
