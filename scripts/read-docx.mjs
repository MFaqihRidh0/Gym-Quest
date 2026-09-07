import fs from 'node:fs';
import zlib from 'node:zlib';

// Simple docx reader: read zip central directory or use buffer to find 'word/document.xml'
const buffer = fs.readFileSync('Guidebook_GAYATAMA_5_Web_Technology.docx');

// Search for 'word/document.xml' in zip
const needle = Buffer.from('word/document.xml');
let index = buffer.indexOf(needle);

if (index === -1) {
  console.log('word/document.xml not found');
  process.exit(1);
}

// Find local file header before this needle
// In zip, local file header signature is 0x04034b50 (PK\x03\x04)
let headerPos = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), index);
if (headerPos !== -1) {
  const compressionMethod = buffer.readUInt16LE(headerPos + 8);
  const compressedSize = buffer.readUInt32LE(headerPos + 18);
  const uncompressedSize = buffer.readUInt32LE(headerPos + 22);
  const fileNameLength = buffer.readUInt16LE(headerPos + 26);
  const extraFieldLength = buffer.readUInt16LE(headerPos + 28);
  
  const dataStart = headerPos + 30 + fileNameLength + extraFieldLength;
  const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
  
  let xmlData;
  if (compressionMethod === 8) {
    xmlData = zlib.inflateRawSync(compressedData).toString('utf8');
  } else {
    xmlData = compressedData.toString('utf8');
  }
  
  // Strip XML tags to get clean text with paragraphs
  const clean = xmlData
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n');
    
  fs.writeFileSync('guidebook_content.txt', clean, 'utf8');
  console.log('Successfully written guidebook_content.txt, length:', clean.length);
}
