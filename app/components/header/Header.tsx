import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:code-duotone text-2xl text-purple-500" />
        <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent flex items-center">
          Jimmyverse.dev
        </a>
      </div>
      
      {/* Navigation Links */}
      <div className="flex items-center gap-3 ml-6">
        <a 
          href="https://jimmyverseimages.netlify.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-2 text-sm bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-md transition-all duration-200 flex items-center gap-2"
        >
          <div className="i-ph:image text-base" />
          Jimmyverse.images
          <div className="i-ph:arrow-square-out text-xs opacity-60" />
        </a>
        <a 
          href="https://jimmyverse.se/projects" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-2 text-sm bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-md transition-all duration-200 flex items-center gap-2"
        >
          <div className="i-ph:folder-open text-base" />
          Jimmyverse.projects
          <div className="i-ph:arrow-square-out text-xs opacity-60" />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="mr-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
