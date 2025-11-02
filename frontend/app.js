// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:3000/api/chat';
const CLEAR_HISTORY_URL = 'http://localhost:3000/api/clear-history';

// --- UI ---
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearHistoryButton = document.getElementById('clear-history');
const debugEmotion = document.getElementById('debug-emotion'); // debug 
const videoStatus = document.getElementById('video-status'); // also

// --- Video ---
const videoPlayer = document.getElementById('videoPlayer'); // video elemen
let waitingLoopTimer = null; // timer 10 sec till the and of loop

// --- path to assets ---
const ASSET_PATHS = {
    // 20 gifs (for the moment 3)
    waiting: [
        '/assets/waiting/waiting1.gif',
        '/assets/waiting/waiting2.gif',
        '/assets/waiting/waiting3.gif'
     
    ],

    working: [
        '/assets/working/working1.gif',
        '/assets/working/working2.gif'

    ],

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

        'default': [
            '/assets/waiting/waiting1.gif' 
        ],
        'error': [
            '/assets/aggressive/aggressive1.gif' 
        ]
    }
};

/**
 * sub function to get element out of array
 */
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- ❗ video control logic ---

/**
 * STATE 1: WAITING
 * Plays a random waiting GIF.
 * Reruns itself after 10 seconds, selecting a new GIF.
 */
function playWaitingVideo() {
    // clean old timer if had one (probably not working idk)
    if (waitingLoopTimer) {
        clearTimeout(waitingLoopTimer);
    }
    
    const videoSrc = getRandomElement(ASSET_PATHS.waiting);
    videoPlayer.src = videoSrc;
    videoPlayer.loop = true; // waiting gifs should repit
    videoPlayer.play();
    
    videoStatus.textContent = 'Waiting';
    debugEmotion.textContent = 'neutral';

    // timer for waiting video 
    waitingLoopTimer = setTimeout(playWaitingVideo, 10000); // 10000 мс = 10 sec
}

/**
 * STATE 2: WORKING
 * Called when "Send" is clicked.
 * Interrupts the waiting loop and plays the working GIF (loop: true).
 */
function playWorkingVideo() {
    // Interrupt the 10-second waiting loop
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
 * STATE 3: RESPONSE
 * Called when the AI has sent a response.
 * Plays an emotion GIF ONCE.
 * When the GIF ends, the 'onended' listener (see below) will return us to WAITING mode.
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

// --- main app functions ---

/**
 * add mess to chat.
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
 *  MAIN FUNCTION OF SENDING REQUEST !!DO NOT TOUCH!!
 */
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. clean UI
    userInput.value = '';
    appendMessage(text, 'user');
    sendButton.disabled = true;
    
  // --- ❗ CALLING STATE 2 (WORKING) ---
    playWorkingVideo();
    
    try {
            // 2. Data submission (without isAggressive, as we have removed it)       
            const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: text })
        });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();
        
        // 3. parcing answer for video DO NOT TOUCH 
        const rawResponse = data.responseText;
        const emotionRegex = /^(\^[^ \t]+\^)/;
        const match = rawResponse.match(emotionRegex);

        let emotionTag = '^default^';
        let cleanText = rawResponse;
        
        if (match) {
            emotionTag = match[1]; // ^happy^
            cleanText = rawResponse.replace(match[1], '').trim();
        }

        // 4. Update UI
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
        
        // If an error occurs, we also play a video (e.g., 'error' or 'aggressive')
        playResponseVideo('error');

    } finally {
        sendButton.disabled = false;
    }
}

/**
 * Cleaning history Does not work kinda if you know how fix it text pls
 */
async function clearHistory() {
    if (!confirm("are you shure that you wanna clean my memory")) {
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
            
            // droping video in waiting mode
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
 * ❗ VIDEO END HANDLER
 * This handler monitors when a video ends.
 * If it was a RESPONSE video (loop == false), it starts the WAITING mode.
 */
videoPlayer.onended = () => {
    if (videoPlayer.loop === false) {
        // video finished comeback to playing
        playWaitingVideo();
    }
    // If loop === true, it's a waiting or working GIF, it simply continues
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. if page startted we play waiting mode
    playWaitingVideo();
    
    // 2. load start system data
    let modelStatus = document.querySelector('.model-status');
    if (modelStatus) {
        // idk why is it working and i dont wanna chenge it 
        modelStatus.textContent = 'Model: llama3'; 
    }
});
