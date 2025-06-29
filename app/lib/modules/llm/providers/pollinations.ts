import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';

export default class PollinationsProvider extends BaseProvider {
  name = 'Pollinations';
  getApiKeyLink = 'https://pollinations.ai';

  config = {
    apiTokenKey: 'POLLINATIONS_API_KEY',
    baseUrlKey: 'POLLINATIONS_BASE_URL',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'openai',
      label: 'Pollinations OpenAI (GPT-4)',
      provider: 'Pollinations',
      maxTokenAllowed: 8192,
    },
    {
      name: 'mistral',
      label: 'Pollinations Mistral',
      provider: 'Pollinations',
      maxTokenAllowed: 8192,
    },
    {
      name: 'claude',
      label: 'Pollinations Claude',
      provider: 'Pollinations',
      maxTokenAllowed: 8192,
    },
    {
      name: 'llama',
      label: 'Pollinations Llama',
      provider: 'Pollinations',
      maxTokenAllowed: 8192,
    },
    {
      name: 'searchgpt',
      label: 'Pollinations SearchGPT',
      provider: 'Pollinations',
      maxTokenAllowed: 8192,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseURL } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'POLLINATIONS_BASE_URL',
      defaultApiTokenKey: 'POLLINATIONS_API_KEY',
    });

    return createOpenAI({
      baseURL: baseURL || 'https://text.pollinations.ai/openai',
      apiKey: apiKey || 'not-required',
    })(model);
  }
}