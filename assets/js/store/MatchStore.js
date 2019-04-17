import { observable, computed, action } from 'mobx';
import Api from '../services/api';
import _ from 'underscore';

class MatchStore {

    constructor(userStore) {
        this.userStore = userStore;
    }

    @observable match;
    @observable matchList = [];
    @observable empires = [];
    @observable map = {state: null};
    @observable error;
    @observable selectedTerritoryId;
    @observable hoverTerritoryId;
    @observable supply;
    @observable tide;
    @observable loaded = false;
    @observable socket;
    @observable selectedUnits;

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

    @action setMatch = matchId => {
        return new Promise((resolve, reject) => {
            Api.getMatchDetails(matchId).then(matchFull => {
                this.empires = matchFull.empires;
                this.map = matchFull.map;

                // reference each territory to its empire
                this.map.state.forEach(territory => {
                    territory.empire = territory.empire_id ? this.empiresById[territory.empire_id] : null;
                });

                delete(matchFull.empires);
                delete(matchFull.map);
                this.match = matchFull;
                this.loaded = true;

                this.fetchUserEmpire();
                resolve();
            })
        });
    };

    @action refreshMatch = () => {
        return this.setMatch(this.match.id);
    }

    @action fetchUserEmpire = () => {
        Api.getUserEmpire(this.match.id).then(data => {
            this.supply = data.supply;
            this.tide = data.tide;
        });
    };

    @action clearMatch = () => {
        this.loaded = false;
        this.match = null;
        this.empires.clear();
        this.map = {state: null};
        this.supply = null;
        this.tide = null;
        this.selectedUnits = 0;
    };

    @action newEmpire = (empire) => {
        this.empires.push(empire);

        this.map.state.forEach(territory => {
            territory.empire = territory.empire_id ? this.empiresById[territory.empire_id] : null;
        })
    };

    @action setError = (error) => {
        this.error = error;
    };

    @action setSelectedTerritory = (territory) => {
        // Clear selected units selection if the selection has changed
        if (territory != this.selectedTerritory) {
            this.selectedUnits = 0;
        }

        this.selectedTerritoryId = territory ? territory.id : null;
    };

    @action setHoverTerritory = (territory) => {
        this.hoverTerritoryId = territory ? territory.id : null;
    };

    @computed get selectedTerritory() {
        return _.find(this.map.state, t => t.id === this.selectedTerritoryId);
    };

    @computed get hoverTerritory() {
        return _.find(this.map.state, t => t.id === this.hoverTerritoryId);
    };
}

export default MatchStore;
