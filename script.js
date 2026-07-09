/* ===========================================================
   Icon QR Generator — logic
   Uses the qr-code-styling library (loaded via CDN in index.html)
   https://github.com/kozakdenys/qr-code-styling
   =========================================================== */

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  // ---- element references ----
  var form = $("qr-form");
  var textInput = $("text-input");
  var textError = $("text-error");

  var dropzone = $("dropzone");
  var imageInput = $("image-input");
  var imagePreview = $("image-preview");
  var dropzonePlaceholder = $("dropzone-placeholder");
  var clearImageBtn = $("clear-image-btn");

  var qrContainer = $("qr-container");
  var qrHint = $("qr-hint");
  var qrPlaceholder = $("qr-placeholder");

  var customizePanel = $("customize-panel");
  var resetOptionsBtn = $("reset-options-btn");
  var logoGroup = $("logo-group");
  var dotsGradientControls = $("dots-gradient-controls");

  // ---- state ----
  var selectedImageDataUrl = null; // data URL of the logo image, or null if none chosen
  var qrCodeInstance = null; // current QRCodeStyling instance (for download on click)

  // ---- customization defaults (id -> value) ----
  var DEFAULTS = {
    "opt-size": "280",
    "opt-margin": "8",
    "opt-shape": "square",
    "opt-ecl": "auto",
    "opt-format": "png",
    "opt-dots-type": "rounded",
    "opt-dots-color": "#1c1d2b",
    "opt-dots-gradient": false,
    "opt-dots-color2": "#5a4bff",
    "opt-dots-gtype": "linear",
    "opt-dots-grot": "0",
    "opt-cs-type": "extra-rounded",
    "opt-cs-color": "#1c1d2b",
    "opt-cd-type": "",
    "opt-cd-color": "#1c1d2b",
    "opt-bg-transparent": false,
    "opt-bg-color": "#ffffff",
    "opt-bg-round": "0",
    "opt-logo-size": "0.38",
    "opt-logo-margin": "6",
    "opt-logo-hidedots": true
  };

  // ===========================================================
  // Image selection (click-to-browse + drag & drop)
  // ===========================================================

  dropzone.addEventListener("click", function () {
    imageInput.click();
  });

  dropzone.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      imageInput.click();
    }
  });

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    if (file) {
      handleImageFile(file);
    }
  });

  ["dragenter", "dragover"].forEach(function (eventName) {
    dropzone.addEventListener(eventName, function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "dragend"].forEach(function (eventName) {
    dropzone.addEventListener(eventName, function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", function (event) {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("dragover");

    var files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length > 0) {
      var file = files[0];
      if (file.type && file.type.indexOf("image/") === 0) {
        handleImageFile(file);
      }
    }
  });

  clearImageBtn.addEventListener("click", function (event) {
    event.stopPropagation(); // don't let the click bubble to the dropzone and reopen the browser
    resetImageSelection();
  });

  function handleImageFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      selectedImageDataUrl = e.target.result;
      imagePreview.src = selectedImageDataUrl;
      imagePreview.hidden = false;
      dropzonePlaceholder.hidden = true;
      clearImageBtn.hidden = false;
      logoGroup.disabled = false;
      renderPreview();
    };
    reader.readAsDataURL(file);
  }

  function resetImageSelection() {
    selectedImageDataUrl = null;
    imageInput.value = "";
    imagePreview.src = "";
    imagePreview.hidden = true;
    dropzonePlaceholder.hidden = false;
    clearImageBtn.hidden = true;
    logoGroup.disabled = true;
    renderPreview();
  }

  // ===========================================================
  // Text validation
  // ===========================================================

  function validateText() {
    var value = textInput.value.trim();
    if (!value) {
      textError.hidden = false;
      textInput.classList.add("input-error");
      return false;
    }
    textError.hidden = true;
    textInput.classList.remove("input-error");
    return true;
  }

  textInput.addEventListener("input", function () {
    // clear the error as soon as the user starts typing something valid
    if (textInput.value.trim()) {
      textError.hidden = true;
      textInput.classList.remove("input-error");
    }
    schedulePreview();
  });

  // ===========================================================
  // Customization panel
  // ===========================================================

  function updateValueLabels() {
    $("opt-size-val").textContent = $("opt-size").value + "px";
    $("opt-margin-val").textContent = $("opt-margin").value;
    $("opt-dots-grot-val").textContent = $("opt-dots-grot").value + "°";
    $("opt-bg-round-val").textContent = $("opt-bg-round").value;
    $("opt-logo-size-val").textContent = Math.round($("opt-logo-size").value * 100) + "%";
    $("opt-logo-margin-val").textContent = $("opt-logo-margin").value;
  }

  function updateDownloadHint() {
    qrHint.textContent = "Click to download " + $("opt-format").value.toUpperCase();
  }

  customizePanel.addEventListener("input", function () {
    updateValueLabels();
    updateDownloadHint();
    dotsGradientControls.hidden = !$("opt-dots-gradient").checked;
    renderPreview();
  });

  resetOptionsBtn.addEventListener("click", function () {
    Object.keys(DEFAULTS).forEach(function (id) {
      var control = $(id);
      if (typeof DEFAULTS[id] === "boolean") {
        control.checked = DEFAULTS[id];
      } else {
        control.value = DEFAULTS[id];
      }
    });
    updateValueLabels();
    updateDownloadHint();
    dotsGradientControls.hidden = true;
    renderPreview();
  });

  function buildOptions(data, imageDataUrl) {
    var size = Number($("opt-size").value);
    var format = $("opt-format").value;

    var ecl = $("opt-ecl").value;
    if (ecl === "auto") {
      // 'H' tolerates ~30% damage, needed when a logo covers part of the code
      ecl = imageDataUrl ? "H" : "Q";
    }

    var options = {
      type: format === "svg" ? "svg" : "canvas",
      shape: $("opt-shape").value,
      width: size,
      height: size,
      data: data,
      margin: Number($("opt-margin").value),
      qrOptions: {
        errorCorrectionLevel: ecl
      },
      dotsOptions: {
        type: $("opt-dots-type").value
      },
      backgroundOptions: {
        color: $("opt-bg-transparent").checked ? "rgba(255,255,255,0)" : $("opt-bg-color").value,
        round: Number($("opt-bg-round").value)
      },
      cornersSquareOptions: {
        color: $("opt-cs-color").value
      },
      cornersDotOptions: {
        color: $("opt-cd-color").value
      }
    };

    if ($("opt-dots-gradient").checked) {
      options.dotsOptions.gradient = {
        type: $("opt-dots-gtype").value,
        rotation: Number($("opt-dots-grot").value) * Math.PI / 180,
        colorStops: [
          { offset: 0, color: $("opt-dots-color").value },
          { offset: 1, color: $("opt-dots-color2").value }
        ]
      };
    } else {
      options.dotsOptions.color = $("opt-dots-color").value;
    }

    // empty type value = "match dots" -> omit so the library inherits the dot style
    var csType = $("opt-cs-type").value;
    if (csType) {
      options.cornersSquareOptions.type = csType;
    }
    var cdType = $("opt-cd-type").value;
    if (cdType) {
      options.cornersDotOptions.type = cdType;
    }

    if (imageDataUrl) {
      options.image = imageDataUrl;
      options.imageOptions = {
        crossOrigin: "anonymous",
        margin: Number($("opt-logo-margin").value),
        imageSize: Number($("opt-logo-size").value),
        hideBackgroundDots: $("opt-logo-hidedots").checked
      };
    }

    return options;
  }

  // ===========================================================
  // QR generation
  // ===========================================================

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateText()) {
      return; // no-op on invalid input, error already shown inline
    }

    generateQrCode(textInput.value.trim(), selectedImageDataUrl);
  });

  // ---- live preview ----
  // Renders as soon as there is text; clears back to the placeholder when
  // the text is emptied. Typing is debounced so we don't redraw per keystroke.
  var previewTimer = null;

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 250);
  }

  function renderPreview() {
    var value = textInput.value.trim();
    if (!value) {
      clearPreview();
      return;
    }
    generateQrCode(value, selectedImageDataUrl);
  }

  function clearPreview() {
    qrContainer.innerHTML = "";
    qrCodeInstance = null;
    qrContainer.hidden = true;
    qrHint.hidden = true;
    qrPlaceholder.hidden = false;
  }

  function generateQrCode(data, imageDataUrl) {
    // Clear any previous QR code so results don't stack.
    qrContainer.innerHTML = "";
    qrCodeInstance = null;

    qrCodeInstance = new QRCodeStyling(buildOptions(data, imageDataUrl));
    qrCodeInstance.append(qrContainer);

    qrPlaceholder.hidden = true;
    qrContainer.hidden = false;
    qrHint.hidden = false;
    updateDownloadHint();
  }

  // Click the generated QR code to download it in the chosen format.
  qrContainer.addEventListener("click", function () {
    if (!qrCodeInstance) {
      return;
    }
    qrCodeInstance.download({ name: "qr-code", extension: $("opt-format").value });
  });

  updateValueLabels();
  updateDownloadHint();
})();
