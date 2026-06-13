const express = require('express');
const { createTemplate, getTemplates, deleteTemplate, updateTemplate } = require('../controllers/templateController');

const router = express.Router();

router.post('/', createTemplate);
router.get('/', getTemplates);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;
