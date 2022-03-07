import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

// readfile keys pairs from certs file
const pathTo_PrivKey = path.join(__dirname, '../certs/priv_key.pem');
const PRIVATE_KEY = fs.readFileSync(pathTo_PrivKey, 'utf8');  // private

const pathTo_PubKey = path.join(__dirname, '../certs/pub_key.pem');
const PUBLIC_KEY = fs.readFileSync(pathTo_PubKey, 'utf8');  // public

/**
 * function generate access jwt token
 * @param {data} payload
 * @param {accessToken} res
 */
 const genAccessJWT = (payload) => {
    const accessOptions = {
       // expiresIn: "1h",
        expiresIn: "1y",
        algorithm: "RS256"
    }
    return jwt.sign(payload, PRIVATE_KEY, accessOptions);
}

/**
 * function generate refresh jwt token
 * @param {data} payload
 * @param {refreshToken} res
 */
 const genRefreshJWT = (payload) => {
    const refreshOptions = {
        expiresIn: "1y",
        algorithm: "RS256"
    }
    return jwt.sign(payload, PRIVATE_KEY, refreshOptions);
}

/**
 * function verify jwt token
 * @param {data} payload
 * @param {decode} res
 */
 const verifyJWT = (payload) => {
    const verifyOptions = {
        expiresIn: "1y",
        algorithm: ["RS256"]
    }
    return jwt.verify(payload, PUBLIC_KEY, verifyOptions);
}

module.exports = {
    genAccessJWT,
    genRefreshJWT,
    verifyJWT
}