// release.config.js
module.exports = {
	branches: ['main'], // release from main branch
	repositoryUrl: 'https://github.com/Shko-Online/ManagedIdentityWizardPPTB.git',
	plugins: [
		'@semantic-release/commit-analyzer',
		'@semantic-release/release-notes-generator',
		'@semantic-release/npm',
		'@semantic-release/github'
	]
};