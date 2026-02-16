
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
    container.className = 'fade-in profile-glow';
    container.style.paddingBottom = '60px';

    // Fetch stats
    let stats = { assigned_events: 0, pending_requests: 0 };
    if (user.roles.includes('astronomer') || user.roles.includes('stargazer')) {
        stats = await DataService.getUserStats(user.id);
    }

    container.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-md);">
            <div>
                <h1 style="margin: 0; font-size: 1.25rem; background: linear-gradient(to right, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Account</h1>
                <p style="margin: 0; font-size: 0.8rem; color: var(--color-text-muted);">Manage your presence on Horizon</p>
            </div>
            <button id="edit-profile-btn" class="btn btn-sm btn-secondary" style="font-size: 0.8rem;">Edit Profile</button>
        </div>
        
        <!-- Profile Header Section (Compact) -->
        <div class="card flex items-center" style="margin-bottom: var(--spacing-lg); padding: 20px; gap: 20px;">
            <div style="position: relative;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--color-bg-tertiary) 0%, #3a3a3a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 2px solid rgba(255,255,255,0.1); box-shadow: 0 0 20px rgba(74, 144, 226, 0.1);">
                    ${user.name.charAt(0)}
                </div>
                <div style="position: absolute; bottom: 0; right: 0; width: 18px; height: 18px; background: var(--color-status-success); border-radius: 50%; border: 2px solid var(--color-bg-primary);"></div>
            </div>
            
            <div style="flex: 1;">
                <h2 id="profile-name" style="margin: 0; font-size: 1.4rem; color: var(--color-text-primary); line-height: 1.2;">${user.name}</h2>
                <div class="flex" style="gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    ${user.roles.map(r => `
                        <span style="background: var(--color-accent-subtle); color: var(--color-accent); padding: 2px 10px; border-radius: 12px; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; border: 1px solid rgba(74, 144, 226, 0.2);">
                            ${r}
                        </span>
                    `).join('')}
                </div>
                ${user.payment_info ? `
                    <div style="margin-top: 8px; font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px;">
                        <span style="opacity: 0.7;">Payment:</span> <span style="font-family: monospace; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${user.payment_info}</span>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Edit Form -->
        <div id="edit-form" class="card" style="display: none; margin-bottom: var(--spacing-lg); background: rgba(255,255,255,0.03); backdrop-filter: blur(10px);">
            <h3 style="margin-bottom: var(--spacing-md); font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">Update Information</h3>
            <div class="flex flex-col" style="gap: var(--spacing-md);">
                <div class="flex flex-col" style="gap: 4px;">
                    <label style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase;">Display Name</label>
                    <input class="input" id="edit-name" value="${user.name}" style="background: rgba(0,0,0,0.2); padding: 8px;">
                </div>

                <div class="flex flex-col" style="gap: 4px;">
                    <label style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase;">Payment Details</label>
                    <input class="input" id="edit-payment" value="${user.payment_info || ''}" style="background: rgba(0,0,0,0.2); padding: 8px;" placeholder="e.g. user@okaxis">
                </div>

                 <div class="flex flex-col" style="gap: 4px;">
                    <label style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase;">New Password</label>
                    <input class="input" id="edit-pass" type="password" style="background: rgba(0,0,0,0.2); padding: 8px;" placeholder="Leave blank to keep current">
                </div>
                
                <div class="flex" style="gap: 8px; margin-top: 4px;">
                    <button id="save-profile" class="btn btn-primary btn-sm" style="flex: 1;">Save</button>
                    <button id="cancel-edit" class="btn btn-secondary btn-sm" style="flex: 1;">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Stats Grid (Compact) -->
        ${(user.roles.includes('astronomer') || user.roles.includes('stargazer')) ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: var(--spacing-lg);">
            <div class="card" style="padding: 16px; text-align: left; background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(0,0,0,0) 100%);">
                <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-accent); font-weight: 700; margin-bottom: 2px;">Assigned</div>
                <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${stats.assigned_events}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Active Events</div>
            </div>
             <div class="card" style="padding: 16px; text-align: left;">
                <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 2px;">Requests</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1;">${stats.pending_requests}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Pending Action</div>
            </div>
        </div>
        ` : ''}

        <!-- Actions Section (Grid Layout) -->
        <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted); margin-bottom: 12px; font-weight: 700;">Account Actions</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
            ${user.roles.length > 1 ? `
                <div class="card clickable-action" style="padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 12px;" onclick="window.location.hash='#/role-select'">
                    <div style="font-size: 1.2rem; min-width: 32px; height: 32px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center;">🔄</div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">Switch Role</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">Change active perspective</div>
                    </div>
                </div>
            ` : ''}
            
            ${user.roles.includes('manager') ? `
                <div class="card clickable-action" style="padding: 16px; cursor: pointer; border: 1px dashed rgba(74, 144, 226, 0.4);" onclick="window.location.hash='#/create-user'">
                     <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 1.2rem; color: var(--color-accent); min-width: 32px; height: 32px; background: rgba(74, 144, 226, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">👤+</div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem; color: var(--color-accent);">Onboard User</div>
                            <div style="font-size: 0.7rem; color: var(--color-text-muted);">Invite new members</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div id="sign-out-btn" class="card clickable-action" style="padding: 16px; cursor: pointer; border: 1px solid rgba(248, 113, 113, 0.2);">
                 <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 1.2rem; color: var(--color-status-danger); min-width: 32px; height: 32px; background: rgba(248, 113, 113, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">⏻</div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--color-status-danger);">Log Out</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted);">End current session</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Location Management (Full width below grid) -->
        ${user.roles.includes('manager') ? `
             <div class="card" style="padding: 16px; margin-top: 12px;">
                <div class="flex items-center" style="gap: 10px; margin-bottom: 12px;">
                    <div style="font-size: 1.1rem;">📍</div>
                    <h3 style="font-size: 1rem; margin: 0;">Observatory Locations</h3>
                </div>
                
                <div id="loc-list" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">Scanning hubs...</span>
                </div>
                
                <div class="flex" style="gap: 8px;">
                    <div style="flex: 1; position: relative;">
                         <input id="new-loc" class="input" placeholder="Add location..." style="margin:0; background: rgba(0,0,0,0.1); padding: 8px; font-size: 0.85rem;">
                         <div id="loc-results" class="card" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; max-height: 180px; overflow-y: auto; z-index: 10; padding: 4px; box-shadow: 0 -4px 12px rgba(0,0,0,0.5); background: #1a1a1a;"></div>
                    </div>
                    <button id="add-loc-btn" class="btn btn-primary btn-sm" style="border-radius: 8px;">Add</button>
                </div>
             </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
            <div style="font-family: monospace; font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 2px;">
                Horizon Protocol V1.0.4
            </div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.2); margin-top: 4px;">Secure connection via Boltix Solutions</div>
        </div>

        <style>
            .profile-glow {
                position: relative;
            }
            .clickable-action {
                transition: all 0.2s ease;
            }
            .clickable-action:hover {
                background: rgba(255,255,255,0.05);
                transform: translateX(4px);
            }
            .location-tag {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.2s ease;
            }
            .location-tag:hover {
                background: rgba(255,255,255,0.1);
            }
        </style>
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
        const newLocInput = container.querySelector('#new-loc');
        const resultsBox = container.querySelector('#loc-results');
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
                    tag.className = 'location-tag';
                    tag.innerHTML = `
                        <span style="flex: 1;">${l.name}</span> 
                        <span class="del-loc" style="cursor: pointer; color: var(--color-status-danger); opacity: 0.6; font-size: 1.2rem; line-height: 1;" title="Delete location">×</span>
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
            if (!newLocInput.contains(e.target) && !resultsBox.contains(e.target)) {
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
