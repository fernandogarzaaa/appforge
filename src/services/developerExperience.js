export const DeveloperExperienceService = {
  listCommands() {
    return [
      'appforge init',
      'appforge deploy',
      'appforge analyze --incident-id=123',
      'appforge export --format=pdf',
    ];
  },

  listSdks() {
    return [
      { language: 'JavaScript', package: '@appforge/sdk' },
      { language: 'Python', package: 'appforge-python' },
    ];
  },
};
