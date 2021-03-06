'use strict'
var path = require('path'),
    response = require(path.resolve("./config/responses.js")),
    akamai_token_generator = require(path.resolve('./modules/streams/server/controllers/akamai_token_v2')),
    crypto = require('crypto'),
    responses = require(path.resolve("./config/responses.js"));


function getClientIp(req) {
    var ipAddress;
    // The request may be forwarded from local web server.
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        // 'x-forwarded-for' header may return multiple IP addresses in
        // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
        // the first one
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        // If request was not forwarded
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}

function mysha1( data ) {
    var generator = crypto.createHash('sha1');
    generator.update( data );
    return generator.digest('hex')
}

exports.akamai_token_v2_generator = function(req,res) {
    var config = {
        algorithm : 'SHA256',
        acl : '*',
        window : 9001,
        key : "BB4D383893D0EE64",
        //ip: getClientIp(req),
        ip: req.ip.replace('::ffff:', ''),
        startTime:0,
        url:'',
        session:'',
        data:'',
        salt:'',
        delimeter:'~',
        escape_early:false,
        name:'__token__'
    };

    //var token_generator = new token_generator.default(config);
    var token = new akamai_token_generator.default(config).generateToken();
    //var token = token_generator.generateToken();
    //responses.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', token, 'no-store');
    var theresponse = {
        status_code: 200,
        error_code: 1,
        timestamp: Date.now(),
        error_description: "OK",
        extra_data: token,
        response_object: []
    };

    res.send(theresponse);
};

exports.flussonic_token_generator =  function(req, res) {
    var secure_token = "uGhKNDl54sd123"; //server side only
    var password = req.query.password || "tQZ71bHq";
    var salt = req.query.salt || "QKu458HJi";

    var stream_name = req.params[0];
    var ip = req.query.ip || req.ip.replace('::ffff:', '');
    var starttime = req.query.starttime || Date.now()/1000|0;
    var endtime = req.query.endtime || (Date.now()/1000|0) + 3600;

    var tohash = stream_name + ip + starttime + endtime + secure_token + salt;
    //console.log(req.params[0]);

    var token = "?token="+mysha1(tohash)+"-" + salt + "-" + endtime + "-" + starttime;

    var theresponse = {
        status_code: 200,
        error_code: 1,
        timestamp: Date.now(),
        error_description: "OK",
        extra_data: token,
        response_object: []
    };

    res.send(theresponse);
    //responses.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', token, 'no-store');
};

exports.flussonic_token__remote =  function(req, res) {

    var stream_name = req.params.stream_name;
    var token_url = req.query.tokenurl;
    var password = 'password';
    var salt = 'somesalt';
    var ip = req.ip.replace('::ffff:', '');
    var starttime = Date.now();
    var endtime = Date.now() + 1000;

    var queryparams = 'sing?' + 'password=' + password+'&name=' + stream_name + '&salt=' + salt + '&ip=' + ip + '&startime=' + starttime + '&endtime=' + endtime;

    request(token_url+queryparams, function (error, response, body) {
        var thisresponse = new responses.OK;

        if(response.statusCode === 200) {
            thisresponse.extra_data = body;
            res.send(thisresponse);
        }
        else {
            res.send(thisresponse);
        }
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
    });
};