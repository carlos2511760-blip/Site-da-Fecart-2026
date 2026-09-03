(() => {
  'use strict';
  const DATA_URL = 'data/content.json';
  const STORAGE_KEY = 'fecart-content-draft';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let data = null;
  let initialData = null;

  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const groupById = id => data.groups.find(group => group.id === id) || data.groups[0];
  const imageHTML = (src, alt, className = 'project-image') => src ? `<img class="${className}" src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy">` : `<div class="${className} placeholder" role="img" aria-label="Imagem ainda não adicionada">F</div>`;

  async function loadData() {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      initialData = await response.json();
      const draft = localStorage.getItem(STORAGE_KEY);
      data = draft ? JSON.parse(draft) : structuredClone(initialData);
    } catch (error) {
      console.error('Não foi possível carregar o conteúdo.', error);
      data = initialData || { site: {}, groups: [], projects: [] };
    }
  }

  function renderFilters() {
    const groups = data.groups.map(group => `<button class="filter-button" type="button" data-filter="${escapeHTML(group.id)}">${escapeHTML(group.name)}</button>`).join('');
    $('#filter-bar').innerHTML = `<button class="filter-button active" type="button" data-filter="all">Todos</button>${groups}`;
    $$('.filter-button').forEach(button => button.addEventListener('click', () => {
      $$('.filter-button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      renderProjects(button.dataset.filter);
    }));
  }

  function renderProjects(filter = 'all') {
    const projects = data.projects.filter(project => filter === 'all' || project.groupId === filter);
    $('#empty-state').hidden = projects.length > 0;
    $('#projects-grid').innerHTML = projects.map((project, index) => {
      const group = groupById(project.groupId);
      return `<article class="project-card" tabindex="0" role="button" data-project="${escapeHTML(project.id)}" aria-label="Abrir projeto ${escapeHTML(project.title)}">
        ${imageHTML(project.thumbnail || project.coverImage, project.title)}
        <div class="project-card-body"><div class="project-meta"><span>${escapeHTML(project.year)}</span><span>${escapeHTML(group.name)}</span></div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.shortDescription)}</p><div class="project-footer"><div class="tag-list">${project.tags.slice(0, 2).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><span class="project-arrow" aria-hidden="true">↗</span></div></div>
      </article>`;
    }).join('');
    $$('.project-card').forEach(card => {
      card.addEventListener('click', () => openProject(card.dataset.project));
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProject(card.dataset.project); } });
    });
  }

  function renderGroups() {
    $('#groups-grid').innerHTML = data.groups.map((group, index) => {
      const count = data.projects.filter(project => project.groupId === group.id).length;
      return `<article class="group-card" style="--accent:${escapeHTML(group.accent || '#e8b63f')}"><span class="group-index">0${index + 1} / 04</span><h3>${escapeHTML(group.name)}</h3><p>${escapeHTML(group.description)}</p><span class="group-count">${count} projeto${count === 1 ? '' : 's'}</span></article>`;
    }).join('');
  }

  function renderEditableCopy() {
    const hero = data.site.hero || {};
    const process = data.site.process || {};
    const about = data.site.about || {};
    const values = {'hero.title': hero.title, 'hero.subtitle': hero.subtitle, 'hero.manifesto': hero.manifesto, 'process.description': process.description, 'about.description': about.description};
    Object.entries(values).forEach(([key, value]) => { const element = $(`[data-edit="${key}"]`); if (element) element.textContent = value || ''; });
  }

  function openProject(id) {
    const project = data.projects.find(item => item.id === id);
    if (!project) return;
    const group = groupById(project.groupId);
    $('#modal-content').innerHTML = `<div class="modal-content-grid"><div>${imageHTML(project.coverImage || project.thumbnail, project.title, 'modal-cover')}</div><div><span class="modal-label">${escapeHTML(group.name)} · ${escapeHTML(project.year)}</span><h2 class="modal-title" id="modal-title">${escapeHTML(project.title)}</h2><p class="modal-description">${escapeHTML(project.fullDescription)}</p><div class="tag-list">${project.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><div class="modal-facts"><span><strong>Status</strong><br>${escapeHTML(project.status)}</span><span><strong>Equipe</strong><br>${escapeHTML(project.team.join(', '))}</span></div></div></div><div class="timeline"><p class="modal-label">Making Of · o caminho</p>${(project.roots || []).map(root => `<div class="timeline-item"><time>${escapeHTML(root.date)}</time><div><strong>${escapeHTML(root.title)}</strong><p>${escapeHTML(root.description)}</p></div></div>`).join('')}</div>`;
    $('#project-modal').hidden = false;
    document.body.classList.add('editor-open');
    $('#modal-close').focus();
  }

  function closeProject() { $('#project-modal').hidden = true; document.body.classList.remove('editor-open'); }

  function setByPath(path, value) {
    const [root, key] = path.split('.');
    if (!data.site[root]) data.site[root] = {};
    data.site[root][key] = value;
  }

  function editorField(label, path, value, type = 'textarea') {
    const input = type === 'textarea' ? `<textarea data-path="${path}">${escapeHTML(value || '')}</textarea>` : `<input data-path="${path}" value="${escapeHTML(value || '')}">`;
    return `<div class="editor-field"><label for="editor-${path.replace('.', '-')}">${label}</label>${input}</div>`;
  }

  function renderEditor() {
    const hero = data.site.hero || {}, process = data.site.process || {}, about = data.site.about || {};
    let html = `<p class="section-kicker">textos principais</p>${editorField('Título do início', 'hero.title', hero.title)}${editorField('Subtítulo', 'hero.subtitle', hero.subtitle)}${editorField('Manifesto', 'hero.manifesto', hero.manifesto)}${editorField('Texto do processo', 'process.description', process.description)}${editorField('Texto sobre a Fecart', 'about.description', about.description)}<p class="section-kicker">grupos fixos</p>`;
    data.groups.forEach((group, index) => { html += `<div class="editor-group"><strong>0${index + 1} · ${escapeHTML(group.name)}</strong>${editorField('Descrição', `group:${group.id}:description`, group.description)}${editorField('Imagem (URL ou caminho)', `group:${group.id}:image`, group.image, 'input')}<div class="editor-field"><label>Substituir imagem localmente</label><input type="file" accept="image/*" data-image-path="group:${group.id}:image"><img class="editor-image-preview" alt="Prévia da imagem do grupo" src="${escapeHTML(group.image || '')}" ${group.image ? '' : 'hidden'}></div></div>`; });
    html += `<p class="section-kicker">projetos</p>`;
    data.projects.forEach(project => { html += `<div class="editor-group"><strong>${escapeHTML(project.title)}</strong>${editorField('Título', `project:${project.id}:title`, project.title, 'input')}${editorField('Descrição curta', `project:${project.id}:shortDescription`, project.shortDescription)}${editorField('Imagem (URL ou caminho)', `project:${project.id}:thumbnail`, project.thumbnail, 'input')}<div class="editor-field"><label>Substituir imagem localmente</label><input type="file" accept="image/*" data-image-path="project:${project.id}:thumbnail"><img class="editor-image-preview" alt="Prévia da imagem do projeto" src="${escapeHTML(project.thumbnail || '')}" ${project.thumbnail ? '' : 'hidden'}></div></div>`; });
    $('#editor-fields').innerHTML = html;
    $$('[data-path]').forEach(field => field.addEventListener('input', () => updateEditorPath(field.dataset.path, field.value)));
    $$('[data-image-path]').forEach(field => field.addEventListener('change', handleImageUpload));
  }

  function updateEditorPath(path, value) {
    if (path.startsWith('group:')) { const [, id, key] = path.split(':'); const item = data.groups.find(group => group.id === id); if (item) item[key] = value; }
    else if (path.startsWith('project:')) { const [, id, key] = path.split(':'); const item = data.projects.find(project => project.id === id); if (item) item[key] = value; }
    else setByPath(path, value);
    renderEditableCopy(); renderGroups(); renderProjects($('.filter-button.active')?.dataset.filter || 'all');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    $('#editor-status').textContent = 'Rascunho salvo neste navegador.';
  }

  function handleImageUpload(event) {
    const input = event.target, path = input.dataset.imagePath, file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateEditorPath(path, reader.result); renderEditor(); $('#editor-status').textContent = 'Imagem adicionada ao rascunho local.'; };
    reader.readAsDataURL(file);
  }

  function openEditor() { renderEditor(); $('#editor-panel').hidden = false; document.body.classList.add('editor-open'); $('#editor-close').focus(); }
  function closeEditor() { $('#editor-panel').hidden = true; document.body.classList.remove('editor-open'); }
  function resetEditor() { data = structuredClone(initialData); localStorage.removeItem(STORAGE_KEY); renderAll(); renderEditor(); $('#editor-status').textContent = 'Conteúdo restaurado para a versão do repositório.'; }
  function exportJSON() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'content-fecart-atualizado.json'; link.click(); URL.revokeObjectURL(link.href); $('#editor-status').textContent = 'JSON exportado. Substitua data/content.json antes de publicar.'; }
  function renderAll() { renderEditableCopy(); renderFilters(); renderProjects(); renderGroups(); }

  function initMenu() { $('#menu-toggle').addEventListener('click', () => { const open = $('#site-nav').classList.toggle('is-open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); }); $$('#site-nav a').forEach(link => link.addEventListener('click', () => { $('#site-nav').classList.remove('is-open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); })); }
  function init() {
    $('#modal-close').addEventListener('click', closeProject); $('#project-modal').addEventListener('click', event => { if (event.target.id === 'project-modal') closeProject(); });
    $('#editor-close').addEventListener('click', closeEditor); $('#editor-hint').addEventListener('click', openEditor); $('#editor-export').addEventListener('click', exportJSON); $('#editor-reset').addEventListener('click', resetEditor);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeProject(); closeEditor(); } if (event.ctrlKey && event.shiftKey && (event.key === '\\' || event.code === 'Backslash')) { event.preventDefault(); $('#editor-panel').hidden ? openEditor() : closeEditor(); } });
    initMenu();
  }
  loadData().then(() => { renderAll(); init(); });
})();
