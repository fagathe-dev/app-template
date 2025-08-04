#!/usr/bin/env node

const { execSync } = require('child_process');
const { getCurrentBranch, parseBranchName, mapTypeToCommitType, formatCommitMessage } = require('./commit-helper');

console.log('🚀 Commit Workflow Demo\n');

// Show current branch analysis
try {
  const currentBranch = getCurrentBranch();
  console.log(`📋 Current Branch: ${currentBranch}`);

  if (['main', 'master', 'develop'].includes(currentBranch)) {
    console.log('ℹ️  Main branch detected - commit workflow will be skipped\n');
  } else {
    const { type, issueNumber } = parseBranchName(currentBranch);
    const commitType = mapTypeToCommitType(type);

    console.log(`✅ Branch Analysis:`);
    console.log(`   Type: ${type} → ${commitType}`);
    console.log(`   Issue: #${issueNumber}`);
    console.log(`   Format: ${commitType}(#${issueNumber}): <description>\n`);
  }
} catch (error) {
  console.log(`❌ Current branch doesn't follow expected format\n`);
}

// Show examples
console.log('📝 Branch Format Examples:');
const examples = [
  'us-123-add-user-authentication',
  'fix-456-resolve-login-error',
  'docs-789-update-api-documentation',
  'archi-101-setup-docker-environment',
  '83-us-update-user-roles',
  '456-fix-database-connection',
];

examples.forEach((branch) => {
  try {
    const { type, issueNumber } = parseBranchName(branch);
    const commitType = mapTypeToCommitType(type);
    const exampleMessage = formatCommitMessage(commitType, issueNumber, 'example commit description');
    console.log(`   ${branch} → ${exampleMessage}`);
  } catch (error) {
    console.log(`   ${branch} → ❌ Invalid format`);
  }
});

console.log('\n🛠️  Available Commands:');
console.log('   npm run commit:status    - Show git status');
console.log('   npm run commit:validate  - Validate current branch');
console.log('   npm run commit:help      - Show workflow help');
console.log('   node scripts/commit-helper.js status - Direct status check');

console.log('\n📚 Workflow Steps:');
console.log('1. Create branch: git checkout -b us-123-feature-description');
console.log('2. Make changes and stage: git add .');
console.log('3. Commit: git commit -m "your description"');
console.log('4. Message auto-formatted to: feat(#123): your description');

// Show git status if in a git repository
try {
  console.log('\n📊 Current Git Status:');
  execSync('git status --porcelain', { stdio: 'inherit' });
} catch (error) {
  console.log('   No git repository or no changes');
}

console.log('\n✨ Ready to commit with conventional format!');
