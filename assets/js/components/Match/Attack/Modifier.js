import React from 'react';

const Modifier = (props) => {

    const { number, hideIfZero } = props;
    const sign = number >= 0 ? '+' : '–';
    let style;

    if (number > 0) {
        style = 'bonus';
    }
    else if (number < 0) {
        style = 'penalty';
    }
    else {
        style = '';
    }

    if (number == 0 && hideIfZero == true) {
        return null;
    }

    return(
        <span className={style}>
            {sign}{Math.abs(number)}
        </span>
    );
}

export default Modifier;
