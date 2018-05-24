const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
var userConn = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost:27017/WebDB');        // will itself create a database if is not there
var productConn = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost:27017/productsDB');
// var product_infoConn = mongoose.createConnection('mongodb://localhost:27017/ProductInfoDB');
// var brandsConn = mongoose.createConnection('mongodb://localhost:27017/brandsDB');

module.exports = {
    userConn,
    productConn,
    // product_infoConn,
    // brandsConn,
    mongoose
};