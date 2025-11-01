// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:3000/api/chat';
const CLEAR_HISTORY_URL = 'http://localhost:3000/api/clear-history';

// --- ЭЛЕМЕНТЫ UI ---
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearHistoryButton = document.getElementById('clear-history');
const debugEmotion = document.getElementById('debug-emotion'); // Оставлено для отладки
const videoStatus = document.getElementById('video-status'); // Оставлено для отладки

// --- ❗ НОВЫЕ ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ВИДЕО ---
const videoPlayer = document.getElementById('videoPlayer'); // Наш новый <video> элемент
let waitingLoopTimer = null; // Таймер для 10-секундного цикла ожидания

// --- ❗ ПУТИ К ТВОИМ АССЕТАМ (КАК ТЫ И ПРОСИЛ) ---
const ASSET_PATHS = {
    // 20 гифок (пока 3 для теста)
    waiting: [
        '/assets/waiting/waiting1.gif',
        '/assets/waiting/waiting2.gif',
        '/assets/waiting/waiting3.gif'
        // Добавь сюда waiting4.gif ... waiting20.gif
    ],
    // Гифки во время работы
    working: [
        '/assets/working/working1.gif',
        '/assets/working/working2.gif'
        // Добавь еще, если есть
    ],
    // Гифки ответа (по 3 на эмоцию)
    response: {
        happy: [
            '/assets/happy/happy1.gif',
            '/assets/happy/happy2.gif',
            '/assets/happy/happy3.gif'
        ],
        interested: [
            '/assets/interested/interested1.gif',
            '/assets/interested/interested2.gif',
            '/assets/interested/interested3.gif'
        ],
        bored: [
            '/assets/bored/bored1.gif',
            '/assets/bored/bored2.gif',
            '/assets/bored/bored3.gif'
        ],
        aggressive: [
            '/assets/aggressive/aggressive1.gif',
            '/assets/aggressive/aggressive2.gif',
            '/assets/aggressive/aggressive3.gif'
        ],
        // Добавь 'love' или 'default', если они нужны
        'default': [
            '/assets/waiting/waiting1.gif' // По умолчанию
        ],
        'error': [
            '/assets/aggressive/aggressive1.gif' // Если ошибка
        ]
    }
};

/**
 * Вспомогательная функция для выбора случайного элемента из массива
 */
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- ❗ НОВАЯ ЛОГИКА УПРАВЛЕНИЯ ВИДЕО ---

/**
 * СОСТОЯНИЕ 1: ОЖИДАНИЕ (WAITING)
 * Играет случайную гифку ожидания.
 * Через 10 секунд запускает себя снова, выбирая новую гифку.
 */
function playWaitingVideo() {
    // Очищаем старый таймер, если он был
    if (waitingLoopTimer) {
        clearTimeout(waitingLoopTimer);
    }
    
    const videoSrc = getRandomElement(ASSET_PATHS.waiting);
    videoPlayer.src = videoSrc;
    videoPlayer.loop = true; // Гифки ожидания должны повторяться
    videoPlayer.play();
    
    videoStatus.textContent = 'Waiting';
    debugEmotion.textContent = 'neutral';

    // Устанавливаем новый таймер на 10 секунд
    waitingLoopTimer = setTimeout(playWaitingVideo, 10000); // 10000 мс = 10 секунд
}

/**
 * СОСТОЯНИЕ 2: РАБОТА (WORKING)
 * Вызывается при нажатии "Send".
 * Прерывает цикл ожидания и играет гифку работы (loop: true).
 */
function playWorkingVideo() {
    // Прерываем 10-секундный цикл ожидания
    if (waitingLoopTimer) {
        clearTimeout(waitingLoopTimer);
        waitingLoopTimer = null;
    }
    
    const videoSrc = getRandomElement(ASSET_PATHS.working);
    videoPlayer.src = videoSrc;
    videoPlayer.loop = true; // "don't stop until the answer... will come"
    videoPlayer.play();

    videoStatus.textContent = 'Working...';
}

/**
 * СОСТОЯНИЕ 3: ОТВЕТ (RESPONSE)
 * Вызывается, когда ИИ прислал ответ.
 * Играет ОДИН РАЗ гифку эмоции.
 * Когда гифка заканчивается, 'onended' listener (см. ниже) вернет нас в режим ОЖИДАНИЯ.
 */
function playResponseVideo(emotionTag) {
    const tag = emotionTag.replace(/\^/g, '').trim(); // Clean and trim the tag
    const videoList = ASSET_PATHS.response[tag] || ASSET_PATHS.response['default'];
    const videoSrc = getRandomElement(videoList);
    
    videoPlayer.src = videoSrc;
    videoPlayer.loop = false; // "when animation is finished go to waiting"
    videoPlayer.play();

    videoStatus.textContent = 'Speaking...';
    debugEmotion.textContent = tag;
}

// --- ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ ---

/**
 * Добавляет сообщение в чат.
 */
function appendMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = sender === 'user' ? `You: <b>${text}</b>` : `Bot: ${text}`;
    
    let historyContainer = document.getElementById('chatHistory') || chatArea;
    historyContainer.appendChild(messageElement);
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

/**
 * Главная функция отправки запроса
 */
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Сброс UI
    userInput.value = '';
    appendMessage(text, 'user');
    sendButton.disabled = true;
    
    // --- ❗ ВЫЗЫВАЕМ СОСТОЯНИЕ 2 (РАБОТА) ---
    playWorkingVideo();
    
    try {
        // 2. Отправка данных (без isAggressive, так как мы удалили его)
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: text })
        });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();
        
        // 3. ПАРСИНГ ОТВЕТА (для видео)
        const rawResponse = data.responseText;
        const emotionRegex = /^(\^[^ \t]+\^)/;
        const match = rawResponse.match(emotionRegex);

        let emotionTag = '^default^';
        let cleanText = rawResponse;
        
        if (match) {
            emotionTag = match[1]; // ^happy^
            cleanText = rawResponse.replace(match[1], '').trim();
        }

        // 4. ОБНОВЛЕНИЕ UI
        appendMessage(cleanText, 'bot');
        
        const validEmotions = ['happy', 'interested', 'bored', 'aggressive'];
        if (validEmotions.includes(emotionTag.replace(/\^/g, ''))) {
            playResponseVideo(emotionTag);
        } else {
            playWaitingVideo();
        }
        
    } catch (error) {
        console.error('Fetch or parsing error:', error);
        appendMessage(`System Error: Could not connect to the server or AI. (${error.message})`, 'bot');
        
        // Если ошибка, тоже играем видео (например, 'error' или 'aggressive')
        playResponseVideo('error');

    } finally {
        sendButton.disabled = false;
    }
}

/**
 * Функция сброса истории
 */
async function clearHistory() {
    if (!confirm("Ты уверен, что хочешь стереть LM-Stas'у память, придурок?")) {
        return; 
    }

    try {
        const response = await fetch(CLEAR_HISTORY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            let historyContainer = document.getElementById('chatHistory');
            if (historyContainer) {
                 historyContainer.innerHTML = '<div class="chat-message bot">Your conversation will appear here...</div>';
            } else {
                 console.warn("Element with id 'chatHistory' not found.");
                 document.getElementById('chatArea').innerHTML = '<div class="chat-message bot">Your conversation will appear here...</div>';
            }

            console.log("Память LM-Stas'а успешно стерта.");
            alert("Память LM-Stas'а успешно стерта!");
            
            // Сбрасываем видео в режим ожидания
            playWaitingVideo();

        } else {
            throw new Error('Сервер вернул ошибку при сбросе.');
        }
    } catch (error) {
        console.error('Ошибка сброса истории:', error);
        alert("Ошибка сброса истории, придурок. Проверь консоль.");
    }
}


// --- EVENT LISTENERS ---
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearHistoryButton.addEventListener('click', clearHistory);

/**
 * ❗ ОБРАБОТЧИК ОКОНЧАНИЯ ВИДЕО
 * Этот обработчик следит, когда видео заканчивается.
 * Если это было видео ОТВЕТА (loop == false), он запускает режим ОЖИДАНИЯ.
 */
videoPlayer.onended = () => {
    if (videoPlayer.loop === false) {
        // Видео ответа закончилось, возвращаемся к ожиданию
        playWaitingVideo();
    }
    // Если loop === true, это гифка ожидания или работы, она просто продолжается
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. При старте страницы СРАЗУ запускаем режим ОЖИДАНИЯ
    playWaitingVideo();
    
    // 2. Загружаем начальные системные данные
    let modelStatus = document.querySelector('.model-status');
    if (modelStatus) {
        // Убедись, что ты исправил это на 'llama3' (ты удалил tinyllama)
        modelStatus.textContent = 'Model: llama3'; 
    }
});
