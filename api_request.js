const request = require('request');

console.log('testing');
request({
    url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=AIzaSyCRN9-p6ar20bPGWTZUvFsCUOFxqCD_U24",
    json: true
    },(err, response, body) =>{
        console.log(body);
        console.log(err);
});