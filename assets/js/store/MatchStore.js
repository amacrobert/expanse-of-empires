import { observable, computed, action } from 'mobx';
import Api from '../services/api';
import _ from 'underscore';
import Pathing from '../services/pathing';

class MatchStore {

    constructor(userStore) {
        this.userStore = userStore;
        this.clearPath;
    }

    @observable match;
    @observable matchList = [];
    @observable empires = [];
    @observable map;
    @observable territoriesById = {};
    @observable error;
    @observable selectedTerritoryId;
    @observable hoverTerritoryId;
    @observable supply;
    @observable tide;
    @observable loaded = false;
    @observable socket;
    @observable selectedUnits;
    @observable path;

    @computed get empiresById() {
        let indexedEmpires = {};
        this.empires.forEach(empire => indexedEmpires[empire.id] = empire);
        return indexedEmpires;
    };

    @computed get territories() {
        return Object.values(this.territoriesById);
    }

    @computed get territoriesByAxial() {

        let mappedTerritories = {};

        this.territories.forEach(territory => {
            if (!mappedTerritories[territory.q]) {
                mappedTerritories[territory.q] = {};
            }
            mappedTerritories[territory.q][territory.r] = territory;
        });

        return mappedTerritories;
    }

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

                // Store the map outside an observable while we populate transform it, only setting the observable
                // once it's ready to be rendered. This is to prevent premature rendering.
                let loadingMap = matchFull.map;
                let loadingTerritoriesById = {};

                // reference each territory to its empire
                loadingMap.state.forEach(territory => {
                    territory.empire = territory.empire_id ? this.empiresById[territory.empire_id] : null;
                    loadingTerritoriesById[territory.id] = territory;
                });

                // load empire capitals
                this.empires.forEach(empire => {
                    empire.capital = loadingTerritoriesById[empire.capital_id];
                });

                // the map may now be observed
                this.territoriesById = loadingTerritoriesById;
                this.map = loadingMap;

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
        if (this.match) {
            return this.setMatch(this.match.id);
        }
    };

    @action fetchUserEmpire = () => {
        Api.getUserEmpire(this.match.id).then(data => {
            this.supply = data.supply;
            this.tide = data.tide;
        });
    };

    @action updateEmpire = (empire) => {
        // Empire is new -- add it
        empire.capital = this.territoriesById[empire.capital_id];
        if (!this.empiresById[empire.id]) {
            this.newEmpire(empire);
        }
        else {
            this.empiresById[empire.id] = empire;
        }
    };

    @action updateTerritory = (newTerritory) => {
        let empiresById = this.empiresById;
        let map = this.map;
        let index = newTerritory.id;
        let oldTerritory = Object.assign(this.territoriesById[index]);

        // Update teritory empire from empire_id
        newTerritory.empire = newTerritory.empire_id ? this.empiresById[newTerritory.empire_id] : null;
        this.territoriesById[index] = newTerritory;

        // Update empire territory counts in case territory changed hands
        if (empiresById[oldTerritory.empire_id]) {
            empiresById[oldTerritory.empire_id].territory_count--;
        }
        if (empiresById[newTerritory.empire_id]) {
            empiresById[newTerritory.empire_id].territory_count++;
        }
    };

    @action updateSupply = (supply) => {
        this.supply = supply;
    };

    @action updateTide = (tide) => {
        this.tide = tide;
    };

    @action clearMatch = () => {
        this.loaded = false;
        this.match = null;
        this.empires.clear();
        this.map = {state: null};
        this.supply = null;
        this.tide = null;
        this.selectedUnits = 0;
        this.selectedTerritoryId = null;
        this.clearPath;
    };

    @action clearPath = () => {
        if (!this.path) {
            this.path = {};
        }

        this.path.type = null;
        this.path.cost = 0,
        this.path.nodes = [];
    }

    @action newEmpire = (empire) => {

        this.empires.push(empire);

        this.territories.forEach(territory => {
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

        this.clearPath();
        this.selectedTerritoryId = territory ? territory.id : null;
    };

    @action setHoverTerritory = (territory) => {
        this.hoverTerritoryId = territory ? territory.id : null;
    };

    @action setSelectedUnits = (selection) => {
        let army = this.userArmyInSelectedTerritory;

        if (!army) {
            this.clearPath();
            return;
        }

        // de-select if the existing selection is chosen
        if (selection == this.selectedUnits) {
            this.clearPath();
            selection = 0;
        }
        // limit selection to army size
        else if (selection > army.size) {
            selection = army.size;
        }

        this.selectedUnits = selection;

        if (this.selectedUnits == 0) {
            this.clearPath();
        }
        else {
            Pathing.calculate(this);
        }
    };

    @action selectAllUnits = () => {
        if (this.userArmyInSelectedTerritory) {
            this.setSelectedUnits(this.userArmyInSelectedTerritory.size);
        }
    }

    @computed get userArmyInSelectedTerritory() {
        if (this.selectedTerritory) {
            return _.find(this.selectedTerritory.armies, a => a.empire_id === this.userEmpire.id);
        }
        return null;
    };

    @computed get selectedTerritory() {
        return this.territoriesById[this.selectedTerritoryId];
    };

    @computed get hoverTerritory() {
        return this.territoriesById[this.hoverTerritoryId];
    };
}

export default MatchStore;
