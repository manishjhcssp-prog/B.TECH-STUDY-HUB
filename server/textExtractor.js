const fs = require('fs');
const path = require('path');

async function extractTextFromFile(filePath, fileType) {
  try {
    const ext = (fileType || path.extname(filePath).replace('.', '')).toLowerCase();

    // Plain text formats
    if (['txt', 'md', 'csv', 'json', 'js', 'py', 'java', 'c', 'cpp', 'html', 'css', 'xml'].includes(ext)) {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content.slice(0, 100000); // limit to first 100k chars for fast indexing
    }

    // PDF extraction
    if (ext === 'pdf') {
      try {
        const { PDFParse } = require('pdf-parse');
        const dataBuffer = await fs.promises.readFile(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        await parser.load();
        const res = await parser.getText();
        const extracted = res && res.text ? res.text : (typeof res === 'string' ? res : '');
        return extracted.slice(0, 100000);
      } catch (err) {
        console.warn(`PDF parse error for ${filePath}:`, err.message);
        return '';
      }
    }

    // DOCX extraction
    if (ext === 'docx') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return (result.value || '').slice(0, 100000);
      } catch (err) {
        console.warn(`DOCX parse error for ${filePath}:`, err.message);
        return '';
      }
    }

    return '';
  } catch (error) {
    console.warn(`Text extraction error on ${filePath}:`, error.message);
    return '';
  }
}

module.exports = {
  extractTextFromFile
};
