const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const DB_FILE = "bank_data.json";
const ADMIN_USER_ID = "1306034100544737461";

function loadDB() {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { users: {}, loans: {} };
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

client.once('ready', async () => {
    console.log(`✅ البوت يعمل كـ ${client.user.tag}`);
    client.user.setActivity('البث المباشر الآن!', { type: 1, url: 'https://www.twitch.tv/adsqwertt11' });

    // تسجيل الأوامر (السلف + الإدارة)
    const commands = [
        { name: 'salafni', description: 'طلب سلف', options: [{name:'المبلغ',type:4,required:true}, {name:'الشخص',type:6,required:true}, {name:'عدد_الأيام',type:4,required:true}, {name:'السبب',type:3,required:true}] },
        { name: 'محروم', description: 'حظر شخص', options: [{name:'الشخص',type:6,required:true}] },
        { name: 'الغاء_محروم', description: 'فك حظر شخص', options: [{name:'الشخص',type:6,required:true}] },
        { name: 'اشتكشاف', description: 'تقرير مالي', options: [{name:'الشخص',type:6,required:true}] },
        { name: 'الغاء_العملية', description: 'إلغاء سلف إجباري', options: [{name:'الشخص',type:6,required:true}] }
    ];
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    setInterval(cleanExpiredLoans, 3600000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const db = loadDB();
    const isAdmin = interaction.user.id === ADMIN_USER_ID;

    // أوامر الإدارة
    if (['محروم', 'الغاء_محروم', 'اشتكشاف', 'الغاء_العملية'].includes(interaction.commandName)) {
        if (!isAdmin) return interaction.reply({content: "❌ للادارة فقط.", ephemeral: true});
        const target = interaction.options.getUser('الشخص');
        
        if (interaction.commandName === 'محروم') {
            db.users[target.id] = { status: "محروم" };
            saveDB(db);
            return interaction.reply(`⛔ تم حظر ${target.username}`);
        }
        if (interaction.commandName === 'الغاء_محروم') {
            db.users[target.id] = { status: "طبيعي" };
            saveDB(db);
            return interaction.reply(`🟢 تم فك الحظر عن ${target.username}`);
        }
        if (interaction.commandName === 'اشتكشاف') {
            return interaction.reply(`🔍 حالة العضو: ${db.users[target.id]?.status || "طبيعي"}`);
        }
        if (interaction.commandName === 'الغاء_العملية') {
            // حذف كل سلف متعلق بالشخص
            Object.keys(db.loans).forEach(id => {
                if (db.loans[id].borrower_id === target.id || db.loans[id].lender_id === target.id) delete db.loans[id];
            });
            saveDB(db);
            return interaction.reply("🚨 تم إلغاء العمليات الإدارية.");
        }
    }

    // أمر السلف
    if (interaction.commandName === 'salafni') {
        // ... (نفس منطق السلف السابق) ...
    }
});

async function cleanExpiredLoans() { /* نفس منطق الفحص التلقائي */ }
client.login(process.env.DISCORD_TOKEN);
