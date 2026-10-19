import whatsappWeb, { WAState } from "whatsapp-web.js";

const { Client, LocalAuth } = whatsappWeb;
import qrcode from "qrcode-terminal";

const client = new Client({ authStrategy: new LocalAuth() });

export function initWhatsapp() {
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("QR RECEIVED", qr);
  });

  client.initialize();
}

export function getQR() {
  return new Promise((resolve) => {
    client.on("qr", (qr) => {
      resolve(qr);
    });
  });
}

export async function getQRConnect() {
  const state = await client.getState();

  if (state === WAState.CONNECTED) {
    return { connected: true };
  }

  const qr = await getQR();
  return { connected: false, qr };
}
