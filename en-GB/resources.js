//
// Localized resources
//

const resources = {
  // From index.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Bet.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Bet.',
  'UNKNOWN_SELECT_INTENT': 'Sorry, I didn\'t get that. Try saying Yes.',
  'UNKNOWN_SELECT_INTENT_REPROMPT': 'Try saying Yes.',
  // Launch.js
  'LAUNCH_REPROMPT': 'Would you like to play {0}? ',
  'LAUNCH_WELCOME': 'Welcome to Video Poker. ',
  // Select.js
  'SELECT_WELCOME': 'Welcome to {0}. ',
  'SELECT_REPROMPT': 'You can bet up to {0} coins <break time=\"200ms\"/> or say read high scores to hear the leader board.',
  // From Exit.js
  'EXIT_GAME': '{0} Goodbye.',
  // From HighScore.js
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // From Hold.js
  'HOLD_CARDS': 'You held {0}. ',
  // From Bet.js
  'BET_INVALID_AMOUNT': 'I\'m sorry, {0} is not a valid amount to bet.',
  'BET_INVALID_REPROMPT': 'What else can I help you with?',
  'BET_EXCEEDS_MAX': 'Sorry, this bet exceeds the maximum bet of {0}.',
  'BET_EXCEEDS_BANKROLL': 'Sorry, this bet exceeds your bankroll of {0}.',
  'BET_PLACED': 'You bet {0}. ',
  'BET_PLACED_REPROMPT': 'Say spin to pull the handle.',
  // From Help.js
  'HELP_COMMANDS': 'Say bet to insert coins <break time=\"200ms\"/> spin to pull the handle <break time=\"200ms\"/> read high scores to hear the leader board <break time=\"200ms\"/> or select a new machine to change to a different machine. ',
  'HELP_REPROMPT': 'Check the Alexa companion app for the payout table.',
  'HELP_CARD_TITLE': 'Payout Table',
  'HELP_SELECT_TEXT': 'Say yes to select the offered machine, or no for a different machine. ',
  // From Rules.js
  'RULES_REPROMPT': 'Say bet to insert coins or spin to pull the handle.',
  'RULES_CARD_TITLE': 'Payout Table',
  // From Spin.js
  'SPIN_NOBETS': 'Sorry, you have to place a bet before you can pull the handle.',
  'SPIN_INVALID_REPROMPT': 'Place a bet',
  'SPIN_CANTBET_LASTBETS': 'Sorry, your bankroll of {0} can\'t support your last set of bets.',
  'SPIN_RESULT': ' {0}. ',
  'SPIN_WINNER': 'You matched {0} and won {1}. ',
  'SPIN_PROGRESSIVE_WINNER': 'You hit the progressive jackpot and won {0}! ',
  'SPIN_LOSER': 'Sorry, you lost. ',
  'SPIN_PLAY_AGAIN': 'Would you like to spin again?',
  'SPIN_BUSTED': 'You lost all your money. Resetting to 1000 coins and clearing your bet. ',
  'SPIN_BUSTED_REPROMPT': 'Place a bet.',
  'DEALT_CARDS': 'You got {0}. ',
  // From utils.js
  'ERROR_REPROMPT': 'What else can I help with?',
  'ANY_SLOT': 'any',
  'PAYOUT_PAYS': 'pays {0} coins.',
  'PAYOUT_PROGRESSIVE': 'pays the progessive jackpot.',
  'LEADER_RANKING': 'Your high score of {0} coins on {1} ranks you as <say-as interpret-as="ordinal">{2}</say-as> of {3} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_FORMAT': '{0} coins',
  'LEADER_TOP_SCORES': 'The top {0} scores are ',
  'AVAILABLE_GAMES': 'We have {0} different games <break time=\"200ms\"/> ',
  'WILD_SPECIAL': 'Cherries are wild. ',
  'PROGRESSIVE_SPECIAL': 'Diamond diamond diamond wins the progressive jackpot when the maximum number of coins are played. ',
  // General
  'SINGLE_COIN': 'coin',
  'PLURAL_COIN': 'coins',
  'READ_BANKROLL': 'You have {0}. ',
  'PROGRESSIVE_JACKPOT': 'The progressive jackpot is currently {0} coins. Bet {1} coins to win the progressive jackpot. ',
};

module.exports = {
  strings: resources,
  sayGame: function(game) {
    const gameMap = {'jacks': 'jacks or better',
      'deuces': 'deuces wild'};

    return (gameMap[game]) ? gameMap[game] : game;
  },
  readCard: function(card, withArticle) {
    const names = ['none', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
    const articleNames = ['none', 'an ace', 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten', 'a jack', 'a queen', 'a king'];
    const suitNames = {'C': 'of clubs', 'D': 'of diamonds', 'H': 'of hearts', 'S': 'of spades'};

    if (withArticle === 'article') {
      return (articleNames[card.rank] + ' ' + suitNames[card.suit]);
    } else {
      return (names[card.rank] + ' ' + suitNames[card.suit]);
    }
  },
  ordinalMapping: function(ordinal) {
    const ordinals = {'first': [1], 'second': [2], 'third': [3], 'fourth': [4], 'fifth': [5],
        'all': [1, 2, 3, 4, 5]};

    return (ordinals[ordinal.toLowerCase()]);
  },
  getRank: function(rank) {
    const ranks = {'ace': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
        'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'jack': 11, 'queen': 12, 'king': 13,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10};

    return (ranks[rank.toLowerCase()]);
  },
  getSuit: function(suit) {
    const suits = {'club': 'C', 'clubs': 'C', 'diamond': 'D', 'diamonds': 'D',
        'heart': 'H', 'hearts': 'H', 'spade': 'S', 'spades': 'S'};

    return (suits[suit.toLowerCase()]);
  },
};

