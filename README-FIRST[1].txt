Cornelia Investment Group lead-capture update

This zip includes:
- index.html: homepage version that keeps the realistic top image reference
- apply.html: apply page form
- styles.css
- script.js: updated marketing consent + lead capture + redirect logic
- config.js: Google Apps Script URL + NBC tracking link placeholder
- google-apps-script/Code.gs: backend code for your Google Sheet

Important steps:
1. Upload/replace these website files in GitHub.
2. Keep your existing assets folder/image if GitHub already has it.
   The homepage expects this image path:
   assets/0C58D411-3D8D-469E-B413-10E7F7C76BC5.jpeg
3. Open config.js and replace PASTE_NBC_TRACKING_LINK_HERE with your NBC tracking link.
4. In Google Apps Script, replace Code.gs with the included Code.gs.
5. Save and redeploy Apps Script.
6. Redeploy your website through Vercel/GitHub.

Sheet tabs required exactly:
- Cornelia investment group leads
- apply leads page

The redirect now happens only after the lead capture request is sent.
