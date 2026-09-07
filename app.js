/**
 * TrackPlan - Main Application Logic
 * Modern Goal & Plan Tracker with Glassmorphism, Micro-interactions, and LocalStorage
 */

(function () {
  'use strict';

  // ==========================================================================
  // Application State
  // ==========================================================================
  let goals = [];
  let plans = [];
  let streak = { count: 7, lastCompletedDate: '' };
  let currentQuoteIndex = 0;
  let activeCategoryFilter = 'all';
  let goalSearchQuery = '';
  let activePlanFilter = 'today';
  let isFullscreen = false;

  // ==========================================================================
  // DOM Element Selectors
  // ==========================================================================
  const DOM = {
    // Controls & Frame
    modeToggleBtn: document.getElementById('modeToggleBtn'),
    modeToggleText: document.getElementById('modeToggleText'),
    deviceContainer: document.getElementById('deviceContainer'),
    statusClock: document.getElementById('statusClock'),
    greetingTitle: document.getElementById('greetingTitle'),
    currentDateHeader: document.getElementById('currentDateHeader'),
    streakBadge: document.getElementById('streakBadge'),
    streakCount: document.getElementById('streakCount'),
    userAvatar: document.getElementById('userAvatar'),

    // User Profile Modal
    profileModal: document.getElementById('profileModal'),
    modalUserAvatar: document.getElementById('modalUserAvatar'),
    modalUserName: document.getElementById('modalUserName'),
    modalUserHandle: document.getElementById('modalUserHandle'),
    modalUserEmail: document.getElementById('modalUserEmail'),
    profileStatsGoals: document.getElementById('profileStatsGoals'),
    profileStatsStreak: document.getElementById('profileStatsStreak'),
    btnLogout: document.getElementById('btnLogout'),

    // Viewport & Tabs
    tabPanes: document.querySelectorAll('.tab-pane'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    fabBtn: document.getElementById('fabBtn'),

    // Tab 1: Dashboard
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    btnRefreshQuote: document.getElementById('btnRefreshQuote'),
    donutProgressCircle: document.getElementById('donutProgressCircle'),
    donutPercentVal: document.getElementById('donutPercentVal'),
    dashActiveGoalsCount: document.getElementById('dashActiveGoalsCount'),
    dashCompletedGoalsCount: document.getElementById('dashCompletedGoalsCount'),
    dashTodayPlansCount: document.getElementById('dashTodayPlansCount'),
    dashTodayBadge: document.getElementById('dashTodayBadge'),
    dashTodayPlansContainer: document.getElementById('dashTodayPlansContainer'),
    dashGoalsBadge: document.getElementById('dashGoalsBadge'),
    dashGoalsContainer: document.getElementById('dashGoalsContainer'),
    linkToPlansTab: document.getElementById('linkToPlansTab'),
    linkToGoalsTab: document.getElementById('linkToGoalsTab'),

    // Tab 2: Goals
    goalSearchInput: document.getElementById('goalSearchInput'),
    goalCategoryFilters: document.getElementById('goalCategoryFilters'),
    goalsListCounter: document.getElementById('goalsListCounter'),
    goalsListContainer: document.getElementById('goalsListContainer'),
    btnAddNewGoal: document.getElementById('btnAddNewGoal'),

    // Tab 3: Plans
    planFilterTabs: document.getElementById('planFilterTabs'),
    plansListCounter: document.getElementById('plansListCounter'),
    plansListContainer: document.getElementById('plansListContainer'),
    btnAddNewPlan: document.getElementById('btnAddNewPlan'),

    // Tab 4: Analytics
    statTotalGoals: document.getElementById('statTotalGoals'),
    statFinishedGoals: document.getElementById('statFinishedGoals'),
    statCompletedMilestones: document.getElementById('statCompletedMilestones'),
    statStreakDays: document.getElementById('statStreakDays'),
    categoryBreakdownContainer: document.getElementById('categoryBreakdownContainer'),
    btnResetAllData: document.getElementById('btnResetAllData'),

    // Modals
    fabMenuModal: document.getElementById('fabMenuModal'),
    fabOptionGoal: document.getElementById('fabOptionGoal'),
    fabOptionPlan: document.getElementById('fabOptionPlan'),
    goalModal: document.getElementById('goalModal'),
    goalModalTitle: document.getElementById('goalModalTitle'),
    goalForm: document.getElementById('goalForm'),
    goalFormId: document.getElementById('goalFormId'),
    goalFormTitle: document.getElementById('goalFormTitle'),
    goalFormDesc: document.getElementById('goalFormDesc'),
    goalFormCategory: document.getElementById('goalFormCategory'),
    goalFormPriority: document.getElementById('goalFormPriority'),
    goalFormStartDate: document.getElementById('goalFormStartDate'),
    goalFormTargetDate: document.getElementById('goalFormTargetDate'),
    goalFormMilestonesList: document.getElementById('goalFormMilestonesList'),
    btnAddMilestoneRow: document.getElementById('btnAddMilestoneRow'),

    planModal: document.getElementById('planModal'),
    planModalTitle: document.getElementById('planModalTitle'),
    planForm: document.getElementById('planForm'),
    planFormId: document.getElementById('planFormId'),
    planFormTitle: document.getElementById('planFormTitle'),
    planFormGoalId: document.getElementById('planFormGoalId'),
    planFormDueDate: document.getElementById('planFormDueDate'),
    planFormDueTime: document.getElementById('planFormDueTime'),
    planFormPriority: document.getElementById('planFormPriority'),
    planFormCategory: document.getElementById('planFormCategory'),

    // Confetti & Toast
    confettiCanvas: document.getElementById('confettiCanvas'),
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================================================
  // Helper Utility Functions
  // ==========================================================================
  const IndonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const IndonesianDays = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${IndonesianMonths[monthIndex]} ${year}`;
  }

  function getCategoryName(category) {
    const names = {
      pendidikan: 'Pendidikan',
      finansial: 'Finansial',
      kesehatan: 'Kesehatan',
      pribadi: 'Pribadi',
      karir: 'Karir'
    };
    return names[category] || category;
  }

  function getCategoryIcon(category) {
    const icons = {
      pendidikan: '🎓',
      finansial: '💰',
      kesehatan: '🏃',
      pribadi: '🌱',
      karir: '💼'
    };
    return icons[category] || '🎯';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // Real-time Clock & Header Greeting
  // ==========================================================================
  function updateTimeAndGreetings() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Status Bar Clock
    if (DOM.statusClock) {
      DOM.statusClock.textContent = `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    // Header Greeting with Active User Name
    const currentUser = typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null;
    const displayName = currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'Pejuang';
    const initial = (currentUser && currentUser.name ? currentUser.name.charAt(0) : 'P').toUpperCase();

    if (DOM.userAvatar) {
      DOM.userAvatar.textContent = initial;
      DOM.userAvatar.title = currentUser ? `Profil: ${currentUser.name} (@${currentUser.username})` : 'Profil Pengguna';
    }

    let greeting = `Halo, ${displayName}! 👋`;
    if (hours >= 4 && hours < 11) {
      greeting = `Selamat Pagi, ${displayName}! 🌅`;
    } else if (hours >= 11 && hours < 15) {
      greeting = `Selamat Siang, ${displayName}! ☀️`;
    } else if (hours >= 15 && hours < 18) {
      greeting = `Selamat Sore, ${displayName}! 🌇`;
    } else {
      greeting = `Selamat Malam, ${displayName}! 🌙`;
    }
    if (DOM.greetingTitle) {
      DOM.greetingTitle.textContent = greeting;
    }

    // Populate Profile Modal details if open or ready
    if (DOM.modalUserName && currentUser) {
      DOM.modalUserName.textContent = currentUser.name;
      if (DOM.modalUserAvatar) DOM.modalUserAvatar.textContent = initial;
      if (DOM.modalUserHandle) DOM.modalUserHandle.textContent = '@' + currentUser.username;
      if (DOM.modalUserEmail) DOM.modalUserEmail.textContent = currentUser.email;
    }

    // Header Date
    const dayName = IndonesianDays[now.getDay()];
    const dateNum = now.getDate();
    const monthName = IndonesianMonths[now.getMonth()];
    const yearNum = now.getFullYear();
    if (DOM.currentDateHeader) {
      DOM.currentDateHeader.textContent = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
    }
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'success') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '⚠';
    toast.innerHTML = `
      <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.15);font-size:11px;font-weight:bold;">${icon}</span>
      <span>${escapeHtml(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // ==========================================================================
  // Confetti Particle System (Pure Canvas Implementation)
  // ==========================================================================
  class ConfettiEffect {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animating = false;
      this.colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.offsetWidth || 400;
      this.canvas.height = this.canvas.offsetHeight || 700;
    }

    trigger(count = 90) {
      this.resize();
      const originX = this.canvas.width / 2;
      const originY = this.canvas.height * 0.45;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 9 + 4;
        this.particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          size: Math.random() * 8 + 4,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          gravity: 0.22,
          drag: 0.96
        });
      }

      if (!this.animating) {
        this.animating = true;
        this.render();
      }
    }

    render() {
      if (!this.animating) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(() => this.render());
      } else {
        this.animating = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  let confettiEngine = null;

  // ==========================================================================
  // Motivational Quotes Rotator
  // ==========================================================================
  function displayQuote(index = null) {
    if (typeof MOTIVATIONAL_QUOTES === 'undefined' || !MOTIVATIONAL_QUOTES.length) return;
    if (index === null) {
      currentQuoteIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    } else {
      currentQuoteIndex = (index + 1) % MOTIVATIONAL_QUOTES.length;
    }

    const quote = MOTIVATIONAL_QUOTES[currentQuoteIndex];
    if (DOM.quoteText && DOM.quoteAuthor) {
      DOM.quoteText.textContent = `"${quote.text}"`;
      DOM.quoteAuthor.textContent = `- ${quote.author}`;
    }
  }

  // ==========================================================================
  // Tab Navigation Handling
  // ==========================================================================
  function switchTab(targetTabId) {
    // Deactivate all
    DOM.tabPanes.forEach(pane => pane.classList.remove('active'));
    DOM.navTabBtns.forEach(btn => btn.classList.remove('active'));

    // Activate selected
    const targetPane = document.getElementById(targetTabId);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    const matchingBtn = document.querySelector(`.nav-tab-btn[data-tab="${targetTabId}"]`);
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }

    // Scroll viewport to top
    const viewport = document.getElementById('appViewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render specific updates if needed
    if (targetTabId === 'tab-analytics') {
      renderAnalyticsTab();
    } else if (targetTabId === 'tab-goals') {
      renderGoalsList();
    } else if (targetTabId === 'tab-plans') {
      renderPlansList();
    } else if (targetTabId === 'tab-dashboard') {
      renderDashboard();
    }
  }

  // ==========================================================================
  // Modal Handling
  // ==========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  // ==========================================================================
  // Milestone Input Dynamic Rows in Goal Modal
  // ==========================================================================
  function addMilestoneInputRow(title = '') {
    if (!DOM.goalFormMilestonesList) return;

    const row = document.createElement('div');
    row.className = 'milestone-input-row';
    row.innerHTML = `
      <input type="text" class="form-input milestone-title-input" placeholder="Tulis langkah milestone..." value="${escapeHtml(title)}" required>
      <button type="button" class="icon-btn-sm delete-btn btn-remove-milestone" title="Hapus baris">
        ✕
      </button>
    `;

    row.querySelector('.btn-remove-milestone').addEventListener('click', () => {
      row.remove();
    });

    DOM.goalFormMilestonesList.appendChild(row);
  }

  function clearMilestoneInputRows() {
    if (DOM.goalFormMilestonesList) {
      DOM.goalFormMilestonesList.innerHTML = '';
    }
  }

  // ==========================================================================
  // Open Goal Modal (Add or Edit)
  // ==========================================================================
  function openGoalModal(goalId = null) {
    clearMilestoneInputRows();
    DOM.goalForm.reset();

    const todayStr = getTodayDateString();

    if (goalId) {
      // Edit Mode
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      DOM.goalModalTitle.textContent = 'Edit Target';
      DOM.goalFormId.value = goal.id;
      DOM.goalFormTitle.value = goal.title;
      DOM.goalFormDesc.value = goal.description || '';
      DOM.goalFormCategory.value = goal.category;
      DOM.goalFormPriority.value = goal.priority;
      DOM.goalFormStartDate.value = goal.startDate || todayStr;
      DOM.goalFormTargetDate.value = goal.targetDate || '';

      if (goal.milestones && goal.milestones.length > 0) {
        goal.milestones.forEach(m => addMilestoneInputRow(m.title));
      } else {
        addMilestoneInputRow('');
      }
    } else {
      // Add Mode
      DOM.goalModalTitle.textContent = 'Tambah Target Baru';
      DOM.goalFormId.value = '';
      DOM.goalFormStartDate.value = todayStr;
      // Default target date: +30 days
      const d = new Date();
      d.setDate(d.getDate() + 30);
      DOM.goalFormTargetDate.value = d.toISOString().split('T')[0];

      // Add 2 default milestone inputs
      addMilestoneInputRow('');
      addMilestoneInputRow('');
    }

    openModal(DOM.goalModal);
  }

  // ==========================================================================
  // Open Plan Modal (Add or Edit)
  // ==========================================================================
  function openPlanModal(planId = null, prefillGoalId = null) {
    DOM.planForm.reset();

    // Populate Goal dropdown
    DOM.planFormGoalId.innerHTML = '<option value="">-- Tanpa Target Tertentu --</option>';
    goals.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${getCategoryIcon(g.category)} ${g.title}`;
      DOM.planFormGoalId.appendChild(opt);
    });

    const todayStr = getTodayDateString();

    if (planId) {
      // Edit Mode
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      DOM.planModalTitle.textContent = 'Edit Rencana Aksi';
      DOM.planFormId.value = plan.id;
      DOM.planFormTitle.value = plan.title;
      DOM.planFormGoalId.value = plan.goalId || '';
      DOM.planFormDueDate.value = plan.dueDate || todayStr;
      DOM.planFormDueTime.value = plan.dueTime || '09:00';
      DOM.planFormPriority.value = plan.priority || 'sedang';
      DOM.planFormCategory.value = plan.category || 'pendidikan';
    } else {
      // Add Mode
      DOM.planModalTitle.textContent = 'Tambah Rencana Aksi';
      DOM.planFormId.value = '';
      DOM.planFormDueDate.value = todayStr;
      DOM.planFormDueTime.value = '09:00';
      if (prefillGoalId) {
        DOM.planFormGoalId.value = prefillGoalId;
        const linkedGoal = goals.find(g => g.id === prefillGoalId);
        if (linkedGoal) {
          DOM.planFormCategory.value = linkedGoal.category;
        }
      }
    }

    openModal(DOM.planModal);
  }

  // ==========================================================================
  // Goal Progress Recalculation
  // ==========================================================================
  function recalculateGoalProgress(goal) {
    if (!goal.milestones || goal.milestones.length === 0) {
      return goal.progress || 0;
    }
    const completed = goal.milestones.filter(m => m.completed).length;
    const progress = Math.round((completed / goal.milestones.length) * 100);
    goal.progress = progress;
    return progress;
  }

  // ==========================================================================
  // Milestone Checkbox Toggling
  // ==========================================================================
  function toggleMilestone(goalId, milestoneId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const wasCompleted = milestone.completed;
    milestone.completed = !wasCompleted;

    const oldProgress = goal.progress;
    const newProgress = recalculateGoalProgress(goal);

    StorageService.saveGoals(goals);

    // Update streak if completing a step
    if (!wasCompleted) {
      streak = StorageService.updateStreak();
      updateStreakDisplay();
    }

    // Trigger celebration confetti if goal reached 100%
    if (newProgress === 100 && oldProgress < 100) {
      if (confettiEngine) confettiEngine.trigger(100);
      showToast(`🎉 Selamat! Target "${goal.title}" tuntas 100%!`, 'success');
    } else if (!wasCompleted) {
      showToast(`Milestone selesai! Progres target kini ${newProgress}%`, 'info');
    }

    // Refresh views
    renderDashboard();
    renderGoalsList();
    renderAnalyticsTab();
  }

  // ==========================================================================
  // Plan Completion Toggling
  // ==========================================================================
  function togglePlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    plan.completed = !plan.completed;
    StorageService.savePlans(plans);

    if (plan.completed) {
      streak = StorageService.updateStreak();
      updateStreakDisplay();
      if (confettiEngine) confettiEngine.trigger(35);
      showToast(`Rencana "${plan.title}" terselesaikan! 🔥`, 'success');
    }

    renderDashboard();
    renderPlansList();
    renderAnalyticsTab();
  }

  // ==========================================================================
  // Delete Goal / Plan
  // ==========================================================================
  function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    if (confirm(`Apakah Anda yakin ingin menghapus target "${goal.title}"?`)) {
      goals = goals.filter(g => g.id !== goalId);
      StorageService.saveGoals(goals);

      // Also unlink plans connected to this goal
      plans.forEach(p => {
        if (p.goalId === goalId) p.goalId = '';
      });
      StorageService.savePlans(plans);

      showToast('Target berhasil dihapus', 'info');
      renderDashboard();
      renderGoalsList();
      renderAnalyticsTab();
    }
  }

  function deletePlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    plans = plans.filter(p => p.id !== planId);
    StorageService.savePlans(plans);
    showToast('Rencana aksi dihapus', 'info');

    renderDashboard();
    renderPlansList();
    renderAnalyticsTab();
  }

  // ==========================================================================
  // Render: Dashboard (Tab 1)
  // ==========================================================================
  function renderDashboard() {
    const todayStr = getTodayDateString();

    // 1. Calculate Average Progress
    let avgProgress = 0;
    if (goals.length > 0) {
      const sum = goals.reduce((acc, g) => acc + (g.progress || 0), 0);
      avgProgress = Math.round(sum / goals.length);
    }

    if (DOM.donutPercentVal) DOM.donutPercentVal.textContent = avgProgress;

    // SVG Donut circumference: 2 * PI * 42 = ~263.89
    const circumference = 264;
    const offset = circumference - (circumference * avgProgress) / 100;
    if (DOM.donutProgressCircle) {
      DOM.donutProgressCircle.style.strokeDashoffset = offset;
    }

    // 2. Overview Stats Pills
    const activeGoals = goals.filter(g => (g.progress || 0) < 100);
    const completedGoals = goals.filter(g => (g.progress || 0) === 100);
    const todayPlans = plans.filter(p => p.dueDate === todayStr);
    const todayPlansCompleted = todayPlans.filter(p => p.completed);

    if (DOM.dashActiveGoalsCount) DOM.dashActiveGoalsCount.textContent = activeGoals.length;
    if (DOM.dashCompletedGoalsCount) DOM.dashCompletedGoalsCount.textContent = completedGoals.length;
    if (DOM.dashTodayPlansCount) {
      DOM.dashTodayPlansCount.textContent = `${todayPlansCompleted.length}/${todayPlans.length}`;
    }

    // 3. Render Today's Plans in Dashboard
    if (DOM.dashTodayBadge) DOM.dashTodayBadge.textContent = todayPlans.length;
    if (DOM.dashTodayPlansContainer) {
      if (todayPlans.length === 0) {
        DOM.dashTodayPlansContainer.innerHTML = `
          <div class="empty-state-box" style="padding: 20px 10px;">
            <div style="font-size: 28px; margin-bottom: 6px;">✨</div>
            <div class="empty-state-title" style="font-size: 13px;">Belum Ada Rencana Hari Ini</div>
            <div class="empty-state-desc" style="font-size: 11px; margin-bottom: 10px;">Tambahkan rencana agar hari ini lebih terarah dan produktif.</div>
            <button class="btn-primary" id="btnDashAddPlanEmpty" style="padding: 7px 14px; font-size: 11px; width: auto; margin: 0 auto;">
              + Tambah Rencana Hari Ini
            </button>
          </div>
        `;
        const addBtn = document.getElementById('btnDashAddPlanEmpty');
        if (addBtn) addBtn.addEventListener('click', () => openPlanModal());
      } else {
        DOM.dashTodayPlansContainer.innerHTML = todayPlans.map(plan => {
          const linkedGoal = goals.find(g => g.id === plan.goalId);
          return `
            <div class="plan-item-card ${plan.completed ? 'completed' : ''}" data-plan-id="${plan.id}">
              <div class="custom-checkbox ${plan.completed ? 'checked' : ''}" data-toggle-plan="${plan.id}">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="plan-content-wrap">
                <div class="plan-title-text">${escapeHtml(plan.title)}</div>
                <div class="plan-meta-row">
                  ${linkedGoal ? `<span class="plan-linked-goal">🎯 ${escapeHtml(linkedGoal.title)}</span>` : ''}
                  <span class="plan-time-tag">⏰ ${plan.dueTime || '09:00'}</span>
                  <span class="goal-priority-badge priority-${plan.priority}">${plan.priority}</span>
                </div>
              </div>
              <button class="icon-btn-sm delete-btn" data-delete-plan="${plan.id}" title="Hapus">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
              </button>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Render Active Goals in Dashboard (Max 3)
    const topGoals = goals.slice(0, 3);
    if (DOM.dashGoalsBadge) DOM.dashGoalsBadge.textContent = goals.length;
    if (DOM.dashGoalsContainer) {
      if (topGoals.length === 0) {
        DOM.dashGoalsContainer.innerHTML = `
          <div class="empty-state-box" style="padding: 20px 10px;">
            <div style="font-size: 28px; margin-bottom: 6px;">🎯</div>
            <div class="empty-state-title" style="font-size: 13px;">Belum Ada Target</div>
            <div class="empty-state-desc" style="font-size: 11px; margin-bottom: 10px;">Tentukan target impian Anda sekarang!</div>
            <button class="btn-primary" id="btnDashAddGoalEmpty" style="padding: 7px 14px; font-size: 11px; width: auto; margin: 0 auto;">
              + Buat Target Pertama
            </button>
          </div>
        `;
        const addBtn = document.getElementById('btnDashAddGoalEmpty');
        if (addBtn) addBtn.addEventListener('click', () => openGoalModal());
      } else {
        DOM.dashGoalsContainer.innerHTML = topGoals.map(g => renderGoalCardHTML(g, false)).join('');
      }
    }

    attachDynamicCardListeners();
  }

  // ==========================================================================
  // Render: Goal Card HTML Generator
  // ==========================================================================
  function renderGoalCardHTML(goal, showAccordion = true) {
    const milestones = goal.milestones || [];
    const completedCount = milestones.filter(m => m.completed).length;
    const isFinished = goal.progress === 100;

    const milestonesHTML = showAccordion && milestones.length > 0 ? `
      <div class="milestones-accordion">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; display: flex; justify-content: space-between;">
          <span>Langkah Pencapaian</span>
          <span style="color: var(--accent-cyan);">${completedCount}/${milestones.length} Tuntas</span>
        </div>
        ${milestones.map(m => `
          <div class="milestone-item-row" data-goal-id="${goal.id}" data-milestone-id="${m.id}">
            <div class="custom-checkbox ${m.completed ? 'checked' : ''}" data-toggle-milestone="${goal.id}" data-mid="${m.id}">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="milestone-title-text ${m.completed ? 'completed' : ''}">${escapeHtml(m.title)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="goal-card" data-goal-id="${goal.id}">
        <div class="goal-top-row">
          <span class="goal-category-tag cat-${goal.category}">
            ${getCategoryIcon(goal.category)} ${getCategoryName(goal.category)}
          </span>
          <span class="goal-priority-badge priority-${goal.priority}">
            ${goal.priority.toUpperCase()}
          </span>
        </div>

        <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
        ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}

        <!-- Progress Bar Meter -->
        <div class="progress-meter-wrap">
          <div class="progress-label-row">
            <span class="progress-fraction">${completedCount}/${milestones.length} Milestone</span>
            <span class="progress-pct-bold">${goal.progress || 0}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${isFinished ? 'complete' : ''}" style="width: ${goal.progress || 0}%;"></div>
          </div>
        </div>

        ${milestonesHTML}

        <!-- Card Footer -->
        <div class="goal-footer-row" style="margin-top: 12px;">
          <span class="goal-deadline-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Target: ${formatDisplayDate(goal.targetDate)}
          </span>
          <div class="goal-card-actions">
            <button class="icon-btn-sm" data-add-plan-for-goal="${goal.id}" title="Tambah Rencana Terkait">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="icon-btn-sm" data-edit-goal="${goal.id}" title="Edit Target">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn-sm delete-btn" data-delete-goal="${goal.id}" title="Hapus Target">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Render: Goals List (Tab 2)
  // ==========================================================================
  function renderGoalsList() {
    let filtered = [...goals];

    // Filter by category
    if (activeCategoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === activeCategoryFilter);
    }

    // Filter by search
    if (goalSearchQuery.trim()) {
      const q = goalSearchQuery.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.milestones && g.milestones.some(m => m.title.toLowerCase().includes(q)))
      );
    }

    if (DOM.goalsListCounter) DOM.goalsListCounter.textContent = filtered.length;

    if (!DOM.goalsListContainer) return;

    if (filtered.length === 0) {
      DOM.goalsListContainer.innerHTML = `
        <div class="empty-state-box">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 15h8M9 9h.01M15 9h.01"></path>
          </svg>
          <div class="empty-state-title">Tidak Ada Target yang Cocok</div>
          <div class="empty-state-desc">Coba sesuaikan kata kunci pencarian atau pilih kategori lain.</div>
          <button class="btn-primary" id="btnGoalsEmptyAdd" style="padding: 9px 18px; width: auto; margin: 0 auto;">
            + Tambah Target Baru
          </button>
        </div>
      `;
      const btn = document.getElementById('btnGoalsEmptyAdd');
      if (btn) btn.addEventListener('click', () => openGoalModal());
      return;
    }

    DOM.goalsListContainer.innerHTML = filtered.map(g => renderGoalCardHTML(g, true)).join('');
    attachDynamicCardListeners();
  }

  // ==========================================================================
  // Render: Plans List (Tab 3)
  // ==========================================================================
  function renderPlansList() {
    const todayStr = getTodayDateString();
    let filtered = [...plans];

    if (activePlanFilter === 'today') {
      filtered = filtered.filter(p => p.dueDate === todayStr);
    } else if (activePlanFilter === 'upcoming') {
      filtered = filtered.filter(p => p.dueDate > todayStr);
    } else if (activePlanFilter === 'completed') {
      filtered = filtered.filter(p => p.completed);
    }

    if (DOM.plansListCounter) DOM.plansListCounter.textContent = filtered.length;

    if (!DOM.plansListContainer) return;

    if (filtered.length === 0) {
      let emptyMsg = 'Belum ada rencana aksi dalam kategori ini.';
      if (activePlanFilter === 'today') emptyMsg = 'Tidak ada rencana aksi untuk hari ini. Luar biasa atau saatnya santai!';
      if (activePlanFilter === 'upcoming') emptyMsg = 'Belum ada rencana aksi mendatang yang dijadwalkan.';
      if (activePlanFilter === 'completed') emptyMsg = 'Belum ada rencana yang diselesaikan. Semangat!';

      DOM.plansListContainer.innerHTML = `
        <div class="empty-state-box">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <div class="empty-state-title">Daftar Masih Kosong</div>
          <div class="empty-state-desc">${emptyMsg}</div>
          <button class="btn-primary" id="btnPlansEmptyAdd" style="padding: 9px 18px; width: auto; margin: 0 auto;">
            + Tambah Rencana Baru
          </button>
        </div>
      `;
      const btn = document.getElementById('btnPlansEmptyAdd');
      if (btn) btn.addEventListener('click', () => openPlanModal());
      return;
    }

    DOM.plansListContainer.innerHTML = filtered.map(plan => {
      const linkedGoal = goals.find(g => g.id === plan.goalId);
      return `
        <div class="plan-item-card ${plan.completed ? 'completed' : ''}" data-plan-id="${plan.id}">
          <div class="custom-checkbox ${plan.completed ? 'checked' : ''}" data-toggle-plan="${plan.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="plan-content-wrap">
            <div class="plan-title-text">${escapeHtml(plan.title)}</div>
            <div class="plan-meta-row">
              ${linkedGoal ? `<span class="plan-linked-goal">🎯 ${escapeHtml(linkedGoal.title)}</span>` : ''}
              <span class="plan-time-tag">📅 ${formatDisplayDate(plan.dueDate)} ${plan.dueTime ? '• ' + plan.dueTime : ''}</span>
              <span class="goal-priority-badge priority-${plan.priority}">${plan.priority}</span>
            </div>
          </div>
          <button class="icon-btn-sm" data-edit-plan="${plan.id}" title="Edit Rencana" style="margin-right: 4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn-sm delete-btn" data-delete-plan="${plan.id}" title="Hapus">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
          </button>
        </div>
      `;
    }).join('');

    attachDynamicCardListeners();
  }

  // ==========================================================================
  // Render: Analytics (Tab 4)
  // ==========================================================================
  function renderAnalyticsTab() {
    const totalGoals = goals.length;
    const finishedGoals = goals.filter(g => (g.progress || 0) === 100).length;

    let totalMilestones = 0;
    let completedMilestones = 0;
    goals.forEach(g => {
      if (g.milestones) {
        totalMilestones += g.milestones.length;
        completedMilestones += g.milestones.filter(m => m.completed).length;
      }
    });

    if (DOM.statTotalGoals) DOM.statTotalGoals.textContent = totalGoals;
    if (DOM.statFinishedGoals) DOM.statFinishedGoals.textContent = finishedGoals;
    if (DOM.statCompletedMilestones) {
      DOM.statCompletedMilestones.textContent = `${completedMilestones}/${totalMilestones}`;
    }
    if (DOM.statStreakDays) {
      DOM.statStreakDays.textContent = `${streak.count}🔥`;
    }

    // Category Breakdown Progress Bars
    if (DOM.categoryBreakdownContainer) {
      const categories = ['pendidikan', 'finansial', 'kesehatan', 'pribadi', 'karir'];
      DOM.categoryBreakdownContainer.innerHTML = categories.map(cat => {
        const catGoals = goals.filter(g => g.category === cat);
        let pct = 0;
        if (catGoals.length > 0) {
          const sum = catGoals.reduce((acc, g) => acc + (g.progress || 0), 0);
          pct = Math.round(sum / catGoals.length);
        }

        return `
          <div class="cat-progress-item">
            <div class="cat-progress-info">
              <span class="cat-name-lbl">${getCategoryIcon(cat)} ${getCategoryName(cat)} (${catGoals.length})</span>
              <span class="cat-pct-lbl">${pct}%</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill ${pct === 100 ? 'complete' : ''}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ==========================================================================
  // Dynamic Card Event Delegation
  // ==========================================================================
  function attachDynamicCardListeners() {
    // 1. Toggle Milestone Checkbox
    document.querySelectorAll('[data-toggle-milestone]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const gid = this.getAttribute('data-toggle-milestone');
        const mid = this.getAttribute('data-mid');
        toggleMilestone(gid, mid);
      };
    });

    // 2. Toggle Plan Checkbox
    document.querySelectorAll('[data-toggle-plan]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const pid = this.getAttribute('data-toggle-plan');
        togglePlan(pid);
      };
    });

    // 3. Edit Goal
    document.querySelectorAll('[data-edit-goal]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const gid = this.getAttribute('data-edit-goal');
        openGoalModal(gid);
      };
    });

    // 4. Delete Goal
    document.querySelectorAll('[data-delete-goal]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const gid = this.getAttribute('data-delete-goal');
        deleteGoal(gid);
      };
    });

    // 5. Add Plan Linked to Goal
    document.querySelectorAll('[data-add-plan-for-goal]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const gid = this.getAttribute('data-add-plan-for-goal');
        openPlanModal(null, gid);
      };
    });

    // 6. Edit Plan
    document.querySelectorAll('[data-edit-plan]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const pid = this.getAttribute('data-edit-plan');
        openPlanModal(pid);
      };
    });

    // 7. Delete Plan
    document.querySelectorAll('[data-delete-plan]').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const pid = this.getAttribute('data-delete-plan');
        deletePlan(pid);
      };
    });
  }

  // ==========================================================================
  // Update Streak UI
  // ==========================================================================
  function updateStreakDisplay() {
    if (DOM.streakCount) {
      DOM.streakCount.textContent = streak.count || 0;
    }
  }

  // ==========================================================================
  // Form Submissions
  // ==========================================================================
  function setupForms() {
    // Goal Form Submit
    if (DOM.goalForm) {
      DOM.goalForm.onsubmit = function (e) {
        e.preventDefault();

        const goalId = DOM.goalFormId.value.trim();
        const title = DOM.goalFormTitle.value.trim();
        const description = DOM.goalFormDesc.value.trim();
        const category = DOM.goalFormCategory.value;
        const priority = DOM.goalFormPriority.value;
        const startDate = DOM.goalFormStartDate.value || getTodayDateString();
        const targetDate = DOM.goalFormTargetDate.value;

        // Gather milestones
        const milestoneInputs = DOM.goalFormMilestonesList.querySelectorAll('.milestone-title-input');
        const milestones = [];
        milestoneInputs.forEach((inp, idx) => {
          const mTitle = inp.value.trim();
          if (mTitle) {
            milestones.push({
              id: `m-${Date.now()}-${idx}`,
              title: mTitle,
              completed: false
            });
          }
        });

        if (goalId) {
          // Update existing
          const existing = goals.find(g => g.id === goalId);
          if (existing) {
            existing.title = title;
            existing.description = description;
            existing.category = category;
            existing.priority = priority;
            existing.startDate = startDate;
            existing.targetDate = targetDate;

            // Preserve completion status if milestone names match
            const mergedMilestones = milestones.map(m => {
              const old = existing.milestones ? existing.milestones.find(om => om.title.toLowerCase() === m.title.toLowerCase()) : null;
              return {
                id: m.id,
                title: m.title,
                completed: old ? old.completed : false
              };
            });
            existing.milestones = mergedMilestones;
            recalculateGoalProgress(existing);

            StorageService.saveGoals(goals);
            showToast('Target berhasil diperbarui!', 'success');
          }
        } else {
          // Create new
          const newGoal = {
            id: `goal-${Date.now()}`,
            title,
            description,
            category,
            priority,
            startDate,
            targetDate,
            progress: 0,
            createdAt: new Date().toISOString(),
            milestones
          };
          recalculateGoalProgress(newGoal);
          goals.unshift(newGoal);
          StorageService.saveGoals(goals);
          showToast('Target baru berhasil dibuat! 🎯', 'success');
        }

        closeModal(DOM.goalModal);
        renderDashboard();
        renderGoalsList();
        renderAnalyticsTab();
      };
    }

    // Plan Form Submit
    if (DOM.planForm) {
      DOM.planForm.onsubmit = function (e) {
        e.preventDefault();

        const planId = DOM.planFormId.value.trim();
        const title = DOM.planFormTitle.value.trim();
        const goalId = DOM.planFormGoalId.value;
        const dueDate = DOM.planFormDueDate.value || getTodayDateString();
        const dueTime = DOM.planFormDueTime.value || '09:00';
        const priority = DOM.planFormPriority.value || 'sedang';
        const category = DOM.planFormCategory.value || 'pendidikan';

        if (planId) {
          // Update existing
          const existing = plans.find(p => p.id === planId);
          if (existing) {
            existing.title = title;
            existing.goalId = goalId;
            existing.dueDate = dueDate;
            existing.dueTime = dueTime;
            existing.priority = priority;
            existing.category = category;
            StorageService.savePlans(plans);
            showToast('Rencana aksi diperbarui!', 'success');
          }
        } else {
          // Create new
          const newPlan = {
            id: `plan-${Date.now()}`,
            title,
            goalId,
            dueDate,
            dueTime,
            priority,
            category,
            completed: false
          };
          plans.unshift(newPlan);
          StorageService.savePlans(plans);
          showToast('Rencana aksi baru ditambahkan! 📝', 'success');
        }

        closeModal(DOM.planModal);
        renderDashboard();
        renderPlansList();
        renderAnalyticsTab();
      };
    }
  }

  // ==========================================================================
  // Global Event Listeners Setup
  // ==========================================================================
  function setupEventListeners() {
    // 1. Navigation Tab Buttons
    DOM.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (targetTab) switchTab(targetTab);
      });
    });

    // 2. Links from Dashboard
    if (DOM.linkToPlansTab) {
      DOM.linkToPlansTab.addEventListener('click', () => switchTab('tab-plans'));
    }
    if (DOM.linkToGoalsTab) {
      DOM.linkToGoalsTab.addEventListener('click', () => switchTab('tab-goals'));
    }

    // 3. Center FAB Button
    if (DOM.fabBtn) {
      DOM.fabBtn.addEventListener('click', () => {
        openModal(DOM.fabMenuModal);
      });
    }

    // 4. FAB Options
    if (DOM.fabOptionGoal) {
      DOM.fabOptionGoal.addEventListener('click', () => {
        closeModal(DOM.fabMenuModal);
        openGoalModal();
      });
    }
    if (DOM.fabOptionPlan) {
      DOM.fabOptionPlan.addEventListener('click', () => {
        closeModal(DOM.fabMenuModal);
        openPlanModal();
      });
    }

    // 5. Direct Add Buttons
    if (DOM.btnAddNewGoal) {
      DOM.btnAddNewGoal.addEventListener('click', () => openGoalModal());
    }
    if (DOM.btnAddNewPlan) {
      DOM.btnAddNewPlan.addEventListener('click', () => openPlanModal());
    }

    // 6. Modal Close Buttons (data-close-modal)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
      });
    });

    // Close modal when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) {
          closeModal(backdrop);
        }
      });
    });

    // 7. Add Milestone Row in Goal Modal
    if (DOM.btnAddMilestoneRow) {
      DOM.btnAddMilestoneRow.addEventListener('click', () => {
        addMilestoneInputRow('');
      });
    }

    // 8. Refresh Quote Button
    if (DOM.btnRefreshQuote) {
      DOM.btnRefreshQuote.addEventListener('click', () => {
        displayQuote(currentQuoteIndex);
        showToast('Kutipan inspirasi diperbarui!', 'info');
      });
    }

    // 9. Streak Badge Click
    if (DOM.streakBadge) {
      DOM.streakBadge.addEventListener('click', () => {
        showToast(`🔥 Streak Anda: ${streak.count} hari disiplin berturut-turut! Pertahankan!`, 'info');
        if (confettiEngine) confettiEngine.trigger(40);
      });
    }

    // 9b. User Avatar Profile Click
    if (DOM.userAvatar) {
      DOM.userAvatar.addEventListener('click', () => {
        if (DOM.profileStatsGoals && goals) {
          DOM.profileStatsGoals.textContent = goals.filter(g => g.progress < 100).length;
        }
        if (DOM.profileStatsStreak && streak) {
          DOM.profileStatsStreak.textContent = `${streak.count} Hari`;
        }
        if (DOM.profileModal) openModal(DOM.profileModal);
      });
    }

    // 9c. Logout Button Click
    if (DOM.btnLogout) {
      DOM.btnLogout.addEventListener('click', async () => {
        if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
          if (typeof AuthService !== 'undefined') {
            await AuthService.logout();
          } else {
            window.location.href = 'login.html';
          }
        }
      });
    }

    // 10. Goal Search Input
    if (DOM.goalSearchInput) {
      DOM.goalSearchInput.addEventListener('input', e => {
        goalSearchQuery = e.target.value;
        renderGoalsList();
      });
    }

    // 11. Goal Category Filter Pills
    if (DOM.goalCategoryFilters) {
      DOM.goalCategoryFilters.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          DOM.goalCategoryFilters.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          activeCategoryFilter = pill.getAttribute('data-category') || 'all';
          renderGoalsList();
        });
      });
    }

    // 12. Plan Filter Tabs
    if (DOM.planFilterTabs) {
      DOM.planFilterTabs.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          DOM.planFilterTabs.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          activePlanFilter = pill.getAttribute('data-plan-filter') || 'today';
          renderPlansList();
        });
      });
    }

    // 13. Desktop Frame Mode Toggle
    if (DOM.modeToggleBtn) {
      DOM.modeToggleBtn.addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        if (isFullscreen) {
          document.body.classList.add('fullscreen-mode');
          if (DOM.modeToggleText) DOM.modeToggleText.textContent = 'Mode Mockup';
          showToast('Beralih ke tampilan layar penuh', 'info');
        } else {
          document.body.classList.remove('fullscreen-mode');
          if (DOM.modeToggleText) DOM.modeToggleText.textContent = 'Layar Penuh';
          showToast('Beralih ke mode smartphone mockup', 'info');
        }
      });
    }

    // 14. Reset All Data Button
    if (DOM.btnResetAllData) {
      DOM.btnResetAllData.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua target dan rencana aksi Anda?')) {
          const resetData = StorageService.resetAllData();
          goals = resetData.goals;
          plans = resetData.plans;
          streak = resetData.streak;
          updateStreakDisplay();
          showToast('Semua data berhasil dibersihkan', 'info');
          renderDashboard();
          renderGoalsList();
          renderPlansList();
          renderAnalyticsTab();
        }
      });
    }

    // ESC key closes any open modal
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    // Load persisted or default data
    goals = StorageService.getGoals();
    plans = StorageService.getPlans();
    streak = StorageService.getStreak();

    // Initialize Confetti Engine
    if (DOM.confettiCanvas) {
      confettiEngine = new ConfettiEffect(DOM.confettiCanvas);
    }

    // Set real-time clock & header info
    updateTimeAndGreetings();
    setInterval(updateTimeAndGreetings, 30000); // update every 30s

    // Set initial quote & streak
    displayQuote();
    updateStreakDisplay();

    // Setup forms and listeners
    setupForms();
    setupEventListeners();

    // Render Initial View
    renderDashboard();
    renderGoalsList();
    renderPlansList();
    renderAnalyticsTab();

    console.log('TrackPlan App Initialized Successfully! 🚀');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
