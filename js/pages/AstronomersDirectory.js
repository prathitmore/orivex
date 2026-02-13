
import { DataService } from '../services/data.js';
import { AuthService } from '../services/auth.js';

export async function AstronomersDirectoryPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    const currentUser = AuthService.getCurrentUser();
    const isManager = currentUser.currentRole === 'manager';

    container.innerHTML = `
        <h2 style="margin-bottom: var(--spacing-lg);">Team Directory</h2>
        <div class="grid" id="astro-grid" style="gap: var(--spacing-md);"></div>
    `;

    try {
        const users = await DataService.getUsers();
        const grid = container.querySelector('#astro-grid');

        if (users.length === 0) {
            grid.innerHTML = '<p>No users found.</p>';
        } else {
            users.forEach(user => {
                const canDelete = isManager && user.id !== currentUser.id;
                const canEditRole = isManager; // Manager can edit anyone's role

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="display: flex; items-center; margin-bottom: var(--spacing-sm); gap: 12px;">
                            <div style="width: 48px; height: 48px; background: var(--color-bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                ${user.name.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: 600;">${user.name}</div>
                                <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${user.base_location}</div>
                            </div>
                        </div>
                        ${canDelete ? `<button class="btn-delete" data-id="${user.id}" style="background: none; border: none; color: var(--color-status-danger); cursor: pointer; font-size: 1.2rem;">&times;</button>` : ''}
                    </div>
                    
                    <div class="roles-container" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                         ${user.roles.map(r => `
                            <span style="font-size: 0.75rem; background: rgba(255, 255, 255, 0.1); color: var(--color-text-secondary); padding: 2px 8px; border-radius: 12px; text-transform: capitalize;">${r}</span>
                         `).join('')}
                         ${canEditRole ? `<button class="btn-edit-role" data-id="${user.id}" style="font-size:0.75rem; background:none; border:1px solid var(--color-accent); color:var(--color-accent); border-radius:12px; padding: 0 8px;">+</button>` : ''}
                    </div>
                `;
                grid.appendChild(card);
            });

            // Handlers
            if (isManager) {
                // Delete
                grid.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.onclick = async () => {
                        const uid = btn.dataset.id;
                        if (confirm('Are you sure you want to remove this user?')) {
                            try {
                                await DataService.deleteUser(uid);
                                alert('User removed.');
                                window.location.reload();
                            } catch (e) { alert('Failed to delete user.'); }
                        }
                    };
                });

                // Edit Role
                grid.querySelectorAll('.btn-edit-role').forEach(btn => {
                    btn.onclick = () => {
                        const uid = btn.dataset.id;
                        const user = users.find(u => u.id === uid);
                        showRoleEditor(user);
                    };
                });
            }
        }
    } catch (e) {
        container.innerHTML += '<p>Error loading users.</p>';
    }

    return container;
}

function showRoleEditor(user) {
    // Simple Prompt for now or Modal
    // Let's use a quick modal
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = '400';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.width = '300px';

    const isAstro = user.roles.includes('astronomer');
    const isManager = user.roles.includes('manager');
    const isStargazer = user.roles.includes('stargazer');

    card.innerHTML = `
        <h3>Edit Roles: ${user.name}</h3>
        <div class="flex flex-col" style="gap: 8px; margin: 16px 0;">
            <label><input type="checkbox" id="role-a" ${isAstro ? 'checked' : ''}> Astronomer</label>
            <label><input type="checkbox" id="role-m" ${isManager ? 'checked' : ''}> Manager</label>
            <label><input type="checkbox" id="role-s" ${isStargazer ? 'checked' : ''}> Stargazer</label>
        </div>
        <button id="save-roles" class="btn btn-primary w-full">Save</button>
        <button id="cancel-roles" class="btn btn-secondary w-full" style="margin-top:8px">Cancel</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Enforce Exclusivity
    const astroCheck = card.querySelector('#role-a');
    const starCheck = card.querySelector('#role-s');

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

    // Init
    if (isAstro) updateRoles('astro');
    else if (isStargazer) updateRoles('star');

    card.querySelector('#cancel-roles').onclick = () => overlay.remove();
    card.querySelector('#save-roles').onclick = async () => {
        const newRoles = [];
        if (card.querySelector('#role-a').checked) newRoles.push('astronomer');
        if (card.querySelector('#role-m').checked) newRoles.push('manager');
        if (card.querySelector('#role-s').checked) newRoles.push('stargazer');

        if (newRoles.length === 0) { alert('User must have at least one role'); return; }

        await DataService.updateUserRoles(user.id, newRoles);
        overlay.remove();
        window.location.reload();
    };
}
