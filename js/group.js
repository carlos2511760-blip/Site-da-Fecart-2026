(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const image = (src, alt, className = '') => src ? `<img class="${className}" src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy">` : `<div class="image-placeholder ${className}" role="img" aria-label="Imagem ainda não adicionada">F</div>`;
  const placeholderMedia = (label, type = 'photo') => `<div class="media-placeholder ${type}-placeholder" role="img" aria-label="${escapeHTML(label)}"><span>${type === 'video' ? '▶' : 'F'}</span><small>${escapeHTML(label)}</small></div>`;
  const query = new URLSearchParams(location.search).get('grupo');
  let data;
  let activeGroup;
  const supabase = window.FECART_SUPABASE || {};
  const apiUrl = path => `${supabase.url || ''}/rest/v1/${path}`;
  const apiHeaders = () => ({ apikey: supabase.anonKey || '', Authorization: `Bearer ${supabase.anonKey || ''}`, 'Content-Type': 'application/json' });
  const editorField = (label, key, value, multiline = false) => `<div class="editor-field"><label>${label}</label>${multiline ? `<textarea data-group-field="${key}">${escapeHTML(value || '')}</textarea>` : `<input data-group-field="${key}" value="${escapeHTML(value || '')}">`}</div>`;
  const editorUpload = (label, key, accept) => `<div class="editor-field editor-upload"><label>${label}</label><input type="file" accept="${accept}" data-group-upload="${key}"></div>`;

  function mergeGroup(base, current) {
    const result = structuredClone(base || {});
    Object.assign(result, current || {});
    result.project = { ...(base?.project || {}), ...(current?.project || {}) };
    const baseMembers = base?.members || [], currentMembers = current?.members || [];
    result.members = Array.from({ length: Math.max(baseMembers.length, currentMembers.length) }, (_, index) => ({ ...(baseMembers[index] || {}), ...(currentMembers[index] || {}) }));
    result.gallery = (current?.gallery?.length ? current.gallery : (base?.gallery || [])).map((item, index) => ({ ...(base?.gallery?.[index] || {}), ...(item || {}) }));
    return result;
  }
  function stopPreview(card) {
    if (!card) return;
    clearTimeout(card.previewTimer);
    const video = card.querySelector('.member-video');
    if (video) { video.pause(); video.currentTime = 0; }
    const frame = card.querySelector('.member-video-frame');
    if (frame) frame.src = 'about:blank';
    card.classList.remove('is-previewing');
    card.setAttribute('aria-label', card.dataset.memberLabel || 'Integrante');
  }

  function startPreview(card) {
    if (!card || (!card.querySelector('.member-video') && !card.querySelector('.member-video-frame'))) return;
    $$('.member-card.is-previewing').filter(other => other !== card).forEach(stopPreview);
    const video = card.querySelector('.member-video');
    const frame = card.querySelector('.member-video-frame');
    card.classList.add('is-previewing');
    card.setAttribute('aria-label', `${card.dataset.memberLabel || 'Integrante'} — prévia em vídeo`);
    if (video) video.play().catch(() => {});
    if (frame && frame.dataset.src) frame.src = frame.dataset.src;
  }

  function bindMemberPreviews() {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    $$('.member-card[data-preview-video]').forEach(card => {
      card.addEventListener('pointerenter', () => {
        if (!reducedMotion) card.previewTimer = setTimeout(() => startPreview(card), 240);
      });
      card.addEventListener('pointerleave', () => stopPreview(card));
      card.addEventListener('focusin', () => { if (!reducedMotion) startPreview(card); });
      card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) stopPreview(card); });
      card.addEventListener('click', event => {
        if (event.pointerType === 'touch' || window.matchMedia?.('(hover: none)').matches) {
          card.classList.contains('is-previewing') ? stopPreview(card) : startPreview(card);
        }
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.classList.contains('is-previewing') ? stopPreview(card) : startPreview(card); }
      });
    });
  }

  function memberMarkup(member, index) {
    const name = member.name || `Integrante ${index + 1}`;
    const hasVideo = Boolean(member.previewVideo);
    const youtubeId = hasVideo ? (member.previewVideo.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) || [])[1] : '';
    const poster = member.videoPoster || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '');
    const visual = `<div class="demo-media-wrap">${member.photo ? image(member.photo, `Foto de ${name}`, 'member-photo') : (poster ? image(poster, `Capa da prévia de ${name}`, 'member-photo') : placeholderMedia(`Integrante ${index + 1}`, 'member'))}${member.demo ? '<span class="demo-media-label">imagem de exemplo</span>' : ''}</div>`;
    const video = hasVideo ? (youtubeId ? `<iframe class="member-video-frame" data-src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&rel=0" title="Prévia em vídeo de ${escapeHTML(name)}" allow="autoplay; encrypted-media" loading="lazy" aria-hidden="true"></iframe>` : `<video class="member-video" src="${escapeHTML(member.previewVideo)}"${member.videoPoster ? ` poster="${escapeHTML(member.videoPoster)}"` : ''} muted loop playsinline preload="none" aria-hidden="true"></video>` ) + '<span class="preview-badge" aria-hidden="true">▶ prévia</span>' : '';
    return `<article class="member-card${hasVideo ? ' has-preview' : ''}"${hasVideo ? ` data-preview-video="true" tabindex="0" role="button" data-member-label="${escapeHTML(name)}"` : ''}> <div class="member-media">${visual}${video}</div><h3>${escapeHTML(name)}</h3><p>${escapeHTML(member.role || 'Função a definir')}</p>${hasVideo ? '<small class="preview-hint">passe ou toque para ver</small>' : ''}</article>`;
  }

  function render(group, projects) {
    activeGroup = group;
    const project = group.projects?.length ? group.projects[0] : (group.project?.title ? group.project : {});
    const memberCount = group.id === 'sabor-robotica' ? 4 : 5;
    const members = Array.from({ length: memberCount }, (_, index) => group.members?.[index] || { name: `Integrante ${index + 1}`, role: 'Função a definir', photo: '', previewVideo: '', videoPoster: '' });
    const gallery = group.gallery?.length ? group.gallery : [{ type: 'photo', caption: 'Foto do processo' }, { type: 'photo', caption: 'Protótipo em teste' }, { type: 'video', caption: 'Vídeo do making of' }];
    $('#group-content').innerHTML = `<section class="group-hero" style="--accent:${escapeHTML(group.accent || '#e8b63f')}"><div class="group-logo">${image(group.logo, `Logo do grupo ${group.name}`, 'logo-image')}</div><div><p class="section-kicker">grupo Fecart</p><h1>${escapeHTML(group.name)}</h1><p class="group-description">${escapeHTML(group.description || 'Este grupo ainda está preparando sua apresentação.')}</p></div></section><section class="members-section section-block"><div class="block-heading"><p class="section-kicker">quem constrói</p><h2>Pessoas por<br><em>trás da ideia.</em></h2></div><div class="members-grid members-count-${memberCount}">${members.map(memberMarkup).join('')}</div></section><section class="group-project section-block"><div class="block-heading"><p class="section-kicker">o projeto</p><h2>${escapeHTML(project.title || 'Projeto em construção')}</h2></div><div class="project-detail"><div><div class="project-main-media">${project.image ? `<div class="demo-media-wrap">${image(project.image, `Foto do projeto ${project.title}`, 'project-main-image')}${project.demo ? '<span class="demo-media-label">imagem de exemplo</span>' : ''}</div>` : placeholderMedia('Foto principal do projeto')}</div><p>${escapeHTML(project.description || 'A descrição detalhada do projeto será adicionada aqui.')}</p><p>${escapeHTML(project.details || '')}</p></div><div class="project-related">${projects.length ? projects.map(item => `<a href="index.html#projetos" class="related-project"><span>${escapeHTML(item.year || '')}</span><strong>${escapeHTML(item.title)}</strong><small>ver projeto completo ↗</small></a>`).join('') : '<p class="empty-detail">Os projetos deste grupo aparecerão aqui.</p>'}</div></div></section><section class="gallery-section section-block"><div class="block-heading"><p class="section-kicker">por trás de tudo</p><h2>O processo<br><em>em imagens.</em></h2><p>Fotos e vídeos para registrar testes, protótipos, erros, descobertas e todas as etapas que fazem o projeto acontecer.</p></div><div class="process-gallery">${gallery.map(item => `<figure>${item.type === 'video' ? (item.src ? `<video class="gallery-video" src="${escapeHTML(item.src)}" controls preload="metadata"${item.poster ? ` poster="${escapeHTML(item.poster)}"` : ''}></video>` : placeholderMedia(item.caption || 'Vídeo do making of', 'video')) : item.src ? `<div class="demo-media-wrap">${image(item.src, item.alt || 'Registro do processo', 'gallery-image')}${item.demo ? '<span class="demo-media-label">imagem de exemplo</span>' : ''}</div>` : placeholderMedia(item.caption || 'Foto do processo')}<figcaption>${escapeHTML(item.caption || '')}</figcaption></figure>`).join('')}</div></section>`;
    document.title = `${group.name} · Fecart`;
    bindMemberPreviews();
  }

  function renderEditor() {
    const group = activeGroup;
    const project = group.project || {};
    const memberCount = group.id === 'sabor-robotica' ? 4 : 5;
    let fields = `${editorField('Nome do grupo', 'name', group.name)}${editorField('Cor de destaque', 'accent', group.accent)}${editorField('Logo (URL ou caminho)', 'logo', group.logo)}${editorField('Descrição do grupo', 'description', group.description, true)}<p class="section-kicker">integrantes</p>`;
    for (let index = 0; index < memberCount; index += 1) { const member = group.members?.[index] || {}; fields += `<div class="editor-group"><strong>Integrante ${index + 1}</strong>${editorField('Nome', `member:${index}:name`, member.name)}${editorField('Função', `member:${index}:role`, member.role)}${editorField('Foto (URL ou caminho)', `member:${index}:photo`, member.photo)}${editorField('Vídeo de prévia (URL ou caminho)', `member:${index}:previewVideo`, member.previewVideo)}${editorUpload('Ou envie a prévia do computador', `member:${index}:previewVideo`, 'video/mp4,video/webm,video/quicktime')}${editorField('Capa do vídeo (URL ou caminho)', `member:${index}:videoPoster`, member.videoPoster)}${editorUpload('Ou envie a capa do computador', `member:${index}:videoPoster`, 'image/jpeg,image/png,image/webp')}</div>`; }
    fields += `<p class="section-kicker">projeto</p>${editorField('Nome do projeto', 'project:title', project.title)}${editorField('Foto principal (URL ou caminho)', 'project:image', project.image)}${editorField('Descrição curta', 'project:description', project.description, true)}${editorField('Descrição detalhada', 'project:details', project.details, true)}<p class="section-kicker">making of</p>`;
    const gallery = group.gallery || [];
    for (let index = 0; index < 6; index += 1) { const item = gallery[index] || {}; fields += `<div class="editor-group"><strong>Registro ${index + 1}</strong>${editorField('Tipo (photo ou video)', `gallery:${index}:type`, item.type || 'photo')}${editorField('Imagem ou vídeo (URL ou caminho)', `gallery:${index}:src`, item.src)}${editorField('Capa do vídeo (opcional)', `gallery:${index}:poster`, item.poster)}${editorField('Legenda', `gallery:${index}:caption`, item.caption)}</div>`; }
    $('#group-editor-fields').innerHTML = fields;
    $$('[data-group-field]').forEach(field => field.addEventListener('input', () => updateGroupField(field.dataset.groupField, field.value)));
    $$('[data-group-upload]').forEach(field => field.addEventListener('change', () => uploadGroupFile(field)));
  }

  async function uploadGroupFile(field) {
    const file = field.files?.[0];
    if (!file || !supabase.url || !supabase.anonKey) return;
    if (file.size > 80 * 1024 * 1024) { $('#group-editor-status').textContent = 'O arquivo deve ter no máximo 80 MB.'; field.value = ''; return; }
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${activeGroup.id}/${field.dataset.groupUpload.replaceAll(':', '-')}-${Date.now()}.${extension}`;
    field.disabled = true;
    $('#group-editor-status').textContent = 'Enviando arquivo para o armazenamento público...';
    try {
      const response = await fetch(`${supabase.url}/storage/v1/object/fecart-media/${path}`, { method: 'POST', headers: { apikey: supabase.anonKey, Authorization: `Bearer ${supabase.anonKey}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }, body: file });
      if (!response.ok) throw new Error(`Upload HTTP ${response.status}`);
      const publicUrl = `${supabase.url}/storage/v1/object/public/fecart-media/${path}`;
      updateGroupField(field.dataset.groupUpload, publicUrl);
      $('#group-editor-status').textContent = 'Arquivo enviado e salvo para todos.';
    } catch (error) { $('#group-editor-status').textContent = 'Não foi possível enviar o arquivo.'; console.warn(error); }
    field.disabled = false;
  }

  async function saveGroupRemote() {
    if (!supabase.url || !supabase.anonKey || !activeGroup?.id) return false;
    const response = await fetch(apiUrl('fecart_group_content?on_conflict=group_id'), { method: 'POST', headers: { ...apiHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ group_id: activeGroup.id, content: activeGroup }) });
    if (!response.ok) throw new Error(`Falha ao salvar grupo (${response.status})`);
    return true;
  }
  function updateGroupField(key, value) { const parts = key.split(':'); if (parts[0] === 'member') { activeGroup.members ||= []; activeGroup.members[Number(parts[1])] ||= {}; activeGroup.members[Number(parts[1])][parts[2]] = value; } else if (parts[0] === 'project') { activeGroup.project ||= {}; activeGroup.project[parts[1]] = value; } else if (parts[0] === 'gallery') { activeGroup.gallery ||= []; activeGroup.gallery[Number(parts[1])] ||= {}; activeGroup.gallery[Number(parts[1])][parts[2]] = value; } else activeGroup[parts[0]] = value; data.contentVersion = 5; localStorage.setItem('fecart-content-draft', JSON.stringify(data)); const projects = data.projects.filter(item => item.groupId === activeGroup.id); render(activeGroup, projects); $('#group-editor-status').textContent = 'Salvando no banco público...'; saveGroupRemote().then(() => { $('#group-editor-status').textContent = 'Alteração salva para todos.'; }).catch(error => { $('#group-editor-status').textContent = 'Salvo apenas neste navegador: banco indisponível.'; console.warn(error); }); }
  function resetGroup() { localStorage.removeItem('fecart-content-draft'); location.reload(); }
  function initEditor() { $('#group-editor-close').addEventListener('click', () => { $('#group-editor-panel').hidden = true; }); $('#group-editor-save').addEventListener('click', () => { data.contentVersion = 5; localStorage.setItem('fecart-content-draft', JSON.stringify(data)); saveGroupRemote().then(() => { $('#group-editor-status').textContent = 'Alterações salvas para todos.'; }).catch(() => { $('#group-editor-status').textContent = 'Alterações salvas apenas neste navegador.'; }); }); $('#group-editor-reset').addEventListener('click', resetGroup); document.addEventListener('keydown', event => { const maintenanceKey = event.key === '\\' || event.key === '|' || event.code === 'Backslash' || event.code === 'IntlBackslash'; if (event.ctrlKey && event.shiftKey && maintenanceKey) { event.preventDefault(); const panel = $('#group-editor-panel'); panel.hidden = !panel.hidden; if (!panel.hidden) { renderEditor(); $('#group-editor-fields input')?.focus(); } } if (event.key === 'Escape') $('#group-editor-panel').hidden = true; }); }
  async function init() { try { const response = await fetch('data/content.json'); const initial = await response.json(); data = initial; let hadLocalDraft = false; try { const draft = JSON.parse(localStorage.getItem('fecart-content-draft') || 'null'); if (draft && draft.contentVersion >= initial.contentVersion) { data = draft; hadLocalDraft = true; } } catch {} data.groups = (data.groups || initial.groups).map((group, index) => mergeGroup(initial.groups[index], group)); const remoteResponse = supabase.url && supabase.anonKey ? await fetch(apiUrl(`fecart_group_content?group_id=eq.${encodeURIComponent(query || data.groups[0].id)}&select=content&limit=1`), { headers: apiHeaders() }) : null; const remoteRows = remoteResponse?.ok ? await remoteResponse.json() : []; if (remoteRows.length) { const remoteGroup = remoteRows[0].content; const index = data.groups.findIndex(item => item.id === remoteGroup.id); if (index >= 0) data.groups[index] = mergeGroup(data.groups[index], remoteGroup); } const group = data.groups.find(item => item.id === query) || data.groups[0]; render(group, data.projects.filter(item => item.groupId === group.id)); if (hadLocalDraft && !remoteRows.length) saveGroupRemote().catch(error => console.warn('Não foi possível migrar o rascunho para o banco:', error)); initEditor(); } catch (error) { console.warn(error); $('#group-content').innerHTML = '<p class="empty-detail">Não foi possível carregar este grupo agora.</p>'; } }
  init();
})();
