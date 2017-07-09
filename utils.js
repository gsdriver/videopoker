//
// Utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const speechUtils = require('alexa-speech-utils')();
const pokerrank = require('poker-ranking');

const games = {
  // Has 99.8% payout
  'jacks': {
    'maxCoins': 5,
    'wildCards': '',
    'payouts': {
      'royalflush': '250|500|750|1000|4000',
      'straightflush': '50|100|150|200|250',
      '4ofakind': '25|50|75|100|125',
      'fullhouse': '9|18|27|36|45',
      'flush': '6|12|18|24|30',
      'straight': '4|8|12|16|20',
      '3ofakind': '3|6|9|12|15',
      '2pair': '2|4|6|8|10',
      'jackpair': '1|2|3|4|5',
    },
  },
  // 99.8% payout, no lower payouts but higher opportunity for jackpots
  'deuces': {
    'maxCoins': 5,
    'special': 'WILD_SPECIAL',
    'wildCards': '2',
    'payouts': {
      'royalflushnatural': '250|500|750|1000|4000',
      '4wild': '200|400|600|800|1000',
      'royalflush': '25|50|75|100|125',
      '5ofakind': '15|30|45|60|75',
      'straightflush': '9|18|27|36|45',
      '4ofakind': '5|10|15|20|25',
      'fullhouse': '3|6|9|12|15',
      'flush': '2|4|6|8|10',
      'straight': '2|4|6|8|10',
      '3ofakind': '1|2|3|4|5',
    },
  },
};

module.exports = {
  emitResponse: function(emit, locale, error, response, speech, reprompt) {
    if (error) {
      const res = require('./' + locale + '/resources');
      console.log('Speech error: ' + error);
      emit(':ask', error, res.ERROR_REPROMPT);
    } else if (response) {
      emit(':tell', response);
    } else {
      emit(':ask', speech, reprompt);
    }
  },
  getGame: function(name) {
    return games[name];
  },
  determineWinner: function(attributes) {
    const game = attributes[attributes.currentGame];
    const rules = games[attributes.currentGame];
    let rank;

    rank = pokerrank.evaluateHand(game.cards.map((card) => card.rank + card.suit),
              {aceCanBeLow: true, wildCards: rules.wildCards.slice('|')});

    // Override for some special cases
    if (rules.payouts['jackpair']) {
      if (rank === 'pair') {
        // If the pair is pair of jacks or better, mark as 'jackpair'
        let faceCards = [0, 0, 0, 0];
        const faceCardMap = ['J', 'Q', 'K', 'A'];

        game.cards.map((card) => {
          if (faceCardMap.indexOf(card.rank) > -1) {
            faceCards[faceCardMap.indexOf(card.rank) + 1]++;
          } else if (rules.wildCards.slice('|').indexOf(card.rank) > -1) {
            faceCards = faceCards.map((value) => {
              return (value + 1);
            });
          }
        });
        if (faceCards.indexOf(2) > -1) {
          rank = 'jackpair';
        }
      }
    }
    if (rules.payouts['royalflushnatural']) {
      if (rank === 'royalflush') {
        // If it's a natural, then mark as such
        let hasWild = false;

        game.cards.map((card) => {
          if (rules.wildCards.slice('|').indexOf(card.rank) > -1) {
            hasWild = true;
          }
        });
        if (!hasWild) {
          rank = 'royalflushnatural';
        }
      }
    }
    if (rules.payouts['4wild']) {
      if (rank === '5ofakind') {
        // If this is really 4 wild cards, mark it as such
        let numWild = 0;

        game.cards.map((card) => {
          if (rules.wildCards.slice('|').indexOf(card.rank) > -1) {
            numWild++;
          }
        });

        if (numWild === 4) {
          rank = '4wild';
        }
      }
    }

    return rank;
  },
  readAvailableGames: function(locale, currentGame, currentFirst, callback) {
    const res = require('./' + locale + '/resources');
    let speech;
    const choices = [];
    const choiceText = [];
    let game;
    let count = 0;

    for (game in games) {
      if (game) {
        count++;
        // Put the last played game at the front of the list
        if (game != currentGame) {
         choices.push(game);
         choiceText.push(res.sayGame(game));
       }
      }
    }

    // And now the current game - either first or last in the list
    if (currentGame && games[currentGame]) {
      if (currentFirst) {
        choices.unshift(currentGame);
        choiceText.unshift(res.sayGame(currentGame));
      } else {
         choices.push(currentGame);
         choiceText.push(res.sayGame(currentGame));
      }
    }

    speech = res.strings.AVAILABLE_GAMES.replace('{0}', count);
    speech += speechUtils.and(choiceText, {locale: locale});
    speech += '. ';
    callback(speech, choices);
  },
  readCoins: function(locale, coins) {
    const res = require('./' + locale + '/resources');
    return speechUtils.numberOfItems(coins, res.strings.SINGLE_COIN, res.strings.PLURAL_COIN);
  },
  readPayout: function(locale, game, payout) {
    return readPayoutInternal(locale, game, payout, ' <break time=\"200ms\"/> ');
  },
  readPayoutTable: function(locale, game) {
    const res = require('./' + locale + '/resources');
    let text = '';
    let payout;
    let i;

    for (i = 0; i < (game.wild ? game.wild.length : 0); i++) {
      text += res.strings.WILD_SYMBOL.replace('{0}', res.saySymbol(game.wild[i]));
      text += '\n';
    }

    for (payout in game.payouts) {
      if (payout) {
        // Special case if it's the progressive
        text += readPayoutInternal(locale, game, payout, ' ');
        text += readPayoutAmountInternal(locale, game, payout);
        text += '\n';
      }
    }

    return text;
  },
  readPayoutAmount: function(locale, game, payout) {
    return readPayoutAmountInternal(locale, game, payout);
  },
  readLeaderBoard: function(locale, attributes, callback) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];

    getTopScoresFromS3(attributes, (err, scores) => {
      let speech = '';

      // OK, read up to five high scores
      if (!scores || (scores.length === 0)) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        // What is your ranking - assuming you've done a spin
        if (game.spins > 0) {
          const ranking = scores.indexOf(game.high) + 1;

          speech += res.strings.LEADER_RANKING
            .replace('{0}', game.high)
            .replace('{1}', res.sayGame(attributes.currentGame))
            .replace('{2}', ranking)
            .replace('{3}', scores.length);
        }

        // And what is the leader board?
        const toRead = (scores.length > 5) ? 5 : scores.length;
        const topScores = scores.slice(0, toRead).map((x) => res.strings.LEADER_FORMAT.replace('{0}', x));
        speech += res.strings.LEADER_TOP_SCORES.replace('{0}', toRead);
        speech += speechUtils.and(topScores, {locale: locale, pause: '300ms'});
      }

      callback(speech);
    });
  },
  getProgressivePayout: function(attributes, callback) {
    const rules = games[attributes.currentGame];

    // If there is no progressive for this game, just return undefined
    if (rules && rules.progressive) {
      // Read from Dynamodb
      dynamodb.getItem({TableName: 'VideoPoker', Key: {userId: {S: 'game-' + attributes.currentGame}}},
              (err, data) => {
        if (err || (data.Item === undefined)) {
          console.log(err);
          callback((attributes[attributes.currentGame].progressiveJackpot)
                ? attributes[attributes.currentGame].progressiveJackpot
                : rules.progressive.start);
        } else {
          let coins;

          if (data.Item.coins && data.Item.coins.N) {
            coins = parseInt(data.Item.coins.N);
          } else {
            coins = rules.progressive.start;
          }

          callback(Math.floor(rules.progressive.start + (coins * rules.progressive.rate)));
        }
      });
    } else {
      callback(undefined);
    }
  },
  incrementProgressive: function(attributes, coinsToAdd) {
    if (games[attributes.currentGame].progressive) {
      const params = {
          TableName: 'VideoPoker',
          Key: {userId: {S: 'game-' + attributes.currentGame}},
          AttributeUpdates: {coins: {
              Action: 'ADD',
              Value: {N: coinsToAdd.toString()}},
          }};

      dynamodb.updateItem(params, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
    }
  },
  // Updates DynamoDB to note that the progressive was won!
  // Note this function does not callback
  resetProgressive: function(game) {
    // Write to the DB, and reset the coins played to 0
    dynamodb.putItem({TableName: 'VideoPoker',
        Item: {userId: {S: 'game-' + game}, coins: {N: '0'}}},
        (err, data) => {
      // We don't take a callback, but if there's an error log it
      if (err) {
        console.log(err);
      }
    });
  },
  // Write jackpot details to S3
  writeJackpotDetails: function(userId, game, jackpot) {
    // It's not the same, so try to write it out
    const details = {userId: userId, amount: jackpot};
    const params = {Body: JSON.stringify(details),
      Bucket: 'garrett-alexa-usage',
      Key: 'jackpots/videopoker/' + game + '-' + Date.now() + '.txt'};

    s3.putObject(params, (err, data) => {
      // Don't care about teh error
      if (err) {
        console.log(err, err.stack);
      }
      // Update number of progressive wins while you're at it
      dynamodb.updateItem({TableName: 'VideoPoker',
          Key: {userId: {S: 'game-' + game}},
          AttributeUpdates: {jackpots: {
              Action: 'ADD',
              Value: {N: '1'}},
      }}, (err, data) => {
        // Again, don't care about the error
        if (err) {
          console.log(err);
        }
      });
    });
  },
  saveNewUser: function() {
    // Brand new player - let's log this in our DB (async call)
    const params = {
              TableName: 'VideoPoker',
              Key: {userId: {S: 'game'}},
              AttributeUpdates: {newUsers: {
                  Action: 'ADD',
                  Value: {N: '1'}},
              }};

    dynamodb.updateItem(params, (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
};

function readPayoutInternal(locale, game, payout, pause) {
  const res = require('./' + locale + '/resources');
  const slots = payout.split('|');
  let text = '';
  let i;

  for (i = 0; i < slots.length; i++) {
    text += res.saySymbol(slots[i]);
    text += pause;
  }

  for (i = slots.length; i < game.slots; i++) {
    text += res.strings.ANY_SLOT;
    text += pause;
  }

  return text;
}

function readPayoutAmountInternal(locale, game, payout) {
  let text;
  const res = require('./' + locale + '/resources');

  if (game.progressive && (game.progressive.match === payout)) {
    text = res.strings.PAYOUT_PROGRESSIVE;
  } else {
    text = res.strings.PAYOUT_PAYS.replace('{0}', game.payouts[payout]);
  }

  return text;
}

function getTopScoresFromS3(attributes, callback) {
  const game = attributes[attributes.currentGame];

  // Read the S3 buckets that has everyone's scores
  s3.getObject({Bucket: 'garrett-alexa-usage', Key: 'VideoPokerScores.txt'}, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    } else {
      // Yeah, I can do a binary search (this is sorted), but straight search for now
      const ranking = JSON.parse(data.Body.toString('ascii'));
      const scores = ranking.scores;

      if (scores && scores[attributes.currentGame]) {
        // If their current high score isn't in the list, add it
        if (scores[attributes.currentGame].indexOf(game.high) < 0) {
          scores[attributes.currentGame].push(game.high);
        }

        callback(null, scores[attributes.currentGame].sort((a, b) => (b - a)));
      } else {
        console.log('No scores for ' + attributes.currentGame);
        callback('No scoreset', null);
      }
    }
  });
}
