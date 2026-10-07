const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  // Content and PDF assets are read at runtime from dynamic paths. Keep their
  // deployment bundle explicit instead of tracing the entire repository.
  outputFileTracingIncludes: {
    '/*': ['../backend/project-descriptions/knowledge/**/*', '../backend/project-descriptions/kyle-profile.md', '../backend/project-descriptions/*.txt', './public/brief/**/*', './public/Kyle-Anthony_Resume.pdf'],
  },
};

module.exports = nextConfig;
