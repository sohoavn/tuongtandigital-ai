/**
 * login-fix.js — TuongTanDigital-AI v3.0
 * Patch: Sửa tất cả lỗi liên quan đến luồng đăng nhập Google OAuth
 * Cách dùng: Thêm <script src="login-fix.js"></script> vào CUỐI thẻ <body>
 *            trong index.html, SAU dòng <script src="app.js"></script>
 *
 * KHÔNG xóa code cũ — file này chỉ ghi đè / bổ sung các hàm bị lỗi.
 */

(function () {
  'use strict';

  // ================================================================
  // FIX 1: Chuẩn hóa tên ID — splashScreen đóng vai trò loginScreen
  // ================================================================

  /**
   * Ghi đè hàm showLoginScreen() gốc trong app.js.
   * HTML dùng id="splashScreen", không phải "loginScreen".
   */
  window.showLoginScreen = function () {
    const splash = document.getElementById('splashScreen');
    const appWrapper = document.getElementById('appWrapper');
    if (splash) {
      splash.style.display = 'flex'; // Hiện splash/auth screen
      splash.classList.add('visible');
    }
    if (appWrapper) appWrapper.style.display = 'none'; // Ẩn app chính
  };

  /**
   * Ghi đè hàm hideLoginScreen() gốc trong app.js.
   */
  window.hideLoginScreen = function () {
    const splash = document.getElementById('splashScreen');
    const appWrapper = document.getElementById('appWrapper');
    if (splash) {
      splash.classList.remove('visible');
      // Ẩn hoàn toàn sau animation
      setTimeout(() => {
        splash.style.display = 'none';
      }, 400);
    }
    // FIX 4: Hiện appWrapper sau đăng nhập thành công
    if (appWrapper) {
      appWrapper.style.display = 'block';
      // Kích hoạt animation hiện app
      requestAnimationFrame(() => {
        appWrapper.style.opacity = '0';
        appWrapper.style.transition = 'opacity 0.4s ease';
        requestAnimationFrame(() => {
          appWrapper.style.opacity = '1';
        });
      });
    }
  };

  // ================================================================
  // FIX 2 & 3: Gắn event listener cho nút Google Sign-In fallback
  //            và xử lý timing của Google GSI SDK
  // ================================================================

  /**
   * Hàm khởi tạo Google Auth an toàn — retry nếu SDK chưa load xong.
   */
  function safeInitGoogleAuth(retryCount) {
    retryCount = retryCount || 0;

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      // SDK đã sẵn sàng
      try {
        google.accounts.id.initialize({
          // Lấy CLIENT_ID từ GOOGLE_CONFIG nếu có, fallback về placeholder
          client_id: (typeof GOOGLE_CONFIG !== 'undefined' && GOOGLE_CONFIG.CLIENT_ID)
            ? GOOGLE_CONFIG.CLIENT_ID
            : 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          callback: handleGoogleSignInResponse,
          auto_select: true,
          cancel_on_tap_outside: false
        });

        // Render nút Google chính thức vào container
        const signInContainer = document.getElementById('googleSignInBtn');
        if (signInContainer) {
          google.accounts.id.renderButton(signInContainer, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            text: 'signin_with',
            locale: 'vi',
            width: 300
          });
        }

        // Thử đăng nhập im lặng (nếu có session cũ)
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Không auto sign-in được — hiện màn hình đăng nhập thủ công
            showLoginScreen();
          }
        });

        console.log('[login-fix] Google Auth initialized successfully.');
      } catch (err) {
        console.error('[login-fix] Google Auth init error:', err);
        showLoginScreen();
      }
    } else if (retryCount < 20) {
      // SDK chưa load — thử lại sau 300ms, tối đa 20 lần (6 giây)
      console.log('[login-fix] Waiting for Google SDK... attempt', retryCount + 1);
      setTimeout(() => safeInitGoogleAuth(retryCount + 1), 300);
    } else {
      // SDK không load được sau 6 giây — hiện màn hình thủ công
      console.warn('[login-fix] Google SDK failed to load. Showing manual login screen.');
      showLoginScreen();
    }
  }

  // ================================================================
  // FIX 5: Gắn event listener cho nút Guest Sign-In
  // ================================================================

  /**
   * Xử lý đăng nhập dùng thử (không cần Google account).
   */
  function handleGuestSignIn() {
    // Tạo user giả cho chế độ guest
    if (typeof STATE !== 'undefined') {
      STATE.googleUser = {
        id: 'guest_' + Date.now(),
        name: 'Khách',
        email: 'guest@tuongtandigital.com',
        avatar: '',
        token: 'guest_token',
        isGuest: true
      };
      STATE.isLoggedIn = true;
    }

    // Lưu session guest vào localStorage
    localStorage.setItem('ttd_google_user', JSON.stringify({
      id: 'guest_' + Date.now(),
      name: 'Khách',
      email: 'guest@tuongtandigital.com',
      avatar: '',
      token: 'guest_token',
      isGuest: true
    }));

    // Ẩn màn hình đăng nhập, hiện app
    hideLoginScreen();

    // Cập nhật UI nếu hàm tồn tại
    if (typeof updateUserUI === 'function') updateUserUI();

    // Thông báo chào mừng
    if (typeof showToast === 'function') {
      showToast('👋 Xin chào! Bạn đang dùng chế độ khách (không lưu dữ liệu lâu dài).', 'info', 5000);
    }

    console.log('[login-fix] Guest sign-in successful.');
  }

  // ================================================================
  // PATCH initApp: Override để chắc chắn Google Auth được gọi đúng
  // ================================================================

  /**
   * Ghi đè initGoogleAuth() gốc bằng phiên bản an toàn hơn.
   */
  window.initGoogleAuth = function () {
    safeInitGoogleAuth(0);
  };

  // ================================================================
  // DOM READY: Gắn tất cả event listeners sau khi DOM load xong
  // ================================================================

  function attachLoginFixListeners() {

    // --- Nút Google Sign-In fallback (id="btnGoogleSignin") ---
    const btnGoogle = document.getElementById('btnGoogleSignin');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', function () {
        // Nếu Google SDK đã load, dùng SDK để trigger popup
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          google.accounts.id.prompt();
        } else {
          // Fallback: Redirect OAuth thủ công
          const clientId = (typeof GOOGLE_CONFIG !== 'undefined' && GOOGLE_CONFIG.CLIENT_ID)
            ? GOOGLE_CONFIG.CLIENT_ID
            : 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

          if (clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            alert(
              '⚠️ Chưa cấu hình Google OAuth Client ID!\n\n' +
              'Vui lòng:\n' +
              '1. Vào Google Cloud Console\n' +
              '2. Tạo OAuth 2.0 Client ID\n' +
              '3. Thay "YOUR_GOOGLE_CLIENT_ID..." trong app.js\n\n' +
              'Hoặc bấm "Dùng thử không cần đăng nhập" để tiếp tục.'
            );
            return;
          }

          const redirectUri = encodeURIComponent(window.location.origin);
          const scope = encodeURIComponent('openid email profile');
          const oauthUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${clientId}` +
            `&redirect_uri=${redirectUri}` +
            `&response_type=token` +
            `&scope=${scope}` +
            `&prompt=select_account`;
          window.open(oauthUrl, '_blank', 'width=500,height=600');
        }
      });
      console.log('[login-fix] btnGoogleSignin listener attached.');
    }

    // --- Nút Guest Sign-In (id="btnGuestSignin") ---
    const btnGuest = document.getElementById('btnGuestSignin');
    if (btnGuest) {
      btnGuest.addEventListener('click', handleGuestSignIn);
      console.log('[login-fix] btnGuestSignin listener attached.');
    }

    // --- Đảm bảo nút Sign-Out hoạt động ---
    const btnSignOut = document.getElementById('signOutBtn');
    if (btnSignOut && typeof signOut === 'function') {
      // Không cần gắn lại nếu đã có — chỉ thêm nếu chưa có
      btnSignOut.addEventListener('click', signOut);
    }

    // --- Xử lý Sign-Out từ dropdown user menu ---
    document.querySelectorAll('[data-action="sign-out"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof signOut === 'function') signOut();
      });
    });

    // --- Đảm bảo splash screen hiển thị đúng khi chưa đăng nhập ---
    // Kiểm tra session sau khi app.js đã chạy xong
    setTimeout(() => {
      const hasValidSession = (typeof restoreGoogleSession === 'function')
        ? restoreGoogleSession()
        : !!localStorage.getItem('ttd_google_user');

      const appWrapper = document.getElementById('appWrapper');
      const splash = document.getElementById('splashScreen');

      if (!hasValidSession) {
        // Chưa đăng nhập: hiện splash, ẩn app
        if (splash) {
          splash.style.display = 'flex';
          splash.classList.add('visible');
        }
        if (appWrapper) appWrapper.style.display = 'none';

        // Khởi tạo Google Auth
        safeInitGoogleAuth(0);
      } else {
        // Đã có session: ẩn splash, hiện app
        if (splash) {
          splash.style.display = 'none';
          splash.classList.remove('visible');
        }
        if (appWrapper) appWrapper.style.display = 'block';
      }
    }, 500); // Chờ 500ms để initApp() trong app.js chạy trước
  }

  // ================================================================
  // Khởi chạy khi DOM sẵn sàng
  // ================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachLoginFixListeners);
  } else {
    attachLoginFixListeners();
  }

  // Đặt callback toàn cục cho Google SDK (FIX 3)
  // Được gọi bởi Google GSI script khi load xong
  window.onGoogleLibraryLoad = function () {
    console.log('[login-fix] Google Library loaded via onGoogleLibraryLoad callback.');
    safeInitGoogleAuth(0);
  };

  console.log('[login-fix] Login fix patch loaded successfully.');

})();