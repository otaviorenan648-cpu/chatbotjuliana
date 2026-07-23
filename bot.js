const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// ========== CONFIG DA JULIANA OLIVEIRA - 48 99829-0105 ==========
const NUMERO = '48998290105';
const NOME = 'Juliana Oliveira';
const LINKS = {
  T1_D150: 'https://ton.com.br/checkout/cart/?productId=TONMEGA_TIER_D150&referrer=8F39C28B-C5E4-415C-94D4-8F505EC72DDB&userAnticipation=0&userTag=tonmega_tier&utm_medium=invite_share&utm_source=revendedor',
  T2_D195: 'https://ton.com.br/checkout/cart/?productId=TONMEGA_TIER_D195&referrer=8F39C28B-C5E4-415C-94D4-8F505EC72DDB&userAnticipation=0&userTag=tonmega_tier&utm_medium=invite_share&utm_source=revendedor',
  T3_SMART: 'https://ton.com.br/checkout/cart/?productId=TONMEGA_TIER_SMART_POS&referrer=8F39C28B-C5E4-415C-94D4-8F505EC72DDB&userAnticipation=0&userTag=tonmega_tier&utm_medium=invite_share&utm_source=revendedor',
  T3_S920: 'https://ton.com.br/checkout/cart/?productId=TONMEGA_TIER_S920&referrer=8F39C28B-C5E4-415C-94D4-8F505EC72DDB&userAnticipation=0&userTag=tonmega_tier&utm_medium=invite_share&utm_source=revendedor'
};
// =======================================

let sock;
let qrAtual = null;
let statusBot = 'INICIANDO';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`Baileys version: ${version.join('.')}`);
  console.log(`TON BOT ${NUMERO} - ${NOME} iniciando...`);

  sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['Ton Bot Juliana', 'Chrome', '1.0.0'],
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrAtual = qr;
      statusBot = 'QR_GERADO';
      console.log('QR CODE GERADO - Acesse /qr para escanear');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Desconectado: ${lastDisconnect?.error?.message}`);
      statusBot = 'DESCONECTADO';
      qrAtual = null;
      if (shouldReconnect) {
        console.log('Reconectando em 3s...');
        setTimeout(startBot, 3000);
      }
    } else if (connection === 'open') {
      console.log(`✅ BOT ${NOME} CONECTADO COM SUCESSO! ${NUMERO}`);
      statusBot = 'CONECTADO';
      qrAtual = null;
    }
  });

  // FUNIL DE VENDAS TON - JULIANA
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const from = msg.key.remoteJid;
      if (from.includes('@g.us')) continue;

      const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const lower = texto.toLowerCase().trim();
      
      console.log(`Mensagem de ${from}: ${texto}`);

      let resposta = '';

      if (['oi', 'ola', 'olá', 'oie', 'bom dia', 'boa tarde', 'boa noite', 'inicio', 'início', 'menu'].some(p => lower.includes(p)) || lower.length < 3) {
        resposta = `Oi! Aqui é a *${NOME}* da Ton! 💚\n\nQue bom que me chamou! Vou te ajudar a escolher sua maquininha 👇\n\n🟢 *T1 - D150* - Mais barata e compacta\n🔵 *T2 - D195* - Com chip e Wi-Fi\n🟣 *T3 Smart* - Com tela e sistema completo\n⚫ *T3 S920* - A mais completa, com bobina\n\nMe fala qual te interessa:\nDigite *T1*, *T2*, *SMART* ou *S920*`;
      } else if (lower.includes('t1') || lower.includes('d150')) {
        resposta = `A *T1 D150* é a queridinha pra começar! 🚀\n\n✔️ Taxa a partir de 0,74% no débito\n✔️ Sem aluguel\n✔️ Super compacta\n\n👉 Garanta a sua aqui: ${LINKS.T1_D150}\n\nÉ só clicar e finalizar, já vai direto com meu desconto! 💚`;
      } else if (lower.includes('t2') || lower.includes('d195') || lower.includes('195')) {
        resposta = `A *T2 D195* é a mais vendida! 🔥\n\n✔️ Chip + Wi-Fi\n✔️ Bateria de longa duração\n✔️ Taxa incrível\n\n👉 Link com desconto: ${LINKS.T2_D195}\n\nMe avisa quando garantir a sua!`;
      } else if (lower.includes('smart')) {
        resposta = `A *T3 Smart POS* é TOP! 💜\n\n✔️ Tela touch\n✔️ Sistema Android\n✔️ Aceita tudo + Pix na tela\n\n👉 Link: ${LINKS.T3_SMART}\n\nEssa vende muito!`;
      } else if (lower.includes('s920') || lower.includes('920')) {
        resposta = `A *T3 S920* é a mais completa da Ton! ⚫🚀\n\n✔️ Imprime comprovante\n✔️ Bateria gigante\n✔️ Pra quem vende MUITO\n\n👉 Link exclusivo: ${LINKS.T3_S920}\n\nVai amar!`;
      } else if (lower.includes('t3')) {
        resposta = `Temos 2 modelos T3! Qual você quer ver?\n\n🟣 *SMART* - Moderna com tela\n⚫ *S920* - Completa com bobina\n\nDigita *SMART* ou *S920* que te mando o link!`;
      } else if (lower.includes('taxa') || lower.includes('preço') || lower.includes('valor') || lower.includes('quanto')) {
        resposta = `Nossas taxas são as menores do Brasil! 💚\n\n🟢 T1 D150: a partir de 0,74%\n🔵 T2 D195: intermediária\n🟣 T3 Smart e S920: taxas especiais\n\nTodas *SEM ALUGUEL*!\n\nQual modelo te interessa? *T1*, *T2*, *SMART* ou *S920*?`;
      } else {
        resposta = `Entendi! 😊\n\nPra te ajudar mais rápido:\n\nDigite:\n*T1* - pra D150\n*T2* - pra D195\n*SMART* - pra T3 Smart\n*S920* - pra T3 S920\n\nOu manda um áudio que eu te explico! 💚 - ${NOME}`;
      }

      if (resposta) {
        await sock.sendMessage(from, { text: resposta });
      }
    }
  });
}

// Servidor Web para QR
app.get('/', (req, res) => {
  res.send(`
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bot ${NOME}</title></head>
    <body style="font-family:Arial;text-align:center;padding:40px;background:#f5f5f5">
      <h1>Bot ${NOME}</h1>
      <h2>${NUMERO}</h2>
      <h2 style="color:${statusBot === 'CONECTADO' ? 'green' : 'orange'}">Status: ${statusBot}</h2>
      <p><a href="/qr" style="background:#25D366;color:white;padding:15px 30px;border-radius:10px;text-decoration:none;font-size:18px">VER QR CODE</a></p>
      <p>Links: D150 ✅ | D195 ✅ | Smart ✅ | S920 ✅</p>
    </body></html>
  `);
});

app.get('/qr', async (req, res) => {
  if (statusBot === 'CONECTADO') {
    return res.send(`<h1 style="text-align:center;color:green;margin-top:100px">✅ BOT ${NOME} CONECTADO!<br>${NUMERO}</h1><p style="text-align:center"><a href="/">Voltar</a></p>`);
  }
  if (!qrAtual) {
    return res.send(`<html><head><meta http-equiv="refresh" content="2"></head><body style="text-align:center;padding:50px"><h2>Aguardando QR...</h2><p>Status: ${statusBot}</p><p>Recarregando...</p></body></html>`);
  }
  try {
    const qrImage = await QRCode.toDataURL(qrAtual, { width: 400 });
    res.send(`
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>QR - ${NOME}</title></head>
      <body style="text-align:center;padding:20px;background:white">
        <h2>Escaneie com WhatsApp ${NUMERO}</h2>
        <p>${NOME}</p>
        <img src="${qrImage}" style="width:350px;max-width:90vw;border:10px solid #eee;border-radius:20px"/>
        <p>WhatsApp > Aparelhos Conectados > Conectar aparelho</p>
        <p style="color:#666;font-size:12px">QR expira em 30s, recarregue a página se precisar</p>
        <script>setTimeout(()=>location.reload(), 30000)</script>
      </body></html>
    `);
  } catch (e) {
    res.status(500).send('Erro ao gerar QR');
  }
});

app.listen(PORT, () => {
  console.log(`Web server rodando na porta ${PORT}`);
  startBot();
});
