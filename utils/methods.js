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

module.exports = { average };