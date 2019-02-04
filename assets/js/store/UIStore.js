import { observable, computed, action } from 'mobx';

class UIStore {

    constructor() {
        this.clearUI();
    }

    @observable buttons;
    @observable error;

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

        this.error = null;
    };
}

export default UIStore;
