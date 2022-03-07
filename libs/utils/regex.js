

/**
 *  function regex email input
 * @param {*} email
 * @returns 
 */
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 *  function regex number input
 * @param {*} number 
 * @returns 
 */
function validateNumber(number) {
    var reg = /^\d+$/;
    return reg.test(number);
}



module.exports = {
    validateEmail,
    validateNumber,
}