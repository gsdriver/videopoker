var mainApp = require('../lambda/custom/index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
if (process.env.RUN_DB_LOCAL) {
  AWS.config.update({region: 'us-west-2', endpoint: 'http://localhost:8000'});
} else {
  AWS.config.update({region: 'us-east-1'});
}
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const fs = require('fs');

const APPID = "amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828";
const LOCALE = "en-us";
const APITOKEN = "";

function BuildEvent(argv)
{
  // Templates that can fill in the intent
  var bet = {'name': 'BetIntent', 'slots': {'Amount': {'name': 'Amount', 'value': ''}}};
  var betMax = {'name': 'BetMaxIntent', 'slots': {}};
  var deal = {'name': 'DealIntent', 'slots': {}};
  var select = {'name': 'SelectIntent', 'slots': {}};
  var rules = {'name': 'RulesIntent', 'slots': {'Rules': {'name': 'Rules', 'value': ''}}};
  var reset = {'name': 'ResetIntent', 'slots': {}};
  var suggest = {'name': 'SuggestIntent', 'slots': {}};
  var yes = {'name': 'AMAZON.YesIntent', 'slots': {}};
  var no = {'name': 'AMAZON.NoIntent', 'slots': {}};
  var help = {'name': 'AMAZON.HelpIntent', 'slots': {}};
  var repeat = {'name': 'AMAZON.RepeatIntent', 'slots': {}};
  var stop = {'name': 'AMAZON.StopIntent', 'slots': {}};
  var cancel = {'name': 'AMAZON.CancelIntent', 'slots': {}};
  var highScore = {'name': 'HighScoreIntent', 'slots': {}};
  var hold = {'name': 'HoldIntent', 'slots': {'FirstCard': {'name': 'FirstCard', 'value': ''},
    'SecondCard': {'name': 'SecondCard', 'value': ''},
    'ThirdCard': {'name': 'ThirdCard', 'value': ''},
    'FourthCard': {'name': 'FourthCard', 'value': ''},
    'FifthCard': {'name': 'FifthCard', 'value': ''}}};
  var holdall = {'name': 'HoldAllIntent', 'slots': {}};
  var discard = {'name': 'DiscardIntent', 'slots': {'FirstCard': {'name': 'FirstCard', 'value': ''},
    'SecondCard': {'name': 'SecondCard', 'value': ''},
    'ThirdCard': {'name': 'ThirdCard', 'value': ''},
    'FourthCard': {'name': 'FourthCard', 'value': ''},
    'FifthCard': {'name': 'FifthCard', 'value': ''}}};
  var discardall = {'name': 'DiscardAllIntent', 'slots': {}};
  var toggle = {'name': 'ToggleIntent', 'slots': {'Number': {'name': 'Number', 'value': ''}}};

  var lambda = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": APPID
      },
      "attributes": {},
      "user": {
        "userId": "not-amazon",
      },
      "new": false
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
     "context": {
       "AudioPlayer": {
         "playerActivity": "IDLE"
       },
       "Display": {},
       "System": {
         "application": {
           "applicationId": APPID
         },
         "user": {
           "userId": "not-amazon",
         },
         "device": {
           "deviceId": "not-amazon",
           "supportedInterfaces": {
             "AudioPlayer": {},
             "Display": {
               "templateVersion": "1.0",
               "markupVersion": "1.0"
             }
           }
         },
         "apiEndpoint": "https://api.amazonalexa.com",
         "apiAccessToken": APITOKEN,
       }
     },
  };

  var openEvent = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": "amzn1.ask.skill.dcc3c959-8c93-4e9a-9cdf-ccdccd5733fd"
      },
      "user": {
        "userId": "not-amazon",
      },
      "new": true
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
    "context": {
        "Alexa.Presentation.APL": {
            "token": "",
            "version": "AriaRenderer-1.0.563.0",
            "componentsVisibleOnScreen": [
                {
                    "id": "default",
                    "position": "480x480+0+0:0",
                    "type": "mixed",
                    "tags": {
                        "focused": false,
                        "spoken": false,
                        "disabled": false
                    },
                    "visibility": 1,
                    "children": [
                        {
                            "id": "default",
                            "position": "480x480+0+0:0",
                            "type": "graphic",
                            "tags": {
                                "focused": false,
                                "spoken": false,
                                "disabled": false
                            },
                            "visibility": 1,
                            "entities": []
                        },
                        {
                            "id": "default",
                            "position": "480x480+0+0:0",
                            "type": "mixed",
                            "tags": {
                                "focused": false,
                                "spoken": false,
                                "disabled": false,
                                "list": {
                                    "itemCount": 0,
                                    "lowestIndexSeen": 0,
                                    "highestIndexSeen": 0,
                                    "lowestOrdinalSeen": 1,
                                    "highestOrdinalSeen": 1
                                },
                                "scrollable": {
                                    "direction": "horizontal",
                                    "allowForward": false,
                                    "allowBackwards": false
                                }
                            },
                            "visibility": 1,
                            "entities": []
                        }
                    ],
                    "entities": []
                }
            ]
        },
        "System": {
            "application": {
                "applicationId": "amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828"
            },
            "user": {
                "userId": "amzn1.ask.account.AHAGAKR3UKYOM4KQKMADJMSVNYL3IDPBEMNT6OJDR22C2CICS2K243N7IHIP37ESQROUB5PKBF5WBTU7ZQWGWR4YQ5FNKEG4PIT65QFZ24CUH2MVFT7LWSXLCOH2I4Z3RRDGFVTJQGKFZMWPZ4EYVAWQ7FSX2CS52IFFSAEN3UG3RPDYWIK5XYFCIQ7SCHIUP7U5KCHEJZ5X4EQ"
            },
            "device": {
                "deviceId": "amzn1.ask.device.AGGQ77T42RPYRUBVXQEZPPDFF4MP6ST2QTUV7I65AAWMKBMZC2AZNABCFGLCM3PWUCT23KZ76PDRZ6QRUYAKLYCRRANHM6BUFF44YAXSWYDCOO72RC2FID33AY5OR6J3NO6Q5FGM5RAKJTO2OI6QEAUN47DGQMTW63AMAOR7URC7ALO3HO67W",
                "supportedInterfaces": {
                    "Alexa.Presentation.APL": {
                        "runtime": {
                            "maxVersion": "1.0"
                        }
                    }
                }
            },
            "apiEndpoint": "https://api.amazonalexa.com",
            "apiAccessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJhdWQiOiJodHRwczovL2FwaS5hbWF6b25hbGV4YS5jb20iLCJpc3MiOiJBbGV4YVNraWxsS2l0Iiwic3ViIjoiYW16bjEuYXNrLnNraWxsLjhmMGRkZWUxLTUxYjMtNDk2YS05NDI0LTUyNDQzNjc3MDgyOCIsImV4cCI6MTU0OTYyNjU1MSwiaWF0IjoxNTQ5NjI2MjUxLCJuYmYiOjE1NDk2MjYyNTEsInByaXZhdGVDbGFpbXMiOnsiY29uc2VudFRva2VuIjpudWxsLCJkZXZpY2VJZCI6ImFtem4xLmFzay5kZXZpY2UuQUdHUTc3VDQyUlBZUlVCVlhRRVpQUERGRjRNUDZTVDJRVFVWN0k2NUFBV01LQk1aQzJBWk5BQkNGR0xDTTNQV1VDVDIzS1o3NlBEUlo2UVJVWUFLTFlDUlJBTkhNNkJVRkY0NFlBWFNXWURDT083MlJDMkZJRDMzQVk1T1I2SjNOTzZRNUZHTTVSQUtKVE8yT0k2UUVBVU40N0RHUU1UVzYzQU1BT1I3VVJDN0FMTzNITzY3VyIsInVzZXJJZCI6ImFtem4xLmFzay5hY2NvdW50LkFIQUdBS1IzVUtZT000S1FLTUFESk1TVk5ZTDNJRFBCRU1OVDZPSkRSMjJDMkNJQ1MySzI0M043SUhJUDM3RVNRUk9VQjVQS0JGNVdCVFU3WlFXR1dSNFlRNUZOS0VHNFBJVDY1UUZaMjRDVUgyTVZGVDdMV1NYTENPSDJJNFozUlJER0ZWVEpRR0tGWk1XUFo0RVlWQVdRN0ZTWDJDUzUySUZGU0FFTjNVRzNSUERZV0lLNVhZRkNJUTdTQ0hJVVA3VTVLQ0hFSlo1WDRFUSJ9fQ.T20UcPbZ2snbew__YenT5W6x2Ear_Ekax4vEv3RoiSzb8fR7eOfTIIWdT4ObRtqevqUbtzJd0Qm52_VQmHzodEJtgEG3_wW7s6ERcP1bMTCaSclPOql7jaa_hgSnKvgR8guF4omEbSPaQNjlMA5cFI3eAwzATlzQ4ZR9EiVGPJ_NNAJuhQOnnB1GqyuCqhu0jmcc4ZycrsPS4ap9zxwVW_lhB5GUKYGd3U2mx6hltzovEK7l_RNljk6h4hYAbXn7UJV6H9P17oH4Bir7kl3oTGWbqEEtL6mNRD8C17KPBKcBf_dIFSiNgoJv-nHHGIZ5APXFMm6F_152zt6UfR940g"
        },
        "Viewport": {
            "experiences": [
                {
                    "arcMinuteWidth": 144,
                    "arcMinuteHeight": 144,
                    "canRotate": false,
                    "canResize": false
                }
            ],
            "shape": "ROUND",
            "pixelWidth": 480,
            "pixelHeight": 480,
            "dpi": 160,
            "currentPixelWidth": 480,
            "currentPixelHeight": 480,
            "touch": [
                "SINGLE"
            ],
            "keyboard": []
        }
     },
  };

  // If there is an attributes.txt file, read the attributes from there
  if (fs.existsSync(attributeFile)) {
    data = fs.readFileSync(attributeFile, 'utf8');
    if (data) {
      lambda.session.attributes = JSON.parse(data);
      //openEvent.session.attributes = JSON.parse(data);
    }
  }

  // If there is no argument, then we'll just return
  if (argv.length <= 2) {
    console.log('I need some parameters');
    return null;
  } else if (argv[2] == "seed") {
    if (fs.existsSync("seed.txt")) {
      data = fs.readFileSync("seed.txt", 'utf8');
      if (data) {
        return JSON.parse(data);
      }
    }
  } else if (argv[2] == 'bet') {
    lambda.request.intent = bet;
    if (argv.length > 3) {
      bet.slots.Amount.value = argv[3];
    }
  } else if (argv[2] == 'rules') {
    lambda.request.intent = rules;
    if (argv.length > 3) {
      rules.slots.Rules.value = argv[3];
    }
  } else if (argv[2] == 'hold') {
    lambda.request.intent = hold;
    if (argv.length > 3) {
      hold.slots.FirstCard.value = argv[3];
    }
    if (argv.length > 4) {
      hold.slots.SecondCard.value = argv[4];
    }
    if (argv.length > 5) {
      hold.slots.ThirdCard.value = argv[5];
    }
    if (argv.length > 6) {
      hold.slots.FourthCard.value = argv[6];
    }
    if (argv.length > 7) {
      hold.slots.FifthCard.value = argv[7];
    }
  } else if (argv[2] == 'discard') {
    lambda.request.intent = discard;
    if (argv.length > 3) {
      discard.slots.FirstCard.value = argv[3];
    }
    if (argv.length > 4) {
      discard.slots.SecondCard.value = argv[4];
    }
    if (argv.length > 5) {
      discard.slots.ThirdCard.value = argv[5];
    }
    if (argv.length > 6) {
      discard.slots.FourthCard.value = argv[6];
    }
    if (argv.length > 7) {
      discard.slots.FifthCard.value = argv[7];
    }
  } else if (argv[2] == 'toggle') {
    lambda.request.intent = toggle;
    if (argv.length > 3) {
      toggle.slots.Number.value = argv[3];
    }
  } else if (argv[2] == 'holdall') {
    lambda.request.intent = holdall;
  } else if (argv[2] == 'discardall') {
    lambda.request.intent = discardall;
  } else if (argv[2] == 'betmax') {
    lambda.request.intent = betMax;
  } else if (argv[2] == 'deal') {
    lambda.request.intent = deal;
  } else if (argv[2] == 'select') {
    lambda.request.intent = select;
  } else if (argv[2] == 'launch') {
    return openEvent;
  } else if (argv[2] == 'highscore') {
    lambda.request.intent = highScore;
  } else if (argv[2] == 'help') {
    lambda.request.intent = help;
  } else if (argv[2] == 'suggest') {
    lambda.request.intent = suggest;
  } else if (argv[2] == 'repeat') {
    lambda.request.intent = repeat;
  } else if (argv[2] == 'stop') {
    lambda.request.intent = stop;
  } else if (argv[2] == 'cancel') {
    lambda.request.intent = cancel;
  } else if (argv[2] == 'reset') {
    lambda.request.intent = reset;
  } else if (argv[2] == 'yes') {
    lambda.request.intent = yes;
  } else if (argv[2] == 'no') {
    lambda.request.intent = no;
  }
  else {
    console.log(argv[2] + ' was not valid');
    return null;
  }

  // Write the last action
  fs.writeFile('lastaction.txt', JSON.stringify(lambda), (err) => {
    if (err) {
      console.log(err);
    }
  });

  return lambda;
}
function ssmlToText(ssml) {
  let text = ssml;

  // Replace break with ...
  text = text.replace(/<break[^>]+>/g, ' ... ');

  // Remove all other angle brackets
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

function myResponse(err, result) {
  // Write the last action
  fs.writeFile('lastResponse.txt', JSON.stringify(result), (err) => {
    if (err) {
      console.log('ERROR; ' + err.stack);
    } else {
      if (result.sessionAttributes) {
        // Output the attributes
        fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
          if (err) {
            console.log(err);
          }
        });
        if (!process.env.NOLOG) {
          console.log('"attributes": ' + JSON.stringify(result.sessionAttributes));
        }
      }
      if (!result.response || !result.response.outputSpeech) {
        console.log('RETURNED ' + JSON.stringify(result));
      } else {
        if (result.response.outputSpeech.ssml) {
          console.log('AS SSML: ' + result.response.outputSpeech.ssml);
          console.log('AS TEXT: ' + ssmlToText(result.response.outputSpeech.ssml));
        } else {
          console.log(result.response.outputSpeech.text);
        }
        if (result.response.card && result.response.card.content) {
          console.log('Card Content: ' + result.response.card.content);
        }
        console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
      }
    }
  });
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  // Clear is a special case - delete this entry from the DB and delete the attributes.txt file
  dynamodb.deleteItem({TableName: 'VideoPoker', Key: { userId: {S: 'not-amazon'}}}, function (error, data) {
    console.log("Deleted " + error);
    if (fs.existsSync(attributeFile)) {
      fs.unlinkSync(attributeFile);
    }
  });
} else {
  var event = BuildEvent(process.argv);
  if (event) {
      mainApp.handler(event, null, myResponse);
  }
}
