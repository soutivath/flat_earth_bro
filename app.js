import express from 'express';
import path from 'path';
import logger from 'morgan';
import {sequelize} from './models';
import cookieParser from 'cookie-parser';
import createHttpError from 'http-errors';
import passport from 'passport';
import indexRouter from './routes/index';
import helmet from 'helmet';
import cors from 'cors';

import initializeFirebaseSDK from "./libs/firebase/firebase_connector";


require('dotenv').config();
require('./libs/utils/passportJWT');

const app = express();

app.use(helmet());
app.use(cors());
app.use(passport.initialize());
app.use(logger("dev"));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

initializeFirebaseSDK();
app.use("/api",indexRouter);



// if route not found
app.use((req,res,next)=>{
    next(createHttpError(404,"Route not found BRO"));
});

// error handler
app.use((err,req,res,next)=>{
    res.status(err.status||500).send({
        error:{message:err.message,status:err.status||500,success:false}
    });
});

app.use(async ()=>{
    await sequelize.authenticate();
    console.log("DB is Connected");
});

const port = process.env.PORT || 3000;
const ip = process.env.IP || "25.41.87.205";
const server = app.listen(port,ip,async()=>{
    await sequelize.authenticate();
    console.log("DB is running on port "+port);
});





