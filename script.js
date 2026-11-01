/* Optional: set your published page URL here before printing your badge. */
const PUBLIC_SITE_URL = '';

(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const replies = [
    'Вызов отклонён. Сотрудник на том свете.',
    'Абонент вне зоны действия трудового договора.',
    'Сотрудник восстал. Но не для этого созвона.',
    'Ваш звонок очень важен. Ожидайте вечность.',
    'Душа не найдена. Попробуйте после отпуска.',
    'Микрофон выключен с прошлого воплощения.',
    'Сегодня без камеры. И без тела.',
    'Дедлайн пережил сотрудника. Опять.'
  ];
  let callCount = 0;
  $('call-button').addEventListener('click', () => {
    const ghost = $('ghost');
    const response = $('call-response');
    ghost.classList.remove('is-shaking');
    response.classList.remove('has-response');
    // Restart CSS animations even when calls arrive in quick succession.
    void ghost.getBoundingClientRect();
    ghost.classList.add('is-shaking');
    response.textContent = replies[callCount++ % replies.length];
    response.classList.add('has-response');
  });

  const dialog = $('qr-dialog');
  const input = $('site-url');
  const result = $('qr-result');
  const error = $('url-error');
  const storageKey = 'afterlife-office-url';
  let remembered = '';
  try { remembered = localStorage.getItem(storageKey) || ''; } catch { /* Storage is optional. */ }
  input.value = PUBLIC_SITE_URL || remembered || (/^https?:$/.test(location.protocol) ? location.href.split(/[?#]/)[0] : '');

  $('open-qr').addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('modal-open');
    input.focus();
  });
  $('close-qr').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    $('open-qr').focus();
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  input.addEventListener('input', () => {
    result.hidden = true;
    $('download-qr').removeAttribute('href');
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });

  function publicUrl(value) {
    let url;
    try { url = new URL(value.trim()); } catch { throw new Error('Введите полный адрес сайта, начиная с https://.'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Нужна публичная ссылка с http:// или https:// без логина и пароля.');
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.') || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.includes(':')) {
      throw new Error('Укажите опубликованный сайт. Локальный адрес не откроется у коллег.');
    }
    if (url.href.length > 1500) throw new Error('Ссылка слишком длинная для бейджика. Используйте короткий адрес страницы.');
    return url.href;
  }

  $('qr-form').addEventListener('submit', (event) => {
    event.preventDefault();
    result.hidden = true;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    let url;
    try { url = publicUrl(input.value); }
    catch (problem) {
      error.textContent = problem.message;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    try {
      if (typeof qrcode !== 'function') throw new Error('QR library unavailable');
      const code = qrcode(0, 'M');
      // URL serialization percent-encodes Unicode, so the byte encoder receives ASCII.
      code.addData(url, 'Byte');
      code.make();
      const count = code.getModuleCount();
      const quiet = 4;
      const scale = Math.max(8, Math.ceil(1000 / (count + quiet * 2)));
      const canvas = $('qr-canvas');
      canvas.width = canvas.height = (count + quiet * 2) * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (code.isDark(row, col)) ctx.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
        }
      }
      $('download-qr').href = canvas.toDataURL('image/png');
      $('encoded-link').href = url;
      $('encoded-link').textContent = url;
      input.value = url;
      try { localStorage.setItem(storageKey, url); } catch { /* QR works without storage. */ }
      result.hidden = false;
      $('download-qr').focus();
    } catch {
      error.textContent = 'Не удалось создать QR-код. Проверьте наличие файла vendor/qrcode.js и попробуйте более короткую ссылку.';
    }
  });
})();
