const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'uploads/products/'
    fs.mkdirSync(folder, { recursive: true })
    cb(null, folder)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only images allowed!'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
})

module.exports = upload