# Daily Set Auto-Publishing Cron Setup

This guide explains how to set up automatic daily set publishing at 00:00 UTC.

## Overview

The cron job calls `/api/cron/publish-daily-set` daily to automatically publish the scheduled daily set. This ensures players always have fresh content without manual intervention.

## Security

The endpoint is protected by a `CRON_SECRET` environment variable. All requests must include this secret in the `Authorization` header:

```
Authorization: Bearer YOUR_CRON_SECRET
```

## Setup Instructions by Platform

### 1. Vercel (Recommended)

Vercel provides native cron job support.

**Step 1: Create vercel.json**

Create or update `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-daily-set",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Step 2: Set Environment Variable**

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a secure random string (e.g., `openssl rand -base64 32`)
   - **Environment:** Production (and Preview if testing)

**Step 3: Deploy**

```bash
git add vercel.json
git commit -m "Add cron job configuration"
git push
```

Vercel automatically sets the `Authorization` header using your `CRON_SECRET`.

**Verify:**
- Check Vercel dashboard > Cron Jobs tab
- View execution logs in Vercel Functions logs

---

### 2. GitHub Actions

Use GitHub Actions as a free external scheduler.

**Step 1: Create Workflow File**

Create `.github/workflows/daily-publish.yml`:

```yaml
name: Publish Daily Set

on:
  schedule:
    # Runs at 00:00 UTC daily
    - cron: '0 0 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Call publish endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/publish-daily-set \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail-with-body

      - name: Notify on failure
        if: failure()
        run: |
          echo "Failed to publish daily set"
          # Optional: Add notification logic (email, Slack, etc.)
```

**Step 2: Add GitHub Secret**

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Click **New repository secret**
   - **Name:** `CRON_SECRET`
   - **Value:** Same secure random string used in your deployment

**Step 3: Update Production Environment Variable**

Ensure your production environment has `CRON_SECRET` set to the same value.

**Verify:**
- Go to Actions tab in GitHub
- You can manually trigger via "Run workflow" button
- Check run history and logs

---

### 3. Render

Render supports cron jobs natively.

**Step 1: Create Cron Job**

1. In Render dashboard, go to your service
2. Navigate to **Cron Jobs** tab
3. Click **Add Cron Job**
   - **Name:** Publish Daily Set
   - **Command:**
     ```bash
     curl -X POST https://your-render-app.onrender.com/api/cron/publish-daily-set \
       -H "Authorization: Bearer $CRON_SECRET"
     ```
   - **Schedule:** `0 0 * * *` (cron syntax)

**Step 2: Set Environment Variable**

1. Go to **Environment** tab
2. Add `CRON_SECRET` with a secure random value

**Verify:**
- Check Cron Jobs tab for execution history
- View logs in Events tab

---

### 4. Railway

Railway supports cron jobs.

**Step 1: Create railway.json**

Create `railway.json` in your project root:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "cron": [
    {
      "schedule": "0 0 * * *",
      "command": "curl -X POST https://your-railway-app.railway.app/api/cron/publish-daily-set -H \"Authorization: Bearer $CRON_SECRET\""
    }
  ]
}
```

**Step 2: Set Environment Variable**

1. Go to your Railway project
2. Navigate to Variables tab
3. Add `CRON_SECRET`

**Step 3: Deploy**

Railway will automatically pick up the cron configuration.

---

### 5. AWS EventBridge + Lambda

For AWS-hosted applications.

**Step 1: Create Lambda Function**

Create a Lambda function with this code:

```javascript
// lambda/publishDailySet.js
export const handler = async (event) => {
  const response = await fetch(process.env.APP_URL + '/api/cron/publish-daily-set', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to publish: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Publish result:', data);

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
```

**Step 2: Set Environment Variables in Lambda**

- `APP_URL`: Your application URL
- `CRON_SECRET`: Your secure secret

**Step 3: Create EventBridge Rule**

1. Go to Amazon EventBridge
2. Create rule with schedule expression: `cron(0 0 * * ? *)`
3. Set target to your Lambda function

---

### 6. Google Cloud Scheduler

For Google Cloud Platform.

**Step 1: Create Cloud Scheduler Job**

```bash
gcloud scheduler jobs create http publish-daily-set \
  --schedule="0 0 * * *" \
  --uri="https://your-app.com/api/cron/publish-daily-set" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_SECRET" \
  --time-zone="UTC"
```

**Step 2: Set Environment Variable**

Ensure your app has `CRON_SECRET` set in Cloud Run or App Engine environment variables.

---

### 7. Self-Hosted / Node.js Cron (node-cron)

If you have a long-running Node.js process.

**Step 1: Install node-cron**

```bash
npm install node-cron
```

**Step 2: Create Cron Task**

Create `scripts/dailyPublish.js`:

```javascript
import cron from 'node-cron';

// Run at 00:00 UTC daily
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily publish task...');

  try {
    const response = await fetch('http://localhost:3000/api/cron/publish-daily-set', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Publish result:', data);

    if (!data.success) {
      // Send alert
      console.error('Failed to publish daily set:', data.message);
    }
  } catch (error) {
    console.error('Error calling publish endpoint:', error);
  }
}, {
  timezone: "UTC"
});

console.log('Daily publish cron job scheduled');
```

**Step 3: Start Cron Process**

Add to your server startup or run as a separate process.

---

## Testing

### Test the Endpoint Manually

```bash
# Replace with your actual domain and CRON_SECRET
curl -X POST https://your-domain.com/api/cron/publish-daily-set \
  -H "Authorization: Bearer your-cron-secret-here" \
  -H "Content-Type: application/json"
```

Expected successful response:

```json
{
  "success": true,
  "message": "Successfully published daily set for 2025-11-02",
  "daily_set_id": "uuid-here",
  "date_utc": "2025-11-02",
  "was_already_published": false,
  "timestamp": "2025-11-02T00:00:01.234Z"
}
```

### Health Check (No Auth Required)

Check the status without publishing:

```bash
curl https://your-domain.com/api/cron/publish-daily-set
```

Response:

```json
{
  "today": "2025-11-02",
  "set_exists": true,
  "is_published": false,
  "daily_set_id": "uuid-here",
  "message": "Today's set exists but is not yet published",
  "timestamp": "2025-11-01T23:59:00.000Z"
}
```

---

## Monitoring & Alerts

### Log Monitoring

All platforms log cron execution. Check:
- Vercel: Functions > Logs
- GitHub Actions: Actions tab > Workflow runs
- Render: Events tab
- Railway: Deployments > Logs

### Failure Alerts

When a daily set is missing, the cron job will fail. Set up alerts:

**Vercel:**
- Vercel automatically sends deployment and function error emails
- Configure notifications in Project Settings

**GitHub Actions:**
- Enable workflow notifications in Settings > Notifications
- Add Slack/Discord webhook in workflow (see example below)

**Example Slack Notification (GitHub Actions):**

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "⚠️ Daily set publish failed for ${{ env.DATE }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Troubleshooting

### Cron job runs but nothing happens

1. Check if `CRON_SECRET` environment variable is set correctly
2. Verify the Authorization header is being sent
3. Check application logs for errors
4. Test the endpoint manually with curl

### "No daily set scheduled for today" error

1. Log into admin panel at `/admin/daily-sets`
2. Verify a set exists for today's date (UTC)
3. Check that the set has exactly 5 photos
4. Manually publish the set if needed

### Time zone issues

- Always use UTC for scheduling
- The endpoint uses `new Date().toISOString().split("T")[0]` for UTC date
- Verify your cron schedule is in UTC time

### Unauthorized errors

- Ensure `CRON_SECRET` matches between:
  - Environment variable in your app
  - Secret used in cron job
- Check that the Authorization header format is correct: `Bearer YOUR_SECRET`

---

## Best Practices

1. **Schedule buffer:** Keep at least 7 days of daily sets scheduled ahead
2. **Monitor dashboard:** Check the admin dashboard regularly for warnings
3. **Test before deploying:** Always test the endpoint manually after changes
4. **Backup plan:** Have a fallback set ready in case of emergencies
5. **Alert setup:** Configure failure notifications to catch issues early
6. **Logs retention:** Keep logs for at least 30 days for debugging

---

## Environment Variable Example

Add to your `.env` file (for local testing):

```env
# Generate with: openssl rand -base64 32
CRON_SECRET=your-secure-random-string-here
```

Add to your `.env.example`:

```env
# Cron job secret for auto-publishing daily sets
CRON_SECRET=
```

---

## Next Steps

1. Choose a platform from the options above
2. Generate a secure `CRON_SECRET`
3. Set up the cron job configuration
4. Test the endpoint manually
5. Wait for the scheduled time (or trigger manually)
6. Monitor logs to verify success
7. Set up failure alerts

The daily set will now automatically publish at 00:00 UTC every day! 🎉
