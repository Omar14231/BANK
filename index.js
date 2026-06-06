const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

const DB_FILE = "bank_data.json";

function loadDB() {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { users: {}, loans: {} };
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

client.once('ready', async () => {
    console.log(`✅ البوت متصل كـ ${client.user.tag}`);
    
    // ربط تويتش (النشاط)
    client.user.setActivity('البث المباشر الآن!', { type: 1, url: 'https://www.twitch.tv/adsqwertt11' });

    // تسجيل الأوامر (Slash Commands)
    const commands = [{
        name: 'salafni',
        description: 'طلب سلف مالي',
        options: [
            { name: 'المبلغ', type: 4, description: 'المبلغ', required: true },
            { name: 'الشخص', type: 6, description: 'الشخص', required: true },
            { name: 'عدد_الأيام', type: 4, description: 'الأيام', required: true },
            { name: 'السبب', type: 3, description: 'السبب', required: true }
        ]
    }];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    
    setInterval(cleanExpiredLoans, 3600000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'salafni') {
        const amount = interaction.options.getInteger('المبلغ');
        const target = interaction.options.getUser('الشخص');
        const days = interaction.options.getInteger('عدد_الأيام');
        const reason = interaction.options.getString('السبب');

        const db = loadDB();
        if (db.users[interaction.user.id]?.status === "محروم") {
            return await interaction.reply({ content: "❌ أنت محروم.", ephemeral: true });
        }

        const loanID = `${interaction.user.id}-${target.id}-${Date.now()}`;
        const expireDate = new Date(Date.now() + days * 86400000).toISOString();

        const embed = new EmbedBuilder()
            .setTitle("📩 طلب سلف مالي")
            .setDescription(`مقدم الطلب: ${interaction.user.tag}\nالمبلغ: ${amount}\nالمدة: ${days} أيام\nالسبب: ${reason}`)
            .setColor(0xFFD700);

        try {
            await target.send({ embeds: [embed] });
            await interaction.reply({ content: "⏳ تم إرسال الطلب.", ephemeral: true });
            db.loans[loanID] = { borrower_id: interaction.user.id, lender_id: target.id, amount, reason, expire_at: expireDate };
            saveDB(db);
        } catch (e) {
            await interaction.reply({ content: "❌ تعذر مراسلة الشخص.", ephemeral: true });
        }
    }
});

async function cleanExpiredLoans() {
    const db = loadDB();
    const now = new Date();
    let changed = false;
    for (const [id, loan] of Object.entries(db.loans)) {
        if (new Date(loan.expire_at) < now) {
            db.users[loan.borrower_id] = { status: "محروم" };
            delete db.loans[id];
            changed = true;
        }
    }
    if (changed) saveDB(db);
}

client.login(process.env.DISCORD_TOKEN);
