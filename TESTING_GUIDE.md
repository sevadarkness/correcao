# Testing Guide - Complete Functionalities Implementation

## Overview
This guide describes how to test the newly implemented functionalities:
1. Top Panel tab switching
2. Side Panel content visibility based on tab selection
3. Mass sending (campaign) functionality

## Prerequisites
- Chrome browser with Developer Mode enabled
- WhatsApp Web account logged in
- Extension loaded in Chrome

## Installation Steps

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `/home/runner/work/correcao/correcao` directory
5. Extension should appear in the extensions list

## Testing Procedure

### Part 1: Top Panel Tab Switching

1. **Open WhatsApp Web**
   - Navigate to https://web.whatsapp.com
   - Ensure you're logged in

2. **Open Side Panel**
   - Click the extension icon in Chrome toolbar
   - Side panel should open on the right
   - Top panel bar should appear at the top of WhatsApp Web page

3. **Test Tab Switching**
   - Click on "Principal" tab in Top Panel
     - ✅ Tab should highlight with green background
     - ✅ Side Panel should show Step 1 (Load Groups)
   
   - Click on "Extrator" tab in Top Panel
     - ✅ Tab should highlight with green background
     - ✅ Side Panel should show Step 2 (Select Group)
   
   - Click on "Grupos" tab in Top Panel
     - ✅ Tab should highlight with green background
     - ✅ Side Panel should show Step 2 (Select Group)
   
   - Click on "Recover" tab in Top Panel
     - ✅ Tab should highlight with green background
     - ✅ Side Panel should show Step 4 (History)
   
   - Click on "Config" tab in Top Panel
     - ✅ Tab should highlight with green background
     - ✅ Side Panel should show Step 5 (Campaign/Config)

4. **Check Console Logs**
   - Open DevTools (F12)
   - Check Console tab for messages:
     - `[TopPanel] Tab clicked: <tabName>`
     - `[TopPanel] Tab switch message sent successfully`
     - `[WA Extractor] Tab switch requested: <tabName>`
     - `[SidePanel] Tab switch received: <tabName>`
     - `[SidePanel] Switching to tab: <tabName>`

### Part 2: Campaign (Mass Sending) Functionality

**⚠️ IMPORTANT: Test with caution! This sends real messages to WhatsApp contacts.**

1. **Navigate to Campaign Section**
   - Click "Config" tab in Top Panel OR
   - Click the 📢 button in Side Panel header
   - Should show Step 5 (Campaign section)

2. **Prepare Test Data**
   - In "Números" textarea, enter test phone numbers (one per line):
     ```
     5511999998888
     5511999997777
     ```
   - In "Mensagem" textarea, enter a test message:
     ```
     Teste de envio automático - favor ignorar
     ```

3. **Generate Queue**
   - Click "Gerar Fila" button
   - ✅ Should show success message: "✅ Fila gerada com X contatos!"
   - ✅ Statistics should update (Pending count)
   - ✅ Queue table should appear with phone numbers
   - ✅ Controls should appear (Iniciar, Pausar, Parar buttons)

4. **Test Campaign Start (DRY RUN RECOMMENDED)**
   - **Before starting**: Consider commenting out the `clickSendButton()` call in content.js for dry run
   - Click "Iniciar Campanha" button
   - ✅ Should change to "Pausar" button
   - ✅ Progress bar should appear
   - ✅ Should navigate to first contact's chat
   - ✅ Should type message in input field
   - ✅ Should wait for random delay
   - ✅ Should proceed to next contact

5. **Test Pause/Resume**
   - While campaign is running, click "Pausar"
   - ✅ Button should change to "▶️ Continuar"
   - ✅ Campaign should pause (check console for "Campaign paused")
   - Click "▶️ Continuar"
   - ✅ Button should change back to "⏸️ Pausar"
   - ✅ Campaign should resume

6. **Test Stop**
   - While campaign is running, click "Parar"
   - ✅ Should show confirmation dialog
   - ✅ After confirming, campaign should stop
   - ✅ Button should reset to "Iniciar Campanha"

### Part 3: Integration Testing

1. **Tab Switching During Campaign**
   - Start a campaign
   - Switch tabs in Top Panel
   - ✅ Tab should switch correctly
   - ✅ Campaign should continue running in background
   - ✅ Can return to campaign tab to see progress

2. **Multiple WhatsApp Tabs**
   - Open multiple WhatsApp Web tabs
   - Open Side Panel
   - Switch tabs in Top Panel
   - ✅ All WhatsApp tabs should receive tab switch message
   - ✅ Top Panel should update in all tabs

## Console Logging

Watch for these key console messages:

### Background Script
- `[WA Extractor] Tab switch requested: <tabName>`
- `[WA Extractor] 🚀 Iniciando campanha...`
- `[WA Extractor] ⏸️ Pausando campanha...`
- `[WA Extractor] ▶️ Retomando campanha...`
- `[WA Extractor] ⏹️ Parando campanha...`

### Content Script
- `[WA Extractor] Switching to tab: <tabName>`
- `[WA Extractor] Processing campaign step for: <phone>`
- `[WA Extractor] Message sent successfully to: <phone>`

### Top Panel
- `[TopPanel] Tab clicked: <tabName>`
- `[TopPanel] Tab switch message sent successfully`
- `[TopPanel] Received tab switch event: <tabName>`

### Side Panel
- `[SidePanel] Tab switch received: <tabName>`
- `[SidePanel] Switching to tab: <tabName>`
- `[SidePanel] Starting campaign...`
- `[SidePanel] Message sent to: <phone>`
- `[SidePanel] Campaign finished`

## Expected Results

### ✅ Success Criteria
- [ ] Top Panel tabs switch correctly and highlight
- [ ] Side Panel content changes based on selected tab
- [ ] Campaign queue generates correctly from phone numbers
- [ ] Campaign starts and processes messages sequentially
- [ ] Campaign can be paused and resumed
- [ ] Campaign can be stopped
- [ ] Progress updates in real-time
- [ ] Statistics (sent, failed, pending) update correctly
- [ ] Random delays work between messages
- [ ] No JavaScript errors in console

### ❌ Known Limitations
- WhatsApp Web may block rapid message sending
- Phone number validation is basic (assumes valid numbers)
- No retry logic for failed messages yet
- Image attachment in campaign not fully tested

## Troubleshooting

### Issue: Tab doesn't switch
- Check console for errors
- Verify `chrome.runtime.sendMessage` succeeded
- Check if background script is running (check `chrome://extensions/`)

### Issue: Campaign doesn't start
- Ensure WhatsApp Web tab is open and active
- Check if phone numbers are valid format
- Verify message field is not empty
- Check console for error messages

### Issue: Messages not sending
- WhatsApp input field selectors may have changed
- Check if chat opens correctly for each number
- Verify you're not rate-limited by WhatsApp

### Issue: Top Panel doesn't appear
- Check if Side Panel is open
- Verify content script loaded (check DevTools > Sources)
- Check if WhatsApp Web is fully loaded

## Security Notes

- Never test with production phone numbers
- Use test accounts only
- Be aware of WhatsApp's anti-spam policies
- Messages ARE sent for real - there is no "test mode"
- Consider adding delays of 30-60 seconds between messages in production

## Next Steps for Production

1. Add phone number validation and formatting
2. Add retry logic for failed messages
3. Add rate limiting to avoid WhatsApp blocks
4. Add message templates with variable replacement
5. Add image/media attachment support
6. Add campaign scheduling
7. Add detailed logging and reporting
8. Add export of campaign results
