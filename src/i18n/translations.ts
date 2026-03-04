export type { TranslationSet } from "./types";
export { LANGUAGE_LABELS, LANGUAGE_NAMES } from "./types";
export type { Language } from "./types";

import { en } from "./en";
import { my } from "./my";
import { zo } from "./zo";
import type { Language } from "./types";
import type { TranslationSet } from "./types";

export const translations: Record<Language, TranslationSet> = { en, my, zo };
