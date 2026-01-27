import { supabase } from './lib/supabase';

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loader = document.getElementById('loader');
const authError = document.getElementById('auth-error');

// Redirect if already logged in
async function checkCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        if (window.location.pathname.endsWith('login.html')) {
            window.location.href = 'index.html';
        }
    }
}

checkCurrentSession();

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // UI Feedback
        loginBtn.disabled = true;
        loader.style.display = 'inline-block';
        authError.style.display = 'none';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Login error:', error.message);
            authError.textContent = error.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : 'Erro ao tentar logar. Tente novamente.';
            authError.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loader.style.display = 'none';
        }
    });
}

// Function to sign out
export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    window.location.href = 'login.html';
}

// Get current user session
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Update user password
export async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    return { data, error };
}
