/* ── Nav avatar popup ──────────────────────────────────────────────────────── */
const avatarBtn   = document.getElementById('avatarBtn');
const avatarPopup = document.getElementById('avatarPopup');

if (avatarBtn && avatarPopup) {
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarPopup.hidden = !avatarPopup.hidden;
  });
  document.addEventListener('click', () => { avatarPopup.hidden = true; });
}

/* ── Entrance animations ───────────────────────────────────────────────────── */
if (typeof gsap !== 'undefined') {
  const authCard = document.querySelector('.auth-card');
  if (authCard) {
    gsap.fromTo(authCard,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
    );
  }

  const mascot = document.querySelector('.mascot-img');
  if (mascot) {
    gsap.to(mascot, { y: -8, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  document.querySelectorAll('.tournament-card, .team-card').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, delay: i * 0.08, ease: 'power1.out' },
    );
  });
}

/* ── Score report modal (SweetAlert2) ──────────────────────────────────────── */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.report-score-btn');
  if (!btn) return;

  const matchId  = btn.dataset.matchId;
  const homeName = btn.dataset.home;
  const awayName = btn.dataset.away;
  const homeId   = btn.dataset.homeId;
  const awayId   = btn.dataset.awayId;

  const { value: formValues } = await Swal.fire({
    title: 'Report Score',
    html: `
      <div style="text-align:left">
        <label style="font-weight:600">${homeName} Score</label>
        <input id="homeScore" class="swal2-input" type="number" min="0" placeholder="0">
        <label style="font-weight:600">${awayName} Score</label>
        <input id="awayScore" class="swal2-input" type="number" min="0" placeholder="0">
        <label style="font-weight:600;display:block;margin-top:12px">Winner</label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:6px">
          <input type="radio" name="winner" value="${homeId}" id="winnerHome"> ${homeName}
        </label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <input type="radio" name="winner" value="${awayId}" id="winnerAway"> ${awayName}
        </label>
      </div>`,
    imageUrl: '/images/pp-mascot/referee-whistle.png',
    imageWidth: 80,
    imageHeight: 80,
    confirmButtonText: 'Submit',
    confirmButtonColor: '#FFD700',
    showCancelButton: true,
    focusConfirm: false,
    preConfirm: () => {
      const homeScore = document.getElementById('homeScore').value;
      const awayScore = document.getElementById('awayScore').value;
      const winner    = document.querySelector('input[name="winner"]:checked');
      if (!homeScore || !awayScore || !winner) {
        Swal.showValidationMessage('All fields are required');
        return false;
      }
      return { homeScore, awayScore, winnerId: winner.value };
    },
  });

  if (!formValues) return;

  try {
    const res = await fetch(`/matches/${matchId}/score-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: formValues.homeScore,
        away_score: formValues.awayScore,
        reported_winner_team_id: formValues.winnerId,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    await Swal.fire({
      title: 'Score Submitted!',
      imageUrl: '/images/pp-mascot/referee-celebrating.png',
      imageWidth: 80, imageHeight: 80,
      confirmButtonColor: '#FFD700',
      timer: 3000,
    });
    location.reload();
  } catch (err) {
    Swal.fire({
      title: 'Error',
      text: err.message || 'Failed to submit score.',
      imageUrl: '/images/pp-mascot/referee-whistle.png',
      imageWidth: 80, imageHeight: 80,
      confirmButtonColor: '#FF4500',
    });
  }
});

/* ── Creator Set Winner modal ──────────────────────────────────────────────── */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.override-btn');
  if (!btn) return;

  const matchId  = btn.dataset.matchId;
  const homeName = btn.dataset.home;
  const awayName = btn.dataset.away;
  const homeId   = btn.dataset.homeId;
  const awayId   = btn.dataset.awayId;

  const { value: winnerId } = await Swal.fire({
    title: 'Set Winner',
    html: `
      <label style="display:flex;align-items:center;gap:8px;margin:8px 0">
        <input type="radio" name="ov_winner" value="${homeId}"> ${homeName}
      </label>
      <label style="display:flex;align-items:center;gap:8px">
        <input type="radio" name="ov_winner" value="${awayId}"> ${awayName}
      </label>`,
    imageUrl: '/images/pp-mascot/referee-whistle.png',
    imageWidth: 80, imageHeight: 80,
    confirmButtonText: 'Confirm',
    confirmButtonColor: '#FF4500',
    showCancelButton: true,
    preConfirm: () => {
      const w = document.querySelector('input[name="ov_winner"]:checked');
      if (!w) { Swal.showValidationMessage('Select a winner'); return false; }
      return w.value;
    },
  });

  if (!winnerId) return;

  const tournamentId = window.TOURNAMENT_ID;
  const res = await fetch(`/tournaments/${tournamentId}/matches/${matchId}/winner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner_team_id: winnerId }),
  });
  const data = await res.json();
  if (data.success) location.reload();
});

/* ── Publish button ────────────────────────────────────────────────────────── */
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
  publishBtn.addEventListener('click', async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Publish Tournament?',
      text: 'This will make the tournament public and open signups.',
      imageUrl: '/images/pp-mascot/referee-celebrating.png',
      imageWidth: 80, imageHeight: 80,
      confirmButtonText: 'Publish!',
      confirmButtonColor: '#FFD700',
      showCancelButton: true,
    });
    if (!isConfirmed) return;

    const id  = publishBtn.dataset.id;
    const res = await fetch(`/tournaments/${id}/publish`, { method: 'POST' });
    const d   = await res.json();
    if (d.success) location.reload();
  });
}

/* ── Start Tournament button ───────────────────────────────────────────────── */
const startBtn = document.getElementById('startBtn');
if (startBtn) {
  startBtn.addEventListener('click', async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Start Tournament?',
      text: 'This will generate the bracket and notify all players!',
      imageUrl: '/images/pp-mascot/referee-celebrating.png',
      imageWidth: 80, imageHeight: 80,
      confirmButtonText: '🚀 Let\'s Go!',
      confirmButtonColor: '#32CD32',
      showCancelButton: true,
    });
    if (!isConfirmed) return;

    if (typeof gsap !== 'undefined') {
      gsap.to('.mascot-img', { rotation: 360, duration: 0.6, ease: 'power2.inOut' });
    }

    const id  = startBtn.dataset.id;
    const res = await fetch(`/tournaments/${id}/start`, { method: 'POST' });
    const d   = await res.json();
    if (d.success) location.reload();
  });
}

/* ── Share button ──────────────────────────────────────────────────────────── */
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const url = shareBtn.dataset.url || window.SHARE_URL;
    await navigator.clipboard.writeText(url).catch(() => {});
    Swal.fire({ title: 'Link Copied!', text: url, timer: 2000, showConfirmButton: false });
  });
}

/* ── Smooth scroll to bracket anchor on page load ──────────────────────────── */
if (location.hash.startsWith('#round-')) {
  const el = document.querySelector(location.hash);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
} else if (location.hash === '#bracket') {
  const el = document.getElementById('bracket');
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
}

/* ── Tournament create wizard ──────────────────────────────────────────────── */
(function initWizard() {
  const nameInput   = document.getElementById('tournamentName');
  if (!nameInput) return; // not on create page

  const charCount   = document.getElementById('nameCharCount');
  const generateBtn = document.getElementById('generateBtn');
  const step1       = document.getElementById('step1');
  const step2       = document.getElementById('step2');
  const step3       = document.getElementById('step3');
  const step4       = document.getElementById('step4');
  const step5       = document.getElementById('step5');
  const mascotEl    = document.querySelector('.mascot-img');

  let wizardData = {};

  function showStep(el) {
    [step1, step2, step3, step4, step5].forEach(s => { if (s) s.hidden = true; });
    el.hidden = false;
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
    }
  }

  nameInput.addEventListener('input', () => {
    charCount.textContent = `${nameInput.value.length} / 100`;
  });

  generateBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return;

    // Show thinking mascot
    if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-thinking.png';

    try {
      const res  = await fetch('/ai/rules-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_name: name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      wizardData.tournamentName = name;
      wizardData.themeId        = data.data.theme_id;
      wizardData.description    = data.data.description;
      wizardData.gameRules      = data.data.game_rules;

      document.getElementById('themeSelect').value = data.data.theme_id;
      document.getElementById('description').value = data.data.description;
      document.getElementById('gameRules').value   = data.data.game_rules;

      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-idle.png';
      showStep(step2);
    } catch (err) {
      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-whistle.png';
      Swal.fire({ title: 'Oops!', text: err.message, confirmButtonColor: '#FF4500',
        imageUrl: '/images/pp-mascot/referee-whistle.png', imageWidth: 80, imageHeight: 80 });
    }
  });

  document.getElementById('step2NextBtn')?.addEventListener('click', () => {
    wizardData.themeId     = document.getElementById('themeSelect').value;
    wizardData.description = document.getElementById('description').value;
    wizardData.gameRules   = document.getElementById('gameRules').value;
    showStep(step3);
  });

  document.getElementById('createTeamsBtn')?.addEventListener('click', async () => {
    const count = parseInt(document.getElementById('numTeams').value, 10);
    wizardData.numTeams = count;

    if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-thinking.png';

    try {
      const res  = await fetch('/ai/team-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, theme_id: wizardData.themeId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      wizardData.teams = data.data.teams;
      renderTeams(data.data.teams);
      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-idle.png';
      document.getElementById('teamsList').hidden = false;
      document.getElementById('regenTeamsBtn').hidden = false;
      document.getElementById('step3NextBtn').hidden  = false;
    } catch (err) {
      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-whistle.png';
      Swal.fire({ title: 'Oops!', text: err.message, confirmButtonColor: '#FF4500' });
    }
  });

  document.getElementById('regenTeamsBtn')?.addEventListener('click', () => {
    document.getElementById('createTeamsBtn').click();
  });

  function renderTeams(teams) {
    const list = document.getElementById('teamsList');
    list.innerHTML = teams.map((t, i) => `
      <div style="display:flex;gap:10px;align-items:center">
        <input class="form-input" value="${t.name}" data-idx="${i}" style="flex:1" placeholder="Team name" />
        <span style="font-size:0.85rem;color:#888">${t.mascot}</span>
      </div>`).join('');
    list.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => { wizardData.teams[inp.dataset.idx].name = inp.value; });
    });
  }

  document.getElementById('step3NextBtn')?.addEventListener('click', () => showStep(step4));
  document.getElementById('step4NextBtn')?.addEventListener('click', () => {
    wizardData.prizeTypeId      = document.getElementById('prizeTypeId').value || null;
    wizardData.prizeDescription = document.getElementById('prizeDescription').value || null;
    showStep(step5);
  });

  document.getElementById('saveTournamentBtn')?.addEventListener('click', async () => {
    wizardData.location      = document.getElementById('location').value;
    wizardData.startDatetime = document.getElementById('startDatetime').value;
    wizardData.timezone      = document.getElementById('timezone').value;

    if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-thinking.png';

    try {
      // Step A: create tournament
      const tRes = await fetch('/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: wizardData.tournamentName,
          description: wizardData.description,
          theme_id: wizardData.themeId,
          game_rules: wizardData.gameRules,
          num_teams: wizardData.numTeams,
          prize_type_id: wizardData.prizeTypeId,
          prize_description: wizardData.prizeDescription,
          location: wizardData.location,
          start_datetime: wizardData.startDatetime,
          timezone: wizardData.timezone,
        }),
      });
      const tData = await tRes.json();
      if (!tData.success) throw new Error(tData.error);

      const { tournamentId, shareCode } = tData.data;

      // Step B: create teams
      const mascotMap = {};
      (window.THEMES || []).forEach(th => {}); // themes available for mascot_id lookup

      // Teams from AI use mascot names — we need to map names to ids from the DB
      // The AI controller returns { name, mascot } where mascot is the mascot name
      // We'll pass them as-is and let the server look them up
      const teamsPayload = wizardData.teams.map(t => ({ name: t.name, mascot_name: t.mascot }));

      const tmRes = await fetch(`/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: teamsPayload }),
      });
      const tmData = await tmRes.json();
      if (!tmData.success) throw new Error(tmData.error);

      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-celebrating.png';
      window.location.href = `/t/${shareCode}`;
    } catch (err) {
      if (mascotEl) mascotEl.src = '/images/pp-mascot/referee-whistle.png';
      Swal.fire({ title: 'Error', text: err.message, confirmButtonColor: '#FF4500' });
    }
  });
})();
