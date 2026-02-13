
import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';

export async function AvailabilityPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    const user = AuthService.getCurrentUser();

    let currentDate = new Date();

    // Header Wrapper
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center';
    header.style.marginBottom = 'var(--spacing-lg)';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&lt;';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.style.padding = '8px 16px';

    // Title
    const monthTitle = document.createElement('h2');
    monthTitle.style.margin = '0';
    monthTitle.style.minWidth = '200px';
    monthTitle.style.textAlign = 'center';

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&gt;';
    nextBtn.className = 'btn btn-secondary';
    nextBtn.style.padding = '8px 16px';

    header.appendChild(prevBtn);
    header.appendChild(monthTitle);
    header.appendChild(nextBtn);
    container.appendChild(header);

    // Month Names
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Placeholder for Grid (to be re-rendered)
    const gridContainer = document.createElement('div');
    container.appendChild(gridContainer);

    // Render Function
    const renderCalendar = async () => {
        monthTitle.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        // Clear old grid
        gridContainer.innerHTML = '';

        // Weekday Header
        const weekGrid = document.createElement('div');
        weekGrid.style.display = 'grid';
        weekGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        weekGrid.style.gap = 'var(--spacing-xs)';
        weekGrid.style.marginBottom = 'var(--spacing-sm)';
        weekGrid.style.textAlign = 'center';

        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            const d = document.createElement('div');
            d.textContent = day;
            d.style.color = 'var(--color-text-muted)';
            d.style.fontSize = '0.75rem';
            weekGrid.appendChild(d);
        });
        gridContainer.appendChild(weekGrid);

        // Fetch availability data (optimized to assume global map for simplicity or refetch if date range logic added later)
        let availabilityMap = {};
        try {
            availabilityMap = await DataService.getAvailabilityMap(user.id);
        } catch (e) { console.error(e); }

        // Days Grid
        const daysGrid = document.createElement('div');
        daysGrid.style.display = 'grid';
        daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysGrid.style.gap = 'var(--spacing-xs)';

        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');

        // Simple loop for days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayBtn = document.createElement('button');
            dayBtn.type = 'button';
            dayBtn.textContent = i;
            dayBtn.style.padding = '12px 0';
            dayBtn.style.borderRadius = 'var(--radius-md)';
            dayBtn.style.background = 'var(--color-bg-tertiary)';
            dayBtn.style.color = 'var(--color-text-primary)';
            dayBtn.style.border = '1px solid transparent';
            dayBtn.style.position = 'relative';
            dayBtn.style.cursor = 'pointer';

            const dayStr = String(i).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayStr}`;
            const status = availabilityMap[dateKey] || 'unknown';

            const cellDate = new Date(year, parseInt(month) - 1, i);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = cellDate < today;

            if (status === 'available') {
                dayBtn.style.borderColor = 'var(--color-status-success)';
                dayBtn.style.background = 'rgba(46, 204, 113, 0.1)';
            } else if (status === 'maybe') {
                dayBtn.style.borderColor = 'var(--color-status-warning)';
                dayBtn.style.background = 'rgba(243, 156, 18, 0.1)';
            } else if (status === 'unavailable') {
                dayBtn.style.opacity = '0.5';
                dayBtn.style.textDecoration = 'line-through';
                dayBtn.style.borderColor = 'var(--color-status-danger)';
            }

            if (isPast) {
                dayBtn.style.opacity = '0.3';
                dayBtn.style.cursor = 'not-allowed';
                dayBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); }; // No-op
            } else {
                dayBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showStatusModal(i, monthNames[currentDate.getMonth()], dateKey, user.id);
                };
            }



            daysGrid.appendChild(dayBtn);
        }
        gridContainer.appendChild(daysGrid);

        // Legend is static, append once or re-append
        // ... (we will append legend below gridContainer if not exists, or just append to gridContainer for info)
        const legend = document.createElement('div');
        legend.className = 'flex justify-between';
        legend.style.marginTop = 'var(--spacing-lg)';
        legend.innerHTML = `
            <div class="flex items-center" style="gap: 6px; font-size: 0.8rem; color: var(--color-text-muted);">
                <div style="width: 8px; height: 8px; background: var(--color-status-success); border-radius: 50%;"></div> Available
            </div>
                <div class="flex items-center" style="gap: 6px; font-size: 0.8rem; color: var(--color-text-muted);">
                <div style="width: 8px; height: 8px; background: var(--color-status-warning); border-radius: 50%;"></div> Maybe
            </div>
            <div class="flex items-center" style="gap: 6px; font-size: 0.8rem; color: var(--color-text-muted);">
                <div style="width: 8px; height: 8px; background: var(--color-status-danger); border-radius: 50%;"></div> Not Avail.
            </div>
        `;
        gridContainer.appendChild(legend);
    };

    // Initial Render
    renderCalendar();

    // Handlers
    prevBtn.onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    nextBtn.onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };

    // Remove old manual render code below (lines 25-116 in original) since we moved it into renderCalendar
    /* 
       We will return container here and let the render function fill it. 
       We need to remove the subsequent code in the file that manually builds the grid.
    */
    return container;
}

// Helper needed for the render function to work (it was outside before)
// We need to keep showStatusModal available. 
// We will just comment out the "rest" of the function body in the next replacement step or just have this replacement cover a huge chunk.
// Let's trying replacing the whole function body.


// ... imports
// ... Page setup

// Helper to render popup
const showStatusPopup = (day, dayBtnRect, dateKey) => {
    // Close existing
    const existing = document.getElementById('status-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'status-popup';
    popup.className = 'card fade-in';
    popup.style.position = 'absolute';
    popup.style.zIndex = '100';
    popup.style.width = '280px';
    popup.style.padding = '12px';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.gap = '8px';
    popup.style.background = 'var(--color-bg-secondary)'; // Distinct from tertiary bg
    popup.style.border = '1px solid rgba(255,255,255,0.1)';
    popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';

    // Position logic: Center it relative to the day button if possible, or center screen if mobile
    // detailed positioning ensures it stays on screen
    // For simplicity in this "minimal" request, let's center it on the button but slightly offset (popover).
    // Actually, centering on screen is safest "Compact Modal".
    // Let's go with Centered Compact Modal as "Minimal".

    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';

    popup.innerHTML = `
            <div class="flex justify-between items-center" style="margin-bottom: 8px;">
                <span style="font-size: 0.9rem; font-weight: 600; color: var(--color-text-secondary);">${monthNames[currentDate.getMonth()]} ${day}</span>
                <button id="close-popup" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); padding: 4px;">&times;</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                 <button data-status="available" style="
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 12px 4px; border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.2);
                    background: rgba(46, 204, 113, 0.05); color: var(--color-status-success);
                    cursor: pointer; transition: all 0.2s; gap: 6px;">
                    <div style="font-size: 1rem;">●</div>
                    <span style="font-size: 0.7rem;">Free</span>
                </button>

                <button data-status="maybe" style="
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 12px 4px; border-radius: 8px; border: 1px solid rgba(243, 156, 18, 0.2);
                    background: rgba(243, 156, 18, 0.05); color: var(--color-status-warning);
                    cursor: pointer; transition: all 0.2s; gap: 6px;">
                    <div style="font-size: 1rem;">●</div>
                    <span style="font-size: 0.7rem;">Maybe</span>
                </button>

                <button data-status="unavailable" style="
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 12px 4px; border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.2);
                    background: rgba(231, 76, 60, 0.05); color: var(--color-status-danger);
                    cursor: pointer; transition: all 0.2s; gap: 6px;">
                    <div style="font-size: 1rem;">●</div>
                    <span style="font-size: 0.7rem;">Busy</span>
                </button>
            </div>
        `;

    // Remove backdrop if desired for "minimal", but a transparent click-blocker is good.
    // Let's add a transparent backdrop closing handler
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.zIndex = '99';
    backdrop.style.background = 'rgba(0,0,0,0.4)'; // Slight dim
    backdrop.onclick = () => { popup.remove(); backdrop.remove(); };

    container.appendChild(backdrop);
    container.appendChild(popup);

    popup.querySelector('#close-popup').onclick = () => { popup.remove(); backdrop.remove(); };

    popup.querySelectorAll('button[data-status]').forEach(btn => {
        btn.onclick = async () => {
            const status = btn.dataset.status;
            // Optimistic UI update?
            // For now, reload as per original logic to ensure sync
            await DataService.setAvailability(user.id, dateKey, status);
            popup.remove();
            backdrop.remove();
            // Instead of reload, re-render calendar?
            // window.location.reload(); 
            // Let's just re-render calendar to keep it smooth
            renderCalendar();
        };
    });
};

// Update dayBtn.onclick in render loop
// I need to ensure the render Calendar function uses this new 'showStatusPopup' or the inline logic.
// Since I can't edit `renderCalendar` easily without replacing Huge chunks, I will define `showStatusPopup` OUTSIDE but calling `renderCalendar` is tricky if scope is lost.
// Actually, `renderCalendar` IS inside `AvailabilityPage`.
// I will replace `showStatusModal` definition and usages.

// NOTE: The user asked for "clicking on the date... should expand it".
// My previous thought on "Compact Modal" covers the "Minimal UI" request.
// But "Expand it" might mean the user wants the interaction to feel like the button itself is opening.
// The proposed `showStatusPopup` is good. I will stick to it.

// Re-write of the relevant part of renderCalendar and showStatusModal removal
// This requires replacing the `showStatusModal` function (lines 188-260) 
// AND updating the onclick handler in `renderCalendar` (lines 128-132) if the function name changes.
// Or I can keep the name `showStatusModal` to minimize diff, but change implementation entirely.
// YES. I will keep `showStatusModal` name but change content to the new popup.

function showStatusModal(day, monthName, dateKey, userId) {
    const existing = document.getElementById('status-dict-popup');
    if (existing) existing.remove();
    const existingBg = document.getElementById('status-dict-bg');
    if (existingBg) existingBg.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'status-dict-bg';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.zIndex = '9998';
    backdrop.style.background = 'rgba(0,0,0,0.5)';
    backdrop.style.backdropFilter = 'blur(2px)';
    backdrop.className = 'fade-in';

    const popup = document.createElement('div');
    popup.id = 'status-dict-popup';
    popup.className = 'card scale-in'; // Assuming scale-in animation exists or defaults
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.width = '280px';
    popup.style.zIndex = '9999';
    popup.style.padding = '16px';
    popup.style.background = '#1e293b'; // Slate-800
    popup.style.border = '1px solid rgba(255,255,255,0.1)';
    popup.style.borderRadius = '16px';

    popup.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: 12px;">
            <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">${monthName} ${day}</span>
            <button id="close-dict" style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:1.2rem;">&times;</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
             <button data-status="available" style="background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); color: #2ecc71; padding: 12px 4px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: transform 0.1s;">
                <div style="width: 12px; height: 12px; background: currentColor; border-radius: 50%;"></div>
                <span style="font-size: 0.7rem; font-weight: 500;">Free</span>
            </button>
             <button data-status="maybe" style="background: rgba(243, 156, 18, 0.1); border: 1px solid rgba(243, 156, 18, 0.3); color: #f39c12; padding: 12px 4px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: transform 0.1s;">
                <div style="width: 12px; height: 12px; background: currentColor; border-radius: 50%;"></div>
                <span style="font-size: 0.7rem; font-weight: 500;">Maybe</span>
            </button>
             <button data-status="unavailable" style="background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); color: #e74c3c; padding: 12px 4px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: transform 0.1s;">
                <div style="width: 12px; height: 12px; background: currentColor; border-radius: 50%;"></div>
                <span style="font-size: 0.7rem; font-weight: 500;">Busy</span>
            </button>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(popup);

    const close = () => {
        backdrop.remove();
        popup.remove();
    };

    backdrop.onclick = close;
    popup.querySelector('#close-dict').onclick = close;

    popup.querySelectorAll('button[data-status]').forEach(btn => {
        btn.onclick = async () => {
            // Visual feedback
            btn.style.transform = 'scale(0.95)';
            await DataService.setAvailability(userId, dateKey, btn.dataset.status);
            close();
            // We need to trigger a re-render. Since we are outside the component context, we might reload or dispatch event.
            // Reload is safest for now.
            window.location.reload();
        };
    });
}
