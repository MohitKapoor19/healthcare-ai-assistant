export const API_CONFIG = {
  reasoner: {
    url: process.env.OLLAMA_URL || "http://localhost:11434/api/chat",
    model: process.env.REASONER_MODEL || "deepseek-reasoner",
  },
  chat: {
    url: process.env.OLLAMA_URL || "http://localhost:11434/api/chat",
    model: process.env.CHAT_MODEL || "deepseek-chat",
  },
  deepseek_api_placeholder: {
    apiKey: process.env.DEEPSEEK_API_KEY || "PASTE_YOUR_DEEPSEEK_API_KEY_HERE",
  }
};
