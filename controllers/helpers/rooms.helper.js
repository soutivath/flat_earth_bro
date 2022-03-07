
/**
 * 
 * @param {*} roomId 
 * @returns Boolean
 */
 async function  checkActiveRoom (roomId) {
    try{
        const room = await Room.FindOne(
            
              {
                  where: {id: roomId}
              }
        );
        if(!!room){
            return room.active;
        }
        else{
            return false;
        }
    }catch(err){
        createHttpError.ServerError(err);
    }
}

/**
 * 
 * @param {*} roomId 
 * @param {array} userId 
 * @returns object
 */
async function checkExistingRenting(roomId,userId) {
    try{
        const renting = await UserRenting.findOne(
        { 
               where:{
                [Op.and]:[
                    {room_id:roomId}, {user_id:userId},
                ]
            },
            include: Renting
        }
        );
        if(!renting){
            return null;
        }
        return renting; 
    }
    catch(err) {
        createHttpError.ServerError(err)
    }
}