(function () {
  const editor = document.getElementById('editor');
  if (!editor) {
    return;
  }

  const doc = document;
  const commandButtons = Array.from(doc.querySelectorAll('.toolbar button[data-command]'));
  const actionButtons = Array.from(doc.querySelectorAll('.toolbar button[data-action]'));
  const blockSelect = doc.getElementById('format-block');
  const fontFamilySelect = doc.getElementById('font-family');
  const fontSizeSelect = doc.getElementById('font-size');
  const fontColorInput = doc.getElementById('font-color');
  const highlightColorInput = doc.getElementById('highlight-color');
  const imageUploadInput = doc.getElementById('image-upload');
  const marginUnitSelect = doc.getElementById('margin-unit');
  const marginInputs = Array.from(doc.querySelectorAll('.margin-controls input[data-margin]'));
  const marginMenuButton = doc.getElementById('margin-menu-button');
  const marginMenu = doc.getElementById('margin-menu');
  const resetMarginsBtn = doc.getElementById('reset-margins');
  // Page setup controls
  const pageSizeSelect = doc.getElementById('page-size');
  const pageOrientationSelect = doc.getElementById('page-orientation');
  // Image properties panel controls
  const imagePanel = doc.getElementById('image-properties-panel');
  const closeImagePanelBtn = doc.getElementById('close-image-panel');
  const imageLayoutSelect = doc.getElementById('image-layout');
  const imageWidthRange = doc.getElementById('image-width');
  const imageBrightnessRange = doc.getElementById('image-brightness');
  const imageSaturationRange = doc.getElementById('image-saturation');
  const imageHueRange = doc.getElementById('image-hue');

  const DEFAULT_MARGIN = 2;
  const sides = ['top', 'right', 'bottom', 'left'];
  let selectedImage = null;

  const marginState = {
    unit: marginUnitSelect ? marginUnitSelect.value : 'cm',
    values: sides.reduce((acc, side) => {
      const input = marginInputs.find((el) => el.dataset.margin === side);
      const parsed = input ? parseFloat(input.value) : NaN;
      acc[side] = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MARGIN;
      if (input) {
        input.value = acc[side];
      }
      return acc;
    }, {})
  };

  function focusEditor() {
    editor.focus({ preventScroll: false });
  }

  function exec(command, value = null) {
    focusEditor();
    document.execCommand(command, false, value);
  }

  function applyMargins() {
    const unit = marginState.unit;
    sides.forEach((side) => {
      const cssValue = `${marginState.values[side]}${unit}`;
      editor.style.setProperty(`--margin-${side}`, cssValue);
    });
    editor.style.padding = `${marginState.values.top}${unit} ${marginState.values.right}${unit} ${marginState.values.bottom}${unit} ${marginState.values.left}${unit}`;
  }

  function convertMarginValue(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'cm' && toUnit === 'in') {
      return value / 2.54;
    }
    if (fromUnit === 'in' && toUnit === 'cm') {
      return value * 2.54;
    }
    return value;
  }

  function roundMargin(value) {
    return Math.round(value * 100) / 100;
  }

  function handleMarginInput(event) {
    const side = event.target.dataset.margin;
    const nextValue = parseFloat(event.target.value);
    if (!sides.includes(side)) return;
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      event.target.value = marginState.values[side];
      return;
    }
    marginState.values[side] = nextValue;
    applyMargins();
  }

  if (marginInputs.length) {
    marginInputs.forEach((input) => {
      input.addEventListener('change', handleMarginInput);
      input.addEventListener('blur', handleMarginInput);
    });
  }

  if (marginUnitSelect) {
    marginUnitSelect.addEventListener('change', (event) => {
      const newUnit = event.target.value;
      sides.forEach((side) => {
        const converted = convertMarginValue(marginState.values[side], marginState.unit, newUnit);
        marginState.values[side] = roundMargin(converted);
        const input = marginInputs.find((el) => el.dataset.margin === side);
        if (input) input.value = marginState.values[side];
      });
      marginState.unit = newUnit;
      applyMargins();
    });
  }

  function handleCommand(command) {
    switch (command) {
      case 'undo':
      case 'redo':
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikeThrough':
      case 'superscript':
      case 'subscript':
      case 'justifyLeft':
      case 'justifyCenter':
      case 'justifyRight':
      case 'justifyFull':
      case 'insertOrderedList':
      case 'insertUnorderedList':
      case 'indent':
      case 'outdent':
      case 'insertHorizontalRule':
      case 'unlink':
        exec(command);
        break;
      default:
        exec(command);
        break;
    }
  }

  commandButtons.forEach((button) => {
    button.addEventListener('click', () => handleCommand(button.dataset.command));
  });

  function promptForLink() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      alert('Please select the text you want to link.');
      return;
    }
    const url = prompt('Enter the hyperlink URL:', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

  function promptForImageUrl() {
    const url = prompt('Enter the image URL:');
    if (!url) return;
    exec('insertImage', url);
  }

  function handleImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      exec('insertImage', reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function insertTable() {
    const rows = parseInt(prompt('Number of rows?', '2'), 10);
    const cols = parseInt(prompt('Number of columns?', '2'), 10);
    if (!Number.isFinite(rows) || !Number.isFinite(cols) || rows <= 0 || cols <= 0) return;

    let tableHtml = '<table class="nb-table">';
    for (let r = 0; r < rows; r += 1) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c += 1) {
        tableHtml += '<td><br></td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><p><br></p>';

    focusEditor();
    document.execCommand('insertHTML', false, tableHtml);
  }

  function clearFormatting() {
    exec('removeFormat');
    exec('unlink');
  }

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      switch (action) {
        case 'createLink':
          promptForLink();
          break;
        case 'insertImageUrl':
          promptForImageUrl();
          break;
        case 'insertImageUpload':
          if (imageUploadInput) imageUploadInput.click();
          break;
        case 'insertTable':
          insertTable();
          break;
        case 'clearFormatting':
          clearFormatting();
          break;
        case 'insertPageBreak':
          insertPageBreak();
          break;
        default:
          break;
      }
    });
  });

  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', handleImageUpload);
  }
  // Image selection and properties panel behavior
  function openImagePanel(img) {
    if (!imagePanel) return;
    imagePanel.classList.remove('hidden');
    imagePanel.setAttribute('aria-hidden', 'false');
    // Populate UI from image
    const widthPct = Math.round((img.naturalWidth && img.width) ? (img.width / img.parentElement.clientWidth) * 100 : 100);
    if (imageWidthRange) imageWidthRange.value = Math.max(10, Math.min(100, widthPct || 100));
    // Parse current filter
    const style = getComputedStyle(img);
    const filter = style.filter || '';
    const bMatch = /brightness\(([^)]+)\)/.exec(filter);
    const sMatch = /saturate\(([^)]+)\)/.exec(filter);
    const hMatch = /hue-rotate\(([^)]+)\)/.exec(filter);
    if (imageBrightnessRange) imageBrightnessRange.value = bMatch ? Math.round(parseFloat(bMatch[1]) * 100) : 100;
    if (imageSaturationRange) imageSaturationRange.value = sMatch ? Math.round(parseFloat(sMatch[1]) * 100) : 100;
    if (imageHueRange) imageHueRange.value = hMatch ? parseInt(hMatch[1], 10) : 0;
    // Layout select based on classes
    if (imageLayoutSelect) {
      if (img.classList.contains('img-float-left')) imageLayoutSelect.value = 'float-left';
      else if (img.classList.contains('img-float-right')) imageLayoutSelect.value = 'float-right';
      else if (img.classList.contains('img-center')) imageLayoutSelect.value = 'center';
      else if (img.classList.contains('img-block')) imageLayoutSelect.value = 'block';
      else imageLayoutSelect.value = 'inline';
    }
  }

  function closeImagePanel() {
    if (!imagePanel) return;
    imagePanel.classList.add('hidden');
    imagePanel.setAttribute('aria-hidden', 'true');
  }

  function selectImage(img) {
    if (selectedImage && selectedImage !== img) {
      selectedImage.classList.remove('selected-image');
    }
    selectedImage = img;
    selectedImage.classList.add('selected-image');
    openImagePanel(selectedImage);
  }

  editor.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') {
      selectImage(t);
    } else if (!imagePanel || !imagePanel.contains(t)) {
      if (selectedImage) selectedImage.classList.remove('selected-image');
      selectedImage = null;
      closeImagePanel();
    }
  });

  if (closeImagePanelBtn) {
    closeImagePanelBtn.addEventListener('click', () => {
      if (selectedImage) selectedImage.classList.remove('selected-image');
      selectedImage = null;
      closeImagePanel();
    });
  }

  function applyImageLayout(val) {
    if (!selectedImage) return;
    selectedImage.classList.remove('img-block', 'img-center', 'img-float-left', 'img-float-right');
    switch (val) {
      case 'block':
        selectedImage.classList.add('img-block');
        break;
      case 'center':
        selectedImage.classList.add('img-center');
        break;
      case 'float-left':
        selectedImage.classList.add('img-float-left');
        break;
      case 'float-right':
        selectedImage.classList.add('img-float-right');
        break;
      default:
        // inline: no extra class
        break;
    }
  }

  function applyImageFilters() {
    if (!selectedImage) return;
    const b = imageBrightnessRange ? parseInt(imageBrightnessRange.value || '100', 10) : 100;
    const s = imageSaturationRange ? parseInt(imageSaturationRange.value || '100', 10) : 100;
    const h = imageHueRange ? parseInt(imageHueRange.value || '0', 10) : 0;
    selectedImage.style.filter = `brightness(${b / 100}) saturate(${s / 100}) hue-rotate(${h}deg)`;
  }

  if (imageLayoutSelect) {
    imageLayoutSelect.addEventListener('change', (e) => applyImageLayout(e.target.value));
  }
  if (imageWidthRange) {
    imageWidthRange.addEventListener('input', (e) => {
      if (!selectedImage) return;
      const pct = Math.max(10, Math.min(100, parseInt(e.target.value, 10) || 100));
      selectedImage.style.width = pct + '%';
      selectedImage.style.height = 'auto';
    });
  }
  if (imageBrightnessRange) imageBrightnessRange.addEventListener('input', applyImageFilters);
  if (imageSaturationRange) imageSaturationRange.addEventListener('input', applyImageFilters);
  if (imageHueRange) imageHueRange.addEventListener('input', applyImageFilters);
  // Margin menu toggle and reset wiring
  function setMarginMenuOpen(isOpen) {
    if (!marginMenu || !marginMenuButton) return;
    marginMenu.classList.toggle('active', isOpen);
    marginMenu.setAttribute('aria-hidden', String(!isOpen));
    marginMenuButton.setAttribute('aria-expanded', String(isOpen));
  }

  if (marginMenuButton && marginMenu) {
    setMarginMenuOpen(false);
    marginMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !(marginMenu.classList.contains('active'));
      setMarginMenuOpen(isOpen);
    });
    document.addEventListener('click', (e) => {
      if (!marginMenu.classList.contains('active')) return;
      const withinMenu = marginMenu.contains(e.target);
      const withinButton = marginMenuButton.contains(e.target);
      if (!withinMenu && !withinButton) setMarginMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMarginMenuOpen(false);
    });
  }

  if (resetMarginsBtn) {
    resetMarginsBtn.addEventListener('click', () => {
      resetMarginsToDefaults();
    });
  }

  if (blockSelect) {
    blockSelect.addEventListener('change', (event) => {
      const value = event.target.value;
      focusEditor();
      if (value === 'BLOCKQUOTE') {
        document.execCommand('formatBlock', false, 'blockquote');
      } else if (value === 'PRE') {
        document.execCommand('formatBlock', false, 'pre');
      } else {
        document.execCommand('formatBlock', false, value);
      }
    });
  }

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (event) => {
      exec('fontName', event.target.value);
    });
  }

  const fontSizeMap = {
    '10': 2,
    '12': 3,
    '14': 4,
    '16': 5,
    '18': 5,
    '24': 6,
    '32': 7
  };

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (event) => {
      const value = event.target.value;
      const sizeCommandValue = fontSizeMap[value] || 3;
      exec('fontSize', sizeCommandValue);
    });
  }

  if (fontColorInput) {
    fontColorInput.addEventListener('input', (event) => {
      exec('foreColor', event.target.value);
    });
  }

  if (highlightColorInput) {
    highlightColorInput.addEventListener('input', (event) => {
      const color = event.target.value || '#ffff00';
      if (!document.execCommand('hiliteColor', false, color)) {
        exec('backColor', color);
      }
    });
  }

  function buildDocumentHtml() {
    const unit = marginState.unit;
    const marginCss = `${marginState.values.top}${unit} ${marginState.values.right}${unit} ${marginState.values.bottom}${unit} ${marginState.values.left}${unit}`;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: ${marginCss};
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
    line-height: 1.5;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  table, th, td {
    border: 1px solid #666;
  }
  th, td {
    padding: 6px;
  }
  .page-break { page-break-after: always; break-after: page; }
</style>
</head>
<body>${editor.innerHTML}</body>
</html>`;
  
  function convertMarginsToInches() {
    return sides.map((side) => roundMargin(convertMarginValue(marginState.values[side], marginState.unit, 'in')));
  }

  const docxButton = document.getElementById('download-docx');
  if (docxButton) {
    docxButton.addEventListener('click', () => {
      if (!window.htmlDocx || !window.htmlDocx.asBlob) {
        alert('DOCX export library is not available.');
        return;
      }
      const source = buildDocumentHtml();
      const blob = window.htmlDocx.asBlob(source);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'notebook.docx';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  const pdfButton = document.getElementById('download-pdf');
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      if (typeof html2pdf !== 'function') {
        alert('PDF export library is not available.');
        return;
      }
      // html2pdf expects [top, left, bottom, right]
      const [top, right, bottom, left] = convertMarginsToInches();
      const margins = [top, left, bottom, right];
      const format = pageSizeSelect ? (pageSizeSelect.value === 'a4' ? 'a4' : 'letter') : 'letter';
      const orientation = pageOrientationSelect ? (pageOrientationSelect.value === 'landscape' ? 'landscape' : 'portrait') : 'portrait';
      html2pdf()
        .set({
          margin: margins,
          filename: 'notebook.pdf',
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format, orientation }
        })
        .from(editor)
        .save();
    });
  }

  applyMargins();

  function resetMarginsToDefaults() {
    marginState.unit = marginUnitSelect ? marginUnitSelect.value : 'cm';
    sides.forEach((side) => {
      marginState.values[side] = DEFAULT_MARGIN;
      const input = marginInputs.find((el) => el.dataset.margin === side);
      if (input) input.value = DEFAULT_MARGIN;
    });
    applyMargins();
  }

  function insertPageBreak() {
    focusEditor();
    document.execCommand('insertHTML', false, '<hr class="page-break">');
  }

  function serialize() {
    return JSON.stringify({
      version: 1,
      content: editor.innerHTML,
      margins: marginState.values,
      unit: marginState.unit,
      page: {
        size: pageSizeSelect ? pageSizeSelect.value : 'letter',
        orientation: pageOrientationSelect ? pageOrientationSelect.value : 'portrait'
      }
    });
  }

  function deserialize(raw) {
    if (!raw) {
      editor.innerHTML = '';
      resetMarginsToDefaults();
      return;
    }
    try {
      const data = JSON.parse(raw);
      editor.innerHTML = data.content || '';
      const unit = data.unit || marginState.unit;
      if (marginUnitSelect) {
        marginUnitSelect.value = unit;
      }
      sides.forEach((side) => {
        const value = data.margins && Number.isFinite(data.margins[side]) ? data.margins[side] : DEFAULT_MARGIN;
        marginState.values[side] = value;
        const input = marginInputs.find((el) => el.dataset.margin === side);
        if (input) input.value = marginState.values[side];
      });
      marginState.unit = unit;
      applyMargins();
      // Restore page settings
      const page = data.page || {};
      if (pageSizeSelect && page.size) pageSizeSelect.value = page.size;
      if (pageOrientationSelect && page.orientation) pageOrientationSelect.value = page.orientation;
      applyPageClass();
    } catch (error) {
      editor.innerHTML = raw;
      resetMarginsToDefaults();
    }
  }

  window.Notebook = {
    serialize,
    deserialize,
    getHtml: () => editor.innerHTML,
    getMargins: () => ({ ...marginState.values, unit: marginState.unit })
  };

  // Page size/orientation visual classes for the editor canvas
  function applyPageClass() {
    const size = pageSizeSelect ? pageSizeSelect.value : 'letter';
    const orientation = pageOrientationSelect ? pageOrientationSelect.value : 'portrait';
    document.body.classList.remove('page-letter', 'page-a4', 'portrait', 'landscape');
    document.body.classList.add(size === 'a4' ? 'page-a4' : 'page-letter');
    document.body.classList.add(orientation === 'landscape' ? 'landscape' : 'portrait');
  }
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', applyPageClass);
  if (pageOrientationSelect) pageOrientationSelect.addEventListener('change', applyPageClass);
  applyPageClass();
})();
