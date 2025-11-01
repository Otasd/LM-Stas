const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// Import our custom modules
const { loadState, updateState, saveState, getInitialState } = require('./state_manager');
const { getSystemPrompt, parseResponse } = require('./prompt_constructor'); // <-- Удалили calculateRelationship
const { getOllamaResponse } = require('./ollama_handler');

const app = express();
const PORT = 3000;

let currentState = {}; 

// --- MIDDLEWARE SETUP ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- CHAT API ENDPOINT ---
app.post('/api/chat', async (req, res) => {
    // УДАЛЕНО: const { userInput, isAggressive } = req.body;
    const { userInput } = req.body; 

    if (!userInput) {
        return res.status(400).json({ error: "Input text is required." });
    }

    try {
        // 1. Используем состояние из памяти
        
        // 2. УДАЛЕНО: APPLY AGGRESSIVE MODE
        
        // 3. UPDATE HISTORY 
        currentState = updateState(currentState, userInput);
        
        // 4. CONSTRUCT PROMPT (Промпт теперь не зависит от отношений)
        const systemPrompt = getSystemPrompt(); // <-- Вызываем без аргументов
        
        // 5. GET OLLAMA RESPONSE
        const model = currentState.model;
        const apiUrl = currentState.ollamaApiUrl;
        const rawOllamaResponse = await getOllamaResponse(systemPrompt, userInput, model, apiUrl);

		console.log("RAW OLLAMA RESPONSE:", rawOllamaResponse);
        // 6. PARSE RESPONSE (Эмоция нужна только для видео, отношения не меняются)
        const { emotion, cleanText: finalResponseText } = parseResponse(rawOllamaResponse); 
        
        // 7. УДАЛЕНО: CALCULATE NEW RELATIONSHIP SCORES
        
        // 8. UPDATE VIDEO STATE (Видео все еще привязано к эмоции для разнообразия)
        currentState.video_state.current_video_id = emotion + '_video.mp4'; 
        currentState.video_state.waiting_mode_enabled = true;

        // 9. УДАЛЕНО: SAVE STATE
        
        // 10. SEND FINAL RESPONSE TO FRONTEND
        res.json({
            responseText: finalResponseText,
            // УДАЛЕНО: relationship: currentState.relationship,
            video_state: currentState.video_state,
            commandExecuted: false 
        });

    } catch (error) {
        console.error("Critical server error during chat process:", error);
        res.status(500).json({ error: "Internal Server Error during AI processing." });
    }
});

// --- API ENDPOINT CLEAR HISTORY ---

app.post('/api/clear-history', async (req, res) => {
    try {
        const initialState = getInitialState();
        currentState = initialState; 

        await saveState(currentState);

        res.json({
            message: "History cleared and state reset successfully.",
            // УДАЛЕНО: relationship: initialState.relationship,
            video_state: initialState.video_state
        });

    } catch (error) {
        console.error("Error clearing history and resetting state:", error);
        res.status(500).json({ error: "Failed to clear history." });
    }
});

// --- INITIALIZATION AND SERVER START ---

async function initServerState() {
    console.log("Initializing server state...");
    currentState = await loadState(); 
    console.log("State loaded. Starting server.");

    app.listen(PORT, () => {
        console.log(`🤖 Backend server running on http://localhost:${PORT}`);
    });
}

// --- GRACEFUL SHUTDOWN: Сохраняем состояние при закрытии сервера ---
process.on('SIGINT', async () => {
    console.log('\nServer shutting down. Saving final state...');
    await saveState(currentState);
    console.log('State saved. Goodbye.');
    process.exit(0);
});

initServerState();
