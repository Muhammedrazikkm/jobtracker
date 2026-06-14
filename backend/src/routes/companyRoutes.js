const express = require('express');
const { uploadSheet, getCompanies, deleteAllCompanies, updateCompany, deleteCompany, syncSheets, addCompany, resetAllFirstStatus } = require('../controllers/companyController');

const router = express.Router();

router.post('/', addCompany);
router.post('/upload', uploadSheet);
router.post('/sync', syncSheets);
router.get('/reset-first', resetAllFirstStatus); // Easy browser URL trigger
router.get('/', getCompanies);
router.delete('/all', deleteAllCompanies);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;
