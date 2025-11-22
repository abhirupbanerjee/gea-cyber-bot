#!/usr/bin/env tsx

/**
 * Script to display OpenAI Assistant configuration
 *
 * Run with: npx tsx scripts/show-assistant-config.ts
 */

import { printAssistantConfig } from '../app/lib/openai/assistant-config';

printAssistantConfig();
