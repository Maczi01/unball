# AI Photo Analysis with Google Gemini

This feature uses Google Gemini AI to automatically analyze uploaded football photos and suggest metadata.

## Setup

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new API key
4. Copy your API key

### 2. Configure Environment Variable

Add your API key to your `.env.local` file:

```bash
GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Keep this key secret! Never commit it to version control.

## How It Works

### User Flow

1. User uploads a photo in the submission form
2. "Analyze with AI" button appears below the photo preview
3. Click the button to trigger AI analysis (takes 2-5 seconds)
4. Form fields are automatically filled with AI suggestions:
   - **Year** - Estimated based on image quality, kits, stadium features
   - **Place/Location** - City, Country from stadium/context
   - **Competition** - e.g., Premier League, Champions League, World Cup
   - **Description** - Brief 1-2 sentence description of the scene
   - **Tags** - Relevant keywords (match-action, celebration, historic-moment, etc.)
   - **Event Name** - Stadium name if detected

### AI Confidence Levels

The AI provides a confidence rating for its analysis:

- **High** - Very confident in the identification (visible jerseys, clear stadium, etc.)
- **Medium** - Reasonably confident but some uncertainty
- **Low** - Rough estimates only, should be manually verified

### What Gets Detected

**High Accuracy:**
- Stadium identification (from architecture/features)
- Teams/jerseys (colors, sponsors, kit designs)
- Scene context (match action, crowd, celebration)
- Visible text (banners, scoreboards via OCR)

**Medium Accuracy:**
- Approximate year/era (kit styles, image quality)
- Competition type (league, cup, international)

**Lower Accuracy:**
- Specific match dates
- Exact scores/results

## Technical Details

### Model

- Uses **Gemini 2.0 Flash Exp** model
- Fast analysis (2-5 seconds typical)
- Cost-effective (~$0.001-0.003 per image with free tier)

### Implementation

- **Service:** `src/lib/services/photo-analysis.service.ts`
- **Component:** `src/components/PhotoSubmissionForm.tsx`
- **Type Safety:** Full TypeScript typing with `PhotoAnalysisResult` interface

### Error Handling

- API key missing → Clear error message
- Network errors → Retry prompt
- Invalid responses → Falls back gracefully
- Analysis errors → User can still submit manually

## Free Tier Limits

Google Gemini offers a generous free tier:

- **15 requests per minute**
- **1500 requests per day**
- More than enough for typical usage

[Check current limits](https://ai.google.dev/pricing)

## Privacy & Security

- API key is **server-side only** (not exposed to browser)
- Images are sent to Google's API for analysis
- No images are stored by Gemini after analysis
- Results are not logged or persisted

## Troubleshooting

### "API key not configured" error

- Make sure `GOOGLE_GEMINI_API_KEY` is in your `.env.local` file
- Restart your dev server after adding the key

### Analysis is slow

- First request may take longer (cold start)
- Typical analysis is 2-5 seconds
- Large images (>5MB) may take longer

### Poor quality suggestions

- Low confidence = manual verification needed
- Old/grainy photos are harder to analyze
- Obscure stadiums may not be recognized
- AI works best with clear, high-quality photos

## Future Enhancements

Potential improvements:

- Stadium database for better location mapping
- Match database integration for date suggestions
- Player face recognition
- Automatic coordinate detection from stadium
- Batch analysis for multiple photos
