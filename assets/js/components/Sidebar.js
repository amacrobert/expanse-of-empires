import React from 'react';

const Sidebar = ({coordinates}) => (
    <div className="col-md-3 sidebar">
        <p className="coordinates">{coordinates}</p>
    </div>
);

export default Sidebar;
