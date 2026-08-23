import { createPublicKey, verify } from "node:crypto";
import { Readable } from "node:stream";
import { posix } from "node:path";
import express, { Router } from "express";
import AdmZip from "adm-zip";
import { Client } from "basic-ftp";

const router = Router();
const deployPublicKey = createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAE0LIk4IZ95uZgAdgM4sV9u1RLl5Kk22zE4bJg7uedfw=
-----END PUBLIC KEY-----`);
let deploymentInProgress = false;
let deploymentComplete = false;

function validateEntries(entries) {
  if (!entries.length || entries.length > 100) throw new Error("Invalid archive entry count.");
  let totalBytes = 0;
  for (const entry of entries) {
    const name = entry.entryName;
    if (entry.isDirectory || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..")) {
      throw new Error("Invalid archive path.");
    }
    totalBytes += entry.header.size;
  }
  if (totalBytes > 20 * 1024 * 1024) throw new Error("Archive is too large.");
}

router.post("/ftp-deploy", express.raw({ type: "application/octet-stream", limit: "5mb" }), async (req, res) => {
  const signature = req.get("x-deploy-signature");
  const validSignature = Buffer.isBuffer(req.body) && signature && verify(
    null,
    req.body,
    deployPublicKey,
    Buffer.from(signature, "base64")
  );
  if (!validSignature) return res.status(404).json({ success: false });
  if (deploymentComplete) return res.status(409).json({ success: false, error: "Deployment already completed." });
  if (deploymentInProgress) return res.status(409).json({ success: false, error: "Deployment is already running." });

  deploymentInProgress = true;
  const client = new Client(60_000);
  try {
    const payload = JSON.parse(req.body.toString("utf8"));
    if (payload.host !== "rs3-mbi.serverhostgroup.com" || payload.port !== 21 || payload.remoteDir !== "/") {
      throw new Error("Deployment target rejected.");
    }
    if (typeof payload.username !== "string" || typeof payload.password !== "string") {
      throw new Error("Credentials are missing.");
    }

    const archive = new AdmZip(Buffer.from(payload.archiveBase64, "base64"));
    const entries = archive.getEntries();
    validateEntries(entries);
    entries.sort((left, right) => {
      const priority = (entry) => entry.entryName === ".htaccess" ? 2 : entry.entryName === "index.html" ? 1 : 0;
      return priority(left) - priority(right) || left.entryName.localeCompare(right.entryName);
    });

    await client.access({
      host: payload.host,
      port: payload.port,
      user: payload.username,
      password: payload.password,
      secure: true,
      secureOptions: { servername: payload.host, rejectUnauthorized: true }
    });

    for (const entry of entries) {
      const remotePath = posix.join(payload.remoteDir, entry.entryName);
      await client.ensureDir(posix.dirname(remotePath));
      await client.uploadFrom(Readable.from(entry.getData()), posix.basename(remotePath));
    }

    deploymentComplete = true;
    return res.json({ success: true, files: entries.length });
  } catch (error) {
    console.error("Temporary FTP deployment failed:", error?.message || error);
    return res.status(500).json({ success: false, error: "Deployment failed." });
  } finally {
    deploymentInProgress = false;
    client.close();
  }
});

export const internalDeployRouter = router;
