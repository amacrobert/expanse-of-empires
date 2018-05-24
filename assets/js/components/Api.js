import React from 'react';
import Cookies from 'universal-cookie';

const Api = {
    login: login,
    register: register,
    getUser: getUser,
    getMatches: getMatches,
};

function login(email, password) {
    return request('/login', 'POST', {
        username: email,
        password: password,
    });
}

function getUser() {
    return request('/api/user');
}

function getMatches() {
    return request('/api/matches');
}

function register(email, username, password) {
    return request('/api/register', 'POST', {
        email: email,
        username: username,
        password: password,
    });
}

function request(url, method = 'GET', body = {}) {
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

    return fetch(url, options);
}

export default Api;
