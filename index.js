require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// Application Configuration
const CONFIG = {
    CHANNELS: {
        SUBMIT: '1253945165215830081',
        JOB_OPENING: '1565381305372246096',
        INFO: '1555977069068816534',
        PING_TASK: '1566202813879423006'
    },
    ROLES: {
        MEMBER: '1555947188180226058'
    },
    TASK_PLATFORMS: {
        '!da': { id: '1553226492866203649', name: 'DataAnnotation' },
        '!outlier': { id: '1555966134614753421', name: 'Outlier' },
        '!prolific': { id: '1555966786099220570', name: 'Prolific' },
        '!handshake': { id: '1556264168733024376', name: 'Handshake' },
        '!mercor': { id: '1555962698565554216', name: 'Mercor' }
    }
};

// Healthcheck server
http.createServer((_, res) => res.end('OK')).listen(process.env.PORT || 8080);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

client.on('ready', () => {
    console.log(`[SYSTEM] Initialized. Logged in as ${client.user.tag}`);
    client.user.setActivity('!help | Info Cuan', { type: ActivityType.Playing });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim();
    const args = content.split(/ +/);
    const command = args[0].toLowerCase();

    // Utility: Send self-destructing reply
    const sendTempReply = async (text, delay = 5000) => {
        const msg = await message.reply(text);
        setTimeout(() => msg.delete().catch(() => {}), delay);
    };

    // --- Command Handling ---

    if (command === '!help') {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🤖 Panduan Mas Cuan')
            .addFields(
                { name: '🔗 Auto-Filter', value: `Kirim link loker di <#${CONFIG.CHANNELS.SUBMIT}> untuk difilter ke <#${CONFIG.CHANNELS.JOB_OPENING}>.` },
                { name: '📢 Info Umum', value: `\`!info [teks]\` -> <#${CONFIG.CHANNELS.INFO}>.` },
                { name: '🚨 Task Alert', value: `\`![platform] [info]\` -> <#${CONFIG.CHANNELS.PING_TASK}>.\n(Platform: !da, !outlier, !prolific, !handshake, !mercor)` },
                { name: '💱 Kurs & Chat', value: '\`!kurs [jumlah]\` atau \`!ai [prompt]\`' }
            )
            .setFooter({ text: 'AI Trainer United' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (command === '!ai') {
        const prompt = args.slice(1).join(' ');
        if (!prompt) return sendTempReply('Prompt required. Usage: `!ai [prompt]`');

        try {
            await message.channel.sendTyping();
            const res = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
            });

            let answer = res.text;
            if (answer.length > 4000) answer = answer.substring(0, 4000) + '...\n\n*(Truncated)*';

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🧠 Mas Cuan:')
                .setDescription(answer)
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('[ERROR] AI Command:', err);
            return message.reply(err.status === 503 ? 'Service unavailable. Try again.' : 'Generation failed.');
        }
    }

    if (command === '!kurs') {
        let amount = args[1] ? parseFloat(args[1].replace(',', '.')) : 1;
        if (isNaN(amount)) return sendTempReply('Invalid amount format.');

        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            const usdToIdr = data.rates.IDR;
            const eurToIdr = usdToIdr / data.rates.EUR;
            
            const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

            const embed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle(amount === 1 ? '📈 Market Rates' : `💸 Conversion: ${amount}`)
                .setDescription(`**${amount} USD** = ${formatRp(amount * usdToIdr)}\n**${amount} EUR** = ${formatRp(amount * eurToIdr)}`)
                .setFooter({ text: 'ExchangeRate-API' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('[ERROR] Exchange API:', err);
            return message.reply('Exchange API error.');
        }
    }

    if (CONFIG.TASK_PLATFORMS[command]) {
        const platform = CONFIG.TASK_PLATFORMS[command];
        const info = args.slice(1).join(' ');
        if (!info) return sendTempReply('Task info required.');

        try {
            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle(`🚨 TASK ${platform.name.toUpperCase()} DROP`)
                .setDescription(`**Info:**\n${info}`)
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            const channel = await client.channels.fetch(CONFIG.CHANNELS.PING_TASK);
            await channel.send({ content: `<@&${platform.id}> Task dropped! 🏃💨`, embeds: [embed] });
            await message.delete().catch(() => {});
        } catch (err) {
            console.error(`[ERROR] Task Ping - ${platform.name}:`, err);
        }
        return;
    }

    if (command === '!info') {
        const info = args.slice(1).join(' ');
        if (!info) return;

        try {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📢 ANNOUNCEMENT')
                .setDescription(info)
                .setFooter({ text: message.author.username })
                .setTimestamp();

            const channel = await client.channels.fetch(CONFIG.CHANNELS.INFO);
            await channel.send({ content: `<@&${CONFIG.ROLES.MEMBER}>`, embeds: [embed] });
            await message.delete().catch(() => {});
        } catch (err) {
            console.error('[ERROR] Info Command:', err);
        }
        return;
    }

    // --- Message Scanning ---

    if (message.channelId === CONFIG.CHANNELS.SUBMIT) {
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/g);
        if (!urlMatch) return;

        const link = urlMatch[0];
        console.log(`[INFO] Analyzing URL: ${link}`);

        try {
            const jinaRes = await fetch(`https://r.jina.ai/${link}`);
            const webText = (await jinaRes.text()).substring(0, 3000);

            const systemPrompt = `Analyze if text represents a job opening. Respond ONLY in JSON:
{"is_job_opening": boolean, "job_title": "string/null", "company_name": "string/null", "rate": "string/null", "summary": "string/null"}`;

            const aiResponse = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: `Web Context:\n${webText}`,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: 'application/json',
                }
            });

            const data = JSON.parse(aiResponse.text);

            if (data.is_job_opening) {
                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🔎 NEW JOB POSTING')
                    .addFields(
                        { name: '🏢 Company', value: data.company_name || '-', inline: true },
                        { name: '💼 Role', value: data.job_title || '-', inline: true },
                        { name: '💰 Rate', value: data.rate || '-', inline: true },
                        { name: '🔗 Link', value: link },
                        { name: '📝 Summary', value: data.summary || '-' }
                    )
                    .setDescription(`📮 **Posted By:** <@${message.author.id}>`)
                    .setFooter({ text: 'AI Evaluated' })
                    .setTimestamp();

                const channel = await client.channels.fetch(CONFIG.CHANNELS.JOB_OPENING);
                await channel.send({ content: `<@&${CONFIG.ROLES.MEMBER}>`, embeds: [embed] });
                await message.delete().catch(() => {});
            }
        } catch (err) {
            console.error('[ERROR] Job Scanner:', err);
            if (err.status === 503) await message.reply('Analysis queue full. Try again.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);