/* jshint node:true */
const glob = require('glob');
const sass = require('node-sass');

// variables
const sourceFolderRelPath = 'src';
const destFolderRelPath = 'assets';

// add js files here if necessary
const sourceJsFiles = [
	`${sourceFolderRelPath}/**/*.js`,
];

// methods
const getFilePaths = (pathArr) => {
	let filePaths = [];
	for (let path of pathArr) {
		const files =  glob.sync(path);
		filePaths = filePaths.concat(files);
	}
	return filePaths;
};

const getFilesPathObjects = (pathArr) => {
	const filesPathsObjs = [];
	for (let path of pathArr) {
		const src = path;
		const dest = path.replace(sourceFolderRelPath, destFolderRelPath);
		filesPathsObjs.push({src, dest});
	}
	return filesPathsObjs;
};

const jsFilesPaths = getFilePaths(sourceJsFiles);
const jsFilesPathsObjs = getFilesPathObjects(jsFilesPaths);

/**
 * Returns an object with destinations as key and sources as value
 * @param filesPathsObjs
 * @returns {}
 */
const buildFileConfiguration = (filesPathsObjs) => {
	let fileConfig = {};
	for (let pathObj of filesPathsObjs) {
		fileConfig[pathObj.dest] = pathObj.src;
	}
	return fileConfig;
};

module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig({

		// JavaScript linting with JSHint.
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: jsFilesPaths.concat('Gruntfile.js')
		},

		browserify: {
			dist: {
				files: buildFileConfiguration(jsFilesPathsObjs)
			},
			options: {
				transform: [['babelify', {
					presets: [
						'@wordpress/babel-preset-default',
					]
				}]],
				browserifyOptions: {
					debug: true
				}
			}
		},

		// Minify .js files.
		uglify: {
			options: {
				preserveComments: 'some',
				sourceMap: true
			},
			main: {
				files: [{
					expand: true,
					src: jsFilesPathsObjs.map(file => file.dest),
					dest: './',
					ext: '.min.js',
					extDot: 'last',
				}]
			}
		},

		// Compile all .scss files.
		sass: {

			dist: {
				options: {
					require: 'susy',
					implementation: sass,
					sourceMap: true,
					includePaths: ['node_modules/susy/sass'].concat( require( 'node-bourbon' ).includePaths )
				},
				files: [
					{
						expand: true,
						cwd: `${sourceFolderRelPath}/scss`,
						src: ['**/*.scss'],
						dest: `${destFolderRelPath}/css`,
						ext: '.css',
						extDot: 'last',
					},
				],
			},

		},

		postcss: {
			options: {
				map: true,
				processors: [
					require('autoprefixer')
				]
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: `${destFolderRelPath}/css`,
						src: ['**/*.css'],
						dest: `${destFolderRelPath}/css`,
						ext: '.css',
						extDot: 'last',
					},
				]
			}
		},

		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: `${destFolderRelPath}/css`,
					src: ['**/*.css', '!**/*.min.css'],
					dest: `${destFolderRelPath}/css`,
					ext: '.min.css',
					extDot: 'last',
				}]
			}
		},

		// Watch changes for assets.
		watch: {
			css: {
				files: [
					`${sourceFolderRelPath}/scss/**/*.scss`
				],
				tasks: [
					'css'
				]
			},
			js: {
				files: jsFilesPaths,
				tasks: ['js']
			}
		},

		// Generate POT files.
		makepot: {
			options: {
				type: 'wp-plugin',
				domainPath: 'languages',
				potHeaders: {
					'report-msgid-bugs-to': 'https://wordpress.org/support/plugin/storefront-product-sharing/',
					'language-team': 'LANGUAGE <EMAIL@ADDRESS>'
				}
			},
			frontend: {
				options: {
					potFilename: 'storefront-product-sharing.pot',
					exclude: [
						'node_modules/.*'
					]
				}
			}
		},

		// Check textdomain errors.
		checktextdomain: {
			options:{
				text_domain: 'storefront-product-sharing',
				keywords: [
					'__:1,2d',
					'_e:1,2d',
					'_x:1,2c,3d',
					'esc_html__:1,2d',
					'esc_html_e:1,2d',
					'esc_html_x:1,2c,3d',
					'esc_attr__:1,2d',
					'esc_attr_e:1,2d',
					'esc_attr_x:1,2c,3d',
					'_ex:1,2c,3d',
					'_n:1,2,4d',
					'_nx:1,2,4c,5d',
					'_n_noop:1,2,3d',
					'_nx_noop:1,2,3c,4d'
				]
			},
			files: {
				src:  [
					'**/*.php', // Include all files
					'!node_modules/**' // Exclude node_modules/
				],
				expand: true
			}
		},

		// Sass linting with Stylelint.
		stylelint: {
			options: {
				configFile: '.stylelintrc'
			},
			all: [
				'src/**/*.scss'
			]
		},

		compress: {
			zip: {
				options: {
					archive: './storefront-product-sharing.zip',
					mode: 'zip'
				},
				files: [{
					src: [
						'**',
						'.htaccess',
						'!.*/**',
						'!*.md',
						'!.DS_Store',
						'!composer.json',
						'!composer.lock',
						'!Gruntfile.js',
						'!node_modules/**',
						'!npm-debug.log',
						'!package.json',
						'!package-lock.json',
						'!phpcs.xml',
						'!storefront-product-sharing.zip',
						'!storefront-product-sharing/**',
						'!vendor/**',
						'!src/**'
					]
				}]
			}
		},

	});

	// Load NPM tasks to be used here
	grunt.loadNpmTasks( 'grunt-browserify' );
	grunt.loadNpmTasks( 'grunt-checktextdomain' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-postcss' );
	grunt.loadNpmTasks( 'grunt-sass' );
	grunt.loadNpmTasks( 'grunt-stylelint' );
	grunt.loadNpmTasks( 'grunt-wp-i18n' );

	// Register tasks
	grunt.registerTask( 'js', [
		'jshint',
		'browserify:dist',
		'uglify',
	]);

	grunt.registerTask( 'css', [
		'sass',
		'postcss',
		'cssmin',
	]);

	grunt.registerTask( 'i18n', [
		'checktextdomain',
		'makepot',
	]);

	grunt.registerTask( 'build', [
		'js',
		'css',
	]);

	// Compress task is part of default to work with woorelease
	grunt.registerTask( 'default', [
		'build',
		'compress',
	]);
}; 