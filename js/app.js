(() => {
  'use strict';
  const DATA_URL = 'data/content.json';
  const STORAGE_KEY = 'fecart-content-draft';
  const LIKED_KEY = 'fecart-liked-projects';
  const CONTENT_VERSION = 4;
  const supabase = window.FECART_SUPABASE || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let data = null;
  let initialData = null;
  let likes = {};

  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const apiUrl = path => `${supabase.url || ''}/rest/v1/${path}`;
  const apiHeaders = () => ({ apikey: supabase.anonKey || '', Authorization: `Bearer ${supabase.anonKey || ''}`, 'Content-Type': 'application/json' });
  const groupById = id => data.groups.find(group => group.id === id) || { name: 'Grupo não definido' };
  const imageHTML = (src, alt, className = 'project-image') => src ? `<img class="${className}" src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy">` : `<div class="${className} placeholder" role="img" aria-label="Imagem ainda não adicionada">F</div>`;
  const readLiked = () => { try { return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'); } catch { return []; } };

  async function loadData() {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    initialData = await response.json();
    const draft = localStorage.getItem(STORAGE_KEY);
    const parsedDraft = draft ? JSON.parse(draft) : null;
    data = parsedDraft && parsedDraft.contentVersion === CONTENT_VERSION ? parsedDraft : structuredClone(initialData);
    data.contentVersion = CONTENT_VERSION;
    if (supabase.url && supabase.anonKey) {
      try {
        const remote = await fetch(apiUrl('fecart_projects?select=*&order=sort_order.asc,created_at.asc'), { headers: apiHeaders() });
        if (remote.ok) {
          const rows = await remote.json();
          if (rows.length) data.projects = rows.map(fromDatabase);
        }
        const likesResponse = await fetch(apiUrl('fecart_project_likes?select=project_id,likes_count'), { headers: apiHeaders() });
        if (likesResponse.ok) (await likesResponse.json()).forEach(row => { likes[row.project_id] = row.likes_count; });
      } catch (error) { console.warn('Supabase indisponível; usando conteúdo local.', error); }
    }
  }

  function fromDatabase(row) {
    return { id: row.slug, dbId: row.id, title: row.title, shortDescription: row.short_description, fullDescription: row.full_description, groupId: row.group_id, year: row.year, status: row.status, tags: row.tags || [], team: row.team || [], thumbnail: row.image_url, coverImage: row.image_url, featured: row.featured, roots: row.roots || [] };
  }
  function toDatabase(project) {
    return { slug: project.id, title: project.title || 'Novo projeto', short_description: project.shortDescription || '', full_description: project.fullDescription || '', group_id: project.groupId || data.groups[0]?.id || '', year: project.year || '', status: project.status || '', tags: project.tags || [], team: project.team || [], image_url: project.thumbnail || project.coverImage || '', featured: Boolean(project.featured), roots: project.roots || [], sort_order: data.projects.indexOf(project) };
  }

  function renderFilters() {
    const groups = data.groups.map(group => `<button class="filter-button" type="button" data-filter="${escapeHTML(group.id)}">${escapeHTML(group.name)}</button>`).join('');
    $('#filter-bar').innerHTML = `<button class="filter-button active" type="button" data-filter="all">Todos</button>${groups}`;
    $$('.filter-button').forEach(button => button.addEventListener('click', () => { $$('.filter-button').forEach(item => item.classList.remove('active')); button.classList.add('active'); renderProjects(button.dataset.filter); }));
  }

  function renderProjects(filter = 'all') {
    const projects = data.projects.filter(project => filter === 'all' || project.groupId === filter);
    $('#empty-state').hidden = projects.length > 0;
    $('#projects-grid').innerHTML = projects.map(project => {
      const group = groupById(project.groupId);
      const likeCount = likes[project.dbId] || likes[project.id] || project.likes || 0;
      return `<article class="project-card" tabindex="0" role="button" data-project="${escapeHTML(project.id)}" aria-label="Abrir projeto ${escapeHTML(project.title)}">${imageHTML(project.thumbnail || project.coverImage, project.title)}<div class="project-card-body"><div class="project-meta"><span>${escapeHTML(project.year || 'sem data')}</span><span>${escapeHTML(group.name)}</span></div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.shortDescription)}</p><div class="project-footer"><div class="tag-list">${(project.tags || []).slice(0, 2).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><span class="project-arrow" aria-hidden="true">↗</span></div><div class="card-like-count">♡ ${likeCount} curtida${likeCount === 1 ? '' : 's'}</div></div></article>`;
    }).join('');
    $$('.project-card').forEach(card => { card.addEventListener('click', () => openProject(card.dataset.project)); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProject(card.dataset.project); } }); });
  }

  function renderGroups() {
    const container = $('#groups-grid');
    if (!container) return;
    container.innerHTML = data.groups.map((group, index) => {
      const count = data.projects.filter(project => project.groupId === group.id).length;
      return `<article class="group-card" style="--accent:${escapeHTML(group.accent || '#e8b63f')}"><span class="group-index">grupo</span><h3>${escapeHTML(group.name)}</h3><span class="group-count">${count} projeto${count === 1 ? '' : 's'}</span><a class="group-card-link" href="grupo.html?grupo=${encodeURIComponent(group.id)}">Conhecer grupo <span>↗</span></a></article>`;
    }).join('');
  }

  function renderEditableCopy() { const values = { 'hero.title': data.site.hero?.title, 'hero.subtitle': data.site.hero?.subtitle, 'hero.manifesto': data.site.hero?.manifesto, 'about.description': data.site.about?.description }; Object.entries(values).forEach(([key, value]) => { const element = $(`[data-edit="${key}"]`); if (element) element.textContent = value || ''; }); const theme = data.site.theme || {}; Object.entries(theme).forEach(([key, value]) => document.documentElement.style.setProperty(`--${key}`, value)); }

  function openProject(id) {
    const project = data.projects.find(item => item.id === id); if (!project) return;
    const group = groupById(project.groupId); const liked = readLiked().includes(project.id); const likeCount = likes[project.dbId] || likes[project.id] || 0;
    $('#modal-content').innerHTML = `<div class="modal-content-grid"><div>${imageHTML(project.coverImage || project.thumbnail, project.title, 'modal-cover')}</div><div><span class="modal-label">${escapeHTML(group.name)} · ${escapeHTML(project.year || 'sem data')}</span><h2 class="modal-title" id="modal-title">${escapeHTML(project.title)}</h2><p class="modal-description">${escapeHTML(project.fullDescription || project.shortDescription)}</p><div class="tag-list">${(project.tags || []).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><div class="modal-facts"><span><strong>Status</strong><br>${escapeHTML(project.status || 'Em processo')}</span><span><strong>Equipe</strong><br>${escapeHTML((project.team || []).join(', ') || 'A adicionar')}</span></div><a class="group-detail-link" href="grupo.html?grupo=${encodeURIComponent(project.groupId)}">Conhecer o grupo <span>↗</span></a><button class="like-button ${liked ? 'is-liked' : ''}" id="like-button" type="button" ${liked ? 'disabled' : ''}>♡ <span>${liked ? 'Você curtiu' : 'Curtir este projeto'}</span> · <b>${likeCount}</b></button></div></div><div class="timeline"><p class="modal-label">Por trás de tudo · making of</p>${(project.roots || []).length ? (project.roots || []).map(root => `<div class="timeline-item"><time>${escapeHTML(root.date || '')}</time><div><strong>${escapeHTML(root.title || '')}</strong><p>${escapeHTML(root.description || '')}</p></div></div>`).join('') : '<p class="modal-description">O making of deste projeto será registrado aqui.</p>'}</div>`;
    $('#project-modal').hidden = false; document.body.classList.add('modal-open'); $('#modal-close').focus(); $('#like-button').addEventListener('click', () => likeProject(project));
  }
  function closeProject() { $('#project-modal').hidden = true; document.body.classList.remove('modal-open'); }

  async function likeProject(project) {
    const liked = readLiked(); if (liked.includes(project.id)) return;
    const button = $('#like-button'); button.disabled = true;
    try {
      if (supabase.url && supabase.anonKey && project.dbId) {
        const response = await fetch(apiUrl('rpc/fecart_like_project'), { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ project_uuid: project.dbId }) });
        if (!response.ok) throw new Error('Falha ao registrar curtida');
        likes[project.dbId] = await response.json();
      } else { likes[project.id] = (likes[project.id] || 0) + 1; }
      localStorage.setItem(LIKED_KEY, JSON.stringify([...liked, project.id])); openProject(project.id); renderProjects($('.filter-button.active')?.dataset.filter || 'all');
    } catch (error) { button.disabled = false; button.querySelector('span').textContent = 'Não foi possível agora'; console.warn(error); }
  }

  function setByPath(path, value) { const [root, key] = path.split('.'); if (!data.site[root]) data.site[root] = {}; data.site[root][key] = value; }
  function editorField(label, path, value, type = 'textarea') { return `<div class="editor-field"><label>${label}</label>${type === 'textarea' ? `<textarea data-path="${path}">${escapeHTML(value || '')}</textarea>` : `<input data-path="${path}" value="${escapeHTML(value || '')}">`}</div>`; }
  function editorGroupField(path, value) { return `<div class="editor-field"><label>Grupo</label><select data-path="${path}">${data.groups.map(group => `<option value="${escapeHTML(group.id)}" ${group.id === value ? 'selected' : ''}>${escapeHTML(group.name)}</option>`).join('')}</select></div>`; }
  function renderEditor() {
    const hero = data.site.hero || {}, about = data.site.about || {}, theme = data.site.theme || {}; let html = `<p class="section-kicker">identidade visual</p>${editorField('Cor do papel', 'theme.paper', theme.paper || '#f4efe6', 'input')}${editorField('Cor do papel secundário', 'theme.paper-2', theme['paper-2'] || '#ebe2d3', 'input')}${editorField('Cor do texto', 'theme.ink', theme.ink || '#25231f', 'input')}${editorField('Cor de destaque', 'theme.tomato', theme.tomato || '#e05b3f', 'input')}${editorField('Cor solar', 'theme.sun', theme.sun || '#efc85d', 'input')}<p class="section-kicker">textos principais</p>${editorField('Título do início', 'hero.title', hero.title)}${editorField('Subtítulo', 'hero.subtitle', hero.subtitle)}${editorField('Manifesto', 'hero.manifesto', hero.manifesto)}${editorField('Texto sobre a Fecart', 'about.description', about.description)}<p class="section-kicker">grupos e equipes</p>`;
    data.groups.forEach(group => { const memberCount = group.id === 'sabor-robotica' ? 4 : 5; html += `<div class="editor-group"><strong>${escapeHTML(group.name)}</strong>${editorField('Nome do grupo', `group:${group.id}:name`, group.name, 'input')}${editorField('Cor do grupo', `group:${group.id}:accent`, group.accent, 'input')}${editorField('Logo (URL ou caminho)', `group:${group.id}:logo`, group.logo, 'input')}${editorField('Descrição do grupo', `group:${group.id}:description`, group.description)}<p class="section-kicker">integrantes</p>`; for (let index = 0; index < memberCount; index += 1) { const member = group.members?.[index] || {}; html += `<div class="editor-group"><strong>Integrante ${index + 1}</strong>${editorField('Nome', `group:${group.id}:member:${index}:name`, member.name, 'input')}${editorField('Função', `group:${group.id}:member:${index}:role`, member.role, 'input')}${editorField('Foto (URL ou caminho)', `group:${group.id}:member:${index}:photo`, member.photo, 'input')}</div>`; } const project = group.project || {}; html += `<p class="section-kicker">projeto e Making Of</p>${editorField('Nome do projeto', `group:${group.id}:project:title`, project.title, 'input')}${editorField('Foto principal', `group:${group.id}:project:image`, project.image, 'input')}${editorField('Descrição curta', `group:${group.id}:project:description`, project.description)}${editorField('Descrição detalhada', `group:${group.id}:project:details`, project.details)}${editorField('Galeria (JSON avançado)', `group:${group.id}:gallery`, JSON.stringify(group.gallery || [], null, 2))}</div>`; });
    html += `<p class="section-kicker">projetos</p><button class="button button-dark editor-add" id="editor-add-project" type="button">+ Adicionar projeto</button>`;
    data.projects.forEach(project => { html += `<div class="editor-group"><strong>${escapeHTML(project.title || 'Novo projeto')}</strong>${editorField('Título', `project:${project.id}:title`, project.title, 'input')}${editorField('Descrição curta', `project:${project.id}:shortDescription`, project.shortDescription)}${editorField('Descrição completa', `project:${project.id}:fullDescription`, project.fullDescription)}${editorGroupField(`project:${project.id}:groupId`, project.groupId)}${editorField('Ano', `project:${project.id}:year`, project.year, 'input')}${editorField('Status', `project:${project.id}:status`, project.status, 'input')}${editorField('Imagem principal (URL ou caminho)', `project:${project.id}:thumbnail`, project.thumbnail, 'input')}${editorField('Imagem de capa (URL ou caminho)', `project:${project.id}:coverImage`, project.coverImage, 'input')}${editorField('Tags em JSON', `project:${project.id}:tags`, JSON.stringify(project.tags || []), 'textarea')}${editorField('Equipe em JSON', `project:${project.id}:team`, JSON.stringify(project.team || []), 'textarea')}${editorField('Making Of em JSON', `project:${project.id}:roots`, JSON.stringify(project.roots || []), 'textarea')}</div>`; });
    $('#editor-fields').innerHTML = html; $('#editor-save-db').disabled = !supabase.url; $('#editor-add-project').addEventListener('click', addProject); $$('[data-path]').forEach(field => field.addEventListener('input', () => updateEditorPath(field.dataset.path, field.value)));
  }
  function updateEditorPath(path, value) { const parts = path.split(':'); if (parts[0] === 'project') { const project = data.projects.find(item => item.id === parts[1]); if (project) { if (['roots', 'tags', 'team'].includes(parts[2])) { try { project[parts[2]] = JSON.parse(value); } catch {} } else project[parts[2]] = value; } } else if (parts[0] === 'group') { const group = data.groups.find(item => item.id === parts[1]); if (group) { if (parts[2] === 'member') { group.members ||= []; group.members[Number(parts[3])] ||= {}; group.members[Number(parts[3])][parts[4]] = value; } else if (parts[2] === 'project') { group.project ||= {}; group.project[parts[3]] = value; } else if (parts[2] === 'gallery') { try { group.gallery = JSON.parse(value); } catch {} } else group[parts[2]] = value; } } else setByPath(path, value); persistDraft(); renderEditableCopy(); renderProjects($('.filter-button.active')?.dataset.filter || 'all'); renderGroups(); $('#editor-status').textContent = 'Alteração salva como rascunho local.'; }
  function persistDraft() { data.contentVersion = CONTENT_VERSION; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function addProject() { const id = `projeto-${Date.now()}`; data.projects.push({ id, title: 'Novo projeto', shortDescription: '', fullDescription: '', groupId: data.groups[0]?.id || '', year: '', status: '', tags: [], team: [], thumbnail: '', coverImage: '', roots: [], featured: false }); persistDraft(); renderAll(); renderEditor(); $('#editor-status').textContent = 'Projeto criado como rascunho.'; }
  async function saveProjectsToDatabase() { if (!supabase.url || !supabase.anonKey) { $('#editor-status').textContent = 'Supabase ainda não configurado.'; return; } const rows = data.projects.map(toDatabase); const response = await fetch(apiUrl('fecart_projects?on_conflict=slug'), { method: 'POST', headers: { ...apiHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(rows) }); if (!response.ok) { $('#editor-status').textContent = 'Falha ao salvar. Execute o SQL e confira as políticas do banco.'; return; } const saved = await response.json(); data.projects = saved.map(fromDatabase); persistDraft(); renderAll(); renderEditor(); $('#editor-status').textContent = 'Projetos salvos no banco de dados.'; }
  function resetEditor() { data = structuredClone(initialData); data.contentVersion = CONTENT_VERSION; localStorage.removeItem(STORAGE_KEY); renderAll(); renderEditor(); $('#editor-status').textContent = 'Conteúdo local restaurado.'; }
  function exportJSON() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'content-fecart-atualizado.json'; link.click(); URL.revokeObjectURL(link.href); }
  function renderAll() { renderEditableCopy(); renderFilters(); renderProjects(); renderGroups(); }
  function openEditor() { renderEditor(); $('#editor-panel').hidden = false; document.body.classList.add('editor-open'); $('#editor-close').focus(); }
  function closeEditor() { $('#editor-panel').hidden = true; document.body.classList.remove('editor-open'); }
  function init() { $('#modal-close').addEventListener('click', closeProject); $('#project-modal').addEventListener('click', event => { if (event.target.id === 'project-modal') closeProject(); }); $('#editor-close').addEventListener('click', closeEditor); $('#editor-export').addEventListener('click', exportJSON); $('#editor-save-db').addEventListener('click', saveProjectsToDatabase); $('#editor-reset').addEventListener('click', resetEditor); $('#menu-toggle').addEventListener('click', () => { const open = $('#site-nav').classList.toggle('is-open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); }); $$('#site-nav a').forEach(link => link.addEventListener('click', () => $('#site-nav').classList.remove('is-open'))); document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeProject(); closeEditor(); } const maintenanceKey = event.key === '\\' || event.key === '|' || event.code === 'Backslash' || event.code === 'IntlBackslash'; if (event.ctrlKey && event.shiftKey && maintenanceKey) { event.preventDefault(); $('#editor-panel').hidden ? openEditor() : closeEditor(); } }); }
  loadData().then(() => { renderAll(); init(); }).catch(error => { console.error(error); $('#empty-state').hidden = false; });
})();
