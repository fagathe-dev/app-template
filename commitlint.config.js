module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Limit allowed types to match our branch naming convention
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore']],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Require scope (will contain issue number)
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],

    // Subject requirements
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],

    // Optional: limit header length
    'header-max-length': [2, 'always', 100],
  },
  defaultIgnores: true,
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
