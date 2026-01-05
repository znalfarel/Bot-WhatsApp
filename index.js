const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// ... import yang sudah ada ...
const { google } = require('googleapis');

// KONFIGURASI SPREADSHEET
const SPREADSHEET_ID = '1CHjfoN3ifeV2J2WKvKq28Bys_UMxSwNPgzqExOY5lU4'; 
const SHEET_NAME = 'Sheet1'; // Pastikan nama Tab di bawah (Sheet1/Sheet2) sesuai

// Autentikasi Google
const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json', // Pastikan file ini ada di folder project
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// =============================================================
// 👑 KONFIGURASI OWNER
// =============================================================
const OWNERS = [
    '70175504240657', // ID ANDA
    '6285792080974',
    '62895622617060',
    '70000081653824',
    '23497833205847',
    '252703141830858'
];

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR Code ini!');
});

client.on('ready', () => {
    console.log('Bot Siap Digunakan!');
});

// ==========================================
// 1. FITUR SAMBUTAN / WELCOME
// ==========================================
client.on('group_join', async (notification) => {
    try {
        const groupChat = await notification.getChat();
        const participantId = notification.recipientIds[0];
        const userNumber = participantId.split('@')[0];

        let text = `👋 *Welcome to ${groupChat.name}* \n\n`;
        text += `Halo @${userNumber} selamat datang! ✨\n`;
        text += `Jangan lupa baca deskripsi grup ya.\n\n`;
        text += `_Semoga betah!_ 🚀`;

        await groupChat.sendMessage(text, { mentions: [participantId] });
        console.log(`[LOG] Member baru: ${userNumber} bergabung di ${groupChat.name}`);

    } catch (err) {
        console.error("Gagal kirim sambutan:", err);
    }
});

// ==========================================
// 2. FITUR PESAN (LOGIC UTAMA)
// ==========================================
client.on('message_create', async msg => {
    try {
        const chat = await msg.getChat();
        const isiPesan = msg.body.toLowerCase().trim();
        
        const rawId = msg.author || msg.from;
        const pengirimAngka = rawId.replace(/\D/g, ''); 
        const cleanOwners = OWNERS.map(id => id.toString().replace(/\D/g, ''));

        let isAdmin = false;
        if (msg.fromMe) isAdmin = true;
        else if (cleanOwners.some(ownerId => pengirimAngka.includes(ownerId))) isAdmin = true;
        else if (chat.isGroup) {
            for (let participant of chat.participants) {
                let partId = participant.id.user;
                if (partId === pengirimAngka && (participant.isAdmin || participant.isSuperAdmin)) {
                    isAdmin = true;
                    break;
                }
            }
        }

        // ==================================================================
        // ⚠️ URUTAN KODINGAN PENTING (Agar tidak double reply)
        // Perintah SPESIFIK ditaruh paling atas.
        // ==================================================================

        // 1. --- FORMAT LOGIN NETFLIX (.nformat) ---
        // Kita taruh ini DULUAN sebelum cek kata 'netflix'
        if (['.format', '.nlogin', '.form', '.nformat', '.n'].includes(isiPesan)) {
            let text = `📋 *FORMAT LOGIN NETFLIX*\n\n`;

            text += `*Format {Resell}*\n`;
            text += `▫️ Username Buyer :\n▫️ Tipe Device : (iOS/Android)\n▫️ Merk Device :\n▫️ Lokasi :\n▫️ Tanggal :\n▫️ Berapa U :\n▫️ Durasi :\n▫️ Email Buyer :\n\n`;

            text += `*Format {Personal Unit / PU}*\n`;
            text += `▫️ Username :\n▫️ Tipe Device : (iOS/Android)\n▫️ Merk Device :\n▫️ Lokasi :\n▫️ Tanggal :\n▫️ Berapa U :\n▫️ Durasi :\n▫️ No WA Buyer :\n▫️ SS Email & No WA :\n▫️ Email Buyer :\n\n`;

            text += `_Silakan kirim form ini ke admin. Jika sudah sesuai, akun akan segera dikirim._`;

            // PENTING: return agar stop disini
            return await msg.reply(text); 
        }

        
        // --- PRICELIST NETFLIX ---
        if (isiPesan.includes('.netflix')) {
            if (fs.existsSync('./netflix.json')) {
                const rawData = fs.readFileSync('./netflix.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `🎬 _*NETFLIX ALL DEVICE*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Sharing 1p1u*\n\n`;
                const list1p1u = items.filter(x => x.kategori === '1p1u');
                list1p1u.length > 0 ? list1p1u.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Semi Private*\n\n`;
                const listsempriv = items.filter(x => x.kategori === 'semi_private');
                listsempriv.length > 0 ? listsempriv.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Private*\n\n`;
                const listprivate = items.filter(x => x.kategori === 'private');
                listprivate.length > 0 ? listprivate.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST CANVA ---
        if (isiPesan.includes('.canva')) {
            if (fs.existsSync('./canva.json')) {
                const rawData = fs.readFileSync('./canva.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `🎨 _*CANVA*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Member*\n\n`;
                const listmember = items.filter(x => x.kategori === 'member');
                listmember.length > 0 ? listmember.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Admin*\n\n`;
                const listadmin = items.filter(x => x.kategori === 'admin');
                listadmin.length > 0 ? listadmin.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Owner*\n\n`;
                const listowner = items.filter(x => x.kategori === 'owner');
                listowner.length > 0 ? listowner.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST CAPCUT---
        if (isiPesan.includes('.capcut')) {
            if (fs.existsSync('./capcut.json')) {
                const rawData = fs.readFileSync('./capcut.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `✂️ _*CAPCUT*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Sharing*\n\n`;
                const listsharing = items.filter(x => x.kategori === 'sharing');
                listsharing.length > 0 ? listsharing.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Private*\n\n`;
                const listprivate = items.filter(x => x.kategori === 'private');
                listprivate.length > 0 ? listprivate.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST IQIYI---
        if (isiPesan.includes('.iqiyi')) {
            if (fs.existsSync('./iqiyi.json')) {
                const rawData = fs.readFileSync('./iqiyi.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `📺 _*IQIYI*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Sharing*\n\n`;
                const listsharing = items.filter(x => x.kategori === 'sharing');
                listsharing.length > 0 ? listsharing.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Private*\n\n`;
                const listprivate = items.filter(x => x.kategori === 'private');
                listprivate.length > 0 ? listprivate.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST LOKLOK---
        if (isiPesan.includes('.loklok')) {
            if (fs.existsSync('./loklok.json')) {
                const rawData = fs.readFileSync('./loklok.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `📱 _*LOKLOK*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Basic*\n\n`;
                const listbasic = items.filter(x => x.kategori === 'basic');
                listbasic.length > 0 ? listbasic.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Standard*\n\n`;
                const liststandard = items.filter(x => x.kategori === 'standard');
                liststandard.length > 0 ? liststandard.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST WETV---
        if (isiPesan.includes('.wetv')) {
            if (fs.existsSync('./wetv.json')) {
                const rawData = fs.readFileSync('./wetv.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `📽️ _*WETV*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Sharing*\n\n`;
                const listsharing = items.filter(x => x.kategori === 'sharing');
                listsharing.length > 0 ? listsharing.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Private*\n\n`;
                const listprivate = items.filter(x => x.kategori === 'private');
                listprivate.length > 0 ? listprivate.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST SPOTIFY---
        if (isiPesan.includes('.spotify')) {
            if (fs.existsSync('./spotify.json')) {
                const rawData = fs.readFileSync('./spotify.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `🎧 _*SPOTIFY*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Famplan*\n\n`;
                const listfamplan = items.filter(x => x.kategori === 'famplan');
                listfamplan.length > 0 ? listfamplan.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Indplan*\n\n`;
                const listindplan = items.filter(x => x.kategori === 'indplan');
                listindplan.length > 0 ? listindplan.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST YOUTUBE---
        if (isiPesan.includes('.youtube')) {
            if (fs.existsSync('./youtube.json')) {
                const rawData = fs.readFileSync('./youtube.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `▶️ _*YOUTUBE*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Famplan*\n\n`;
                const listfamplan = items.filter(x => x.kategori === 'famplan');
                listfamplan.length > 0 ? listfamplan.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Indplan*\n\n`;
                const listindplan = items.filter(x => x.kategori === 'indplan');
                listindplan.length > 0 ? listindplan.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST Disney---
        if (isiPesan.includes('.disney')) {
            if (fs.existsSync('./disney.json')) {
                const rawData = fs.readFileSync('./disney.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `🧸 _*DISNEY*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*PriceList*\n\n`;
                const listall = items.filter(x => x.kategori === 'all');
                listall.length > 0 ? listall.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST HBO---
        if (isiPesan.includes('.hbo')) {
            if (fs.existsSync('./hbo.json')) {
                const rawData = fs.readFileSync('./hbo.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `🎞  _*HBO*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*PriceList*\n\n`;
                const listall = items.filter(x => x.kategori === 'all');
                listall.length > 0 ? listall.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        // --- PRICELIST VIU---
        if (isiPesan.includes('.viu')) {
            if (fs.existsSync('./viu.json')) {
                const rawData = fs.readFileSync('./viu.json', 'utf8');
                const items = JSON.parse(rawData);

                let pesan = `📺 _*VIU*_\n\n_Note: Tanyakan stok terlebih dahulu_\n\n`;
                pesan += `*Private Biasa*\n\n`;
                const listprivate = items.filter(x => x.kategori === 'privat');
                listprivate.length > 0 ? listprivate.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";
                pesan += `\n*Private Anti Limit Fullgar*\n\n`;
                const listprivfull = items.filter(x => x.kategori === 'privat_fullgar');
                listprivfull.length > 0 ? listprivfull.forEach(i => pesan += `${i.durasi} = ${i.harga} ${i.info}\n`) : pesan += "_(Stok Kosong)_\n";

                return await msg.reply(pesan);
            }
        }

        
        // --- MENU UTAMA (.pl) ---
        if (isiPesan === '.pl') {
            let menu = `🧑‍🚀 _*PRICELIST APP PREMIUM*_\n\n`;
            menu += `🌌 *MOVIE & STREAMING*\n\n`;
            menu += `► Netflix\n`;
            menu += `► Disney\n`;
            menu += `► Loklok\n`;
            menu += `► HBO\n`;
            menu += `► Viu\n`;
            menu += `► WeTV\n`;
            menu += `► Iqiyi\n\n`;
            menu += `🎶 *MUSIC & YOUTUBE*\n\n`;
            menu += `► Spotify\n`;
            menu += `► Youtube\n\n`;
            menu += `🎨 *CREATIVE & EDITING*\n\n`;
            menu += `► Canva\n`;
            menu += `► CapCut\n\n`;
            menu += `📡 *Note:*\n`;
            menu += `Ingin Mengakses Harga Menu Spesifik?\n`;
            menu += `Ketik format titik + nama aplikasi (huruf kecil).\n`;

            return await msg.reply(menu);
        }


        // 3. --- PAYMENT / QRIS ---
        if (['qris', 'payment', 'qr', '.pay'].includes(isiPesan)) {
            if (fs.existsSync('./qris.png')) {
                const media = MessageMedia.fromFilePath('./qris.png');
                return await client.sendMessage(msg.from, media, { caption: 'Silakan scan QRIS di atas.' });
            } else {
                return msg.reply('⚠️ File qris.png belum di-upload ke server.');
            }
        }

        // 4. --- GARANSI ---
        if (isiPesan === '.garansi') {
            let pesan = `[Format Garansi]\n\n☆ Nama jenis app + durasi :\n☆ Email :\n☆ Password :\n☆ Profile :\n☆ plan (shar/priv/fam/ind) :\n☆ Tanggal order :\n☆ Tanggal report :\n☆ Durasi :\n☆ Kendala (Sertakan SS) :\n\n‼️ Sertakan ss bukti error\n‼️ proses garansi maksimal 3x24 jam`;
            return await msg.reply(pesan);
        }

        // ==========================================
        // FITUR KHUSUS ADMIN
        // ==========================================
        if (chat.isGroup) {
            
            if (isiPesan === '.cekadmin') {
                if (isAdmin) return msg.reply(`✅ *VERIFIED ADMIN*\nID: ${pengirimAngka}`);
                else return msg.reply(`❌ *MEMBER BIASA*\nID Anda: ${pengirimAngka}`);
            }

            // --- PROSES ---
            if (isiPesan.startsWith('.proses')) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                if (!msg.hasQuotedMsg) return msg.reply('❌ Reply chat target dulu.');

                const quotedMsg = await msg.getQuotedMessage();
                const targetId = quotedMsg.author || quotedMsg.from;
                const targetNumber = targetId.split('@')[0];

                const now = new Date();
                const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
                const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':');

                let text = `🚀 *TRANSAKSI SEDANG PROSES* 🚀\n\n_Detail Order_\n📆 Tanggal: ${dateStr}\n⏰ Waktu  : ${timeStr} WIB\n👤 Pemesan: @${targetNumber}\n\n_Pesanan Anda sedang dalam proses. Mohon menunggu notifikasi selanjutnya._`;
                
                return await quotedMsg.reply(text, null, { mentions: [targetId] });
            }

            // --- DONE ---
            if (isiPesan.startsWith('.done')) {
                if (!isAdmin) return msg.reply(`❌ Akses Ditolak.`);
                if (!msg.hasQuotedMsg) return msg.reply('❌ Reply chat target dulu.');

                const quotedMsg = await msg.getQuotedMessage();
                const targetId = quotedMsg.author || quotedMsg.from;
                const targetNumber = targetId.split('@')[0];

                let text = `✅ *TRANSAKSI BERHASIL / DONE* ✅\n\n`;
                text += `👤 Customer: @${targetNumber}\n`;
                text += `🛍️ Status: *Completed* ✨\n\n`;
                text += `Terima kasih sudah order, akun/produk sudah dikirim via Chat Pribadi (PC) ya! 🥰\n`;
                text += `Mohon dicek dan jangan lupa testimoni.\n\n`;
                text += `⚠️ *PENTING UNTUK KLAIM GARANSI:*\n`;
                text += `> Wajib Screenshot (SS) bukti login/produk berfungsi sekarang juga.\n`;
                text += `> Tidak ada bukti SS saat awal terima = Garansi Hangus (Void). 🚫`;

                return await quotedMsg.reply(text, null, { mentions: [targetId] });
            }

            // --- RECAP KEUANGAN V2 (DETAIL: APP + PROFIT) ---
            if (isiPesan.startsWith('.recap')) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                if (!msg.hasQuotedMsg) return msg.reply('❌ Reply chat bukti transfernya.');

                // Format Command: .recap 25k 5k Netflix 1 Bulan
                const args = isiPesan.split(' ');
                
                // Cek kelengkapan command
                // args[0]=.recap, args[1]=omzet, args[2]=profit, args[3...]=nama app
                if (args.length < 4) {
                    return msg.reply('❌ Format Salah.\nContoh: .recap 25k 5k Netflix Sharing');
                }

                // 1. Parse Nominal Omzet (Harga Jual)
                let rawOmzet = args[1];
                let omzet = 0;
                if (rawOmzet.toLowerCase().includes('k')) {
                    omzet = parseInt(rawOmzet.replace(/k/gi, '')) * 1000;
                } else {
                    omzet = parseInt(rawOmzet.replace(/[^0-9]/g, ''));
                }

                // 2. Parse Nominal Profit
                let rawProfit = args[2];
                let profit = 0;
                if (rawProfit.toLowerCase().includes('k')) {
                    profit = parseInt(rawProfit.replace(/k/gi, '')) * 1000;
                } else {
                    profit = parseInt(rawProfit.replace(/[^0-9]/g, ''));
                }

                // 3. Ambil Nama Aplikasi (Gabungkan sisa kata)
                const namaApp = args.slice(3).join(' '); // Mengambil kata dari urutan ke-3 sampai akhir

                if (isNaN(omzet) || isNaN(profit)) return msg.reply('❌ Format angka salah.');

                // 4. Ambil Data Pengirim
                const quotedMsg = await msg.getQuotedMessage();
                const senderId = quotedMsg.author || quotedMsg.from;
                const senderName = senderId.split('@')[0];

                // 5. Siapkan Waktu
                const now = new Date();
                const tanggalLengkap = now.toLocaleDateString('id-ID', { 
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    timeZone: 'Asia/Jakarta' 
                });

                try {
                    const sheets = google.sheets({ version: 'v4', auth });
                    
                    await sheets.spreadsheets.values.append({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `${SHEET_NAME}!A:E`, // FOKUS KOLOM A SAMPAI E
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: [
                                // URUTAN: Tanggal | Pengirim | Nama App | Omzet | Profit
                                [tanggalLengkap, `'${senderName}`, namaApp, omzet, profit]
                            ]
                        }
                    });

                    // 6. Reply Sukses
                    let replyText = `✅ *DATA TRANSAKSI TERSIMPAN*\n\n`;
                    replyText += `📅 Tgl: ${tanggalLengkap}\n`;
                    replyText += `👤 Cust: @${senderName}\n`;
                    replyText += `📱 Item: ${namaApp}\n`;
                    replyText += `💰 Omzet: Rp ${omzet.toLocaleString('id-ID')}\n`;
                    replyText += `💵 Profit: Rp ${profit.toLocaleString('id-ID')}\n`;
                    
                    return await quotedMsg.reply(replyText, null, { mentions: [senderId] });

                } catch (error) {
                    console.error('Gagal Recap:', error);
                    return msg.reply(`❌ Gagal koneksi ke Google Sheets.\nError: ${error.message}`);
                }
            }

            // --- HIDETAG (.h) ---
            if (isiPesan.startsWith('.h')) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                const text = msg.body.slice(2).trim();
                let mentions = chat.participants.map(p => p.id._serialized);

                if (msg.hasMedia) {
                    try {
                        const media = await msg.downloadMedia();
                        if (media) return await msg.reply(media, null, { caption: text, mentions: mentions });
                    } catch (e) { return msg.reply('❌ Gagal download gambar.'); }
                } else {
                    if (!text) return msg.reply('❌ Masukkan pesan. Contoh: .h Halo');
                    return await msg.reply(text, null, { mentions: mentions });
                }
            }

            // --- TAGALL ---
            if (isiPesan.startsWith('.tagall')) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                let text = "🔊 *PERHATIAN SEMUA* 🔊\n\n";
                let mentions = chat.participants.map(p => p.id._serialized);
                mentions.forEach(m => text += `@${m.split('@')[0]} `);
                return await chat.sendMessage(text, { mentions: mentions });
            }

            // --- KICK ---
            if (isiPesan === '.kick' && msg.hasQuotedMsg) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                const quotedMsg = await msg.getQuotedMessage();
                const targetKick = quotedMsg.author.replace(/\D/g, ''); 
                const cleanOwnersKick = OWNERS.map(id => id.toString().replace(/\D/g, ''));
                
                if (cleanOwnersKick.includes(targetKick)) return msg.reply('❌ Tidak bisa kick sesama Owner.');

                try {
                    await chat.removeParticipants([quotedMsg.author]);
                    return msg.reply('👋 Member berhasil dikeluarkan.');
                } catch (e) { return msg.reply('❌ Gagal Kick.'); }
            }

            // --- BUKA/TUTUP GRUP ---
            if (['.group open', '.buka grup'].includes(isiPesan)) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                await chat.setMessagesAdminsOnly(false);
                return msg.reply('🔓 *GRUP DIBUKA*');
            }
            if (['.group close', '.tutup grup'].includes(isiPesan)) {
                if (!isAdmin) return msg.reply('❌ Khusus Admin.');
                await chat.setMessagesAdminsOnly(true);
                return msg.reply('🔒 *GRUP DITUTUP*');
            }
        }

    } catch (err) {
        console.error("ERROR SYSTEM:", err);
    }
});

client.initialize();