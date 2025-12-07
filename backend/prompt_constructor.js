// /backend/prompt_constructor.js

// Удалили аргументы relationship, isAggressive
function getSystemPrompt() {
    let basePrompt = `
`;

    // УДАЛЕНО: if (isAggressive) { ... }
    
    return basePrompt;
}

function parseResponse(responseText) {
    const emotionRegex = /^\^(\w+)\^/;
    const emotionMatch = responseText.match(emotionRegex);
    let emotion = 'neutral';
    let cleanText = responseText;

    if (emotionMatch) {
        emotion = emotionMatch[1].toLowerCase();
        cleanText = responseText.replace(emotionMatch[0], '').trim();
    }

    return { emotion, command: null, cleanText };
}

// УДАЛЕНО: function calculateRelationship(...) {...}

module.exports = {
    getSystemPrompt,
    parseResponse,
    // УДАЛЕНО: calculateRelationship
};
