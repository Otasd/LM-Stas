# LM-Stas

LM-Stas is a fun project by Stas that lets you chat with the legend himself!  
Ever wanted to talk directly to Stas? Now you can, through a conversational AI interface powered by Ollama and Llama3.

---

## Features

- Chat directly with "Stas" using Llama3 as the backend
- Easy setup for both Linux and Windows
- Powered by Node.js and Ollama

---

## Installation

### Linux

```bash
git clone https://github.com/Otasd/LM-Stas.git
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3:8b
cd LM-Stas/backend
npm install
npm start
```

### Windows

1. **Clone the repository:**
   - Download [Git for Windows](https://git-scm.com/download/win) if needed
   - Open Git Bash and run:
     ```bash
     git clone https://github.com/Otasd/LM-Stas.git
     ```
2. **Install Ollama:**
   - Go to [Ollama Windows Install](https://ollama.com/download) and follow instructions
   - In your terminal or Command Prompt:
     ```bash
     ollama pull llama3:8b
     ```
3. **Start the backend:**
   - Open Command Prompt, PowerShell, or terminal:
     ```bash
     cd LM-Stas/backend
     npm install
     npm start
     ```

---

## Project Structure

```text
LM-Stas/
├── backend/
│   ├── ollama_handler.js
│   ├── package.json
│   ├── package-lock.json
│   ├── prompt_constructor.js
│   ├── script_handler.js
│   ├── server.js
│   ├── state.json
│   ├── state_manager.js
│   └── node_modules
├── frontend/
│   ├── app.js
│   ├── backupIndex.html
│   ├── index.html
│   └── assets #gifs for right corner

├── README.md
├── config.json #kinda broken btw
└── LICENSE
```

---

## About

This is a fun project by Stas designed so anyone can have a conversation with "me" (Stas) through the magic of AI!  
Whether you want a laugh, advice, or just some company, LM-Stas is here for you.

---

## Contributing

If you have any ideas how to fix or optimize this code, let me know!

---

## License

MIT License

---

Made with ❤️ by [Otasd](https://github.com/Otasd)
