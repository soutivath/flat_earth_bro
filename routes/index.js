 import express from 'express';

import { profileStorage as uploader } from '../middlewares/multer';


///----------admin
import authRouteAdmin from "./admin/authentication.Route";
import billRouteAdmin from "./admin/bill.Route";
import notificationRouteAdmin from "./admin/notification.Route";
import rentingRouteAdmin from "./admin/renting.Route";
import roomRouteAdmin from "./admin/room.Route";
import trashRouteAdmin from "./admin/trash.Route";
import typeRouteAdmin from "./admin/type.Route";
import userRouteAdmin from "./admin/user.Route";
//----------------------------------->

//------------------user
import authRouteUser from "./user/authentication.Route";
import profileRouteUser from "./user/profile.Route";
import rentingRouteUser from "./user/renting.Route";
import testRoute from "./test.Route";
// //-------------------->

//middlewares

import { Auth } from '../middlewares/auth.guard';
import {isAdmin} from '../middlewares/isAdmin.guard'
 const app = express();

app.use("/admin",authRouteAdmin);
app.use("/admin",[Auth,isAdmin],billRouteAdmin);
app.use("/admin",[Auth,isAdmin],notificationRouteAdmin);
app.use("/admin",[Auth,isAdmin],rentingRouteAdmin);
app.use("/admin",[Auth,isAdmin],roomRouteAdmin);
app.use("/admin",[Auth,isAdmin],trashRouteAdmin);
app.use("/admin",[Auth,isAdmin],typeRouteAdmin);
app.use("/admin",[Auth,isAdmin],userRouteAdmin);

app.use("/user",[Auth],authRouteUser);
app.use("/user",[Auth],profileRouteUser);
app.use("/user",[Auth],rentingRouteUser);
app.use("/test",[Auth],testRoute);

module.exports = app;