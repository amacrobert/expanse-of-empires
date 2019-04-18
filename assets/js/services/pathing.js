import MatchUtil from './match-util';
import { observer, inject } from 'mobx-react';
import _ from 'underscore';
var buckets = require('buckets-js');

export default class Pathing {

    static calculate = (matchStore) => {
        let start = matchStore.selectedTerritory;
        let end = matchStore.hoverTerritory;
        let userEmpire = matchStore.userEmpire;
        let userArmy = _.findWhere(start.armies, {empire_id: matchStore.userEmpire.id});

        // If user does not have an army in start territory, take no action
        // This should never happen since we don't get here unless there are units selected, but including it for safety
        if (!userArmy) {
            return;
        }

        // If the user doesn't own the end territory and it's not a neighbor, no path.
        // @TODO: Allow user to traverse through allies' territories
        let territoriesBorderingStart = MatchUtil.getBorderingTerritories(matchStore.map.state, start);
        if (!_.contains(territoriesBorderingStart, end) && end.empire != userEmpire) {
            return;
        }

        let path = Pathing.findPath(matchStore, start, end);

        console.log('type:', path.type);
        console.log('cost:', path.cost);

        if (path.nodes) {
            console.log('Calculated path:');
            path.nodes.forEach(territory => {
                console.log('(' + territory.q + ',' + territory.r + ')');
            });
        }

        // Update matchStore
        path ? matchStore.path = path : matchStore.clearPath();
    };

    // A* search using terrain tide cost as movement cost
    static findPath = (matchStore, start, end) => {

        let costSoFar = {};
        let cameFrom = {};
        costSoFar[start.id] = 0;
        cameFrom[start.id] = null;

        let frontier = new buckets.PriorityQueue((t1, t2) => {
            let p1 = 'priority' in t1 ? t1.priority : 0;
            let p2 = 'priority' in t2 ? t2.priority : 0;
            return p2 - p1;
        });
        frontier.enqueue(start);

        while (!frontier.isEmpty()) {

            let current = frontier.dequeue();

            if (current == end) {
                let path = [];
                let trace = end;

                console.log('cameFrom:', cameFrom);

                while (trace) {
                    path.push(trace);
                    trace = cameFrom[trace.id];

                    if (trace) {
                        delete trace.priority;
                    }
                }

                return {
                    type: 'move',
                    cost: costSoFar[end.id],
                    nodes: path.reverse(),
                };
            }

            let neighbors = MatchUtil.getBorderingTerritories(matchStore.map.state, current);

            neighbors.forEach(next => {
                if (next) {
                    let newCost = costSoFar[current.id] + next.terrain.tide;
                    let hasVisited = (next.id in cameFrom);
                    let costsLess = newCost < costSoFar[next.id];
                    let isTraversable = (next.empire == matchStore.userEmpire);

                    if (isTraversable && (!hasVisited || costsLess)) {
                        costSoFar[next.id] = newCost;
                        next.priority = newCost; // @TODO: add hueristic based on distance to end
                        frontier.enqueue(next);
                        cameFrom[next.id] = current;
                    }
                }
            });
        }

        // reset priorities
        Object.keys(cameFrom).forEach(id => {
            if (cameFrom[id]) {
                delete cameFrom[id].priority;
            }
        });

        // No path found
        return false;
    }
}
