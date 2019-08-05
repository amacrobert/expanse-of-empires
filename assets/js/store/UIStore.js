import { observable, computed, action } from 'mobx';

class UIStore {

    constructor() {
        this.clearUI();
    }

    @observable showError = false;
    @observable errorMessage;
    @observable buttons;
    @observable showConnectingOverlay = false;
    @observable connectingMessage;
    @observable movingUnits = false;
    @observable attacking = false;
    @observable attackOutput;
    @observable cameraTargetTerritory;

    @action lookAtTerritory = (territory) => {
        this.cameraTargetTerritory = territory;
    };

    @action clearCameraTarget = () => {
        this.cameraTargetTerritory = null;
    };

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

        this.movingUnits = false;
        this.attacking = false;
        this.showConnectingOverlay = false;
        this.connectingMessage = null;
        this.showError = false;
        this.attackOutput = null;
    };
}

export default UIStore;
