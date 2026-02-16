
import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';

export function LoginPage() {
    const container = document.createElement('div');
    container.className = 'login-page flex flex-col items-center justify-center min-h-screen';
    container.style.padding = 'var(--spacing-lg)';

    const card = document.createElement('div');
    card.className = 'card fade-in';
    card.style.maxWidth = '400px';
    card.style.width = '100%';
    card.style.textAlign = 'center';

    card.innerHTML = `



        <img src="assets/orivex_logo.png" alt="Orivex" style="width: 80%; max-width: 350px; height: auto; margin-bottom: var(--spacing-sm);">



        <p style="margin-bottom: var(--spacing-xl);">Workforce Coordination</p>
        
        <form id="login-form">
            <input type="text" id="username-input" class="input" placeholder="Email or Username" style="margin-bottom: var(--spacing-md);" required>
            <input type="password" id="password-input" class="input" placeholder="Password" style="margin-bottom: var(--spacing-lg);" required>
            <div style="text-align: right; margin-bottom: 20px;">
                <a href="#" id="forgot-password-link" style="color: var(--color-accent); font-size: 0.85rem; text-decoration: none;">Forgot Password?</a>
            </div>
            <button type="submit" id="login-btn" class="btn btn-primary w-full">Sign In</button>
        </form>
        
        <div id="error-msg" style="color: var(--color-status-danger); margin-top: var(--spacing-md); font-size: 0.9rem; min-height: 20px;"></div>
    `;

    container.appendChild(card);

    // --- Forgot Password Modal ---
    const forgotModal = document.createElement('div');
    forgotModal.style.cssText = `display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); align-items:center; justify-content:center; padding:16px; z-index:100;`;
    forgotModal.innerHTML = `
        <div class="card fade-in" style="width:100%; max-width:400px; position:relative;">
            <button id="close-forgot" style="position:absolute; top:16px; right:16px; background:none; border:none; color:var(--color-text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:16px;">Reset Password</h3>
            
            <div id="step-1">
                <p style="margin-bottom:12px; color:var(--color-text-secondary); font-size:0.9rem;">Enter your email to receive a One-Time Password (OTP).</p>
                <input type="email" id="reset-email" class="input w-full" placeholder="Enter your email" style="margin-bottom:16px;">
                <button id="send-otp-btn" class="btn btn-primary w-full">Send OTP</button>
            </div>

            <div id="step-2" style="display:none;">
                <p style="margin-bottom:12px; color:var(--color-text-secondary); font-size:0.9rem;">Enter OTP sent to your email.</p>
                <input type="text" id="reset-otp" class="input w-full" placeholder="6-digit OTP" style="margin-bottom:12px;">
                <input type="password" id="new-password" class="input w-full" placeholder="New Password" style="margin-bottom:16px;">
                <button id="reset-confirm-btn" class="btn btn-primary w-full">Update Password</button>
            </div>
            
            <div id="reset-msg" style="margin-top:12px; font-size:0.9rem;"></div>
        </div>
    `;
    container.appendChild(forgotModal);

    const loginForm = card.querySelector('#login-form');
    const usernameInput = card.querySelector('#username-input');
    const passwordInput = card.querySelector('#password-input');
    const loginBtn = card.querySelector('#login-btn');
    const errorMsg = card.querySelector('#error-msg');
    const forgotLink = card.querySelector('#forgot-password-link');

    // Forgot Password Logic
    const closeForgot = forgotModal.querySelector('#close-forgot');
    const step1 = forgotModal.querySelector('#step-1');
    const step2 = forgotModal.querySelector('#step-2');
    const resetEmailInput = forgotModal.querySelector('#reset-email');
    const sendOtpBtn = forgotModal.querySelector('#send-otp-btn');
    const resetOtpInput = forgotModal.querySelector('#reset-otp');
    const newPassInput = forgotModal.querySelector('#new-password');
    const confirmResetBtn = forgotModal.querySelector('#reset-confirm-btn');
    const resetMsg = forgotModal.querySelector('#reset-msg');

    forgotLink.onclick = (e) => {
        e.preventDefault();
        forgotModal.style.display = 'flex';
        step1.style.display = 'block';
        step2.style.display = 'none';
        resetMsg.innerText = '';
        resetEmailInput.value = '';
    };

    closeForgot.onclick = () => forgotModal.style.display = 'none';
    forgotModal.onclick = (e) => { if (e.target === forgotModal) forgotModal.style.display = 'none'; };

    sendOtpBtn.onclick = async () => {
        const email = resetEmailInput.value.trim();
        if (!email) return alert('Please enter email');

        sendOtpBtn.disabled = true;
        sendOtpBtn.innerText = 'Sending...';
        resetMsg.innerText = '';
        resetMsg.style.color = 'var(--color-text-secondary)';

        try {
            const res = await DataService.resetPasswordRequest(email);
            if (res.success) {
                step1.style.display = 'none';
                step2.style.display = 'block';
                resetMsg.innerText = 'OTP sent! Please check your email.';
                resetMsg.style.color = 'var(--color-status-success)';
            } else {
                resetMsg.innerText = res.message || 'Failed to send OTP';
                resetMsg.style.color = 'var(--color-status-danger)';
            }
        } catch (e) {
            resetMsg.innerText = 'Error sending OTP';
            resetMsg.style.color = 'var(--color-status-danger)';
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerText = 'Send OTP';
        }
    };

    confirmResetBtn.onclick = async () => {
        const email = resetEmailInput.value.trim();
        const otp = resetOtpInput.value.trim();
        const newPass = newPassInput.value.trim();

        if (!otp || !newPass) return alert('Please fill all fields');

        confirmResetBtn.disabled = true;
        confirmResetBtn.innerText = 'Updating...';

        try {
            const res = await DataService.resetPasswordConfirm(email, otp, newPass);
            if (res.success) {
                alert('Password updated successfully! Please login with your new password.');
                forgotModal.style.display = 'none';
            } else {
                resetMsg.innerText = res.message || 'Failed to reset password';
                resetMsg.style.color = 'var(--color-status-danger)';
            }
        } catch (e) {
            resetMsg.innerText = 'Error updating password';
            resetMsg.style.color = 'var(--color-status-danger)';
        } finally {
            confirmResetBtn.disabled = false;
            confirmResetBtn.innerText = 'Update Password';
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            errorMsg.textContent = 'Please enter email and password.';
            return;
        }

        try {
            loginBtn.textContent = 'Signing in...';
            loginBtn.disabled = true;

            const result = await AuthService.login(username, password);

            if (result.success) {
                if (result.user.roles.length > 1) {
                    window.location.hash = '#/role-select';
                } else {
                    window.location.hash = '#/dashboard';
                }
            } else {
                errorMsg.textContent = result.message || 'Invalid Credentials';
                loginBtn.textContent = 'Sign In';
                loginBtn.disabled = false;
            }
        } catch (err) {
            errorMsg.textContent = 'Login failed. Please try again.';
            loginBtn.textContent = 'Sign In';
            loginBtn.disabled = false;
        }
    });

    return container;
}
