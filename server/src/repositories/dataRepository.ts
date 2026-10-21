import path from "node:path";
import { DATA_DIR } from "../utils/paths.js";
import { readJsonFile, writeJsonFile } from "./jsonStore.js";
import type { AppConfig, Category, Claim, User } from "../types.js";

const usersPath = path.join(DATA_DIR, "users.json");
const claimsPath = path.join(DATA_DIR, "claims.json");
const categoriesPath = path.join(DATA_DIR, "categories.json");
const configPath = path.join(DATA_DIR, "app-config.json");

export async function getUsers(): Promise<User[]> {
  return readJsonFile<User[]>(usersPath);
}

export async function getClaims(): Promise<Claim[]> {
  return readJsonFile<Claim[]>(claimsPath);
}

export async function saveClaims(claims: Claim[]): Promise<void> {
  await writeJsonFile(claimsPath, claims);
}

export async function getCategories(): Promise<Category[]> {
  return readJsonFile<Category[]>(categoriesPath);
}

export async function getAppConfig(): Promise<AppConfig> {
  return readJsonFile<AppConfig>(configPath);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username === username);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}
