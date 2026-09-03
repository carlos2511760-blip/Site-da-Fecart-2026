(() => {
  'use strict';
  const supabase = window.FECART_SUPABASE || {};
  const fallbackQuestions = [
    { id: 'q1', prompt: 'O que a Fecart incentiva nos seus projetos?', options: ['Curiosidade, colaboração e robótica', 'Competição sem colaboração', 'Apenas teoria'], correct_index: 0 },
    { id: 'q2', prompt: 'Onde o visitante encontra o Making Of de um projeto?', options: ['Dentro do detalhe individual do projeto', 'Somente no rodapé', 'Em uma página externa'], correct_index: 0 },
    { id: 'q3', prompt: 'Quais são grupos fixos da Fecart?', options: ['Alecrins dourados, Fãotásticos, SabOr robótica e Acerto 404', 'Equipe A, Equipe B e Equipe C', 'Nenhum grupo'], correct_index: 0 },
    { id: 'q4', prompt: 'O que um projeto pode registrar no Making Of?', options: ['Etapas, descobertas e aprendizados', 'Somente a nota final', 'Apenas o nome do projeto'], correct_index: 0 },
    { id: 'q5', prompt: 'Como o visitante demonstra que gostou de um projeto?', options: ['Clicando no botão de curtir', 'Enviando um e-mail obrigatório', 'Criando uma conta'], correct_index: 0 }
  ];
  let questions = [];
  const $ = selector => document.querySelector(selector);
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const apiUrl = path => `${supabase.url || ''}/rest/v1/${path}`;
  const headers = () => ({ apikey: supabase.anonKey || '', Authorization: `Bearer ${supabase.anonKey || ''}`, 'Content-Type': 'application/json' });

  async function loadQuestions() {
    if (supabase.url && supabase.anonKey) {
      try { const response = await fetch(apiUrl('fecart_quiz_questions?select=*&active=eq.true&order=sort_order.asc')); if (response.ok) { const remote = await response.json(); if (remote.length) return remote; } } catch (error) { console.warn('Quiz remoto indisponível.', error); }
    }
    return fallbackQuestions;
  }
  function renderQuestions() { $('#questions').innerHTML = questions.map((question, index) => `<fieldset class="question"><legend><span>${String(index + 1).padStart(2, '0')}</span>${escapeHTML(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label class="answer"><input type="radio" name="question-${escapeHTML(question.id)}" value="${optionIndex}" required><span>${escapeHTML(option)}</span></label>`).join('')}</fieldset>`).join(''); $('#quiz-progress').textContent = `${questions.length} perguntas · uma resposta por questão`; }
  function scoreQuiz() { return questions.reduce((score, question) => { const answer = document.querySelector(`input[name="question-${question.id}"]:checked`); return score + (answer && Number(answer.value) === Number(question.correct_index) ? 1 : 0); }, 0); }
  async function saveAttempt(name, score, answers) { if (!supabase.url || !supabase.anonKey) return false; const response = await fetch(apiUrl('fecart_quiz_attempts'), { method: 'POST', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify({ participant_name: name, score, total_questions: questions.length, answers }) }); return response.ok; }
  async function loadRanking() { const ranking = $('#ranking'); try { if (!supabase.url || !supabase.anonKey) throw new Error('Sem banco'); const response = await fetch(apiUrl('fecart_quiz_attempts?select=participant_name,score,total_questions,created_at&order=score.desc,created_at.asc&limit=20'), { headers: headers() }); if (!response.ok) throw new Error('Falha no ranking'); const rows = await response.json(); renderRanking(rows); } catch { let rows = []; try { rows = JSON.parse(localStorage.getItem('fecart-quiz-ranking') || '[]'); } catch {} renderRanking(rows.sort((a, b) => b.score - a.score).slice(0, 20)); } }
  function renderRanking(rows) { $('#ranking').innerHTML = rows.length ? rows.map((row, index) => `<div class="ranking-row"><strong>${String(index + 1).padStart(2, '0')}</strong><span>${escapeHTML(row.participant_name)}</span><b>${row.score}/${row.total_questions}</b></div>`).join('') : '<p>Nenhum resultado ainda. Seja o primeiro a participar.</p>'; }
  async function submitQuiz(event) { event.preventDefault(); const name = $('#participant-name').value.trim(); const score = scoreQuiz(); const answers = questions.map(question => ({ question_id: question.id, answer: Number(document.querySelector(`input[name="question-${question.id}"]:checked`).value), correct: Number(question.correct_index) })); $('#form-error').textContent = ''; const saved = await saveAttempt(name, score, answers); if (!saved) { const local = JSON.parse(localStorage.getItem('fecart-quiz-ranking') || '[]'); local.push({ participant_name: name, score, total_questions: questions.length, created_at: new Date().toISOString() }); localStorage.setItem('fecart-quiz-ranking', JSON.stringify(local)); } $('#quiz-form').hidden = true; $('#quiz-result').hidden = false; $('#score').textContent = `${score} / ${questions.length}`; $('#result-message').textContent = score === questions.length ? 'Você acertou tudo. Que curiosidade bonita.' : `Você acertou ${score} de ${questions.length}. Continue explorando os projetos da Fecart.`; await loadRanking(); }
  async function init() { questions = await loadQuestions(); $('#start-quiz').addEventListener('click', () => { const name = $('#participant-name').value.trim(); if (!name) { $('#start-error').textContent = 'Digite seu nome para começar.'; return; } $('#start-error').textContent = ''; $('#quiz-start').hidden = true; $('#quiz-form').hidden = false; renderQuestions(); }); $('#quiz-form').addEventListener('submit', submitQuiz); $('#see-ranking').addEventListener('click', () => $('#ranking-section').scrollIntoView({ behavior: 'smooth' })); await loadRanking(); }
  init();
})();
