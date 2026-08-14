import "server-only";
import http2 from "node:http2";
import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "@/lib/prisma";

const APNS_HOST = process.env.APNS_ENVIRONMENT === "production" ? "api.push.apple.com" : "api.sandbox.push.apple.com";

const configured = () => !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY);

// APNs provider tokens are meant to be reused for up to an hour, not
// minted per-request — Apple rate-limits repeated JWT generation for the
// same key.
let cachedToken: { token: string; issuedAt: number } | null = null;

async function getProviderToken() {
  if (cachedToken && Date.now() - cachedToken.issuedAt < 50 * 60 * 1000) return cachedToken.token;

  const pem = process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APNS_KEY_ID! })
    .setIssuedAt()
    .setIssuer(process.env.APNS_TEAM_ID!)
    .sign(key);

  cachedToken = { token, issuedAt: Date.now() };
  return token;
}

function postToApns(deviceToken: string, jwt: string, body: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${APNS_HOST}`);
    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": process.env.APNS_BUNDLE_ID ?? "net.livingword.community",
      "apns-push-type": "alert",
      "content-type": "application/json",
    });

    let status = 0;
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("end", () => {
      client.close();
      resolve(status);
    });
    req.on("error", (err) => {
      client.close();
      reject(err);
    });
    req.setEncoding("utf8");
    req.write(body);
    req.end();
  });
}

// Pushes to a single iOS device registered for the dormant Capacitor
// project. Silently no-ops (logging to the console) until
// APNS_KEY_ID/APNS_TEAM_ID/APNS_PRIVATE_KEY are set — same
// graceful-degradation pattern as the Resend email sender.
export async function sendApnsPush(device: { id: string; deviceToken: string }, payload: { title: string; body?: string; deepLink?: string }) {
  if (!configured()) {
    console.log(`\n📱 [dev push] device=${device.deviceToken.slice(0, 12)}… title="${payload.title}"\n`);
    return;
  }

  const jwt = await getProviderToken();
  const body = JSON.stringify({
    aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
    deepLink: payload.deepLink,
  });

  try {
    const status = await postToApns(device.deviceToken, jwt, body);
    // 410 Gone (or 400 BadDeviceToken) — Apple is telling us this token
    // is dead, so stop trying to push to it.
    if (status === 410 || status === 400) {
      await prisma.pushDevice.delete({ where: { id: device.id } }).catch(() => {});
    }
  } catch (err) {
    console.error("[apns] push failed", err);
  }
}
