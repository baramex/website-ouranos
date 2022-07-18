const { LOCAL_API } = process.env;
const { default: axios } = require("axios");

function localFetch(endpoint, method, data) {
    return new Promise((res, rej) => {
        axios({
            url: LOCAL_API + endpoint,
            method,
            data
        }).then(r => res(r.data), err => {
            console.error("local fetch", err);
            rej(err.response?.data)
        });
    });
}



var ratesLimit = [];
/**
 * 
 * @param {String} endpoint 
 * @param {String} method 
 * @param {String} token_type 
 * @param {String} access_token 
 * @param {Object|String} [data]
 * @param {Object} [customHeader]
 * @returns 
 */
function discordFetch(endpoint, method, token_type, access_token, data = undefined, customHeader = undefined) {
    return new Promise((res, rej) => {
        var curr = ratesLimit.find(a => a.endpoint == endpoint);
        if (curr && curr.remaing <= 1 && curr.reset >= new Date().getTime()) {
            if (curr.reset - new Date().getTime() > 5000) return rej("TooManyRequests");
            setTimeout(() => {
                discordFetch(endpoint, method, token_type, access_token, data).then(res).catch(rej);
            }, curr.reset - new Date().getTime());
        }
        else {
            var headers = customHeader || { authorization: token_type + " " + access_token };
            axios({
                url: "https://discord.com/api" + endpoint,
                method: method,
                headers,
                data: data || null
            }).then(response => {
                if (!ratesLimit.find(a => a.endpoint == endpoint)) ratesLimit.push({ endpoint });
                var rl = ratesLimit.find(a => a.endpoint == endpoint);
                rl.remaing = response.headers["x-ratelimit-remaining"];
                rl.reset = response.headers["x-ratelimit-reset"];
                rl.time = new Date().getTime();

                res(response.data);
            }, error => {
                console.error("discord fetch", error);
                rej(error.response);
            });
        }
    });

}

module.exports = { localFetch, discordFetch };