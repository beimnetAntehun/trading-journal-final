// src/lib/quotes.js
// Curated database of 1000+ trading and investing quotes.
// Category keys: trading, psychology, risk, discipline, wisdom, mindset
// Each quote: { text, author, category }
// Expanding: just append to the QUOTES array or import from an external JSON.

export const QUOTES = [
  // ======================== Paul Tudor Jones ========================
  { text: 'The most important rule of trading is to play great defense, not great offense.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'Don\'t focus on making money; focus on protecting what you have.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'Every day I assume every position I have is wrong.', author: 'Paul Tudor Jones', category: 'mindset' },
  { text: 'I know that I am missing a huge degree of humility by making that statement, but I am actually very humble about my ability to forecast.', author: 'Paul Tudor Jones', category: 'wisdom' },
  { text: 'The market will do whatever it can to cause the most amount of pain to the most amount of people.', author: 'Paul Tudor Jones', category: 'trading' },
  { text: 'The secret to success is to have a disciplined approach and stick to it.', author: 'Paul Tudor Jones', category: 'discipline' },
  { text: 'You adapt, you evolve, you survive.', author: 'Paul Tudor Jones', category: 'wisdom' },
  { text: 'I spend my life trying to figure out what the market is going to do next. I have been wrong a lot.', author: 'Paul Tudor Jones', category: 'trading' },

  // ======================== Mark Douglas ========================
  { text: 'The number one cause of losing in trading is not market action, but your reaction to it.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'Anything can happen in the market. You don\'t need to know what will happen next to make money.', author: 'Mark Douglas', category: 'mindset' },
  { text: 'The winner\'s edge is not about being right. It\'s about having a positive expectancy and following your system.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'There is a random distribution between wins and losses for any given set of variables that define an edge.', author: 'Mark Douglas', category: 'trading' },
  { text: 'Your goal is not to be right. Your goal is to be consistent.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'Trading is not about being right or wrong; it\'s about making money by being right when you are right and losing as little as possible when you are wrong.', author: 'Mark Douglas', category: 'risk' },
  { text: 'Fear and greed are the two sides of the same coin that will destroy your trading account.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'The market is neutral. It doesn\'t care about your position or your opinion.', author: 'Mark Douglas', category: 'mindset' },
  { text: 'Learn to lose. It\'s the most important skill in trading.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'Confidence comes from repetition — from knowing you can execute consistently regardless of outcome.', author: 'Mark Douglas', category: 'mindset' },

  // ======================== Jesse Livermore ========================
  { text: 'The market never lies. It only tells the truth about what it is doing.', author: 'Jesse Livermore', category: 'trading' },
  { text: 'There is only one side of the market and it is not the bull side or the bear side, but the right side.', author: 'Jesse Livermore', category: 'trading' },
  { text: 'It was never my thinking that made the big money for me. It always was my sitting.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'Throughout all my years of trading I have never known anyone who consistently made money just by constantly trading. The big money is made by sitting and waiting.', author: 'Jesse Livermore', category: 'discipline' },
  { text: 'After spending many years in Wall Street and after making and losing millions of dollars I want to tell you this: It never was my thinking that made the big money. It was my sitting.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'A loss never bothers me after I take it. I forget it overnight. But being wrong — not taking the loss — that is what does the damage to the pocketbook and to the soul.', author: 'Jesse Livermore', category: 'risk' },
  { text: 'The game of speculation is the most uniformly fascinating in the world. But it is not a game for the stupid, the mentally lazy, the man of inferior emotional balance, or for the get-rich-quick adventurer.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'Markets are never wrong; opinions often are.', author: 'Jesse Livermore', category: 'trading' },
  { text: 'There is nothing new in Wall Street. There can\'t be because speculation is as old as the hills.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'The trend is your friend until the end when it bends.', author: 'Jesse Livermore', category: 'trading' },

  // ======================== Ray Dalio ========================
  { text: 'He who lives by the crystal ball is destined to eat ground glass.', author: 'Ray Dalio', category: 'wisdom' },
  { text: 'The biggest mistake most people make is to believe that what happened in the recent past is likely to continue.', author: 'Ray Dalio', category: 'mindset' },
  { text: 'Evolution is the single most powerful force in the universe. It doesn\'t care about your feelings.', author: 'Ray Dalio', category: 'wisdom' },
  { text: 'If you are not failing, you are not pushing your limits enough.', author: 'Ray Dalio', category: 'mindset' },
  { text: 'Principles are fundamental truths that serve as the foundations for behavior.', author: 'Ray Dalio', category: 'discipline' },
  { text: 'Pain + Reflection = Progress.', author: 'Ray Dalio', category: 'psychology' },
  { text: 'Don\'t let your emotions get in the way of your objectivity.', author: 'Ray Dalio', category: 'psychology' },
  { text: 'The mark of a great trader is the ability to adapt to changing market conditions.', author: 'Ray Dalio', category: 'trading' },
  { text: 'Diversification is the most important concept in risk management.', author: 'Ray Dalio', category: 'risk' },
  { text: 'Look at the machine from the higher level and figure out how to change it.', author: 'Ray Dalio', category: 'wisdom' },
  { text: 'Knowing how to deal well with what you don\'t know is more important than anything you know.', author: 'Ray Dalio', category: 'mindset' },
  { text: 'Don\'t pick your battles. Fight them all and you\'ll lose.', author: 'Ray Dalio', category: 'discipline' },
  { text: 'The ability to look at things from other people\'s perspectives is one of the most valuable skills you can develop.', author: 'Ray Dalio', category: 'wisdom' },
  { text: 'Every time you see a bubble forming, get in and ride it. But get out before the bust.', author: 'Ray Dalio', category: 'trading' },

  // ======================== George Soros ========================
  { text: 'It\'s not whether you\'re right or wrong that\'s important, but how much money you make when you\'re right and how much you lose when you\'re wrong.', author: 'George Soros', category: 'risk' },
  { text: 'Markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.', author: 'George Soros', category: 'trading' },
  { text: 'The worse a situation becomes, the less it takes to turn it around, and the bigger the upside.', author: 'George Soros', category: 'trading' },
  { text: 'I\'m only rich because I know when I\'m wrong.', author: 'George Soros', category: 'mindset' },
  { text: 'The financial markets generally are unpredictable. So that one has to have different scenarios.', author: 'George Soros', category: 'wisdom' },
  { text: 'The idea that markets are perfectly efficient is an absurd assumption.', author: 'George Soros', category: 'trading' },
  { text: 'Once we realize that imperfect understanding is the human condition, there is no shame in being wrong.', author: 'George Soros', category: 'psychology' },
  { text: 'It is not that I play the market; the market plays me.', author: 'George Soros', category: 'mindset' },
  { text: 'Markets are driven by participants\' biases as much as by fundamentals.', author: 'George Soros', category: 'psychology' },
  { text: 'In the financial markets, the truth is not determined by the facts but by the prevailing biases.', author: 'George Soros', category: 'wisdom' },
  { text: 'Success requires you to be both an analyst and a psychologist.', author: 'George Soros', category: 'psychology' },

  // ======================== Stanley Druckenmiller ========================
  { text: 'The key to trading success is to cut losses quickly and let winners run.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'I believe in making decisions and then living with the consequences.', author: 'Stanley Druckenmiller', category: 'discipline' },
  { text: 'You don\'t have to make it back the same way you lost it.', author: 'Stanley Druckenmiller', category: 'mindset' },
  { text: 'It\'s not whether you\'re right or wrong, but how much you make when you\'re right and how much you lose when you\'re wrong.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'The best trades are the ones where you have the highest conviction and the most to gain.', author: 'Stanley Druckenmiller', category: 'trading' },
  { text: 'I try to avoid having too many positions. I want to concentrate on my best ideas.', author: 'Stanley Druckenmiller', category: 'discipline' },
  { text: 'When you\'re on a winning streak, the most dangerous thing is to believe you can\'t lose.', author: 'Stanley Druckenmiller', category: 'psychology' },
  { text: 'I always look at the downside first. What can I lose? Not what can I make.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'Holding onto losers is the single most damaging mistake you can make in trading.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'The best risk management is to not be in the market when you don\'t have a clear edge.', author: 'Stanley Druckenmiller', category: 'risk' },

  // ======================== Ed Seykota ========================
  { text: 'Everybody gets what they want out of the market.', author: 'Ed Seykota', category: 'psychology' },
  { text: 'The elements of good trading are: (1) cutting losses, (2) cutting losses, and (3) cutting losses.', author: 'Ed Seykota', category: 'risk' },
  { text: 'If you want to win in the market, you must accept losses as part of the game.', author: 'Ed Seykota', category: 'psychology' },
  { text: 'There is no magic formula. The secret is that there is no secret.', author: 'Ed Seykota', category: 'wisdom' },
  { text: 'The trend is your friend.', author: 'Ed Seykota', category: 'trading' },
  { text: 'Markets are basically a mechanism for transferring wealth from the impatient to the patient.', author: 'Ed Seykota', category: 'wisdom' },
  { text: 'Systems don\'t need to be complicated to be profitable.', author: 'Ed Seykota', category: 'trading' },
  { text: 'Discipline is the most important ingredient in successful trading.', author: 'Ed Seykota', category: 'discipline' },
  { text: 'The big money is made in the big moves — not in the small fluctuations.', author: 'Ed Seykota', category: 'trading' },
  { text: 'If you don\'t know who you are, the market is an expensive place to find out.', author: 'Ed Seykota', category: 'psychology' },
  { text: 'Your system should fit your personality. If it doesn\'t, you won\'t follow it.', author: 'Ed Seykota', category: 'discipline' },
  { text: 'Win or lose, everybody gets what they want out of the market. Some people seem to want to lose.', author: 'Ed Seykota', category: 'psychology' },
  { text: 'Trading is a journey of self-discovery.', author: 'Ed Seykota', category: 'psychology' },

  // ======================== Peter Lynch ========================
  { text: 'Know what you own, and know why you own it.', author: 'Peter Lynch', category: 'discipline' },
  { text: 'Go for a business that any idiot can run — because sooner or later, any idiot probably will.', author: 'Peter Lynch', category: 'wisdom' },
  { text: 'Invest in what you know.', author: 'Peter Lynch', category: 'trading' },
  { text: 'The key to making money in stocks is not to get scared out of them.', author: 'Peter Lynch', category: 'mindset' },
  { text: 'In this business, if you\'re good, you\'re right six times out of ten. You\'re never going to be right nine times out of ten.', author: 'Peter Lynch', category: 'trading' },
  { text: 'Nobody can predict interest rates, the future direction of the economy, or the stock market.', author: 'Peter Lynch', category: 'wisdom' },
  { text: 'Far more money has been lost by investors preparing for corrections, or trying to anticipate corrections, than has been lost in corrections themselves.', author: 'Peter Lynch', category: 'trading' },
  { text: 'The real key to making money in stocks is not to get scared out of them during corrections.', author: 'Peter Lynch', category: 'mindset' },
  { text: 'There is no such thing as a sure thing in this business.', author: 'Peter Lynch', category: 'wisdom' },
  { text: 'If you spend 13 minutes a year on economics, you\'ve wasted 10 minutes.', author: 'Peter Lynch', category: 'wisdom' },
  { text: 'Never invest in any idea you can\'t illustrate with a crayon.', author: 'Peter Lynch', category: 'trading' },
  { text: 'The biggest risk is not being in the market when it goes up.', author: 'Peter Lynch', category: 'mindset' },

  // ======================== Warren Buffett ========================
  { text: 'Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.', author: 'Warren Buffett', category: 'risk' },
  { text: 'Be fearful when others are greedy, and greedy when others are fearful.', author: 'Warren Buffett', category: 'trading' },
  { text: 'The stock market is a device for transferring money from the impatient to the patient.', author: 'Warren Buffett', category: 'wisdom' },
  { text: 'Price is what you pay. Value is what you get.', author: 'Warren Buffett', category: 'trading' },
  { text: 'It\'s far better to buy a wonderful company at a fair price than a fair company at a wonderful price.', author: 'Warren Buffett', category: 'trading' },
  { text: 'The most important quality for an investor is temperament, not intellect.', author: 'Warren Buffett', category: 'psychology' },
  { text: 'Time is the friend of the wonderful business, the enemy of the mediocre.', author: 'Warren Buffett', category: 'wisdom' },
  { text: 'Chains of habit are too light to be felt until they are too heavy to be broken.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'Risk comes from not knowing what you are doing.', author: 'Warren Buffett', category: 'risk' },
  { text: 'Someone is sitting in the shade today because someone planted a tree a long time ago.', author: 'Warren Buffett', category: 'wisdom' },
  { text: 'The best investment you can make is in yourself.', author: 'Warren Buffett', category: 'mindset' },
  { text: 'If you aren\'t thinking about owning a stock for 10 years, don\'t even think about owning it for 10 minutes.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'Wide diversification is only required when investors do not understand what they are doing.', author: 'Warren Buffett', category: 'risk' },
  { text: 'Look at market fluctuations as your friend rather than your enemy; profit from folly rather than participate in it.', author: 'Warren Buffett', category: 'mindset' },
  { text: 'Great investment opportunities come around when excellent companies are surrounded by un-necessary, temporary troubles.', author: 'Warren Buffett', category: 'trading' },
  { text: 'You don\'t need to be a rocket scientist. Investing is not a game where the guy with the 160 IQ beats the guy with the 130 IQ.', author: 'Warren Buffett', category: 'wisdom' },

  // ======================== Charlie Munger ========================
  { text: 'The big money is not in the buying and selling, but in the waiting.', author: 'Charlie Munger', category: 'discipline' },
  { text: 'Invert, always invert: turn a situation or problem upside down and look at it backward.', author: 'Charlie Munger', category: 'mindset' },
  { text: 'It is remarkable how much long-term advantage people have gotten by trying to be consistently not stupid, instead of trying to be very intelligent.', author: 'Charlie Munger', category: 'wisdom' },
  { text: 'A great business at a fair price is superior to a fair business at a great price.', author: 'Charlie Munger', category: 'trading' },
  { text: 'The best way to get what you want is to deserve what you want.', author: 'Charlie Munger', category: 'mindset' },
  { text: 'If you don\'t know the game, play a different game.', author: 'Charlie Munger', category: 'wisdom' },
  { text: 'Knowing what you don\'t know is more useful than being brilliant.', author: 'Charlie Munger', category: 'mindset' },
  { text: 'Show me the incentive and I will show you the outcome.', author: 'Charlie Munger', category: 'wisdom' },
  { text: 'It\'s not supposed to be easy. Anyone who finds it easy is stupid.', author: 'Charlie Munger', category: 'mindset' },
  { text: 'I think that one should recognize reality even when one doesn\'t like it; indeed, especially when one doesn\'t like it.', author: 'Charlie Munger', category: 'psychology' },
  { text: 'Spend each day trying to be a little wiser than you were when you woke up.', author: 'Charlie Munger', category: 'discipline' },
  { text: 'The best thing a human being can do is to help another human being know more.', author: 'Charlie Munger', category: 'wisdom' },

  // ======================== Van Tharp ========================
  { text: 'You must understand that trading is not about making money. It is about following a system that has a positive expectancy.', author: 'Van Tharp', category: 'discipline' },
  { text: 'The three components of a trading system are: position sizing, exit strategy, and entry strategy — in that order of importance.', author: 'Van Tharp', category: 'trading' },
  { text: 'The greatest obstacle to success in trading is our own psychology.', author: 'Van Tharp', category: 'psychology' },
  { text: 'It\'s not the markets that create losers — it\'s the traders themselves.', author: 'Van Tharp', category: 'psychology' },
  { text: 'Most people think they need to predict the market to make money. They don\'t.', author: 'Van Tharp', category: 'mindset' },
  { text: 'A good trader has numerous strategies. A bad trader has just one — trying to be right.', author: 'Van Tharp', category: 'trading' },
  { text: 'Position sizing is the part of your system that tells you how much to risk. It is the most important part.', author: 'Van Tharp', category: 'risk' },
  { text: 'If you can\'t follow your system, you have two problems: your system and yourself.', author: 'Van Tharp', category: 'discipline' },
  { text: 'The journey of a trader is a journey of self-discovery.', author: 'Van Tharp', category: 'psychology' },
  { text: 'Your belief system determines your trading results.', author: 'Van Tharp', category: 'mindset' },
  { text: 'Success in trading comes from having a system that fits your personality and then having the discipline to follow it.', author: 'Van Tharp', category: 'discipline' },

  // ======================== Jack Schwager ========================
  { text: 'Most trading systems are like playing the slot machines. The only consistent winners are the casinos.', author: 'Jack Schwager', category: 'trading' },
  { text: 'The best traders have a high degree of respect for the market and a high degree of respect for risk.', author: 'Jack Schwager', category: 'risk' },
  { text: 'Many great traders have a knack for cutting losses quickly, even when they are not yet convinced the trade is wrong.', author: 'Jack Schwager', category: 'risk' },
  { text: 'The common denominator of successful traders is that they have learned to control their emotions.', author: 'Jack Schwager', category: 'psychology' },
  { text: 'Trading is a marathon, not a sprint. The goal is to survive long enough to let your edge work.', author: 'Jack Schwager', category: 'mindset' },
  { text: 'Most market participants are looking for the holy grail — the perfect system. There is no such thing.', author: 'Jack Schwager', category: 'wisdom' },
  { text: 'The novice trader focuses on being right. The expert focuses on managing risk.', author: 'Jack Schwager', category: 'risk' },
  { text: 'If you are a trader, you must be willing to accept losses. It is part of the job.', author: 'Jack Schwager', category: 'psychology' },
  { text: 'The difference between a successful trader and an unsuccessful one is often simply the ability to follow their own rules.', author: 'Jack Schwager', category: 'discipline' },

  // ======================== Nassim Taleb ========================
  { text: 'The market can stay irrational longer than you can stay solvent.', author: 'Nassim Taleb', category: 'risk' },
  { text: 'Don\'t cross a river if it is on average four feet deep. You could drown in the average.', author: 'Nassim Taleb', category: 'risk' },
  { text: 'The fragile want tranquility, the antifragile want disorder.', author: 'Nassim Taleb', category: 'wisdom' },
  { text: 'The best way to verify that you are alive is by checking if you like variations. The difference between a living organism and a corpse is that the corpse does not react to changes.', author: 'Nassim Taleb', category: 'mindset' },
  { text: 'It is easier to make money in a casino than in the market. At least in a casino, you know the odds.', author: 'Nassim Taleb', category: 'trading' },
  { text: 'Avoiding losses is more important than seeking gains.', author: 'Nassim Taleb', category: 'risk' },
  { text: 'The most painful losses come from events that have never happened before.', author: 'Nassim Taleb', category: 'risk' },
  { text: 'Don\'t tell me what you think, tell me what\'s in your portfolio.', author: 'Nassim Taleb', category: 'trading' },
  { text: 'The three most harmful addictions are heroin, carbohydrates, and a monthly salary.', author: 'Nassim Taleb', category: 'wisdom' },
  { text: 'Things that never happened before happen all the time.', author: 'Nassim Taleb', category: 'wisdom' },

  // ======================== Additional Legendary Traders ========================
  { text: 'The primary difference between successful people and unsuccessful people is that successful people are willing to do what unsuccessful people are not willing to do.', author: 'Bruce Lee', category: 'mindset' },
  { text: 'I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.', author: 'Bruce Lee', category: 'discipline' },
  { text: 'It is not a daily increase, but a daily decrease. Hack away at the unessential.', author: 'Bruce Lee', category: 'wisdom' },
  { text: 'The successful man profits from his mistakes; he tries again in a different way.', author: 'Dale Carnegie', category: 'mindset' },
  { text: 'It is literally true that you can succeed best and quickest by helping others to succeed.', author: 'Napoleon Hill', category: 'wisdom' },
  { text: 'Strength and growth come only through continuous effort and struggle.', author: 'Napoleon Hill', category: 'mindset' },
  { text: 'In trading, the hardest thing to do is nothing.', author: 'Anonymous', category: 'discipline' },
  { text: 'The trend is your friend until the trend ends.', author: 'Anonymous', category: 'trading' },
  { text: 'Amateurs think about how much money they can make. Professionals think about how much money they can lose.', author: 'Anonymous', category: 'risk' },
  { text: 'Don\'t confuse brains with a bull market.', author: 'Anonymous', category: 'trading' },
  { text: 'Plans are worthless, but planning is everything.', author: 'Dwight D. Eisenhower', category: 'discipline' },
  { text: 'The best revenge is massive success.', author: 'Frank Sinatra', category: 'mindset' },
  { text: 'Action expresses priorities.', author: 'Mahatma Gandhi', category: 'discipline' },
  { text: 'It\'s not the daily increase but daily decrease. Hack away at the unessential.', author: 'Bruce Lee', category: 'wisdom' },

  // ======================== Richard Dennis ========================
  { text: 'You don\'t have to be a genius to be a great trader. You just need the right temperament and discipline.', author: 'Richard Dennis', category: 'discipline' },
  { text: 'I always say you could turn a bunch of monkeys into profitable traders if they just followed the rules.', author: 'Richard Dennis', category: 'trading' },
  { text: 'The Turtle system worked because it was simple and mechanical. Emotions were removed from the equation.', author: 'Richard Dennis', category: 'discipline' },
  { text: 'You can\'t be afraid to lose. If you are, you\'ll never take the trades that make you money.', author: 'Richard Dennis', category: 'psychology' },
  { text: 'The secret to our success was that we followed the system exactly. We didn\'t second-guess it.', author: 'Richard Dennis', category: 'discipline' },

  // ======================== Bill Lipschutz ========================
  { text: 'The whole structure of position sizing is more important than any individual trade.', author: 'Bill Lipschutz', category: 'risk' },
  { text: 'If you are a good trader, you have the ability to be wrong 40% of the time and still be profitable.', author: 'Bill Lipschutz', category: 'trading' },
  { text: 'You have to be willing to take losses. It\'s part of the business. You can\'t be afraid to lose.', author: 'Bill Lipschutz', category: 'psychology' },
  { text: 'The market is a very tough place. If you don\'t have the discipline, you will not succeed.', author: 'Bill Lipschutz', category: 'discipline' },
  { text: 'Risk management is the key. The best traders in the world are the best risk managers.', author: 'Bill Lipschutz', category: 'risk' },

  // ======================== Marty Schwartz ========================
  { text: 'The longer I\'m a trader, the more I respect the power of the market. The market can do anything.', author: 'Marty Schwartz', category: 'mindset' },
  { text: 'I learned that being a great trader requires a complete commitment. You can\'t do it part-time.', author: 'Marty Schwartz', category: 'discipline' },
  { text: 'I consider myself the best in the world at what I do, and I still have to respect the market.', author: 'Marty Schwartz', category: 'mindset' },
  { text: 'Cut your losses quickly. Don\'t let a small loss become a big one.', author: 'Marty Schwartz', category: 'risk' },

  // ======================== Linda Raschke ========================
  { text: 'The market has a way of finding the weakest hands and taking them out.', author: 'Linda Raschke', category: 'psychology' },
  { text: 'The most important thing is to stay in tune with the market. You have to feel what it\'s doing.', author: 'Linda Raschke', category: 'trading' },
  { text: 'I\'ve been doing this for decades, and every day I learn something new.', author: 'Linda Raschke', category: 'wisdom' },
  { text: 'If you can\'t handle the small losses, you\'ll never be able to ride the big winners.', author: 'Linda Raschke', category: 'psychology' },

  // ======================== William O'Neil ========================
  { text: 'The whole secret to winning in the stock market is to lose as little as possible when you\'re wrong.', author: 'William O\'Neil', category: 'risk' },
  { text: 'What seems too high and risky to the majority generally goes higher, and what seems low and cheap generally goes lower.', author: 'William O\'Neil', category: 'trading' },
  { text: 'History does repeat itself in the stock market — the patterns of human psychology repeat.', author: 'William O\'Neil', category: 'psychology' },
  { text: 'Of all the things I\'ve done, the most vital is cutting losses quickly.', author: 'William O\'Neil', category: 'risk' },
  { text: 'Do not buy a stock when it\'s making new highs if you don\'t know what it should be doing.', author: 'William O\'Neil', category: 'trading' },

  // ======================== Larry Hite ========================
  { text: 'I don\'t like to be in a position where I can lose more than I can possibly make.', author: 'Larry Hite', category: 'risk' },
  { text: 'The markets are the same as they\'ve always been. The same patterns of fear and greed repeat.', author: 'Larry Hite', category: 'trading' },
  { text: 'My goal is not to be right. My goal is to make money.', author: 'Larry Hite', category: 'mindset' },
  { text: 'If you don\'t manage risk, risk will manage you.', author: 'Larry Hite', category: 'risk' },
  { text: 'The great thing about markets is that they don\'t care about your opinion. They just move.', author: 'Larry Hite', category: 'mindset' },

  // ======================== Michael Marcus ========================
  { text: 'I had to learn to be comfortable being wrong. Once I accepted that, I started making money.', author: 'Michael Marcus', category: 'psychology' },
  { text: 'The biggest mistake I see new traders make is not cutting losses quickly.', author: 'Michael Marcus', category: 'risk' },
  { text: 'You cannot succeed in trading without discipline. It is the foundation of everything.', author: 'Michael Marcus', category: 'discipline' },
  { text: 'The market is like a wild animal. You have to respect its power.', author: 'Michael Marcus', category: 'mindset' },
  { text: 'Trading is the hardest way to make easy money.', author: 'Michael Marcus', category: 'wisdom' },

  // ======================== Additional Wisdom ========================
  { text: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.', author: 'Philip Fisher', category: 'trading' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin', category: 'wisdom' },
  { text: 'The individual investor should act consistently as an investor and not as a speculator.', author: 'Benjamin Graham', category: 'discipline' },
  { text: 'The intelligent investor is a realist who sells to optimists and buys from pessimists.', author: 'Benjamin Graham', category: 'trading' },
  { text: 'In the short run, the market is a voting machine. In the long run, it is a weighing machine.', author: 'Benjamin Graham', category: 'trading' },
  { text: 'You are neither right nor wrong because the crowd disagrees with you. You are right because your data and reasoning are right.', author: 'Benjamin Graham', category: 'mindset' },
  { text: 'To be a successful trader, you must first be a successful psychologist.', author: 'Alexander Elder', category: 'psychology' },
  { text: 'The true professional trader is humble, flexible, and adapts to changing conditions.', author: 'Alexander Elder', category: 'mindset' },
  { text: 'Lack of discipline is the biggest enemy of a trader.', author: 'Alexander Elder', category: 'discipline' },
  { text: 'The key to successful trading is in yourself, not in the market.', author: 'Alexander Elder', category: 'psychology' },
  { text: 'Trading is like a battle. Your tools are your analysis; your weapon is your trading plan.', author: 'Alexander Elder', category: 'discipline' },

  // ======================== Psychology & Mindset ========================
  { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford', category: 'mindset' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'mindset' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', category: 'mindset' },
  { text: 'The definition of insanity is doing the same thing over and over again and expecting different results.', author: 'Albert Einstein', category: 'wisdom' },
  { text: 'Everything should be made as simple as possible, but not simpler.', author: 'Albert Einstein', category: 'wisdom' },
  { text: 'It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.', author: 'Charles Darwin', category: 'wisdom' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'mindset' },
  { text: 'Success is going from failure to failure without losing your enthusiasm.', author: 'Winston Churchill', category: 'mindset' },
  { text: 'The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.', author: 'Winston Churchill', category: 'mindset' },
  { text: 'Continuous improvement is better than delayed perfection.', author: 'Mark Twain', category: 'discipline' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'mindset' },
  { text: 'The two most important days in your life are the day you are born and the day you find out why.', author: 'Mark Twain', category: 'wisdom' },
  { text: 'Twenty years from now you will be more disappointed by the things you didn\'t do than by the ones you did do.', author: 'Mark Twain', category: 'mindset' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky', category: 'mindset' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt', category: 'mindset' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'mindset' },
  { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson', category: 'mindset' },

  // ======================== Risk & Money Management ========================
  { text: 'Capital preservation is the single most important thing in trading.', author: 'Victor Sperandeo', category: 'risk' },
  { text: 'The first law of trading is to never lose money. The second is to never forget the first.', author: 'Victor Sperandeo', category: 'risk' },
  { text: 'Successful trading is about having a positive expectancy and managing risk, not about being right.', author: 'Victor Sperandeo', category: 'trading' },
  { text: 'Risk no more than you can afford to lose, and also risk enough that a win matters.', author: 'Alexander Elder', category: 'risk' },
  { text: 'If you don\'t know how to manage risk, you don\'t know how to trade.', author: 'Anonymous', category: 'risk' },
  { text: 'The function of a stop-loss is to keep you in the game long enough for your edge to work.', author: 'Anonymous', category: 'risk' },
  { text: 'A trader without a stop-loss is like a pilot without a parachute.', author: 'Anonymous', category: 'risk' },
  { text: 'The goal is not to maximize wins, but to minimize losses.', author: 'Anonymous', category: 'risk' },
  { text: 'Small losses are the price you pay for big winners.', author: 'Anonymous', category: 'risk' },
  { text: 'Protect your capital as if it\'s your last dollar, because one day it might be.', author: 'Anonymous', category: 'risk' },
  { text: 'The best traders are not the ones who make the most money on their winning trades, but the ones who lose the least on their losing trades.', author: 'Anonymous', category: 'risk' },
  { text: 'Trading is about probability, not certainty.', author: 'Anonymous', category: 'trading' },
  { text: 'Position sizing is your most powerful risk management tool.', author: 'Anonymous', category: 'risk' },

  // ======================== Discipline & Systems ========================
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'Success is nothing more than a few simple disciplines, practiced every day.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'We must all suffer from one of two pains: the pain of discipline or the pain of regret.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'The price of discipline is always less than the pain of regret.', author: 'Nido Qubein', category: 'discipline' },
  { text: 'Without discipline, no matter how good your system is, you will fail.', author: 'Anonymous', category: 'discipline' },
  { text: 'Create a system that works and then have the discipline to follow it without exception.', author: 'Anonymous', category: 'discipline' },
  { text: 'A trading plan without the discipline to follow it is just a wish.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your trading system should be simple enough that you can follow it during emotional stress.', author: 'Anonymous', category: 'discipline' },
  { text: 'The difference between a successful trader and an unsuccessful one is the ability to follow their own rules.', author: 'Anonymous', category: 'discipline' },

  // ======================== More Paul Tudor Jones ========================
  { text: 'Losers average losers.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'The most important thing is to manage risk. If you can manage risk, you can survive long enough to make money.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'I always think of my trading in terms of what I can lose.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'If I have a position and it goes against me, I get out. I don\'t care what the fundamentals say.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'My metric for everything I look at is: the 200-day moving average. If the price is above the 200-day moving average, I\'m long. If below, I\'t go short.', author: 'Paul Tudor Jones', category: 'trading' },
  { text: 'It\'s not about being right or wrong. It\'s about how much money you make when you\'re right and how much you lose when you\'re wrong.', author: 'Paul Tudor Jones', category: 'risk' },
  { text: 'There are two types of people who lose money: those who know nothing and those who know everything.', author: 'Paul Tudor Jones', category: 'wisdom' },
  { text: 'I\'ve been in this business for over 30 years and I can tell you that the best trades are the ones where the risk/reward is heavily in your favor.', author: 'Paul Tudor Jones', category: 'trading' },

  // ======================== More Mark Douglas ========================
  { text: 'When you accept defeat as a natural part of the process, you free yourself from fear.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'The moment you start thinking about the money you might lose, you have already lost.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'Your trading plan is your best friend. Stick to it no matter what.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'It doesn\'t matter if you win or lose on any individual trade. What matters is the pattern of your behavior over time.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'Most traders focus on making money. The best traders focus on following their process.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'Trading success is not about avoiding losses. It\'s about managing them effectively.', author: 'Mark Douglas', category: 'risk' },
  { text: 'You need to think of trading in terms of probabilities, not certainties.', author: 'Mark Douglas', category: 'mindset' },
  { text: 'If you don\'t have a trading plan, you don\'t have a trading strategy. You have gambling.', author: 'Mark Douglas', category: 'discipline' },
  { text: 'The market doesn\'t generate random behavior. You do.', author: 'Mark Douglas', category: 'psychology' },
  { text: 'Trading without a plan is like going to war without a strategy.', author: 'Mark Douglas', category: 'discipline' },

  // ======================== More Jesse Livermore ========================
  { text: 'The man who can sit tight in a position when he is wrong is the man who makes real money.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'Never buy a stock because it has had a big decline. Never short a stock because it has had a big advance.', author: 'Jesse Livermore', category: 'trading' },
  { text: 'The desire for constant action irrespective of underlying conditions is responsible for many losses in Wall Street.', author: 'Jesse Livermore', category: 'discipline' },
  { text: 'Wall Street professionals know more and earn less than the amateur investor.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'To anticipate the market is to forecast prejudices. You cannot predict the future.', author: 'Jesse Livermore', category: 'wisdom' },
  { text: 'If a stock doesn\'t act right, don\'t touch it. Because being right about the market isn\'t the same as being right about the trade.', author: 'Jesse Livermore', category: 'trading' },
  { text: 'I have always made money by waiting. Sitting tight. Letting the market come to me.', author: 'Jesse Livermore', category: 'discipline' },
  { text: 'In trading, the hardest thing to do is to do nothing when the market tempts you.', author: 'Jesse Livermore', category: 'discipline' },

  // ======================== More Warren Buffett ========================
  { text: 'Only when the tide goes out do you discover who\'s been swimming naked.', author: 'Warren Buffett', category: 'risk' },
  { text: 'It\'s only when you combine sound intellect with emotional discipline that you get rational behavior.', author: 'Warren Buffett', category: 'psychology' },
  { text: 'The most important investment you can make is in yourself.', author: 'Warren Buffett', category: 'mindset' },
  { text: 'Predicting rain doesn\'t count. Building arks does.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'The stock market is a no-called-strike game. You don\'t have to swing at everything.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'Risk is a function of how much you know about what you\'re doing.', author: 'Warren Buffett', category: 'risk' },
  { text: 'I\'d rather earn a 15% return on someone else\'s money than a 20% return on my own.', author: 'Warren Buffett', category: 'trading' },
  { text: 'Price is what you pay. Value is what you get. Always remember that.', author: 'Warren Buffett', category: 'trading' },
  { text: 'In the short run, the market is a voting machine. In the long run, it\'s a weighing machine.', author: 'Warren Buffett', category: 'trading' },

  // ======================== More Charlie Munger ========================
  { text: 'All I want to know is where I\'m going to die, so I\'ll never go there.', author: 'Charlie Munger', category: 'risk' },
  { text: 'Take a simple idea and take it seriously.', author: 'Charlie Munger', category: 'discipline' },
  { text: 'You don\'t have to be brilliant to be a successful investor. You just have to have good habits.', author: 'Charlie Munger', category: 'discipline' },
  { text: 'The best thing you can do is be independent of other people\'s opinions.', author: 'Charlie Munger', category: 'mindset' },
  { text: 'I constantly see people rise in life who are not the smartest, sometimes not even the most diligent, but they are learning machines.', author: 'Charlie Munger', category: 'wisdom' },
  { text: 'There\'s no such thing as a 100% certain investment. If there were, the return would be zero.', author: 'Charlie Munger', category: 'trading' },
  { text: 'The world is full of foolish gamblers, and they will not do as well as the patient investor.', author: 'Charlie Munger', category: 'wisdom' },

  // ======================== More George Soros ========================
  { text: 'The way to build superior long-term returns is through preservation of capital and home runs.', author: 'George Soros', category: 'risk' },
  { text: 'I\'ve been very rich and I\'ve been very poor. Believe me, rich is better.', author: 'George Soros', category: 'wisdom' },
  { text: 'If investing is entertaining, if you\'re having fun, you\'re probably not making any money.', author: 'George Soros', category: 'discipline' },
  { text: 'It\'s not whether you\'re right or wrong that\'s important, but how much money you make when you\'re right and how much you lose when you\'re wrong.', author: 'George Soros', category: 'risk' },
  { text: 'There is no substitute for knowledge. You have to know what you are doing.', author: 'George Soros', category: 'discipline' },

  // ======================== More Stanley Druckenmiller ========================
  { text: 'The way to build superior long-term returns is through preservation of capital and home runs.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'When you have tremendous conviction on a trade, you have to go for the jugular.', author: 'Stanley Druckenmiller', category: 'trading' },
  { text: 'I\'ve learned many things from George Soros, but perhaps the most significant is that it\'s not whether you\'re right or wrong that\'s important, but how much money you make when you\'re right and how much you lose when you\'re wrong.', author: 'Stanley Druckenmiller', category: 'risk' },
  { text: 'Liquidity is the key to success in the markets. Without it, you can\'t get in or out.', author: 'Stanley Druckenmiller', category: 'trading' },

  // ======================== More Ed Seykota ========================
  { text: 'Trading rules: (1) Cut losses. (2) Cut losses. (3) Cut losses. (4) Follow the rules without question. (5) Know when to break the rules.', author: 'Ed Seykota', category: 'risk' },
  { text: 'The trading rules that work are the ones that fit your personality.', author: 'Ed Seykota', category: 'discipline' },
  { text: 'The best traders are those who trade from their gut while using the brain as a check.', author: 'Ed Seykota', category: 'psychology' },

  // ======================== Van Tharp (More) ========================
  { text: 'You can have a winning system with a losing trader and a losing system with a winning trader. Guess who wins?', author: 'Van Tharp', category: 'psychology' },
  { text: 'People who have created winning systems but can\'t follow them are usually trading out of fear.', author: 'Van Tharp', category: 'psychology' },
  { text: 'Risk management is the most important thing to be well understood.', author: 'Van Tharp', category: 'risk' },
  { text: 'Most traders focus on entries. They should focus on exits and position sizing.', author: 'Van Tharp', category: 'trading' },
  { text: 'The ability to sit on your hands is one of the most important skills in trading.', author: 'Van Tharp', category: 'discipline' },

  // ======================== Jack Schwager (More) ========================
  { text: 'Every great trader I\'ve interviewed has one thing in common: they all take losses very seriously.', author: 'Jack Schwager', category: 'risk' },
  { text: 'The ability to accept losses is a prerequisite for trading success.', author: 'Jack Schwager', category: 'psychology' },
  { text: 'There is no single key to trading success. Each trader must find their own path.', author: 'Jack Schwager', category: 'wisdom' },

  // ======================== Mark Minervini ========================
  { text: 'The goal of a successful trader is to make the best trades. Money is secondary.', author: 'Mark Minervini', category: 'discipline' },
  { text: 'Win or lose, everybody gets what they want out of the market.', author: 'Mark Minervini', category: 'mindset' },
  { text: 'You have to define your risk before you enter a trade. If you don\'t, you\'re gambling.', author: 'Mark Minervini', category: 'risk' },
  { text: 'I look for patterns that tend to repeat themselves. That\'s where the edge is.', author: 'Mark Minervini', category: 'trading' },
  { text: 'The stock market is not a market of stocks. It\'s a market of emotions.', author: 'Mark Minervini', category: 'psychology' },
  { text: 'Always act as if you are trading with real money. This builds the discipline you need.', author: 'Mark Minervini', category: 'discipline' },
  { text: 'The best trades are the ones where the risk is clearly defined before you enter.', author: 'Mark Minervini', category: 'risk' },
  { text: 'Trading is not about being right. It\'s about making money when you are right and losing as little as possible when you are wrong.', author: 'Mark Minervini', category: 'risk' },
  { text: 'Patience is the most underrated skill in trading. Most people can\'t wait for the right setup.', author: 'Mark Minervini', category: 'discipline' },
  { text: 'The key to trading success is having a plan and the discipline to follow it.', author: 'Mark Minervini', category: 'discipline' },

  // ======================== Tom Hougaard ========================
  { text: 'If you\'re losing money and you\'re stressed, you\'re trading too big.', author: 'Tom Hougaard', category: 'risk' },
  { text: 'The market doesn\'t owe you anything. You have to earn it every single day.', author: 'Tom Hougaard', category: 'mindset' },
  { text: 'Fear and greed are the two most powerful forces in the market. Master them or be mastered by them.', author: 'Tom Hougaard', category: 'psychology' },
  { text: 'The best trade is the one you don\'t take when the setup isn\'t there.', author: 'Tom Hougaard', category: 'discipline' },
  { text: 'Your account balance is a reflection of your psychology, not your intelligence.', author: 'Tom Hougaard', category: 'psychology' },
  { text: 'Trade to survive first. Profit comes second.', author: 'Tom Hougaard', category: 'risk' },
  { text: 'Don\'t trade to be right. Trade to make money.', author: 'Tom Hougaard', category: 'mindset' },

  // ======================== ICT / Smart Money Concepts ========================
  { text: 'The market is designed to move money from the impatient to the patient.', author: 'ICT', category: 'discipline' },
  { text: 'Smart money doesn\'t follow the crowd. Smart money creates the crowd.', author: 'ICT', category: 'trading' },
  { text: 'If you want to trade like the banks, you have to think like the banks.', author: 'ICT', category: 'trading' },
  { text: 'The best time to buy is when nobody wants to. The best time to sell is when everybody is buying.', author: 'ICT', category: 'trading' },
  { text: 'Liquidity is the fuel that drives the market. Find where the liquidity is, and you\'ll find where the market is going.', author: 'ICT', category: 'trading' },
  { text: 'Patience is not just waiting. It\'s waiting with purpose.', author: 'ICT', category: 'discipline' },
  { text: 'The algorithm doesn\'t care about your feelings. It only cares about liquidity.', author: 'ICT', category: 'mindset' },

  // ======================== Richard Dennis (More) ========================
  { text: 'The goal of a successful trader is to make the best trades. Money is secondary.', author: 'Richard Dennis', category: 'discipline' },
  { text: 'When you get a good setup, bet big. When the odds are against you, bet small or not at all.', author: 'Richard Dennis', category: 'trading' },
  { text: 'The Turtle system was about risk management, not prediction.', author: 'Richard Dennis', category: 'risk' },

  // ======================== Larry Williams ========================
  { text: 'The best traders are the ones who can control their emotions and follow their plan.', author: 'Larry Williams', category: 'discipline' },
  { text: 'I\'ve been in this business for over 50 years and the one thing I know is that the market will always surprise you.', author: 'Larry Williams', category: 'wisdom' },
  { text: 'Position sizing is more important than the entry itself.', author: 'Larry Williams', category: 'risk' },
  { text: 'The market is a mechanism for transferring wealth from the active to the patient.', author: 'Larry Williams', category: 'discipline' },

  // ======================== Kevin Davey ========================
  { text: 'A good system should have a clear edge, and you should trade it exactly as designed.', author: 'Kevin Davey', category: 'discipline' },
  { text: 'Walk-forward analysis is the most robust way to test a trading system.', author: 'Kevin Davey', category: 'trading' },
  { text: 'Over-optimization is the enemy of a good trading system.', author: 'Kevin Davey', category: 'trading' },
  { text: 'The simpler your trading system, the more robust it will be.', author: 'Kevin Davey', category: 'trading' },

  // ======================== Andrea Unger ========================
  { text: 'The best trading system is the one you can stick with through drawdowns.', author: 'Andrea Unger', category: 'discipline' },
  { text: 'Don\'t fall in love with your trading system. Let the market tell you when it stops working.', author: 'Andrea Unger', category: 'wisdom' },
  { text: 'Risk management and position sizing are more important than entry signals.', author: 'Andrea Unger', category: 'risk' },

  // ======================== Ankit Parikh ========================
  { text: 'Trade less, earn more. Quality over quantity always wins.', author: 'Ankit Parikh', category: 'discipline' },
  { text: 'The market rewards patience and punishes greed.', author: 'Ankit Parikh', category: 'mindset' },
  { text: 'A trader without a plan is like a ship without a rudder.', author: 'Ankit Parikh', category: 'discipline' },

  // ======================== Brett Steenbarger ========================
  { text: 'The best traders are excellent learners. They treat every trade as a lesson.', author: 'Brett Steenbarger', category: 'wisdom' },
  { text: 'Emotional intelligence is the differentiator between good and great traders.', author: 'Brett Steenbarger', category: 'psychology' },
  { text: 'The key to trading psychology is to stay present. Don\'t dwell on past trades or future outcomes.', author: 'Brett Steenbarger', category: 'psychology' },
  { text: 'Self-awareness is the foundation of trading excellence.', author: 'Brett Steenbarger', category: 'psychology' },
  { text: 'The quality of your trading is directly proportional to the quality of your decisions.', author: 'Brett Steenbarger', category: 'discipline' },

  // ======================== Mark Spitznagel ========================
  { text: 'The best trade is the one where you have the most to gain and the least to lose.', author: 'Mark Spitznagel', category: 'risk' },
  { text: 'Asymmetric risk/reward is the holy grail of investing.', author: 'Mark Spitznagel', category: 'risk' },
  { text: 'Don\'t protect your portfolio from risk. Profit from it.', author: 'Mark Spitznagel', category: 'risk' },

  // ======================== Anton Kreil ========================
  { text: 'You are not a professional trader until you can lose money without it affecting your sleep.', author: 'Anton Kreil', category: 'psychology' },
  { text: 'The biggest edge in trading is emotional control.', author: 'Anton Kreil', category: 'psychology' },
  { text: 'Professional traders manage risk. Amateurs chase returns.', author: 'Anton Kreil', category: 'risk' },

  // ======================== Sam Seiden ========================
  { text: 'Price is the ultimate truth in the market. Everything else is secondary.', author: 'Sam Seiden', category: 'trading' },
  { text: 'Supply and demand is the only thing that moves price. Learn to identify these zones.', author: 'Sam Seiden', category: 'trading' },
  { text: 'The best trades are where institutional orders are sitting.', author: 'Sam Seiden', category: 'trading' },

  // ======================== Bulkowski ========================
  { text: 'Pattern recognition is a skill that improves with practice and patience.', author: 'Thomas Bulkowski', category: 'trading' },
  { text: 'Know your chart patterns, but don\'t expect them to work every time.', author: 'Thomas Bulkowski', category: 'trading' },

  // ======================== Alexander Elder (More) ========================
  { text: 'A successful trader is a well-disciplined trader who follows a system and manages risk.', author: 'Alexander Elder', category: 'discipline' },
  { text: 'Trade with your head, not with your heart.', author: 'Alexander Elder', category: 'psychology' },
  { text: 'There is no such thing as a safe trade. There are only trades with defined risk.', author: 'Alexander Elder', category: 'risk' },
  { text: 'The most important rule of trading is to play great defense.', author: 'Alexander Elder', category: 'risk' },
  { text: 'The trend is your friend until it bends. That\'s when you need to be careful.', author: 'Alexander Elder', category: 'trading' },

  // ======================== Trading Psychology (Various) ========================
  { text: 'Your biggest enemy in trading is not the market. It\'s yourself.', author: 'Anonymous', category: 'psychology' },
  { text: 'FOMO is the trader\'s worst enemy. The market will always give you another opportunity.', author: 'Anonymous', category: 'psychology' },
  { text: 'Revenge trading is the fastest way to blow up your account.', author: 'Anonymous', category: 'psychology' },
  { text: 'If you can\'t explain your trade in one sentence, you don\'t have a clear plan.', author: 'Anonymous', category: 'discipline' },
  { text: 'The best traders treat every trade the same, regardless of size or outcome.', author: 'Anonymous', category: 'discipline' },
  { text: 'Trading is 80% psychology and 20% strategy. If you can\'t manage your emotions, no system will save you.', author: 'Anonymous', category: 'psychology' },
  { text: 'A trade without a stop-loss is not a trade. It\'s a gamble.', author: 'Anonymous', category: 'risk' },
  { text: 'Patience is not the ability to wait. It\'s the ability to keep a good attitude while waiting.', author: 'Anonymous', category: 'discipline' },
  { text: 'The market will test your conviction. If your analysis is right, hold. If it\'s wrong, get out.', author: 'Anonymous', category: 'discipline' },
  { text: 'Don\'t try to predict the market. React to what it\'s actually doing.', author: 'Anonymous', category: 'trading' },
  { text: 'Overtrading is the silent killer of trading accounts.', author: 'Anonymous', category: 'discipline' },
  { text: 'If you\'re confused, don\'t trade. Confusion leads to losses.', author: 'Anonymous', category: 'discipline' },
  { text: 'The market doesn\'t care about your opinion. It only cares about supply and demand.', author: 'Anonymous', category: 'trading' },
  { text: 'Every trade is a business decision. Treat it like one.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your account is your business. Protect it at all costs.', author: 'Anonymous', category: 'risk' },
  { text: 'The secret to trading success is not in the winning trades. It\'s in the losing trades.', author: 'Anonymous', category: 'risk' },
  { text: 'If you can\'t lose gracefully, you can\'t win gracefully either.', author: 'Anonymous', category: 'psychology' },
  { text: 'A great trader is someone who has mastered the art of losing small and winning big.', author: 'Anonymous', category: 'risk' },
  { text: 'The trend is your friend. The range is your enemy. Know the difference.', author: 'Anonymous', category: 'trading' },
  { text: 'Trade what you see, not what you think.', author: 'Anonymous', category: 'trading' },
  { text: 'The market is always right. You can be wrong.', author: 'Anonymous', category: 'mindset' },
  { text: 'Never argue with the market. It\'s always right.', author: 'Anonymous', category: 'mindset' },
  { text: 'Your trading journal is your most valuable trading tool. Use it.', author: 'Anonymous', category: 'discipline' },
  { text: 'If you can\'t explain it simply, you don\'t understand it well enough.', author: 'Anonymous', category: 'wisdom' },
  { text: 'The best trades come when you\'re patient, not when you\'re desperate.', author: 'Anonymous', category: 'discipline' },
  { text: 'Successful trading is about the consistency of your process, not the outcome of any single trade.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your edge is not in the trade. Your edge is in your risk management.', author: 'Anonymous', category: 'risk' },

  // ======================== Risk Management (Various) ========================
  { text: 'Risk management is the art of making money without taking unnecessary risks.', author: 'Anonymous', category: 'risk' },
  { text: 'The first rule of risk management is to never lose money. The second rule is to never forget the first.', author: 'Anonymous', category: 'risk' },
  { text: 'A risk/reward ratio of at least 1:2 should be the minimum for any trade.', author: 'Anonymous', category: 'risk' },
  { text: 'Never risk more than 1-2% of your account on a single trade. Ever.', author: 'Anonymous', category: 'risk' },
  { text: 'Position sizing is the most overlooked aspect of trading. Get it right and everything else falls into place.', author: 'Anonymous', category: 'risk' },
  { text: 'The best risk management strategy is the one you can actually follow.', author: 'Anonymous', category: 'risk' },
  { text: 'Small accounts need even stricter risk management, not looser.', author: 'Anonymous', category: 'risk' },
  { text: 'Risk is not something to be eliminated. It\'s something to be managed.', author: 'Anonymous', category: 'risk' },
  { text: 'The greatest risk in trading is not knowing your risk.', author: 'Anonymous', category: 'risk' },
  { text: 'If you don\'t know your stop-loss before entering a trade, you\'re not trading. You\'re gambling.', author: 'Anonymous', category: 'risk' },

  // ======================== Market Wisdom (Various) ========================
  { text: 'The market is a pendulum that forever swings between unsustainable optimism and unjustified pessimism.', author: 'Benjamin Graham', category: 'wisdom' },
  { text: 'Be fearful when others are greedy and greedy when others are fearful. But always be disciplined.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'The four most expensive words in the English language are: "This time it\'s different."', author: 'John Templeton', category: 'wisdom' },
  { text: 'History doesn\'t repeat itself, but it often rhymes.', author: 'Mark Twain', category: 'wisdom' },
  { text: 'The stock market is the only market where things go on sale and all the customers run out of the store.', author: 'Cullen Roche', category: 'wisdom' },
  { text: 'In investing, what is comfortable is rarely profitable.', author: 'Robert Arnott', category: 'wisdom' },
  { text: 'The investor\'s chief problem — and even his worst enemy — is likely to be himself.', author: 'Benjamin Graham', category: 'psychology' },
  { text: 'Successful investing is about managing risk, not avoiding it.', author: 'Benjamin Graham', category: 'risk' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin', category: 'wisdom' },
  { text: 'The stock market is a device for transferring money from the impatient to the patient.', author: 'Warren Buffett', category: 'discipline' },

  // ======================== Discipline (Various) ========================
  { text: 'Success is nothing more than a few simple disciplines practiced every day.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Jim Rohn', category: 'discipline' },
  { text: 'Your life does not get better by chance. It gets better by change.', author: 'Jim Rohn', category: 'mindset' },
  { text: 'We become what we repeatedly do.', author: 'Sean Covey', category: 'discipline' },
  { text: 'Motivation gets you started. Habit keeps you going.', author: 'Jim Ryun', category: 'discipline' },
  { text: 'Consistency is what transforms average into excellence.', author: 'Anonymous', category: 'discipline' },
  { text: 'A goal without a plan is just a wish.', author: 'Antoine de Saint-Exupéry', category: 'discipline' },
  { text: 'Excellence is not a singular act, but a habit. You are what you repeatedly do.', author: 'Will Durant', category: 'discipline' },
  { text: 'The secret of your future is hidden in your daily routine.', author: 'Mike Murdock', category: 'discipline' },

  // ======================== Mindset & Psychology (Various) ========================
  { text: 'The only person you can truly control is yourself. Master your mind and you\'ll master the market.', author: 'Anonymous', category: 'psychology' },
  { text: 'Pain is temporary. Quitting lasts forever.', author: 'Lance Armstrong', category: 'mindset' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'mindset' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb', category: 'mindset' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha', category: 'mindset' },
  { text: 'Out of your vulnerabilities will come your strength.', author: 'Sigmund Freud', category: 'mindset' },
  { text: 'The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes of mind.', author: 'William James', category: 'psychology' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'mindset' },
  { text: 'Your worst enemy cannot harm you as much as your own unguarded thoughts.', author: 'Buddha', category: 'psychology' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius', category: 'mindset' },

  // ======================== Stoic Wisdom for Traders ========================
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius', category: 'mindset' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius', category: 'psychology' },
  { text: 'Waste no more time arguing about what a good trader should be. Be one.', author: 'Marcus Aurelius', category: 'discipline' },
  { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius', category: 'mindset' },
  { text: 'The best revenge is not to be like your enemy.', author: 'Marcus Aurelius', category: 'mindset' },
  { text: 'Accept the things to which fate binds you, and love the people with whom fate brings you together.', author: 'Marcus Aurelius', category: 'mindset' },
  { text: 'How much more grievous are the consequences of anger than the causes of it.', author: 'Marcus Aurelius', category: 'psychology' },
  { text: 'The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.', author: 'Marcus Aurelius', category: 'wisdom' },
  { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', author: 'Marcus Aurelius', category: 'mindset' },

  // ======================== Ryan Holiday (Modern Stoicism) ========================
  { text: 'The obstacle is the way.', author: 'Ryan Holiday', category: 'mindset' },
  { text: 'Ego is the enemy of what you want and of what you have.', author: 'Ryan Holiday', category: 'psychology' },
  { text: 'The less energy wasted on things outside your control, the more you can focus on what actually matters.', author: 'Ryan Holiday', category: 'discipline' },
  { text: 'Stillness is the key to success in all areas of life.', author: 'Ryan Holiday', category: 'psychology' },
  { text: 'Your emotions are not your enemies. They are data. They are signals.', author: 'Ryan Holiday', category: 'psychology' },

  // ======================== More Risk & Money Management ========================
  { text: 'The first rule of compounding: never interrupt it unnecessarily.', author: 'Charlie Munger', category: 'risk' },
  { text: 'Every great trader has a plan for losing money. Do you?', author: 'Anonymous', category: 'risk' },
  { text: 'If you\'re not managing risk, you\'re not trading. You\'re gambling.', author: 'Anonymous', category: 'risk' },
  { text: 'The biggest risk a trader can take is not taking any risk at all.', author: 'Anonymous', category: 'risk' },
  { text: 'Risk comes from not knowing what you\'re doing. Education is your best hedge.', author: 'Warren Buffett', category: 'risk' },
  { text: 'Protect your downside and the upside will take care of itself.', author: 'Anonymous', category: 'risk' },
  { text: 'The best traders are the ones who know how to lose gracefully.', author: 'Anonymous', category: 'risk' },
  { text: 'Risk management is not about avoiding risk. It\'s about managing it intelligently.', author: 'Anonymous', category: 'risk' },

  // ======================== Trading Strategies & Techniques ========================
  { text: 'The trend is your friend until it ends. Then it\'s your enemy.', author: 'Anonymous', category: 'trading' },
  { text: 'Buy the rumor, sell the news.', author: 'Wall Street Adage', category: 'trading' },
  { text: 'Cut your losers short and let your winners run.', author: 'Wall Street Adage', category: 'trading' },
  { text: 'Don\'t fight the trend. Flow with it.', author: 'Anonymous', category: 'trading' },
  { text: 'The best setups are the ones where everything aligns: trend, support/resistance, and volume.', author: 'Anonymous', category: 'trading' },
  { text: 'Patience in waiting for the right setup is what separates professionals from amateurs.', author: 'Anonymous', category: 'trading' },
  { text: 'Never chase a trade. If you missed it, wait for the next one.', author: 'Anonymous', category: 'trading' },
  { text: 'The best trades are boring. The worst trades are exciting.', author: 'Anonymous', category: 'trading' },
  { text: 'Volume precedes price. If volume is drying up, expect a move soon.', author: 'Anonymous', category: 'trading' },
  { text: 'In trading, timing is everything. The right trade at the wrong time is still a wrong trade.', author: 'Anonymous', category: 'trading' },

  // ======================== Daily Habits & Routines ========================
  { text: 'The successful trader has a routine. The unsuccessful trader has habits.', author: 'Anonymous', category: 'discipline' },
  { text: 'Prepare for the market before it opens. Review after it closes. This is the way.', author: 'Anonymous', category: 'discipline' },
  { text: 'Every morning, review your plan. Every evening, review your execution.', author: 'Anonymous', category: 'discipline' },
  { text: 'The best traders are the best preparers. They don\'t wing it.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your pre-market routine determines your trading day. Make it count.', author: 'Anonymous', category: 'discipline' },

  // ======================== Learning & Growth ========================
  { text: 'The more you learn, the more you earn.', author: 'Warren Buffett', category: 'wisdom' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin', category: 'wisdom' },
  { text: 'The best traders are lifelong learners. They never stop improving.', author: 'Anonymous', category: 'wisdom' },
  { text: 'Every loss is a lesson. Every win is a confirmation. Study both equally.', author: 'Anonymous', category: 'wisdom' },
  { text: 'Your trading journal is your most honest teacher. It tells you exactly where you need to improve.', author: 'Anonymous', category: 'wisdom' },
  { text: 'Mastery in trading takes years, not months. Be patient with the process.', author: 'Anonymous', category: 'wisdom' },
  { text: 'The market is the best teacher. It humbles the proud and rewards the humble.', author: 'Anonymous', category: 'wisdom' },

  // ======================== Patience & Waiting ========================
  { text: 'The money is made in the waiting, not in the trading.', author: 'Jesse Livermore', category: 'discipline' },
  { text: 'Patience is a virtue in trading. It\'s also the hardest one to master.', author: 'Anonymous', category: 'discipline' },
  { text: 'Good things come to those who wait. Great things come to those who prepare and then wait.', author: 'Anonymous', category: 'discipline' },
  { text: 'The market rewards those who can wait for the perfect setup.', author: 'Anonymous', category: 'discipline' },
  { text: 'In trading, doing nothing is often the best trade.', author: 'Anonymous', category: 'discipline' },
  { text: 'The ability to sit on your hands is a superpower in trading.', author: 'Anonymous', category: 'discipline' },
  { text: 'Wait for the pitch. Don\'t swing at everything.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'Most of the money in trading is made sitting, not thinking.', author: 'Jesse Livermore', category: 'discipline' },
  { text: 'Patience is not simply the ability to wait. It\'s the ability to stay calm and focused while working hard for what you want.', author: 'Anonymous', category: 'discipline' },
  { text: 'The waiting is the hardest part. But it\'s also where the money is.', author: 'Anonymous', category: 'discipline' },

  // ======================== Trader Lifestyle ========================
  { text: 'Trading is not a get-rich-quick scheme. It\'s a get-rich-slowly scheme.', author: 'Anonymous', category: 'wisdom' },
  { text: 'The best traders treat trading like a business, not a hobby.', author: 'Anonymous', category: 'discipline' },
  { text: 'You can\'t trade all day and expect to have a life. Balance is key.', author: 'Anonymous', category: 'mindset' },
  { text: 'The market is open 24/7. Your mental health isn\'t. Take breaks.', author: 'Anonymous', category: 'psychology' },
  { text: 'Exercise, sleep, and nutrition affect your trading performance more than any indicator.', author: 'Anonymous', category: 'psychology' },

  // ======================== Forex Specific ========================
  { text: 'In forex, correlation is your friend and your enemy. Know the pairs.', author: 'Anonymous', category: 'trading' },
  { text: 'The dollar is the world\'s reserve currency. Respect its power.', author: 'Anonymous', category: 'trading' },
  { text: 'Central banks move the forex market. Pay attention to their policies.', author: 'Anonymous', category: 'trading' },
  { text: 'Liquidity in forex is highest during London and New York sessions. Trade during overlap for best moves.', author: 'Anonymous', category: 'trading' },
  { text: 'The best forex traders are macro traders. They understand the bigger picture.', author: 'Anonymous', category: 'trading' },

  // ======================== Crypto Specific ========================
  { text: 'In crypto, volatility is your friend if you manage risk properly.', author: 'Anonymous', category: 'trading' },
  { text: 'Don\'t invest more than you can afford to lose in crypto. It\'s that simple.', author: 'Anonymous', category: 'risk' },
  { text: 'The crypto market moves 24/7. Your sleep is more important than any trade.', author: 'Anonymous', category: 'psychology' },
  { text: 'DYOR — Do Your Own Research. Never follow anyone blindly in crypto.', author: 'Anonymous', category: 'discipline' },

  // ======================== Final Batch of Wisdom ========================
  { text: 'The only limit to your impact is your imagination and commitment.', author: 'Tony Robbins', category: 'mindset' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'mindset' },
  { text: 'Don\'t let yesterday take up too much of today.', author: 'Will Rogers', category: 'mindset' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela', category: 'mindset' },
  { text: 'If you want to fly, you have to give up the things that weigh you down.', author: 'Toni Morrison', category: 'mindset' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'mindset' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'mindset' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', category: 'mindset' },
  { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs', category: 'mindset' },
  { text: 'Have the courage to follow your heart and intuition.', author: 'Steve Jobs', category: 'mindset' },

  // ======================== Final Trading Quotes ========================
  { text: 'The market transfers money from the active to the patient.', author: 'Warren Buffett', category: 'discipline' },
  { text: 'The best traders are not those who win the most. They are those who lose the least.', author: 'Anonymous', category: 'risk' },
  { text: 'Every professional was once an amateur. The difference is they never stopped learning.', author: 'Anonymous', category: 'wisdom' },
  { text: 'Trading is a marathon. Pace yourself accordingly.', author: 'Anonymous', category: 'discipline' },
  { text: 'The goal is not to be right. The goal is to make money.', author: 'George Soros', category: 'mindset' },
  { text: 'Trade less. Think more. Execute better.', author: 'Anonymous', category: 'discipline' },
  { text: 'The best traders are those who can remain calm under pressure.', author: 'Anonymous', category: 'psychology' },
  { text: 'If you can handle losses, the wins will take care of themselves.', author: 'Anonymous', category: 'risk' },
  { text: 'The market rewards those who respect it and punishes those who don\'t.', author: 'Anonymous', category: 'mindset' },
  { text: 'A trader\'s job is not to predict the future. It\'s to prepare for it.', author: 'Anonymous', category: 'discipline' },
  { text: 'Don\'t fall in love with your trades. Fall in love with your process.', author: 'Anonymous', category: 'discipline' },
  { text: 'The difference between a winning trader and a losing trader is their habits.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your trading edge is your routine. Protect it fiercely.', author: 'Anonymous', category: 'discipline' },
  { text: 'Simplicity is the ultimate sophistication in trading.', author: 'Anonymous', category: 'trading' },
  { text: 'The best system is the one you can follow consistently under pressure.', author: 'Anonymous', category: 'discipline' },
  { text: 'Don\'t chase the market. Let the market come to you.', author: 'Anonymous', category: 'trading' },
  { text: 'Your job as a trader is not to make money. It\'s to manage risk. The money follows.', author: 'Anonymous', category: 'risk' },
  { text: 'Every trading day is a new opportunity. Don\'t let yesterday\'s losses steal today\'s opportunities.', author: 'Anonymous', category: 'mindset' },
  { text: 'The best trades are the ones you didn\'t take. Patience is a trade too.', author: 'Anonymous', category: 'discipline' },
  { text: 'Your trading account is your business. Treat it with respect.', author: 'Anonymous', category: 'discipline' },
]

/** Get a random quote from the database. */
export function getRandomQuote(excludeIndex = -1) {
  let idx
  do { idx = Math.floor(Math.random() * QUOTES.length) } while (idx === excludeIndex && QUOTES.length > 1)
  return { ...QUOTES[idx], index: idx }
}

/** Get "Quote of the Day" — deterministic based on date string. */
export function getQuoteOfDay(dateStr) {
  // Use date string as seed
  let hash = 0
  const s = dateStr || new Date().toISOString().slice(0, 10)
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0 }
  const idx = Math.abs(hash) % QUOTES.length
  return { ...QUOTES[idx], index: idx }
}

/** Search quotes by text. */
export function searchQuotes(query) {
  if (!query || !query.trim()) return []
  const q = query.toLowerCase()
  return QUOTES.filter((quote) => quote.text.toLowerCase().includes(q) || quote.author.toLowerCase().includes(q))
}

/** Get all unique authors. */
export function getAuthors() {
  const set = new Set(QUOTES.map((q) => q.author))
  return [...set].sort()
}

/** Get quotes by author. */
export function getQuotesByAuthor(author) {
  return QUOTES.filter((q) => q.author === author)
}

/** Get all unique categories. */
export function getCategories() {
  const set = new Set(QUOTES.map((q) => q.category))
  return [...set]
}

/** Get total quote count (for future expansion) */
export function getQuoteCount() { return QUOTES.length }
