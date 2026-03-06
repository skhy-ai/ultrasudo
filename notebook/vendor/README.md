# Notebook vendor libraries

This folder contains local copies of third-party libraries used by the Notebook app for export:

- html-docx-js (html-docx.js)
- html2pdf.js (html2pdf.bundle.min.js)

They are referenced by `notebook/index.html` with a CDN fallback. To ensure fully offline operation, download the files below and place them here with the exact filenames.

Manual download URLs:
- https://unpkg.com/html-docx-js/dist/html-docx.js
- https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js

Place them as:
- vendor/html-docx.js
- vendor/html2pdf.bundle.min.js

On Windows PowerShell, you can run:

```powershell
$root = "$PSScriptRoot"; if (-not $root) { $root = (Get-Location).Path }
$dest = Join-Path $root 'vendor'; New-Item -ItemType Directory -Path $dest -Force | Out-Null
Invoke-WebRequest 'https://unpkg.com/html-docx-js/dist/html-docx.js' -OutFile (Join-Path $dest 'html-docx.js')
Invoke-WebRequest 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js' -OutFile (Join-Path $dest 'html2pdf.bundle.min.js')
```

After placing the files, the app will use the local copies automatically and only fall back to CDN if a file is missing.
