/**
* 
* @param {Number[]} list 
* @returns 
*/
function average(list) {
    var sum = 0, avg = 0;
    list.forEach(i => {
        sum = sum + i;
        avg = sum / list.length;
    });

    return avg;
}

/**
     * 
     * @param {Date} date 
     * @param {Number} expiresIn 
     */
function checkExpired(date, expiresIn) {
    return new Date().getTime() - date.getTime() > expiresIn * 1000;
}

module.exports = { average, checkExpired };