var gulp = require('gulp');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');
var rename = require('gulp-rename');
var mocha = require('gulp-mocha');
var babel = require('gulp-babel');
var istanbul = require('gulp-istanbul');

gulp.task('default', function(){
  return gulp.src(['nimbly.js'])
	.pipe(useref())
	// Minifies only if it's a JavaScript file
	.pipe(uglify())
	// Add .min to the minified filename
	.pipe(rename({ suffix: '.min' }))
	// Write it to the current directory
	.pipe(gulp.dest('./'))
});

gulp.task('test', function(done) {
	gulp.src(['test/suite/test.js'])
	.pipe(mocha({compilers:babel, exit: true}))
	.once('error', err => {
		process.exit(1);
		done();
	})
	done();
});