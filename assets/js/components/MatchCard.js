import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';

@observer
class MatchCard extends React.Component {

    render() {
        const match = this.props.match;
        const matchCardClasses = ['card', 'match-card'];
        const openButtonClasses = ['btn', 'btn-sm', 'btn-open'];

        if (match.user_joined) {
            matchCardClasses.push('match-active');
            matchCardClasses.push('bg-primary');
        }
        else {
            openButtonClasses.push('btn-light');
        }

        return (
            <div className="col-md-4">
                <Link to={'/match/' + match.id} className={matchCardClasses.join(' ')}>
                    <div className="card-header">
                        <span className="align-middle">{match.name}</span>
                        <span className={openButtonClasses.join(' ')}>Open</span>
                    </div>
                    <div className="card-body">
                        <p className="card-text">{match.phase}</p>
                        <p className="card-text">Speed: {match.speed}%</p>
                    </div>
                </Link>
            </div>
        );
    }
}

export default MatchCard;
