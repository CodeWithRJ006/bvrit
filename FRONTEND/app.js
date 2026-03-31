// Relative URLs ensure this works locally AND when deployed on Render.com
const API_URL = '/api/report';
const SERVER_URL = window.location.origin; 
let completedSections = new Set();
let currentSectionKey = null;

document.addEventListener("DOMContentLoaded", () => {
    initThemeSystem();
    initCanvasBackground();
    renderSidebar();
    
    // Entrance Animation
    gsap.from('.gsap-header', { y: -20, opacity: 0, duration: 1, ease: "power3.out" });
    gsap.from('.sidebar-item', { x: -20, opacity: 0, stagger: 0.05, duration: 0.5, ease: "power2.out" });
});

// ====== THEME ENGINE ======
function initThemeSystem() {
    const savedTheme = localStorage.getItem('vanguard-theme') || 'dark';
    const btn = Array.from(document.querySelectorAll('.theme-btn')).find(b => b.innerText.toLowerCase() === savedTheme);
    if(btn) setTheme(savedTheme, btn);
}

window.setTheme = function(theme, btnElement) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vanguard-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

// ====== CUSTOM CURSOR ======
function initCustomCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
    let outlineX = mouseX, outlineY = mouseY;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        cursorDot.style.left = `${mouseX}px`; cursorDot.style.top = `${mouseY}px`;
    });

    function animateCursor() {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;
        cursorOutline.style.left = `${outlineX}px`; cursorOutline.style.top = `${outlineY}px`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('button, a, input, select, .cursor-hover, .sidebar-item, .theme-btn')) {
            cursorOutline.style.width = '70px'; cursorOutline.style.height = '70px';
            cursorOutline.style.backgroundColor = 'rgba(var(--grid-rgb), 0.15)';
        }
    });
    document.body.addEventListener('mouseout', (e) => {
        if (e.target.closest('button, a, input, select, .cursor-hover, .sidebar-item, .theme-btn')) {
            cursorOutline.style.width = '40px'; cursorOutline.style.height = '40px';
            cursorOutline.style.backgroundColor = 'transparent';
        }
    });
}

function initMagneticButtons() {
    document.querySelectorAll('.magnetic').forEach((elem) => {
        elem.addEventListener('mousemove', (e) => {
            const rect = elem.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(elem, { x: x * 0.3, y: y * 0.3, duration: 0.5, ease: "power3.out" });
        });
        elem.addEventListener('mouseleave', () => { gsap.to(elem, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }); });
    });
}

// ====== DYNAMIC CANVAS ======
function initCanvasBackground() {
    const canvas = document.getElementById('grid-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    function drawGrid() {
        ctx.clearRect(0, 0, width, height);
        const rootStyles = getComputedStyle(document.documentElement);
        const gridRgb = rootStyles.getPropertyValue('--grid-rgb').trim() || '0, 240, 255';

        let gradient = ctx.createLinearGradient(0, height, 0, height * 0.3);
        gradient.addColorStop(0, `rgba(${gridRgb}, 0.25)`);
        gradient.addColorStop(1, `rgba(${gridRgb}, 0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;

        const originY = height * 0.2;
        const gridSpacing = 60;
        
        ctx.beginPath();
        for (let i = -width; i <= width * 2; i += gridSpacing * 2) {
            ctx.moveTo(width / 2 + (i - width / 2) * 0.1, originY);
            ctx.lineTo(i, height);
        }
        ctx.stroke();

        ctx.beginPath();
        let timeOffset = (Date.now() * 0.02) % gridSpacing;
        for (let y = 0; y < height - originY; y += gridSpacing) {
            let currentY = originY + Math.pow((y + timeOffset) / (height - originY), 2) * (height - originY);
            if(currentY > originY && currentY < height) { ctx.moveTo(0, currentY); ctx.lineTo(width, currentY); }
        }
        ctx.stroke();
        requestAnimationFrame(drawGrid);
    }
    drawGrid();
}

// ====== CONFIGURATION ======
const sectionConfig = {
    generalPoints: { icon: "fa-bullhorn", title: "1. General Points", fields: ["Description", "Date"] },
    facultyJoinedRelieved: { icon: "fa-user-tie", title: "2. Faculty Joined / Relieved", fields: ["Name of Faculty", "Department", "Designation", "Date of Joining", "Date of Relieving"] },
    facultyAchievements: { icon: "fa-trophy", title: "3. Faculty Achievements", fields: ["Name of Faculty", "Department", "Details of Achievement", "Date"] },
    studentAchievements: { icon: "fa-medal", title: "4. Student Achievements", fields: ["Name of Student", "Roll No", "Department", "Details of Achievement", "Date"] },
    departmentAchievements: { icon: "fa-building", title: "5. Department Achievements", fields: ["Details of Achievement", "Date"] },
    facultyEvents: { icon: "fa-chalkboard-user", title: "6. Faculty Events Conducted", fields: ["Name of Event", "Department", "Resource Person Details", "Coordinator Name", "No. of Faculty Participated", "Dates"] },
    studentEvents: { icon: "fa-users-rectangle", title: "7. Student Events Conducted", fields: ["Name of Event", "Department", "Resource Person", "Coordinator", "No. of Students", "Dates"] },
    nonTechnicalEvents: { icon: "fa-masks-theater", title: "8. Non-Technical Events", fields: ["Name of Event", "Department", "Resource Person", "Coordinator", "No. of Students", "Dates"] },
    industryVisits: { icon: "fa-industry", title: "9. Industry/Colleges Visit", fields: ["Industry Name and Location", "Department", "Coordinator", "No. of Students", "Dates"] },
    hackathons: { icon: "fa-laptop-code", title: "10. Hackathons / Events", fields: ["Name of Hackathon", "Conducted By", "Mentor Details", "No. of Students", "Dates"] },
    facultyFDP: { icon: "fa-certificate", title: "11. Faculty FDP/Certifications", fields: ["Name of Faculty", "Department", "Name of Workshop", "Organized By", "Dates"] },
    facultyVisits: { icon: "fa-plane-departure", title: "12. Faculty Visits", fields: ["Name of Faculty", "Department", "Location Visited", "Dates"] },
    patents: { icon: "fa-file-signature", title: "13. Patents Published", fields: ["Name of Faculty", "Patent Title", "Application No", "Publication Date"] },
    vedicPrograms: { icon: "fa-book-open-reader", title: "14. VEDIC Programs", fields: ["Program Name", "Department", "Target Audience", "No. of Participants", "Dates", "Location (Hyd/Blore)"] },
    placements: { icon: "fa-handshake", title: "15. Placements", fields: ["Company Name", "Department", "No. of Students Placed", "Package"] },
    mous: { icon: "fa-file-contract", title: "16. MoU's Signed", fields: ["Organization Name", "Date of Signing", "Validity", "Purpose"] },
    skillDevelopment: { icon: "fa-brain", title: "17. Skill Development Programs", fields: ["Program Name", "Faculty Coordinator", "Topic", "No. of Students", "No. of Sessions"] }
};

window.renderSidebar = function() {
    const sidebar = document.getElementById('sidebar-menu');
    sidebar.innerHTML = ''; 
    for (const [key, config] of Object.entries(sectionConfig)) {
        let shortTitle = config.title.split('.')[1].trim();
        sidebar.innerHTML += `
            <button onclick="selectSection('${key}')" id="btn-${key}" class="sidebar-item w-full text-left px-8 py-4 flex items-center justify-between group border-b v-border border-opacity-30 transition-colors duration-300 hover:bg-[rgba(var(--bg-rgb),0.5)] cursor-pointer">
                <div class="flex items-center gap-4 w-[85%]">
                    <i class="fa-solid ${config.icon} w-4 text-center text-[10px] v-text-muted transition-colors duration-300 group-hover:text-[var(--accent)]"></i>
                    <span class="text-[11px] font-bold uppercase tracking-wider truncate opacity-80" style="font-family: 'Space Mono', monospace;">${shortTitle}</span>
                </div>
                <i id="check-${key}" class="fa-solid fa-check text-[10px] opacity-0" style="color: var(--accent); transition: opacity 0.3s;"></i>
            </button>
        `;
    }
}

// ====== APP MODES ======
window.switchMode = function(mode) {
    const btnInput = document.getElementById('mode-input');
    const btnVault = document.getElementById('mode-vault');
    const viewInput = document.getElementById('input-mode');
    const viewVault = document.getElementById('vault-mode');

    if (mode === 'input') {
        btnInput.className = "v-btn px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest opacity-100 cursor-pointer";
        btnVault.className = "px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest v-text-muted border v-border hover:bg-[var(--surface)] transition cursor-pointer";
        viewInput.classList.remove('hidden'); viewVault.classList.add('hidden');
    } else {
        btnVault.className = "v-btn px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest opacity-100 cursor-pointer";
        btnInput.className = "px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest v-text-muted border v-border hover:bg-[var(--surface)] transition cursor-pointer";
        viewInput.classList.add('hidden'); viewVault.classList.remove('hidden');
        fetchAndRenderVault();
    }
}

window.selectSection = function(sectionKey) {
    switchMode('input');
    currentSectionKey = sectionKey;
    
    document.querySelectorAll('.sidebar-item').forEach(b => {
        b.style.backgroundColor = "transparent"; b.style.borderRight = "none";
        b.querySelector('span').style.opacity = "0.8"; b.querySelector('i').style.color = "var(--text-muted)";
    });
    
    const activeBtn = document.getElementById(`btn-${sectionKey}`);
    activeBtn.style.backgroundColor = "rgba(var(--bg-rgb), 0.5)";
    activeBtn.style.borderRight = "3px solid var(--accent)";
    activeBtn.querySelector('span').style.opacity = "1";
    activeBtn.querySelector('i').style.color = "var(--accent)";
    
    document.getElementById('welcome-screen').classList.add('hidden');
    const formContainer = document.getElementById('form-container');
    formContainer.classList.remove('hidden');
    
    const config = sectionConfig[sectionKey];
    document.getElementById('form-title').innerHTML = `<i class="fa-solid ${config.icon} mr-3" style="color: var(--accent);"></i> ${config.title}`;
    
    const formFields = document.getElementById('form-fields');
    formFields.innerHTML = ''; 

    config.fields.forEach((field) => {
        let inputType = field.toLowerCase().includes('date') ? 'date' : field.toLowerCase().includes('no.') ? 'number' : 'text';
        formFields.innerHTML += `
            <div class="flex flex-col group gsap-field">
                <label class="text-[10px] font-bold uppercase tracking-widest v-text-muted mb-2 group-focus-within:text-[var(--accent)] transition-colors" style="font-family: 'Space Mono', monospace;">${field}</label>
                <input type="${inputType}" name="${field}" placeholder="INPUT DATA..." required class="v-input w-full px-5 py-3 rounded-lg text-sm bg-[rgba(var(--bg-rgb),0.5)]">
            </div>
        `;
    });

    // The required tag is removed here. File upload is completely optional.
    formFields.innerHTML += `
        <div class="flex flex-col group gsap-field md:col-span-2 mt-2 pt-6 border-t v-border">
            <label class="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-3" style="font-family: 'Space Mono', monospace;"><i class="fa-solid fa-paperclip"></i> Attach File Evidence (Optional)</label>
            <input type="file" name="proofDocument" accept=".pdf,image/*" class="v-input w-full p-2 rounded-lg text-sm bg-[rgba(var(--bg-rgb),0.5)] cursor-pointer">
        </div>
    `;

    gsap.fromTo('.gsap-field', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" });
}

// ====== DATA SUBMISSION ======
window.submitData = async function(event) {
    event.preventDefault();
    if (!currentSectionKey) return;

    const formElement = document.getElementById('dynamic-form');
    const formData = new FormData(formElement);

    Swal.fire({ title: 'Encrypting...', background: '#111', color: '#fff', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    try {
        const response = await fetch(`${API_URL}/${currentSectionKey}`, { method: 'POST', body: formData, cache: 'no-store' });

        if (response.ok) {
            formElement.reset();
            completedSections.add(currentSectionKey);
            document.getElementById(`check-${currentSectionKey}`).classList.remove('opacity-0');
            document.getElementById('progress-text').innerText = `${completedSections.size} / 17`;
            document.getElementById('progress-bar').style.width = `${(completedSections.size / 17) * 100}%`;

            Swal.fire({
                title: 'Telemetry Logged', icon: 'success', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000,
                background: getComputedStyle(document.documentElement).getPropertyValue('--surface'), color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            });
        }
    } catch (error) {
        Swal.fire({ title: 'Upload Failed', text: 'Server disconnected.', icon: 'error', background: '#111', color: '#fff' });
    }
}

// ====== CACHE-BUSTING VAULT RENDER ======
window.fetchAndRenderVault = async function() {
    const container = document.getElementById('vault-content');
    container.innerHTML = `<p class="text-center v-text-muted py-10 animate-pulse font-mono">Querying Database...</p>`;

    try {
        // Appending timestamp to the URL forces the browser to skip the cache and pull fresh data
        const fetchUrl = `${API_URL}?t=${new Date().getTime()}`;
        const response = await fetch(fetchUrl, { 
            cache: 'no-store', 
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        const report = await response.json();
        const data = report.data;
        
        container.innerHTML = '';
        let totalRecords = 0;

        for (const [key, config] of Object.entries(sectionConfig)) {
            const sectionData = data[key];
            if (!sectionData || sectionData.length === 0) continue;

            totalRecords += sectionData.length;

            let html = `
            <div class="v-surface rounded-xl overflow-hidden shadow-lg border v-border vault-card">
                <div class="px-6 py-4 bg-black bg-opacity-20 border-b v-border flex justify-between items-center">
                    <h3 class="font-bold uppercase tracking-wider text-[var(--accent)]" style="font-family: 'Oswald', sans-serif;">${config.title}</h3>
                    <span class="text-xs font-mono v-text-muted bg-[var(--bg)] px-3 py-1 rounded-full border v-border">${sectionData.length} Records</span>
                </div>
                <div class="p-6 overflow-x-auto">
                    <table class="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr class="v-text-muted uppercase tracking-widest text-[10px] font-bold border-b v-border">
                                <th class="pb-3 px-4">Timestamp</th>`;
            
            config.fields.forEach(f => { html += `<th class="pb-3 px-4">${f}</th>`; });
            html += `<th class="pb-3 px-4 text-right">Attached Evidence</th></tr></thead><tbody class="divide-y v-border">`;

            sectionData.forEach(row => {
                html += `<tr class="hover:bg-black hover:bg-opacity-10 transition">
                            <td class="py-4 px-4 font-mono text-[10px] v-text-muted">${row.timestamp || 'N/A'}</td>`;
                
                config.fields.forEach(f => { html += `<td class="py-4 px-4">${row[f] || '-'}</td>`; });
                
                if (row.proofFile) {
                    const isImage = row.proofFile.match(/\.(jpeg|jpg|gif|png)$/i);
                    if (isImage) {
                        html += `<td class="py-2 px-4 text-right">
                            <a href="${SERVER_URL}${row.proofFile}" target="_blank">
                                <img src="${SERVER_URL}${row.proofFile}" class="h-12 w-20 object-cover rounded border v-border inline-block hover:scale-110 transition-transform shadow-lg cursor-hover">
                            </a>
                        </td>`;
                    } else {
                        html += `<td class="py-4 px-4 text-right">
                            <a href="${SERVER_URL}${row.proofFile}" target="_blank" class="text-[10px] border v-border text-[var(--text)] px-4 py-2 rounded font-bold hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition uppercase tracking-wider cursor-hover"><i class="fa-solid fa-file-pdf mr-1"></i> View PDF</a>
                        </td>`;
                    }
                } else {
                    html += `<td class="py-4 px-4 text-right"><span class="text-[10px] uppercase tracking-wider font-bold v-text-muted italic opacity-50 px-4 py-2 border border-transparent rounded">No File Attached</span></td>`;
                }
                html += `</tr>`;
            });

            html += `</tbody></table></div></div>`;
            container.innerHTML += html;
        }

        if (totalRecords === 0) {
            container.innerHTML = `<div class="v-surface p-12 text-center rounded-xl border v-border"><i class="fa-solid fa-server text-4xl mb-4 v-text-muted"></i><h3 class="text-xl font-bold uppercase" style="font-family: 'Oswald', sans-serif;">Vault is Empty</h3><p class="v-text-muted mt-2 text-sm font-mono">No telemetry data committed.</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-center py-10 font-mono">CRITICAL ERROR: Unable to access database.</p>`;
    }
}

// ====== PURGE & SEARCH ======
window.purgeSystem = async function() {
    Swal.fire({
        title: 'Initiate Purge?',
        text: "This will permanently delete all records and uploads.",
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Purge Data', background: '#111', color: '#fff'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // DELETE request with cache bypass
                await fetch('/api/purge', { method: 'DELETE', cache: 'no-store' });
                
                // Clear UI trackers
                completedSections.clear();
                document.querySelectorAll('.fa-check').forEach(i => i.classList.add('opacity-0'));
                document.getElementById('progress-text').innerText = `0 / 17`;
                document.getElementById('progress-bar').style.width = `0%`;
                
                // Instantly re-render vault empty state
                fetchAndRenderVault();
                
                Swal.fire({ title: 'Purged!', text: 'Database wiped.', icon: 'success', background: '#111', color: '#fff' });
            } catch(e) {
                Swal.fire({ title: 'Error', text: 'Could not contact server.', icon: 'error', background: '#111', color: '#fff' });
            }
        }
    });
}

window.filterVault = function() {
    const input = document.getElementById('vault-search').value.toLowerCase();
    const tables = document.querySelectorAll('.vault-card');
    tables.forEach(card => {
        let cardHasMatch = false;
        const rows = card.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (row.innerText.toLowerCase().includes(input)) { row.style.display = ''; cardHasMatch = true; } 
            else { row.style.display = 'none'; }
        });
        card.style.display = cardHasMatch ? '' : 'none';
    });
}

// ====== PDF COMPILATION ======
window.generateReportPDF = async function() {
    Swal.fire({ title: 'Compiling...', background: '#111', color: '#fff', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    try {
        const fetchUrl = `${API_URL}?t=${new Date().getTime()}`;
        const response = await fetch(fetchUrl, { cache: 'no-store' });
        const report = await response.json();
        const container = document.getElementById('report-tables');
        container.innerHTML = ''; 

        for (const [key, config] of Object.entries(sectionConfig)) {
            const sectionData = report.data[key];
            let html = `<div class="mb-6 page-break-inside-avoid"><h3 class="text-[14px] font-bold mb-1" style="color: black !important;">${config.title}</h3>`;
            
            if (!sectionData || sectionData.length === 0) {
                html += `<p class="italic" style="color: #666 !important; border: 1px solid black; padding: 4px; font-size: 11px;">Nil</p></div>`;
            } else {
                html += `<table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;"><thead><tr><th style="padding: 4px; width: 30px; text-align: center; border: 1px solid black; background-color: #e5e7eb !important; color: black !important;">S.No</th>`;
                config.fields.forEach(f => { html += `<th style="padding: 4px; border: 1px solid black; background-color: #e5e7eb !important; color: black !important;">${f}</th>`; });
                html += `</tr></thead><tbody>`;
                sectionData.forEach((row, i) => {
                    html += `<tr><td style="padding: 4px; text-align: center; font-weight: bold; border: 1px solid black; color: black !important;">${i + 1}</td>`;
                    config.fields.forEach(f => { html += `<td style="padding: 4px; border: 1px solid black; color: black !important;">${row[f] || '-'}</td>`; });
                    html += `</tr>`;
                });
                html += `</tbody></table></div>`;
            }
            container.innerHTML += html;
        }

        const element = document.getElementById('report-preview');
        element.classList.remove('hidden'); 

        await html2pdf().set({
            margin: 0.4, filename: 'BVRIT_Weekly_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'landscape' }
        }).from(element).save();
        
        element.classList.add('hidden'); 
        Swal.fire({ title: 'Export Complete', icon: 'success', background: '#111', color: '#fff' });
    } catch (error) {
        document.getElementById('report-preview').classList.add('hidden');
        Swal.fire({ title: 'Export Failed', icon: 'error', background: '#111', color: '#fff' });
    }
}
