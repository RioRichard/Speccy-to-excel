const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const getData = require('./get_data.js');

const app = new express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // const uploadsDir = path.join(__dirname, 'uploads');
        const uploadsDir = path.join(__dirname, 'uploads', req.timestamp.toString());
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.timestamp = getTimestamp();
    clearOldFolders(req.timestamp.toString());  // Xóa thư mục cũ hơn 5 phút
    next();  // Tiếp tục xử lý request
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/', upload.array('files', 999), async (req, res) => {
    await getData(req.timestamp.toString());
    res.download('output.xlsx');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// Hàm xóa thư mục cũ hơn 5 phút
function clearOldFolders(timestamp) {
    const now = Date.parse(timestamp);
    const folderPath = 'uploads/';

    fs.readdir(folderPath, (err, folders) => {
        if (err) throw err;

        folders.forEach(folder => {
            const folderTime = new Date(folder.substring(0, 8) + 'T' + folder.substring(9, 11) + ':' + folder.substring(11, 13) + ':' + folder.substring(13, 15));
            const diff = now - folderTime.getTime();

            if (diff > 60 * 1000) {
                fs.rm(path.join(folderPath, folder), { recursive: true, force: true }, (err) => {
                    if (err) throw err;
                    console.log(`Deleted folder: ${folder}`);
                });
            }
        });
    });
}