# Sakinah AI — To-Do List

A running list of what's done and what's next. Updated as we build.

## ✅ Done

### Guidance
- [x] Landing page — "What is on your heart today?" textarea + Find Peace button (premium hover: scale + darken, no fade)
- [x] Dynamic placeholder with examples (English, Bengali, Banglish)
- [x] Loading animation (pulsing light / growing leaf)
- [x] Result card order: Ayat → translation → Reflection → Healing Name of Allah → Hadith → Ask again / Share
- [x] Ayat in Amiri font, Arabic, with chapter:verse reference
- [x] Translation label now matches the language actually returned (Bengali vs. plain "Translation")
- [x] Audio recitation of the Ayat (Quran.com API, Mishari Rashid al-Afasy) — play/pause button
- [x] Healing Name of Allah (Asmaul Husna) — Arabic, meaning, one-sentence why-it-helps
- [x] Prophetic Wisdom (Hadith) card — Sahih only (Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasai, Ibn Majah), narrator, source, sand-colored background
- [x] Reflection written like a kind friend, not a textbook
- [x] Language detection — write in English → English response; Bengali/Banglish → Bengali
- [x] AI backend — edge function `sakinah-guidance` returns all sections in one call

### Access & privacy
- [x] No sign-in, no password, no email — anyone can use the app
- [x] No payment, no daily limit, paywall removed
- [x] Reflection history saved privately on the user's own device (up to 100 entries)
- [x] History drawer with My Diary / Family Circle tabs, copy, and delete

### Family Circle (zero-login)
- [x] Create a circle with just a nickname — no email, no verification
- [x] Private invite link generated instantly (`/join/<code>`), copyable to WhatsApp
- [x] Family member opens the link, types their name, taps "Join Circle"
- [x] "Share with family" toggle on any reflection; shared ones appear in the Family Circle tab with the author's name
- [x] Members list, remove member, leave circle, delete circle
- [x] Backend: `circles`, `circle_members`, `circle_reflections` tables + `circle` edge function (invite code + per-member key)

### Launched
- [x] Published at https://sakinah-in-your-heart.lovable.app
- [x] End-to-end check on the live site: reflection returned, circle created, second device joined, reflection shared and visible in Family Circle

## 🔲 Next (waiting on you)

- [ ] Rename the Lovable URL if you want a shorter name
- [ ] Connect a custom domain (Project settings → Domains)
- [ ] Optional: email delivery for circle invites (currently the link is copied/shared by hand)
- [ ] Optional: Family Circle tab could open by default when your own diary is empty, so a new member sees shared reflections immediately

---
_Add items by telling me in chat — I'll keep this list current._
