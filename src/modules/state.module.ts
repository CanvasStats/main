import type { AchievementStat } from "../models/achievement.model";
import type { JsonObject } from "../models/helpers.model";
import type { Instance } from "../models/instance.model";
import type { Pixel } from "../models/pixel.model";
import type { User, UserRanks } from "../models/user.model";

class AppState {
  private _year: number | null = null;
  private _usersRanks: UserRanks[] | null = null;
  private _instances: Instance[] | null = null;
  private _achievements: AchievementStat[] = [];
  private _yearDataCache: Record<number, JsonObject | null> = {};
  private _yearPixelCache: Record<number, Pixel[] | null> = {};
  private _yearUsersCache: Record<number, User[] | null> = {};

  get year(): number | null {
    return this._year;
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  setYear(newYear: number | null) {
    this._year = newYear;
  }

  get userRanks(): UserRanks[] | null {
    return this._usersRanks;
  }

  setUserRanks(newRanks: UserRanks[]) {
    this._usersRanks = newRanks;
  }

  get achievements(): AchievementStat[] {
    return this._achievements;
  }

  setAchievements(newAchievements: AchievementStat[]) {
    this._achievements = newAchievements;
  }

  getFromYearCache(key: number): JsonObject | null {
    return this._yearDataCache[key] ?? null;
  }

  addToYearCache(key: number, value: JsonObject) {
    this._yearDataCache[key] = value;
  }

  clearYearCache() {
    this._yearDataCache = {};
  }

  getFromPixelCache(key: number): Pixel[] | null {
    return this._yearPixelCache[key] ?? null;
  }

  addToPixelCache(key: number, value: Pixel[]) {
    this._yearPixelCache[key] = value;
  }

  clearPixelCache() {
    this._yearPixelCache = {};
  }

  getFromUsersCache(key: number): User[] | null {
    return this._yearUsersCache[key] ?? null;
  }

  addToUsersCache(key: number, value: User[]) {
    this._yearUsersCache[key] = value;
  }

  clearUsersCache() {
    this._yearUsersCache = {};
  }

  get instances(): Instance[] | null {
    return this._instances;
  }

  setInstances(instancesArray: Instance[]) {
    this._instances = instancesArray;
  }
}

export const state = new AppState();