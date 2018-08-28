import { observable, computed, action } from 'mobx';
import Api from '../services/api';

class UserStore {
    @observable user = {loaded: false};

    @action fetchUser = () => {
        Api.getUser().then(user => {
            user.loaded = true;
            user.loggedIn = user.id ? true : false;
            this.user = user;
        });
    };
}

export default UserStore;
