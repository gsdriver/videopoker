var mainApp = require('../lambda/custom/index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
if (process.env.RUN_DB_LOCAL) {
  AWS.config.update({region: 'us-west-2', endpoint: 'http://localhost:8000'});
} else {
  AWS.config.update({region: 'us-east-1'});
}
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

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
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa8",
      "application": {
        "applicationId": "amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828"
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
      "locale": "en-US",
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0"
  };

  var openEvent = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa8",
      "application": {
        "applicationId": "amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828"
      },
      "attributes": {},
      "user": {
        "userId": "not-amazon",
      },
      "new": true
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": "en-US",
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0"
  };

  // If there is an attributes.txt file, read the attributes from there
  const fs = require('fs');
  if (fs.existsSync(attributeFile)) {
    data = fs.readFileSync(attributeFile, 'utf8');
    if (data) {
      lambda.session.attributes = JSON.parse(data);
      openEvent.session.attributes = JSON.parse(data);
    }
  }

  // If there is no argument, then we'll just return
  if (argv.length <= 2) {
    console.log('I need some parameters');
    return null;
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

  return lambda;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

myResponse.succeed = function(result) {
  if (result.response.outputSpeech.ssml) {
    console.log('AS SSML: ' + result.response.outputSpeech.ssml);
  } else {
    console.log(result.response.outputSpeech.text);
  }
  if (result.response.card && result.response.card.content) {
    console.log('Card Content: ' + result.response.card.content);
  }
  console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
  if (result.sessionAttributes) {
    // Output the attributes too
    const fs = require('fs');
    fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
      if (!process.env.NOLOG) {
        console.log('attributes:' + JSON.stringify(result.sessionAttributes) + ',');
      }
    });
  }
}

myResponse.fail = function(e) {
  console.log(e);
}

/* function createTable(callback)
{
    var dynamodb = new AWS.DynamoDB();
    var params = {
            TableName : "VideoPoker",
            KeySchema: [
            { AttributeName: "userId", KeyType: "HASH"},
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
       }
    };

    dynamodb.createTable(params, callback);
}

createTable();
return; */

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  const fs = require('fs');

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
      mainApp.handler(event, myResponse);
  }
}
