'use strict';

const APP_VERSION = '1.4.0';

// SVG icon helper — returns inline <svg> referencing the sprite
function _ic(name, cls) {
  return '<svg class="icon' + (cls ? ' ' + cls : '') + '"><use href="#i-' + name + '"/></svg>';
}

// ================================================================
// DATA LAYER — Single source of truth via localStorage
// ================================================================
const AppData = {
  STORAGE_KEY: 'replift_data',
  _cache: null,

  getDefaultData() {
    return { version: APP_VERSION, programs: [], sessions: [], user: { name: '' }, recentAchievements: [], activeSession: null };
  },

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultData();
      const data = JSON.parse(raw);
      if (!data.programs) data.programs = [];
      if (!data.sessions) data.sessions = [];
      if (!data.version) data.version = APP_VERSION;
      // Migrate: merge old separate recent achievements into main data
      if (!data.recentAchievements) {
        const old = localStorage.getItem('replift_recent_achievements');
        data.recentAchievements = old ? JSON.parse(old) : [];
        localStorage.removeItem('replift_recent_achievements');
      }
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
    AppStats.clearMemo();
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('replift_recent_achievements');
    this._cache = null;
  },

  // --- Active Session (auto-save for PWA persistence) ---
  saveActiveSession(sessionData) {
    const data = this.load();
    data.activeSession = {
      programId: sessionData.programId,
      programName: sessionData.programName,
      startTime: sessionData.startTime || Date.now(),
      exercises: sessionData.exercises || []
    };
    this.save(data);
  },

  loadActiveSession() {
    const data = this.load();
    return data.activeSession;
  },

  clearActiveSession() {
    const data = this.load();
    data.activeSession = null;
    this.save(data);
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
  },

  duplicateProgram(id) {
    const original = this.getProgramById(id);
    if (!original) return null;
    const copy = {
      nom: original.nom + ' (copie)',
      exercices: JSON.parse(JSON.stringify(original.exercices || []))
    };
    return this.addProgram(copy);
  },

  deleteProgramWithSessions(id) {
    const data = this.load();
    data.programs = data.programs.filter(p => p.id !== id);
    data.sessions = data.sessions.filter(s => s.programId !== id);
    this.save(data);
  }
};

// ================================================================
// STATS — Pure computation from AppData (with memoization)
// ================================================================
const AppStats = {
  _memo: {},
  
  /** Clear memoized stats — called when data changes */
  clearMemo() { this._memo = {}; },
  
  _cached(key, fn) {
    if (this._memo[key] !== undefined) return this._memo[key];
    const result = fn();
    this._memo[key] = result;
    return result;
  },

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
    return this._cached('totalVolume', () => {
      let volume = 0;
      AppData.getSessions().forEach(s => {
        (s.exercices || []).forEach(ex => {
          (ex.series || []).forEach(sr => {
            volume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
          });
        });
      });
      return volume;
    });
  },

  getTotalReps() {
    return this._cached('totalReps', () => {
      let reps = 0;
      AppData.getSessions().forEach(s => {
        (s.exercices || []).forEach(ex => {
          (ex.series || []).forEach(sr => {
            reps += Number(sr.reps) || 0;
          });
        });
      });
      return reps;
    });
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
    return this._cached('personalRecords', () => {
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
    });
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
    const totalReps = this.getTotalReps();
    const weeklyStreak = this.getWeeklyStreak();
    const prs = this.getPersonalRecords().length;

    return [
      // Débutant
      { id: 'first', icon: '🎯', title: 'Première Séance', desc: 'Commencer le voyage', earned: sessions >= 1, req: '1 séance' },
      { id: 'five', icon: '✋', title: 'Cinq de Plus', desc: '5 séances complétées', earned: sessions >= 5, req: '5 séances' },
      { id: 'ten', icon: '🔟', title: 'Régulier', desc: '10 séances complétées', earned: sessions >= 10, req: '10 séances' },
      // Volume
      { id: 'vol5k', icon: '💪', title: 'Volume Rookie', desc: '5 000 kg soulevés', earned: volume >= 5000, req: '5 000 kg' },
      { id: 'vol10k', icon: '🏋️', title: 'Volume Master', desc: '10 000 kg soulevés', earned: volume >= 10000, req: '10 000 kg' },
      { id: 'vol50k', icon: '🔥', title: 'Machine de Guerre', desc: '50 000 kg soulevés', earned: volume >= 50000, req: '50 000 kg' },
      { id: 'vol100k', icon: '🥇', title: 'Légende', desc: '100 000 kg soulevés', earned: volume >= 100000, req: '100 000 kg' },
      // Streak & Régularité
      { id: 'streak3', icon: '📅', title: 'Semaine Lancée', desc: 'Streak de 3 jours', earned: streak >= 3, req: '3 jours d\'affilée' },
      { id: 'streak7', icon: '🔥', title: 'Streak 7 jours', desc: 'Une semaine complète', earned: streak >= 7, req: '7 jours d\'affilée' },
      { id: 'wstreak4', icon: '📆', title: 'Mois Solide', desc: '4 semaines consécutives', earned: weeklyStreak >= 4, req: '4 sem. d\'affilée' },
      { id: 'wstreak8', icon: '💎', title: 'Deux Mois Fort', desc: '8 semaines consécutives', earned: weeklyStreak >= 8, req: '8 sem. d\'affilée' },
      // Diversité & Maîtrise
      { id: 'div5', icon: '🎨', title: 'Curieux', desc: '5 exercices différents', earned: exercises >= 5, req: '5 exercices' },
      { id: 'div10', icon: '🏆', title: 'Diversifié', desc: '10 exercices différents', earned: exercises >= 10, req: '10 exercices' },
      { id: 'div15', icon: '🌟', title: 'Polyvalent', desc: '15 exercices maîtrisés', earned: exercises >= 15, req: '15 exercices' },
      // Endurance
      { id: 'marathon', icon: '⚡', title: 'Marathon', desc: '50 séances complétées', earned: sessions >= 50, req: '50 séances' },
      { id: 'centurion', icon: '🏅', title: 'Centurion', desc: '100 séances complétées', earned: sessions >= 100, req: '100 séances' },
      // Reps
      { id: 'reps1k', icon: '🔢', title: 'Mille Reps', desc: '1 000 répétitions', earned: totalReps >= 1000, req: '1 000 reps' },
      { id: 'reps5k', icon: '💯', title: 'Rep Machine', desc: '5 000 répétitions', earned: totalReps >= 5000, req: '5 000 reps' },
    ];
  },

  // === Profile Stats ===
  getProfileSummary() {
    const sessions = AppData.getSessions();
    const totalSessions = sessions.length;
    const totalVolume = this.getTotalVolume();
    const totalPRs = this.getPersonalRecords().length;
    const weeklyStreak = this.getWeeklyStreak();

    // Days since first session
    let activeDays = 0;
    if (totalSessions > 0) {
      const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstDate = new Date(sorted[0].date);
      const now = new Date();
      activeDays = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));
    }

    return { totalSessions, totalVolume, totalPRs, weeklyStreak, activeDays };
  },

  getProfileEvolution() {
    const sessions = AppData.getSessions();
    const now = new Date();

    // Monthly volumes for last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();

      let volume = 0;
      let count = 0;
      sessions.forEach(s => {
        const sd = new Date(s.date);
        if (sd.getMonth() === month && sd.getFullYear() === year) {
          count++;
          (s.exercices || []).forEach(ex => {
            (ex.series || []).forEach(sr => {
              volume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
            });
          });
        }
      });

      months.push({ month, year, volume, count });
    }

    // Best month
    const bestMonth = months.reduce((best, m) => m.volume > best.volume ? m : best, { volume: 0 });
    // Average monthly volume (only months with activity)
    const activeMonths = months.filter(m => m.volume > 0);
    const avgMonthlyVolume = activeMonths.length > 0
      ? Math.round(activeMonths.reduce((sum, m) => sum + m.volume, 0) / activeMonths.length)
      : 0;

    return { months, bestMonth, avgMonthlyVolume };
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
  },

  // === Dashboard New Stats ===
  getMonthlyVolume() {
    const now = new Date();
    let volume = 0;
    AppData.getSessions().forEach(s => {
      const d = new Date(s.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        (s.exercices || []).forEach(ex => {
          (ex.series || []).forEach(sr => {
            volume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
          });
        });
      }
    });
    return volume;
  },

  get30DayProgression() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    let current30Volume = 0;
    let previous30Volume = 0;

    AppData.getSessions().forEach(s => {
      const d = new Date(s.date);
      let sessionVolume = 0;
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          sessionVolume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
        });
      });

      if (d >= thirtyDaysAgo) {
        current30Volume += sessionVolume;
      } else if (d >= sixtyDaysAgo && d < thirtyDaysAgo) {
        previous30Volume += sessionVolume;
      }
    });

    if (previous30Volume === 0) return current30Volume > 0 ? '+100%' : '-';
    const percent = Math.round(((current30Volume - previous30Volume) / previous30Volume) * 100);
    return `${percent >= 0 ? '+' : ''}${percent}%`;
  },

  getPRsThisMonth() {
    const now = new Date();
    const records = {};
    const newRecords = [];

    // Build all-time records
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

    // Count PRs set this month
    Object.values(records).forEach(record => {
      const d = new Date(record.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        newRecords.push(record);
      }
    });

    return newRecords.length;
  },

  getDaysSinceLastSession() {
    const sessions = AppData.getSessions();
    if (!sessions.length) return '-';
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastDate = new Date(sorted[0].date);
    const now = new Date();
    const diffMs = now - lastDate;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days === 0 ? "Aujourd'hui" : days === 1 ? '1 jour' : `${days} jours`;
  },

  getWeeklyStreak() {
    return this._cached('weeklyStreak', () => {
      const sessions = AppData.getSessions();
      if (!sessions.length) return 0;

      const weekMap = {};
      sessions.forEach(s => {
        const d = new Date(s.date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.getFullYear(), d.getMonth(), diff);
        monday.setHours(0, 0, 0, 0);
        const weekKey = monday.getTime();
        weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
      });

      const weeks = Object.keys(weekMap).map(Number).sort((a, b) => b - a);
      if (!weeks.length) return 0;

      const now = new Date();
      const nowDay = now.getDay();
      const nowDiff = now.getDate() - nowDay + (nowDay === 0 ? -6 : 1);
      const nowMonday = new Date(now.getFullYear(), now.getMonth(), nowDiff);
      nowMonday.setHours(0, 0, 0, 0);

      let streak = 0;
      let checkWeek = nowMonday.getTime();

      while (weekMap[checkWeek]) {
        streak++;
        checkWeek -= 7 * 24 * 60 * 60 * 1000;
      }

      return streak;
    });
  },

  getCalendarData(year, month) {
    // Build volume map: dayKey → total volume (kg) for the given month
    const volumeMap = {};
    
    AppData.getSessions().forEach(s => {
      const d = new Date(s.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      
      const dayKey = d.getDate();
      let sessionVolume = 0;
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          sessionVolume += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
        });
      });
      volumeMap[dayKey] = (volumeMap[dayKey] || 0) + sessionVolume;
    });

    // Build calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Monday = 0, ..., Sunday = 6 (ISO style)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    // Collect all non-zero volumes to compute percentile thresholds
    const allVolumes = Object.values(volumeMap).filter(v => v > 0);
    allVolumes.sort((a, b) => a - b);
    
    const p33 = allVolumes.length ? allVolumes[Math.floor(allVolumes.length * 0.33)] : 0;
    const p66 = allVolumes.length ? allVolumes[Math.floor(allVolumes.length * 0.66)] : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    // Empty cells before the 1st
    for (let i = 0; i < startOffset; i++) {
      days.push({ empty: true });
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const volume = volumeMap[d] || 0;
      const dateObj = new Date(year, month, d);
      const isFuture = dateObj > today;
      
      let intensity = 'none';
      if (isFuture) {
        intensity = 'future';
      } else if (volume > 0) {
        if (volume <= p33) intensity = 'low';
        else if (volume <= p66) intensity = 'medium';
        else intensity = 'high';
      }
      
      days.push({
        day: d,
        volume,
        intensity,
        isFuture,
        isToday: dateObj.getTime() === today.getTime()
      });
    }
    
    // Monthly total
    const totalVolume = Object.values(volumeMap).reduce((a, b) => a + b, 0);
    const sessionCount = new Set(
      AppData.getSessions()
        .filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .map(s => new Date(s.date).getDate())
    ).size;

    return { days, totalVolume, sessionCount, year, month };
  },

  // === Strategic Metrics ===
  getAverageIntensity() {
    let totalWeightedReps = 0;
    let totalReps = 0;
    
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        (ex.series || []).forEach(sr => {
          const poids = Number(sr.poids) || 0;
          const reps = Number(sr.reps) || 0;
          totalWeightedReps += poids * reps;
          totalReps += reps;
        });
      });
    });
    
    return totalReps > 0 ? Math.round(totalWeightedReps / totalReps) : 0;
  },

  getMuscleBalance() {
    const pushExercises = ['développé couché', 'développé incliné', 'dips', 'pompes', 'développé militaire', 'développé haltère', 'bench press', 'bench', 'overhead press', 'ohp', 'push up', 'push-up', 'élévations latérales', 'latérales', 'extensions triceps', 'triceps', 'skull crusher', 'pec fly', 'pec deck', 'écartés', 'fly', 'military press', 'press épaules', 'shoulder press'];
    const pullExercises = ['tractions', 'rowing', 'tirage horizontal', 'tirage vertical', 'curl', 'pull up', 'pull-up', 'chin up', 'deadlift', 'face pull', 'facepull', 'lat pulldown', 'poulie haute', 'poulie basse', 'shrug', 'soulevé de terre', 'row', 'barbell row', 'dumbbell row', 'biceps', 'hammer curl', 'tirage', 'pull'];
    
    let pushCount = 0;
    let pullCount = 0;
    
    AppData.getSessions().forEach(s => {
      (s.exercices || []).forEach(ex => {
        const exerciseName = (ex.nom || '').toLowerCase();
        if (pushExercises.some(pe => exerciseName.includes(pe))) {
          pushCount += (ex.series || []).length;
        } else if (pullExercises.some(pe => exerciseName.includes(pe))) {
          pullCount += (ex.series || []).length;
        }
      });
    });
    
    const total = pushCount + pullCount;
    if (total === 0) return 'Équilibré';
    
    const pushRatio = Math.round((pushCount / total) * 100);
    if (pushRatio >= 60) return 'Push dominant';
    if (pushRatio <= 40) return 'Pull dominant';
    return 'Équilibré';
  },

  getProgressionRate() {
    // Calculate average monthly progression rate across all exercises with PRs
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const exerciseProgress = {};
    
    AppData.getSessions()
      .filter(s => new Date(s.date) >= threeMonthsAgo)
      .forEach(s => {
        const sessionDate = new Date(s.date);
        (s.exercices || []).forEach(ex => {
          if (!ex.nom) return;
          const maxWeight = Math.max(0, ...(ex.series || []).map(sr => Number(sr.poids) || 0));
          if (maxWeight > 0) {
            if (!exerciseProgress[ex.nom]) {
              exerciseProgress[ex.nom] = [];
            }
            exerciseProgress[ex.nom].push({ date: sessionDate, weight: maxWeight });
          }
        });
      });
    
    let totalProgressRates = [];
    Object.values(exerciseProgress).forEach(sessions => {
      if (sessions.length >= 2) {
        sessions.sort((a, b) => a.date - b.date);
        const first = sessions[0];
        const last = sessions[sessions.length - 1];
        const monthsDiff = (last.date - first.date) / (1000 * 60 * 60 * 24 * 30);
        if (monthsDiff > 0) {
          const monthlyRate = ((last.weight - first.weight) / first.weight) * 100 / monthsDiff;
          totalProgressRates.push(monthlyRate);
        }
      }
    });
    
    if (totalProgressRates.length === 0) return 0;
    const avgRate = totalProgressRates.reduce((a, b) => a + b, 0) / totalProgressRates.length;
    return Math.round(avgRate);
  },

  getRecentAchievements() {
    const current = this.getAchievements();
    const earned = current.filter(a => a.earned);
    
    const data = AppData.load();
    let stored = data.recentAchievements || [];
    
    const storedIds = stored.map(a => a.id || a.title);
    const newAchievements = earned.filter(a => !storedIds.includes(a.id || a.title));
    
    if (newAchievements.length > 0) {
      stored = [...newAchievements, ...stored].slice(0, 3);
      data.recentAchievements = stored;
      AppData.save(data);
    }
    
    return stored;
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

  // Current calendar month offset (0 = current month, -1 = last month, etc.)
  calendarOffset: 0,

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

  /** Safe DOM accessor — returns element or a no-op stub */
  $(id) {
    return document.getElementById(id) || { textContent: '', innerHTML: '', style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, setAttribute(){}, addEventListener(){} };
  },

  // --- Toast ---
  showToast(msg, duration) {
    duration = duration || 3000;
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
  },

  // --- Session Timer ---
  _sessionTimerInterval: null,
  _sessionTimerStart: null,
  _autoSaveInterval: null,

  // --- Rest Timer ---
  _restTimerInterval: null,
  _restTimerRemaining: 0,
  _restTimerTotal: 0,

  /** Remove a series row and its associated note-input sibling */
  deleteSeriesRow(btn) {
    const row = btn.closest('.series-row');
    if (!row) return;
    const next = row.nextElementSibling;
    if (next && next.classList.contains('note-input')) next.remove();
    // Also remove rest-timer-bar if it follows the note
    const nextAfter = row.nextElementSibling;
    if (nextAfter && nextAfter.classList.contains('rest-timer-bar')) nextAfter.remove();
    row.remove();
  },

  startSessionTimer(savedStartTime) {
    this.stopSessionTimer();
    this._sessionTimerStart = savedStartTime || Date.now();
    var self = this;
    var el = document.getElementById('session-timer-value');
    if (!el) return;
    // Show current elapsed immediately
    var initElapsed = Math.floor((Date.now() - self._sessionTimerStart) / 1000);
    var im = Math.floor(initElapsed / 60).toString().padStart(2, '0');
    var is = (initElapsed % 60).toString().padStart(2, '0');
    el.textContent = im + ':' + is;
    this._sessionTimerInterval = setInterval(function() {
      var elapsed = Math.floor((Date.now() - self._sessionTimerStart) / 1000);
      var m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      var s = (elapsed % 60).toString().padStart(2, '0');
      el.textContent = m + ':' + s;
    }, 1000);
  },

  stopSessionTimer() {
    if (this._sessionTimerInterval) {
      clearInterval(this._sessionTimerInterval);
      this._sessionTimerInterval = null;
    }
    var el = document.getElementById('session-timer-value');
    if (el) el.textContent = '00:00';
  },

  // --- Auto-save active session (PWA persistence) ---
  startAutoSave() {
    this.stopAutoSave();
    var self = this;
    this._autoSaveInterval = setInterval(function() {
      self.captureActiveSessionState();
    }, 5000); // Every 5 seconds
  },

  stopAutoSave() {
    if (this._autoSaveInterval) {
      clearInterval(this._autoSaveInterval);
      this._autoSaveInterval = null;
    }
  },

  // --- Rest Timer Between Sets ---
  startRestTimer(seconds, triggerBtn) {
    this.stopRestTimer();
    this._restTimerTotal = seconds;
    this._restTimerRemaining = seconds;

    // Find or create the rest-timer-bar after the note-input (which follows series-row)
    const seriesRow = triggerBtn.closest('.series-row');
    // note-input is the next sibling after series-row
    let noteEl = seriesRow.nextElementSibling;
    let insertAfter = (noteEl && noteEl.classList.contains('note-input')) ? noteEl : seriesRow;
    let bar = insertAfter.nextElementSibling;
    if (!bar || !bar.classList.contains('rest-timer-bar')) {
      bar = document.createElement('div');
      bar.className = 'rest-timer-bar';
      bar.innerHTML =
        '<div class="rest-timer-top">' +
          '<div><div class="rest-timer-display"></div><div class="rest-timer-label">Repos</div></div>' +
          '<button class="rest-timer-skip" onclick="AppUI.skipRestTimer()">Passer</button>' +
        '</div>' +
        '<div class="rest-timer-progress"><div class="rest-timer-fill"></div></div>';
      insertAfter.insertAdjacentElement('afterend', bar);
    }
    bar.style.display = 'flex';
    this._activeRestBar = bar;

    var self = this;
    var display = bar.querySelector('.rest-timer-display');
    var fill = bar.querySelector('.rest-timer-fill');

    function tick() {
      if (self._restTimerRemaining <= 0) {
        self.onRestTimerComplete();
        return;
      }
      var m = Math.floor(self._restTimerRemaining / 60);
      var s = self._restTimerRemaining % 60;
      display.textContent = (m > 0 ? m + ':' : '') + s.toString().padStart(2, '0');
      var pct = ((self._restTimerTotal - self._restTimerRemaining) / self._restTimerTotal) * 100;
      fill.style.width = pct + '%';
      self._restTimerRemaining--;
    }

    tick();
    this._restTimerInterval = setInterval(tick, 1000);
  },

  stopRestTimer() {
    if (this._restTimerInterval) {
      clearInterval(this._restTimerInterval);
      this._restTimerInterval = null;
    }
    if (this._activeRestBar) {
      this._activeRestBar.style.display = 'none';
      this._activeRestBar = null;
    }
  },

  skipRestTimer() {
    this.stopRestTimer();
    this.showToast('Repos passé');
  },

  onRestTimerComplete() {
    clearInterval(this._restTimerInterval);
    this._restTimerInterval = null;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (this._activeRestBar) {
      var fill = this._activeRestBar.querySelector('.rest-timer-fill');
      var display = this._activeRestBar.querySelector('.rest-timer-display');
      if (fill) fill.style.width = '100%';
      if (display) display.textContent = 'Terminé !';
      var bar = this._activeRestBar;
      this._activeRestBar = null;
      setTimeout(function() { bar.style.display = 'none'; }, 2000);
    }
    this.showToast('Repos terminé !');
  },

  captureActiveSessionState() {
    if (!this.currentSessionProgramId) return;
    
    const container = document.getElementById('active-session-exercises');
    if (!container) return;
    
    const exercises = [];
    container.querySelectorAll('.active-exercise').forEach(function(block) {
      const nom = block.dataset.exoName;
      const series = [];
      block.querySelectorAll('.series-row').forEach(function(row) {
        const poidsInput = row.querySelector('[data-type="poids"]');
        const repsInput = row.querySelector('[data-type="reps"]');
        const noteEl = row.nextElementSibling;
        const poids = poidsInput ? poidsInput.value : '';
        const reps = repsInput ? repsInput.value : '';
        const note = (noteEl && noteEl.classList.contains('note-input')) ? noteEl.value : '';
        series.push({ poids: poids, reps: reps, note: note });
      });
      exercises.push({ nom: nom, series: series });
    });

    const program = AppData.getProgramById(this.currentSessionProgramId);
    AppData.saveActiveSession({
      programId: this.currentSessionProgramId,
      programName: program ? program.nom : 'Inconnu',
      startTime: this._sessionTimerStart || Date.now(),
      exercises: exercises
    });
  },

  // --- Greeting ---
  updateGreeting() {
    var data = AppData.load();
    var name = (data.user && data.user.name) ? data.user.name : '';
    var hour = new Date().getHours();
    var greeting;
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    var el = document.getElementById('header-greeting');
    if (el) el.textContent = name ? greeting + ', ' + name : greeting;
  },

  // --- Historique offset ---
  historiqueOffset: 0,

  navigateHistorique(direction) {
    this.historiqueOffset += direction;
    this.updateHistorique();
  },

  // --- Swipe-to-close overlays ---
  setupSwipeToClose() {
    var overlays = document.querySelectorAll('.overlay');
    overlays.forEach(function(overlay) {
      var startY = 0;
      var startX = 0;
      var currentY = 0;
      var dragging = false;
      var header = overlay.querySelector('.overlay-header');
      if (!header) return; // Only overlays with a header support swipe

      // Swipe is ONLY detected on the header bar, never on content/inputs
      header.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        currentY = startY;
        dragging = true;
      }, { passive: true });

      header.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        var dx = Math.abs(e.touches[0].clientX - startX);
        var dy = currentY - startY;
        // Cancel if horizontal movement is dominant (user is scrolling sideways)
        if (dx > 30) { dragging = false; return; }
        if (dy > 0) {
          overlay.style.transform = 'translateY(' + dy + 'px)';
          overlay.style.transition = 'none';
        }
      }, { passive: true });

      header.addEventListener('touchend', function() {
        if (!dragging) { overlay.style.transform = ''; return; }
        dragging = false;
        var diff = currentY - startY;
        overlay.style.transition = 'transform .3s ease';
        if (diff > 180) {
          overlay.style.transform = 'translateY(100%)';
          setTimeout(function() {
            AppUI.closeOverlay(overlay.id);
            overlay.style.transform = '';
            overlay.style.transition = '';
          }, 300);
        } else {
          overlay.style.transform = '';
        }
      });

      header.addEventListener('touchcancel', function() {
        dragging = false;
        overlay.style.transform = '';
        overlay.style.transition = '';
      });
    });
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
    else if (pageName === 'profil') this.updateProfile();
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
    document.getElementById('stat-month').textContent = AppStats.getSessionsThisMonth();
    
    const volumeMonth = AppStats.getMonthlyVolume();
    document.getElementById('stat-volume-month').textContent = 
      volumeMonth > 0 ? `${volumeMonth.toLocaleString('fr-FR')} kg` : '0 kg';
    
    document.getElementById('stat-progression').textContent = AppStats.get30DayProgression();
    document.getElementById('stat-prs-month').textContent = AppStats.getPRsThisMonth();
    document.getElementById('stat-last-session').textContent = AppStats.getDaysSinceLastSession();
    
    const weeklyStreak = AppStats.getWeeklyStreak();
    document.getElementById('stat-weekly-streak').textContent = 
      weeklyStreak === 0 ? '0' : weeklyStreak === 1 ? '1 sem.' : `${weeklyStreak} sem.`;
    
    // Render heatmap
    this.renderCalendar();
  },

  navigateCalendar(direction) {
    this.calendarOffset += direction;
    // Clamp: don't go into the future
    if (this.calendarOffset > 0) this.calendarOffset = 0;
    // Clamp: max 12 months back
    if (this.calendarOffset < -11) this.calendarOffset = -11;
    this.renderCalendar();
  },

  renderCalendar() {
    const container = document.getElementById('heatmap-container');
    
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + this.calendarOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const data = AppStats.getCalendarData(year, month);
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    
    let html = '<div class="cal-widget">';
    
    // Header: nav + month name
    html += '<div class="cal-header">';
    html += `<button class="cal-nav" onclick="AppUI.navigateCalendar(-1)" aria-label="Mois précédent">‹</button>`;
    html += `<span class="cal-title">${monthNames[month]} ${year}</span>`;
    const isCurrentMonth = this.calendarOffset === 0;
    html += `<button class="cal-nav${isCurrentMonth ? ' disabled' : ''}" onclick="AppUI.navigateCalendar(1)" ${isCurrentMonth ? 'disabled' : ''} aria-label="Mois suivant">›</button>`;
    html += '</div>';
    
    // Day-of-week headers
    html += '<div class="cal-grid">';
    dayHeaders.forEach(d => {
      html += `<div class="cal-day-header">${d}</div>`;
    });
    
    // Day cells
    data.days.forEach(d => {
      if (d.empty) {
        html += '<div class="cal-cell empty"></div>';
        return;
      }
      
      const todayClass = d.isToday ? ' today' : '';
      const volumeLabel = d.volume > 0 
        ? (d.volume >= 1000 ? `${(d.volume / 1000).toFixed(1)}t` : `${d.volume}kg`)
        : '';
      const tooltip = d.isFuture ? '' : (d.volume > 0 
        ? `${d.day} — ${d.volume.toLocaleString('fr-FR')} kg soulevés` 
        : `${d.day} — Repos`);
      
      html += `<div class="cal-cell ${d.intensity}${todayClass}" title="${tooltip}">`;
      html += `<span class="cal-day-num">${d.day}</span>`;
      if (volumeLabel && !d.isFuture) {
        html += `<span class="cal-day-vol">${volumeLabel}</span>`;
      }
      html += '</div>';
    });
    
    html += '</div>'; // cal-grid
    
    // Footer stats
    html += '<div class="cal-footer">';
    html += `<span class="cal-stat">${data.sessionCount} séance${data.sessionCount > 1 ? 's' : ''}</span>`;
    html += '<span class="cal-stat-sep">·</span>';
    const volDisplay = data.totalVolume >= 1000 
      ? `${(data.totalVolume / 1000).toFixed(1)} tonnes soulevées`
      : `${data.totalVolume.toLocaleString('fr-FR')} kg soulevés`;
    html += `<span class="cal-stat">${data.totalVolume > 0 ? volDisplay : 'Aucun volume'}</span>`;
    html += '</div>';
    
    // Legend
    html += '<div class="cal-legend">';
    html += '<span class="cal-legend-label">Volume faible</span>';
    html += '<div class="cal-legend-cell none"></div>';
    html += '<div class="cal-legend-cell low"></div>';
    html += '<div class="cal-legend-cell medium"></div>';
    html += '<div class="cal-legend-cell high"></div>';
    html += '<span class="cal-legend-label">Volume élevé</span>';
    html += '</div>';
    
    html += '</div>'; // cal-widget
    
    container.innerHTML = html;
  },

  // --- Programmes ---
  updatePrograms() {
    const programs = AppData.getPrograms();
    const container = document.getElementById('programs-list');
    if (!programs.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">&#128170;</div>' +
          '<p>Crée ton premier programme</p>' +
          '<p class="text-muted">Commence par définir tes exercices favoris</p>' +
        '</div>';
      return;
    }
    container.innerHTML = programs.map(p => {
      const exCount = (p.exercices || []).length;
      const sessCount = AppData.getSessions().filter(s => s.programId === p.id).length;
      const badge = (p.exercices || []).map(e => {
        const n = e.nom || '';
        return n.length > 18 ? n.substring(0, 16) + '…' : n;
      }).filter(Boolean).slice(0, 2).join(', ') || 'Vide';
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
    var dupBtn = document.getElementById('btn-duplicate-program');
    if (dupBtn) dupBtn.style.display = 'none';
    var delSessBtn = document.getElementById('btn-delete-program-sessions');
    if (delSessBtn) delSessBtn.style.display = 'none';
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
    var dupBtn = document.getElementById('btn-duplicate-program');
    if (dupBtn) dupBtn.style.display = 'block';
    var delSessBtn = document.getElementById('btn-delete-program-sessions');
    if (delSessBtn) delSessBtn.style.display = 'block';
    this.exerciseCounter = 0;
    if (program.exercices && program.exercices.length > 0) {
      program.exercices.forEach(ex => this.addExerciseToForm(ex));
    } else {
      this.addExerciseToForm();
    }
    this.openOverlay('overlay-create-program');
  },

  duplicateCurrentProgram() {
    if (!this.currentEditProgramId) return;
    const copy = AppData.duplicateProgram(this.currentEditProgramId);
    if (copy) {
      this.closeOverlay('overlay-create-program');
      this.updatePrograms();
      this.showToast('Programme dupliqué');
    }
  },

  deleteCurrentProgramWithSessions() {
    if (!this.currentEditProgramId) return;
    const sessCount = AppData.getSessions().filter(s => s.programId === this.currentEditProgramId).length;
    if (confirm('Supprimer ce programme ET ses ' + sessCount + ' séance(s) ?')) {
      AppData.deleteProgramWithSessions(this.currentEditProgramId);
      this.closeOverlay('overlay-create-program');
      this.updatePrograms();
      this.updateHistorique();
      this.updateDashboard();
      this.showToast('Programme et séances supprimés');
    }
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

    const restTime = (data && data.restTime) ? data.restTime : 90;

    div.innerHTML =
      '<div class="exercise-block-header">' +
        '<input type="text" class="form-input" id="exo-name-' + idx + '" placeholder="Nom de l\'exercice" value="' + (data ? this.escAttr(data.nom || '') : '') + '">' +
        '<button class="exercise-remove" onclick="document.getElementById(\'exercise-block-' + idx + '\').remove()">' + _ic('x') + '</button>' +
      '</div>' +
      '<div class="exercise-rest-config">' +
        '<label class="rest-config-label">' + _ic('clock', 'icon--sm') + ' Repos</label>' +
        '<select class="rest-config-select" data-rest-time>' +
          '<option value="30"' + (restTime == 30 ? ' selected' : '') + '>30s</option>' +
          '<option value="60"' + (restTime == 60 ? ' selected' : '') + '>1 min</option>' +
          '<option value="90"' + (restTime == 90 ? ' selected' : '') + '>1m30</option>' +
          '<option value="120"' + (restTime == 120 ? ' selected' : '') + '>2 min</option>' +
          '<option value="180"' + (restTime == 180 ? ' selected' : '') + '>3 min</option>' +
        '</select>' +
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
        '<button class="series-delete" onclick="this.parentElement.remove()">' + _ic('x') + '</button>' +
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
    if (!nom) { this.showToast('Donne un nom au programme'); return; }

    const blocks = document.querySelectorAll('.exercise-block');
    const exercices = [];
    blocks.forEach(block => {
      const nameInput = block.querySelector('input[type="text"]');
      const restSelect = block.querySelector('[data-rest-time]');
      const restTime = restSelect ? Number(restSelect.value) : 90;
      const seriesRows = block.querySelectorAll('.series-row');
      const series = [];
      seriesRows.forEach(row => {
        const poids = row.querySelector('[data-type="poids"]').value;
        const reps = row.querySelector('[data-type="reps"]').value;
        series.push({ poids: poids ? Number(poids) : '', reps: reps ? Number(reps) : '' });
      });
      if (nameInput.value.trim()) {
        exercices.push({ nom: nameInput.value.trim(), series, restTime });
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
  handleFabClick() {
    // If session is active, resume it
    if (this.currentSessionProgramId && AppData.loadActiveSession()) {
      this.openOverlay('overlay-active-session');
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      this.openStartSession();
    }
  },

  openStartSession() {
    if (navigator.vibrate) navigator.vibrate(10);
    const programs = AppData.getPrograms();
    const container = document.getElementById('program-select-list');
    if (!programs.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<p>Crée ton premier programme</p>' +
          '<p class="text-muted">Va dans Séances → Programmes pour commencer</p>' +
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

      const restTime = exo.restTime || 90;

      let html = '<div class="active-exercise" data-exo-name="' + this.escAttr(exo.nom) + '" data-rest-time="' + restTime + '">' +
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
            '<button class="rest-trigger" onclick="AppUI.startRestTimer(' + restTime + ', this)" title="Repos ' + restTime + 's">' + _ic('clock') + '</button>' +
            '<button class="series-delete" onclick="AppUI.deleteSeriesRow(this)">' + _ic('x') + '</button>' +
          '</div>' +
          '<input type="text" class="note-input" placeholder="Note (optionnel)" maxlength="100">';
      }

      html += '<button class="add-link" onclick="AppUI.addActiveSeriesRow(this)">+ Série</button></div>';
      container.insertAdjacentHTML('beforeend', html);
    });

    this.openOverlay('overlay-active-session');
    this.startSessionTimer();
    this.startAutoSave();
    this.updateFabBadge();
  },

  addActiveSeriesRow(btn) {
    const exercise = btn.closest('.active-exercise');
    const restTime = exercise.dataset.restTime || 90;
    const rows = exercise.querySelectorAll('.series-row');
    const num = rows.length + 1;
    const html =
      '<div class="series-row">' +
        '<span class="series-num">' + num + '</span>' +
        '<input type="number" placeholder="kg" data-type="poids">' +
        '<input type="number" placeholder="reps" data-type="reps">' +
        '<button class="rest-trigger" onclick="AppUI.startRestTimer(' + restTime + ', this)" title="Repos ' + restTime + 's">' + _ic('clock') + '</button>' +
        '<button class="series-delete" onclick="AppUI.deleteSeriesRow(this)">' + _ic('x') + '</button>' +
      '</div>' +
      '<input type="text" class="note-input" placeholder="Note (optionnel)" maxlength="100">';
    btn.insertAdjacentHTML('beforebegin', html);
  },

  saveSession() {
    const container = document.getElementById('active-session-exercises');
    const exerciseBlocks = container.querySelectorAll('.active-exercise');
    const exercices = [];

    exerciseBlocks.forEach(block => {
      const nom = block.dataset.exoName;
      const series = [];
      const rows = block.querySelectorAll('.series-row');
      rows.forEach(row => {
        const poidsInput = row.querySelector('[data-type="poids"]');
        const repsInput = row.querySelector('[data-type="reps"]');
        const poids = poidsInput.value;
        const reps = repsInput.value;
        // Note input is the next sibling of the series-row
        const noteEl = row.nextElementSibling;
        const note = (noteEl && noteEl.classList.contains('note-input')) ? noteEl.value.trim() : '';
        if (poids && reps) {
          const entry = { poids: Number(poids), reps: Number(reps) };
          if (note) entry.note = note;
          series.push(entry);
        }
      });
      if (series.length > 0) exercices.push({ nom, series });
    });

    if (!exercices.length) { this.showToast('Aucune donnée à sauvegarder'); return; }

    const program = AppData.getProgramById(this.currentSessionProgramId);
    AppData.addSession({
      programId: this.currentSessionProgramId,
      programName: program ? program.nom : 'Inconnu',
      exercices
    });

    this.stopSessionTimer();
    this.stopAutoSave();
    this.stopRestTimer();
    AppData.clearActiveSession();
    this.closeOverlay('overlay-active-session');
    this.updateDashboard();
    this.updateHistorique();
    if (document.getElementById('stats').classList.contains('active')) {
      this.updateStats();
    }
    this.updateProfile();
    this.showToast('Séance sauvegardée !');
    this.updateFabBadge();
  },

  minimizeSession() {
    this.captureActiveSessionState(); // Save before minimize
    this.closeOverlay('overlay-active-session');
    this.updateFabBadge();
    this.showToast('Séance en cours minimisée');
  },

  updateFabBadge() {
    const badge = document.getElementById('fab-badge');
    const fabIcon = document.querySelector('.fab-icon');
    if (!badge || !fabIcon) return;

    const activeSession = AppData.loadActiveSession();
    if (activeSession && this.currentSessionProgramId) {
      const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      badge.textContent = minutes + 'min';
      badge.style.display = 'block';
      fabIcon.textContent = '▶'; // Play icon
    } else {
      badge.style.display = 'none';
      fabIcon.textContent = '+';
    }
  },

  confirmCloseSession() {
    if (confirm('Abandonner la séance en cours ?')) {
      this.stopSessionTimer();
      this.stopAutoSave();
      this.stopRestTimer();
      AppData.clearActiveSession();
      this.closeOverlay('overlay-active-session');
      this.updateFabBadge();
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
          '<p>Commence ta première séance !</p>' +
          '<p class="text-muted">Appuie sur + pour démarrer ton entraînement</p>' +
        '</div>';
      return;
    }

    // Group by month
    const groups = {};
    sessions.forEach(s => {
      const d = new Date(s.date);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const months = Object.keys(groups).sort().reverse();
    const idx = Math.max(0, Math.min(this.historiqueOffset, months.length - 1));
    this.historiqueOffset = idx;
    const currentMonth = months[idx];
    const currentSessions = groups[currentMonth];

    const d = new Date(currentMonth + '-01');
    const monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    let html = '<div class="historique-nav">';
    html += '<button class="cal-nav' + (idx >= months.length - 1 ? ' disabled' : '') + '" onclick="AppUI.navigateHistorique(1)"' + (idx >= months.length - 1 ? ' disabled' : '') + '>‹</button>';
    html += '<span class="historique-month-header">' + monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) + '</span>';
    html += '<button class="cal-nav' + (idx <= 0 ? ' disabled' : '') + '" onclick="AppUI.navigateHistorique(-1)"' + (idx <= 0 ? ' disabled' : '') + '>›</button>';
    html += '</div>';

    currentSessions.forEach(s => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const exCount = (s.exercices || []).length;
      let totalSeries = 0;
      (s.exercices || []).forEach(ex => { totalSeries += (ex.series || []).length; });
      html +=
        '<div class="session-item" onclick="AppUI.viewSession(\'' + this.escAttr(s.id) + '\')">' +
          '<div class="session-item-header">' +
            '<div class="session-item-date">' + dateStr + '</div>' +
            '<div class="session-item-program">' + this.esc(s.programName || '') + '</div>' +
          '</div>' +
          '<div class="session-item-stats">' +
            '<span class="session-item-stat">' + exCount + ' exercice(s)</span>' +
            '<span class="session-item-stat">' + totalSeries + ' série(s)</span>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
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
        if (s.note) {
          html += '<div class="detail-note">' + _ic('file-text', 'icon--sm') + ' ' + this.esc(s.note) + '</div>';
        }
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
    // Strategic Metrics
    document.getElementById('stat-total-volume').textContent = AppStats.getTotalVolume().toLocaleString('fr-FR') + ' kg';
    
    const avgIntensity = AppStats.getAverageIntensity();
    document.getElementById('stat-avg-intensity').textContent = avgIntensity > 0 ? avgIntensity + ' kg/rep' : '-';
    
    document.getElementById('stat-muscle-balance').textContent = AppStats.getMuscleBalance();
    
    const progressionRate = AppStats.getProgressionRate();
    document.getElementById('stat-progression-rate').textContent = progressionRate === 0 ? '-' : 
      (progressionRate > 0 ? '+' : '') + progressionRate + '%/mois';

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

    // Évolution par exercice
    const evolutionExercises = AppStats.getExercisesForEvolution();
    let evolutionHTML = '';
    if (evolutionExercises.length === 0) {
      evolutionHTML = '<div class="empty-state"><p>Pas assez de données</p><p class="text-muted">Il faut au moins 2 séances par exercice</p></div>';
    } else {
      evolutionExercises.forEach(ex => {
        const trendIcon = ex.trend === 'up' ? _ic('chevron-up') : ex.trend === 'down' ? _ic('chevron-down') : _ic('minus');
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
            '<div class="evolution-item-hint">Tap pour voir le graphique</div>' +
          '</div>';
      });
    }
    document.getElementById('exercise-evolution').innerHTML = evolutionHTML;

    // Recent Achievements (show only if there are any)
    const recentAchievements = AppStats.getRecentAchievements();
    const recentSection = document.getElementById('recent-achievements-section');
    const recentContainer = document.getElementById('recent-achievements');
    
    if (recentAchievements.length > 0) {
      recentSection.style.display = 'block';
      let recentHTML = '';
      recentAchievements.forEach(achievement => {
        recentHTML +=
          '<div class="badge earned recent">' +
            '<div class="badge-icon">' + achievement.icon + '</div>' +
            '<div class="badge-title">' + achievement.title + '</div>' +
            '<div class="badge-desc">' + achievement.desc + '</div>' +
          '</div>';
      });
      recentContainer.innerHTML = recentHTML;
    } else {
      recentSection.style.display = 'none';
    }
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

    // Open overlay first, then render chart to ensure proper dimensions
    this.openOverlay('overlay-exercise-chart');
    
    // Small delay to let the overlay fully display before measuring canvas dimensions
    setTimeout(() => {
      this.updateExerciseChart();
    }, 50);
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

    // Responsive canvas with safety checks
    const containerEl = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure container has proper dimensions
    let displayWidth = containerEl.clientWidth - 40;
    const displayHeight = 300;
    
    // Fallback if container is not properly sized yet
    if (displayWidth <= 0) {
      displayWidth = 400; // Default fallback width
    }

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

    // Touch & mouse tooltip — only bind once, update refs on re-render
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip && !canvas._chartBound) {
      canvas._chartBound = true;
      canvas._cData = { getX: getX, getY: getY, sessions: sessions, dw: displayWidth, dh: displayHeight };

      canvas.addEventListener('touchstart', function(e) {
        var h = AppUI._findChartHit(canvas, e.touches[0].clientX);
        AppUI._showChartTip(canvas, tooltip, h);
      }, { passive: true });
      canvas.addEventListener('touchmove', function(e) {
        var h = AppUI._findChartHit(canvas, e.touches[0].clientX);
        AppUI._showChartTip(canvas, tooltip, h);
      }, { passive: true });
      canvas.addEventListener('touchend', function() { tooltip.classList.remove('show'); });
      canvas.addEventListener('mousemove', function(e) {
        var h = AppUI._findChartHit(canvas, e.clientX);
        AppUI._showChartTip(canvas, tooltip, h);
      });
      canvas.addEventListener('mouseleave', function() { tooltip.classList.remove('show'); });
    } else if (canvas._chartBound) {
      canvas._cData = { getX: getX, getY: getY, sessions: sessions, dw: displayWidth, dh: displayHeight };
    }
  },

  _findChartHit(canvas, clientX) {
    var d = canvas._cData;
    if (!d) return null;
    var rect = canvas.getBoundingClientRect();
    var mx = (clientX - rect.left) * (d.dw / rect.width);
    var nearest = null, minDist = Infinity;
    d.sessions.forEach(function(s, i) {
      var dx = Math.abs(d.getX(i) - mx);
      if (dx < minDist) { minDist = dx; nearest = { s: s, x: d.getX(i), y: d.getY(s.weight) }; }
    });
    return nearest;
  },

  _showChartTip(canvas, tooltip, hit) {
    if (!hit || !hit.s) { tooltip.classList.remove('show'); return; }
    var d = canvas._cData;
    var date = new Date(hit.s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    tooltip.textContent = hit.s.weight + ' kg \u2014 ' + date + (hit.s.reps ? ' (' + hit.s.reps + ' reps)' : '');
    var rect = canvas.getBoundingClientRect();
    tooltip.style.left = (rect.left + hit.x * (rect.width / d.dw)) + 'px';
    tooltip.style.top = (rect.top + hit.y * (rect.height / d.dh) - 40) + 'px';
    tooltip.classList.add('show');
  },

  // --- Overlays ---
  openOverlay(id) {
    document.getElementById(id).classList.add('active');
  },
  closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
    // Hide chart tooltip if closing the chart overlay
    if (id === 'overlay-exercise-chart') {
      var tip = document.getElementById('chart-tooltip');
      if (tip) tip.classList.remove('show');
    }
  },

  // --- Profile ---
  updateProfile() {
    const summary = AppStats.getProfileSummary();
    const achievements = AppStats.getAchievements();
    const earned = achievements.filter(a => a.earned);
    const evolution = AppStats.getProfileEvolution();

    // Load saved user data
    const data = AppData.load();
    const user = data.user || {};
    if (user.emoji) document.getElementById('profile-avatar').textContent = user.emoji;
    if (user.name) document.getElementById('profile-name').textContent = user.name;

    // Rank indicator based on earned achievements
    const rankEl = document.getElementById('profile-rank');
    if (rankEl) {
      const count = earned.length;
      let rank;
      if (count >= 15) rank = '🏆 Légende';
      else if (count >= 10) rank = '💎 Élite';
      else if (count >= 7) rank = '🔥 Expert';
      else if (count >= 4) rank = '⚡ Confirmé';
      else if (count >= 1) rank = '🌱 Débutant';
      else rank = '🆕 Rookie';
      rankEl.textContent = rank;
    }

    // Tagline: use saved bio if available, otherwise auto-generate
    const tagline = document.getElementById('profile-tagline');
    if (user.bio) {
      tagline.textContent = user.bio;
    } else if (summary.totalSessions === 0) tagline.textContent = 'Prêt à en découdre';
    else if (summary.totalSessions < 10) tagline.textContent = 'Le début d\'une belle aventure';
    else if (summary.totalSessions < 50) tagline.textContent = 'En route vers la progression';
    else if (summary.totalSessions < 100) tagline.textContent = 'Athlète confirmé';
    else tagline.textContent = 'Légende vivante';

    // Summary stats
    document.getElementById('prof-sessions').textContent = summary.totalSessions;
    const volDisplay = summary.totalVolume >= 1000
      ? (summary.totalVolume / 1000).toFixed(1) + 't'
      : summary.totalVolume + 'kg';
    document.getElementById('prof-volume').textContent = volDisplay;
    document.getElementById('prof-streak').textContent = summary.weeklyStreak;
    document.getElementById('prof-prs').textContent = summary.totalPRs;

    // Achievements count
    document.getElementById('achievements-count').textContent = earned.length + '/' + achievements.length;

    // Achievements preview (last 4 earned, or first 4 locked)
    const previewContainer = document.getElementById('profile-achievements-preview');
    let previewHTML = '';

    if (earned.length > 0) {
      // Show most recent earned (reversed to show latest first)
      const recent = [...earned].reverse().slice(0, 4);
      recent.forEach(a => {
        previewHTML +=
          '<div class="achievement-mini earned">' +
            '<div class="achievement-mini-icon">' + a.icon + '</div>' +
            '<div class="achievement-mini-title">' + a.title + '</div>' +
          '</div>';
      });
    } else {
      // Show first 4 locked
      achievements.slice(0, 4).forEach(a => {
        previewHTML +=
          '<div class="achievement-mini locked">' +
            '<div class="achievement-mini-icon">' + _ic('lock') + '</div>' +
            '<div class="achievement-mini-title">' + a.title + '</div>' +
          '</div>';
      });
    }
    previewContainer.innerHTML = previewHTML;

    // Evolution stats
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const evoContainer = document.getElementById('profile-evolution');

    const bestMonthName = evolution.bestMonth.volume > 0
      ? monthNames[evolution.bestMonth.month] + ' (' + (evolution.bestMonth.volume / 1000).toFixed(1) + 't)'
      : '-';
    const avgDisplay = evolution.avgMonthlyVolume >= 1000
      ? (evolution.avgMonthlyVolume / 1000).toFixed(1) + 't'
      : evolution.avgMonthlyVolume + ' kg';

    let evoHTML = '<div class="profile-evo-stats">';
    evoHTML += '<div class="profile-evo-stat"><span class="profile-evo-label">Meilleur mois</span><span class="profile-evo-value">' + bestMonthName + '</span></div>';
    evoHTML += '<div class="profile-evo-stat"><span class="profile-evo-label">Moyenne mensuelle</span><span class="profile-evo-value">' + avgDisplay + '</span></div>';
    evoHTML += '<div class="profile-evo-stat"><span class="profile-evo-label">Membre depuis</span><span class="profile-evo-value">' + (summary.activeDays > 0 ? summary.activeDays + ' jours' : '-') + '</span></div>';
    evoHTML += '</div>';

    evoContainer.innerHTML = evoHTML;
  },

  openAllAchievements() {
    const achievements = AppStats.getAchievements();
    const earned = achievements.filter(a => a.earned);

    // Progress bar
    const percent = Math.round((earned.length / achievements.length) * 100);
    document.getElementById('achievements-progress-fill').style.width = percent + '%';
    document.getElementById('achievements-progress-text').textContent =
      earned.length + '/' + achievements.length + ' débloqués (' + percent + '%)';

    // List
    let html = '';
    achievements.forEach(a => {
      const isEarned = a.earned;
      html +=
        '<div class="achievement-full ' + (isEarned ? 'earned' : 'locked') + '">' +
          '<div class="achievement-full-icon">' + (isEarned ? a.icon : _ic('lock')) + '</div>' +
          '<div class="achievement-full-info">' +
            '<div class="achievement-full-title">' + a.title + '</div>' +
            '<div class="achievement-full-desc">' + a.desc + '</div>' +
            (isEarned
              ? '<div class="achievement-full-status earned">' + _ic('check', 'icon--sm') + ' Débloqué</div>'
              : '<div class="achievement-full-status locked">Objectif : ' + a.req + '</div>'
            ) +
          '</div>' +
        '</div>';
    });

    document.getElementById('all-achievements-list').innerHTML = html;
    this.openOverlay('overlay-all-achievements');
  },

  openEditProfile() {
    const data = AppData.load();
    const user = data.user || {};
    document.getElementById('edit-profile-name').value = user.name || '';
    document.getElementById('edit-profile-bio').value = user.bio || '';
    const currentEmoji = user.emoji || '🏋️';
    document.getElementById('edit-profile-emoji-preview').textContent = currentEmoji;

    // Populate emoji grid
    const emojis = ['🏋️','💪','🔥','⚡','🏆','🎯','🦾','🐺','🦁','🐻','🦅','🚀','💎','👊','🥊','🏅','⭐','🌟','🎖️','🧠','🫀','🦿','🏃','🤸','🧘','🥇','✨','💯'];
    const grid = document.getElementById('edit-profile-emoji-grid');
    grid.innerHTML = emojis.map(e =>
      '<button class="emoji-pick-btn' + (e === currentEmoji ? ' selected' : '') + '" type="button" onclick="AppUI.pickProfileEmoji(this, \'' + e + '\')">' + e + '</button>'
    ).join('');

    this.openOverlay('overlay-edit-profile');
  },

  pickProfileEmoji(btn, emoji) {
    document.getElementById('edit-profile-emoji-preview').textContent = emoji;
    document.querySelectorAll('.emoji-pick-btn.selected').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  },

  saveProfile() {
    const data = AppData.load();
    if (!data.user) data.user = {};
    data.user.name = document.getElementById('edit-profile-name').value.trim().substring(0, 30);
    data.user.bio = document.getElementById('edit-profile-bio').value.trim().substring(0, 60);
    data.user.emoji = document.getElementById('edit-profile-emoji-preview').textContent.trim() || '🏋️';
    AppData.save(data);

    // Update header immediately
    document.getElementById('profile-avatar').textContent = data.user.emoji;
    document.getElementById('profile-name').textContent = data.user.name || 'Mon Profil';
    if (data.user.bio) {
      document.getElementById('profile-tagline').textContent = data.user.bio;
    }
    this.updateGreeting();
    this.closeOverlay('overlay-edit-profile');
    this.showToast('Profil mis à jour');
  },

  // --- Active Session Recovery (PWA persistence) ---
  checkActiveSession() {
    const activeSession = AppData.loadActiveSession();
    if (!activeSession) return;

    const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);

    // Build recovery overlay content
    const overlay = document.getElementById('overlay-recovery');
    document.getElementById('recovery-program-name').textContent = activeSession.programName;
    document.getElementById('recovery-duration').textContent = minutes + ' min';
    const exCount = (activeSession.exercises || []).length;
    const seriesCount = (activeSession.exercises || []).reduce(function(t, e) { return t + (e.series || []).length; }, 0);
    document.getElementById('recovery-details').textContent = exCount + ' exercice(s), ' + seriesCount + ' série(s)';

    this.openOverlay('overlay-recovery');
  },

  resumeFromRecovery() {
    const activeSession = AppData.loadActiveSession();
    if (!activeSession) return;
    this.closeOverlay('overlay-recovery');
    this.resumeActiveSession(activeSession);
  },

  discardRecovery() {
    AppData.clearActiveSession();
    this.closeOverlay('overlay-recovery');
    this.showToast('Séance abandonnée');
  },

  resumeActiveSession(activeSession) {
    this.currentSessionProgramId = activeSession.programId;
    const program = AppData.getProgramById(activeSession.programId);
    if (!program) {
      this.showToast('Programme introuvable');
      AppData.clearActiveSession();
      return;
    }

    document.getElementById('active-session-title').textContent = activeSession.programName;
    const container = document.getElementById('active-session-exercises');
    container.innerHTML = '';

    // Rebuild UI from saved data
    activeSession.exercises.forEach(function(savedExo) {
      // Look up restTime from program template
      var programExo = (program.exercices || []).find(function(e) { return e.nom === savedExo.nom; });
      var restTime = (programExo && programExo.restTime) ? programExo.restTime : 90;

      let html = '<div class="active-exercise" data-exo-name="' + AppUI.escAttr(savedExo.nom) + '" data-rest-time="' + restTime + '">' +
        '<div class="active-exercise-name">' + AppUI.esc(savedExo.nom) + '</div>' +
        '<div class="series-header"><span></span><span>Poids (kg)</span><span>Reps</span><span></span></div>';

      savedExo.series.forEach(function(serie, i) {
        html +=
          '<div class="series-row">' +
            '<span class="series-num">' + (i + 1) + '</span>' +
            '<input type="number" placeholder="kg" value="' + (serie.poids || '') + '" data-type="poids">' +
            '<input type="number" placeholder="reps" value="' + (serie.reps || '') + '" data-type="reps">' +
            '<button class="rest-trigger" onclick="AppUI.startRestTimer(' + restTime + ', this)" title="Repos ' + restTime + 's">' + _ic('clock') + '</button>' +
            '<button class="series-delete" onclick="AppUI.deleteSeriesRow(this)">' + _ic('x') + '</button>' +
          '</div>' +
          '<input type="text" class="note-input" placeholder="Note (optionnel)" value="' + AppUI.escAttr(serie.note || '') + '" maxlength="100">';
      });

      html += '<button class="add-link" onclick="AppUI.addActiveSeriesRow(this)">+ Série</button></div>';
      container.insertAdjacentHTML('beforeend', html);
    });

    // Restore timer — continue from where it left off
    this.openOverlay('overlay-active-session');
    this.startSessionTimer(activeSession.startTime);
    this.startAutoSave();
    this.showToast('Séance reprise !');
    this.updateFabBadge();
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
      this.showToast('Erreur lors de l\'export');
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

    this.showToast(
      createdPrograms.length + ' programmes, ' + data.sessions.length + ' séances générées'
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
          if (!imported || typeof imported !== 'object' || (!Array.isArray(imported.programs) && !Array.isArray(imported.sessions))) {
            throw new Error('Invalid format');
          }
          // Ensure required arrays exist
          if (!Array.isArray(imported.programs)) imported.programs = [];
          if (!Array.isArray(imported.sessions)) imported.sessions = [];
          AppData.save(imported);
          AppData.invalidateCache();
          this.updateDashboard();
          this.updatePrograms();
          this.updateHistorique();
          this.updateStats();
          this.updateProfile();
          this.showToast('Données importées avec succès');
        } catch (err) {
          this.showToast('Fichier invalide');
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
        this.updateProfile();
        this.updateGreeting();
        this.showToast('Données supprimées');
      }
    }
  }
};

// ================================================================
// APP INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Version display
  const versionEl = document.getElementById('app-version');
  if (versionEl) versionEl.textContent = 'RepLift v' + APP_VERSION;

  // Greeting
  AppUI.updateGreeting();

  // Only render the active page at startup (lazy-load the rest)
  AppUI.updateDashboard();

  // Setup swipe-to-close on overlays
  AppUI.setupSwipeToClose();

  // Check for active session (PWA persistence)
  AppUI.checkActiveSession();
});
