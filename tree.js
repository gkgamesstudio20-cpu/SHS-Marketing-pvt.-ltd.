/**
 * SHS Marketing — Matrix Tree Viewer  (5 × 7 Matrix Plan)
 * ─────────────────────────────────────────────────────────
 * Plan structure:
 *   Level 1 →    5 members  (your direct referrals)
 *   Level 2 →   25 members  (each L1 member refers 5)
 *   Level 3 →  125 members
 *   Level 4 →  625 members
 *   Level 5 → 3,125 members
 *   Level 6 → 15,625 members
 *   Level 7 → 78,125 members
 *   TOTAL   → 97,655 members at full capacity
 *
 * Embedded in dashboard as a section — NOT a standalone page.
 */

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const TREE_API_URL  = 'https://script.google.com/macros/s/AKfycbzfHIV2BQHqHsxE5c4Hc9IS_ssXfsLb0sYDtzehoFbb9fbgBYhlUXGI7Zm0bEfKQzR-jg/exec';
const MAX_LEVELS    = 7;
const MAX_DIRECT    = 5;   // Each member can have exactly 5 direct referrals
const LEVEL_CAP     = [0, 5, 25, 125, 625, 3125, 15625, 78125]; // index = level number
const TOTAL_MAX     = 97655; // 5+25+125+625+3125+15625+78125

// ── STATE ─────────────────────────────────────────────────────────────────────
const treeState = {
  currentUser : null,
  treeData    : null,
  currentDepth: 2          // default view depth — shows L0 (root), L1, L2
};

// ── DOM REFS ──────────────────────────────────────────────────────────────────
let T = {};
let _treeInitialized = false;

// ── LEVEL COLOURS ─────────────────────────────────────────────────────────────
const LEVEL_COLORS = ['#6366f1','#3b82f6','#8b5cf6','#ec4899','#f97316','#eab308','#14b8a6','#6366f1'];

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function treeApiCall(action, payload = {}) {
  try {
    const body = 'data=' + encodeURIComponent(JSON.stringify({ action, ...payload }));
    const res  = await fetch(TREE_API_URL, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'follow'
    });

    const text = await res.text();
    let result;
    try { result = JSON.parse(text); }
    catch {
      throw new Error(
        'Server returned non-JSON. ' +
        'Ensure the Apps Script is deployed as "Anyone" with execute access.'
      );
    }
    if (!result.success) throw new Error(result.message || 'API error');
    return result;

  } catch (err) {
    console.error(`[treeApiCall] ${action}:`, err);
    treeToast(err.message || 'Network error — check connection', 'error');
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────
function initTreeSearch() {
  T.searchForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val  = T.searchInput?.value.trim();
    const type = T.searchType?.value;
    if (!val) { treeToast('Enter a User ID or Referral Code', 'warning'); return; }

    treeShowLoader(true);
    try {
      const result = await treeApiCall(
        type === 'userId' ? 'getUserDataByUserId' : 'getUserDataByReferralCode',
        type === 'userId' ? { userId: val } : { referralCode: val.toUpperCase() }
      );
      if (!result.user) throw new Error('User not found.');
      // Always store the full user object so the root card shows real data
      treeState.currentUser = result.user;
      await loadTreeData();
      treeShowDashboard();
      treeToast(`Tree loaded for ${result.user.firstName || result.user.userId}!`, 'success');
    } catch (err) {
      treeShowError(err.message);
    } finally {
      treeShowLoader(false);
    }
  });

  T.newSearch?.addEventListener('click', treeResetView);
}

function treeShowDashboard() {
  T.treeSearchPanel?.classList.add('hidden');
  T.treeDashPanel?.classList.remove('hidden');
  if (treeState.currentUser) {
    const u    = treeState.currentUser;
    const name = u.firstName
      ? `${u.firstName} ${u.lastName || ''}`.trim()
      : (u.name || u.userId || 'Unknown');
    const uid  = u.userId ? ` (${u.userId})` : '';
    if (T.viewingUser)  T.viewingUser.textContent  = `Viewing: ${name}${uid}`;
    if (T.viewingLevel) T.viewingLevel.textContent = `Level: ${u.currentlevel || 1}`;
  }
}

function treeResetView() {
  treeState.currentUser = null;
  treeState.treeData    = null;
  T.treeDashPanel?.classList.add('hidden');
  T.treeSearchPanel?.classList.remove('hidden');
  T.searchForm?.reset();
  if (T.treeRoot) T.treeRoot.innerHTML = '';
}

function treeShowError(msg) {
  T.treeLoader?.classList.add('hidden');
  T.treeRoot?.classList.add('hidden');
  T.treeEmpty?.classList.add('hidden');
  T.treeError?.classList.remove('hidden');
  if (T.errorMessage) T.errorMessage.textContent = msg;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────────────────────────────────────────────
async function loadTreeData() {
  if (!treeState.currentUser?.userId) return;
  treeShowLoader(true);
  T.treeError?.classList.add('hidden');

  try {
    const [countResult, treeResult] = await Promise.all([
      treeApiCall('tree', { treeAction: 'countDownline',   userId: treeState.currentUser.userId }),
      treeApiCall('tree', { treeAction: 'getDownlineTree', userId: treeState.currentUser.userId, maxDepth: MAX_LEVELS, maxChildren: 100 })
    ]);

    treeState.treeData = treeResult.tree;
    updateTreeStats(countResult.counts);
    renderLevelBars(countResult.counts);
    renderTreeView();

  } catch (err) {
    treeShowError('Failed to load tree: ' + (err.message || 'Please try again.'));
  } finally {
    T.treeLoader?.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function updateTreeStats(counts) {
  if (!counts) return;

  const total = counts.totalDownline || 0;
  if (T.totalDownline) T.totalDownline.textContent = total.toLocaleString('en-IN');

  let activeLevels = 0;
  for (let i = 1; i <= MAX_LEVELS; i++) {
    if ((counts.breakdown?.[`level${i}`] || 0) > 0) activeLevels++;
  }
  if (T.activeLevels)    T.activeLevels.textContent    = `${activeLevels}/7`;
  if (T.directReferrals) T.directReferrals.textContent = `${counts.breakdown?.level1 || 0}/${MAX_DIRECT}`;

  const fill = Math.min(Math.round((total / TOTAL_MAX) * 100), 100);
  if (T.matrixFill) T.matrixFill.textContent = `${fill}%`;
}

function renderLevelBars(counts) {
  if (!counts?.breakdown || !T.levelBars) return;

  let html = '';
  for (let i = 1; i <= MAX_LEVELS; i++) {
    const count = counts.breakdown[`level${i}`] || 0;
    const cap   = LEVEL_CAP[i];
    const pct   = Math.min(Math.round((count / cap) * 100), 100);
    const color = LEVEL_COLORS[i];
    html += `
      <div class="level-bar-item">
        <div class="level-bar-label">
          <span style="font-weight:600;color:${color}">Level ${i}</span>
          <span>${count.toLocaleString('en-IN')} / ${cap.toLocaleString('en-IN')}</span>
        </div>
        <div class="level-bar-track">
          <div class="level-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="level-bar-percent">${pct}%</div>
      </div>`;
  }
  T.levelBars.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// TREE RENDERING — 5 × 7 Matrix Pyramid
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Layout model:
 *
 *   Depth 1 (root):   [ YOU ]
 *                    /  | | | \
 *   Depth 2:        [1][2][3][4][5]          ← up to 5 filled + empty slots
 *                  /|\ ...
 *   Depth 3:      [1][2][3][4][5] × each L2 node
 *   ...
 *
 * Each "level row" is a flex container with exactly MAX_DIRECT (5) slots.
 * Filled slots show a member card.  Empty slots show a "+Join" placeholder.
 * Connector lines are drawn with CSS borders on pseudo-elements.
 */

function renderTreeView() {
  if (!T.treeRoot) return;
  T.treeRoot.innerHTML = '';
  injectTreeStyles();         // ensure styles are present every render

  const node = treeState.treeData;
  if (!node) {
    T.treeEmpty?.classList.remove('hidden');
    T.treeRoot?.classList.add('hidden');
    return;
  }

  T.treeEmpty?.classList.add('hidden');
  T.treeRoot?.classList.remove('hidden');

  // Always use the searched user's real data for the root card
  const cu = treeState.currentUser;
  const rootUser = {
    ...node,
    userId      : cu.userId      || node.userId,
    firstName   : cu.firstName   || node.firstName || '',
    lastName    : cu.lastName    || node.lastName  || '',
    name        : cu.firstName
                    ? `${cu.firstName} ${cu.lastName || ''}`.trim()
                    : (cu.name || node.name || cu.userId || 'Root'),
    referralCode: cu.referralCode || node.referralCode || '',
    mobile      : cu.mobile      || node.mobile || '',
    email       : cu.email       || node.email  || '',
    status      : cu.status      || node.status || 'Active',
    date        : cu.Date        || cu.date     || node.date || '',
    currentlevel: cu.currentlevel|| node.currentlevel || 1,
    isRoot      : true,
    children    : node.children  || []
  };

  // Pre-clean: strip any duplicate/circular nodes from the entire tree data
  // before passing to buildPyramid (belt-and-suspenders alongside the
  // ancestor-set check inside buildPyramid itself)
  deduplicateTree(rootUser, new Set());

  // Build the full pyramid DOM — root starts at depth 0 (L0)
  const pyramid = buildPyramid(rootUser, 0);
  T.treeRoot.appendChild(pyramid);
}

/**
 * deduplicateTree — mutates the tree in-place, removing any child node
 * whose userId has already appeared anywhere above it in the hierarchy.
 * Fixes bad sponsor data where a user is incorrectly set as their own
 * (or an ancestor's) child, causing infinite loops / repeated cards.
 *
 * @param {object} node      - current tree node
 * @param {Set}    seen      - Set of userIds already encountered above
 */
function deduplicateTree(node, seen) {
  if (!node) return;
  if (node.userId) seen.add(node.userId);
  if (!Array.isArray(node.children)) return;

  // Filter out children that are already ancestors
  node.children = node.children.filter(c => {
    if (!c || !c.userId) return true;
    return !seen.has(c.userId);
  });

  // Recurse into surviving children, passing a copy of seen per branch
  node.children.forEach(child => {
    deduplicateTree(child, new Set(seen));
  });
}

/**
 * buildPyramid — recursively builds the visual pyramid level by level.
 *
 * @param {object} user      - the node data object (with .children[])
 * @param {number} depth     - current tree depth (1 = root)
 * @param {Set}    ancestors - Set of userIds already rendered above this node
 *                             (prevents circular / duplicate nodes from bad sponsor data)
 * @returns {HTMLElement}
 */
function buildPyramid(user, depth, ancestors = new Set()) {
  // Outer wrapper groups this node + everything below it
  const wrap = document.createElement('div');
  wrap.className    = 'matrix-node-wrap';
  wrap.dataset.depth = depth;

  // ── The node card itself ──────────────────────────────────────────────────
  const cardRow = document.createElement('div');
  cardRow.className = 'matrix-card-row';
  cardRow.appendChild(buildMatrixCard(user, depth));
  wrap.appendChild(cardRow);

  // ── Hard stop at MAX_LEVELS — nothing beyond level 7 ────────────────────
  if (depth >= MAX_LEVELS) return wrap;

  // ── Filter children — remove circular/ancestor refs ──────────────────────
  const ancestorsWithSelf = new Set(ancestors);
  if (user.userId) ancestorsWithSelf.add(user.userId);

  const rawChildren = user.children || [];
  const children    = rawChildren.filter(c => {
    if (!c || !c.userId) return true;
    return !ancestorsWithSelf.has(c.userId);
  });

  const hasAnyChild = children.length > 0;

  if (!hasAnyChild && depth > 0) return wrap; // leaf node — no empty slots beyond L0

  // ── At display depth limit: show overflow button only (no children row) ──
  if (depth >= treeState.currentDepth) {
    const overflowKids = children.slice(MAX_DIRECT);
    if (overflowKids.length > 0) {
      const overflowToggle = document.createElement('button');
      overflowToggle.className = 'matrix-overflow-toggle';
      overflowToggle.innerHTML =
        '<i class="fas fa-ellipsis-h"></i> +' + overflowKids.length +
        ' overflow member' + (overflowKids.length > 1 ? 's' : '') + ' — click to view';
      overflowToggle.title = 'These members were placed here via overflow routing';

      const ovConnV = document.createElement('div');
      ovConnV.className = 'matrix-connector-v matrix-connector-collapsed';
      const ovHBar = document.createElement('div');
      ovHBar.className = 'matrix-connector-h matrix-connector-collapsed';
      const overflowRow = document.createElement('div');
      overflowRow.className = 'matrix-children-row matrix-children-collapsed';

      overflowKids.forEach(kid => {
        const slotWrap = document.createElement('div');
        slotWrap.className = 'matrix-slot-wrap';
        const tick = document.createElement('div');
        tick.className = 'matrix-connector-tick';
        slotWrap.appendChild(tick);
        slotWrap.appendChild(buildPyramid(kid, depth + 1, ancestorsWithSelf));
        overflowRow.appendChild(slotWrap);
      });

      overflowToggle.onclick = (e) => {
        e.stopPropagation();
        const hidden = overflowRow.classList.toggle('matrix-children-collapsed');
        ovConnV.classList.toggle('matrix-connector-collapsed', hidden);
        ovHBar.classList.toggle('matrix-connector-collapsed', hidden);
        overflowToggle.innerHTML = hidden
          ? '<i class="fas fa-ellipsis-h"></i> +' + overflowKids.length + ' overflow member' + (overflowKids.length > 1 ? 's' : '') + ' — click to view'
          : '<i class="fas fa-chevron-up"></i> Hide overflow members';
      };

      wrap.appendChild(overflowToggle);
      wrap.appendChild(ovConnV);
      wrap.appendChild(ovHBar);
      wrap.appendChild(overflowRow);
    }
    return wrap;
  }

  // ── Full render: connector + children row + overflow button ──────────────

  // Connector: vertical line from parent card down to children row
  const connector = document.createElement('div');
  connector.className = 'matrix-connector-v';
  wrap.appendChild(connector);

  // Horizontal bar linking all 5 slots
  const hBar = document.createElement('div');
  hBar.className = 'matrix-connector-h';
  wrap.appendChild(hBar);

  // Children container — first MAX_DIRECT slots (filled or empty)
  const childrenWrap = document.createElement('div');
  childrenWrap.className = 'matrix-children-row';

  for (let i = 0; i < MAX_DIRECT; i++) {
    const child = children[i] || null;

    const slotWrap = document.createElement('div');
    slotWrap.className = 'matrix-slot-wrap';

    const tick = document.createElement('div');
    tick.className = 'matrix-connector-tick';
    slotWrap.appendChild(tick);

    if (child) {
      slotWrap.appendChild(buildPyramid(child, depth + 1, ancestorsWithSelf));
    } else {
      slotWrap.appendChild(buildEmptyMatrixSlot(depth + 1));
    }

    childrenWrap.appendChild(slotWrap);
  }

  wrap.appendChild(childrenWrap);

  // Overflow members (beyond slot 5) — orange toggle button, expands as normal pyramid cards
  const overflowKids = children.slice(MAX_DIRECT);
  if (overflowKids.length > 0) {
    const overflowToggle = document.createElement('button');
    overflowToggle.className = 'matrix-overflow-toggle';
    overflowToggle.innerHTML =
      '<i class="fas fa-ellipsis-h"></i> +' + overflowKids.length +
      ' overflow member' + (overflowKids.length > 1 ? 's' : '') + ' — click to view';
    overflowToggle.title = 'These members were placed here via overflow routing';

    const ovConnV = document.createElement('div');
    ovConnV.className = 'matrix-connector-v matrix-connector-collapsed';
    const ovHBar = document.createElement('div');
    ovHBar.className = 'matrix-connector-h matrix-connector-collapsed';

    const overflowRow = document.createElement('div');
    overflowRow.className = 'matrix-children-row matrix-children-collapsed';

    overflowKids.forEach(kid => {
      const slotWrap = document.createElement('div');
      slotWrap.className = 'matrix-slot-wrap';
      const tick = document.createElement('div');
      tick.className = 'matrix-connector-tick';
      slotWrap.appendChild(tick);
      slotWrap.appendChild(buildPyramid(kid, depth + 1, ancestorsWithSelf));
      overflowRow.appendChild(slotWrap);
    });

    overflowToggle.onclick = (e) => {
      e.stopPropagation();
      const hidden = overflowRow.classList.toggle('matrix-children-collapsed');
      ovConnV.classList.toggle('matrix-connector-collapsed', hidden);
      ovHBar.classList.toggle('matrix-connector-collapsed', hidden);
      overflowToggle.innerHTML = hidden
        ? '<i class="fas fa-ellipsis-h"></i> +' + overflowKids.length + ' overflow member' + (overflowKids.length > 1 ? 's' : '') + ' — click to view'
        : '<i class="fas fa-chevron-up"></i> Hide overflow members';
    };

    wrap.appendChild(overflowToggle);
    wrap.appendChild(ovConnV);
    wrap.appendChild(ovHBar);
    wrap.appendChild(overflowRow);
  }

  // Collapse/expand toggle (only when there are actual real children)
  if (children.length > 0) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className   = 'matrix-toggle';
    toggleBtn.textContent = '−';
    toggleBtn.title       = 'Collapse / Expand';
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      const hidden = childrenWrap.classList.toggle('matrix-children-collapsed');
      connector.classList.toggle('matrix-connector-collapsed', hidden);
      hBar.classList.toggle('matrix-connector-collapsed', hidden);
      toggleBtn.textContent = hidden ? '+' : '−';
    };
    // Insert toggle between connector and hBar
    wrap.insertBefore(toggleBtn, hBar);
  }

  return wrap;
}

// ─── Member card ──────────────────────────────────────────────────────────────
function buildMatrixCard(user, depth) {
  const color  = LEVEL_COLORS[Math.min(depth, MAX_LEVELS)] || '#6366f1';
  const isFull = (user.referralCount || 0) >= MAX_DIRECT;
  const isRoot = !!user.isRoot;

  const card = document.createElement('div');
  card.className = [
    'matrix-card',
    isRoot ? 'matrix-card--root' : '',
    isFull ? 'matrix-card--full' : ''
  ].filter(Boolean).join(' ');

  card.style.setProperty('--card-color', color);
  card.onclick = () => treeShowModal(user, depth);

  // ── "YOU (ROOT)" crown label for the top node ─────────────────────────────
  if (isRoot) {
    const crown = document.createElement('div');
    crown.style.cssText = `
      position:absolute; top:-22px; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg,#f59e0b,#ef4444);
      color:#fff; font-size:9px; font-weight:800; letter-spacing:.8px;
      padding:2px 10px; border-radius:999px; white-space:nowrap;
      box-shadow:0 2px 8px rgba(239,68,68,0.35);
    `;
    crown.textContent = '👑 ROOT';
    card.appendChild(crown);
  }

  // Level badge
  const badge = document.createElement('span');
  badge.className   = 'matrix-badge';
  badge.textContent = isRoot ? `L${depth} — YOU` : `L${depth}`;
  badge.style.background = isRoot ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : color;
  card.appendChild(badge);

  // Avatar initials
  const displayName = user.name
    || `${user.firstName || ''} ${user.lastName || ''}`.trim()
    || (user.userId || '??');
  const parts    = displayName.trim().split(' ');
  const initials = ((parts[0]?.[0] || '?') + (parts[1]?.[0] || parts[0]?.[1] || '?')).toUpperCase();

  const avatar = document.createElement('div');
  avatar.className   = 'matrix-avatar';
  avatar.textContent = initials;
  avatar.style.background = color;
  card.appendChild(avatar);

  // Full name
  const nameEl = document.createElement('div');
  nameEl.className   = 'matrix-name';
  nameEl.textContent = displayName.length > 14 ? displayName.slice(0, 13) + '…' : displayName;
  card.appendChild(nameEl);

  // Full User ID (never truncate the SHS-XXXXXXXXXX id)
  const idEl = document.createElement('div');
  idEl.className   = 'matrix-uid';
  idEl.textContent = user.userId || 'N/A';
  card.appendChild(idEl);

  // Referral count pill
  const refPill = document.createElement('div');
  refPill.className = 'matrix-ref-pill';
  refPill.style.background = isFull ? '#10b981' : '#f3f4f6';
  refPill.style.color      = isFull ? '#fff'    : '#374151';
  refPill.innerHTML = `<i class="fas fa-users"></i> ${user.referralCount || 0}/${MAX_DIRECT}`;
  card.appendChild(refPill);

  return card;
}

// ─── Empty slot placeholder ───────────────────────────────────────────────────
function buildEmptyMatrixSlot(depth) {
  const color = LEVEL_COLORS[Math.min(depth, MAX_LEVELS)] || '#94a3b8';

  const slot = document.createElement('div');
  slot.className = 'matrix-empty-slot';
  slot.style.setProperty('--card-color', color);
  slot.innerHTML = `
    <div class="matrix-avatar matrix-avatar--empty" style="background:${color}20;border:2px dashed ${color}">
      <i class="fas fa-user-plus" style="color:${color};font-size:14px"></i>
    </div>
    <div class="matrix-name" style="color:#9ca3af;font-size:10px">Empty Slot</div>
    <div class="matrix-uid" style="color:#d1d5db;font-size:9px">L${depth}</div>`;
  slot.onclick = () => treeToast(`Level ${depth} slot — not yet filled`, 'info');
  return slot;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────
function treeShowModal(user, level) {
  if (!T.memberModal) return;

  const color = LEVEL_COLORS[Math.min(level, MAX_LEVELS)] || '#6366f1';

  if (T.modalTitle) {
    T.modalTitle.textContent = user.name || user.firstName || 'Member';
    T.modalTitle.style.color = color;
  }
  if (T.modalLevel) {
    T.modalLevel.textContent  = `Level ${level}`;
    T.modalLevel.style.background = color;
    T.modalLevel.style.color      = '#fff';
    T.modalLevel.style.padding    = '2px 10px';
    T.modalLevel.style.borderRadius = '999px';
    T.modalLevel.style.fontSize = '12px';
  }

  if (T.modalBody) {
    const filled  = user.referralCount || 0;
    const pct     = Math.round((filled / MAX_DIRECT) * 100);
    const barColor = filled >= MAX_DIRECT ? '#10b981' : color;

    T.modalBody.innerHTML = `
      <div class="detail-row"><span class="detail-label">User ID</span>       <span class="detail-value">${user.userId || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Referral Code</span> <span class="detail-value" id="modalReferralCode">${user.referralCode || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Mobile</span>        <span class="detail-value">${user.mobile || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span>         <span class="detail-value">${user.email || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Joined</span>        <span class="detail-value">${treeFormatDate(user.date || user.Date)}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span>        <span class="detail-value">${user.status || 'Active'}</span></div>
      <div class="detail-row" style="flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between">
          <span class="detail-label">Direct Referrals</span>
          <span class="detail-value" style="color:${barColor};font-weight:700">${filled} / ${MAX_DIRECT}</span>
        </div>
        <div style="background:#f3f4f6;border-radius:999px;height:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor};border-radius:999px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:#6b7280;text-align:right">${pct}% filled — Level ${level} of ${MAX_LEVELS}</div>
      </div>`;
  }

  if (T.modalCopyReferral) {
    T.modalCopyReferral.onclick = () => {
      const code = document.getElementById('modalReferralCode')?.textContent;
      if (code && code !== 'N/A') {
        navigator.clipboard.writeText(code)
          .then(()  => treeToast('Referral code copied!', 'success'))
          .catch(()  => treeToast('Copy failed', 'error'));
      }
    };
  }

  if (T.modalViewDownline) {
    T.modalViewDownline.onclick = async () => {
      if (!user.userId) return;
      treeCloseModal();
      treeShowLoader(true);
      try {
        const res = await treeApiCall('getUserDataByUserId', { userId: user.userId });
        treeState.currentUser = res.user || user;
        await loadTreeData();
        treeShowDashboard();
        treeToast(`Now viewing: ${treeState.currentUser.firstName || user.userId}`, 'success');
      } catch (err) {
        treeShowError(err.message);
      } finally {
        treeShowLoader(false);
      }
    };
  }

  T.memberModal.classList.remove('hidden');
}

function treeCloseModal() {
  T.memberModal?.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
function initTreeControls() {
  T.depthSelector?.addEventListener('change', (e) => {
    treeState.currentDepth = parseInt(e.target.value);
    if (treeState.treeData) renderTreeView();
  });

  T.refreshTree?.addEventListener('click', () => {
    loadTreeData();
    treeToast('Refreshing tree…', 'info');
  });

  T.expandAll?.addEventListener('click', () => {
    document.querySelectorAll('.matrix-children-collapsed').forEach(el => {
      el.classList.remove('matrix-children-collapsed');
    });
    document.querySelectorAll('.matrix-toggle').forEach(btn => { btn.textContent = '−'; });
    document.querySelectorAll('.matrix-connector-collapsed').forEach(el => {
      el.classList.remove('matrix-connector-collapsed');
    });
  });

  T.collapseAll?.addEventListener('click', () => {
    // Collapse all children rows except the direct children of root
    document.querySelectorAll('.matrix-slot-wrap .matrix-children-row').forEach(el => {
      el.classList.add('matrix-children-collapsed');
    });
    document.querySelectorAll('.matrix-slot-wrap .matrix-toggle').forEach(btn => { btn.textContent = '+'; });
  });

  T.exportTree?.addEventListener('click', exportTreeData);
  T.printTree?.addEventListener('click',  () => window.print());

  T.modalClose?.addEventListener('click', treeCloseModal);
  T.memberModal?.addEventListener('click', (e) => {
    if (e.target === T.memberModal) treeCloseModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') treeCloseModal();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function treeShowLoader(show) {
  T.treeLoader?.classList.toggle('hidden', !show);
  if (show) {
    T.treeRoot?.classList.add('hidden');
    T.treeEmpty?.classList.add('hidden');
    T.treeError?.classList.add('hidden');
  }
}

function treeToast(message, type = 'info') {
  const container = T.toastContainer || document.getElementById('toastContainer');
  if (!container) { console.warn('treeToast:', message); return; }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function treeFormatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return String(dateString); }
}

async function exportTreeData() {
  if (!treeState.treeData) { treeToast('No data to export', 'warning'); return; }

  const flatten = (node, level = 1, acc = []) => {
    if (!node) return acc;
    acc.push({
      level,
      userId       : node.userId,
      name         : node.name,
      directRefs   : node.referralCount || 0,
      levelCapacity: LEVEL_CAP[level] || 0
    });
    (node.children || []).forEach(c => flatten(c, level + 1, acc));
    return acc;
  };

  const rows = flatten(treeState.treeData);
  const csv  = [
    ['Level', 'User ID', 'Name', 'Direct Referrals', 'Level Capacity'],
    ...rows.map(r => [r.level, r.userId, `"${r.name}"`, r.directRefs, r.levelCapacity])
  ].map(r => r.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `shs-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  treeToast('Exported!', 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC CSS — injected once so no external stylesheet is needed
// ─────────────────────────────────────────────────────────────────────────────
function injectTreeStyles() {
  if (document.getElementById('matrix-tree-styles')) return; // already injected
  const style = document.createElement('style');
  style.id = 'matrix-tree-styles';
  style.textContent = `
    /* ── Scrollable container ── */
    #treeRoot {
      overflow-x: auto;
      overflow-y: auto;
      padding: 24px 16px 40px;
      min-height: 200px;
    }

    /* ── Top-level pyramid wrapper ── */
    .matrix-node-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* ── Card row (centres the single card) ── */
    .matrix-card-row {
      display: flex;
      justify-content: center;
    }

    /* ── Member card ── */
    .matrix-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: #fff;
      border: 2px solid var(--card-color, #6366f1);
      border-radius: 12px;
      padding: 10px 8px 8px;
      width: 100px;
      cursor: pointer;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform .15s, box-shadow .15s;
      flex-shrink: 0;
    }
    .matrix-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.14);
    }
    .matrix-card--root {
      width: 114px;
      border-width: 3px;
      background: linear-gradient(135deg, #f0f4ff 0%, #fff 100%);
      box-shadow: 0 4px 16px rgba(99,102,241,0.18);
    }
    .matrix-card--full {
      background: linear-gradient(135deg, #ecfdf5 0%, #fff 100%);
    }

    /* ── Level badge ── */
    .matrix-badge {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      padding: 1px 8px;
      border-radius: 999px;
      white-space: nowrap;
      letter-spacing: .5px;
    }

    /* ── Avatar circle ── */
    .matrix-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .matrix-avatar--empty {
      background: transparent !important;
    }

    /* ── Card text ── */
    .matrix-name {
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
      text-align: center;
      max-width: 92px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .matrix-uid {
      font-size: 9px;
      color: #9ca3af;
      font-family: monospace;
      text-align: center;
    }
    .matrix-ref-pill {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }

    /* ── Empty slot ── */
    .matrix-empty-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: #fafafa;
      border: 2px dashed var(--card-color, #d1d5db);
      border-radius: 12px;
      padding: 10px 8px 8px;
      width: 100px;
      cursor: pointer;
      transition: background .15s;
      flex-shrink: 0;
      margin-top: 12px; /* space below tick */
    }
    .matrix-empty-slot:hover { background: #f0f4ff; }

    /* ── Connectors ── */
    .matrix-connector-v {
      width: 2px;
      height: 20px;
      background: #d1d5db;
      flex-shrink: 0;
    }
    .matrix-connector-h {
      height: 2px;
      background: #d1d5db;
      align-self: stretch;    /* fills .matrix-children-row width */
      max-width: calc(100% - 100px); /* doesn't extend past outermost slots */
      margin: 0 50px;         /* half a card width in from each side */
      flex-shrink: 0;
    }
    .matrix-connector-tick {
      width: 2px;
      height: 14px;
      background: #d1d5db;
      margin: 0 auto;
      flex-shrink: 0;
    }
    .matrix-connector-collapsed { display: none !important; }

    /* ── Children row ── */
    .matrix-children-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 12px;
      flex-wrap: nowrap;
    }
    .matrix-children-collapsed { display: none !important; }

    /* ── Slot wrapper (tick + child pyramid) ── */
    .matrix-slot-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Collapse/expand toggle ── */
    .matrix-toggle {
      background: #6366f1;
      color: #fff;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      box-shadow: 0 2px 6px rgba(99,102,241,0.35);
      z-index: 1;
      flex-shrink: 0;
      margin: 2px 0;
    }
    .matrix-toggle:hover { background: #4f46e5; }

    /* ── Overflow row toggle button ── */
    .matrix-overflow-toggle {
      background: #fff7ed;
      color: #c2410c;
      border: 1.5px dashed #fb923c;
      border-radius: 8px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      margin: 6px auto 2px;
      display: flex;
      align-items: center;
      gap: 6px;
      align-self: center;
    }
    .matrix-overflow-toggle:hover { background: #ffedd5; }

    /* ── Overflow row (same layout as normal children row) ── */
    .matrix-overflow-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
      padding: 8px;
      background: #fff7ed;
      border-radius: 10px;
      border: 1.5px dashed #fb923c;
    }

    /* ── Depth > 2: shrink cards to keep layout manageable ── */
    [data-depth="3"] .matrix-card,
    [data-depth="3"] .matrix-empty-slot { width: 84px; }
    [data-depth="4"] .matrix-card,
    [data-depth="4"] .matrix-empty-slot { width: 72px; }
    [data-depth="5"] .matrix-card,
    [data-depth="5"] .matrix-empty-slot { width: 64px; }
    [data-depth="6"] .matrix-card,
    [data-depth="6"] .matrix-empty-slot { width: 58px; }
    [data-depth="7"] .matrix-card,
    [data-depth="7"] .matrix-empty-slot { width: 54px; }
    [data-depth="3"] .matrix-avatar,
    [data-depth="4"] .matrix-avatar,
    [data-depth="5"] .matrix-avatar { width: 30px; height: 30px; font-size: 11px; }
    [data-depth="6"] .matrix-avatar,
    [data-depth="7"] .matrix-avatar { width: 24px; height: 24px; font-size: 9px; }
    [data-depth="4"] .matrix-name,
    [data-depth="5"] .matrix-name,
    [data-depth="6"] .matrix-name,
    [data-depth="7"] .matrix-name { font-size: 9px; }
    [data-depth="4"] .matrix-uid,
    [data-depth="5"] .matrix-uid,
    [data-depth="6"] .matrix-uid,
    [data-depth="7"] .matrix-uid  { display: none; }
    [data-depth="5"] .matrix-ref-pill,
    [data-depth="6"] .matrix-ref-pill,
    [data-depth="7"] .matrix-ref-pill { font-size: 8px; padding: 1px 5px; }
    [data-depth="3"] .matrix-children-row { gap: 8px; }
    [data-depth="4"] .matrix-children-row { gap: 4px; }
    [data-depth="5"] .matrix-children-row,
    [data-depth="6"] .matrix-children-row,
    [data-depth="7"] .matrix-children-row { gap: 2px; }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT  (called by dashboard.js showMatrixTree())
// ─────────────────────────────────────────────────────────────────────────────
function initTree() {
  // Refresh DOM refs every call (safe & cheap)
  T = {
    searchForm       : document.getElementById('treeSearchForm'),
    searchInput      : document.getElementById('treeSearchInput'),
    searchType       : document.getElementById('treeSearchType'),
    treeSearchPanel  : document.getElementById('treeSearchPanel'),
    treeDashPanel    : document.getElementById('treeDashPanel'),
    viewingUser      : document.getElementById('viewingUser'),
    viewingLevel     : document.getElementById('viewingLevel'),
    newSearch        : document.getElementById('newSearch'),
    totalDownline    : document.getElementById('totalDownline'),
    activeLevels     : document.getElementById('activeLevels'),
    directReferrals  : document.getElementById('directReferrals'),
    matrixFill       : document.getElementById('matrixFill'),
    levelBars        : document.getElementById('levelBars'),
    depthSelector    : document.getElementById('depthSelector'),
    refreshTree      : document.getElementById('refreshTree'),
    expandAll        : document.getElementById('expandAll'),
    collapseAll      : document.getElementById('collapseAll'),
    exportTree       : document.getElementById('exportTree'),
    printTree        : document.getElementById('printTree'),
    treeRoot         : document.getElementById('treeRoot'),
    treeLoader       : document.getElementById('treeLoader'),
    treeEmpty        : document.getElementById('treeEmpty'),
    treeError        : document.getElementById('treeError'),
    errorMessage     : document.getElementById('errorMessage'),
    memberModal      : document.getElementById('memberModal'),
    modalClose       : document.getElementById('modalClose'),
    modalTitle       : document.getElementById('modalTitle'),
    modalLevel       : document.getElementById('modalLevel'),
    modalBody        : document.getElementById('modalBody'),
    modalCopyReferral: document.getElementById('modalCopyReferral'),
    modalViewDownline: document.getElementById('modalViewDownline'),
    toastContainer   : document.getElementById('toastContainer')
  };

  // Register event listeners exactly once
  if (!_treeInitialized) {
    initTreeSearch();
    initTreeControls();
    _treeInitialized = true;
  }

  // Auto-load from session cache on first visit
  if (!treeState.currentUser) {
    try {
      const cached = JSON.parse(sessionStorage.getItem('userData') || 'null');
      if (cached?.userId) {
        // Re-fetch fresh user data from API so root card always shows accurate info
        treeShowLoader(true);
        treeApiCall('getUserDataByUserId', { userId: cached.userId })
          .then(res => {
            treeState.currentUser = res.user || cached;
            return loadTreeData();
          })
          .then(() => treeShowDashboard())
          .catch(() => {
            // Fallback: use cached data if API fails
            treeState.currentUser = cached;
            loadTreeData().then(() => treeShowDashboard()).catch(() => {});
          });
      }
    } catch (e) { /* no cache — show search panel */ }
  } else if (treeState.treeData) {
    treeShowDashboard();
    renderTreeView();
  }

  console.log('🌳 Matrix Tree (5×7) initialized');
}

console.log('✅ tree.js loaded');