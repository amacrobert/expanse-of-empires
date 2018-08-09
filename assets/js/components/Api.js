import React from 'react';
import Cookies from 'universal-cookie';

const Api = {
    login: login,
    register: register,
    getUser: getUser,
    getMatches: getMatches,
    getMatchChat: getMatchChat,
    getMatchMap: getMatchMap,
};

function login(email, password) {
    return request('/login', 'POST', {
        username: email,
        password: password,
    }, false);
}

function getUser() {
    return request('/api/user');
}

function getMatches() {
    return request('/api/matches');
}

function getMatchMap(matchId) {
    return request('/api/match/' + matchId + '/map');
}

function getMatchChat(matchId) {
    return request('/api/match/' + matchId + '/chat');
}

function register(email, username, password) {
    return request('/api/register', 'POST', {
        email: email,
        username: username,
        password: password,
    }, false);
}

function request(url, method = 'GET', body = {}, parseResponse = true) {
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

export default Api;
