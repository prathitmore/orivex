
import { DataService } from '../services/data.js';

export function CreateUserPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    container.innerHTML = `
        <div class="flex items-center" style="margin-bottom: var(--spacing-lg);">
            <button onclick="window.history.back()" style="background:none; color: var(--color-text-primary); font-size: 1.5rem; margin-right: var(--spacing-md);">←</button>
            <h2 style="margin: 0;">Add New User</h2>
        </div>
        
        <form id="create-user-form" class="flex flex-col" style="gap: var(--spacing-lg);">
            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Full Name</label>
                <input type="text" name="name" class="input" placeholder="e.g. Dr. Alex Smith" required>
            </div>

            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Email Address</label>
                <input type="email" name="contact" class="input" placeholder="e.g. alex@boltix.com" required>
            </div>

            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Password</label>
                <input type="password" name="password" class="input" placeholder="Min. 6 characters" required>
            </div>

            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Roles</label>
                <div class="flex" style="gap: var(--spacing-md); flex-wrap: wrap;">
                    <label class="flex items-center" style="gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="role_astronomer" id="role-astro" checked> Astronomer
                    </label>
                    <label class="flex items-center" style="gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="role_manager" id="role-manager"> Manager
                    </label>
                    <label class="flex items-center" style="gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="role_stargazer" id="role-star"> Stargazer
                    </label>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" style="margin-top: var(--spacing-md);">Create User</button>
        </form>
    `;

    // Role Exclusivity Logic
    const astroCheck = container.querySelector('#role-astro');
    const starCheck = container.querySelector('#role-star');

    const updateRoles = (source) => {
        if (source === 'astro') {
            if (astroCheck.checked) {
                starCheck.checked = false;
                starCheck.disabled = true;
                starCheck.parentElement.style.opacity = '0.5';
            } else {
                starCheck.disabled = false;
                starCheck.parentElement.style.opacity = '1';
            }
        } else if (source === 'star') {
            if (starCheck.checked) {
                astroCheck.checked = false;
                astroCheck.disabled = true;
                astroCheck.parentElement.style.opacity = '0.5';
            } else {
                astroCheck.disabled = false;
                astroCheck.parentElement.style.opacity = '1';
            }
        }
    };

    astroCheck.onchange = () => updateRoles('astro');
    starCheck.onchange = () => updateRoles('star');

    // Initial State (Astro checked by default)
    updateRoles('astro');

    container.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const roles = [];
        if (formData.get('role_astronomer')) roles.push('astronomer');
        if (formData.get('role_manager')) roles.push('manager');
        if (formData.get('role_stargazer')) roles.push('stargazer');

        if (roles.length === 0) {
            alert('Please select at least one role.');
            return;
        }

        const userData = {
            name: formData.get('name'),
            contact: formData.get('contact'), // Treating contact as username
            password: formData.get('password'),
            base_location: '',
            roles: roles
        };

        try {
            await DataService.createUser(userData);
            alert('User created successfully!');
            window.history.back();
        } catch (err) {
            alert('Failed to create user.');
        }
    };

    return container;
}
