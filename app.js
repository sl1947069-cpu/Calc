'use strict';
/* Calculadora - lógica matemática (sin eval) e interfaz.
   Sin almacenamiento persistente: cada apertura comienza en cero. */

var Calc = (function () {
  var MAXDIG = 20;

  function round15(n) { return Number(n.toPrecision(15)); }

  function fmt(n) {
    if (n === 0) return '0';
    var s = String(round15(n));
    var m = /^(-?)(\d)(?:\.(\d+))?e([+-])(\d+)$/.exec(s);
    if (m) {
      var exp = parseInt(m[4] + m[5], 10);
      if (exp < 0 && exp >= -15) {
        s = m[1] + '0.' + new Array(-exp).join('0') + m[2] + (m[3] || '');
      }
    }
    return s;
  }

  function compute(a, op, b) {
    var r;
    if (op === '+') r = a + b;
    else if (op === '-') r = a - b;
    else if (op === '*') r = a * b;
    else if (op === '/') {
      if (b === 0) throw new Error(a === 0 ? 'Resultado no definido' : 'No se puede dividir por cero');
      r = a / b;
    } else throw new Error('Función no válida');
    r = round15(r);
    if (!isFinite(r)) throw new Error('Desbordamiento');
    return r;
  }

  function create() {
    var s = { cur: '0', fresh: true, acc: null, op: null, awaiting: false,
              afterEq: false, lastOp: null, lastOperand: null, mem: 0, error: null };

    function num() { return parseFloat(s.cur); }
    function guard(fn) {
      if (s.error) return;
      try { fn(); } catch (e) { s.error = e.message; }
    }
    function startEntry() {
      if (s.afterEq) { s.afterEq = false; s.op = null; s.acc = null; s.lastOp = null; }
    }
    function resetAll() {
      s.cur = '0'; s.fresh = true; s.acc = null; s.op = null; s.awaiting = false;
      s.afterEq = false; s.lastOp = null; s.lastOperand = null; s.error = null;
    }

    return {
      state: s,
      digit: function (d) { guard(function () {
        startEntry();
        if (s.fresh) { s.cur = d; s.fresh = false; }
        else {
          if (s.cur.replace(/[^0-9]/g, '').length >= MAXDIG) return;
          s.cur = (s.cur === '0') ? d : (s.cur === '-0') ? '-' + d : s.cur + d;
        }
        s.awaiting = false;
      }); },
      decimal: function () { guard(function () {
        startEntry();
        if (s.fresh) { s.cur = '0.'; s.fresh = false; }
        else if (s.cur.indexOf('.') < 0 && s.cur.indexOf('e') < 0) s.cur += '.';
        s.awaiting = false;
      }); },
      negate: function () { guard(function () {
        if (num() === 0) return;
        s.cur = (s.cur.charAt(0) === '-') ? s.cur.slice(1) : '-' + s.cur;
        s.awaiting = false;
      }); },
      backspace: function () { guard(function () {
        if (s.fresh) return;
        s.cur = s.cur.slice(0, -1);
        if (s.cur === '' || s.cur === '-' || s.cur === '-0') s.cur = '0';
      }); },
      ce: function () {
        if (s.error) { resetAll(); return; }
        s.cur = '0'; s.fresh = true; s.awaiting = false;
      },
      clear: function () { resetAll(); },
      operator: function (o) { guard(function () {
        var v = num();
        if (s.op && !s.awaiting) { s.acc = compute(s.acc, s.op, v); s.cur = fmt(s.acc); }
        else if (!s.op) { s.acc = v; }
        s.op = o; s.awaiting = true; s.fresh = true; s.afterEq = false; s.lastOp = null;
      }); },
      equals: function () { guard(function () {
        var v = num(), r;
        if (s.op) {
          r = compute(s.acc, s.op, v);
          s.lastOp = s.op; s.lastOperand = v; s.op = null; s.acc = null;
        } else if (s.lastOp) {
          r = compute(v, s.lastOp, s.lastOperand);
        } else return;
        s.cur = fmt(r); s.fresh = true; s.awaiting = false; s.afterEq = true;
      }); },
      percent: function () { guard(function () {
        if (s.op && s.acc !== null) s.cur = fmt(round15(s.acc * num() / 100));
        else s.cur = '0';
        s.fresh = true; s.awaiting = false;
      }); },
      sqrt: function () { guard(function () {
        var v = num();
        if (v < 0) throw new Error('Entrada no válida');
        s.cur = fmt(Math.sqrt(v)); s.fresh = true; s.awaiting = false;
      }); },
      reciprocal: function () { guard(function () {
        var v = num();
        if (v === 0) throw new Error('No se puede dividir por cero');
        s.cur = fmt(round15(1 / v)); s.fresh = true; s.awaiting = false;
      }); },
      mc: function () { s.mem = 0; },
      mr: function () { guard(function () { s.cur = fmt(s.mem); s.fresh = true; s.awaiting = false; }); },
      ms: function () { guard(function () { s.mem = round15(num()); s.fresh = true; s.awaiting = false; }); },
      mplus: function () { guard(function () {
        var m = round15(s.mem + num());
        if (!isFinite(m)) throw new Error('Desbordamiento');
        s.mem = m; s.fresh = true; s.awaiting = false;
      }); },
      hasMemory: function () { return s.mem !== 0; },
      /* Devuelve true si el texto es un número válido y lo coloca en pantalla. */
      paste: function (text) {
        if (s.error) return false;
        var t = String(text).trim(), v = null;
        if (/^[+-]?\d{1,3}(\.\d{3}){2,}(,\d+)?$/.test(t) || /^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(t)) v = t.replace(/\./g, '').replace(',', '.');
        else if (/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) v = t.replace(',', '.');
        if (v === null) return false;
        var neg = v.charAt(0) === '-';
        v = v.replace(/^[+-]/, '');
        if (v.charAt(0) === '.') v = '0' + v;
        var parts = v.split('.'), i = parts[0].replace(/^0+(?=\d)/, ''), f = parts[1] || '';
        if ((i + f).length > 32) return false;
        var out = i + (f ? '.' + f : '');
        if (parseFloat(out) !== 0 && neg) out = '-' + out;
        s.cur = out; s.fresh = false; s.awaiting = false; s.lastOp = null; s.afterEq = false;
        return true;
      },
      /* Texto numérico sin separador de miles, con coma decimal (para copiar). */
      plainValue: function () { return s.error ? null : s.cur.replace('.', ','); }
    };
  }

  /* Presentación en pantalla (coma decimal, punto como separador de miles). */
  function formatDisplay(cur, thousands) {
    var neg = cur.charAt(0) === '-', body = neg ? cur.slice(1) : cur;
    if (body.indexOf('e') >= 0) return (neg ? '-' : '') + body.replace('.', ',');
    var p = body.split('.'), ip = p[0];
    if (thousands) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + ip + (p.length > 1 ? ',' + p[1] : '');
  }

  return { create: create, fmt: fmt, formatDisplay: formatDisplay };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Calc;

/* ---------------- Interfaz ---------------- */
if (typeof document !== 'undefined') (function () {
  var calc = Calc.create();
  var thousands = true;               // Ver > Separador de miles (activo, como el original)
  var elDisplay = document.getElementById('display');
  var elText = document.getElementById('display-text');
  var elMind = document.getElementById('mind');
  var elModal = document.getElementById('modal-root');
  var elWin = document.getElementById('win');
  var elClosed = document.getElementById('closed');
  var modalDefault = null, modalCancel = null;

  /* Teclado numérico: el separador decimal sigue el idioma del original (coma). */
  function fitText() {
    var size = Math.max(22, Math.min(38, Math.round(elDisplay.clientWidth * 0.085)));
    elText.style.fontSize = size + 'px';
    var avail = elDisplay.clientWidth - 18;
    while (elText.scrollWidth > avail && size > 11) { size -= 1; elText.style.fontSize = size + 'px'; }
  }

  function refresh() {
    var st = calc.state;
    elText.textContent = st.error ? st.error : Calc.formatDisplay(st.cur, thousands);
    elMind.classList.toggle('on', calc.hasMemory());
    fitText();
    var copy = document.querySelector('[data-cmd="copy"]');
    var paste = document.querySelector('[data-cmd="paste"]');
    copy.classList.toggle('disabled', !!st.error);
    paste.classList.toggle('disabled', !!st.error);
    document.getElementById('mi-thousands').classList.toggle('checked', thousands);
  }

  /* ----- Botones y teclado ----- */
  function press(k) {
    switch (k) {
      case 'dec': calc.decimal(); break;
      case 'neg': calc.negate(); break;
      case 'add': calc.operator('+'); break;
      case 'sub': calc.operator('-'); break;
      case 'mul': calc.operator('*'); break;
      case 'div': calc.operator('/'); break;
      case 'eq': calc.equals(); break;
      case 'pct': calc.percent(); break;
      case 'sqrt': calc.sqrt(); break;
      case 'rec': calc.reciprocal(); break;
      case 'mc': calc.mc(); break;
      case 'mr': calc.mr(); break;
      case 'ms': calc.ms(); break;
      case 'mp': calc.mplus(); break;
      case 'bs': calc.backspace(); break;
      case 'ce': calc.ce(); break;
      case 'c': calc.clear(); break;
      default: if (/^[0-9]$/.test(k)) calc.digit(k);
    }
    refresh();
  }

  document.querySelectorAll('.btn[data-k]').forEach(function (b) {
    b.addEventListener('click', function () { closeMenus(); press(b.getAttribute('data-k')); });
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
  });

  var KEYMAP = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '=': 'eq', 'Enter': 'eq', 'Escape': 'c',
                 'Backspace': 'bs', 'Delete': 'ce', '.': 'dec', ',': 'dec', 'Decimal': 'dec', '%': 'pct',
                 'r': 'rec', 'R': 'rec', '@': 'sqrt', 'F9': 'neg' };
  var CTRLMAP = { l: 'mc', r: 'mr', m: 'ms', p: 'mp' };

  function flash(k) {
    var b = document.querySelector('.btn[data-k="' + k + '"]');
    if (!b) return;
    b.classList.add('down');
    setTimeout(function () { b.classList.remove('down'); }, 110);
  }

  document.addEventListener('keydown', function (e) {
    if (elClosed.hidden === false) return;
    if (elModal.classList.contains('on')) {
      if (e.target && e.target.tagName === 'INPUT' && e.key !== 'Enter' && e.key !== 'Escape') return;
      if (e.key === 'Enter' && modalDefault) { e.preventDefault(); modalDefault(); }
      else if (e.key === 'Escape' && modalCancel) { e.preventDefault(); modalCancel(); }
      return;
    }
    if (e.altKey) return;
    var k = null, key = e.key;
    if (e.ctrlKey || e.metaKey) {
      var lk = key.toLowerCase();
      if (lk === 'c') { e.preventDefault(); doCopy(); return; }
      if (lk === 'v') return;   // lo gestiona el evento "paste"
      if (CTRLMAP[lk]) { e.preventDefault(); k = CTRLMAP[lk]; }
      else return;
    } else if (/^[0-9]$/.test(key)) k = key;
    else if (KEYMAP[key]) k = KEYMAP[key];
    if (!k) return;
    e.preventDefault();
    closeMenus();
    flash(k);
    press(k);
  });

  document.addEventListener('paste', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (elModal.classList.contains('on')) return;
    e.preventDefault();
    var t = (e.clipboardData && e.clipboardData.getData('text')) || '';
    applyPaste(t);
  });

  /* ----- Menús ----- */
  function closeMenus() {
    document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
  }
  document.querySelectorAll('.menu-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = btn.parentNode, wasOpen = menu.classList.contains('open');
      closeMenus();
      if (!wasOpen) { menu.classList.add('open'); refresh(); }
    });
  });
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest || !e.target.closest('.menu')) closeMenus();
  });
  document.querySelectorAll('.mi').forEach(function (it) {
    it.addEventListener('click', function () {
      if (it.classList.contains('disabled')) return;
      var cmd = it.getAttribute('data-cmd');
      closeMenus();
      if (cmd === 'copy') doCopy();
      else if (cmd === 'paste') doPaste();
      else if (cmd === 'thousands') { thousands = !thousands; refresh(); }
      else if (cmd === 'help') showHelp();
      else if (cmd === 'about') showAbout();
    });
  });

  /* ----- Portapapeles ----- */
  function doCopy() {
    var text = calc.plainValue();
    if (text === null) return;
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('copy');
      } catch (err) {
        message('Calculadora', 'No se pudo copiar el número al portapapeles.');
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else fallback();
  }

  function applyPaste(text) {
    if (calc.paste(text)) refresh();
    else message('Calculadora', 'El contenido del portapapeles no es un número válido.');
  }

  function doPaste() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(applyPaste, manualPaste);
    } else manualPaste();
  }

  function manualPaste() {
    var input = document.createElement('input');
    input.type = 'text'; input.setAttribute('inputmode', 'decimal'); input.setAttribute('autocomplete', 'off');
    var p = document.createElement('p');
    p.textContent = 'Escriba o pegue el número:';
    var wrap = document.createElement('div');
    wrap.appendChild(p); wrap.appendChild(input);
    openDialog({ title: 'Pegar', content: wrap, buttons: [
      { label: 'Aceptar', primary: true, onClick: function () { var v = input.value; closeDialog(); applyPaste(v); } },
      { label: 'Cancelar', cancel: true, onClick: closeDialog }
    ] });
    setTimeout(function () { input.focus(); }, 30);
  }

  /* ----- Diálogos clásicos ----- */
  function openDialog(opt) {
    elModal.textContent = '';
    var dlg = document.createElement('div'); dlg.className = 'dlg'; dlg.setAttribute('role', 'dialog');
    var tb = document.createElement('div'); tb.className = 'titlebar';
    var img = document.createElement('img'); img.src = 'icons/icon-192.png'; img.alt = ''; img.width = 16; img.height = 16;
    var tt = document.createElement('span'); tt.className = 'title'; tt.textContent = opt.title;
    tb.appendChild(img); tb.appendChild(tt);
    var body = document.createElement('div'); body.className = 'dlg-body';
    body.appendChild(opt.content);
    var row = document.createElement('div'); row.className = 'dlg-buttons';
    modalDefault = null; modalCancel = null;
    opt.buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn dbtn' + (b.primary ? ' default' : ''); btn.textContent = b.label;
      btn.addEventListener('click', b.onClick);
      if (b.primary) modalDefault = b.onClick;
      if (b.cancel || (!modalCancel && opt.buttons.length === 1)) modalCancel = b.onClick;
      row.appendChild(btn);
    });
    body.appendChild(row);
    dlg.appendChild(tb); dlg.appendChild(body);
    elModal.appendChild(dlg);
    elModal.classList.add('on');
  }
  function closeDialog() { elModal.classList.remove('on'); elModal.textContent = ''; modalDefault = modalCancel = null; }

  function message(title, text) {
    var p = document.createElement('p'); p.textContent = text;
    openDialog({ title: title, content: p, buttons: [{ label: 'Aceptar', primary: true, cancel: true, onClick: closeDialog }] });
  }

  function showAbout() {
    var box = document.createElement('div'); box.className = 'about';
    var img = document.createElement('img'); img.src = 'icons/icon-192.png'; img.alt = '';
    var name = document.createElement('span'); name.textContent = 'Calculadora';
    box.appendChild(img); box.appendChild(name);
    openDialog({ title: 'Acerca de Calculadora', content: box,
      buttons: [{ label: 'Aceptar', primary: true, cancel: true, onClick: closeDialog }] });
  }

  var HELP = [
    ['Operaciones básicas', 'Escriba un número, pulse una operación (+, -, *, /), escriba el segundo número y pulse = para ver el resultado. Puede encadenar operaciones: cada vez que pulsa una operación se calcula el resultado parcial. Si pulsa = otra vez, se repite la última operación con el último número.'],
    ['Porcentaje, raíz e inverso', 'El botón % calcula ese porcentaje del primer número de la operación pendiente; después pulse =. El botón sqrt calcula la raíz cuadrada del número mostrado y 1/x su inverso. El botón +/- cambia el signo.'],
    ['Memoria', 'MS guarda el número mostrado en la memoria. MR lo recupera en pantalla. M+ suma el número mostrado al valor guardado. MC borra la memoria. Cuando hay un valor guardado aparece la letra M sobre los botones de memoria. La memoria se vacía al cerrar la aplicación.'],
    ['Botones CE, C y Retroceso', 'Retroceso borra el último dígito escrito. CE borra únicamente el número que está escribiendo. C borra todo el cálculo en curso (la memoria no se modifica).'],
    ['Errores', 'Si divide por cero o pide un cálculo no válido se muestra un mensaje. Pulse C o CE para continuar.'],
    ['Menús', 'Edición > Copiar copia el número mostrado; Pegar coloca en pantalla un número copiado. Ver > Separador de miles muestra u oculta la separación de los miles sin cambiar el valor.'],
    ['Teclado', 'Números del 0 al 9, + - * /, Enter (=), Escape (C), Retroceso, Supr (CE), punto o coma (decimal) y % (porcentaje). También: R (1/x), @ (sqrt), F9 (+/-), Ctrl+L (MC), Ctrl+R (MR), Ctrl+M (MS), Ctrl+P (M+), Ctrl+C y Ctrl+V.']
  ];
  function showHelp() {
    var box = document.createElement('div'); box.className = 'dlg-text';
    HELP.forEach(function (h) {
      var t = document.createElement('h4'); t.textContent = h[0];
      var p = document.createElement('p'); p.textContent = h[1];
      box.appendChild(t); box.appendChild(p);
    });
    openDialog({ title: 'Temas de ayuda: Calculadora', content: box,
      buttons: [{ label: 'Cerrar', primary: true, cancel: true, onClick: closeDialog }] });
  }

  /* ----- Barra de título ----- */
  document.getElementById('btn-min').addEventListener('click', function () { /* solo decorativo */ });
  document.getElementById('btn-close').addEventListener('click', function () {
    closeMenus();
    try { window.close(); } catch (e) { /* ignorar */ }
    setTimeout(function () {
      closeDialog();
      elWin.hidden = true;
      elWin.style.display = 'none';
      elClosed.hidden = false;
    }, 250);
  });
  document.getElementById('btn-reopen').addEventListener('click', function () {
    elClosed.hidden = true;
    elWin.hidden = false;
    elWin.style.display = '';
    refresh();
  });

  window.addEventListener('resize', fitText);
  window.addEventListener('orientationchange', function () { setTimeout(fitText, 150); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  refresh();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }
})();
