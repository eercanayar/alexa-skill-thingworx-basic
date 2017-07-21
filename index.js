'use strict';
var Alexa = require("alexa-sdk");
var appId = '***';

var unitsRef = {
    'temperature':'#val# degree celcius',
    'humidity':'#val#%'
};

exports.handler = function(event, context, callback) {
    console.log(event);
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.registerHandlers(mainHandlers);
    alexa.execute();
};

var mainHandlers = {
    'getParameter': function() {
        
        var parameterVal = this.event.request.intent.slots.parameter.value;
        var accessToken = this.event.session.user.accessToken;
        if (accessToken == null) {
            this.emit(':tellWithLinkAccountCard', "Your Thingworx parameters isn't set. Please link Thingworx via alexa app.");
        } else {
            accessToken = accessToken.split(',');
            // format: "access_token="+thingworxServer+","+thingName+","+appkey
            
            // valid parameters here
            if(parameterVal=="temperature" || parameterVal=="humidity") {
               
                var myCont = this;
            
                var http = require('http');

                var options = {
                host: accessToken[0],
                path: '/Thingworx/Things/'+accessToken[1]+'/Properties/'+parameterVal,
                headers: {
                    "Accept": "application/json",
                    "appkey": accessToken[2]
                }
                };
                
                var callbackQ = function(response) {
                var strResult = '';
                
                response.on('data', function (chunk) {
                    strResult += chunk;
                });
                
                response.on('end', function () {
                    try {
                        var thingData = JSON.parse(strResult);
                    } catch(e) {
                        throw new Error('Parse error:' + e);
                    }
                    
                    var speechOutput = "The "+parameterVal+" in <say-as interpret-as=\"spell-out\">COE</say-as> is "+placeUnits(parameterVal, thingData.rows[0][parameterVal])+" now.";
                    console.log("speechOutput: "+speechOutput);
                    myCont.emit(':tell', speechOutput);  
                
                });
                };
                
                http.request(options, callbackQ).end();

            } else {
                this.emit(':ask', "I didn't understand what did you ask, may you ask again?");  
            }
        }
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },'LaunchRequest': function () {
        this.emit(":ask", "Welcome to Accenture <say-as interpret-as=\"spell-out\">COE</say-as>.");
    },'Unhandled': function () {
        this.emit(':ask', "Ask by saying like; \"how is the temperature?\".");
    }

};

function placeUnits(parameterVal, val) {
    return unitsRef[parameterVal].replace("#val#", val);
}