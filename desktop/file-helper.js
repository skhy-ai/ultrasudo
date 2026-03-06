class FileHelper {
  static async saveText(filename, content) {
    if (window.electronAPI) {
      return await window.electronAPI.saveFile({ filename, content });
    } else {
      return new Promise((resolve) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve({ ok: true, msg: 'Saved via web download fallback' });
      });
    }
  }

  static async openText(accept = '.html,.txt,.md,.json') {
    if (window.electronAPI) {
      const acceptArray = accept.split(',').map(e => e.replace('.', ''));
      return await window.electronAPI.openFile({ filters: [{ name: 'Allowed Files', extensions: acceptArray }] });
    } else {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = e => {
          const file = e.target.files[0];
          if (!file) return resolve({ ok: false, error: 'No file selected' });
          const reader = new FileReader();
          reader.onload = e => resolve({ ok: true, content: e.target.result, file });
          reader.onerror = () => resolve({ ok: false, error: 'Read error' });
          reader.readAsText(file);
        };
        input.click();
      });
    }
  }
}
