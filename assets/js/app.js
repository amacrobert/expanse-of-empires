require('./map.js');

import React from 'react';
import ReactDOM from 'react-dom';
import Sidebar from './components/Sidebar'
import MapViewport from './components/MapViewport'


class App extends React.Component {
    constructor() {
        super();
    }

    render() {
        return (
            <div>
                <MapViewport></MapViewport>
                <Sidebar
                    coordinates=""
                >
                </Sidebar>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
