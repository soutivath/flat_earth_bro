import {User} from '../models';
export const isAdmin = async(req,res,next)=>{
    if(!req.user){
        return res.status(401).send({message:"unauth"});
    }
   
    if(req.user.is_admin == "superadmin")
    {
        return next();
    }

    return res.status(403).send({message:"You don't have permission to access this content"});
    


}