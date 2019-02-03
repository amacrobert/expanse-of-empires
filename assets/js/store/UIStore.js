import { observable, computed, action } from 'mobx';

class UIStore {

	constructor() {
		console.log('CONSTRUCTING UI STORE');
		this.clearUI();
		console.log(this.buttons);
	}

	// Track the disabled state of buttons
	@observable buttons;

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
	};
}

export default UIStore;
