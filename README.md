# SKU Verifier — DirtyTag 3.0

Webapp per verifica rapida stato prodotto e validazione FileID foto.

## Features

- **Verifica Status Prodotto** — Pipeline state e metadata da Airtable
- **Browse Foto Cartella** — Tutte le immagini nella cartella Google Drive collegata
- **Validazione FRONT/BACK** — Check FileID selezionati vs contenuto cartella
- **Dark/Light Mode** — Supporto automatico tema sistema
- **Mobile Responsive** — Layout adattivo per tutti i dispositivi

## Setup Locale

1. Clone repository
```bash
git clone https://github.com/[username]/sku-verifier.git
cd sku-verifier
```

2. Apri `index.html` nel browser (o usa un server locale)
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve
```

3. Click **Settings** (⚙️) → Aggiungi Airtable PAT

4. (Opzionale) Aggiungi Google API Key per listing cartelle

## Deploy su GitHub Pages

1. Push repository su GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/sku-verifier.git
git push -u origin main
```

2. Settings → Pages → Deploy from main branch

3. Accedi a `https://[username].github.io/sku-verifier/`

## Configurazione

### Airtable PAT (Richiesto)

1. Vai su [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Crea nuovo Personal Access Token
3. Aggiungi scope: `data.records:read`
4. Aggiungi access alla base "DirtyTag 3.0"
5. Copia il token (inizia con `pat...`)
6. Incolla in Settings webapp

### Google API Key (Opzionale)

Necessario solo per listare contenuti cartelle Drive.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea progetto o seleziona esistente
3. APIs & Services → Enable APIs → Google Drive API
4. Credentials → Create Credentials → API Key
5. Restrict API Key a "Google Drive API" (consigliato)
6. Copia e incolla in Settings webapp

> **Nota:** Senza API Key, le cartelle mostreranno solo un link per aprirle manualmente in Drive.

## Struttura File

```
sku-verifier/
├── index.html          # Single page app
├── css/
│   └── styles.css      # Tutti gli stili
├── js/
│   ├── app.js          # Logica applicativa principale
│   ├── airtable.js     # Airtable API helpers
│   ├── drive.js        # Google Drive helpers
│   └── ui.js           # Manipolazione DOM
├── README.md           # Questa documentazione
└── .nojekyll           # Config GitHub Pages
```

## URL Parameters

Puoi linkare direttamente a uno SKU specifico:

```
https://[username].github.io/sku-verifier/?sku=MF-2411
```

## Keyboard Shortcuts

| Shortcut | Azione |
|----------|--------|
| `Enter` | Cerca SKU |
| `Ctrl/Cmd + K` | Focus campo ricerca |
| `Escape` | Chiudi modal settings |

## Sicurezza

- ✅ Token salvati solo in `localStorage` del browser locale
- ✅ Nessun token inviato a server esterni (solo Airtable/Google APIs)
- ✅ Non condividere URL con token embedded
- ⚠️ Ogni utente deve configurare i propri token

## Troubleshooting

### "Token non valido"
- Verifica che il PAT inizi con `pat`
- Controlla che il token abbia accesso alla base corretta
- Rigenera il token se necessario

### "SKU non trovato"
- Verifica formato: `XX-NNNN` (es. MF-2411)
- Controlla maiuscole/minuscole

### "Listing cartella non disponibile"
- Cartella non pubblica/condivisa
- API Key Google mancante o non valida
- API Drive non abilitata nel progetto Cloud

### Errori nella console
1. Apri Developer Tools (F12)
2. Tab Console
3. Cerca errori rossi per dettagli

## Test SKUs

Usa questi SKU per testing (verifica esistenza nel tuo database):

| SKU | Stato Atteso |
|-----|--------------|
| MF-2411 | AI_GENERATED |
| CG-2961 | RAW_PROCESSED |

---

**DirtyTag 3.0** — Vintage Fashion Automation
