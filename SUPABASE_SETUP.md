# Enabling sign-in & cloud save

Harf runs fully in **guest mode** with no backend (progress saved on-device).
To turn on **Google / Apple sign-in** and **cloud save across devices**, connect
a free Supabase project — no server code to write, just configuration.

## 1. Create the project
1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql)
   (creates the `progress` table + row-level security).
3. In **Settings → API**, copy the **Project URL** and the **anon public key**.

## 2. Point the app at it
Create a `.env` file (copy `.env.example`) and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Restart the dev server / rebuild. The login screen's Google & Apple buttons now
work, and progress syncs to the signed-in account.

> For the hosted web preview (GitHub Pages), add the same two values as GitHub
> **Actions secrets** and pass them as env in the deploy workflow's build step.

## 3. Enable the OAuth providers
In Supabase → **Authentication → Providers**:

- **Google** — enable it, then create an OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  (OAuth consent screen + Web client). Paste the client ID/secret into Supabase.
- **Apple** — enable it and follow Supabase's Apple guide (needs an Apple
  Developer account: a Services ID, a key, and the generated secret).

### Redirect URLs
In Supabase → **Authentication → URL Configuration**, add the redirect URLs the
app uses:

- Web preview: `https://thamistco.github.io/Urdu/`
- Local web: `http://localhost:8081/`
- Native (Expo): `harf://auth` (the app's scheme is `harf`, set in `app.json`)

Add the same authorized redirect URIs in the Google Cloud OAuth client.

## How sync works
- On sign-in, if the account has no saved data yet, your current (guest)
  progress is pushed up so nothing is lost; otherwise the cloud copy is adopted.
- Afterwards, local changes are mirrored to the `progress` row (debounced).
- See `src/lib/supabase.ts`, `src/store/useAuthStore.ts`, and `src/lib/sync.ts`.

## Production note
For App Store / Play Store release, use the official **Sign in with Google** and
**Sign in with Apple** button styles (brand guidelines), and for native iOS
prefer `expo-apple-authentication` for the native Apple sheet. The current
buttons are functional placeholders for development and the web preview.
