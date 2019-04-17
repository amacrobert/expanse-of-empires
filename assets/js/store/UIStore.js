import { observable, computed, action } from 'mobx';

class UIStore {

    constructor() {
        this.clearUI();
    }

    @observable error;
    @observable buttons;
    @observable showConnectingOverlay = false;
    @observable connectingMessage;

    @action enableButton = (button) => {
        this.buttons[button].disabled = false;
    };

    @action disableButton = (button) => {
        this.buttons[button].disabled = true;
    };

    @action clearUI = () => {
        this.buttons = {
            'start-empire': {disabled: false},
            'train-army': {disabled: false},
        };

        this.showConnectingOverlay = false;
        this.connectingMessage = null;
        this.error = null;
    };
}

export default UIStore;
