import {User} from '../models';
export const isAdmin = async(req,res,next)=>{
    const admin = await user.findByPk(req.user.id);
    if(admin.isAdmin == 1)
    {
        return next();
    }

    return res.status(403).send({message:"You don't have permission to access this content"});
    


}