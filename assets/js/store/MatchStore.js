import { observable, action, computed } from 'mobx';
import Api from '../services/api';

class MatchStore {

    @observable match = {};
    @observable empires = [];
    @observable map = {name: 'Loading', state: null};

    @computed get empiresById() {
        let indexedEmpires = {};
        this.empires.forEach(empire => indexedEmpires[empire.id] = empire);
        return indexedEmpires;
    };

    @action fetchMatch = (match) => {
        this.match = match;
        Api.getMatchDetails(match.id).then(matchFull => {
            this.empires = matchFull.empires;
            this.map = matchFull.map;
            console.log('MATCH DETAILS:', match);
        })
    };

}

export default new MatchStore;
