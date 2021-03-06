//
// Main handler for Alexa video poker skill
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('alexa-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Bet = require('./intents/Bet');
const Deal = require('./intents/Deal');
const Hold = require('./intents/Hold');
const Toggle = require('./intents/Toggle');
const Discard = require('./intents/Discard');
const Rules = require('./intents/Rules');
const HighScore = require('./intents/HighScore');
const Repeat = require('./intents/Repeat');
const Suggest = require('./intents/Suggest');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Launch = require('./intents/Launch');
const Select = require('./intents/Select');
const utils = require('./utils');
const request = require('request');

const APP_ID = 'amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828';

// Handlers for our skill
const selectGameHandlers = Alexa.CreateStateHandler('SELECTGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'BetIntent': Select.handleBetIntent,
  'BetMaxIntent': Select.handleBetIntent,
  'DealIntent': Select.handleBetIntent,
  'SuggestIntent': Suggest.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.YesIntent': Select.handleYesIntent,
  'AMAZON.NoIntent': Select.handleNoIntent,
  'AMAZON.NextIntent': Select.handleNoIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    utils.emitResponse(this, null, null,
          res.strings.UNKNOWN_SELECT_INTENT, res.strings.UNKNOWN_SELECT_INTENT_REPROMPT);
  },
});

const newGameHandlers = Alexa.CreateStateHandler('NEWGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'BetIntent': Bet.handleIntent,
  'BetMaxIntent': Bet.handleMaxIntent,
  'DealIntent': Bet.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'SelectIntent': Select.handleIntent,
  'SuggestIntent': Repeat.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': Bet.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.NextIntent': Bet.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    utils.emitResponse(this, null, null,
          res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
});

const suggestionHandlers = Alexa.CreateStateHandler('SUGGESTION', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'AMAZON.YesIntent': Suggest.handleYesIntent,
  'AMAZON.NoIntent': Suggest.handleNoIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'Unhandled': function() {
    this.handler.state = 'FIRSTDEAL';
    this.emitWithState(this.event.request.intent.name);
  },
});

const firstDealHandlers = Alexa.CreateStateHandler('FIRSTDEAL', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'ElementSelected': Toggle.handleIntent,
  'ToggleIntent': Toggle.handleIntent,
  'HoldIntent': Hold.handleIntent,
  'HoldAllIntent': Hold.handleAllIntent,
  'DiscardIntent': Discard.handleIntent,
  'DiscardAllIntent': Discard.handleAllIntent,
  'DealIntent': Deal.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'AMAZON.YesIntent': Deal.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.NextIntent': Deal.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    utils.emitResponse(this, null, null,
          res.strings.UNKNOWN_DEAL_INTENT, res.strings.UNKNOWN_DEAL_INTENT_REPROMPT);
  },
});

const handlers = {
  'NewSession': function() {
    // Initialize attributes and route the request
    if (!this.attributes.currentGame) {
      this.attributes.currentGame = 'jacks';
    }

    if (!this.attributes[this.attributes.currentGame]) {
      this.attributes[this.attributes.currentGame] = {
        bankroll: 1000,
        high: 1000,
      };
    }

    this.attributes.firstHold = true;
    this.attributes.firstBet = true;
    this.emit('LaunchRequest');
  },
  'LaunchRequest': Launch.handleIntent,
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    utils.emitResponse(this, null, null,
          res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runSkill);
} else {
  exports.handler = runSkill;
}

function runSkill(event, context, callback) {
  AWS.config.update({region: 'us-east-1'});

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    context.succeed(CanFulfill.check(event));
    return;
  }

  const alexa = Alexa.handler(event, context);

  alexa.appId = APP_ID;
  if (!event.session.sessionId || event.session['new']) {
    const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    doc.get({TableName: 'VideoPoker',
            ConsistentRead: true,
            Key: {userId: event.session.user.userId}},
            (err, data) => {
      if (err || (data.Item === undefined)) {
        if (err) {
          console.log('Error reading attributes ' + err);
        } else {
          request.post({url: process.env.SERVICEURL + 'videopoker/newUser'}, (err, res, body) => {
          });
        }
      } else {
        Object.assign(event.session.attributes, data.Item.mapAttr);
      }

      execute();
    });
  } else {
    execute();
  }

  function execute() {
    utils.setEvent(event);
    alexa.registerHandlers(handlers, newGameHandlers,
        suggestionHandlers, firstDealHandlers, selectGameHandlers);
    alexa.execute();
  }
}

function saveState(userId, attributes) {
  const formData = {};

  formData.savedb = JSON.stringify({
    userId: userId,
    attributes: attributes,
  });

  const params = {
    url: process.env.SERVICEURL + 'videopoker/saveState',
    formData: formData,
  };

  request.post(params, (err, res, body) => {
    if (err) {
      console.log(err);
    }
  });
}
