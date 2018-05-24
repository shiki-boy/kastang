// const mongoose = require('mongoose');
// const { product_infoConn } = require('../db/mongoose.js');

// var ProductInfoSchema = new mongoose.Schema({
//     Pname: {
//         type: String,
//     },
//     info: [mongoose.Schema.Types.Mixed]
// });

// ProductInfoSchema.index({ Pname: 'text' });

// var ProductInfo = product_infoConn.model('ProductInfo', ProductInfoSchema);

// var otherOneSchema = new mongoose.Schema({
//     some: {
//         type: String
//     }
// });

// var otherOne = product_infoConn.model('otherOne', otherOneSchema);

// module.exports = {
//     ProductInfo,
//     otherOne
// };