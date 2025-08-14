import asyncio, os, getpass
from twikit import Client

COOKIES_PATH = os.environ.get("COOKIES_PATH", "cookies.json")
TOTP_SECRET = os.environ.get("TOTP_SECRET")  # optional, if you use an authenticator app

async def main():
  print("X login (Twikit) — this stores cookies to", COOKIES_PATH)
  auth1 = input("Username (with @ or without): ").strip()
  auth2 = input("Email (or second identifier, can repeat username): ").strip()
  pwd = getpass.getpass("Password: ")

  client = Client("en-US")
  try:
    # If you have an authenticator app, put the secret in .env as TOTP_SECRET
    await client.login(
      auth_info_1=auth1,
      auth_info_2=auth2 if auth2 else None,
      password=pwd,
      totp_secret=TOTP_SECRET,          # uses TOTP automatically if provided
      cookies_file=None,                # don't auto-load
      enable_ui_metrics=True
    )
    client.save_cookies(COOKIES_PATH)
    print("Saved cookies to", COOKIES_PATH)
  except Exception as e:
    print("\nLogin failed:", e)
    print("If this keeps happening, use manual cookies (see method B below).")

if __name__ == "__main__":
  asyncio.run(main())
