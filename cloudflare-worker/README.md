# Cloudflare Worker - API Proxy

קוד זה מגן על מפתחות ה-API שלך ומאפשר לחברים להשתמש באפליקציה עם סיסמה.

## שלב 1: יצירת חשבון Cloudflare

1. לך ל: https://dash.cloudflare.com/sign-up
2. הירשם עם אימייל (חינם!)

## שלב 2: יצירת Worker

1. בדשבורד, לחץ על **Workers & Pages** בתפריט השמאלי
2. לחץ על **Create**
3. בחר **Create Worker**
4. תן שם: `dnd-api-proxy`
5. לחץ **Deploy**

## שלב 3: העלאת הקוד

1. לחץ על **Edit code**
2. מחק את כל הקוד הקיים
3. העתק את התוכן של `worker.js` (מהתיקייה הזו)
4. לחץ **Deploy**

## שלב 4: הגדרת משתנים סודיים (חשוב!)

1. לחץ על **Settings** (של ה-Worker)
2. לחץ על **Variables and Secrets**
3. תחת **Environment Variables**, לחץ **Add**
4. הוסף את המשתנים הבאים:

| Variable Name    | Value                     |
|-----------------|---------------------------|
| `GEMINI_API_KEY` | המפתח שלך מ-Google         |
| `GETIMG_API_KEY` | המפתח שלך מ-GetImg (אופציונלי) |
| `ACCESS_PASSWORD`| הסיסמה שתבחר לחברים        |

5. לחץ **Save and Deploy**

## שלב 5: קבלת כתובת ה-Worker

הכתובת תהיה בפורמט:
```
https://dnd-api-proxy.YOUR_SUBDOMAIN.workers.dev
```

את הכתובת הזו תשתמש בפרונטאנד.

---

## בדיקה

אפשר לבדוק עם curl:
```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"password":"הסיסמה_שלך","action":"gemini-generate","data":{"model":"gemini-1.5-flash","contents":[{"parts":[{"text":"Hello"}]}]}}'
```
