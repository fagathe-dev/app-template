#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Commit Workflow Implementation\n');

// Test 1: Validate current branch
console.log('1. Testing branch validation...');
try {
  const result = execSync('node scripts/commit-helper.js validate-branch', { encoding: 'utf8' });
  console.log('   ✅ Branch validation:', result.trim());
} catch (error) {
  console.log('   ❌ Branch validation failed:', error.message);
}

// Test 2: Test git status
console.log('\n2. Testing git status...');
try {
  execSync('node scripts/commit-helper.js status', { stdio: 'inherit' });
  console.log('   ✅ Git status working');
} catch (error) {
  console.log('   ❌ Git status failed:', error.message);
}

// Test 3: Test commit message processing
console.log('\n3. Testing commit message processing...');
try {
  // Create a temporary commit message file
  const tempFile = path.join(__dirname, 'test-commit-msg.tmp');
  fs.writeFileSync(tempFile, 'add user authentication system');

  execSync(`node scripts/commit-helper.js process-message "${tempFile}"`, { encoding: 'utf8' });

  const processedMessage = fs.readFileSync(tempFile, 'utf8');
  console.log('   ✅ Original: "add user authentication system"');
  console.log(`   ✅ Processed: "${processedMessage.trim()}"`);

  // Clean up
  fs.unlinkSync(tempFile);
} catch (error) {
  console.log('   ❌ Message processing failed:', error.message);
}

// Test 4: Test prepare message
console.log('\n4. Testing prepare commit message...');
try {
  const tempFile = path.join(__dirname, 'test-prepare-msg.tmp');
  fs.writeFileSync(tempFile, '');

  execSync(`node scripts/commit-helper.js prepare-message "${tempFile}"`, { encoding: 'utf8' });

  const preparedMessage = fs.readFileSync(tempFile, 'utf8');
  console.log('   ✅ Prepared message preview:');
  console.log('   ' + preparedMessage.split('\n')[0]);

  // Clean up
  fs.unlinkSync(tempFile);
} catch (error) {
  console.log('   ❌ Prepare message failed:', error.message);
}

// Test 5: Test commitlint configuration
console.log('\n5. Testing commitlint configuration...');
try {
  // Test valid conventional commit
  const testMessage = 'chore(#175): setup automated commit workflow';
  const tempFile = path.join(__dirname, 'test-commitlint.tmp');
  fs.writeFileSync(tempFile, testMessage);

  execSync(`npx commitlint --edit "${tempFile}"`, { encoding: 'utf8' });
  console.log('   ✅ Commitlint validation passed');

  // Clean up
  fs.unlinkSync(tempFile);
} catch (error) {
  console.log('   ❌ Commitlint validation failed:', error.message);
}

// Test 6: Check Husky hooks
console.log('\n6. Checking Husky hooks...');
const hooks = ['commit-msg', 'pre-commit', 'prepare-commit-msg'];
hooks.forEach((hook) => {
  const hookPath = `.husky/${hook}`;
  if (fs.existsSync(hookPath)) {
    const isExecutable = (fs.statSync(hookPath).mode & 0o111) !== 0;
    console.log(`   ${isExecutable ? '✅' : '❌'} ${hook}: ${isExecutable ? 'executable' : 'not executable'}`);
  } else {
    console.log(`   ❌ ${hook}: not found`);
  }
});

// Test 7: Check package.json scripts
console.log('\n7. Checking npm scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expectedScripts = ['commit:status', 'commit:validate', 'commit:help'];
expectedScripts.forEach((script) => {
  if (packageJson.scripts[script]) {
    console.log(`   ✅ ${script}: available`);
  } else {
    console.log(`   ❌ ${script}: missing`);
  }
});

console.log('\n🎉 Commit workflow testing complete!');
console.log('\nNext steps:');
console.log('1. Add your changes: git add .');
console.log('2. Test the full workflow: git commit -m "test commit message"');
console.log('3. The message will be auto-formatted to: chore(#175): test commit message');
