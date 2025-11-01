const { exec } = require('child_process');

// --- WARNING ---
// Security Note: Only commands explicitly listed in the whitelist map below 
// should be allowed. NEVER allow the AI to generate and execute arbitrary commands.
// --- WARNING ---

// Define the whitelist of safe command IDs and their corresponding bash commands.
const COMMAND_WHITELIST = {
    'reboot_pc': 'sudo reboot now',      // Requires sudo permissions for execution
    'open_browser': 'xdg-open "https://google.com"', // Standard Linux desktop command
    'check_temp': 'sensors'             // Example command to check CPU temp
    // Add more commands here as needed:
    // 'clean_cache': 'sudo apt clean' 
};

/**
 * Checks if the AI's response contains a command tag and executes it if whitelisted.
 * The AI should generate a tag like: ^cmd(reboot_pc)^
 *
 * @param {string} rawResponse - The full response string from the Ollama handler.
 * @returns {Promise<{text: string, commandExecuted: boolean}>} Object containing the clean text 
 * and a flag indicating if a command was executed.
 */
async function executeCommandIfTagged(rawResponse) {
    // Regex to find the command tag: ^cmd(COMMAND_ID)^
    const commandRegex = /\^cmd\((.+?)\)\^/; 
    const match = rawResponse.match(commandRegex);

    if (!match) {
        // No command tag found, return the original text
        return { text: rawResponse, commandExecuted: false };
    }

    const commandId = match[1].trim(); // Extract the COMMAND_ID (e.g., 'reboot_pc')
    const bashCommand = COMMAND_WHITELIST[commandId];
    
    // Remove the command tag from the response text
    const cleanText = rawResponse.replace(commandRegex, '').trim();

    if (!bashCommand) {
        console.warn(`[CMD_HANDLER] WARNING: AI requested command ID '${commandId}', but it is NOT whitelisted.`);
        return { text: cleanText, commandExecuted: false };
    }

    console.log(`[CMD_HANDLER] Executing whitelisted command: ${commandId} (${bashCommand})`);

    // Execute the command using a promise wrapper
    return new Promise((resolve) => {
        exec(bashCommand, (error, stdout, stderr) => {
            if (error) {
                // Log and return the error to the user, but do not crash the server
                console.error(`[CMD_HANDLER] Execution failed for ${commandId}:`, error.message);
                resolve({ 
                    text: `${cleanText}\n[SYSTEM ERROR: Failed to execute '${commandId}'. Check console logs. Error: ${stderr || error.message}]`, 
                    commandExecuted: true 
                });
                return;
            }
            
            // Log success and inform the user
            console.log(`[CMD_HANDLER] Command '${commandId}' executed successfully.`);
            
            // Note: For 'reboot', the process will likely terminate here.
            resolve({ 
                text: `${cleanText}\n[SYSTEM: Command '${commandId}' executed successfully.]`, 
                commandExecuted: true 
            });
        });
    });
}

module.exports = { executeCommandIfTagged };

// IMPORTANT: For the AI to use this, the Prompt Constructor must be updated 
// to instruct the AI to use the ^cmd(ID)^ format when appropriate. We'll do this later.
