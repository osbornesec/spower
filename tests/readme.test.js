const { describe, it, expect, beforeAll } = require('vitest');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

describe('README.md Validation', () => {
  let readmeContent;
  let readmeLines;

  beforeAll(() => {
    const readmePath = resolve(__dirname, '../README.md');
    readmeContent = readFileSync(readmePath, 'utf-8');
    readmeLines = readmeContent.split('\n');
  });

  describe('Structure and Required Sections', () => {
    it('should have a title header', () => {
      expect(readmeContent).toMatch(/^# /m);
      expect(readmeContent).toContain('# Superpowers for Twitter (spower)');
    });

    it('should contain all required sections', () => {
      const requiredSections = [
        'Features',
        'Project Layout',
        'Get Started Quickly',
        'Permissions & Runtime Behavior',
        'Testing & Tooling',
        'Development Workflow',
        'Troubleshooting',
        'Contributing & Support',
        'License',
        'Assumptions & Future Work',
      ];

      requiredSections.forEach((section) => {
        expect(readmeContent).toContain(`## ${section}`);
      });
    });

    it('should have badges at the top', () => {
      const badges = [
        'https://img.shields.io/badge/license-ISC-brightgreen',
        'https://img.shields.io/badge/node-%E2%89%A518.x-blue',
        'https://img.shields.io/badge/tests-vitest-purple',
      ];

      badges.forEach((badge) => {
        expect(readmeContent).toContain(badge);
      });
    });

    it('should have a project layout code block', () => {
      expect(readmeContent).toMatch(/```text[\s\S]*?app\.js[\s\S]*?```/);
    });
  });

  describe('Getting Started Instructions', () => {
    it('should provide clone command with correct repository URL', () => {
      expect(readmeContent).toContain('git clone https://github.com/osbornesec/spower.git');
    });

    it('should include all required npm commands', () => {
      const commands = ['npm install', 'npm test', 'npm run build', 'npm run build:content:watch', 'npm run test:coverage'];

      commands.forEach((cmd) => {
        expect(readmeContent).toContain(cmd);
      });
    });

    it('should provide Chrome extension loading instructions', () => {
      expect(readmeContent).toContain('chrome://extensions');
      expect(readmeContent).toContain('Developer mode');
      expect(readmeContent).toContain('Load unpacked');
    });

    it('should have numbered steps in Get Started section', () => {
      const getStartedSection = readmeContent.match(/## Get Started Quickly([\s\S]*?)## /);
      expect(getStartedSection).toBeTruthy();
      expect(getStartedSection[1]).toMatch(/1\./);
      expect(getStartedSection[1]).toMatch(/2\./);
      expect(getStartedSection[1]).toMatch(/3\./);
      expect(getStartedSection[1]).toMatch(/4\./);
      expect(getStartedSection[1]).toMatch(/5\./);
    });
  });

  describe('File References Validation', () => {
    it('should reference existing core files', () => {
      const coreFiles = [
        'app.js',
        'dist/content.js',
        'options.html',
        'options.js',
        'options.css',
        'manifest.json',
        'package.json',
        'vitest.config.js',
        'AGENTS.md',
        'LICENSE',
      ];

      coreFiles.forEach((file) => {
        expect(readmeContent).toContain(file);
      });
    });

    it('should reference existing documentation files', () => {
      const docFiles = ['docs/TESTING.md', 'docs/ARCHITECTURE.md', 'docs/CONTRIBUTING.md', 'docs/SECURITY.md'];

      docFiles.forEach((file) => {
        expect(readmeContent).toContain(file);
      });
    });

    it('should reference existing directories', () => {
      const directories = ['src/shared/', 'images/', 'docs/', 'tests/'];

      directories.forEach((dir) => {
        expect(readmeContent).toContain(dir);
      });
    });
  });

  describe('Technical Accuracy', () => {
    it('should mention correct testing framework', () => {
      expect(readmeContent).toContain('Vitest');
      expect(readmeContent).toContain('vitest.dev');
    });

    it('should specify correct Node.js version requirement', () => {
      expect(readmeContent).toMatch(/Node.*18/i);
    });

    it('should reference correct testing libraries', () => {
      expect(readmeContent).toContain('@testing-library/dom');
      expect(readmeContent).toContain('@testing-library/jest-dom');
    });

    it('should mention jsdom environment', () => {
      expect(readmeContent).toContain('jsdom');
    });

    it('should specify MV3 manifest version', () => {
      expect(readmeContent).toContain('MV3');
    });

    it('should reference Chrome storage APIs correctly', () => {
      expect(readmeContent).toContain('chrome.storage.sync');
      expect(readmeContent).toContain('chrome.storage.local');
    });
  });

  describe('Permissions Documentation', () => {
    it('should document storage permissions', () => {
      expect(readmeContent).toContain('storage');
      expect(readmeContent).toContain('unlimitedStorage');
    });

    it('should have a permissions table', () => {
      expect(readmeContent).toMatch(/\|\s*Permission\s*\|\s*Why it is needed\s*\|/);
    });

    it('should explain content script target', () => {
      expect(readmeContent).toContain('https://x.com/*');
      expect(readmeContent).toContain('document_end');
    });

    it('should mention web-accessible resources', () => {
      expect(readmeContent).toContain('web-accessible resource');
    });
  });

  describe('Features Documentation', () => {
    it('should list all main features', () => {
      const features = ['Autopilot actions', 'Runtime telemetry', 'Configurable UI', 'In-app promotions', 'Unlocked feature set'];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should mention key automation capabilities', () => {
      const capabilities = ['follow', 'unfollow', 'like', 'retweet'];

      capabilities.forEach((capability) => {
        expect(readmeContent.toLowerCase()).toContain(capability);
      });
    });
  });

  describe('Troubleshooting Section', () => {
    it('should provide common troubleshooting scenarios', () => {
      expect(readmeContent).toContain('Extension fails to load');
      expect(readmeContent).toContain('Tests hang');
      expect(readmeContent).toContain('Settings not persisting');
    });

    it('should reference chrome.runtime.lastError for debugging', () => {
      expect(readmeContent).toContain('chrome.runtime.lastError');
    });

    it('should mention fake timers in testing context', () => {
      expect(readmeContent).toContain('fake timers');
    });
  });

  describe('License Information', () => {
    it('should specify ISC license', () => {
      expect(readmeContent).toContain('ISC License');
    });

    it('should link to LICENSE file', () => {
      expect(readmeContent).toMatch(/\[ISC License\]\(LICENSE\)/);
    });
  });

  describe('Code Block Syntax', () => {
    it('should have properly formatted bash code blocks', () => {
      const bashBlocks = readmeContent.match(/```bash/g);
      expect(bashBlocks).toBeTruthy();
      expect(bashBlocks.length).toBeGreaterThan(0);
    });

    it('should have properly closed code blocks', () => {
      const openBlocks = (readmeContent.match(/```/g) || []).length;
      expect(openBlocks % 2).toBe(0);
    });

    it('should have text layout code block', () => {
      expect(readmeContent).toContain('```text');
    });
  });

  describe('Links and References', () => {
    it('should have valid markdown link syntax', () => {
      const links = readmeContent.match(/\[.*?\]\(.*?\)/g);
      expect(links).toBeTruthy();
      expect(links.length).toBeGreaterThan(0);
    });

    it('should reference GitHub repository correctly', () => {
      expect(readmeContent).toContain('github.com/osbornesec/spower');
    });

    it('should link to vitest.dev', () => {
      expect(readmeContent).toContain('vitest.dev');
    });

    it('should not have broken internal file links', () => {
      const internalLinks = readmeContent.match(/\[.*?\]\((?!http)([^)]+)\)/g) || [];

      internalLinks.forEach((link) => {
        const path = link.match(/\(([^)]+)\)/)[1];

        if (path.startsWith('#')) return;

        if (!path.startsWith('http')) {
          const fullPath = resolve(__dirname, '..', path);
          expect(existsSync(fullPath)).toBe(true);
        }
      });
    });
  });

  describe('Markdown Formatting', () => {
    it('should use consistent heading levels', () => {
      const h1Count = (readmeContent.match(/^# /gm) || []).length;
      const h2Count = (readmeContent.match(/^## /gm) || []).length;

      expect(h1Count).toBe(1);
      expect(h2Count).toBeGreaterThan(5);
    });

    it('should use proper list formatting', () => {
      expect(readmeContent).toMatch(/^\s*[-*]\s+/m);
    });

    it('should have consistent bullet point style', () => {
      const bulletPoints = readmeContent.match(/^\s*[-*]\s+/gm) || [];
      expect(bulletPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Content Completeness', () => {
    it('should not have TODO or placeholder content', () => {
      expect(readmeContent.toLowerCase()).not.toContain('todo');
      expect(readmeContent.toLowerCase()).not.toContain('tbd');
      expect(readmeContent.toLowerCase()).not.toContain('coming soon');
    });

    it('should have sufficient detail in each major section', () => {
      const sections = readmeContent.split(/^## /m).slice(1);

      sections.forEach((section) => {
        expect(section.trim().length).toBeGreaterThan(50);
      });
    });

    it('should mention key technical components', () => {
      const components = ['XMLHttpRequest', 'Chrome storage', 'Content script', 'Background', 'Options page'];

      components.forEach((component) => {
        expect(readmeContent).toContain(component);
      });
    });
  });

  describe('Development Information', () => {
    it('should provide watch mode command', () => {
      expect(readmeContent).toContain('build:content:watch');
    });

    it('should mention coverage reporting', () => {
      expect(readmeContent).toContain('Coverage');
      expect(readmeContent).toContain('V8 provider');
    });

    it('should reference contributing guidelines', () => {
      expect(readmeContent).toContain('CONTRIBUTING.md');
    });

    it('should mention security reporting', () => {
      expect(readmeContent).toContain('SECURITY.md');
    });
  });

  describe('Assumptions and Limitations', () => {
    it('should document browser compatibility assumptions', () => {
      expect(readmeContent).toContain('Chrome/Chromium');
      expect(readmeContent).toContain('Firefox compatibility is not validated');
    });

    it('should mention future work', () => {
      const futureWorkSection = readmeContent.match(/## Assumptions & Future Work([\s\S]*?)($|## )/);
      expect(futureWorkSection).toBeTruthy();
      expect(futureWorkSection[1].trim().length).toBeGreaterThan(100);
    });
  });

  describe('Line Length and Readability', () => {
    it('should not have excessively long lines', () => {
      const longLines = readmeLines.filter((line) => {
        if (line.trim().startsWith('```')) return false;
        if (line.includes('http')) return false;
        return line.length > 120;
      });

      expect(longLines.length, `Found ${longLines.length} lines exceeding 120 characters`).toBeLessThan(5);
    });

    it('should have proper spacing between sections', () => {
      const sectionHeaders = readmeContent.match(/^## .+$/gm) || [];

      sectionHeaders.forEach((header, index) => {
        if (index > 0) {
          const prevSectionEnd = readmeContent.indexOf(sectionHeaders[index - 1]);
          const currentSectionStart = readmeContent.indexOf(header);
          const betweenContent = readmeContent.substring(prevSectionEnd, currentSectionStart);

          expect(betweenContent.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });
});