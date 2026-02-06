import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttpModule from "pino-http";
const pinoHttp = (pinoHttpModule as any).default ?? (pinoHttpModule as any);
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const PORT = Number(process.env.PORT ?? 3002);
const L2_RPC_URL = process.env.L2_RPC_URL!;
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY!;
const AMOUNT_ETH = process.env.AMOUNT_ETH ?? "0.1";

const IP_WINDOW_MS = Number(process.env.IP_WINDOW_MS ?? 10 * 60_000);
const IP_MAX_REQ = Number(process.env.IP_MAX_REQ ?? 5);
const ADDR_COOLDOWN_MS = Number(process.env.ADDR_COOLDOWN_MS ?? 30 * 60_000);

const LOG_DIR = process.env.LOG_DIR ?? "/var/log/faucet";
const TRUST_PROXY = String(process.env.TRUST_PROXY ?? "false").toLowerCase() === "true";

if (!L2_RPC_URL || !FAUCET_PRIVATE_KEY) {
  throw new Error("Missing L2_RPC_URL or FAUCET_PRIVATE_KEY in env");
}

const provider = new ethers.JsonRpcProvider(L2_RPC_URL);
const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

// MVP: In-memory cooldown map (will reset on service restart). Replace with Redis/Postgres later.
const lastPayoutByAddress = new Map<string, number>();

function nowMs() {
  return Date.now();
}

function normalizeAddr(addr: string) {
  return ethers.getAddress(addr);
}

fs.mkdirSync(LOG_DIR, { recursive: true });
const payoutsLogPath = path.join(LOG_DIR, "payouts.log");

const app = express();

// If running behind a reverse proxy, enable trust proxy so rate limiting uses real client IP.
if (TRUST_PROXY) app.set("trust proxy", 1);

app.use(express.json({ limit: "64kb" }));
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req: Request, res: Response, err: unknown) => {
      const statusCode = (res as any).statusCode as number | undefined;
      return err || (statusCode ?? 0) >= 500 ? "error" : "info";
    },
  })
);

// IP-based rate limiting
app.use(
  rateLimit({
    windowMs: IP_WINDOW_MS,
    limit: IP_MAX_REQ,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", async (_req, res) => {
  try {
    const [bn, bal] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBalance(wallet.address),
    ]);

    res.json({
      ok: true,
      l2BlockNumber: bn,
      faucetAddress: wallet.address,
      faucetBalanceEth: ethers.formatEther(bal),
      amountEth: AMOUNT_ETH,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.post("/faucet", async (req, res) => {
  const addressRaw = String(req.body?.address ?? "");
  let to: string;

  try {
    to = normalizeAddr(addressRaw);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid address" });
  }

  // Address cooldown to prevent repeated payouts to the same address
  const last = lastPayoutByAddress.get(to) ?? 0;
  const since = nowMs() - last;

  if (since < ADDR_COOLDOWN_MS) {
    return res.status(429).json({
      ok: false,
      error: "Address cooldown",
      retryAfterMs: ADDR_COOLDOWN_MS - since,
    });
  }

  try {
    const value = ethers.parseEther(AMOUNT_ETH);

    const bal = await provider.getBalance(wallet.address);
    if (bal < value) {
      return res.status(503).json({ ok: false, error: "Faucet out of funds" });
    }

    const tx = await wallet.sendTransaction({ to, value });
    lastPayoutByAddress.set(to, nowMs());

    // Append payout record to a log file
    fs.appendFileSync(
      payoutsLogPath,
      JSON.stringify({
        ts: new Date().toISOString(),
        to,
        amountEth: AMOUNT_ETH,
        txHash: tx.hash,
      }) + "\n"
    );

    // Wait for 1 confirmation for better UX
    const receipt = await tx.wait(1);

    return res.json({
      ok: true,
      to,
      amountEth: AMOUNT_ETH,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (e: any) {
    req.log.error({ err: e }, "faucet_error");
    return res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT, rpc: L2_RPC_URL, faucet: wallet.address }, "faucet_started");
});
