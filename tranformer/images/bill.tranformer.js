require('dotenv').config();
const billImage = (image_path)=>{
    let image  = `${process.env.APP_DOMAIN}/images/resources/bills/${
        image_path
      }`;
  
    return image;
}

export default billImage;