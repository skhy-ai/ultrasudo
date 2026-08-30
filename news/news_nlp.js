/**
 * Ultrasudo News NLP Engine — Sentiment Analysis & Named Entity Recognition (NER)
 */
(function (global) {
    const POSITIVE_WORDS = new Set([
        'surge', 'surges', 'surged', 'soar', 'soars', 'soared', 'rally', 'rallies', 'rallied',
        'gain', 'gains', 'gained', 'profit', 'profits', 'profitable', 'growth', 'grow', 'grows',
        'record', 'breakthrough', 'bullish', 'beat', 'beats', 'success', 'successful', 'jump',
        'jumps', 'jumped', 'high', 'boost', 'boosts', 'boosted', 'innovation', 'innovations',
        'partner', 'partnership', 'approve', 'approved', 'approval', 'lead', 'leads', 'leading',
        'expand', 'expands', 'expansion', 'robust', 'strong', 'upgrade', 'upgrades', 'win', 'wins',
        'advancement', 'unveil', 'unveils', 'unveiled', 'launch', 'launches', 'launched', 'triumph'
    ]);

    const NEGATIVE_WORDS = new Set([
        'fall', 'falls', 'fell', 'plunge', 'plunges', 'plunged', 'drop', 'drops', 'dropped',
        'loss', 'losses', 'crash', 'crashes', 'slump', 'slumps', 'bearish', 'fail', 'fails',
        'failed', 'failure', 'lawsuit', 'lawsuits', 'decline', 'declines', 'declined', 'crisis',
        'warning', 'warns', 'risk', 'risks', 'recession', 'cut', 'cuts', 'debt', 'ban',
        'banned', 'investigation', 'investigate', 'breach', 'hack', 'hacked', 'error',
        'sanction', 'sanctions', 'layoff', 'layoffs', 'lay off', 'default', 'threat', 'threatens',
        'plummet', 'plummets', 'collapse', 'collapses', 'tumble', 'tumbles', 'down', 'lawsuit'
    ]);

    const ENTITY_RULES = [
        // Tickers & Crypto
        { pattern: /\$([A-Z]{2,5})\b/g, type: 'ticker', format: m => `$${m[1].toUpperCase()}` },
        { pattern: /\b(Bitcoin|BTC|Ethereum|ETH|Solana|Crypto|Cryptocurrency)\b/gi, type: 'crypto', format: m => m[0] },
        // Tech & AI Giants
        { pattern: /\b(OpenAI|ChatGPT|Anthropic|Claude|Gemini|DeepMind|NVIDIA|Nvidia|Microsoft|Google|Alphabet|Apple|Tesla|Amazon|Meta|Facebook|AMD|Intel|TSMC)\b/gi, type: 'company', format: m => m[0] },
        { pattern: /\b(Artificial Intelligence|AI|LLM|Machine Learning|Quantum|Semiconductor|Cybersecurity|Post-Quantum|Web3)\b/gi, type: 'tech', format: m => m[0] },
        // Finance & Macro
        { pattern: /\b(Federal Reserve|Fed|Wall Street|S&P 500|Nasdaq|Dow Jones|Inflation|Interest Rates|Central Bank|IMF|Treasury)\b/gi, type: 'finance', format: m => m[0] },
        // Geopolitics
        { pattern: /\b(United States|US|USA|China|India|United Kingdom|UK|European Union|EU|Japan)\b/gi, type: 'geopolitics', format: m => m[0] }
    ];

    class NewsNLPEngine {
        analyzeText(text) {
            if (!text) return { score: 0, label: 'Neutral', color: '#94a3b8', icon: 'fa-minus' };

            const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
            let posCount = 0;
            let negCount = 0;

            tokens.forEach(word => {
                if (POSITIVE_WORDS.has(word)) posCount++;
                if (NEGATIVE_WORDS.has(word)) negCount++;
            });

            const total = posCount + negCount;
            let score = 0;
            if (total > 0) {
                score = (posCount - negCount) / (total + 1);
            }

            let label = 'Neutral';
            let color = '#94a3b8';
            let icon = 'fa-circle-dot';

            if (score >= 0.2) {
                label = 'Bullish';
                color = '#34d399';
                icon = 'fa-arrow-trend-up';
            } else if (score <= -0.2) {
                label = 'Bearish';
                color = '#f87171';
                icon = 'fa-arrow-trend-down';
            }

            return {
                score: Math.round(score * 100) / 100,
                posCount,
                negCount,
                label,
                color,
                icon
            };
        }

        extractEntities(text) {
            if (!text) return [];

            const entitiesMap = new Map();

            ENTITY_RULES.forEach(rule => {
                const matches = text.matchAll(rule.pattern);
                for (const match of matches) {
                    const formatted = rule.format(match);
                    const key = formatted.toLowerCase();

                    if (!entitiesMap.has(key)) {
                        entitiesMap.set(key, {
                            text: formatted,
                            type: rule.type,
                            count: 1
                        });
                    } else {
                        entitiesMap.get(key).count++;
                    }
                }
            });

            return Array.from(entitiesMap.values()).sort((a, b) => b.count - a.count);
        }

        analyzeArticle(article) {
            const combinedText = `${article.title || ''} ${article.snippet || article.description || ''}`;
            const sentiment = this.analyzeText(combinedText);
            const entities = this.extractEntities(combinedText);

            return {
                ...article,
                sentiment,
                entities
            };
        }

        extractTopEntities(articles, limit = 15) {
            const freqMap = new Map();

            articles.forEach(art => {
                const combinedText = `${art.title || ''} ${art.snippet || ''}`;
                const ents = this.extractEntities(combinedText);
                ents.forEach(e => {
                    const k = e.text.toLowerCase();
                    if (!freqMap.has(k)) {
                        freqMap.set(k, { text: e.text, type: e.type, count: e.count });
                    } else {
                        freqMap.get(k).count += e.count;
                    }
                });
            });

            return Array.from(freqMap.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        }
    }

    global.NewsNLP = new NewsNLPEngine();
})(typeof window !== 'undefined' ? window : this);
