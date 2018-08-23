import Cookies from 'universal-cookie';

const login = (email, password) => {
    return request('/login', 'POST', {
        username: email,
        password: password,
    }, false);
}

const getUser = () => {
    return request('/api/user');
}

const getMatches = () => {
    return request('/api/matches').then(matches => {

        // Replace date strings with Date objects
        matches.forEach(match => {
            match.date_registration = new Date(match.date_registration);
            match.date_npc = new Date(match.date_npc);
            match.date_p2p = new Date(match.date_p2p);

            if (match.date_completed) {
                match.date_completed = new Date(match.date_completed);
            }
        })

        return matches;
    });
}

const getMatchChat = matchId => {
    return request('/api/match/' + matchId + '/chat');
}

const getMatchDetails = matchId => {
    return request('/api/match/' + matchId);
};

const register = (email, username, password) => {
    return request('/api/register', 'POST', {
        email: email,
        username: username,
        password: password,
    }, false);
}

const get = (url, parseResponse = true) => request(url, 'GET', {}, parseResponse);
const post = (url, body = {}, parseResponse = true) => request(url, 'POST', body, parseResponse);
const put = (url, body = {}, parseResponse = true) => request(url, 'PUT', body, parseResponse);
//const delete = (url, body = {}, parseResponse = true) => request(url, 'DELETE', body, parseResponse);

const request = (url, method = 'GET', body = {}, parseResponse = true) => {
    const cookies = new Cookies();
    let headers = {'content-type': 'application/json'};

    if (cookies.get('AUTH-TOKEN')) {
        headers['X-AUTH-TOKEN'] = cookies.get('AUTH-TOKEN');
    }

    let options = {
        method: method,
        headers: headers,
    }

    if (method !== 'GET' && method !== 'HEAD') {
        options.body = JSON.stringify(body);
    }

    if (parseResponse) {
        return fetch(url, options)
            .then(result => result.json())
            .catch(error => console.warn(error))
        ;
    }
    else {
        return fetch(url, options).catch(error => console.warn(error));
    }

}

export default {
    login,
    register,
    getUser,
    getMatches,
    getMatchChat,
    getMatchDetails,
};
