import discord
from discord.ext import commands, tasks
import aiohttp
import io
import asyncio

# --- Monkey patch để khắc phục lỗi protobuf (nếu cần) ---
try:
    from google.protobuf.json_format import MessageToDict as original_MessageToDict

    def patched_MessageToDict(message, **kwargs):
        kwargs.pop('including_default_value_fields', None)
        kwargs.pop('use_integers_for_enums', None)
        return original_MessageToDict(message, **kwargs)

    import discord.settings
    discord.settings.MessageToDict = patched_MessageToDict
except Exception as e:
    print("Không áp dụng được monkey patch cho protobuf:", e)
# --- End monkey patch ---

class VTriPBot(commands.Bot):
    def __init__(self, prefix="!", **kwargs):
        # Thiết lập trạng thái mặc định không thay đổi
        self.def_act = discord.Game(name="Đang Chơi VAI Bot")
        super().__init__(command_prefix=prefix, **kwargs)
        # Bắt đầu task tự động reset trạng thái mỗi 60 giây
        self.reset_status_loop.start()

    # Task tự động reset trạng thái mặc định mỗi 60 giây
    @tasks.loop(seconds=60)
    async def reset_status_loop(self):
        if self.activity != self.def_act:
            await super().change_presence(activity=self.def_act)
            print("Reset trạng thái về mặc định.")

    async def on_ready(self):
        try:
            await super().change_presence(activity=self.def_act)
        except Exception as e:
            print("Lỗi khi change_presence:", e)
            await super().change_presence(activity=discord.Game(name="Đang Chơi VAI Bot"))
        print(f"{self.user} đã đăng nhập thành công với trạng thái: {self.def_act.name}")

    # Ghi đè change_presence để buộc trạng thái mặc định
    async def change_presence(self, *, activity=None, status=None, afk=False):
        if activity is None or activity != self.def_act:
            print("Cấm thay đổi trạng thái ngoài mặc định!")
            activity = self.def_act
        return await super().change_presence(activity=activity, status=status, afk=afk)

    async def on_reaction_add(self, reaction, user):
        if user.bot:
            return
        print(f"{user} đã thêm reaction {reaction.emoji} vào tin: {reaction.message.content}")
        if str(reaction.emoji) == "👍":
            await reaction.message.channel.send(f"Cảm ơn {user.mention} đã thích tin nhắn này!")

    # Decorator rút gọn để đăng ký lệnh (sc hoặc c)
    def sc(self, name, help_text=""):
        def deco(func):
            @self.command(name=name, help=help_text)
            async def wrapper(ctx, *args):
                return await func(ctx, *args)
            return wrapper
        return deco

    def c(self, name, help_text=""):
        return self.sc(name, help_text)

    # --- Tiện ích bổ sung cho người dùng ---

    async def read_channel(self, channel_id, limit=10):
        channel = self.get_channel(channel_id)
        if channel is None:
            return "Kênh không tồn tại hoặc bot không có quyền."
        messages = await channel.history(limit=limit).flatten()
        return [msg.content for msg in messages]

    async def fetch_json(self, url):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Lỗi fetch JSON: {response.status}")
                    return None

    async def fetch_json_key(self, url, key):
        data = await self.fetch_json(url)
        if data and key in data:
            return data[key]
        print(f"Không tìm thấy key '{key}' trong dữ liệu JSON.")
        return None

    async def create_and_send_file(self, channel_id, content, filename="file.txt"):
        channel = self.get_channel(channel_id)
        if channel is None:
            return "Kênh không tồn tại hoặc bot không có quyền."
        file_obj = io.BytesIO(content.encode("utf-8"))
        discord_file = discord.File(fp=file_obj, filename=filename)
        await channel.send("File tự động được tạo:", file=discord_file)
        return "File đã được gửi."

    async def send_image_from_api(self, channel_id, api_url, key="url"):
        channel = self.get_channel(channel_id)
        if channel is None:
            return "Kênh không tồn tại hoặc bot không có quyền."
        img_url = await self.fetch_json_key(api_url, key)
        if img_url:
            await channel.send(img_url)
            return "Ảnh đã được gửi."
        return "Không thể lấy URL ảnh từ API."

    async def create_embed(self, title, description, color=0x3498db):
        embed = discord.Embed(title=title, description=description, color=color)
        return embed

    async def send_embed(self, channel_id, title, description, color=0x3498db):
        channel = self.get_channel(channel_id)
        if channel is None:
            return "Kênh không tồn tại hoặc bot không có quyền."
        embed = await self.create_embed(title, description, color)
        await channel.send(embed=embed)
        return "Embed đã được gửi."

    async def get_server_info(self, guild_id):
        guild = self.get_guild(guild_id)
        if guild is None:
            return "Máy chủ không tồn tại hoặc bot không có quyền."
        info = (
            f"Tên máy chủ: {guild.name}\n"
            f"Số thành viên: {guild.member_count}\n"
            f"Số kênh: {len(guild.channels)}\n"
            f"Chủ sở hữu: {guild.owner}"
        )
        return info

    async def ban_member(self, guild_id, member_id, reason=None):
        guild = self.get_guild(guild_id)
        if guild is None:
            return "Máy chủ không tồn tại hoặc bot không có quyền."
        member = guild.get_member(member_id)
        if member is None:
            return "Thành viên không tồn tại."
        try:
            await guild.ban(member, reason=reason)
            return f"Đã ban thành viên {member}."
        except Exception as e:
            return f"Lỗi khi ban: {e}"