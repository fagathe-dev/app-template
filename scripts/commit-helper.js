#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get the current branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('Error getting current branch:', error.message);
    process.exit(1);
  }
}

/**
 * Parse branch name to extract type and issue number
 */
function parseBranchName(branchName) {
  // Handle different branch name formats:
  // Format 1: (us|archi|fix|docs)-numero_issue-description
  // Format 2: numero_issue-(us|archi|fix|docs)-description

  const parts = branchName.split('-');

  if (parts.length < 3) {
    console.error(`Invalid branch name format: ${branchName}`);
    console.error(
      'Expected format: (us|archi|fix|docs)-numero_issue-description or numero_issue-(us|archi|fix|docs)-description'
    );
    process.exit(1);
  }

  let type, issueNumber;

  // Check if first part is numeric (Format 2)
  if (/^\d+$/.test(parts[0])) {
    issueNumber = parts[0];
    type = parts[1];
  }
  // Check if first part is type (Format 1)
  else if (['us', 'fix', 'docs', 'archi'].includes(parts[0])) {
    type = parts[0];
    issueNumber = parts[1];
  }
  // Handle the current branch format: 175-archi-integrer-husky...
  else if (/^\d+$/.test(parts[0]) && parts.length >= 2) {
    issueNumber = parts[0];
    type = parts[1];
  } else {
    console.error(`Invalid branch name format: ${branchName}`);
    console.error(
      'Expected format: (us|archi|fix|docs)-numero_issue-description or numero_issue-(us|archi|fix|docs)-description'
    );
    process.exit(1);
  }

  // Validate issue number is numeric
  if (!/^\d+$/.test(issueNumber)) {
    console.error(`Invalid issue number: ${issueNumber}. Must be numeric.`);
    process.exit(1);
  }

  // Validate type
  if (!['us', 'fix', 'docs', 'archi'].includes(type)) {
    console.error(`Invalid branch type: ${type}`);
    console.error('Valid types: us, fix, docs, archi');
    process.exit(1);
  }

  return { type, issueNumber };
}

/**
 * Map branch type to commit type
 */
function mapTypeToCommitType(type) {
  const typeMapping = {
    us: 'feat',
    fix: 'fix',
    docs: 'docs',
    archi: 'chore',
  };

  const commitType = typeMapping[type];

  if (!commitType) {
    console.error(`Invalid branch type: ${type}`);
    console.error('Valid types: us, fix, docs, archi');
    process.exit(1);
  }

  return commitType;
}

/**
 * Check if message already follows conventional commit format
 */
function isConventionalFormat(message) {
  return /^(feat|fix|docs|chore)\(#\d+\): .+$/.test(message);
}

/**
 * Format commit message according to conventional commits
 */
function formatCommitMessage(commitType, issueNumber, description) {
  // Clean up description: remove leading/trailing whitespace and convert to lowercase
  const cleanDescription = description.trim().toLowerCase();

  // Ensure description starts with a verb in imperative form
  const formattedDescription =
    cleanDescription.startsWith('add') ||
    cleanDescription.startsWith('fix') ||
    cleanDescription.startsWith('update') ||
    cleanDescription.startsWith('remove') ||
    cleanDescription.startsWith('create') ||
    cleanDescription.startsWith('implement') ||
    cleanDescription.startsWith('configure') ||
    cleanDescription.startsWith('setup') ||
    cleanDescription.startsWith('improve') ||
    cleanDescription.startsWith('refactor')
      ? cleanDescription
      : cleanDescription;

  return `${commitType}(#${issueNumber}): ${formattedDescription}`;
}

/**
 * Main function to process commit message
 */
function processCommitMessage(commitMsgFile) {
  const branchName = getCurrentBranch();
  console.log(`Current branch: ${branchName}`);

  // Skip processing for main/master branches
  if (['main', 'master', 'develop'].includes(branchName)) {
    console.log('Skipping commit message formatting for main branch');
    return;
  }

  const { type, issueNumber } = parseBranchName(branchName);
  const commitType = mapTypeToCommitType(type);

  // Read the original commit message
  const originalMessage = fs.readFileSync(commitMsgFile, 'utf8').trim();

  console.log(`Original message: "${originalMessage}"`);

  // Check if message already follows convention
  if (isConventionalFormat(originalMessage)) {
    console.log('Commit message already follows conventional format');
    return;
  }

  // Format the commit message
  const formattedMessage = formatCommitMessage(commitType, issueNumber, originalMessage);

  console.log(`Formatted message: "${formattedMessage}"`);

  // Write the formatted message back to the file
  fs.writeFileSync(commitMsgFile, formattedMessage);
}

/**
 * Prepare commit message based on branch name
 */
function prepareCommitMessage(commitMsgFile) {
  const branchName = getCurrentBranch();

  // Skip processing for main/master branches
  if (['main', 'master', 'develop'].includes(branchName)) {
    return;
  }

  try {
    const { type, issueNumber } = parseBranchName(branchName);
    const commitType = mapTypeToCommitType(type);

    // Extract description from branch name
    const parts = branchName.split('-');
    let description;

    if (/^\d+$/.test(parts[0])) {
      // Format: 175-archi-integrer-husky...
      description = parts.slice(2).join(' ').replace(/[_]/g, ' ');
    } else {
      // Format: archi-175-integrer-husky...
      description = parts.slice(2).join(' ').replace(/[_]/g, ' ');
    }

    // Check if commit message file is empty or contains default message
    const content = fs.readFileSync(commitMsgFile, 'utf8');

    if (!content.trim() || content.includes('Please enter the commit message')) {
      // Suggest commit message based on branch name
      const suggestedMessage = `${commitType}(#${issueNumber}): ${description}`;

      const messageContent = [
        suggestedMessage,
        '',
        `# Conventional commit message auto-generated from branch: ${branchName}`,
        '# Edit the description above as needed',
        '# Format: type(#issue): description',
        '#',
        '# Types: feat, fix, docs, chore',
        '# Use imperative mood (add, fix, update, etc.)',
      ].join('\n');

      fs.writeFileSync(commitMsgFile, messageContent);
    }
  } catch (error) {
    // Silently fail for invalid branch names in prepare phase
    return;
  }
}
function showGitStatus() {
  try {
    console.log('\n=== Git Status ===');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (!status.trim()) {
      console.log('No changes detected');
      return;
    }

    console.log('Modified files:');
    const lines = status.trim().split('\n');
    lines.forEach((line) => {
      const status = line.substring(0, 2);
      const file = line.substring(3);

      switch (status.trim()) {
        case 'M':
          console.log(`  Modified: ${file}`);
          break;
        case 'A':
          console.log(`  Added: ${file}`);
          break;
        case 'D':
          console.log(`  Deleted: ${file}`);
          break;
        case '??':
          console.log(`  Untracked: ${file}`);
          break;
        case 'MM':
          console.log(`  Modified (staged and unstaged): ${file}`);
          break;
        default:
          console.log(`  ${status}: ${file}`);
      }
    });

    console.log('\nSuggestion: Use "git add ." to add all files or "git add <file>" for specific files');
  } catch (error) {
    console.error('Error getting git status:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'prepare-message':
      if (!args[1]) {
        console.error('Usage: commit-helper.js prepare-message <commit-msg-file>');
        process.exit(1);
      }
      prepareCommitMessage(args[1]);
      break;

    case 'process-message':
      if (!args[1]) {
        console.error('Usage: commit-helper.js process-message <commit-msg-file>');
        process.exit(1);
      }
      processCommitMessage(args[1]);
      break;

    case 'status':
      showGitStatus();
      break;

    case 'validate-branch':
      const branchName = getCurrentBranch();
      try {
        const { type, issueNumber } = parseBranchName(branchName);
        const commitType = mapTypeToCommitType(type);
        console.log(`Valid branch: ${branchName} -> ${commitType}(#${issueNumber})`);
      } catch (error) {
        console.error('Invalid branch name');
        process.exit(1);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  commit-helper.js prepare-message <commit-msg-file>');
      console.log('  commit-helper.js process-message <commit-msg-file>');
      console.log('  commit-helper.js status');
      console.log('  commit-helper.js validate-branch');
      process.exit(1);
  }
}

module.exports = {
  getCurrentBranch,
  parseBranchName,
  mapTypeToCommitType,
  isConventionalFormat,
  formatCommitMessage,
  prepareCommitMessage,
  processCommitMessage,
  showGitStatus,
};
