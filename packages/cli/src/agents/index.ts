import { registerAgent } from './types.js';
import { claudeCodeAgent } from './claude-code.js';
import { cursorAgent } from './cursor.js';
import { copilotAgent } from './copilot.js';

// Register all agents
registerAgent(claudeCodeAgent);
registerAgent(cursorAgent);
registerAgent(copilotAgent);

// Re-export
export * from './types.js';
export { claudeCodeAgent } from './claude-code.js';
export { cursorAgent } from './cursor.js';
export { copilotAgent } from './copilot.js';
