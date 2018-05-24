const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {userConn} = require('../db/mongoose.js');

var UserSchema = new mongoose.Schema({
    email:{
        type: String,
        trim: true,
        unique: true
    },
    password:{
        type: String,
        minlength: 8
    },
    gender:{
        type: String,
    },
    mobile:{
        type: String,    },
    name:{
        type: String
    },
    address:{
        type: String
    },
    cart:[{
        type: String
    }],
    saved:[{
        type: String
    }],
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String
    }
});

// UserSchema.methods.generateAuthToken = function(){
//     var user = this;
//     var access = 'auth';
//     var token = jwt.sign({_id: user._id.toHexString(), access} , 'mysecret').toString();
    
//     user.tokens.push({access,token});

//     return user.save().then(()=>{
//         return token;
//     });
// }

var User = userConn.model('User',UserSchema);

module.exports = {
    User
};