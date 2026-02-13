import { Category } from '@prisma/client';

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.DEVELOPMENT]: 'Development',
  [Category.SECURITY]: 'Security',
  [Category.DATA_ANALYTICS]: 'Data & Analytics',
  [Category.AI_ML]: 'AI/ML',
  [Category.TESTING]: 'Testing',
  [Category.INTEGRATION]: 'Integration',
};

export const CATEGORY_SLUGS: Record<Category, string> = {
  [Category.DEVELOPMENT]: 'development',
  [Category.SECURITY]: 'security',
  [Category.DATA_ANALYTICS]: 'data',
  [Category.AI_ML]: 'aiml',
  [Category.TESTING]: 'testing',
  [Category.INTEGRATION]: 'integration',
};

export const SLUG_TO_CATEGORY: Record<string, Category> = {
  development: Category.DEVELOPMENT,
  security: Category.SECURITY,
  data: Category.DATA_ANALYTICS,
  aiml: Category.AI_ML,
  testing: Category.TESTING,
  integration: Category.INTEGRATION,
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as Category,
  label,
}));

export const ALL_CATEGORIES: Category[] = [
  Category.DEVELOPMENT,
  Category.SECURITY,
  Category.DATA_ANALYTICS,
  Category.AI_ML,
  Category.TESTING,
  Category.INTEGRATION,
];
