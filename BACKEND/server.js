const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Global Cache-Control Headers to prevent browser caching
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(cors());
app.use(express.json());

// 1. Secure File Storage Initialization
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Vanguard In-Memory Core
let database = {
    generalPoints: [], facultyJoinedRelieved: [], facultyAchievements: [],
    studentAchievements: [], departmentAchievements: [], facultyEvents: [],
    studentEvents: [], nonTechnicalEvents: [], industryVisits: [],
    hackathons: [], facultyFDP: [], facultyVisits: [], patents: [],
    vedicPrograms: [], placements: [], mous: [], skillDevelopment: []
};

// 3. API ROUTES
app.get('/api/report', (req, res) => {
    res.json({ status: "success", data: database });
});

// The upload.single middleware won't crash if the file is missing
app.post('/api/report/:section', upload.single('proofDocument'), (req, res) => {
    const section = req.params.section;
    if (!database[section]) return res.status(400).json({ error: "Invalid System Module." });

    const recordData = { ...req.body };
    const newEntry = { 
        id: Date.now().toString(), 
        timestamp: new Date().toLocaleString(),
        ...recordData 
    };

    // Safely handle optional files
    if (req.file) newEntry.proofFile = `/uploads/${req.file.filename}`;
    else newEntry.proofFile = null;

    database[section].push(newEntry);
    console.log(`[LOGGED] ${section} | Fields: ${Object.keys(recordData).length} | File: ${req.file ? 'YES' : 'NO'}`);
    res.status(201).json({ message: `Success`, entry: newEntry });
});

// ABSOLUTE PURGE ROUTE
app.delete('/api/purge', (req, res) => {
    for (let key in database) {
        database[key] = [];
    }
    
    if (fs.existsSync(uploadDir)) {
        fs.readdir(uploadDir, (err, files) => {
            if (!err) {
                for (const file of files) {
                    fs.unlink(path.join(uploadDir, file), () => {});
                }
            }
        });
    }
    
    console.log(`[SYSTEM PURGED] All telemetry and files wiped successfully.`);
    res.json({ message: "Wiped clean." });
});

app.listen(PORT, () => {
    console.log(`\n=============================================`);
    console.log(`🚀 VANGUARD ENGINE SECURE SERVER RUNNING`);
    console.log(`📡 Port: ${PORT} | Caching: DISABLED`);
    console.log(`=============================================\n`);
});