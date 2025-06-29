import type { Message } from 'ai';
import { generateId } from './fileUtils';

export interface ProjectCommands {
  type: string;
  setupCommand?: string;
  startCommand?: string;
  followupMessage: string;
  autoStart?: boolean; // New flag for automatic workflow
}

interface FileContent {
  content: string;
  path: string;
}

export async function detectProjectCommands(files: FileContent[]): Promise<ProjectCommands> {
  const hasFile = (name: string) => files.some((f) => f.path.endsWith(name));

  if (hasFile('package.json')) {
    const packageJsonFile = files.find((f) => f.path.endsWith('package.json'));

    if (!packageJsonFile) {
      return { type: '', setupCommand: 'npm install', followupMessage: 'Initializing npm project...' };
    }

    try {
      const packageJson = JSON.parse(packageJsonFile.content);
      const scripts = packageJson?.scripts || {};

      // Always prioritize 'dev' command for Jimmyverse.dev workflow
      const preferredCommands = ['dev', 'start', 'preview'];
      const availableCommand = preferredCommands.find((cmd) => scripts[cmd]);

      // Always ensure npm install runs first, then start dev server
      if (availableCommand) {
        return {
          type: 'Node.js',
          setupCommand: `npm install`,
          startCommand: `npm run ${availableCommand}`,
          followupMessage: `🚀 Jimmyverse.dev workflow: Installing dependencies and starting ${availableCommand} server for live preview...`,
        };
      }

      // Even without dev script, ensure npm install runs
      return {
        type: 'Node.js',
        setupCommand: 'npm install',
        startCommand: 'npm start',
        followupMessage: '📦 Installing dependencies and attempting to start the project...',
      };
    } catch (error) {
      console.error('Error parsing package.json:', error);
      return { 
        type: 'Node.js', 
        setupCommand: 'npm install', 
        followupMessage: '⚠️ Error parsing package.json, but installing dependencies anyway...' 
      };
    }
  }

  if (hasFile('index.html')) {
    return {
      type: 'Static',
      setupCommand: 'npm install -g serve',
      startCommand: 'npx --yes serve',
      followupMessage: '🌐 Setting up static file server for live preview...',
    };
  }

  // Default fallback - always try npm install for any project
  return { 
    type: 'Unknown', 
    setupCommand: 'npm install', 
    followupMessage: '🔧 Attempting to initialize project with npm...' 
  };
}

export function createCommandsMessage(commands: ProjectCommands): Message | null {
  // Always create a message for Jimmyverse.dev workflow
  let commandString = '';

  // Always run setup command first (npm install)
  if (commands.setupCommand) {
    commandString += `
<boltAction type="shell">${commands.setupCommand}</boltAction>`;
  }

  // Then start the development server for live preview
  if (commands.startCommand) {
    commandString += `
<boltAction type="start">${commands.startCommand}</boltAction>
`;
  }

  // If no commands, provide default npm workflow
  if (!commandString) {
    commandString = `
<boltAction type="shell">npm install</boltAction>
<boltAction type="start">npm run dev</boltAction>
`;
  }

  return {
    role: 'assistant',
    content: `
${commands.followupMessage ? `\n\n${commands.followupMessage}` : '🚀 Jimmyverse.dev: Setting up your project with live preview...'}
<boltArtifact id="project-setup" title="Jimmyverse.dev Project Setup">
${commandString}
</boltArtifact>`,
    id: generateId(),
    createdAt: new Date(),
  };
}

export function escapeBoltArtifactTags(input: string) {
  // Regular expression to match boltArtifact tags and their content
  const regex = /(<boltArtifact[^>]*>)([\s\S]*?)(<\/boltArtifact>)/g;

  return input.replace(regex, (match, openTag, content, closeTag) => {
    // Escape the opening tag
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Escape the closing tag
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Return the escaped version
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
}

export function escapeBoltAActionTags(input: string) {
  // Regular expression to match boltArtifact tags and their content
  const regex = /(<boltAction[^>]*>)([\s\S]*?)(<\/boltAction>)/g;

  return input.replace(regex, (match, openTag, content, closeTag) => {
    // Escape the opening tag
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Escape the closing tag
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Return the escaped version
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
}

export function escapeBoltTags(input: string) {
  return escapeBoltArtifactTags(escapeBoltAActionTags(input));
}

// We have this seperate function to simplify the restore snapshot process in to one single artifact.
export function createCommandActionsString(commands: ProjectCommands): string {
  let commandString = '';

  // Always ensure setup command runs first
  const setupCmd = commands.setupCommand || 'npm install';
  commandString += `
<boltAction type="shell">${setupCmd}</boltAction>`;

  // Always ensure dev server starts for live preview
  const startCmd = commands.startCommand || 'npm run dev';
  commandString += `
<boltAction type="start">${startCmd}</boltAction>
`;

  return commandString;
}
