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
import profileRouteUser from "./user/authentication.Route";
import rentingRouteUser from "./user/renting.Route";
import testRoute from "./test.Route";
// //-------------------->
 const app = express();

app.use("/admin",authRouteAdmin);
app.use("/admin",billRouteAdmin);
app.use("/admin",notificationRouteAdmin);
app.use("/admin",rentingRouteAdmin);
app.use("/admin",roomRouteAdmin);
app.use("/admin",trashRouteAdmin);
app.use("/admin",typeRouteAdmin);
app.use("/admin",userRouteAdmin);

app.use("/user",authRouteUser);
app.use("/user",profileRouteUser);
//app.use("/user",rentingRouteUser);
app.use("/test",testRoute);

module.exports = app;