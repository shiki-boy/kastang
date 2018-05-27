const mongoose = require('mongoose');
const {productConn} = require('../db/mongoose.js');

// #######################################################################################

var ProductSchema = new mongoose.Schema({
    Pname : {
        type: String,
    },
    Cname: {
        type: String,
    },
    price: {
        type: String
    },
    discount:{
        type: Number
    },
    sold:{
        type: Number
    },
    category:[{
        type: String
    }]
});

ProductSchema.index({Pname: 'text', Cname: 'text', category: 'text'});

var Product = productConn.model('Product',ProductSchema);

// #######################################################################################

var ProductInfoSchema = new mongoose.Schema({
    Pname: {
        type: String,
    },
    info: [mongoose.Schema.Types.Mixed]

});

ProductInfoSchema.index({ Pname: 'text' });

var ProductInfo = productConn.model('ProductInfo', ProductInfoSchema);

// ########################################################################################

var BrandsSchema = new mongoose.Schema({
    ProductType: {
        type: String
    },
    Companies:{
        type: String
    }
});

BrandsSchema.index({ProductType:"text", Companies: 'text' });

var Brands = productConn.model('Brands', BrandsSchema);

module.exports = {
    Product,
    ProductInfo,
    Brands
};