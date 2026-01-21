# DirtyTag WebApps

> Suite di strumenti web per la gestione dell'inventario e quality control di DirtyTag — Vintage Fashion E-commerce

![Version](https://img.shields.io/badge/version-3.0-purple)
![Platform](https://img.shields.io/badge/platform-Web-blue)
![Airtable](https://img.shields.io/badge/backend-Airtable-yellow)

---

## 📦 Contenuto Repository

| Tool | Descrizione | File |
|------|-------------|------|
| **AI Photo QC** | Quality check foto AI-generate con approvazione/rigenerazione | `ai_photo_qc.html` |
| **Label Verifier** | Verifica articoli e gestione etichette inventario | `label_verifier.html` |

---

## 🚀 AI Photo QC Review

Sistema di quality check per le foto generate dall'AI. Permette di confrontare le foto RAW originali con quelle processate dall'AI e decidere se approvarle o rigenerarle.

### Funzionalità

- ✅ **Approvazione** foto AI con selezione versione
- 🔄 **Rigenerazione selettiva** (FRONT / BACK / BOTH)
- ⏸ **Scarto per check secondario** (DEFERRED)
- 📊 **Contatori in tempo reale** (pending, approved, regenerated, deferred)
- 🖼 **Zoom foto** con click
- ⌨️ **Shortcut tastiera** per workflow veloce

### Shortcut Tastiera

| Tasto | Azione |
|-------|--------|
| `A` | Approva versione |
| `R` | Rigenera selezionate |
| `D` | Scarta per check secondario |
| `→` | Salta prodotto |
| `F` | Toggle rigenera FRONT |
| `B` | Toggle rigenera BACK |
| `1-9` | Seleziona versione |
| `Esc` | Chiudi modal |

### Campi Airtable Richiesti

```
AI_Quality_Check      (Single Select)  → PENDING | APPROVED | REJECTED | DEFERRED
AI_Approved_Version   (Number)         → Versione approvata
AI_Regenerate_Trigger (Checkbox)       → Trigger per workflow rigenerazione
AI_Regen_Scope        (Single Select)  → FRONT | BACK | BOTH
AI_Regeneration_Count (Number)         → Contatore versioni
AI_Front_Image_Link   (URL)            → Link foto AI front
AI_Back_Image_Link    (URL)            → Link foto AI back
RAW_Front_URL         (URL)            → Link foto RAW front
RAW_Back_URL          (URL)            → Link foto RAW back
Product_Status        (Single Select)  → Status prodotto
```

---

## 🏷 Label Verifier

Strumento per la verifica fisica degli articoli in magazzino e gestione delle etichette.

### Funzionalità

- 🔍 **Ricerca SKU** con visualizzazione foto e dettagli
- ✅ **Tagged Checkbox** — Segna articoli con etichetta già applicata
- ❓ **To Check** — Segna articoli da rivedere
- ❌ **Scarta** — Rimuovi articoli dall'inventario (macchie, errori DB, ecc.)
- ✏️ **Modifica dettagli** — Categoria, brand, colore, taglia, condizione
- 📝 **Note** — Aggiungi note su difetti o problemi
- 📊 **Contatori live da Airtable**

### Shortcut Tastiera

| Tasto | Azione |
|-------|--------|
| `T` | Toggle Tagged (label inserita) |
| `C` | Toggle To Check (da rivedere) |
| `X` | Scarta articolo |
| `S` | Salva modifiche |
| `E` | Modalità modifica |
| `/` | Focus ricerca |
| `Esc` | Chiudi modal |

### Campi Airtable Richiesti

```
SKU                   (Text)           → Codice SKU articolo
Tagged_Checkbox       (Checkbox)       → Etichetta fisica applicata
To_Check              (Checkbox)       → Da rivedere
Product_Status        (Single Select)  → DISCARDED per articoli scartati
Category              (Text/Select)    → Categoria
Sub-Category          (Text/Select)    → Sottocategoria
Brand_TXT             (Text)           → Brand
Colors                (Text/Array)     → Colori
Size (INT)            (Text)           → Taglia
gender                (Single Select)  → M | F | U
Condizione            (Single Select)  → Condizione articolo
Note Prodotto         (Long Text)      → Note aggiuntive
AI_Front_Image_Link   (URL)            → Foto front
AI_Back_Image_Link    (URL)            → Foto back
rawID_FRONT           (Text)           → Google Drive File ID front
rawID_BACK            (Text)           → Google Drive File ID back
```

---

## ⚙️ Configurazione

### 1. Airtable API Key

Entrambi i tool richiedono un **Personal Access Token** di Airtable:

1. Vai su [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Crea un nuovo token con scope:
   - `data.records:read`
   - `data.records:write`
3. Aggiungi la base DirtyTag agli accessi
4. Copia il token (inizia con `pat...`)

### 2. Base ID e Table ID

I tool sono preconfigurati per la base DirtyTag 3.0:

```javascript
const BASE_ID = 'apptD8GSxN3vhhivI';
const INVENTARIO_TABLE = 'tblddAcLcQAyk050u';
```

Per usare una base diversa, modifica questi valori nel file HTML.

### 3. Google Drive (Opzionale)

Per visualizzare le thumbnail delle foto da Google Drive, le immagini devono essere condivise pubblicamente o con link.

---

## 🖥 Utilizzo

1. Apri il file HTML nel browser
2. Inserisci la API Key di Airtable
3. Clicca "Avvia"

I token vengono salvati in `localStorage` per sessioni future.

---

## 📁 Struttura File

```
dirtytag-webapps/
├── README.md
├── ai_photo_qc.html          # AI Photo QC Review
├── label_verifier.html       # Label Verifier
└── assets/
    └── screenshots/          # Screenshot per documentazione
```

---

## 🎨 Design System

Entrambi i tool condividono lo stesso design system:

- **Font**: JetBrains Mono (monospace), Space Grotesk (headings)
- **Tema**: Dark mode nativo
- **Colori**:
  - 🔴 Accent Red: `#e31e24`
  - 🟢 Success Green: `#00d26a`
  - 🔵 Info Blue: `#3b82f6`
  - 🟡 Warning Yellow: `#eab308`
  - 🟣 Purple (Label Verifier): `#a855f7`

---

## 🔗 Integrazione n8n

I tool sono progettati per integrarsi con workflow n8n:

### AI Photo QC → n8n

Quando un prodotto viene **rigenerato**:
- `AI_Quality_Check` = `REJECTED`
- `AI_Regenerate_Trigger` = `true`
- `AI_Regen_Scope` = `FRONT` | `BACK` | `BOTH`

Il workflow n8n può triggerarsi su questi campi per avviare la rigenerazione automatica.

### Label Verifier → n8n

I campi `Tagged_Checkbox` e `To_Check` possono essere usati per:
- Generare report degli articoli da verificare
- Automatizzare la gestione dell'inventario
- Sincronizzare con altri sistemi

---

## 📋 Changelog

### v3.0 (Gennaio 2026)
- ✨ Nuovo Label Verifier con counter da Airtable
- ✨ Funzionalità DEFERRED per AI Photo QC
- 🎨 Design system unificato
- ⚡ Ottimizzazioni performance
- 🐛 Fix ricerca SKU

### v2.0
- 🚀 AI Photo QC con versioning
- 🔄 Rigenerazione selettiva FRONT/BACK

### v1.0
- 📦 Release iniziale

---

## 🤝 Contributi

Per bug report o feature request, contatta il team DirtyTag.

---

## 📄 Licenza

Proprietario — DirtyTag © 2026
