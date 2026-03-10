/**
 * tab-fix.js — TuongTanDigital-AI v3.0
 * Sửa lỗi: Tab navigation không hoạt động + Login flow bị block
 *
 * Cách dùng: Thêm vào index.html SAU login-fix.js:
 *   <script src="tab-fix.js"></script>
 *
 * KHÔNG xóa code cũ — chỉ ghi đè các hàm bị lỗi.
 */

(function () {
  'use strict';

  // ================================================================
  // FIX CORE: Ghi đè hàm switchTab() để dùng đúng ID của HTML
  // ================================================================

  /**
   * Tab ID map: data-tab value → id của panel trong HTML
   * Khớp chính xác với index.html đã viết
   */
  const TAB_PANEL_MAP = {
    'notebook' : 'tabNotebook',
    'stt'      : 'tabStt',
    'tts'      : 'tabTts',
    'rec'      : 'tabRec',
    'cvt'      : 'tabCvt',
    'settings' : 'tabSettings'
  };

  /**
   * Ghi đè switchTab() gốc — tìm panel theo id thay vì data-tab-panel
   * @param {string} tabId — ví dụ: 'notebook', 'stt', 'tts', 'rec', 'cvt', 'settings'
   */
  window.switchTab = function (tabId) {
    // 1. Cập nhật trạng thái active trên nav buttons (desktop + mobile)
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
      btn.setAttribute('aria-selected', btn.dataset.tab === tabId ? 'true' : 'false');
    });

    // 2. Cập nhật bottom nav (mobile)
    document.querySelectorAll('[data-bottom-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bottomTab === tabId);
    });

    // 3. Ẩn tất cả tab panels (tìm theo class "tab-panel")
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    });

    // 4. Hiện panel tương ứng
    const panelId = TAB_PANEL_MAP[tabId];
    if (panelId) {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.style.display = 'block';
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
      }
    }

    // 5. Cập nhật STATE nếu có
    if (typeof STATE !== 'undefined') {
      STATE.activeTab = tabId;
    }

    // 6. Cập nhật hero section (tiêu đề thay đổi theo tab)
    updateHeroForTab(tabId);

    console.log('[tab-fix] Switched to tab:', tabId);
  };

  /**
   * Cập nhật nội dung hero section theo tab đang active
   * @param {string} tabId
   */
  function updateHeroForTab(tabId) {
    const heroConfig = {
      notebook : {
        badge : '📓 TuongTanDigital AI Suite',
        title : 'Notebook AI — Phân tích tài liệu thông minh',
        desc  : 'Upload tài liệu, đặt câu hỏi, nhận câu trả lời có trích dẫn nguồn. Hoàn toàn miễn phí.'
      },
      stt : {
        badge : '🎙️ Speech-to-Text',
        title : 'Phiên âm — Chuyển đổi giọng nói thành văn bản',
        desc  : 'Upload file audio/video, AI tự động phiên âm chính xác bằng Gemini. Hỗ trợ tiếng Việt.'
      },
      tts : {
        badge : '🔊 Text-to-Speech',
        title : 'Đọc TTS — Nghe tài liệu bằng giọng AI',
        desc  : 'Nhập văn bản và nghe với 30+ giọng đọc tự nhiên. Browser TTS miễn phí, Gemini TTS (Pro).'
      },
      rec : {
        badge : '⏺️ Ghi hình & Biên bản',
        title : 'Ghi hình — Tạo biên bản cuộc họp tự động',
        desc  : 'Ghi màn hình cuộc họp Zoom/Teams, AI tự động tạo biên bản với action items.'
      },
      cvt : {
        badge : '🔄 Convert',
        title : 'Chuyển đổi — Xử lý tài liệu đa dạng',
        desc  : 'Chuyển đổi PDF, ảnh, audio thành text, Markdown, JSON với AI. Hỗ trợ batch mode.'
      },
      settings : {
        badge : '⚙️ Cài đặt',
        title : 'Cài đặt — Tùy chỉnh TuongTanDigital AI',
        desc  : 'Quản lý API Keys, License, giao diện, font chữ và các tùy chọn nâng cao.'
      }
    };

    const config = heroConfig[tabId];
    if (!config) return;

    const badgeEl = document.getElementById('heroBadge');
    const titleEl = document.getElementById('heroTitle');
    const descEl  = document.getElementById('heroDesc');

    if (badgeEl) badgeEl.textContent = config.badge;
    if (titleEl) titleEl.textContent = config.title;
    if (descEl)  descEl.textContent  = config.desc;
  }

  // ================================================================
  // FIX: Gắn lại toàn bộ event listeners cho tab navigation
  // ================================================================

  function attachTabListeners() {
    // Desktop nav tabs
    document.querySelectorAll('[data-tab]').forEach(btn => {
      // Xóa listener cũ bằng cách clone element
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const tabId = this.dataset.tab;
        if (tabId) window.switchTab(tabId);
      });
    });

    // Mobile bottom nav
    document.querySelectorAll('[data-bottom-tab]').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const tabId = this.dataset.bottomTab;
        if (tabId) window.switchTab(tabId);
      });
    });

    // Header actions dùng data-action="goto-tab"
    document.querySelectorAll('[data-action="goto-tab"]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const tabId = this.dataset.tab;
        if (tabId) window.switchTab(tabId);
      });
    });

    console.log('[tab-fix] Tab listeners attached.');
  }

  // ================================================================
  // FIX: Khởi tạo đúng trạng thái ban đầu của các tab panels
  // ================================================================

  function initTabPanels() {
    // Ẩn tất cả panels trước
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });

    // Hiện tab mặc định là 'notebook'
    const defaultTab = (typeof STATE !== 'undefined' && STATE.activeTab)
      ? STATE.activeTab
      : 'notebook';

    window.switchTab(defaultTab);
    console.log('[tab-fix] Tab panels initialized. Default tab:', defaultTab);
  }

  // ================================================================
  // FIX: Ngăn safeInitGoogleAuth bị gọi 2 lần (gây NotAllowedError)
  // ================================================================

  let _googleAuthInitialized = false;

  /**
   * Ghi đè để đảm bảo Google Auth chỉ được init 1 lần duy nhất
   */
  const _originalInitGoogleAuth = window.initGoogleAuth;
  window.initGoogleAuth = function () {
    if (_googleAuthInitialized) {
      console.log('[tab-fix] Google Auth đã được init rồi, bỏ qua lần gọi thứ 2.');
      return;
    }
    _googleAuthInitialized = true;
    if (typeof _originalInitGoogleAuth === 'function') {
      _originalInitGoogleAuth();
    }
  };

  // ================================================================
  // FIX: Đảm bảo appWrapper được hiện sau khi đăng nhập / guest mode
  // ================================================================

  /**
   * Hàm helper: Hiện app và ẩn splash — dùng được từ bất cứ đâu
   */
  window.showApp = function () {
    const splash     = document.getElementById('splashScreen');
    const appWrapper = document.getElementById('appWrapper');

    if (splash) {
      splash.classList.remove('visible');
      setTimeout(() => { splash.style.display = 'none'; }, 400);
    }

    if (appWrapper) {
      appWrapper.style.display = 'block';
      appWrapper.style.opacity = '0';
      appWrapper.style.transition = 'opacity 0.4s ease';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          appWrapper.style.opacity = '1';
        });
      });
    }

    // Khởi tạo tab panels sau khi app hiện
    setTimeout(initTabPanels, 100);
  };

  // ================================================================
  // FIX: Cập nhật handleGoogleSignInResponse để gọi showApp()
  // ================================================================

  const _originalHandleSignIn = window.handleGoogleSignInResponse;
  window.handleGoogleSignInResponse = function (response) {
    // Gọi hàm gốc trong app.js trước
    if (typeof _originalHandleSignIn === 'function') {
      _originalHandleSignIn(response);
    }
    // Sau đó chắc chắn hiện app
    setTimeout(() => window.showApp(), 100);
  };

  // ================================================================
  // FIX: Cập nhật guest sign-in để gọi showApp()
  // ================================================================

  // Chờ login-fix.js chạy trước (nó định nghĩa handleGuestSignIn)
  // rồi wrap lại
  setTimeout(() => {
    const btnGuest = document.getElementById('btnGuestSignin');
    if (btnGuest) {
      // Remove existing listeners
      const newBtn = btnGuest.cloneNode(true);
      btnGuest.parentNode.replaceChild(newBtn, btnGuest);

      newBtn.addEventListener('click', function () {
        // Tạo guest session
        const guestUser = {
          id    : 'guest_' + Date.now(),
          name  : 'Khách',
          email : 'guest@tuongtandigital.com',
          avatar: '',
          token : 'guest_token',
          isGuest: true
        };

        if (typeof STATE !== 'undefined') {
          STATE.googleUser  = guestUser;
          STATE.isLoggedIn  = true;
        }

        localStorage.setItem('ttd_google_user', JSON.stringify(guestUser));

        // Hiện app
        window.showApp();

        // Cập nhật UI
        if (typeof updateUserUI === 'function') updateUserUI();

        // Toast chào mừng
        if (typeof showToast === 'function') {
          setTimeout(() => {
            showToast('👋 Xin chào! Đang dùng chế độ khách.', 'info', 4000);
          }, 600);
        }

        console.log('[tab-fix] Guest login successful → app shown.');
      });

      console.log('[tab-fix] Guest button re-attached with showApp().');
    }
  }, 300);

  // ================================================================
  // FIX: Kiểm tra session đã đăng nhập → hiện app ngay
  // ================================================================

  function checkExistingSession() {
    try {
      const saved = localStorage.getItem('ttd_google_user');
      if (!saved) return false;
      const user = JSON.parse(saved);
      if (!user || !user.id) return false;

      // Kiểm tra token hết hạn (chỉ với Google token thật, bỏ qua guest)
      if (!user.isGuest && user.token && user.token !== 'guest_token') {
        try {
          const parts = user.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp && Date.now() / 1000 > payload.exp) {
              localStorage.removeItem('ttd_google_user');
              return false;
            }
          }
        } catch (e) {
          // Token parse fail → coi như hết hạn
          localStorage.removeItem('ttd_google_user');
          return false;
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // ================================================================
  // DOM READY: Chạy tất cả fixes sau khi DOM và app.js load xong
  // ================================================================

  function runAllFixes() {
    console.log('[tab-fix] Running all fixes...');

    // 1. Gắn lại tab listeners
    attachTabListeners();

    // 2. Kiểm tra session
    const hasSession = checkExistingSession();

    if (hasSession) {
      // Có session → hiện app ngay, không cần đợi Google Auth
      console.log('[tab-fix] Existing session found → showing app.');
      window.showApp();
    } else {
      // Chưa đăng nhập → đảm bảo splash hiển thị đúng
      const splash     = document.getElementById('splashScreen');
      const appWrapper = document.getElementById('appWrapper');

      if (splash) {
        splash.style.display = 'flex';
        splash.classList.add('visible');
      }
      if (appWrapper) {
        appWrapper.style.display = 'none';
      }

      console.log('[tab-fix] No session → showing splash screen.');
    }
  }

  // Chạy sau khi tất cả scripts khác (app.js, login-fix.js) đã load
  // Dùng setTimeout để chắc chắn initApp() đã chạy xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(runAllFixes, 800));
  } else {
    setTimeout(runAllFixes, 800);
  }

  console.log('[tab-fix] Tab fix patch loaded.');

})();