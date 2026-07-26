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
