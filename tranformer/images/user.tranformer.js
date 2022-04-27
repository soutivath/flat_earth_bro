require('dotenv').config();
const userImage = (image_path)=>{
    let image  = `${process.env.APP_DOMAIN}/images/resources/profile_images/${
        image_path
      }`;
  
    return image;
}

export default userImage;