import crypto from 'crypto';
exports.randomTopicString = ()=>{
    return "notification_topic_"+Math.round(+new Date()/1000)+crypto.randomBytes(20).toString('hex');
}
