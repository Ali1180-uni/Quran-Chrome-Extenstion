# ☪️ Quran Reminder - Chrome Extension

A beautiful Chrome extension that displays a random Quran verse every time you click the extension icon. Get inspired with verses in Arabic, Urdu, and English translations.

![Quran Reminder](https://img.shields.io/badge/Manifest-V3-green) ![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)

## ✨ Features

- 📖 **Random Quran Verses** - Displays a random ayah from any of the 114 Surahs
- 🎯 **Accurate Ayah Count** - Never shows invalid verse numbers (respects actual ayah count per surah)
- 🌐 **Trilingual Display** - Arabic, Urdu, and English translations
- ✍️ **Beautiful Fonts** - Amiri Quran for Arabic, Noto Nastaliq for Urdu
- 🎨 **Elegant Design** - Dark theme with golden accents
- ⚡ **Instant Loading** - Verse appears automatically when popup opens

## 📁 Project Structure

```
Quran Reminder/
├── manifest.json        # Extension configuration
├── QuranReminder.html   # Popup HTML
├── style.css           # Styling
├── script.js           # Logic for fetching random verses
└── icon.png            # Extension icon (128x128 recommended)
```

## 🚀 Installation Guide

### Step 1: Download the Extension

Clone or download this repository to your local machine:

```bash
git clone https://github.com/Ali1180-uni/Quran-Chrome-Extenstion.git
```

Or download as ZIP and extract it.

### Step 2: Add an Icon

Make sure you have an `icon.png` file (128x128 pixels) in the `Quran Reminder` folder. You can use any Islamic-themed icon.

### Step 3: Load in Chrome

1. Open **Google Chrome**
2. Go to `chrome://extensions/` in the address bar
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the `Quran Reminder` folder
6. The extension icon will appear in your toolbar!

### Step 4: Use the Extension

- Click the extension icon in Chrome toolbar
- A popup appears with a random Quran verse
- Click the icon again for a new random verse

## 🛠️ How to Create Your Own Version

### 1. Create the Manifest (`manifest.json`)

```json
{
    "name": "Quran Reminder",
    "description": "An extension that reminds you Messages of Allah in Quran",
    "version": "1.0",
    "manifest_version": 3,
    "permissions": [],
    "icons": {
        "16": "icon.png",
        "48": "icon.png",
        "128": "icon.png"
    },
    "action": {
        "default_icon": "icon.png",
        "default_popup": "QuranReminder.html",
        "default_title": "Quran Reminder"
    }
}
```

> ⚠️ **Note**: Use `action` instead of `browser_action` for Manifest V3

### 2. Create the Popup HTML (`QuranReminder.html`)

- Link Google Fonts for Arabic (Amiri Quran) and Urdu (Noto Nastaliq Urdu)
- Create sections for Arabic, Urdu, and English text
- Keep it simple - no buttons needed, verse loads automatically

### 3. Style It (`style.css`)

- Set fixed width (e.g., 400px) for popup
- Use RTL direction for Arabic and Urdu text
- Center all content

### 4. Add Logic (`script.js`)

- Define ayah counts for all 114 surahs
- Generate random surah (1-114) and valid ayah number
- Fetch from Quran API and display

## 🌐 API Used

This extension uses the free [Quran API](https://quranapi.pages.dev/):

```
https://quranapi.pages.dev/api/{surah}/{ayah}.json
```

Returns Arabic, Urdu, and English translations.

## 📝 Key Points for Manifest V3

| Manifest V2 | Manifest V3 |
|-------------|-------------|
| `browser_action` | `action` |
| `persistent: true` | Not needed |
| Background scripts | Service workers |

## 🎨 Fonts Used

| Language | Font | Purpose |
|----------|------|---------|
| Arabic | Amiri Quran | Beautiful Quranic calligraphy |
| Urdu | Noto Nastaliq Urdu | Authentic Nastaliq script |
| English | Poppins | Clean, modern readability |

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 📜 License

This project is open source and available for everyone to use and modify.

---

**May Allah guide us all** ☪️

