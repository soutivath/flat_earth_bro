
var admin = require("firebase-admin");
const serviceAccount = require("./firebase_key.json");
const dbUrl = "https://flatpropersal-default-rtdb.asia-southeast1.firebasedatabase.app/";

module.exports = ()=>{
    // firebase.initializeApp({
    //     credential:firebase.credential.cert(serviceAccount),
    //     databaseURL: dbUrl,
    // });
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbUrl
      });
    console.info("Initialized Firebase SDK");
}



