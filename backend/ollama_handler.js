// backend/ollama_handler.js
const fetch = require('node-fetch');

/**
 * Получает ответ от модели Ollama.
 * @param {string} systemPrompt - Системный промпт (правила персонажа).
 * @param {string} userInput - Ввод пользователя.
 * @param {string} model - Имя модели (например, "tinyllama").
 * @param {string} apiUrl - URL API Ollama.
 * @returns {string} Сырой ответ от Ollama.
 */
async function getOllamaResponse(systemPrompt, userInput, model, apiUrl) {
    const requestBody = {
        model: model,
        prompt: userInput,
        options: {
            // Температура 0.1 для более точных ответов
            temperature: 0.1
        },
        stream: false, // ❗ Важно: ждем полного ответа, а не потока
        system: systemPrompt
        // Удалил raw: false - он не нужен для стандартного API
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Если Ollama не отвечает, это покажет ошибку 404/500/etc.
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const data = await response.json();
        // Ollama возвращает ответ в поле 'response'
        return data.response.trim();

    } catch (error) {
        console.error("Error connecting to Ollama:", error.message);
        // Добавим более конкретное сообщение об ошибке, если это таймаут/подключение
        throw new Error(`Connection to Ollama failed. Check: 1) Is Ollama running? 2) Is model '${model}' pulled (ollama pull ${model})? 3) Is port 11434 open?`);
    }
}

module.exports = {
    getOllamaResponse
};
