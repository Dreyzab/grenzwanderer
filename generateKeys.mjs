import { generateKeyPair } from "node:crypto";
import { promisify } from "node:util";

const generateKeyPairAsync = promisify(generateKeyPair);

const { privateKey, publicKey } = await generateKeyPairAsync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem"
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem"
  }
});

process.stdout.write(`JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"\n`);
process.stdout.write(`JWKS=${JSON.stringify({ keys: [{ use: "sig", key: publicKey }] })}\n`); 