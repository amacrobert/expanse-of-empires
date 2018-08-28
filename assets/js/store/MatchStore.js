import { observable, computed, action } from 'mobx';
import Api from '../services/api';
import _ from 'underscore';

class MatchStore {

    constructor(userStore) {
        this.userStore = userStore;
        this.socket = null;
    }

    @observable match;
    @observable matchList = [];
    @observable empires = [];
    @observable map = {state: null};
    @observable error;
    @observable selectedTerritoryId;

    @computed get empiresById() {
        let indexedEmpires = {};
        this.empires.forEach(empire => indexedEmpires[empire.id] = empire);
        return indexedEmpires;
    };

    @computed get userEmpire() {
        return _.find(this.empires, empire => empire.user_id === this.userStore.user.id);
    }

    @action fetchMatchList = () => {
        Api.getMatches().then(matches => this.matchList = matches);
    };

    @action setMatch = (match) => {
        this.match = match;
        Api.getMatchDetails(match.id).then(matchFull => {
            this.empires = matchFull.empires;
            this.map = matchFull.map;

            // reference each territory to its empire
            this.map.state.forEach(territory => {
                territory.empire = territory.empire_id ? this.empiresById[territory.empire_id] : null;
            });
        })
    };

    @action clearMatch = () => {
        this.match = null;
        this.empires.clear();
        this.map = {state: null};
    };

    @action newEmpire = (empire) => {
        this.empires.push(empire);

        this.map.state.forEach(territory => {
            territory.empire = territory.empire_id ? this.empiresById[territory.empire_id] : null;
        })
    }

    @action setError = (error) => {
        this.error = error;
    }

    @action setSelectedTerritory = (territory) => {
        this.selectedTerritoryId = territory ? territory.id : null;
    }

    @computed get selectedTerritory() {
        return _.find(this.map.state, t => t.id === this.selectedTerritoryId);
    };
}

export default MatchStore;
