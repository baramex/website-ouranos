const { LOCAL_API } = process.env;
const { default: axios } = require("axios");

function localFetch(endpoint, method, data) {
    return new Promise((res, rej) => {
        axios({
            url: LOCAL_API + endpoint,
            method,
            data
        }).then(r => res(r.data), err => {
            console.error("local api", err);
            rej(err.response.data)
        });
    });
}

function discordFetch(endpoint, method, data) {

}

module.exports = { localFetch, discordFetch };