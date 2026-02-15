#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import chalk7 from "chalk";

// src/commands/login.ts
import chalk2 from "chalk";
import ora from "ora";
import { confirm, password } from "@inquirer/prompts";

// src/api/client.ts
import { request } from "undici";
import Conf from "conf";
import chalk from "chalk";
var config = new Conf({
  projectName: "skillhub",
  configName: "config",
  defaults: {
    config: {
      apiUrl: "http://localhost:3000"
    }
  }
});
function getConfig() {
  return config.get("config");
}
function setConfig(newConfig) {
  const currentConfig = config.get("config");
  config.set("config", { ...currentConfig, ...newConfig });
}
function isAuthenticated() {
  const cfg = getConfig();
  return !!cfg.token;
}
async function apiRequest(endpoint, options = {}) {
  const cfg = getConfig();
  const { method = "GET", body, headers = {} } = options;
  const url = `${cfg.apiUrl}${endpoint}`;
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers
  };
  if (cfg.token) {
    requestHeaders["Authorization"] = `Bearer ${cfg.token}`;
  }
  try {
    const response = await request(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : void 0
    });
    const statusCode = response.statusCode;
    let data;
    let error;
    const responseBody = await response.body.text();
    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        if (statusCode >= 400) {
          error = parsed;
        } else {
          data = parsed;
        }
      } catch {
        if (statusCode >= 400) {
          error = { error: responseBody };
        }
      }
    }
    return { data, error, status: statusCode };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(chalk.red(`API request failed: ${errorMessage}`));
    return { error: { error: errorMessage }, status: 0 };
  }
}
async function downloadFile(url) {
  const response = await request(url, {
    method: "GET"
  });
  if (response.statusCode !== 200) {
    throw new Error(`Download failed with status ${response.statusCode}`);
  }
  const chunks = [];
  for await (const chunk of response.body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// src/commands/login.ts
async function login(token, apiUrl) {
  console.log(chalk2.blue("SkillHub CLI Login\n"));
  if (apiUrl) {
    setConfig({ apiUrl });
    console.log(chalk2.gray(`Using API URL: ${apiUrl}`));
  }
  if (isAuthenticated()) {
    const cfg = getConfig();
    console.log(chalk2.yellow("Already authenticated as:"));
    console.log(chalk2.gray(`  Email: ${cfg.email}`));
    console.log(chalk2.gray(`  API URL: ${cfg.apiUrl}`));
    console.log();
    const proceed = await confirm({
      message: "Do you want to login with a different token?",
      default: false
    });
    if (!proceed) {
      return;
    }
  }
  let apiToken = token;
  if (!apiToken) {
    apiToken = await password({
      message: "Enter your API token:",
      mask: "*",
      validate: (input) => {
        if (!input.trim()) {
          return "Token is required";
        }
        if (!input.startsWith("sh_")) {
          return 'Invalid token format. Token should start with "sh_"';
        }
        return true;
      }
    });
  }
  if (!apiToken || !apiToken.startsWith("sh_")) {
    console.log(chalk2.red('Invalid token format. Token should start with "sh_"'));
    process.exit(1);
  }
  const spinner = ora("Validating token...").start();
  setConfig({ token: apiToken });
  const response = await apiRequest("/api/cli/version");
  if (response.error || !response.data?.authenticated) {
    spinner.fail("Token validation failed");
    console.log(chalk2.red(response.error?.error || "Invalid token"));
    setConfig({ token: void 0 });
    process.exit(1);
  }
  spinner.succeed("Token validated successfully!");
  const user = response.data.user;
  setConfig({
    token: apiToken,
    userId: user?.id,
    email: user?.email
  });
  console.log();
  console.log(chalk2.green("Logged in successfully!"));
  console.log(chalk2.gray(`  Email: ${user?.email}`));
  console.log(chalk2.gray(`  Role: ${user?.role}`));
  if (user?.scopes) {
    console.log(chalk2.gray(`  Scopes: ${user.scopes.join(", ")}`));
  }
  console.log();
  console.log(chalk2.blue("You can now use the SkillHub CLI to manage skills."));
}
async function logout() {
  console.log(chalk2.blue("SkillHub CLI Logout\n"));
  if (!isAuthenticated()) {
    console.log(chalk2.yellow("You are not logged in."));
    return;
  }
  setConfig({
    token: void 0,
    userId: void 0,
    email: void 0
  });
  console.log(chalk2.green("Logged out successfully!"));
}
async function whoami() {
  if (!isAuthenticated()) {
    console.log(chalk2.yellow("You are not logged in."));
    console.log(chalk2.gray("Run `skillhub login` to authenticate."));
    return;
  }
  const cfg = getConfig();
  console.log(chalk2.blue("Current user:"));
  console.log(chalk2.gray(`  Email: ${cfg.email}`));
  console.log(chalk2.gray(`  User ID: ${cfg.userId}`));
  console.log(chalk2.gray(`  API URL: ${cfg.apiUrl}`));
}

// src/commands/search.ts
import chalk3 from "chalk";
import Table from "cli-table3";
import ora2 from "ora";
async function search(query, options = {}) {
  const spinner = ora2("Searching skills...").start();
  const params = new URLSearchParams();
  if (query) {
    params.set("search", query);
  }
  if (options.limit) {
    params.set("limit", String(options.limit));
  }
  if (options.category) {
    params.set("category", options.category);
  }
  if (!isAuthenticated()) {
    params.set("visibility", "PUBLIC");
  }
  const response = await apiRequest(`/api/skills?${params.toString()}`);
  if (response.error) {
    spinner.fail("Search failed");
    console.log(chalk3.red(response.error.error));
    process.exit(1);
  }
  spinner.stop();
  const skills = response.data?.skills || [];
  const total = response.data?.total || 0;
  if (skills.length === 0) {
    console.log(chalk3.yellow("No skills found matching your query."));
    return;
  }
  console.log(chalk3.blue(`
Found ${total} skill(s)
`));
  const table = new Table({
    head: [chalk3.cyan("Name"), chalk3.cyan("Description"), chalk3.cyan("Category"), chalk3.cyan("Downloads")],
    colWidths: [25, 50, 15, 12],
    wordWrap: true
  });
  for (const skill of skills) {
    table.push([
      skill.slug,
      skill.description?.substring(0, 47) + (skill.description && skill.description.length > 47 ? "..." : "") || "-",
      skill.category.replace("_", " "),
      skill.stats?.downloadsCount?.toString() || "0"
    ]);
  }
  console.log(table.toString());
  console.log();
}
async function info(skillSlug) {
  const spinner = ora2(`Fetching skill "${skillSlug}"...`).start();
  const params = new URLSearchParams();
  params.set("search", skillSlug);
  params.set("limit", "1");
  const response = await apiRequest(`/api/skills?${params.toString()}`);
  if (response.error || !response.data?.skills?.length) {
    spinner.fail("Skill not found");
    console.log(chalk3.red(response.error?.error || `Skill "${skillSlug}" not found`));
    process.exit(1);
  }
  const skill = response.data.skills[0];
  spinner.succeed("Skill found");
  console.log();
  console.log(chalk3.blue.bold(skill.name));
  console.log(chalk3.gray("\u2500".repeat(50)));
  console.log();
  console.log(chalk3.cyan("Slug:"), skill.slug);
  console.log(chalk3.cyan("ID:"), skill.id);
  console.log(chalk3.cyan("Category:"), skill.category.replace("_", " "));
  console.log(chalk3.cyan("Visibility:"), skill.visibility);
  if (skill.tags.length > 0) {
    console.log(chalk3.cyan("Tags:"), skill.tags.join(", "));
  }
  if (skill.author) {
    console.log(chalk3.cyan("Author:"), skill.author.name || skill.author.email);
  }
  if (skill.team) {
    console.log(chalk3.cyan("Team:"), skill.team.name);
  }
  if (skill.stats) {
    console.log(chalk3.cyan("Downloads:"), skill.stats.downloadsCount);
    console.log(chalk3.cyan("Views:"), skill.stats.viewsCount);
  }
  if (skill.versions?.length) {
    const latestVersion = skill.versions[0];
    console.log(chalk3.cyan("Latest Version:"), latestVersion.version);
    console.log(chalk3.cyan("Status:"), latestVersion.status);
  }
  if (skill.description) {
    console.log();
    console.log(chalk3.cyan("Description:"));
    console.log(chalk3.white(skill.description));
  }
  console.log();
}

// src/commands/list.ts
import chalk4 from "chalk";
import Table2 from "cli-table3";

// src/config/manager.ts
import Conf2 from "conf";
var installedConfig = new Conf2({
  projectName: "skillhub",
  configName: "installed",
  defaults: {
    version: "1.0",
    skills: []
  }
});
function getInstalledSkills() {
  return installedConfig.get("skills") || [];
}
function addInstalledSkill(skill) {
  const skills = getInstalledSkills();
  const existingIndex = skills.findIndex((s) => s.slug === skill.slug);
  if (existingIndex >= 0) {
    skills[existingIndex] = skill;
  } else {
    skills.push(skill);
  }
  installedConfig.set("skills", skills);
}
function removeInstalledSkill(slug) {
  const skills = getInstalledSkills();
  const index = skills.findIndex((s) => s.slug === slug);
  if (index >= 0) {
    skills.splice(index, 1);
    installedConfig.set("skills", skills);
    return true;
  }
  return false;
}
function getInstalledSkill(slug) {
  const skills = getInstalledSkills();
  return skills.find((s) => s.slug === slug);
}

// src/agents/types.ts
var AGENT_REGISTRY = /* @__PURE__ */ new Map();
function registerAgent(agent) {
  AGENT_REGISTRY.set(agent.id, agent);
}
function getAgent(id) {
  return AGENT_REGISTRY.get(id);
}
function getAllAgents() {
  return Array.from(AGENT_REGISTRY.values());
}

// src/agents/claude-code.ts
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
var configPaths = [
  { type: "project", path: ".claude", filename: "CLAUDE.md" },
  { type: "global", path: ".claude", filename: "CLAUDE.md" }
];
function getConfigPath(options) {
  if (options.global) {
    return path.join(os.homedir(), ".claude", "CLAUDE.md");
  }
  const projectRoot = options.projectRoot || process.cwd();
  return path.join(projectRoot, ".claude", "CLAUDE.md");
}
function getStartMarker(slug) {
  return `<!-- SKILLHUB:START:${slug} -->`;
}
function getEndMarker(slug) {
  return `<!-- SKILLHUB:END:${slug} -->`;
}
var claudeCodeAgent = {
  name: "Claude Code",
  id: "claude-code",
  configPaths,
  format: "markdown",
  async install(skill, options) {
    const configPath = getConfigPath(options);
    await fs.ensureDir(path.dirname(configPath));
    let content = "";
    if (await fs.pathExists(configPath)) {
      content = await fs.readFile(configPath, "utf-8");
    }
    const startMarker = getStartMarker(skill.slug);
    const endMarker = getEndMarker(skill.slug);
    const skillSection = `

${startMarker}
# Skill: ${skill.name}

> Installed from SkillHub marketplace

${endMarker}`;
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    content = content.replace(regex, "");
    await fs.writeFile(configPath, content + skillSection);
    return configPath;
  },
  async uninstall(skillSlug, options) {
    const configPath = getConfigPath(options);
    if (!await fs.pathExists(configPath)) {
      return false;
    }
    const content = await fs.readFile(configPath, "utf-8");
    const startMarker = getStartMarker(skillSlug);
    const endMarker = getEndMarker(skillSlug);
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    const newContent = content.replace(regex, "");
    if (newContent !== content) {
      await fs.writeFile(configPath, newContent);
      return true;
    }
    return false;
  },
  async isInstalled(skillSlug, options) {
    const configPath = getConfigPath(options);
    if (!await fs.pathExists(configPath)) {
      return false;
    }
    const content = await fs.readFile(configPath, "utf-8");
    const startMarker = getStartMarker(skillSlug);
    return content.includes(startMarker);
  }
};

// src/agents/cursor.ts
import * as fs2 from "fs-extra";
import * as path2 from "path";
import * as os2 from "os";
var configPaths2 = [
  { type: "project", path: ".cursor", filename: "rules" },
  { type: "global", path: ".cursor", filename: "rules" }
];
function getConfigPath2(options) {
  if (options.global) {
    return path2.join(os2.homedir(), ".cursor", "rules");
  }
  const projectRoot = options.projectRoot || process.cwd();
  return path2.join(projectRoot, ".cursor", "rules");
}
function getStartMarker2(slug) {
  return `<!-- SKILLHUB:START:${slug} -->`;
}
function getEndMarker2(slug) {
  return `<!-- SKILLHUB:END:${slug} -->`;
}
var cursorAgent = {
  name: "Cursor",
  id: "cursor",
  configPaths: configPaths2,
  format: "markdown",
  async install(skill, options) {
    const configPath = getConfigPath2(options);
    await fs2.ensureDir(path2.dirname(configPath));
    let content = "";
    if (await fs2.pathExists(configPath)) {
      content = await fs2.readFile(configPath, "utf-8");
    }
    const startMarker = getStartMarker2(skill.slug);
    const endMarker = getEndMarker2(skill.slug);
    const skillSection = `

${startMarker}
# Skill: ${skill.name}

> Installed from SkillHub marketplace

${endMarker}`;
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    content = content.replace(regex, "");
    await fs2.writeFile(configPath, content + skillSection);
    return configPath;
  },
  async uninstall(skillSlug, options) {
    const configPath = getConfigPath2(options);
    if (!await fs2.pathExists(configPath)) {
      return false;
    }
    const content = await fs2.readFile(configPath, "utf-8");
    const startMarker = getStartMarker2(skillSlug);
    const endMarker = getEndMarker2(skillSlug);
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    const newContent = content.replace(regex, "");
    if (newContent !== content) {
      await fs2.writeFile(configPath, newContent);
      return true;
    }
    return false;
  },
  async isInstalled(skillSlug, options) {
    const configPath = getConfigPath2(options);
    if (!await fs2.pathExists(configPath)) {
      return false;
    }
    const content = await fs2.readFile(configPath, "utf-8");
    const startMarker = getStartMarker2(skillSlug);
    return content.includes(startMarker);
  }
};

// src/agents/copilot.ts
import * as fs3 from "fs-extra";
import * as path3 from "path";
var configPaths3 = [
  { type: "project", path: ".github", filename: "copilot-instructions.md" }
];
function getConfigPath3(options) {
  const projectRoot = options.projectRoot || process.cwd();
  return path3.join(projectRoot, ".github", "copilot-instructions.md");
}
function getStartMarker3(slug) {
  return `<!-- SKILLHUB:START:${slug} -->`;
}
function getEndMarker3(slug) {
  return `<!-- SKILLHUB:END:${slug} -->`;
}
var copilotAgent = {
  name: "GitHub Copilot",
  id: "copilot",
  configPaths: configPaths3,
  format: "markdown",
  async install(skill, options) {
    const configPath = getConfigPath3(options);
    await fs3.ensureDir(path3.dirname(configPath));
    let content = "";
    if (await fs3.pathExists(configPath)) {
      content = await fs3.readFile(configPath, "utf-8");
    }
    const startMarker = getStartMarker3(skill.slug);
    const endMarker = getEndMarker3(skill.slug);
    const skillSection = `

${startMarker}
# Skill: ${skill.name}

> Installed from SkillHub marketplace

${endMarker}`;
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    content = content.replace(regex, "");
    await fs3.writeFile(configPath, content + skillSection);
    return configPath;
  },
  async uninstall(skillSlug, options) {
    const configPath = getConfigPath3(options);
    if (!await fs3.pathExists(configPath)) {
      return false;
    }
    const content = await fs3.readFile(configPath, "utf-8");
    const startMarker = getStartMarker3(skillSlug);
    const endMarker = getEndMarker3(skillSlug);
    const regex = new RegExp(
      `\\n*${startMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\\\s\\\\S]*?${endMarker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`,
      "g"
    );
    const newContent = content.replace(regex, "");
    if (newContent !== content) {
      await fs3.writeFile(configPath, newContent);
      return true;
    }
    return false;
  },
  async isInstalled(skillSlug, options) {
    const configPath = getConfigPath3(options);
    if (!await fs3.pathExists(configPath)) {
      return false;
    }
    const content = await fs3.readFile(configPath, "utf-8");
    const startMarker = getStartMarker3(skillSlug);
    return content.includes(startMarker);
  }
};

// src/agents/index.ts
registerAgent(claudeCodeAgent);
registerAgent(cursorAgent);
registerAgent(copilotAgent);

// src/commands/list.ts
async function list(options = {}) {
  const skills = getInstalledSkills();
  if (skills.length === 0) {
    console.log(chalk4.yellow("No skills installed."));
    console.log(chalk4.gray("Run `skillhub search <query>` to find skills to install."));
    return;
  }
  if (options.agent) {
    const agent = getAgent(options.agent);
    if (!agent) {
      console.log(chalk4.red(`Unknown agent: ${options.agent}`));
      console.log(chalk4.gray(`Available agents: ${getAllAgents().map((a) => a.id).join(", ")}`));
      process.exit(1);
    }
  }
  if (options.json) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }
  console.log(chalk4.blue(`
Installed Skills (${skills.length})
`));
  const table = new Table2({
    head: [chalk4.cyan("Name"), chalk4.cyan("Version"), chalk4.cyan("Agents"), chalk4.cyan("Installed")],
    colWidths: [25, 10, 30, 15],
    wordWrap: true
  });
  for (const skill of skills) {
    const agentsDisplay = skill.installedTo.join(", ") || "-";
    const installedDate = new Date(skill.installedAt).toLocaleDateString();
    table.push([skill.slug, skill.version, agentsDisplay, installedDate]);
  }
  console.log(table.toString());
  console.log();
}

// src/commands/add.ts
import chalk5 from "chalk";
import ora3 from "ora";
import { confirm as confirm2, checkbox } from "@inquirer/prompts";
async function downloadSkill(skillId, version) {
  const cfg = getConfig();
  let url = `${cfg.apiUrl}/api/skills/${skillId}/download?type=full`;
  if (version) {
    url += `&version=${version}`;
  }
  const buffer = await downloadFile(url);
  return { buffer, version: version || "latest" };
}
async function add(skillSlug, options = {}) {
  if (!isAuthenticated()) {
    console.log(chalk5.red("You must be logged in to install skills."));
    console.log(chalk5.gray("Run `skillhub login` first."));
    process.exit(1);
  }
  const spinner = ora3(`Finding skill "${skillSlug}"...`).start();
  const params = new URLSearchParams();
  params.set("search", skillSlug);
  params.set("limit", "1");
  const response = await apiRequest(`/api/skills?${params.toString()}`);
  if (response.error || !response.data?.skills?.length) {
    spinner.fail("Skill not found");
    console.log(chalk5.red(response.error?.error || `Skill "${skillSlug}" not found`));
    process.exit(1);
  }
  const skill = response.data.skills[0];
  spinner.succeed(`Found skill: ${skill.name}`);
  const existing = getInstalledSkill(skill.slug);
  if (existing) {
    console.log(chalk5.yellow(`Skill "${skill.slug}" is already installed.`));
    const shouldUpdate = await confirm2({
      message: "Do you want to reinstall/update it?",
      default: false
    });
    if (!shouldUpdate) {
      return;
    }
  }
  let targetAgents = options.agents || [];
  if (options.all) {
    targetAgents = getAllAgents().map((a) => a.id);
  } else if (targetAgents.length === 0) {
    const agentChoices = getAllAgents().map((agent) => ({
      name: `${agent.name} (${agent.id})`,
      value: agent.id,
      checked: agent.id === "claude-code"
    }));
    targetAgents = await checkbox({
      message: "Select agents to install to:",
      choices: agentChoices,
      required: true
    });
  }
  for (const agentId of targetAgents) {
    if (!getAgent(agentId)) {
      console.log(chalk5.red(`Unknown agent: ${agentId}`));
      console.log(chalk5.gray(`Available agents: ${getAllAgents().map((a) => a.id).join(", ")}`));
      process.exit(1);
    }
  }
  spinner.start("Downloading skill package...");
  const downloadResult = await downloadSkill(skill.id, options.version);
  spinner.succeed("Skill package downloaded");
  const installedPaths = {};
  const installOptions = { global: options.global };
  for (const agentId of targetAgents) {
    const agent = getAgent(agentId);
    if (!agent) continue;
    spinner.start(`Installing to ${agent.name}...`);
    const installedSkill = {
      name: skill.name,
      slug: skill.slug,
      version: skill.versions?.[0]?.version || downloadResult.version,
      skillId: skill.id,
      installedAt: (/* @__PURE__ */ new Date()).toISOString(),
      installedTo: [agentId],
      paths: {}
    };
    try {
      const configPath = await agent.install(installedSkill, installOptions);
      installedPaths[agentId] = configPath;
      spinner.succeed(`Installed to ${agent.name}`);
    } catch (err) {
      spinner.fail(`Failed to install to ${agent.name}`);
      console.log(chalk5.red(err instanceof Error ? err.message : "Unknown error"));
    }
  }
  const finalInstalledSkill = {
    name: skill.name,
    slug: skill.slug,
    version: skill.versions?.[0]?.version || downloadResult.version,
    skillId: skill.id,
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    installedTo: targetAgents,
    paths: installedPaths
  };
  addInstalledSkill(finalInstalledSkill);
  console.log();
  console.log(chalk5.green("Skill installed successfully!"));
  console.log();
  console.log(chalk5.gray("Installed to:"));
  for (const [agentId, configPath] of Object.entries(installedPaths)) {
    console.log(chalk5.gray(`  ${agentId}: ${configPath}`));
  }
}

// src/commands/remove.ts
import chalk6 from "chalk";
import ora4 from "ora";
import { confirm as confirm3, checkbox as checkbox2 } from "@inquirer/prompts";
async function remove(skillSlug, options = {}) {
  const installed = getInstalledSkill(skillSlug);
  if (!installed) {
    console.log(chalk6.yellow(`Skill "${skillSlug}" is not installed.`));
    return;
  }
  let targetAgents = options.agents || [];
  if (options.all) {
    targetAgents = installed.installedTo;
  } else if (targetAgents.length === 0) {
    targetAgents = installed.installedTo;
    if (targetAgents.length > 1) {
      const agentChoices = targetAgents.map((agentId) => {
        const agent = getAgent(agentId);
        return {
          name: `${agent?.name || agentId} (${agentId})`,
          value: agentId,
          checked: true
        };
      });
      targetAgents = await checkbox2({
        message: "Select agents to remove from:",
        choices: agentChoices
      });
    }
  }
  if (targetAgents.length === 0) {
    console.log(chalk6.yellow("No agents selected."));
    return;
  }
  const shouldConfirm = await confirm3({
    message: `Remove "${skillSlug}" from ${targetAgents.join(", ")}?`,
    default: true
  });
  if (!shouldConfirm) {
    console.log(chalk6.gray("Cancelled."));
    return;
  }
  const installOptions = { global: options.global };
  for (const agentId of targetAgents) {
    const agent = getAgent(agentId);
    if (!agent) {
      console.log(chalk6.yellow(`Unknown agent: ${agentId}`));
      continue;
    }
    const spinner = ora4(`Removing from ${agent.name}...`).start();
    try {
      const removed = await agent.uninstall(skillSlug, installOptions);
      if (removed) {
        spinner.succeed(`Removed from ${agent.name}`);
      } else {
        spinner.warn(`Not found in ${agent.name}`);
      }
    } catch (err) {
      spinner.fail(`Failed to remove from ${agent.name}`);
      console.log(chalk6.red(err instanceof Error ? err.message : "Unknown error"));
    }
  }
  const remainingAgents = installed.installedTo.filter((a) => !targetAgents.includes(a));
  if (remainingAgents.length === 0) {
    removeInstalledSkill(skillSlug);
    console.log();
    console.log(chalk6.green(`Skill "${skillSlug}" removed completely.`));
  } else {
    console.log();
    console.log(chalk6.green(`Skill "${skillSlug}" removed from selected agents.`));
    console.log(chalk6.gray(`Still installed to: ${remainingAgents.join(", ")}`));
  }
}

// src/index.ts
var program = new Command();
program.name("skillhub").description("CLI tool for SkillHub enterprise skill marketplace").version("1.0.0");
program.command("login").description("Authenticate with SkillHub marketplace").argument("[token]", "API token (optional, will prompt if not provided)").option("-u, --url <url>", "SkillHub API URL").action(async (token, options) => {
  await login(token, options.url);
});
program.command("logout").description("Remove stored authentication").action(async () => {
  await logout();
});
program.command("whoami").description("Show current authenticated user").action(async () => {
  await whoami();
});
program.command("search <query>").description("Search for skills in the marketplace").option("-l, --limit <number>", "Maximum number of results", "20").option("-c, --category <category>", "Filter by category").action(async (query, options) => {
  await search(query, {
    limit: parseInt(options.limit),
    category: options.category
  });
});
program.command("info <skill>").description("Get detailed information about a skill").action(async (skillSlug) => {
  await info(skillSlug);
});
program.command("list").alias("ls").description("List installed skills").option("-j, --json", "Output as JSON").option("-a, --agent <agent>", "Filter by agent").action(async (options) => {
  await list(options);
});
program.command("add <skill>").description("Install a skill to your agents").option("-a, --agents <agents>", "Target agents (comma-separated)").option("-g, --global", "Install globally to user directory").option("-v, --version <version>", "Specific version to install").option("--all", "Install to all available agents").action(async (skillSlug, options) => {
  const agents = options.agents ? options.agents.split(",") : void 0;
  await add(skillSlug, {
    agents,
    global: options.global,
    version: options.version,
    all: options.all
  });
});
program.command("remove [skill]").alias("rm").description("Remove an installed skill").option("-g, --global", "Remove from global scope").option("-a, --agents <agents>", "Remove from specific agents (comma-separated)").option("--all", "Remove from all agents").action(async (skillSlug, options) => {
  if (!skillSlug) {
    console.log(chalk7.yellow("Please specify a skill to remove."));
    console.log(chalk7.gray("Usage: skillhub remove <skill-name>"));
    return;
  }
  const agents = options.agents ? options.agents.split(",") : void 0;
  await remove(skillSlug, {
    global: options.global,
    agents,
    all: options.all
  });
});
program.hook("preAction", async (_thisCommand, actionCommand) => {
  const commandsRequiringAuth = ["add", "remove", "upload"];
  const commandName = actionCommand.name();
  if (commandsRequiringAuth.includes(commandName) && !isAuthenticated()) {
    console.log(chalk7.red("You must be logged in to use this command."));
    console.log(chalk7.gray("Run `skillhub login` first."));
    process.exit(1);
  }
});
program.parse();
//# sourceMappingURL=index.js.map