# AI Report Generator - Backend

Backend server for portfolio extraction using Claude Vision API.

## What It Does

- Receives portfolio screenshot images from the frontend
- Sends them to Claude Vision API for analysis
- Extracts holding information (fund name, units, price, currency)
- Returns structured JSON data to the frontend

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` File

Copy `.env.example` to `.env` and add your API key:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Get your API key:**
1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Create a new API key
4. Copy it into `.env`

### 3. Start the Server

```bash
npm run dev
```

You should see:

```
[SERVER] Started on port 3001
[SERVER] API ready at http://localhost:3001/api/extract
```

## API Endpoints

### POST /api/extract

Extract portfolio holdings from an image.

**Request:**
- Method: `POST`
- Endpoint: `http://localhost:3001/api/extract`
- Body: FormData with `file` field (image)

**Response:**
```json
{
  "success": true,
  "holdings": [
    {
      "id": "holding-xxx",
      "fundName": "Vanguard Total US Stock",
      "units": 500,
      "unitPrice": 145.67,
      "currency": "USD",
      "fxRateToSgd": 1.35
    }
  ],
  "message": "Successfully extracted 5 holdings from the image"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to extract portfolio data: ..."
}
```

## Supported Image Formats

- JPEG
- PNG
- GIF
- WebP
- Max size: 10MB

## How It Works

1. **Frontend sends image** → Backend receives via `/api/extract`
2. **Backend converts image** → Base64 format
3. **Calls Claude Vision API** → Analyzes the image
4. **Parses response** → Extracts holding information
5. **Validates data** → Ensures correct format
6. **Returns JSON** → Frontend displays in table

## Debugging

Check console logs for `[SERVER]` and `[EXTRACTION_SERVICE]` messages.

Example console output:

```
[SERVER] Extract request received
[SERVER] File received: portfolio.png (image/png, 256KB)
[EXTRACTION_SERVICE] Starting extraction
[EXTRACTION_SERVICE] Got response from Claude
[EXTRACTION_SERVICE] Extracted 5 holdings
[SERVER] Extraction successful, returning 5 holdings
```

## Environment Variables

- **ANTHROPIC_API_KEY** - Your Claude API key (required)
- **PORT** - Server port (default: 3001)
- **NODE_ENV** - Environment (development/production)
- **FRONTEND_URL** - Frontend URL for CORS (default: http://localhost:3000)

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Check your `.env` file has the API key
- Make sure you're in the `/backend` directory when running `npm run dev`

### "Failed to extract portfolio data"
- Image might be unreadable or not a portfolio screenshot
- Try a clearer image with visible fund names and values
- Check image size is under 10MB

### "Cannot reach http://localhost:3001"
- Make sure backend is running (`npm run dev`)
- Check PORT in `.env` (default 3001)
- Firewall might be blocking the port

## Production Deployment

For production, you can deploy to:

- **Vercel** - `vercel deploy`
- **Railway** - `railway deploy`
- **Heroku** - `git push heroku main`
- **AWS/GCP/Azure** - Standard Node.js deployment

Set `NODE_ENV=production` and configure your API key as a secret/environment variable on the hosting platform.
