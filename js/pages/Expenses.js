
import { DataService } from '../services/data.js';
import { AuthService } from '../services/auth.js';

export async function ExpensesPage() {
    const user = AuthService.getCurrentUser();
    if (!user) return document.createComment('Redirecting...');

    const container = document.createElement('div');
    container.className = 'container';

    container.innerHTML = `
        <div class="fade-in">
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px;">
                <h2 style="margin: 0;">Payments</h2>
                <div style="display: flex; gap: 8px;">
                    <button id="add-group-expense-btn" class="btn btn-secondary" style="display: none; padding: 8px 12px; font-size: 0.9rem;">+ Group</button>
                    <button id="add-expense-btn" class="btn btn-primary" style="display: none; padding: 8px 12px; font-size: 0.9rem;">+ Expense</button>
                </div>
            </div>

            
            <div id="expense-list" class="flex flex-col" style="gap: var(--spacing-md);">
                <div style="text-align:center; color: var(--color-text-muted);">Loading...</div>
            </div>
        </div>
        
        <!-- Add Expense Modal -->
        <div id="add-expense-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; padding: 16px;">
            <div class="card" style="width: 100%; max-width: 400px; padding: 24px; animation: fadeIn 0.3s ease; max-height: 90vh; overflow-y: auto;">
                <h3 id="modal-title" style="margin-bottom: 16px;">New Expense Claim</h3>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 0.9rem; color: var(--color-text-secondary);">Select Past Event</label>
                    <select id="expense-event-select" class="input" style="width: 100%;">
                        <option value="">-- Select Event --</option>
                    </select>
                </div>

                <!-- Group Members Selection (Hidden by default) -->
                <div id="group-members-section" style="display: none; margin-bottom: 12px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 4px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--color-text-secondary);">Select Team Members</label>
                    <div id="group-members-list" class="flex flex-col gap-2" style="max-height: 100px; overflow-y: auto;">
                        <!-- Checkboxes go here -->
                        <div style="color: var(--color-text-muted); font-size: 0.8rem;">Select an event first</div>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 0.9rem; color: var(--color-text-secondary);">Total Amount (₹)</label>
                    <input id="expense-amount" type="number" class="input" placeholder="e.g. 500" style="width: 100%;">
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 0.9rem; color: var(--color-text-secondary);">Description</label>
                    <textarea id="expense-desc" class="input" placeholder="e.g. Travel to Vangani" rows="4" style="width: 100%; resize: vertical; font-family: inherit;"></textarea>
                </div>

                <div class="flex gap-2">
                    <button id="submit-expense" class="btn btn-primary w-full">Submit Claim</button>
                    <button id="cancel-expense" class="btn btn-secondary w-full">Cancel</button>
                </div>
            </div>
        </div>

        <!-- View Expense Details Modal -->
        <div id="view-expense-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; padding: 16px;">
            <div class="card" style="width: 100%; max-width: 500px; padding: 24px; animation: fadeIn 0.3s ease; max-height: 90vh; overflow-y: auto; position: relative;">
                <button id="close-view-modal" style="position: absolute; top: 16px; right: 16px; background:none; border:none; color: var(--color-text-secondary); cursor: pointer; font-size: 1.5rem;">&times;</button>
                
                <h3 style="margin-bottom: 20px; padding-right: 20px;">Claim Details</h3>
                <div id="view-content"></div>
                
                <div id="view-actions" class="flex gap-2" style="margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                    <!-- Dynamic Actions -->
                </div>
            </div>
        </div>
    `;

    const listContainer = container.querySelector('#expense-list');

    // Create Refs
    const addBtn = container.querySelector('#add-expense-btn');
    const addGroupBtn = container.querySelector('#add-group-expense-btn');
    const addModal = container.querySelector('#add-expense-modal');
    const cancelBtn = container.querySelector('#cancel-expense');
    const submitBtn = container.querySelector('#submit-expense');

    const modalTitle = container.querySelector('#modal-title');
    const eventSelect = container.querySelector('#expense-event-select');
    const groupSection = container.querySelector('#group-members-section');
    const groupList = container.querySelector('#group-members-list');

    // Refs for View Modal
    const viewModal = container.querySelector('#view-expense-modal');
    const closeViewBtn = container.querySelector('#close-view-modal');
    const viewContent = container.querySelector('#view-content');
    const viewActions = container.querySelector('#view-actions');

    let allEvents = [];
    let allUsers = []; // Move to scope
    let isGroupMode = false;

    // --- Add Functionality ---
    addBtn.style.display = 'block';
    addGroupBtn.style.display = 'block';

    addBtn.onclick = () => {
        isGroupMode = false;
        openModal();
    };

    addGroupBtn.onclick = () => {
        isGroupMode = true;
        openModal();
    };

    const openModal = () => {
        modalTitle.innerText = isGroupMode ? 'New Group Expense' : 'New Expense Claim';
        groupSection.style.display = isGroupMode ? 'block' : 'none';
        addModal.style.display = 'flex';
        populateEventSelect();

        if (isGroupMode) {
            populateGroupMembers();
        } else {
            groupList.innerHTML = '';
        }
    };

    cancelBtn.onclick = () => addModal.style.display = 'none';
    addModal.onclick = (e) => {
        if (e.target === addModal) addModal.style.display = 'none';
    };

    // --- View Functionality ---
    closeViewBtn.onclick = () => viewModal.style.display = 'none';
    viewModal.onclick = (e) => {
        if (e.target === viewModal) viewModal.style.display = 'none';
    };

    const populateEventSelect = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const claimableEvents = allEvents.filter(e => {
            const eDate = new Date(e.date);
            const isPast = eDate < today;
            const isAssigned = e.assigned && e.assigned.includes(user.id);
            return isPast && isAssigned;
        });

        claimableEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

        eventSelect.innerHTML = '<option value="">-- Select Event --</option>';
        if (claimableEvents.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.innerText = 'No past assigned events found';
            eventSelect.appendChild(opt);
        } else {
            claimableEvents.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.innerText = `${e.date} - ${e.title}`;
                eventSelect.appendChild(opt);
            });
        }
    };

    const populateGroupMembers = () => {
        const otherMembers = allUsers.filter(u => u.id !== user.id);

        groupList.innerHTML = '';
        if (otherMembers.length === 0) {
            groupList.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.8rem;">No other members found</div>';
        } else {
            otherMembers.forEach(m => {
                const row = document.createElement('div');
                row.className = 'flex items-center gap-2';
                row.innerHTML = `
                    <input type="checkbox" id="gm-${m.id}" value="${m.id}" style="cursor: pointer;">
                    <label for="gm-${m.id}" style="cursor: pointer; font-size: 0.9rem;">${m.name}</label>
                `;
                groupList.appendChild(row);
            });
        }
    };

    submitBtn.onclick = async () => {
        const evtId = eventSelect.value;
        const amt = container.querySelector('#expense-amount').value;
        const desc = container.querySelector('#expense-desc').value;

        if (!evtId) return alert('Please select an event.');
        if (!amt || !desc) return alert('Please enter amount and description.');

        let selectedMembers = [];
        if (isGroupMode) {
            const checkboxes = groupList.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(cb => selectedMembers.push(cb.value));
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            const result = await DataService.createExpense({
                event_id: evtId,
                user_id: user.id,
                amount: amt,
                description: desc,
                group_members: selectedMembers, // Send list
                created_at: new Date().toISOString()
            });

            if (result.error) {
                alert(result.error);
                return;
            }

            container.querySelector('#expense-amount').value = '';
            container.querySelector('#expense-desc').value = '';
            eventSelect.value = '';
            addModal.style.display = 'none';

            await loadExpenses();

        } catch (e) {
            console.error(e);
            alert('Failed to submit expense.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit Claim';
        }
    };

    async function loadExpenses() {
        listContainer.innerHTML = '<div style="text-align:center; color: var(--color-text-muted);">Loading...</div>';
        try {
            let expenses = [];

            // Fetch everything
            // Note: Parallel fetch is efficient
            if (user.roles.includes('manager')) {
                [expenses, allUsers, allEvents] = await Promise.all([
                    DataService.getExpenses(),
                    DataService.getUsers(),
                    DataService.getEvents()
                ]);
            } else {
                [expenses, allUsers, allEvents] = await Promise.all([
                    DataService.getExpenses({ user_id: user.id }),
                    DataService.getUsers(),
                    DataService.getEvents()
                ]);
            }

            expenses.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });

            listContainer.innerHTML = '';

            if (expenses.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; color: var(--color-text-muted);">No expense claims found.</div>';
                return;
            }

            expenses.forEach(exp => {
                const expUser = allUsers.find(u => u.id === exp.user_id) || { name: 'Unknown', payment_info: '' };
                const expEvent = allEvents.find(e => e.id === exp.event_id) || { title: 'Unknown Event', date: '???' };

                const card = document.createElement('div');
                card.className = 'card interactive';
                card.style.cursor = 'pointer';

                if (exp.status === 'pending') {
                    card.style.borderLeft = '4px solid var(--color-status-warning)';
                } else if (exp.status === 'paid') {
                    card.style.borderLeft = '4px solid var(--color-status-success)';
                    card.style.opacity = '0.7';
                }

                const paymentLink = expUser.payment_info;
                const isPending = exp.status === 'pending';

                // Resolve group members names
                let groupMemberNames = [];
                if (exp.group_members && exp.group_members.length > 0) {
                    groupMemberNames = exp.group_members.map(mid => {
                        const m = allUsers.find(u => u.id === mid);
                        return m ? m.name : 'Unknown';
                    });
                }

                // Render Pay Button Logic
                const renderPayBtn = () => {
                    if (!paymentLink) return `<button class="btn btn-secondary w-full" disabled style="opacity: 0.5;">No Payment Link</button>`;

                    let href = paymentLink;
                    let target_attr = 'target="_blank"';

                    if (paymentLink.includes('@') && !paymentLink.startsWith('http')) {
                        const note = encodeURIComponent(`Expense: ${exp.description}`);
                        const name = encodeURIComponent(expUser.name);
                        href = `upi://pay?pa=${paymentLink}&pn=${name}&am=${exp.amount}&cu=INR&tn=${note}`;
                        target_attr = '';
                    }

                    return `<a href="${href}" ${target_attr} class="btn btn-primary w-full" style="text-decoration: none; text-align: center;">Pay Now ↗</a>`;
                };

                // Card Preview HTML
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div style="flex: 1;">
                            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 4px;">
                                ${expEvent.date} • ${expEvent.title}
                            </div>
                            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 8px;">
                                ${expUser.name} ${groupMemberNames.length > 0 ? `<span style="font-size: 0.8rem; font-weight: normal; color: var(--color-text-muted);">(+ ${groupMemberNames.length} others)</span>` : ''}
                            </div>
                            <div class="flex items-center gap-2">
                                <span style="font-weight: bold; color: var(--color-accent); font-size: 1.25rem;">₹${exp.amount}</span>
                                <span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); text-transform: capitalize; color: ${isPending ? 'var(--color-status-warning)' : 'var(--color-status-success)'};">
                                    ${exp.status}
                                </span>
                            </div>
                        </div>
                        <div style="color: var(--color-text-muted); font-size: 1.5rem;">›</div>
                    </div>
                `;

                // View Details Modal HTML
                card.onclick = () => {
                    viewContent.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Event</div>
                            <div style="font-size: 1rem;">${expEvent.title}</div>
                            <div style="color: var(--color-text-secondary); font-size: 0.9rem;">${expEvent.date} at ${expEvent.time}</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                ${exp.user_id === user.id ? 'Claimant (You)' : 'Claimant / Added By'}
                            </div>
                            <div style="font-size: 1rem; font-weight: 600;">${expUser.name}</div>
                            ${exp.group_members && exp.group_members.includes(user.id) ?
                            `<div style="font-size: 0.8rem; color: var(--color-accent); margin-top: 4px;">You are included in this group expense</div>` : ''}
                            ${paymentLink ? `<div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 2px;">Payment ID: <span style="user-select: all; color: var(--color-text-primary);">${paymentLink}</span></div>` : ''}
                        </div>

                        ${groupMemberNames.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Group Members Included</div>
                            <div style="font-size: 0.95rem; line-height: 1.4; color: var(--color-text-primary); background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px;">
                                ${groupMemberNames.join(', ')}
                            </div>
                        </div>` : ''}

                        <div style="margin-bottom: 20px;">
                             <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Amount</div>
                             <div style="font-size: 1.5rem; color: var(--color-accent); font-weight: bold;">₹${exp.amount}</div>
                             <div style="font-size: 0.9rem; color: ${isPending ? 'var(--color-status-warning)' : 'var(--color-status-success)'}; font-weight: 500;">Status: ${exp.status.toUpperCase()}</div>
                        </div>

                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Description</div>
                            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${exp.description}</div>
                        </div>
                    `;

                    // Actions
                    viewActions.innerHTML = '';
                    if (user.roles.includes('manager') && isPending) {
                        const btnContainer = document.createElement('div');
                        btnContainer.className = 'w-full flex flex-col gap-3';
                        btnContainer.innerHTML = `
                            ${renderPayBtn()}
                            <button id="modal-mark-paid" class="btn btn-secondary w-full">Mark as Paid</button>
                        `;
                        viewActions.appendChild(btnContainer);

                        const markBtn = btnContainer.querySelector('#modal-mark-paid');
                        markBtn.onclick = async () => {
                            if (confirm(`Confirm marking ₹${exp.amount} claim as PAID?`)) {
                                markBtn.disabled = true;
                                markBtn.innerText = 'Updating...';
                                try {
                                    await DataService.updateExpenseStatus(exp.id, 'paid');
                                    viewModal.style.display = 'none';
                                    loadExpenses();
                                } catch (e) {
                                    alert('Error updating status');
                                    markBtn.disabled = false;
                                }
                            }
                        };
                    } else if (exp.status === 'paid') {
                        viewActions.innerHTML = '<div class="w-full text-center" style="color: var(--color-status-success); font-weight: 600;">✓ This claim has been paid</div>';
                    } else {
                        viewActions.innerHTML = '<div class="w-full text-center" style="color: var(--color-text-secondary);">Waiting for manager approval</div>';
                    }

                    viewModal.style.display = 'flex';
                };

                listContainer.appendChild(card);
            });

        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<div style="color: var(--color-status-danger);">Failed to load expenses.</div>';
        }
    }

    loadExpenses();
    return container;
}
