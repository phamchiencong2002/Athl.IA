import "dotenv/config";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import express, { type NextFunction, type Request, type Response } from "express";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const scryptAsync = promisify(crypto.scrypt);
const TOKEN_SECRET = process.env.TOKEN_SECRET || "athlia-dev-secret";
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

type UserProfileRecord = {
  id: string;
  id_account: string;
  gender: string | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  training_experience: string | null;
  sport: string | null;
  main_goal: string | null;
  week_availability: number | null;
  equipment: string | null;
  health: string | null;
  sleep: string | null;
  stress: string | null;
  load: string | null;
  recovery: string | null;
};

type TokenPayload = {
  sub: string;
  type: "access" | "refresh";
  exp: number;
};

type AuthenticatedRequest = Request & {
  auth?: {
    accountId: string;
  };
};

const toBase64Url = (value: string): string =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string): string => {
  const withPadding = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (withPadding.length % 4)) % 4);
  return Buffer.from(withPadding + padding, "base64").toString("utf8");
};

const signPart = (part: string): string =>
  crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(part)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");

const createToken = (sub: string, type: TokenPayload["type"], ttlSeconds: number): string => {
  const payload: TokenPayload = {
    sub,
    type,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const part = toBase64Url(JSON.stringify(payload));
  return `${part}.${signPart(part)}`;
};

const parseToken = (token: string): TokenPayload | null => {
  const [part, signature] = token.split(".");
  if (!part || !signature) return null;

  const expected = signPart(part);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(part)) as TokenPayload;
    if (!payload.sub || !payload.type || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.type !== "access" && payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
};

const createTokenPair = (accountId: string): { token: string; refreshToken: string } => ({
  token: createToken(accountId, "access", ACCESS_TTL_SECONDS),
  refreshToken: createToken(accountId, "refresh", REFRESH_TTL_SECONDS),
});

const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [algo, saltB64, hashB64] = storedHash.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
};

const serializeAccount = (account: {
  id: string;
  username: string;
  mail: string;
  avatar: string | null;
  statut_account: string | null;
  last_connection: Date | null;
}) => ({
  id: account.id,
  username: account.username,
  mail: account.mail,
  avatar: account.avatar,
  statut_account: account.statut_account,
  last_connection: account.last_connection ? account.last_connection.toISOString() : null,
});

const serializeProfile = (profile: {
  id: string;
  id_account: string;
  gender: string | null;
  birthdate: Date | null;
  height_cm: number | null;
  weight_kg: { toString(): string } | null;
  training_experience: string | null;
  sport: string | null;
  main_goal: string | null;
  week_availability: number | null;
  equipment: string | null;
  health: string | null;
  sleep: string | null;
  stress: string | null;
  load: string | null;
  recovery: string | null;
}): UserProfileRecord => ({
  id: profile.id,
  id_account: profile.id_account,
  gender: profile.gender,
  birthdate: profile.birthdate ? profile.birthdate.toISOString() : null,
  height_cm: profile.height_cm,
  weight_kg: profile.weight_kg ? Number(profile.weight_kg.toString()) : null,
  training_experience: profile.training_experience,
  sport: profile.sport,
  main_goal: profile.main_goal,
  week_availability: profile.week_availability,
  equipment: profile.equipment,
  health: profile.health,
  sleep: profile.sleep,
  stress: profile.stress,
  load: profile.load,
  recovery: profile.recovery,
});

const requireAccessToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const payload = parseToken(authHeader.slice("Bearer ".length));
  if (!payload || payload.type !== "access") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.auth = { accountId: payload.sub };
  next();
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "athlia-api",
    ok: true,
    endpoints: ["/health", "/auth/register", "/auth/login", "/auth/refresh", "/users"],
  });
});

app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { username, mail, password } = req.body as {
      username?: string;
      mail?: string;
      password?: string;
    };

    if (!username?.trim() || !mail?.trim() || !password) {
      res.status(400).json({ error: "username, mail and password are required" });
      return;
    }

    const normalizedMail = mail.trim().toLowerCase();
    const existingAccount = await prisma.account.findFirst({ where: { mail: normalizedMail } });

    if (existingAccount) {
      if (!(await verifyPassword(password, existingAccount.password))) {
        res.status(409).json({ error: "Account already exists" });
        return;
      }

      const updatedAccount = await prisma.account.update({
        where: { id: existingAccount.id },
        data: { last_connection: new Date() },
      });

      res.json({
        ...createTokenPair(updatedAccount.id),
        account: serializeAccount(updatedAccount),
      });
      return;
    }

    const now = new Date();
    const account = await prisma.account.create({
      data: {
        username: username.trim(),
        mail: normalizedMail,
        password: await hashPassword(password),
        avatar: null,
        statut_account: "active",
        last_connection: now,
        created_at: now,
      },
    });

    res.status(201).json({
      ...createTokenPair(account.id),
      account: serializeAccount(account),
    });
  } catch (error) {
    console.error("Register error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { mail, password } = req.body as { mail?: string; password?: string };
    if (!mail?.trim() || !password) {
      res.status(400).json({ error: "mail and password are required" });
      return;
    }

    const normalizedMail = mail.trim().toLowerCase();
    const account = await prisma.account.findFirst({ where: { mail: normalizedMail } });
    if (!account || !(await verifyPassword(password, account.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: { last_connection: new Date() },
    });

    res.json({
      ...createTokenPair(updatedAccount.id),
      account: serializeAccount(updatedAccount),
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  const payload = parseToken(refreshToken);
  if (!payload || payload.type !== "refresh") {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const account = await prisma.account.findUnique({
    where: { id: payload.sub },
    select: { id: true },
  });

  if (!account) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  res.json(createTokenPair(payload.sub));
});

app.post("/users", requireAccessToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.auth?.accountId;
    if (!accountId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      id_account,
      gender,
      birthdate,
      height_cm,
      weight_kg,
      training_experience,
      sport,
      main_goal,
      week_availability,
      equipment,
      health,
      sleep,
      stress,
      load,
      recovery,
    } = req.body as {
      id_account?: string;
      gender?: string | null;
      birthdate?: string;
      height_cm?: number | null;
      weight_kg?: number | null;
      training_experience?: string | null;
      sport?: string | null;
      main_goal?: string | null;
      week_availability?: number | null;
      equipment?: string | null;
      health?: string | null;
      sleep?: string | null;
      stress?: string | null;
      load?: string | null;
      recovery?: string | null;
    };

    if (!id_account) {
      res.status(400).json({ error: "id_account is required" });
      return;
    }
    if (id_account !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsedBirthdate = birthdate ? new Date(birthdate) : null;
    if (birthdate && Number.isNaN(parsedBirthdate?.getTime())) {
      res.status(400).json({ error: "birthdate is invalid" });
      return;
    }

    const existingProfile = await prisma.users.findFirst({
      where: { id_account },
      select: { id: true },
    });

    const profile = existingProfile
      ? await prisma.users.update({
          where: { id: existingProfile.id },
          data: {
            gender: gender ?? null,
            birthdate: parsedBirthdate,
            height_cm: height_cm ?? null,
            weight_kg: weight_kg ?? null,
            training_experience: training_experience ?? null,
            sport: sport ?? null,
            main_goal: main_goal ?? null,
            week_availability: week_availability ?? null,
            equipment: equipment ?? null,
            health: health ?? null,
            sleep: sleep ?? null,
            stress: stress ?? null,
            load: load ?? null,
            recovery: recovery ?? null,
          },
        })
      : await prisma.users.create({
          data: {
            id_account,
            gender: gender ?? null,
            birthdate: parsedBirthdate,
            height_cm: height_cm ?? null,
            weight_kg: weight_kg ?? null,
            training_experience: training_experience ?? null,
            sport: sport ?? null,
            main_goal: main_goal ?? null,
            week_availability: week_availability ?? null,
            equipment: equipment ?? null,
            health: health ?? null,
            sleep: sleep ?? null,
            stress: stress ?? null,
            load: load ?? null,
            recovery: recovery ?? null,
          },
        });

    res.status(existingProfile ? 200 : 201).json(serializeProfile(profile));
  } catch (error) {
    console.error("Users profile error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
