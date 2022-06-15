require('dotenv').config();
const userImage = (image_path)=>{
    let image  = `${process.env.APP_DOMAIN}/images/resources/profile_images/${
        image_path
      }`;
  
    return image;
}

const displayImage = (image_path)=>{
  let image  = `${process.env.APP_DOMAIN}/images/resources/display_images/${
    image_path
  }`;

return image;
}

export {userImage,displayImage};