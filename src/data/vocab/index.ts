import type { TopicPack } from './types';
import { PEOPLE_PACKS } from './people';
import { HOME_PACKS } from './home-life';
import { FOOD_PACKS } from './food-drink';
import { NATURE_PACKS } from './nature-animals';
import { CITY_PACKS } from './city-travel';
import { WORK_PACKS } from './work-study';
import { HEALTH_PACKS } from './health-body';
import { CULTURE_PACKS } from './culture-arts';
import { ESSENTIAL_PACKS } from './essentials';
import { OBJECT_PACKS } from './daily-objects';
import { SOCIETY_PACKS } from './society';
import { EXTRA_PACKS } from './extras';
import { FINAL_PACKS } from './final';

/** Every vocabulary pack, in course order. */
export const ALL_PACKS: TopicPack[] = [
  ...ESSENTIAL_PACKS,
  ...PEOPLE_PACKS,
  ...HOME_PACKS,
  ...FOOD_PACKS,
  ...NATURE_PACKS,
  ...CITY_PACKS,
  ...HEALTH_PACKS,
  ...WORK_PACKS,
  ...CULTURE_PACKS,
  ...OBJECT_PACKS,
  ...SOCIETY_PACKS,
  ...EXTRA_PACKS,
  ...FINAL_PACKS,
];

export * from './types';
