
import fs from 'fs'
import path from 'path'
import passport from 'passport'
import { User,Account } from '../../models'
import passportJWT from 'passport-jwt'
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

const pathTo_PubKey = path.join(__dirname, '../certs/pub_key.pem');
const SecretKey = fs.readFileSync(pathTo_PubKey, 'utf8');

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = SecretKey;
opts.algorithm = ["RS256"];

passport.use(new JwtStrategy(opts, 
  async  function(jwt_payload, done) {
   
    const user = await User.findOne({where:{id: jwt_payload.user_id},include: Account});
        if (user) {
            return done(null, user);
        }
        else{
            return done(new Error('Couldn\'t find user'),null);
        }
      
    
}));