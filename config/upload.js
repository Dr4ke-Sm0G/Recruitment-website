const multer = require('multer');
const uuid = require('uuid');
const fs = require('fs');

const STORAGE_LOCATION = './uploads/';

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      cb(null, STORAGE_LOCATION);
    },

    filename: function (req, file, cb) {
        // Using uuid to ensure file uniqueness.
        const name = uuid.v4();
        file.uuid = name;
        cb(null, name);
    },

    fileFilter: function(req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(null, false);
        }
    }
});

module.exports = {
    'storage': storage,
    'location': STORAGE_LOCATION,

    createStorageFolder: function() {

        if (!fs.existsSync(STORAGE_LOCATION)) {
            fs.mkdirSync(STORAGE_LOCATION);
        }
    }
};