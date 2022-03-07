import {v4 as uuidv4} from 'uuid';
let floderName = {name:"roomImage-"+uuidv4().toString()};
exports.setFloderName = ()=>{

    floderName.name ="roomImage-"+uuidv4().toString();
}

exports.getFloderName = ()=>{
    return floderName.name
}