import os
import discord
from discord.ext import commands
from discord.ui import Button, View

# إعداد الصلاحيات
intents = discord.Intents.default()
intents.message_content = True

# تعريف البوت
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'✅ البوت يعمل الآن: {bot.user.name}')
    
    # إعداد الـ Rich Presence (يظهر كأنه يشاهد كاس العالم)
    activity = discord.Activity(
        type=discord.ActivityType.watching, 
        name="كأس العالم 2026 🏆"
    )
    await bot.change_presence(status=discord.Status.online, activity=activity)

# أمر إرسال رسالة "التوثيق" الاحترافية
@bot.command()
async def support(ctx):
    # إنشاء رسالة الـ Embed (اللون الأحمر والأسود)
    embed = discord.Embed(
        title="🏆 Majlis World Cup 2026",
        description="بوت الأخبار الرسمي - تابع النتائج أول بأول وانضم لمجلسنا الخاص!",
        color=0xFF0000  # اللون الأحمر
    )
    embed.set_footer(text="Official Bot | Verified ✅")

    # إنشاء زر الانضمام
    view = View()
    view.add_item(Button(
        label="انضم للسيرفر الرسمي", 
        style=discord.ButtonStyle.link, 
        url="https://discord.gg/BxWFnmYaKq"
    ))

    await ctx.send(embed=embed, view=view)

# تشغيل البوت باستخدام الـ Token من متغيرات البيئة
token = os.environ.get('DISCORD_TOKEN')
if token:
    bot.run(token)
else:
    print("❌ خطأ: لم يتم العثور على DISCORD_TOKEN في إعدادات Render.")
