const { CHALLENGE_GUILD_ID, BASIC_GUILD_ID } = process.env;

/**
 * 
 * @param {String} id 
 * @returns {"challenge"|"basic"}
 */
function getType(id) {
    if (id == CHALLENGE_GUILD_ID) return "challenge";
    else if (id == BASIC_GUILD_ID) return "basic";
}

module.exports = { getType };