
import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';

export async function ProfilePage() {
    let user = AuthService.getCurrentUser();
    if (!user) return document.createComment('Redirecting...');

    try {
        const freshUser = await DataService.getUser(user.id);
        if (freshUser) {
            // Preserve currentRole if valid, or default to first new role
            freshUser.currentRole = user.currentRole;
            if (!freshUser.roles.includes(freshUser.currentRole)) {
                freshUser.currentRole = freshUser.roles[0];
            }

            sessionStorage.setItem('orivex_user', JSON.stringify(freshUser));
            user = freshUser;
        }
    } catch (e) {
        console.error("Failed to refresh profile:", e);
    }

    const container = document.createElement('div');
    container.className = 'fade-in';

    // Fetch stats
    let stats = { assigned_events: 0, pending_requests: 0 };
    if (user.roles.includes('astronomer') || user.roles.includes('stargazer')) {
        stats = await DataService.getUserStats(user.id);
    }

    container.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
            <h2 style="margin: 0;">My Profile</h2>
             <button id="edit-profile-btn" style="background:none; border:none; color: var(--color-accent); font-size: 0.9rem;">Edit</button>
        </div>
        
        <!-- Profile Card -->
        <div class="card" style="text-align: center; margin-bottom: var(--spacing-lg);">
            <div style="width: 80px; height: 80px; background: var(--color-bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto var(--spacing-md);">
                ${user.name.charAt(0)}
            </div>
            <h2 id="profile-name" style="margin-bottom: 4px;">${user.name}</h2>

            <div class="flex justify-center" style="gap: 8px; flex-wrap: wrap;">
                ${user.roles.map(r => `<span style="background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; text-transform: uppercase;">${r}</span>`).join('')}
            </div>
            ${user.payment_info ? `<div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 12px; background: rgba(255,255,255,0.05); display: inline-block; padding: 4px 12px; border-radius: 12px;">💳 ${user.payment_info}</div>` : ''}
        </div>

        <!-- Edit Form (Hidden by default) -->
        <div id="edit-form" class="card" style="display: none; margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md); font-size: 1rem;">Edit Details</h3>
            <div class="flex flex-col" style="gap: var(--spacing-md);">
                <div>
                    <label style="font-size: 0.8rem; color: var(--color-text-secondary);">Full Name</label>
                    <input class="input" id="edit-name" value="${user.name}">
                </div>

                <div>
                    <label style="font-size: 0.8rem; color: var(--color-text-secondary);">Payment Link / UPI ID</label>
                    <input class="input" id="edit-payment" value="${user.payment_info || ''}" placeholder="e.g. user@upi or https://gpay...">
                </div>

                 <div>
                    <label style="font-size: 0.8rem; color: var(--color-text-secondary);">New Password (leave blank to keep current)</label>
                    <input class="input" id="edit-pass" type="password" placeholder="******">
                </div>
                <div class="flex gap-2">
                    <button id="save-profile" class="btn btn-primary w-full">Save</button>
                    <button id="cancel-edit" class="btn btn-secondary w-full">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Stats Section (for Astronomers/Stargazers) -->
        ${(user.roles.includes('astronomer') || user.roles.includes('stargazer')) ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
            <div class="card" style="padding: var(--spacing-md); text-align: center;">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-accent);">${stats.assigned_events}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Events Assigned</div>
            </div>
             <div class="card" style="padding: var(--spacing-md); text-align: center;">
                <div style="font-size: 1.25rem; font-weight: 700;">${stats.pending_requests}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Pending Req</div>
            </div>
        </div>
        ` : ''}

        <!-- Settings List -->
        <div class="flex flex-col" style="gap: var(--spacing-md);">
            ${user.roles.length > 1 ? `
                <button class="card btn w-full" style="justify-content: space-between; color: var(--color-text-primary);" onclick="window.location.hash='#/role-select'">
                    <span>Switch Role</span><span>⟳</span>
                </button>
            ` : ''}
            
            ${user.roles.includes('manager') ? `
                <button class="card btn w-full" style="justify-content: space-between; color: var(--color-accent);" onclick="window.location.hash='#/create-user'">
                    <span>Add New User</span><span>+</span>
                </button>

                 <!-- Location Management (Collapsible or just a button to toggle?) Let's make it a Card -->
                 <div class="card" style="text-align: left;">
                    <h3 style="font-size: 1rem; margin-bottom: 12px;">Manage Locations</h3>
                    <div id="loc-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
                        <!-- Locations Loaded Here -->
                        <span style="font-size: 0.8rem; color: var(--color-text-muted);">Loading...</span>
                    </div>
                    <div class="flex" style="gap: 8px;">
                        <input id="new-loc" class="input" placeholder="New Location Name" style="margin:0;">
                        <button id="add-loc-btn" class="btn btn-primary" style="padding: 0 16px;">+</button>
                    </div>
                 </div>

            ` : ''}

            <button id="sign-out-btn" class="card btn w-full" style="justify-content: space-between; color: var(--color-status-danger);">
                <span>Sign Out</span><span>➜</span>
            </button>
        </div>
        
        <div style="text-align: center; margin-top: var(--spacing-xl); color: var(--color-text-muted); font-size: 0.75rem;">
            Horizon v1.0 • Orivex Systems
        </div>
    `;

    // Handlers
    const editBtn = container.querySelector('#edit-profile-btn');
    const editForm = container.querySelector('#edit-form');
    const saveBtn = container.querySelector('#save-profile');
    const cancelBtn = container.querySelector('#cancel-edit');

    editBtn.onclick = () => {
        editForm.style.display = 'block';
        editBtn.style.display = 'none';
    };

    cancelBtn.onclick = () => {
        editForm.style.display = 'none';
        editBtn.style.display = 'block';
    };

    container.querySelector('#sign-out-btn').onclick = () => {
        AuthService.logout();
    };

    saveBtn.onclick = async () => {
        const name = container.querySelector('#edit-name').value;
        const password = container.querySelector('#edit-pass').value;
        const paymentInfo = container.querySelector('#edit-payment').value;

        const updateData = { name };
        if (password) updateData.password = password;

        try {
            // 1. Update basic details
            await DataService.updateUserDetails(user.id, updateData);

            // 2. Update payment info (separate endpoint)
            // Only update if the value has changed or if it's being set for the first time
            if (paymentInfo !== (user.payment_info || '')) {
                await DataService.updatePaymentInfo(user.id, paymentInfo);
            }

            // Update Session Storage
            const updatedUser = { ...user, name, payment_info: paymentInfo };
            sessionStorage.setItem('orivex_user', JSON.stringify(updatedUser));

            alert('Profile updated!');
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Failed to update profile.');
        }
    };

    // --- Location Management Logic (Manager Only) ---
    if (user.roles.includes('manager')) {
        const locList = container.querySelector('#loc-list');
        // Replace simple input with search structure
        const locInputContainer = document.createElement('div');
        locInputContainer.style.position = 'relative';
        locInputContainer.style.flex = '1';

        locInputContainer.innerHTML = `
            <input id="new-loc" class="input" placeholder="Search City (e.g. Vangani)..." style="margin:0; width: 100%;">
            <div id="loc-results" class="card" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; z-index: 10; padding: 4px; box-shadow: 0 -4px 12px rgba(0,0,0,0.5);"></div>
        `;

        // Swap the existing input with our new container
        const oldInput = container.querySelector('#new-loc');
        oldInput.parentNode.replaceChild(locInputContainer, oldInput);

        const newLocInput = locInputContainer.querySelector('#new-loc');
        const resultsBox = locInputContainer.querySelector('#loc-results');
        const addLocBtn = container.querySelector('#add-loc-btn');

        let selectedLocation = null;
        let debounceTimer;

        const loadLocations = async () => {
            try {
                const locs = await DataService.getLocations();
                locList.innerHTML = '';
                if (locs.length === 0) {
                    locList.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted);">No custom locations added.</span>';
                }
                locs.forEach(l => {
                    const tag = document.createElement('div');
                    tag.style.background = 'var(--color-bg-tertiary)';
                    tag.style.padding = '4px 10px';
                    tag.style.borderRadius = '16px';
                    tag.style.fontSize = '0.85rem';
                    tag.style.display = 'flex';
                    tag.style.alignItems = 'center';
                    tag.style.gap = '6px';

                    tag.innerHTML = `
                        ${l.name} 
                        <span class="del-loc" style="cursor: pointer; color: var(--color-status-danger); font-weight: bold;">×</span>
                    `;

                    tag.querySelector('.del-loc').onclick = async (e) => {
                        if (confirm(`Delete location "${l.name}"?`)) {
                            await DataService.deleteLocation(l.id);
                            loadLocations();
                        }
                    };
                    locList.appendChild(tag);
                });
            } catch (e) {
                console.error(e);
                locList.innerHTML = 'Error loading locations';
            }
        };

        // Search Logic
        newLocInput.oninput = (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);
            selectedLocation = null; // Reset selection on edit

            if (query.length < 3) {
                resultsBox.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    resultsBox.innerHTML = '<div style="padding:8px; color:var(--color-text-muted); font-size:0.8rem;">Searching...</div>';
                    resultsBox.style.display = 'block';

                    // Nominatim: "Max suggestions" and comprehensive coverage (lakes, valleys)
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=15`);
                    const data = await res.json();

                    resultsBox.innerHTML = '';

                    if (!data || data.length === 0) {
                        resultsBox.innerHTML = '<div style="padding:8px; color:var(--color-text-muted); font-size:0.8rem;">No results found.</div>';
                        return;
                    }

                    data.forEach(place => {
                        const item = document.createElement('div');
                        item.style.padding = '8px';
                        item.style.cursor = 'pointer';
                        item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                        item.style.fontSize = '0.9rem';
                        item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.05)';
                        item.onmouseout = () => item.style.background = 'transparent';

                        // Nominatim 'display_name' is comprehensive
                        const label = place.display_name;
                        item.innerText = label;
                        item.style.lineHeight = '1.4'; // Better for long names

                        item.onclick = () => {
                            newLocInput.value = label;
                            selectedLocation = {
                                name: label,
                                lat: parseFloat(place.lat),
                                lon: parseFloat(place.lon)
                            };
                            resultsBox.style.display = 'none';
                        };
                        resultsBox.appendChild(item);
                    });

                } catch (e) {
                    console.error(e);
                    resultsBox.style.display = 'none';
                }
            }, 400);
        };

        // Hide results on click outside
        document.addEventListener('click', (e) => {
            if (!locInputContainer.contains(e.target)) {
                resultsBox.style.display = 'none';
            }
        });

        addLocBtn.onclick = async () => {
            // If user selected from list, use that.
            // If they just typed something and hit add without selecting, we try to use what they typed (but no coords).
            // Better to enforce selection OR at least saving the text.

            let nameToSave = newLocInput.value.trim();
            let lat = null;
            let lon = null;

            if (selectedLocation && selectedLocation.name === nameToSave) {
                lat = selectedLocation.lat;
                lon = selectedLocation.lon;
            }

            if (!nameToSave) return;

            try {
                await DataService.addLocation(nameToSave, lat, lon);
                newLocInput.value = '';
                selectedLocation = null;
                loadLocations();
            } catch (e) {
                alert('Failed to add location. It might already exist.');
            }
        };

        // Initial Load
        loadLocations();
    }

    return container;
}
