var cloudscraper = require('cloudscraper');
const notifier = require('node-notifier');
var admin = require('firebase-admin');
var serviceAccount = require('./key.json');
var config = require('./config');
var timeInterval = config.timeIntervalInSeconds * 1000;

var lastXRP = 0,
    lastETH = 0,
    lastLTC = 0;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cryptonotifiy.firebaseio.com"
});
// The topic name can be optionally prefixed with "/topics/".
var topic = "cryptoNotifiy";

function sendTestMessage() {
    var payload = {
        notification: {
            "body": "Title \u2191 \u2193",
            'sound': 'default'
        }
    };

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().sendToTopic(topic, payload)
        .then(function(response) {
            // See the MessagingTopicResponse reference documentation for the
            // contents of response.
            console.log("Successfully sent message:", response);
        })
        .catch(function(error) {
            console.log("Error sending message:", error);
        });
}

function getKoinexData() {
    return new Promise((resolve, reject) => {
        cloudscraper.get(config.koinexUrl, function(error, response, body) {
            if (error) {
                console.log('Error occurred : ' + error);
                reject('NO INTERNET');
            } else {
                var jsonData = JSON.parse(body);
                resolve(jsonData);
            }
        });
    });
}



function trackKoinex() {
    getKoinexData()
        .then(data => {
            var xrp = data.XRP;
            var ltc = data.LTC;
            var eth = data.ETH;

            var diffXRP = 0,
                diffETH = 0,
                diffLTC = 0;

            var msg = "";

            diffXRP = Math.round(xrp - lastXRP);
            diffLTC = Math.round(ltc - lastLTC);
            diffETH = Math.round(eth - lastETH);
            //diffBTC = Math.round(btc-lastBTC);


            if (diffXRP !== 0 && lastXRP !== 0) {
                if (diffXRP > config.priceDiffXRP) {
                    msg += "XRP : \u20B9 " + xrp + " \u2191";
                } else if (diffXRP < config.priceDiffXRP) {
                    msg += "XRP : \u20B9 " + xrp + " \u2193";
                }
            }


            if (diffLTC !== 0 && lastLTC !== 0) {
                if(Math.abs(diffLTC) > config.priceDiffLTC){
                    if (diffLTC > config.priceDiffLTC) {
                        msg += "LTC : \u20B9 " + ltc + " \u2191";
                    } else if (diffLTC < config.priceDiffLTC) {
                        msg += "LTC : \u20B9 " + ltc + " \u2193";
                    }
                }

            }

            if (diffETH !== 0 && lastETH !== 0) {
                if (Math.abs(diffETH) > config.priceDiffETH){
                      if (diffETH > config.priceDiffETH) {
                          msg += "ETH : \u20B9 " + eth + " \u2191";
                      } else if (diffETH < config.priceDiffETH) {
                          msg += "ETH : \u20B9 " + eth + " \u2193";
                      }
                }


            }

             console.log('diff :: '+diffXRP +' lastXRP ::' + lastXRP + '   current ::' + xrp);
             console.log('diff :: '+diffETH +' lastETH ::' + lastETH + '   current ::' + eth);
             console.log('diff :: '+diffLTC +' lastLTC ::' + lastLTC + '   current ::' + ltc);

            lastXRP = xrp;
            lastLTC = ltc;
            lastETH = eth;



            // notifier.notify('XRP : \u20B9 ' + xrp + '\r' +
            //                 'LTC : \u20B9 ' + ltc + '\r' +
            //                 'ETH : \u20B9 ' + eth);
            //notifier.notify(msg);

            if (msg === "") {
                return;
            }

            console.log(msg);

            var payload = {
                notification: {
                    "title": "Crypto Update",
                    "body": msg,
                    'sound': 'default'
                }
            };

            // Send a message to devices subscribed to the provided topic.
            console.info('Sending Notification...');
            admin.messaging().sendToTopic(topic, payload)
                .then(function(response) {
                    // See the MessagingTopicResponse reference documentation for the
                    // contents of response.
                    console.log("Successfully sent message:", response);
                })
                .catch(function(error) {
                    console.log("Error sending message:", error);
                });



        })
        .catch(error => {
            console.log(error);
            //  notifier.notify('!!!! NO INTERNET !!!');
        })
}


setInterval(trackKoinex, timeInterval);
//sendTestMessage();
