'use strict';

// ================================================================
// DATA LAYER — Single source of truth via localStorage
// ================================================================
const AppData = {
  STORAGE_KEY: 'replift_data',
  _cache: null,

  getDefaultData() {
    return { programs: [], sessions: [], user: { name: '' } };
  },

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultData();
      const data = JSON.parse(raw);
      if (!data.programs) data.programs = [];
      if (!data.sessions) data.sessions = [];
      this._cache = data;
      return data;
    } catch (e) {
      return this.getDefaultData();
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this._cache = data;
    } catch (e) {
      console.error('AppData.save error:', e);
    }
  },

  /** Invalidate cache — call after any external change (import, test data) */
  invalidateCache() {
    this._cache = null;
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._cache = null;
  },

  // --- Programmes ---
  getPrograms() {
    return this.load().programs;
  },

  getProgramById(id) {
    return this.getPrograms().find(p => p.id === id);
  },

  addProgram(program) {
    const data = this.load();
    program.id = Date.now().toString();
    program.createdAt = new Date().toISOString();
    data.programs.push(program);
    this.save(data);
    return program;
  },

  updateProgram(id, updates) {
    const data = this.load();
    const idx = data.programs.findIndex(p => p.id === id);
    if (idx !== -1) {
      data.programs[idx] = { ...data.programs[idx], ...updates };
      this.save(data);
    }
  },

  deleteProgram(id) {
    const data = this.load();
    data.programs = data.programs.filter(p => p.id !== id);
    this.save(data);
  },

  // --- Sessions ---
  getSessions() {
    return this.load().sessions;
  },

  getSessionById(id) {
    return this.getSessions().find(s => s.id === id);
  },

  addSession(session) {
    const data = this.load();
    session.id = Date.now().toString();
    session.date = new Date().toISOString();
    data.sessions.push(session);
    this.save(data);
    return session;
  },

  deleteSession(id) {
    const data = this.load();
    data.sessions = data.sessions.filter(s => s.id !== id);
    this.save(data);
  },

  getLastSessionForProgram(programId) {
    const sessions = this.getSessions()
      .filter(s => s.programId === programId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return sessions.length > 0 ? sessions[0] : null;
  }
};

// ================================================================
// STATS — Pure computation from AppData
// ================================================================
const AppStats = {
  getTotalSessions() {
    return AppData.getSessions().length;
  },

  getSessionsThisMonth() {
    const now = new Date();
    return AppData.getSessions().filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  },

  getCurrentStreak() {
    const sessions = AppData.getSessions();
    if (!sessions.length) return 0;

    const days = [...new Set(sessions.map(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    let streak = 0;
    const check = new Date();
    check.setHours(0, 0, 0, 0);
    if (days[0] !== check.getTime()) {
      check.setDate(check.getDate() - 1);
    }
    for (const day of days) {
      if (day === check.getTime()) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else if (day < check.getTime()) {
        break;
      }
    }
    return streak;
  },

  getMaxWeight() {
    let max = 0;
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          const w = Number(sr.poids);
          if (w > max) max = w;
        });
      });
    });
    return max > 0 ? max + ' kg' : '-';
  },

  getBestExercise() {
    const count = {};
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        if (ex.nom) count[ex.nom] = (count[ex.nom] || 0) + 1;
      });
    });
    let best = '-';
    let max = 0;
    for (const [name, c] of Object.entries(count)) {
      if (c > max) { max = c; best = name; }
    }
    return best;
  },

  getLastSession() {
    const sessions = AppData.getSessions();
    if (!sessions.length) return '-';
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return new Date(sorted[0].date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  },

  // === Volume & Performance ===
  getTotalVolume() {
    let volume = 0;
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          volume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
        });
      });
    });
    return volume;
  },

  getTotalReps() {
    let reps = 0;
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          reps += Number(sr.reps) || 0;
        });
      });
    });
    return reps;
  },

  getAverageVolumePerSession() {
    const count = AppData.getSessions().length;
    return count > 0 ? Math.round(this.getTotalVolume() / count) : 0;
  },

  getUniqueExercises() {
    const exercises = new Set();
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        if (ex.nom) exercises.add(ex.nom);
      });
    });
    return exercises.size;
  },

  getPersonalRecords() {
    const records = {};
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        if (!ex.nom) return;
        const maxWeight = Math.max(0, ...(ex.series || []).map(sr => Number(sr.poids) || 0));
        if (maxWeight > 0) {
          if (!records[ex.nom] || maxWeight > records[ex.nom].weight) {
            records[ex.nom] = { weight: maxWeight, date: s.date };
          }
        }
      });
    });
    return Object.entries(records)
      .sort(([, a], [, b]) => b.weight - a.weight)
      .slice(0, 5);
  },

  getWeekStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = AppData.getSessions().filter(s => new Date(s.date) >= weekAgo).length;
    const lastWeek = AppData.getSessions().filter(s => {
      const d = new Date(s.date);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;

    return { thisWeek, change: thisWeek - lastWeek };
  },

  getMonthVolumeComparison() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let thisMonthVolume = 0;
    let lastMonthVolume = 0;

    AppData.getSessions().forEach(s => {
      const d = new Date(s.date);
      let sessionVolume = 0;
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          sessionVolume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
        });
      });

      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
        thisMonthVolume += sessionVolume;
      } else if (
        (d.getFullYear() === thisYear && d.getMonth() === thisMonth - 1) ||
        (thisMonth === 0 && d.getFullYear() === thisYear - 1 && d.getMonth() === 11)
      ) {
        lastMonthVolume += sessionVolume;
      }
    });

    const changePercent = lastMonthVolume > 0
      ? Math.round(((thisMonthVolume - lastMonthVolume) / lastMonthVolume) * 100)
      : 0;

    return { volume: thisMonthVolume, changePercent };
  },

  getFavoriteExercises() {
    const count = {};
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        if (ex.nom) count[ex.nom] = (count[ex.nom] || 0) + 1;
      });
    });
    return Object.entries(count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  },

  getAchievements() {
    const sessions = AppData.getSessions().length;
    const volume = this.getTotalVolume();
    const streak = this.getCurrentStreak();
    const exercises = this.getUniqueExercises();

    return [
      { icon: '🎯', title: 'Première Séance', desc: 'Commencer le voyage', earned: sessions >= 1 },
      { icon: '🔥', title: 'Streak 7 jours', desc: 'Une semaine complète', earned: streak >= 7 },
      { icon: '💪', title: 'Volume Master', desc: '10 000 kg soulevés', earned: volume >= 10000 },
      { icon: '🏆', title: 'Diversité', desc: '10 exercices différents', earned: exercises >= 10 },
      { icon: '⚡', title: 'Marathon', desc: '50 séances complétées', earned: sessions >= 50 },
      { icon: '🥇', title: 'Légende', desc: '100 000 kg soulevés', earned: volume >= 100000 }
    ];
  },

  // === Évolution des exercices ===
  getExercisesForEvolution() {
    const exercises = {};
    AppData.getSessions().forEach(session => {
      (session.exercices || []).forEach(ex => {
        if (!ex.nom) return;
        if (!exercises[ex.nom]) {
          exercises[ex.nom] = { name: ex.nom, sessions: [] };
        }
        const maxWeight = Math.max(0, ...(ex.series || []).map(sr => Number(sr.poids) || 0));
        const totalReps = (ex.series || []).reduce((sum, sr) => sum + (Number(sr.reps) || 0), 0);
        if (maxWeight > 0) {
          exercises[ex.nom].sessions.push({
            date: session.date,
            weight: maxWeight,
            reps: totalReps,
            volume: (ex.series || []).reduce((sum, sr) =>
              sum + ((Number(sr.poids) || 0) * (Number(sr.reps) || 0)), 0)
          });
        }
      });
    });

    return Object.values(exercises)
      .filter(ex => ex.sessions.length >= 2)
      .map(ex => {
        ex.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = ex.sessions[0];
        const last = ex.sessions[ex.sessions.length - 1];
        const weightProgress = ((last.weight - first.weight) / first.weight) * 100;

        ex.trend = weightProgress > 5 ? 'up' : (weightProgress < -5 ? 'down' : 'stable');
        ex.progress = Math.round(Math.abs(weightProgress));
        ex.lastWeight = last.weight;
        ex.bestWeight = Math.max(...ex.sessions.map(s => s.weight));
        ex.sessionsCount = ex.sessions.length;
        return ex;
      })
      .sort((a, b) => b.sessionsCount - a.sessionsCount);
  },

  getExerciseEvolution(exerciseName, period = '30d') {
    const cutoffDate = new Date();
    switch (period) {
      case '7d': cutoffDate.setDate(cutoffDate.getDate() - 7); break;
      case '30d': cutoffDate.setDate(cutoffDate.getDate() - 30); break;
      case '3m': cutoffDate.setMonth(cutoffDate.getMonth() - 3); break;
      case '6m': cutoffDate.setMonth(cutoffDate.getMonth() - 6); break;
      case '1y': cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); break;
    }

    const sessions = [];
    AppData.getSessions().forEach(session => {
      if (new Date(session.date) < cutoffDate) return;
      (session.exercices || []).forEach(ex => {
        if (ex.nom !== exerciseName) return;
        const maxWeight = Math.max(0, ...(ex.series || []).map(sr => Number(sr.poids) || 0));
        const totalReps = (ex.series || []).reduce((sum, sr) => sum + (Number(sr.reps) || 0), 0);
        const volume = (ex.series || []).reduce((sum, sr) =>
          sum + ((Number(sr.poids) || 0) * (Number(sr.reps) || 0)), 0);
        if (maxWeight > 0) {
          sessions.push({ date: session.date, weight: maxWeight, reps: totalReps, volume });
        }
      });
    });

    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let progression = 0;
    let bestSession = '-';
    let lastSession = '-';

    if (sessions.length >= 2) {
      const first = sessions[0];
      const last = sessions[sessions.length - 1];
      progression = Math.round(((last.weight - first.weight) / first.weight) * 100);
      const bestIdx = sessions.reduce((maxI, s, i) => s.weight > sessions[maxI].weight ? i : maxI, 0);
      bestSession = sessions[bestIdx].weight + 'kg';
      lastSession = last.weight + 'kg';
    } else if (sessions.length === 1) {
      bestSession = sessions[0].weight + 'kg';
      lastSession = sessions[0].weight + 'kg';
    }

    return {
      sessions,
      stats: {
        progression: `${progression >= 0 ? '+' : ''}${progression}%`,
        bestSession,
        lastSession
      }
    };
  }
};

// ================================================================
// UI LAYER
// ================================================================
const AppUI = {
  currentEditProgramId: null,
  currentSessionProgramId: null,
  currentViewSessionId: null,
  currentChartExercise: null,
  currentChartPeriod: '30d',
  exerciseCounter: 0,

  // --- Helpers ---
  /** HTML-escape a string (prevents XSS in text content) */
  esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  /** Escape a string for safe use inside HTML attributes */
  escAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  // --- Navigation ---
  switchPage(event, pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageName);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (event) {
      const nav = event.target.closest('.nav-item');
      if (nav) nav.classList.add('active');
    }
    this.refreshPage(pageName);
  },

  refreshPage(pageName) {
    AppData.invalidateCache();
    if (pageName === 'dashboard') this.updateDashboard();
    else if (pageName === 'seance') { this.updatePrograms(); this.updateHistorique(); }
    else if (pageName === 'stats') this.updateStats();
  },

  // --- Onglets Séance ---
  switchSeanceTab(evt, tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (evt && evt.target) evt.target.classList.add('active');
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');

    if (tabName === 'programmes') this.updatePrograms();
    else if (tabName === 'historique') this.updateHistorique();
  },

  // --- Dashboard ---
  updateDashboard() {
    document.getElementById('stat-total').textContent = AppStats.getTotalSessions();
    document.getElementById('stat-month').textContent = AppStats.getSessionsThisMonth();
    document.getElementById('stat-streak').textContent = AppStats.getCurrentStreak();
    document.getElementById('stat-maxweight').textContent = AppStats.getMaxWeight();
    document.getElementById('stat-bestexo').textContent = AppStats.getBestExercise();
    document.getElementById('stat-last').textContent = AppStats.getLastSession();
  },

  // --- Programmes ---
  updatePrograms() {
    const programs = AppData.getPrograms();
    const container = document.getElementById('programs-list');
    if (!programs.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">&#128170;</div>' +
          '<p>Aucun programme</p>' +
          '<p class="text-muted">Crée ton premier programme d\'entraînement</p>' +
        '</div>';
      return;
    }
    container.innerHTML = programs.map(p => {
      const exCount = (p.exercices || []).length;
      const sessCount = AppData.getSessions().filter(s => s.programId === p.id).length;
      const badge = (p.exercices || []).map(e => e.nom).filter(Boolean).slice(0, 2).join(', ') || 'Vide';
      return (
        '<div class="card" onclick="AppUI.openEditProgram(\'' + this.escAttr(p.id) + '\')">' +
          '<div class="card-row">' +
            '<div>' +
              '<div class="card-title">' + this.esc(p.nom) + '</div>' +
              '<div class="card-subtitle">' + exCount + ' exercice(s) — ' + sessCount + ' séance(s)</div>' +
            '</div>' +
            '<div class="card-badge">' + this.esc(badge) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  },

  // --- Créer / Éditer Programme ---
  openCreateProgram() {
    this.currentEditProgramId = null;
    document.getElementById('create-program-title').textContent = 'Nouveau Programme';
    document.getElementById('program-name').value = '';
    document.getElementById('program-exercises').innerHTML = '';
    document.getElementById('btn-delete-program').style.display = 'none';
    this.exerciseCounter = 0;
    this.addExerciseToForm();
    this.openOverlay('overlay-create-program');
  },

  openEditProgram(id) {
    const program = AppData.getProgramById(id);
    if (!program) return;
    this.currentEditProgramId = id;
    document.getElementById('create-program-title').textContent = 'Modifier Programme';
    document.getElementById('program-name').value = program.nom || '';
    document.getElementById('program-exercises').innerHTML = '';
    document.getElementById('btn-delete-program').style.display = 'block';
    this.exerciseCounter = 0;
    if (program.exercices && program.exercices.length > 0) {
      program.exercices.forEach(ex => this.addExerciseToForm(ex));
    } else {
      this.addExerciseToForm();
    }
    this.openOverlay('overlay-create-program');
  },

  addExerciseToForm(data) {
    this.exerciseCounter++;
    const idx = this.exerciseCounter;
    const container = document.getElementById('program-exercises');
    const div = document.createElement('div');
    div.className = 'exercise-block';
    div.id = 'exercise-block-' + idx;

    const series = (data && data.series) ? data.series : [{ poids: '', reps: '' }];
    let seriesHTML = '';
    for (let i = 0; i < series.length; i++) {
      seriesHTML += this.seriesRowHTML(idx, i + 1, series[i].poids, series[i].reps);
    }

    div.innerHTML =
      '<div class="exercise-block-header">' +
        '<input type="text" class="form-input" id="exo-name-' + idx + '" placeholder="Nom de l\'exercice" value="' + (data ? this.escAttr(data.nom || '') : '') + '">' +
        '<button class="exercise-remove" onclick="document.getElementById(\'exercise-block-' + idx + '\').remove()">&#10005;</button>' +
      '</div>' +
      '<div id="series-container-' + idx + '">' + seriesHTML + '</div>' +
      '<button class="add-link" onclick="AppUI.addSeriesToExercise(' + idx + ')">+ Ajouter une série</button>';
    container.appendChild(div);
  },

  seriesRowHTML(exoIdx, serieNum, poids, reps) {
    return (
      '<div class="series-row">' +
        '<span class="series-num">' + serieNum + '</span>' +
        '<input type="number" placeholder="kg" value="' + (poids || '') + '" data-type="poids">' +
        '<input type="number" placeholder="reps" value="' + (reps || '') + '" data-type="reps">' +
        '<button class="series-delete" onclick="this.parentElement.remove()">&#10005;</button>' +
      '</div>'
    );
  },

  addSeriesToExercise(exoIdx) {
    const container = document.getElementById('series-container-' + exoIdx);
    if (!container) return;
    const num = container.querySelectorAll('.series-row').length + 1;
    container.insertAdjacentHTML('beforeend', this.seriesRowHTML(exoIdx, num, '', ''));
  },

  saveProgram() {
    const nom = document.getElementById('program-name').value.trim();
    if (!nom) { alert('Donne un nom au programme'); return; }

    const blocks = document.querySelectorAll('.exercise-block');
    const exercices = [];
    blocks.forEach(block => {
      const nameInput = block.querySelector('input[type="text"]');
      const seriesRows = block.querySelectorAll('.series-row');
      const series = [];
      seriesRows.forEach(row => {
        const poids = row.querySelector('[data-type="poids"]').value;
        const reps = row.querySelector('[data-type="reps"]').value;
        series.push({ poids: poids ? Number(poids) : '', reps: reps ? Number(reps) : '' });
      });
      if (nameInput.value.trim()) {
        exercices.push({ nom: nameInput.value.trim(), series });
      }
    });

    if (this.currentEditProgramId) {
      AppData.updateProgram(this.currentEditProgramId, { nom, exercices });
    } else {
      AppData.addProgram({ nom, exercices });
    }

    this.closeOverlay('overlay-create-program');
    this.updatePrograms();
  },

  deleteCurrentProgram() {
    if (!this.currentEditProgramId) return;
    if (confirm('Supprimer ce programme ?')) {
      AppData.deleteProgram(this.currentEditProgramId);
      this.closeOverlay('overlay-create-program');
      this.updatePrograms();
    }
  },

  // --- Démarrer session (bouton +) ---
  openStartSession() {
    const programs = AppData.getPrograms();
    const container = document.getElementById('program-select-list');
    if (!programs.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<p>Aucun programme créé</p>' +
          '<p class="text-muted">Crée un programme dans l\'onglet Séance d\'abord</p>' +
        '</div>';
    } else {
      container.innerHTML = programs.map(p => {
        const exCount = (p.exercices || []).length;
        return (
          '<div class="program-select-card" onclick="AppUI.startSession(\'' + this.escAttr(p.id) + '\')">' +
            '<div class="name">' + this.esc(p.nom) + '</div>' +
            '<div class="info">' + exCount + ' exercice(s)</div>' +
          '</div>'
        );
      }).join('');
    }
    this.openOverlay('overlay-select-program');
  },

  startSession(programId) {
    this.currentSessionProgramId = programId;
    const program = AppData.getProgramById(programId);
    if (!program) return;

    this.closeOverlay('overlay-select-program');
    document.getElementById('active-session-title').textContent = program.nom;

    const lastSession = AppData.getLastSessionForProgram(programId);
    const container = document.getElementById('active-session-exercises');
    container.innerHTML = '';

    (program.exercices || []).forEach(exo => {
      let ghostExo = null;
      if (lastSession && lastSession.exercices) {
        ghostExo = lastSession.exercices.find(e => e.nom === exo.nom);
      }

      const numSeries = Math.max(
        (exo.series || []).length,
        ghostExo ? (ghostExo.series || []).length : 0,
        1
      );

      let html = '<div class="active-exercise" data-exo-name="' + this.escAttr(exo.nom) + '">' +
        '<div class="active-exercise-name">' + this.esc(exo.nom) + '</div>';

      if (ghostExo) {
        html += '<div class="ghost-label">Dernière séance visible en grisé</div>';
      }

      html += '<div class="series-header"><span></span><span>Poids (kg)</span><span>Reps</span><span></span></div>';

      for (let i = 0; i < numSeries; i++) {
        const ghostSerie = ghostExo && ghostExo.series && ghostExo.series[i] ? ghostExo.series[i] : null;
        const templateSerie = exo.series && exo.series[i] ? exo.series[i] : null;

        const ghostPoids = ghostSerie ? ghostSerie.poids : '';
        const ghostReps = ghostSerie ? ghostSerie.reps : '';
        const placeholderPoids = ghostPoids || (templateSerie && templateSerie.poids ? templateSerie.poids : 'kg');
        const placeholderReps = ghostReps || (templateSerie && templateSerie.reps ? templateSerie.reps : 'reps');

        html +=
          '<div class="series-row">' +
            '<span class="series-num">' + (i + 1) + '</span>' +
            '<input type="number" placeholder="' + placeholderPoids + '" data-type="poids"' + (ghostPoids ? ' class="ghost"' : '') + '>' +
            '<input type="number" placeholder="' + placeholderReps + '" data-type="reps"' + (ghostReps ? ' class="ghost"' : '') + '>' +
            '<button class="series-delete" onclick="this.parentElement.remove()">&#10005;</button>' +
          '</div>';
      }

      html += '<button class="add-link" onclick="AppUI.addActiveSeriesRow(this)">+ Série</button></div>';
      container.insertAdjacentHTML('beforeend', html);
    });

    this.openOverlay('overlay-active-session');
  },

  addActiveSeriesRow(btn) {
    const exercise = btn.closest('.active-exercise');
    const rows = exercise.querySelectorAll('.series-row');
    const num = rows.length + 1;
    const html =
      '<div class="series-row">' +
        '<span class="series-num">' + num + '</span>' +
        '<input type="number" placeholder="kg" data-type="poids">' +
        '<input type="number" placeholder="reps" data-type="reps">' +
        '<button class="series-delete" onclick="this.parentElement.remove()">&#10005;</button>' +
      '</div>';
    btn.insertAdjacentHTML('beforebegin', html);
  },

  saveSession() {
    const container = document.getElementById('active-session-exercises');
    const exerciseBlocks = container.querySelectorAll('.active-exercise');
    const exercices = [];

    exerciseBlocks.forEach(block => {
      const nom = block.dataset.exoName;
      const series = [];
      block.querySelectorAll('.series-row').forEach(row => {
        const poidsInput = row.querySelector('[data-type="poids"]');
        const repsInput = row.querySelector('[data-type="reps"]');
        const poids = poidsInput.value || poidsInput.placeholder;
        const reps = repsInput.value || repsInput.placeholder;
        if (poids && reps && poids !== 'kg' && reps !== 'reps') {
          series.push({ poids: Number(poids), reps: Number(reps) });
        }
      });
      if (series.length > 0) exercices.push({ nom, series });
    });

    if (!exercices.length) { alert('Aucune donnée à sauvegarder'); return; }

    const program = AppData.getProgramById(this.currentSessionProgramId);
    AppData.addSession({
      programId: this.currentSessionProgramId,
      programName: program ? program.nom : 'Inconnu',
      exercices
    });

    this.closeOverlay('overlay-active-session');
    this.updateDashboard();
    this.updateHistorique();
    if (document.getElementById('stats').classList.contains('active')) {
      this.updateStats();
    }
    alert('Séance sauvegardée !');
  },

  confirmCloseSession() {
    if (confirm('Abandonner la séance en cours ?')) {
      this.closeOverlay('overlay-active-session');
    }
  },

  // --- Historique ---
  updateHistorique() {
    const sessions = [...AppData.getSessions()].sort((a, b) => new Date(b.date) - new Date(a.date));
    const container = document.getElementById('historique-list');
    if (!sessions.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">&#128203;</div>' +
          '<p>Aucune séance effectuée</p>' +
          '<p class="text-muted">Appuie sur + pour démarrer</p>' +
        '</div>';
      return;
    }
    container.innerHTML = sessions.map(s => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      const exCount = (s.exercices || []).length;
      let totalSeries = 0;
      (s.exercices || []).forEach(ex => { totalSeries += (ex.series || []).length; });
      return (
        '<div class="session-item" onclick="AppUI.viewSession(\'' + this.escAttr(s.id) + '\')">' +
          '<div class="session-item-header">' +
            '<div class="session-item-date">' + dateStr + '</div>' +
            '<div class="session-item-program">' + this.esc(s.programName || '') + '</div>' +
          '</div>' +
          '<div class="session-item-stats">' +
            '<span class="session-item-stat">' + exCount + ' exercice(s)</span>' +
            '<span class="session-item-stat">' + totalSeries + ' série(s)</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  },

  // --- Détail session ---
  viewSession(id) {
    this.currentViewSessionId = id;
    const session = AppData.getSessionById(id);
    if (!session) return;
    const date = new Date(session.date);
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('session-detail-title').textContent = session.programName || 'Séance';

    let html = '<p class="text-muted mb-20">' + dateStr + '</p>';
    (session.exercices || []).forEach(ex => {
      html += '<div class="detail-exercise">' +
        '<div class="detail-exercise-name">' + this.esc(ex.nom) + '</div>';
      (ex.series || []).forEach((s, i) => {
        const poidsStr = s.poids ? s.poids + ' kg' : 'PDC';
        html += '<div class="detail-series"><span>Série ' + (i + 1) + '</span><span>' + poidsStr + '</span><span>' + s.reps + ' reps</span></div>';
      });
      html += '</div>';
    });
    document.getElementById('session-detail-content').innerHTML = html;
    this.openOverlay('overlay-session-detail');
  },

  deleteCurrentSession() {
    if (!this.currentViewSessionId) return;
    if (confirm('Supprimer cette séance ?')) {
      AppData.deleteSession(this.currentViewSessionId);
      this.closeOverlay('overlay-session-detail');
      this.updateHistorique();
      this.updateDashboard();
      if (document.getElementById('stats').classList.contains('active')) {
        this.updateStats();
      }
    }
  },

  // --- Stats ---
  updateStats() {
    document.getElementById('stat-total-volume').textContent = AppStats.getTotalVolume().toLocaleString('fr-FR') + ' kg';
    document.getElementById('stat-total-reps').textContent = AppStats.getTotalReps().toLocaleString('fr-FR');
    document.getElementById('stat-avg-volume').textContent = AppStats.getAverageVolumePerSession().toLocaleString('fr-FR') + ' kg';
    document.getElementById('stat-unique-exercises').textContent = AppStats.getUniqueExercises();

    // Records personnels
    const records = AppStats.getPersonalRecords();
    let recordsHTML = '';
    if (records.length === 0) {
      recordsHTML = '<div class="empty-state"><p>Aucun record pour le moment</p><p class="text-muted">Commence par faire quelques séances</p></div>';
    } else {
      records.forEach(([exercise, data]) => {
        const date = new Date(data.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        recordsHTML +=
          '<div class="record-item">' +
            '<div><div class="record-exercise">' + this.esc(exercise) + '</div>' +
            '<div class="record-date">' + date + '</div></div>' +
            '<div class="record-value">' + data.weight + ' kg</div>' +
          '</div>';
      });
    }
    document.getElementById('personal-records').innerHTML = recordsHTML;

    // Tendances
    const weekStats = AppStats.getWeekStats();
    document.getElementById('week-sessions').textContent = weekStats.thisWeek + ' séances';
    const weekChangeEl = document.getElementById('week-change');
    const weekChangeStr = (weekStats.change >= 0 ? '+' : '') + weekStats.change;
    weekChangeEl.textContent = weekChangeStr + ' vs sem. dernière';
    weekChangeEl.className = 'comparison-change ' + (weekStats.change > 0 ? 'positive' : weekStats.change < 0 ? 'negative' : '');

    const monthStats = AppStats.getMonthVolumeComparison();
    document.getElementById('month-volume').textContent = monthStats.volume.toLocaleString('fr-FR') + ' kg';
    const monthChangeEl = document.getElementById('month-change');
    const monthChangeStr = (monthStats.changePercent >= 0 ? '+' : '') + monthStats.changePercent;
    monthChangeEl.textContent = monthChangeStr + '% vs mois dernier';
    monthChangeEl.className = 'comparison-change ' + (monthStats.changePercent > 0 ? 'positive' : monthStats.changePercent < 0 ? 'negative' : '');

    // Exercices favoris
    const favorites = AppStats.getFavoriteExercises();
    let favoritesHTML = '';
    if (favorites.length === 0) {
      favoritesHTML = '<div class="empty-state"><p>Aucun exercice pour le moment</p></div>';
    } else {
      favorites.forEach(([exercise, count]) => {
        favoritesHTML +=
          '<div class="favorite-item">' +
            '<span class="favorite-name">' + this.esc(exercise) + '</span>' +
            '<span class="favorite-count">' + count + ' fois</span>' +
          '</div>';
      });
    }
    document.getElementById('favorite-exercises').innerHTML = favoritesHTML;

    // Évolution par exercice
    const evolutionExercises = AppStats.getExercisesForEvolution();
    let evolutionHTML = '';
    if (evolutionExercises.length === 0) {
      evolutionHTML = '<div class="empty-state"><p>Pas assez de données</p><p class="text-muted">Il faut au moins 2 séances par exercice</p></div>';
    } else {
      evolutionExercises.forEach(ex => {
        const trendIcon = ex.trend === 'up' ? '⬆️' : ex.trend === 'down' ? '⬇️' : '➡️';
        const trendClass = 'evolution-trend-' + ex.trend;

        evolutionHTML +=
          '<div class="evolution-item" onclick="AppUI.openExerciseChart(\'' + this.escAttr(ex.name) + '\')">' +
            '<div class="evolution-item-header">' +
              '<span class="evolution-item-name">' + this.esc(ex.name) + '</span>' +
              '<div class="evolution-item-trend ' + trendClass + '">' +
                trendIcon + ' ' + ex.progress + '%' +
              '</div>' +
            '</div>' +
            '<div class="evolution-item-stats">' +
              '<div class="evolution-stat">' +
                '<span class="evolution-stat-label">Séances</span>' +
                '<span class="evolution-stat-value">' + ex.sessionsCount + '</span>' +
              '</div>' +
              '<div class="evolution-stat">' +
                '<span class="evolution-stat-label">Dernier</span>' +
                '<span class="evolution-stat-value">' + ex.lastWeight + 'kg</span>' +
              '</div>' +
              '<div class="evolution-stat">' +
                '<span class="evolution-stat-label">Record</span>' +
                '<span class="evolution-stat-value">' + ex.bestWeight + 'kg</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      });
    }
    document.getElementById('exercise-evolution').innerHTML = evolutionHTML;

    // Achievements
    const achievements = AppStats.getAchievements();
    let badgesHTML = '';
    achievements.forEach(badge => {
      badgesHTML +=
        '<div class="badge ' + (badge.earned ? 'earned' : '') + '">' +
          '<div class="badge-icon">' + badge.icon + '</div>' +
          '<div class="badge-title">' + badge.title + '</div>' +
          '<div class="badge-desc">' + badge.desc + '</div>' +
        '</div>';
    });
    document.getElementById('achievements').innerHTML = badgesHTML;
  },

  // --- Graphiques d'évolution ---
  openExerciseChart(exerciseName) {
    this.currentChartExercise = exerciseName;
    this.currentChartPeriod = '30d';

    document.getElementById('chart-exercise-title').textContent = 'Évolution — ' + exerciseName;

    // Select the 30d button by default
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === '30d');
    });

    this.updateExerciseChart();
    this.openOverlay('overlay-exercise-chart');
  },

  switchChartPeriod(evt, period) {
    this.currentChartPeriod = period;

    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    if (evt && evt.target) evt.target.classList.add('active');

    this.updateExerciseChart();
  },

  updateExerciseChart() {
    if (!this.currentChartExercise) return;

    const data = AppStats.getExerciseEvolution(this.currentChartExercise, this.currentChartPeriod);

    const progEl = document.getElementById('chart-progression');
    progEl.textContent = data.stats.progression;
    progEl.className = 'chart-stat-value ' +
      (data.stats.progression.startsWith('+') && data.stats.progression !== '+0%' ? 'positive' :
       data.stats.progression.startsWith('-') ? 'negative' : '');

    document.getElementById('chart-best-session').textContent = data.stats.bestSession;
    document.getElementById('chart-last-session').textContent = data.stats.lastSession;

    this.drawExerciseChart(data.sessions);
  },

  drawExerciseChart(sessions) {
    const canvas = document.getElementById('exercise-chart');
    const ctx = canvas.getContext('2d');

    // Responsive canvas
    const containerEl = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = containerEl.clientWidth - 40;
    const displayHeight = 300;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (sessions.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Pas de données pour cette période', displayWidth / 2, displayHeight / 2);
      return;
    }

    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = displayWidth - padding.left - padding.right;
    const chartHeight = displayHeight - padding.top - padding.bottom;

    const weights = sessions.map(s => s.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1;
    const yPadding = weightRange * 0.1;
    const yMin = minWeight - yPadding;
    const yMax = maxWeight + yPadding;
    const yRange = yMax - yMin;

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      const weight = Math.round(yMax - (yRange / 5) * i);
      ctx.fillStyle = '#888';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(weight + 'kg', padding.left - 8, y + 4);
    }

    const getX = (i) => padding.left + (chartWidth / Math.max(sessions.length - 1, 1)) * i;
    const getY = (w) => padding.top + chartHeight * (1 - (w - yMin) / yRange);

    // Area fill
    if (sessions.length > 1) {
      ctx.beginPath();
      sessions.forEach((s, i) => {
        const x = getX(i);
        const y = getY(s.weight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(getX(sessions.length - 1), padding.top + chartHeight);
      ctx.lineTo(getX(0), padding.top + chartHeight);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, 'rgba(106, 0, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(106, 0, 255, 0.02)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.strokeStyle = '#6a00ff';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      sessions.forEach((s, i) => {
        const x = getX(i);
        const y = getY(s.weight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Points + labels
    sessions.forEach((session, i) => {
      const x = getX(i);
      const y = getY(session.weight);

      ctx.fillStyle = '#6a00ff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#0f0f0f';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(session.weight + 'kg', x, y - 12);
    });

    // Date labels
    ctx.fillStyle = '#888';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    const labelCount = Math.min(sessions.length, 6);
    const showEveryN = Math.max(1, Math.floor(sessions.length / labelCount));
    sessions.forEach((session, i) => {
      if (i % showEveryN === 0 || i === sessions.length - 1) {
        const x = getX(i);
        const date = new Date(session.date);
        const shortDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        ctx.save();
        ctx.translate(x, displayHeight - 8);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(shortDate, 0, 0);
        ctx.restore();
      }
    });
  },

  // --- Overlays ---
  openOverlay(id) {
    document.getElementById(id).classList.add('active');
  },
  closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
  },

  // --- Export / Import / Reset ---
  exportData() {
    try {
      const data = AppData.load();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'replift_backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert('Erreur lors de l\'export');
    }
  },

  /**
   * Generates realistic test data using the proper AppData API.
   * Creates 3 programs (Push/Pull/Legs) and 36 sessions over 3 months.
   */
  generateTestData() {
    if (!confirm('Cela va remplacer toutes les données existantes. Continuer ?')) return;

    AppData.clear();

    const programDefs = [
      {
        nom: 'Push Day',
        exercices: [
          { nom: 'Développé Couché', series: [{ poids: '', reps: 8 }, { poids: '', reps: 8 }, { poids: '', reps: 8 }] },
          { nom: 'Développé Incliné', series: [{ poids: '', reps: 10 }, { poids: '', reps: 10 }, { poids: '', reps: 10 }] },
          { nom: 'Dips', series: [{ poids: '', reps: 12 }, { poids: '', reps: 12 }] }
        ]
      },
      {
        nom: 'Pull Day',
        exercices: [
          { nom: 'Tractions', series: [{ poids: '', reps: 6 }, { poids: '', reps: 6 }, { poids: '', reps: 6 }] },
          { nom: 'Rowing Barre', series: [{ poids: '', reps: 8 }, { poids: '', reps: 8 }, { poids: '', reps: 8 }] },
          { nom: 'Curl Biceps', series: [{ poids: '', reps: 10 }, { poids: '', reps: 10 }] }
        ]
      },
      {
        nom: 'Leg Day',
        exercices: [
          { nom: 'Squat', series: [{ poids: '', reps: 8 }, { poids: '', reps: 8 }, { poids: '', reps: 8 }] },
          { nom: 'Soulevé de Terre', series: [{ poids: '', reps: 5 }, { poids: '', reps: 5 }] },
          { nom: 'Leg Press', series: [{ poids: '', reps: 12 }, { poids: '', reps: 12 }] }
        ]
      }
    ];

    const createdPrograms = programDefs.map(def => AppData.addProgram(def));

    const exerciseConfig = {
      'Développé Couché': { startWeight: 60, progression: 1.0, isWeighted: true },
      'Développé Incliné': { startWeight: 45, progression: 0.8, isWeighted: true },
      'Dips': { startReps: 8, repsProgression: 0.2, isWeighted: false },
      'Tractions': { startReps: 4, repsProgression: 0.15, isWeighted: false },
      'Rowing Barre': { startWeight: 50, progression: 0.7, isWeighted: true },
      'Curl Biceps': { startWeight: 15, progression: 0.4, isWeighted: true },
      'Squat': { startWeight: 80, progression: 1.2, isWeighted: true },
      'Soulevé de Terre': { startWeight: 100, progression: 1.5, isWeighted: true },
      'Leg Press': { startWeight: 120, progression: 2.0, isWeighted: true }
    };

    const data = AppData.load();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let week = 0; week < 12; week++) {
      for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + (week * 7) + (dayIdx * 2));

        const program = createdPrograms[dayIdx];

        const exercices = program.exercices.map(ex => {
          const config = exerciseConfig[ex.nom];
          if (!config) return null;

          return {
            nom: ex.nom,
            series: ex.series.map(sr => {
              if (config.isWeighted) {
                const weeklyProgress = week * config.progression;
                const variation = (Math.random() - 0.5) * 5;
                const finalWeight = Math.max(5, Math.round((config.startWeight + weeklyProgress + variation) * 2) / 2);
                const baseReps = Number(sr.reps) || 8;
                const repsVariation = Math.floor(Math.random() * 3) - 1;
                const finalReps = Math.max(1, baseReps + repsVariation);
                return { poids: finalWeight, reps: finalReps };
              } else {
                const weeklyRepsProgress = week * config.repsProgression;
                const repsVariation = Math.floor(Math.random() * 2);
                const finalReps = Math.max(1, Math.floor(config.startReps + weeklyRepsProgress + repsVariation));
                return { poids: 0, reps: finalReps };
              }
            })
          };
        }).filter(Boolean);

        data.sessions.push({
          id: Date.now().toString() + '_' + week + '_' + dayIdx,
          date: sessionDate.toISOString(),
          programId: program.id,
          programName: program.nom,
          exercices
        });
      }
    }

    AppData.save(data);

    alert(
      'Données de test générées !\n' +
      '• ' + createdPrograms.length + ' programmes\n' +
      '• ' + data.sessions.length + ' séances sur 3 mois\n' +
      '• Progression réaliste incluse'
    );

    AppData.invalidateCache();
    this.updateDashboard();
    this.updatePrograms();
    this.updateHistorique();
    this.updateStats();
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!imported.programs && !imported.sessions) {
            throw new Error('Invalid format');
          }
          AppData.save(imported);
          AppData.invalidateCache();
          this.updateDashboard();
          this.updatePrograms();
          this.updateHistorique();
          this.updateStats();
          alert('Données importées avec succès');
        } catch (err) {
          alert('Fichier invalide');
        }
      };
      reader.readAsText(e.target.files[0]);
    };
    input.click();
  },

  resetData() {
    if (confirm('Supprimer toutes les données ?')) {
      if (confirm('Dernière confirmation : action irréversible !')) {
        AppData.clear();
        this.updateDashboard();
        this.updatePrograms();
        this.updateHistorique();
        this.updateStats();
      }
    }
  }
};

// ================================================================
// APP INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  AppUI.updateDashboard();
  AppUI.updatePrograms();
  AppUI.updateHistorique();
  AppUI.updateStats();
});
