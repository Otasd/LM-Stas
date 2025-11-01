const fs = require('fs').promises;
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');

// --- 1. DEFAULT STATE ---
const DEFAULT_STATE = {
    model: "llama3:8b",
    ollamaApiUrl: "http://localhost:11434/api/generate",
    // УДАЛЕНО: max_points и relationship
    history: [], // История чата
    // Состояние видео, отправляемое на фронтенд
    video_state: {
        current_video_id: 'intro_video.mp4', // Видео приветствия при первом запуске
        waiting_mode_enabled: false
    }
};

// --- 2. CORE FUNCTIONS ---

/**
 * Загружает текущее состояние из state.json или использует состояние по умолчанию.
 * @returns {object} Текущее состояние.
 */
async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf8');
        const state = JSON.parse(data);
        // Используем оператор объединения, чтобы применить новые дефолты к старым файлам.
        // Здесь нет сложного объединения отношений, так как мы их удалили.
        return { ...DEFAULT_STATE, ...state };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("State file not found. Using default state.");
        } else {
            // Если ошибка не связана с отсутствием файла, выводим ее
            console.error("Error reading state file:", error);
        }
        return DEFAULT_STATE;
    }
}

/**
 * Сохраняет текущее состояние в state.json.
 * @param {object} state - Состояние для сохранения.
 */
async function saveState(state) {
    try {
        // Записываем данные в state.json с отступом 2 для читаемости
        const data = JSON.stringify(state, null, 2);
        await fs.writeFile(STATE_FILE, data, 'utf8');
    } catch (error) {
        console.error("Error writing state file:", error);
    }
}

/**
 * Обновляет состояние, добавляя новое сообщение в историю.
 * @param {object} currentState - Текущее состояние.
 * @param {string} userInput - Ввод пользователя.
 * @returns {object} Обновленное состояние.
 */
function updateState(currentState, userInput) {
    const newState = { ...currentState };

    // Добавляем сообщение пользователя в историю
    newState.history.push({
        role: "user",
        content: userInput,
        timestamp: new Date().toISOString()
    });

    // Ограничиваем историю, чтобы избежать слишком длинных промптов
    if (newState.history.length > 20) {
        // Удаляем старые сообщения
        newState.history = newState.history.slice(-20); 
    }
    
    return newState;
}

/**
 * Возвращает чистое начальное состояние (копию DEFAULT_STATE).
 * @returns {object} Начальное состояние.
 */
function getInitialState() {
    // Важно вернуть копию, чтобы избежать мутаций
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

// --- 3. EXPORTS ---
module.exports = {
    loadState,
    updateState,
    saveState,
    getInitialState, // <-- Добавил getInitialState для server.js
    DEFAULT_STATE 
};
